"""
Операции с 3D мешами для окклюзионных накладок
"""
import logging
import numpy as np
import trimesh
from typing import Optional

logger = logging.getLogger(__name__)


def find_contact_surface(upper_jaw, lower_jaw, cement_gap: float) -> Optional[trimesh.Trimesh]:
    """
    Поиск контактной поверхности между челюстями
    
    Args:
        upper_jaw: Меш верхней челюсти
        lower_jaw: Меш нижней челюсти
        cement_gap: Цементный зазор
        
    Returns:
        Контактная поверхность или None
    """
    logger.debug("Поиск контактной поверхности между верхней и нижней челюстью")
    
    try:
        logger.debug("Вычисление ближайших точек между челюстями")
        closest_points = upper_jaw.nearest.on_surface(lower_jaw.vertices)
        
        if closest_points is None or len(closest_points) == 0:
            logger.warning("Ближайшие точки между челюстями не найдены")
            return None
        
        distances, face_indices, _ = closest_points
        
        contact_mask = distances < cement_gap
        
        if not np.any(contact_mask):
            logger.debug("Нет точек в пределах цементного зазора, используем 10% ближайших точек")
            contact_mask = distances < np.percentile(distances, 10)
        
        if not np.any(contact_mask):
            logger.warning("Контактные точки не найдены")
            return None
        
        contact_faces = upper_jaw.faces[face_indices[contact_mask]]
        
        if len(contact_faces) > 0:
            logger.debug(f"Создание контактной поверхности с {len(contact_faces)} гранями")
            contact_vertices = upper_jaw.vertices[contact_faces.flatten()]
            contact_mesh = trimesh.Trimesh(vertices=contact_vertices)
            return contact_mesh
        
        logger.warning("Создание контактной поверхности не удалось - грани не найдены")
        return None
        
    except Exception as e:
        logger.warning(f"Ошибка поиска контактной поверхности: {str(e)}")
        return None


def extrude_surface(surface: trimesh.Trimesh, thickness: float, margin_offset: float) -> trimesh.Trimesh:
    """
    Экструзия поверхности для создания накладки
    
    Args:
        surface: Исходная поверхность
        thickness: Толщина экструзии
        margin_offset: Отступ края
        
    Returns:
        Экструдированный меш
    """
    logger.debug(f"Экструзия поверхности: thickness={thickness}, margin={margin_offset}")
    
    try:
        logger.debug("Создание смещенной поверхности")
        offset_surface = surface.offset(margin_offset)
        
        if hasattr(surface, 'extrude'):
            logger.debug("Использование встроенного метода экструзии")
            extruded = surface.extrude(thickness)
        else:
            extruded = manual_extrude(surface, thickness)
        
        logger.debug("Экструзия поверхности завершена")
        return extruded
        
    except Exception as e:
        logger.warning(f"Ошибка экструзии поверхности: {str(e)}")
        return surface


def manual_extrude(surface: trimesh.Trimesh, thickness: float) -> trimesh.Trimesh:
    """
    Ручная экструзия поверхности
    
    Args:
        surface: Исходная поверхность
        thickness: Толщина экструзии
        
    Returns:
        Экструдированный меш
    """
    logger.debug("Использование пользовательского метода экструзии")
    
    vertices_copy = surface.vertices.copy()
    vertices_copy[:, 2] += thickness
    
    side_faces = []
    logger.debug("Создание боковых граней")
    for i in range(len(surface.faces)):
        face = surface.faces[i]
        for j in range(len(face)):
            v1 = face[j]
            v2 = face[(j + 1) % len(face)]
            v3 = v1 + len(surface.vertices)
            v4 = v2 + len(surface.vertices)
            side_faces.append([v1, v2, v3])
            side_faces.append([v2, v4, v3])
    
    logger.debug("Объединение вершин и граней")
    all_vertices = np.vstack([surface.vertices, vertices_copy])
    all_faces = np.vstack([surface.faces, side_faces])
    
    return trimesh.Trimesh(vertices=all_vertices, faces=all_faces)


def perform_boolean_operation(mesh1, mesh2, operation: str) -> trimesh.Trimesh:
    """
    Выполняет булеву операцию над двумя мешами
    
    Args:
        mesh1: Первый меш
        mesh2: Второй меш
        operation: Тип операции ('union', 'difference', 'intersection')
        
    Returns:
        Результат булевой операции
    """
    logger.debug(f"Выполнение булевой операции: {operation}")
    
    if operation == 'union':
        return mesh1.union(mesh2)
    elif operation == 'difference':
        return mesh1.difference(mesh2)
    elif operation == 'intersection':
        return mesh1.intersection(mesh2)
    else:
        raise ValueError(f"Unsupported boolean operation: {operation}")
