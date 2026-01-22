import os
import tempfile
import numpy as np
import trimesh
# import pyassimp
from typing import Dict, Any, Tuple, Optional, List
from pathlib import Path
import logging
import time
import hashlib

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
        
        # Проверяем существование файла
        if not os.path.exists(file_path):
            logger.error(f"Файл модели не существует: {file_path}")
            raise FileNotFoundError(f"Model file not found: {file_path}")
        
        # Получаем информацию о файле
        file_size = os.path.getsize(file_path)
        file_hash = self._calculate_file_hash(file_path)
        logger.debug(f"Информация о файле: размер={file_size} байт, хэш={file_hash}")
        
        try:
            # Используем trimesh для быстрой загрузки и анализа
            logger.debug(f"Загрузка меша с помощью trimesh: {file_path}")
            mesh = trimesh.load(file_path)
            
            # Анализируем тип загруженного объекта
            if hasattr(mesh, 'geometry'):
                geometry_count = len(mesh.geometry)
                logger.info(f"Загружен объект типа 'сцена' с {geometry_count} геометриями")
                
                if geometry_count > 1:
                    logger.debug(f"Обнаружена сцена с {geometry_count} мешами, выполняется конкатенация...")
                    # Объединяем все меши в один
                    combined_mesh = trimesh.util.concatenate([mesh.geometry[name] for name in mesh.geometry])
                    mesh = combined_mesh
                    logger.info(f"Геометрии объединены в один меш")
                elif geometry_count == 1:
                    logger.debug("Обнаружен одиночный меш в сцене")
                    # Получаем единственный меш
                    mesh = list(mesh.geometry.values())[0]
                else:
                    logger.warning("Сцена не содержит геометрий")
            else:
                logger.info("Загружен объект типа 'меш'")
            
            # Вычисляем метаданные
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
            
            # Проверяем на дефекты
            logger.debug("Анализ дефектов модели")
            defects = self._analyze_defects(mesh)
            metadata['defects'] = defects
            
            execution_time = time.time() - start_time
            logger.info(f"Модель успешно загружена за {execution_time:.3f} секунд: {file_path}")
            logger.info(f"  - Вершины: {metadata['vertices_count']}")
            logger.info(f"  - Грани: {metadata['faces_count']}")
            logger.info(f"  - Объем: {metadata['volume']}")
            logger.info(f"  - Площадь поверхности: {metadata['surface_area']}")
            logger.info(f"  - Водонепроницаемость: {metadata['is_watertight']}")
            logger.info(f"  - Дефекты: {len(defects)}")
            
            return metadata
            
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Ошибка загрузки модели {file_path} за {execution_time:.3f} секунд: {str(e)}")
            raise Exception(f"Failed to load 3D model: {str(e)}")
    
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
            # Проверка на водонепроницаемость
            if hasattr(mesh, 'is_watertight') and not mesh.is_watertight:
                defects.append("Model is not watertight (has holes)")
                logger.warning("Модель не является водонепроницаемой")
            
            # Проверка на вырожденные треугольники
            if hasattr(mesh, 'faces') and hasattr(mesh, 'vertices'):
                degenerate_count = 0
                logger.debug("Проверка на вырожденные треугольники")
                for face in mesh.faces:
                    if len(face) == 3:
                        v1, v2, v3 = mesh.vertices[face[0]], mesh.vertices[face[1]], mesh.vertices[face[2]]
                        # Проверяем площадь треугольника
                        area = 0.5 * np.linalg.norm(np.cross(v2 - v1, v3 - v1))
                        if area < 1e-10:  # Очень маленькая площадь
                            degenerate_count += 1
                
                if degenerate_count > 0:
                    defects.append(f"Found {degenerate_count} degenerate triangles")
                    logger.warning(f"Найдено {degenerate_count} вырожденных треугольников")
            
            # Проверка на нормали
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
        
        # Проверяем существование входного файла
        if not os.path.exists(input_path):
            logger.error(f"Входной файл не существует: {input_path}")
            return False
        
        try:
            # Загружаем исходную модель
            logger.debug(f"Загрузка исходной модели: {input_path}")
            mesh = trimesh.load(input_path)
            
            # Анализируем тип загруженного объекта
            if hasattr(mesh, 'geometry'):
                geometry_count = len(mesh.geometry)
                logger.info(f"Загружена сцена с {geometry_count} геометриями")
                
                if geometry_count > 1:
                    logger.debug(f"Конкатенация {geometry_count} мешей для конвертации")
                    combined_mesh = trimesh.util.concatenate([mesh.geometry[name] for name in mesh.geometry])
                    mesh = combined_mesh
                    logger.info(f"Геометрии объединены в один меш для конвертации")
                elif geometry_count == 1:
                    mesh = list(mesh.geometry.values())[0]
                    logger.debug("Используется единственный меш из сцены")
                else:
                    logger.warning("Сцена не содержит геометрий для конвертации")
                    return False
            else:
                logger.info("Загружен меш для конвертации")
            
            # Проверяем поддерживаемость формата
            supported_formats = ['stl', 'obj']
            if target_format.lower() not in supported_formats:
                logger.error(f"Неподдерживаемый целевой формат: {target_format}")
                raise ValueError(f"Unsupported target format: {target_format}")
            
            # Создаем директорию для выходного файла при необходимости
            output_dir = os.path.dirname(output_path)
            if output_dir and not os.path.exists(output_dir):
                os.makedirs(output_dir)
                logger.debug(f"Создана директория для выходного файла: {output_dir}")
            
            # Экспорт в целевой формат
            logger.debug(f"Экспорт меша в формат {target_format}")
            mesh.export(output_path)
            
            # Проверяем успешность создания выходного файла
            if os.path.exists(output_path):
                output_size = os.path.getsize(output_path)
                execution_time = time.time() - start_time
                
                logger.info(f"Модель успешно конвертирована за {execution_time:.3f} секунд:")
                logger.info(f"  - Исходный файл: {input_path}")
                logger.info(f"  - Целевой файл: {output_path}")
                logger.info(f"  - Размер выходного файла: {output_size} байт")
                logger.info(f"  - Формат: {target_format}")
                
                return True
            else:
                logger.error(f"Выходной файл не был создан: {output_path}")
                return False
            
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Ошибка конвертации модели {input_path} в {target_format} за {execution_time:.3f} секунд: {str(e)}")
            return False
    
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
        logger.info(f"Начало создания окклюзионной накладки: upper={upper_jaw_path}, lower={lower_jaw_path}, output={output_path}")
        
        # Проверяем существование входных файлов
        if not os.path.exists(upper_jaw_path):
            logger.error(f"Файл модели верхней челюсти не существует: {upper_jaw_path}")
            return False
        
        if not os.path.exists(lower_jaw_path):
            logger.error(f"Файл модели нижней челюсти не существует: {lower_jaw_path}")
            return False
        
        try:
            # Загружаем модели
            logger.debug("Загрузка модели верхней челюсти")
            upper_jaw = trimesh.load(upper_jaw_path)
            logger.debug("Загрузка модели нижней челюсти")
            lower_jaw = trimesh.load(lower_jaw_path)
            
            # Обработка сцен с несколькими мешами
            if hasattr(upper_jaw, 'geometry') and len(upper_jaw.geometry) > 0:
                geometry_count = len(upper_jaw.geometry)
                logger.info(f"Верхняя челюсть: загружена сцена с {geometry_count} геометриями")
                
                if len(upper_jaw.geometry) == 1:
                    upper_jaw = list(upper_jaw.geometry.values())[0]
                    logger.debug("Используется единственный меш из сцены верхней челюсти")
                else:
                    logger.debug(f"Конкатенация {len(upper_jaw.geometry)} мешей для верхней челюсти")
                    upper_jaw = trimesh.util.concatenate([upper_jaw.geometry[name] for name in upper_jaw.geometry])
                    logger.info("Геометрии верхней челюсти объединены")
            
            if hasattr(lower_jaw, 'geometry') and len(lower_jaw.geometry) > 0:
                geometry_count = len(lower_jaw.geometry)
                logger.info(f"Нижняя челюсть: загружена сцена с {geometry_count} геометриями")
                
                if len(lower_jaw.geometry) == 1:
                    lower_jaw = list(lower_jaw.geometry.values())[0]
                    logger.debug("Используется единственный меш из сцены нижней челюсти")
                else:
                    logger.debug(f"Конкатенация {len(lower_jaw.geometry)} мешей для нижней челюсти")
                    lower_jaw = trimesh.util.concatenate([lower_jaw.geometry[name] for name in lower_jaw.geometry])
                    logger.info("Геометрии нижней челюсти объединены")
            
            # Извлекаем параметры
            pad_thickness = parameters.get('pad_thickness', 2.0)
            margin_offset = parameters.get('margin_offset', 0.5)
            cement_gap = parameters.get('cement_gap', 0.1)
            
            logger.info(f"Параметры накладки: thickness={pad_thickness}, margin={margin_offset}, gap={cement_gap}")
            
            # Находим контактные поверхности между челюстями
            logger.debug("Поиск контактной поверхности между челюстями")
            contact_surface = self._find_contact_surface(upper_jaw, lower_jaw, cement_gap)
            
            if contact_surface is None:
                logger.warning("Контактная поверхность не найдена, используем верхнюю челюсть как основу")
                # Если не нашли контактную поверхность, используем верхнюю челюсть как основу
                contact_surface = upper_jaw
            
            # Создаем накладку путем экструзии контактной поверхности
            logger.debug("Экструзия контактной поверхности для создания накладки")
            pad_mesh = self._extrude_surface(contact_surface, pad_thickness, margin_offset)
            
            # Создаем директорию для выходного файла при необходимости
            output_dir = os.path.dirname(output_path)
            if output_dir and not os.path.exists(output_dir):
                os.makedirs(output_dir)
                logger.debug(f"Создана директория для выходного файла: {output_dir}")
            
            # Сохраняем результат
            logger.debug(f"Экспорт окклюзионной накладки в {output_path}")
            pad_mesh.export(output_path)
            
            # Проверяем успешность создания выходного файла
            if os.path.exists(output_path):
                output_size = os.path.getsize(output_path)
                execution_time = time.time() - start_time
                
                logger.info(f"Окклюзионная накладка успешно создана за {execution_time:.3f} секунд:")
                logger.info(f"  - Верхняя челюсть: {upper_jaw_path}")
                logger.info(f"  - Нижняя челюсть: {lower_jaw_path}")
                logger.info(f"  - Выходной файл: {output_path}")
                logger.info(f"  - Размер накладки: {output_size} байт")
                logger.info(f"  - Толщина: {pad_thickness}")
                logger.info(f"  - Отступ края: {margin_offset}")
                logger.info(f"  - Цементный зазор: {cement_gap}")
                
                return True
            else:
                logger.error(f"Выходной файл накладки не был создан: {output_path}")
                return False
            
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Ошибка создания окклюзионной накладки за {execution_time:.3f} секунд: {str(e)}")
            return False
    
    def _find_contact_surface(self, upper_jaw, lower_jaw, cement_gap: float) -> Optional[trimesh.Trimesh]:
        """Поиск контактной поверхности между челюстями"""
        logger.debug("Поиск контактной поверхности между верхней и нижней челюстью")
        
        try:
            # Упрощенный алгоритм поиска контактной поверхности
            # В реальной реализации здесь должна быть более сложная логика
            
            # Находим ближайшие точки между моделями
            logger.debug("Вычисление ближайших точек между челюстями")
            closest_points = upper_jaw.nearest.on_surface(lower_jaw.vertices)
            
            if closest_points is None or len(closest_points) == 0:
                logger.warning("Ближайшие точки между челюстями не найдены")
                return None
            
            distances, face_indices, _ = closest_points
            
            # Фильтруем точки в пределах цементного зазора
            contact_mask = distances < cement_gap
            
            if not np.any(contact_mask):
                logger.debug("Нет точек в пределах цементного зазора, используем 10% ближайших точек")
                # Если нет точек в пределах зазора, используем все ближайшие точки
                contact_mask = distances < np.percentile(distances, 10)  # 10% ближайших точек
            
            if not np.any(contact_mask):
                logger.warning("Контактные точки не найдены")
                return None
            
            # Создаем контактную поверхность из выбранных граней
            contact_faces = upper_jaw.faces[face_indices[contact_mask]]
            
            # Создаем новый меш из контактных граней
            if len(contact_faces) > 0:
                logger.debug(f"Создание контактной поверхности с {len(contact_faces)} гранями")
                # Упрощенная реализация - в реальности нужно более сложное построение
                contact_vertices = upper_jaw.vertices[contact_faces.flatten()]
                contact_mesh = trimesh.Trimesh(vertices=contact_vertices)
                
                return contact_mesh
            
            logger.warning("Создание контактной поверхности не удалось - грани не найдены")
            return None
            
        except Exception as e:
            logger.warning(f"Ошибка поиска контактной поверхности: {str(e)}")
            return None
    
    def _extrude_surface(self, surface: trimesh.Trimesh, thickness: float, margin_offset: float) -> trimesh.Trimesh:
        """Экструзия поверхности для создания накладки"""
        logger.debug(f"Экструзия поверхности: thickness={thickness}, margin={margin_offset}")
        
        try:
            # Упрощенная реализация экструзии
            # В реальной реализации здесь должна быть более сложная логика
            
            # Создаем смещенную поверхность
            logger.debug("Создание смещенной поверхности")
            offset_surface = surface.offset(margin_offset)
            
            # Экструдируем поверхность
            if hasattr(surface, 'extrude'):
                logger.debug("Использование встроенного метода экструзии")
                extruded = surface.extrude(thickness)
            else:
                # Альтернативный метод экструзии
                logger.debug("Использование пользовательского метода экструзии")
                # Создаем копию поверхности и смещаем ее
                vertices_copy = surface.vertices.copy()
                vertices_copy[:, 2] += thickness  # Смещаем по Z
                
                # Создаем боковые грани
                side_faces = []
                logger.debug("Создание боковых граней")
                for i in range(len(surface.faces)):
                    face = surface.faces[i]
                    # Создаем боковые грани для каждого ребра
                    for j in range(len(face)):
                        v1 = face[j]
                        v2 = face[(j + 1) % len(face)]
                        v3 = v1 + len(surface.vertices)
                        v4 = v2 + len(surface.vertices)
                        side_faces.append([v1, v2, v3])
                        side_faces.append([v2, v4, v3])
                
                # Объединяем вершины и грани
                logger.debug("Объединение вершин и граней")
                all_vertices = np.vstack([surface.vertices, vertices_copy])
                all_faces = np.vstack([surface.faces, side_faces])
                
                extruded = trimesh.Trimesh(vertices=all_vertices, faces=all_faces)
            
            logger.debug("Экструзия поверхности завершена")
            return extruded
            
        except Exception as e:
            logger.warning(f"Ошибка экструзии поверхности: {str(e)}")
            # Возвращаем исходную поверхность как запасной вариант
            return surface
    
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
        
        # Проверяем существование входных файлов
        if not os.path.exists(mesh1_path):
            logger.error(f"Первый файл модели не существует: {mesh1_path}")
            return False
        
        if not os.path.exists(mesh2_path):
            logger.error(f"Второй файл модели не существует: {mesh2_path}")
            return False
        
        # Проверяем поддерживаемость операции
        supported_operations = ['union', 'difference', 'intersection']
        if operation not in supported_operations:
            logger.error(f"Неподдерживаемая булева операция: {operation}")
            raise ValueError(f"Unsupported boolean operation: {operation}")
        
        try:
            # Загружаем модели
            logger.debug(f"Загрузка первой модели: {mesh1_path}")
            mesh1 = trimesh.load(mesh1_path)
            logger.debug(f"Загрузка второй модели: {mesh2_path}")
            mesh2 = trimesh.load(mesh2_path)
            
            # Обработка сцен с несколькими мешами
            if hasattr(mesh1, 'geometry') and len(mesh1.geometry) > 0:
                geometry_count = len(mesh1.geometry)
                logger.info(f"Первая модель: загружена сцена с {geometry_count} геометриями")
                
                if len(mesh1.geometry) == 1:
                    mesh1 = list(mesh1.geometry.values())[0]
                    logger.debug("Используется единственный меш из сцены первой модели")
                else:
                    mesh1 = trimesh.util.concatenate([mesh1.geometry[name] for name in mesh1.geometry])
                    logger.info("Геометрии первой модели объединены")
            
            if hasattr(mesh2, 'geometry') and len(mesh2.geometry) > 0:
                geometry_count = len(mesh2.geometry)
                logger.info(f"Вторая модель: загружена сцена с {geometry_count} геометриями")
                
                if len(mesh2.geometry) == 1:
                    mesh2 = list(mesh2.geometry.values())[0]
                    logger.debug("Используется единственный меш из сцены второй модели")
                else:
                    mesh2 = trimesh.util.concatenate([mesh2.geometry[name] for name in mesh2.geometry])
                    logger.info("Геометрии второй модели объединены")
            
            # Применяем булеву операцию
            logger.debug(f"Выполнение булевой операции: {operation}")
            if operation == 'union':
                result = mesh1.union(mesh2)
            elif operation == 'difference':
                result = mesh1.difference(mesh2)
            elif operation == 'intersection':
                result = mesh1.intersection(mesh2)
            
            # Создаем директорию для выходного файла при необходимости
            output_dir = os.path.dirname(output_path)
            if output_dir and not os.path.exists(output_dir):
                os.makedirs(output_dir)
                logger.debug(f"Создана директория для выходного файла: {output_dir}")
            
            # Сохраняем результат
            logger.debug(f"Экспорт результата булевой операции в {output_path}")
            result.export(output_path)
            
            # Проверяем успешность создания выходного файла
            if os.path.exists(output_path):
                output_size = os.path.getsize(output_path)
                execution_time = time.time() - start_time
                
                logger.info(f"Булева операция {operation} успешно завершена за {execution_time:.3f} секунд:")
                logger.info(f"  - Операция: {operation}")
                logger.info(f"  - Первая модель: {mesh1_path}")
                logger.info(f"  - Вторая модель: {mesh2_path}")
                logger.info(f"  - Выходной файл: {output_path}")
                logger.info(f"  - Размер результата: {output_size} байт")
                
                return True
            else:
                logger.error(f"Выходной файл булевой операции не был создан: {output_path}")
                return False
            
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Ошибка применения булевой операции {operation} за {execution_time:.3f} секунд: {str(e)}")
            return False

    def _calculate_file_hash(self, file_path: str) -> str:
        """
        Вычисление MD5 хэша файла.
        
        Args:
            file_path: Путь к файлу
            
        Returns:
            MD5 хэш в виде строки
        """
        try:
            with open(file_path, 'rb') as f:
                file_hash = hashlib.md5()
                for chunk in iter(lambda: f.read(4096), b""):
                    file_hash.update(chunk)
            return file_hash.hexdigest()
        except Exception as e:
            logger.warning(f"Не удалось вычислить хэш файла {file_path}: {str(e)}")
            return "unknown"

# Создаем экземпляр сервиса
assimp_service = AssimpService()