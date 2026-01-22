import * as THREE from 'three';

class SculptBase {
  constructor(main) {
    this._main = main;
    this._radius = 10;
    this._intensity = 0.5;
    this._culling = false;
    this._tangent = false;
    this._idAlpha = 0;
    this._lockPosition = false;
  }

  setToolMesh(mesh) {
    this._forceToolMesh = mesh;
  }

  getMesh() {
    return this._forceToolMesh || this._main?.getMesh?.() || null;
  }

  setBrushSize(size) {
    this._radius = size;
  }

  setBrushStrength(strength) {
    this._intensity = strength;
  }

  stroke(picking) {
    // Базовый метод - должен быть переопределен в дочерних классах
    console.warn('Stroke method not implemented');
  }

  smooth(iVerts, intensity, picking) {
    const mesh = this.getMesh();
    if (!mesh || !mesh.geometry) return;

    const geometry = mesh.geometry;
    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normal?.array;
    
    // Простое сглаживание - усреднение позиций соседних вершин
    for (let i = 0; i < iVerts.length; i++) {
      const vertexIndex = iVerts[i];
      const idx = vertexIndex * 3;

      // Находим среднее значение с соседями
      let avgX = 0, avgY = 0, avgZ = 0;
      let count = 0;

      // Ищем соседние вершины (упрощенный алгоритм)
      for (let j = 0; j < iVerts.length; j++) {
        if (i !== j) {
          const otherIdx = iVerts[j] * 3;
          const distance = Math.sqrt(
            Math.pow(positions[idx] - positions[otherIdx], 2) +
            Math.pow(positions[idx + 1] - positions[otherIdx + 1], 2) +
            Math.pow(positions[idx + 2] - positions[otherIdx + 2], 2)
          );

          if (distance < this._radius * 0.5) {
            avgX += positions[otherIdx];
            avgY += positions[otherIdx + 1];
            avgZ += positions[otherIdx + 2];
            count++;
          }
        }
      }

      if (count > 0) {
        avgX /= count;
        avgY /= count;
        avgZ /= count;

        // Применяем сглаживание с учетом интенсивности
        const influence = picking?.getAlpha?.(
          positions[idx],
          positions[idx + 1],
          positions[idx + 2]
        ) || 1.0;

        const smoothIntensity = intensity * influence;

        positions[idx] = positions[idx] * (1 - smoothIntensity) + avgX * smoothIntensity;
        positions[idx + 1] = positions[idx + 1] * (1 - smoothIntensity) + avgY * smoothIntensity;
        positions[idx + 2] = positions[idx + 2] * (1 - smoothIntensity) + avgZ * smoothIntensity;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    if (geometry.attributes.normal) {
      geometry.computeVertexNormals();
    }
  }

  getFrontVertices(iVertsInRadius, eyeDir) {
    const mesh = this.getMesh();
    if (!mesh || !mesh.geometry) return [];

    const normals = mesh.geometry.attributes.normal.array;
    const frontVertices = [];

    for (let i = 0; i < iVertsInRadius.length; i++) {
      const vertIndex = iVertsInRadius[i];
      const idx = vertIndex * 3;

      const dot = normals[idx] * eyeDir.x + 
                  normals[idx + 1] * eyeDir.y + 
                  normals[idx + 2] * eyeDir.z;

      if (dot <= 0.0) {
        frontVertices.push(vertIndex);
      }
    }

    return frontVertices;
  }

  laplacianSmooth(iVerts, smoothVerts) {
    const mesh = this.getMesh();
    if (!mesh || !mesh.geometry) return;

    const positions = mesh.geometry.attributes.position.array;

    // Упрощенная реализация лапласианского сглаживания
    for (let i = 0; i < iVerts.length; i++) {
      const vertexIndex = iVerts[i];
      const idx = vertexIndex * 3;
      const i3 = i * 3;

      // Находим все вершины в пределах радиуса
      let sumX = 0, sumY = 0, sumZ = 0;
      let count = 0;

      for (let j = 0; j < iVerts.length; j++) {
        if (i !== j) {
          const otherIdx = iVerts[j] * 3;
          const distance = Math.sqrt(
            Math.pow(positions[idx] - positions[otherIdx], 2) +
            Math.pow(positions[idx + 1] - positions[otherIdx + 1], 2) +
            Math.pow(positions[idx + 2] - positions[otherIdx + 2], 2)
          );

          if (distance < this._radius) {
            sumX += positions[otherIdx];
            sumY += positions[otherIdx + 1];
            sumZ += positions[otherIdx + 2];
            count++;
          }
        }
      }

      if (count > 0) {
        smoothVerts[i3] = sumX / count;
        smoothVerts[i3 + 1] = sumY / count;
        smoothVerts[i3 + 2] = sumZ / count;
      } else {
        smoothVerts[i3] = positions[idx];
        smoothVerts[i3 + 1] = positions[idx + 1];
        smoothVerts[i3 + 2] = positions[idx + 2];
      }
    }
  }

  _calculateDistance(vx, vy, vz, picking) {
    if (!picking || !picking.getIntersectionPoint) return 0;
    
    const center = picking.getIntersectionPoint();
    const dx = vx - center.x;
    const dy = vy - center.y;
    const dz = vz - center.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  _calculateFalloff(distance) {
    if (distance > this._radius) return 0;
    
    const normalizedDistance = distance / this._radius;
    return Math.pow(1.0 - normalizedDistance, 2.0);
  }

  _getTabletPressure() {
    return 1.0;
  }
}

export default SculptBase;