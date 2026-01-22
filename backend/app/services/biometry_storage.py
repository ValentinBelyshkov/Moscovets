"""In-memory state store with simple helpers for biometry."""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from threading import Lock
from typing import Dict, List, Optional

# Настройка логирования для сервиса хранения биометрии
logger = logging.getLogger(__name__)


@dataclass
class BiometryState:
    """Holds uploaded model metadata and synchronized points."""

    last_uploaded_path: Optional[str] = None
    model_points: Dict[int, dict] = field(default_factory=dict)
    map_points: Dict[int, dict] = field(default_factory=dict)
    pairs: Dict[int, dict] = field(default_factory=dict)
    _model_seq: int = 0
    _map_seq: int = 0
    _pair_seq: int = 0
    _lock: Lock = field(default_factory=Lock, repr=False)

    def reset_points(self) -> None:
        """
        Сброс всех точек биометрии и пар.
        """
        start_time = time.time()
        logger.info("Начало сброса всех точек биометрии и пар")
        
        with self._lock:
            model_count = len(self.model_points)
            map_count = len(self.map_points)
            pair_count = len(self.pairs)
            
            # Логируем состояние перед сбросом
            logger.debug(f"Состояние перед сбросом: {model_count} точек модели, {map_count} точек карты, {pair_count} пар")
            
            self.model_points.clear()
            self.map_points.clear()
            self.pairs.clear()
            self._model_seq = 0
            self._map_seq = 0
            self._pair_seq = 0
            
            execution_time = time.time() - start_time
            logger.info(f"Сброс завершен за {execution_time:.3f} секунд: очищено {model_count} точек модели, {map_count} точек карты, {pair_count} пар")

    def add_model_point(self, data: dict) -> dict:
        """
        Добавление точки модели.
        
        Args:
            data: Словарь с координатами точки {'x': float, 'y': float, 'z': float}
            
        Returns:
            Словарь с добавленной точкой, включая уникальный ID
        """
        start_time = time.time()
        logger.debug(f"Начало добавления точки модели с координатами: {data}")
        
        with self._lock:
            self._model_seq += 1
            point = {"id": self._model_seq, **data}
            self.model_points[point["id"]] = point
            
            execution_time = time.time() - start_time
            logger.info(f"Точка модели {point['id']} успешно добавлена за {execution_time:.3f} секунд: x={data.get('x')}, y={data.get('y')}, z={data.get('z')}")
            
            # Логируем общее количество точек
            logger.debug(f"Общее количество точек модели: {len(self.model_points)}")
            
            return point

    def add_map_point(self, data: dict) -> dict:
        """
        Добавление точки карты.
        
        Args:
            data: Словарь с координатами точки {'lat': float, 'lng': float}
            
        Returns:
            Словарь с добавленной точкой, включая уникальный ID
        """
        start_time = time.time()
        logger.debug(f"Начало добавления точки карты с координатами: {data}")
        
        with self._lock:
            self._map_seq += 1
            point = {"id": self._map_seq, **data}
            self.map_points[point["id"]] = point
            
            execution_time = time.time() - start_time
            logger.info(f"Точка карты {point['id']} успешно добавлена за {execution_time:.3f} секунд: lat={data.get('lat')}, lng={data.get('lng')}")
            
            # Логируем общее количество точек
            logger.debug(f"Общее количество точек карты: {len(self.map_points)}")
            
            return point

    def add_pair(self, model_id: int, map_id: int) -> dict:
        """
        Создание пары между точкой модели и точкой карты.
        
        Args:
            model_id: ID точки модели
            map_id: ID точки карты
            
        Returns:
            Словарь с созданной парой
            
        Raises:
            KeyError: Если одна из точек не существует
        """
        start_time = time.time()
        logger.info(f"Начало создания пары: модель {model_id} -> карта {map_id}")
        
        with self._lock:
            # Проверяем существование точек
            if model_id not in self.model_points:
                logger.warning(f"Попытка соединения несуществующей точки модели: {model_id}")
                logger.debug(f"Доступные точки модели: {list(self.model_points.keys())}")
                raise KeyError("model_id missing")
                
            if map_id not in self.map_points:
                logger.warning(f"Попытка соединения несуществующей точки карты: {map_id}")
                logger.debug(f"Доступные точки карты: {list(self.map_points.keys())}")
                raise KeyError("map_id missing")
            
            # Проверяем на дубликаты
            for existing in self.pairs.values():
                if (
                    existing["model_id"] == model_id
                    and existing["map_id"] == map_id
                ):
                    execution_time = time.time() - start_time
                    logger.warning(f"Обнаружена дублирующая пара: модель {model_id} с картой {map_id}, возвращаем существующую за {execution_time:.3f} секунд")
                    return existing
            
            # Создаем новую пару
            self._pair_seq += 1
            pair = {"id": self._pair_seq, "model_id": model_id, "map_id": map_id}
            self.pairs[pair["id"]] = pair
            
            execution_time = time.time() - start_time
            logger.info(f"Новая пара {pair['id']} успешно создана за {execution_time:.3f} секунд: точка модели {model_id} -> точка карты {map_id}")
            
            # Логируем общее количество пар
            logger.debug(f"Общее количество пар: {len(self.pairs)}")
            
            return pair

    def set_uploaded_path(self, path: str) -> None:
        """
        Установка пути загруженной модели.
        
        Args:
            path: Путь к файлу модели
        """
        start_time = time.time()
        logger.info(f"Установка пути загруженной модели: {path}")
        
        with self._lock:
            old_path = self.last_uploaded_path
            self.last_uploaded_path = path
            
            execution_time = time.time() - start_time
            logger.debug(f"Путь модели успешно обновлен за {execution_time:.3f} секунд")
            logger.debug(f"Старый путь: {old_path}, новый путь: {path}")

    def clear_pair(self, pair_id: int) -> bool:
        """
        Удаление пары по ID.
        
        Args:
            pair_id: ID пары для удаления
            
        Returns:
            True если пара была удалена, False если не найдена
        """
        start_time = time.time()
        logger.info(f"Начало удаления пары с ID: {pair_id}")
        
        with self._lock:
            pair = self.pairs.pop(pair_id, None)
            if pair is not None:
                execution_time = time.time() - start_time
                logger.info(f"Пара {pair_id} успешно удалена за {execution_time:.3f} секунд: модель {pair['model_id']} -> карта {pair['map_id']}")
                
                # Логируем общее количество пар
                logger.debug(f"Общее количество пар после удаления: {len(self.pairs)}")
                
                return True
            else:
                execution_time = time.time() - start_time
                logger.warning(f"Попытка удаления несуществующей пары: {pair_id}, операция заняла {execution_time:.3f} секунд")
                return False

    def get_model_points(self) -> List[dict]:
        """
        Получение всех точек модели.
        
        Returns:
            Список всех точек модели
        """
        with self._lock:
            points = list(self.model_points.values())
            logger.debug(f"Получено {len(points)} точек модели")
            return points

    def get_map_points(self) -> List[dict]:
        """
        Получение всех точек карты.
        
        Returns:
            Список всех точек карты
        """
        with self._lock:
            points = list(self.map_points.values())
            logger.debug(f"Получено {len(points)} точек карты")
            return points

    def get_pairs(self) -> List[dict]:
        """
        Получение всех пар.
        
        Returns:
            Список всех пар
        """
        with self._lock:
            pairs = list(self.pairs.values())
            logger.debug(f"Получено {len(pairs)} пар")
            return pairs

    def get_last_uploaded_path(self) -> Optional[str]:
        """
        Получение пути последней загруженной модели.
        
        Returns:
            Путь к модели или None
        """
        with self._lock:
            logger.debug(f"Получение пути загруженной модели: {self.last_uploaded_path}")
            return self.last_uploaded_path

    def get_statistics(self) -> dict:
        """
        Получение статистики по хранилищу.
        
        Returns:
            Словарь со статистикой
        """
        with self._lock:
            stats = {
                'model_points_count': len(self.model_points),
                'map_points_count': len(self.map_points),
                'pairs_count': len(self.pairs),
                'last_uploaded_path': self.last_uploaded_path,
                'model_seq': self._model_seq,
                'map_seq': self._map_seq,
                'pair_seq': self._pair_seq
            }
            logger.debug(f"Статистика хранилища: {stats}")
            return stats