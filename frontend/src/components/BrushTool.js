import * as THREE from 'three';
import SculptBase from './SculptBase';

class BrushTool extends SculptBase {
  constructor(main) {
    super(main);
    
    // Основные параметры кисти
    this._operation = 'sculpt'; // 'sculpt', 'smooth', 'inflate', 'pinch', 'flatten', 'remove'
    this._mode = 'add'; // 'add' или 'subtract'
    this._falloffCurve = 2.0;
    
    // История операций
    this._history = [];
    this._historyIndex = -1;
    
    // Временные данные
    this._lastPosition = new THREE.Vector3();
    this._strokePoints = [];
    this._isDrawing = false;
  }
  
  setOperation(operation) {
    this._operation = operation;
    
    // Автоматическая настройка параметров для разных операций
    switch(operation) {
      case 'smooth':
        this._intensity = 0.75;
        this._falloffCurve = 1.5;
        break;
      case 'inflate':
        this._intensity = 0.3;
        this._falloffCurve = 2.0;
        break;
      case 'pinch':
        this._intensity = 0.4;
        this._falloffCurve = 3.0;
        break;
      case 'flatten':
        this._intensity = 0.6;
        this._falloffCurve = 1.0;
        break;
      case 'remove':
        this._intensity = 0.8;
        this._falloffCurve = 2.5;
        break;
      default: // sculpt
        this._intensity = 0.5;
        this._falloffCurve = 2.0;
    }
  }
  
  setMode(mode) {
    this._mode = mode;
  }
  
  setFalloff(curve) {
    this._falloffCurve = curve;
  }
  
  stroke(picking) {
    let iVertsInRadius = picking.getPickedVertices();
    const intensity = this._intensity * this._getTabletPressure();

    if (this._culling) {
      iVertsInRadius = this.getFrontVertices(iVertsInRadius, picking.getEyeDirection());
    }

    // Выполняем операцию в зависимости от типа
    switch(this._operation) {
      case 'smooth':
        this.smooth(iVertsInRadius, intensity, picking);
        break;
      case 'inflate':
        this.inflate(iVertsInRadius, intensity, picking);
        break;
      case 'pinch':
        this.pinch(iVertsInRadius, intensity, picking);
        break;
      case 'flatten':
        this.flatten(iVertsInRadius, intensity, picking);
        break;
      case 'remove':
        this.remove(iVertsInRadius, intensity, picking);
        break;
      default: // sculpt
        this.sculpt(iVertsInRadius, intensity, picking);
    }
  }
  
