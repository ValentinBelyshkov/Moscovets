import os
import tempfile
import numpy as np
import trimesh
from typing import Dict, Any, Tuple, Optional, List
from pathlib import Path
import logging
import time

from app.utils.file_helpers import calculate_file_hash
from app.utils.mesh_helpers import process_mesh_or_scene
from app.services.mesh_operations import find_contact_surface, extrude_surface, perform_boolean_operation

logger = logging.getLogger(__name__)


class AssimpService:
    """Сервис для работы с 3D моделями с использованием Assimp"""
    
    def __init__(self):
        self.temp_dir = tempfile.gettempdir()
    
    def load_model(self, file_path: str) -> Dict[str, Any]:
        """
        Загрузка 3D модели и извлечение метаданных
        
        Args:
            file_path: Путь к файлу 3D модели
            
        Returns:
            Словарь с метаданными модели
        """
        start_time = time.time()
        logger.info(f"Начало загрузки 3D модели: {file_path}")
        
        if not os.path.exists(file_path):
            logger.error(f"Файл модели не существует: {file_path}")
            raise FileNotFoundError(f"Model file not found: {file_path}")
        
        file_size = os.path.getsize(file_path)
        file_hash = calculate_file_hash(file_path)
        logger.debug(f"Информация о файле: размер={file_size} байт, хэш={file_hash}")
        
        try:
            logger.debug(f"Загрузка меша с помощью trimesh: {file_path}")
            mesh_data = trimesh.load(file_path)
            mesh = process_mesh_or_scene(mesh_data)
            
            if mesh is None:
                raise Exception("Не удалось обработать меш")
            
            metadata = self._extract_metadata(mesh, file_path, file_size, file_hash)
            
            execution_time = time.time() - start_time
            self._log_metadata(metadata, execution_time, file_path)
            
            return metadata
            
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Ошибка загрузки модели {file_path} за {execution_time:.3f} секунд: {str(e)}")
            raise Exception(f"Failed to load 3D model: {str(e)}")
    
    def _extract_metadata(self, mesh, file_path: str, file_size: int, file_hash: str) -> Dict[str, Any]:
        """Извлекает метаданные из меша"""
        logger.debug("Вычисление метаданных меша")
        
        metadata = {
            'vertices_count': len(mesh.vertices) if hasattr(mesh, 'vertices') else 0,
            'faces_count': len(mesh.faces) if hasattr(mesh, 'faces') else 0,
            'bounding_box': self._calculate_bounding_box(mesh),
            'volume': mesh.volume if hasattr(mesh, 'volume') and mesh.is_watertight else None,
            'surface_area': mesh.area if hasattr(mesh, 'area') else None,
            'is_watertight': mesh.is_watertight if hasattr(mesh, 'is_watertight') else None,
            'center_of_mass': mesh.center_mass.tolist() if hasattr(mesh, 'center_mass') else None,
            'file_info': {
                'path': file_path,
                'size': file_size,
                'hash': file_hash
            }
        }
        
        logger.debug("Анализ дефектов модели")
        defects = self._analyze_defects(mesh)
        metadata['defects'] = defects
        
        return metadata
    
    def _log_metadata(self, metadata: Dict[str, Any], execution_time: float, file_path: str) -> None:
        """Логирует метаданные модели"""
        logger.info(f"Модель успешно загружена за {execution_time:.3f} секунд: {file_path}")
        logger.info(f"  - Вершины: {metadata['vertices_count']}")
        logger.info(f"  - Грани: {metadata['faces_count']}")
        logger.info(f"  - Объем: {metadata['volume']}")
        logger.info(f"  - Площадь поверхности: {metadata['surface_area']}")
        logger.info(f"  - Водонепроницаемость: {metadata['is_watertight']}")
        logger.info(f"  - Дефекты: {len(metadata['defects'])}")
    
    def _calculate_bounding_box(self, mesh) -> Dict[str, List[float]]:
        """Вычисление ограничивающей коробки"""
        logger.debug("Вычисление ограничивающей коробки")
        if hasattr(mesh, 'bounds') and mesh.bounds is not None:
            min_bounds, max_bounds = mesh.bounds
            bbox = {
                'min': min_bounds.tolist(),
                'max': max_bounds.tolist(),
                'size': (max_bounds - min_bounds).tolist()
            }
            logger.debug(f"Ограничивающая коробка вычислена: {bbox}")
            return bbox
        logger.warning("Не удалось вычислить ограничивающую коробку, возвращаем значения по умолчанию")
        return {'min': [0, 0, 0], 'max': [0, 0, 0], 'size': [0, 0, 0]}
    
    def _analyze_defects(self, mesh) -> List[str]:
        """Анализ дефектов модели"""
        logger.debug("Начало анализа дефектов")
        defects = []
        
        try:
            if hasattr(mesh, 'is_watertight') and not mesh.is_watertight:
                defects.append("Model is not watertight (has holes)")
                logger.warning("Модель не является водонепроницаемой")
            
            if hasattr(mesh, 'faces') and hasattr(mesh, 'vertices'):
                degenerate_count = self._count_degenerate_triangles(mesh)
                if degenerate_count > 0:
                    defects.append(f"Found {degenerate_count} degenerate triangles")
                    logger.warning(f"Найдено {degenerate_count} вырожденных треугольников")
            
            if hasattr(mesh, 'face_normals'):
                invalid_normals = np.isnan(mesh.face_normals).any()
                if invalid_normals:
                    defects.append("Model has invalid face normals")
                    logger.warning("Модель имеет недействительные нормали граней")
            
        except Exception as e:
            logger.warning(f"Ошибка анализа дефектов: {str(e)}")
            defects.append(f"Ошибка во время анализа дефектов: {str(e)}")
        
        logger.debug(f"Анализ дефектов завершен: найдено {len(defects)} дефектов")
        return defects
    
    def _count_degenerate_triangles(self, mesh) -> int:
        """Подсчитывает вырожденные треугольники"""
        logger.debug("Проверка на вырожденные треугольники")
        degenerate_count = 0
        
        for face in mesh.faces:
            if len(face) == 3:
                v1, v2, v3 = mesh.vertices[face[0]], mesh.vertices[face[1]], mesh.vertices[face[2]]
                area = 0.5 * np.linalg.norm(np.cross(v2 - v1, v3 - v1))
                if area < 1e-10:
                    degenerate_count += 1
        
        return degenerate_count
    
    def convert_format(self, input_path: str, output_path: str, target_format: str) -> bool:
        """
        Конвертация 3D модели в другой формат
        
        Args:
            input_path: Путь к исходному файлу
            output_path: Путь для сохранения конвертированного файла
            target_format: Целевой формат ('stl', 'obj')
            
        Returns:
            True если конвертация успешна
        """
        start_time = time.time()
        logger.info(f"Начало конвертации модели: {input_path} -> {output_path} ({target_format})")
        
        if not os.path.exists(input_path):
            logger.error(f"Входной файл не существует: {input_path}")
            return False
        
        supported_formats = ['stl', 'obj']
        if target_format.lower() not in supported_formats:
            logger.error(f"Неподдерживаемый целевой формат: {target_format}")
            return False
        
        try:
            logger.debug(f"Загрузка исходной модели: {input_path}")
            mesh_data = trimesh.load(input_path)
            mesh = process_mesh_or_scene(mesh_data)
            
            if mesh is None:
                logger.warning("Не удалось обработать меш для конвертации")
                return False
            
            self._save_mesh(mesh, output_path, target_format, input_path, start_time)
            return True
            
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Ошибка конвертации модели {input_path} в {target_format} за {execution_time:.3f} секунд: {str(e)}")
            return False
    
    def _save_mesh(self, mesh, output_path: str, target_format: str, input_path: str, start_time: float) -> None:
        """Сохраняет меш в файл"""
        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)
            logger.debug(f"Создана директория для выходного файла: {output_dir}")
        
        logger.debug(f"Экспорт меша в формат {target_format}")
        mesh.export(output_path)
        
        if os.path.exists(output_path):
            output_size = os.path.getsize(output_path)
            execution_time = time.time() - start_time
            
            logger.info(f"Модель успешно конвертирована за {execution_time:.3f} секунд:")
            logger.info(f"  - Исходный файл: {input_path}")
            logger.info(f"  - Целевой файл: {output_path}")
            logger.info(f"  - Размер выходного файла: {output_size} байт")
            logger.info(f"  - Формат: {target_format}")
        else:
            logger.error(f"Выходной файл не был создан: {output_path}")
            raise Exception("Output file was not created")
    
    def create_occlusion_pad(self, upper_jaw_path: str, lower_jaw_path: str,
                           output_path: str, parameters: Dict[str, Any]) -> bool:
        """
        Создание окклюзионной накладки на основе моделей верхней и нижней челюсти
        
        Args:
            upper_jaw_path: Путь к модели верхней челюсти
            lower_jaw_path: Путь к модели нижней челюсти
            output_path: Путь для сохранения накладки
            parameters: Параметры создания накладки
            
        Returns:
            True если создание успешно
        """
        start_time = time.time()
        logger.info(f"Начало создания окклюзионной накладки: upper={upper_jaw_path}, lower={lower_jaw_path}")
        
        if not os.path.exists(upper_jaw_path):
            logger.error(f"Файл модели верхней челюсти не существует: {upper_jaw_path}")
            return False
        
        if not os.path.exists(lower_jaw_path):
            logger.error(f"Файл модели нижней челюсти не существует: {lower_jaw_path}")
            return False
        
        try:
            upper_jaw = self._load_jaw_mesh(upper_jaw_path, "верхней")
            lower_jaw = self._load_jaw_mesh(lower_jaw_path, "нижней")
            
            if upper_jaw is None or lower_jaw is None:
                return False
            
            pad_mesh = self._create_pad_mesh(upper_jaw, lower_jaw, parameters)
            self._save_occlusion_pad(pad_mesh, output_path, upper_jaw_path, lower_jaw_path, parameters, start_time)
            
            return True
            
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Ошибка создания окклюзионной накладки за {execution_time:.3f} секунд: {str(e)}")
            return False
    
    def _load_jaw_mesh(self, jaw_path: str, jaw_name: str) -> Optional[trimesh.Trimesh]:
        """Загружает и обрабатывает меш челюсти"""
        logger.debug(f"Загрузка модели {jaw_name} челюсти")
        jaw_data = trimesh.load(jaw_path)
        return process_mesh_or_scene(jaw_data)
    
    def _create_pad_mesh(self, upper_jaw, lower_jaw, parameters: Dict[str, Any]) -> trimesh.Trimesh:
        """Создает меш окклюзионной накладки"""
        pad_thickness = parameters.get('pad_thickness', 2.0)
        margin_offset = parameters.get('margin_offset', 0.5)
        cement_gap = parameters.get('cement_gap', 0.1)
        
        logger.info(f"Параметры накладки: thickness={pad_thickness}, margin={margin_offset}, gap={cement_gap}")
        
        logger.debug("Поиск контактной поверхности между челюстями")
        contact_surface = find_contact_surface(upper_jaw, lower_jaw, cement_gap)
        
        if contact_surface is None:
            logger.warning("Контактная поверхность не найдена, используем верхнюю челюсть как основу")
            contact_surface = upper_jaw
        
        logger.debug("Экструзия контактной поверхности для создания накладки")
        return extrude_surface(contact_surface, pad_thickness, margin_offset)
    
    def _save_occlusion_pad(self, pad_mesh, output_path: str, upper_jaw_path: str, 
                           lower_jaw_path: str, parameters: Dict[str, Any], start_time: float) -> None:
        """Сохраняет окклюзионную накладку"""
        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)
            logger.debug(f"Создана директория для выходного файла: {output_dir}")
        
        logger.debug(f"Экспорт окклюзионной накладки в {output_path}")
        pad_mesh.export(output_path)
        
        if os.path.exists(output_path):
            output_size = os.path.getsize(output_path)
            execution_time = time.time() - start_time
            
            logger.info(f"Окклюзионная накладка успешно создана за {execution_time:.3f} секунд:")
            logger.info(f"  - Верхняя челюсть: {upper_jaw_path}")
            logger.info(f"  - Нижняя челюсть: {lower_jaw_path}")
            logger.info(f"  - Выходной файл: {output_path}")
            logger.info(f"  - Размер накладки: {output_size} байт")
            logger.info(f"  - Толщина: {parameters.get('pad_thickness')}")
            logger.info(f"  - Отступ края: {parameters.get('margin_offset')}")
            logger.info(f"  - Цементный зазор: {parameters.get('cement_gap')}")
        else:
            logger.error(f"Выходной файл накладки не был создан: {output_path}")
            raise Exception("Output pad file was not created")
    
    def apply_boolean_operation(self, mesh1_path: str, mesh2_path: str,
                              output_path: str, operation: str) -> bool:
        """
        Применение булевой операции к двум моделям
        
        Args:
            mesh1_path: Путь к первой модели
            mesh2_path: Путь ко второй модели
            output_path: Путь для сохранения результата
            operation: Тип операции ('union', 'difference', 'intersection')
            
        Returns:
            True если операция успешна
        """
        start_time = time.time()
        logger.info(f"Начало булевой операции {operation}: {mesh1_path} + {mesh2_path} -> {output_path}")
        
        if not os.path.exists(mesh1_path):
            logger.error(f"Первый файл модели не существует: {mesh1_path}")
            return False
        
        if not os.path.exists(mesh2_path):
            logger.error(f"Второй файл модели не существует: {mesh2_path}")
            return False
        
        supported_operations = ['union', 'difference', 'intersection']
        if operation not in supported_operations:
            logger.error(f"Неподдерживаемая булева операция: {operation}")
            return False
        
        try:
            mesh1 = self._load_mesh_for_boolean(mesh1_path, "первой")
            mesh2 = self._load_mesh_for_boolean(mesh2_path, "второй")
            
            if mesh1 is None or mesh2 is None:
                return False
            
            result = perform_boolean_operation(mesh1, mesh2, operation)
            self._save_boolean_result(result, output_path, operation, mesh1_path, mesh2_path, start_time)
            
            return True
            
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Ошибка применения булевой операции {operation} за {execution_time:.3f} секунд: {str(e)}")
            return False
    
    def _load_mesh_for_boolean(self, mesh_path: str, mesh_name: str) -> Optional[trimesh.Trimesh]:
        """Загружает меш для булевой операции"""
        logger.debug(f"Загрузка {mesh_name} модели: {mesh_path}")
        mesh_data = trimesh.load(mesh_path)
        return process_mesh_or_scene(mesh_data)
    
    def _save_boolean_result(self, result, output_path: str, operation: str,
                            mesh1_path: str, mesh2_path: str, start_time: float) -> None:
        """Сохраняет результат булевой операции"""
        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)
            logger.debug(f"Создана директория для выходного файла: {output_dir}")
        
        logger.debug(f"Экспорт результата булевой операции в {output_path}")
        result.export(output_path)
        
        if os.path.exists(output_path):
            output_size = os.path.getsize(output_path)
            execution_time = time.time() - start_time
            
            logger.info(f"Булева операция {operation} успешно завершена за {execution_time:.3f} секунд:")
            logger.info(f"  - Операция: {operation}")
            logger.info(f"  - Первая модель: {mesh1_path}")
            logger.info(f"  - Вторая модель: {mesh2_path}")
            logger.info(f"  - Выходной файл: {output_path}")
            logger.info(f"  - Размер результата: {output_size} байт")
        else:
            logger.error(f"Выходной файл булевой операции не был создан: {output_path}")
            raise Exception("Boolean operation output file was not created")


assimp_service = AssimpService()
