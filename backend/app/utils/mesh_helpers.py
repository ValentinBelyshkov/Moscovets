"""
Вспомогательные функции для работы с 3D мешами
"""
import logging
import trimesh
from typing import Optional

logger = logging.getLogger(__name__)


def process_mesh_or_scene(mesh_data) -> Optional[trimesh.Trimesh]:
    """
    Обрабатывает загруженный меш или сцену и возвращает единый меш
    
    Args:
        mesh_data: Загруженные данные из trimesh.load()
        
    Returns:
        Обработанный меш или None
    """
    if hasattr(mesh_data, 'geometry'):
        geometry_count = len(mesh_data.geometry)
        logger.info(f"Загружена сцена с {geometry_count} геометриями")
        
        if geometry_count > 1:
            logger.debug(f"Конкатенация {geometry_count} мешей")
            combined_mesh = trimesh.util.concatenate([
                mesh_data.geometry[name] for name in mesh_data.geometry
            ])
            logger.info("Геометрии объединены в один меш")
            return combined_mesh
        elif geometry_count == 1:
            logger.debug("Используется единственный меш из сцены")
            return list(mesh_data.geometry.values())[0]
        else:
            logger.warning("Сцена не содержит геометрий")
            return None
    else:
        logger.info("Загружен объект типа 'меш'")
        return mesh_data