  sculpt(iVerts, intensity, picking) {
    const mesh = this.getMesh();
    if (!mesh || !mesh.geometry) return;

    const geometry = mesh.geometry;
    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normal?.array;

    const direction = picking.getPickedNormal?.() || new THREE.Vector3(0, 1, 0);
    const modeFactor = this._mode === 'add' ? 1 : -1;

    for (let i = 0; i < iVerts.length; i++) {
      const vertIndex = iVerts[i];
      const idx = vertIndex * 3;

      const vx = positions[idx];
      const vy = positions[idx + 1];
      const vz = positions[idx + 2];

      // Получаем расстояние от центра кисти для falloff
      const distance = this._calculateDistance(vx, vy, vz, picking);
      const falloff = this._calculateFalloff(distance, this._falloffCurve);

      // Вычисляем силу воздействия
      const influence = intensity * falloff * modeFactor;

      // Применяем смещение вдоль направления кисти
      positions[idx] = vx + direction.x * influence;
      positions[idx + 1] = vy + direction.y * influence;
      positions[idx + 2] = vz + direction.z * influence;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }
  
  inflate(iVerts, intensity, picking) {
    const mesh = this.getMesh();
    if (!mesh || !mesh.geometry) return;

    const geometry = mesh.geometry;
    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normal?.array;

    if (!normals) {
      console.warn('No normals found for inflate operation');
      return;
    }

    const modeFactor = this._mode === 'add' ? 1 : -1;

    for (let i = 0; i < iVerts.length; i++) {
      const vertIndex = iVerts[i];
      const idx = vertIndex * 3;

      const vx = positions[idx];
      const vy = positions[idx + 1];
      const vz = positions[idx + 2];

      const nx = normals[idx];
      const ny = normals[idx + 1];
      const nz = normals[idx + 2];

      // Falloff
      const distance = this._calculateDistance(vx, vy, vz, picking);
      const falloff = this._calculateFalloff(distance, this._falloffCurve);

      const influence = intensity * falloff * modeFactor;

      positions[idx] = vx + nx * influence;
      positions[idx + 1] = vy + ny * influence;
      positions[idx + 2] = vz + nz * influence;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }
  
  pinch(iVerts, intensity, picking) {
    const mesh = this.getMesh();
    if (!mesh || !mesh.geometry) return;

    const geometry = mesh.geometry;
    const positions = geometry.attributes.position.array;

    const center = picking.getIntersectionPoint?.() || new THREE.Vector3(0, 0, 0);
    const modeFactor = this._mode === 'add' ? 1 : -1;

    for (let i = 0; i < iVerts.length; i++) {
      const vertIndex = iVerts[i];
      const idx = vertIndex * 3;

      const vx = positions[idx];
      const vy = positions[idx + 1];
      const vz = positions[idx + 2];

      // Вектор к центру кисти
      const dx = center.x - vx;
      const dy = center.y - vy;
      const dz = center.z - vz;

      // Falloff
      const distance = this._calculateDistance(vx, vy, vz, picking);
      const falloff = this._calculateFalloff(distance, this._falloffCurve);

      const influence = intensity * falloff * modeFactor;

      // Нормализуем направление
      const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (length > 0) {
        const invLength = 1.0 / length;
        positions[idx] = vx + dx * invLength * influence;
        positions[idx + 1] = vy + dy * invLength * influence;
        positions[idx + 2] = vz + dz * invLength * influence;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }
  
  flatten(iVerts, intensity, picking) {
    const mesh = this.getMesh();
    if (!mesh || !mesh.geometry) return;

    const geometry = mesh.geometry;
    const positions = geometry.attributes.position.array;

    const planeNormal = picking.getPickedNormal?.() || new THREE.Vector3(0, 1, 0);
    const planePoint = picking.getIntersectionPoint?.() || new THREE.Vector3(0, 0, 0);

    // D плоскости: ax + by + cz + d = 0
    const d = -(planeNormal.x * planePoint.x + planeNormal.y * planePoint.y + planeNormal.z * planePoint.z);
    const modeFactor = this._mode === 'add' ? 1 : -1;

    for (let i = 0; i < iVerts.length; i++) {
      const vertIndex = iVerts[i];
      const idx = vertIndex * 3;

      const vx = positions[idx];
      const vy = positions[idx + 1];
      const vz = positions[idx + 2];

      // Расстояние до плоскости
      const distanceToPlane = planeNormal.x * vx + planeNormal.y * vy + planeNormal.z * vz + d;

      // Falloff
      const distance = this._calculateDistance(vx, vy, vz, picking);
      const falloff = this._calculateFalloff(distance, this._falloffCurve);

      const influence = intensity * falloff * modeFactor;

      // Проекция на плоскость
      positions[idx] = vx - planeNormal.x * distanceToPlane * influence;
      positions[idx + 1] = vy - planeNormal.y * distanceToPlane * influence;
      positions[idx + 2] = vz - planeNormal.z * distanceToPlane * influence;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }
  
  remove(iVerts, intensity, picking) {
    const mesh = this.getMesh();
    if (!mesh || !mesh.geometry) return;

    const geometry = mesh.geometry;
    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normal?.array;

    const center = picking.getIntersectionPoint?.() || new THREE.Vector3(0, 0, 0);

    for (let i = 0; i < iVerts.length; i++) {
      const vertIndex = iVerts[i];
      const idx = vertIndex * 3;

      const vx = positions[idx];
      const vy = positions[idx + 1];
      const vz = positions[idx + 2];

      // Вектор от центра кисти (удаляем от центра)
      const dx = vx - center.x;
      const dy = vy - center.y;
      const dz = vz - center.z;

      // Falloff
      const distance = this._calculateDistance(vx, vy, vz, picking);
      const falloff = this._calculateFalloff(distance, this._falloffCurve);

      const influence = intensity * falloff;

      // Комбинируем удаление с нормалью
      const nx = normals?.[idx] || 0;
      const ny = normals?.[idx + 1] || 0;
      const nz = normals?.[idx + 2] || 0;

      // Смещение вдоль нормали в противоположную сторону и от центра
      positions[idx] = vx - nx * influence * 0.7 - dx * 0.3 * influence;
      positions[idx + 1] = vy - ny * influence * 0.7 - dy * 0.3 * influence;
      positions[idx + 2] = vz - nz * influence * 0.7 - dz * 0.3 * influence;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }
  
  _calculateFalloff(distance, curve = this._falloffCurve) {
    if (distance > this._radius) return 0;
    
    const normalizedDistance = distance / this._radius;
    
    if (curve === 1.0) {
      // Линейный falloff
      return 1.0 - normalizedDistance;
    } else {
      // Кривая падения влияния
      return Math.pow(1.0 - normalizedDistance, curve);
    }
  }
}

export default BrushTool;