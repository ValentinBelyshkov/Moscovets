import SculptBase from './SculptBase';

class Smooth extends SculptBase {
  constructor(main) {
    super(main);
    
    // Параметры сглаживания
    this._iterations = 1;
    this._preserveDetails = true;
    this._detailThreshold = 0.1;
    this._tangentSmooth = false;
  }

  setIterations(iterations) {
    this._iterations = Math.max(1, iterations);
  }

  setPreserveDetails(preserve) {
    this._preserveDetails = preserve;
  }

  setDetailThreshold(threshold) {
    this._detailThreshold = threshold;
  }

  setTangentSmooth(enabled) {
    this._tangentSmooth = enabled;
  }

  stroke(picking) {
    let iVertsInRadius = picking.getPickedVertices();
    const intensity = this._intensity * this._getTabletPressure();

    if (this._culling) {
      iVertsInRadius = this.getFrontVertices(iVertsInRadius, picking.getEyeDirection());
    }

    // Выполняем несколько итераций сглаживания
    for (let iter = 0; iter < this._iterations; iter++) {
      if (this._tangentSmooth) {
        this.smoothTangent(iVertsInRadius, intensity / this._iterations, picking);
      } else if (this._preserveDetails) {
        this.smoothPreserveDetails(iVertsInRadius, intensity / this._iterations, picking);
      } else {
        this.smooth(iVertsInRadius, intensity / this._iterations, picking);
      }
    }
  }

  smooth(iVerts, intensity, picking) {
    const mesh = this.getMesh();
    if (!mesh || !mesh.geometry) return;

    const geometry = mesh.geometry;
    const positions = geometry.attributes.position.array;
    const nbVerts = iVerts.length;

    const smoothVerts = new Float32Array(nbVerts * 3);
    this.laplacianSmooth(iVerts, smoothVerts);

    for (let i = 0; i < nbVerts; i++) {
      const vertIndex = iVerts[i];
      const idx = vertIndex * 3;
      const i3 = i * 3;

      const vx = positions[idx];
      const vy = positions[idx + 1];
      const vz = positions[idx + 2];

      // Falloff
      const distance = this._calculateDistance(vx, vy, vz, picking);
      const falloff = this._calculateFalloff(distance);

      let influence = intensity * falloff;
      
      if (picking && picking.getAlpha) {
        influence *= picking.getAlpha(vx, vy, vz);
      }

      const intComp = 1.0 - influence;

      positions[idx] = vx * intComp + smoothVerts[i3] * influence;
      positions[idx + 1] = vy * intComp + smoothVerts[i3 + 1] * influence;
      positions[idx + 2] = vz * intComp + smoothVerts[i3 + 2] * influence;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  smoothPreserveDetails(iVerts, intensity, picking) {
    const mesh = this.getMesh();
    if (!mesh || !mesh.geometry) return;

    const geometry = mesh.geometry;
    const positions = geometry.attributes.position.array;
    const nbVerts = iVerts.length;

    const smoothVerts = new Float32Array(nbVerts * 3);
    this.laplacianSmooth(iVerts, smoothVerts);

    // Сохраняем оригинальные позиции для вычисления деталей
    const originalVerts = new Float32Array(nbVerts * 3);
    for (let i = 0; i < nbVerts; i++) {
      const idx = iVerts[i] * 3;
      const i3 = i * 3;
      originalVerts[i3] = positions[idx];
      originalVerts[i3 + 1] = positions[idx + 1];
      originalVerts[i3 + 2] = positions[idx + 2];
    }

    for (let i = 0; i < nbVerts; i++) {
      const vertIndex = iVerts[i];
      const idx = vertIndex * 3;
      const i3 = i * 3;

      const vx = positions[idx];
      const vy = positions[idx + 1];
      const vz = positions[idx + 2];

      // Falloff
      const distance = this._calculateDistance(vx, vy, vz, picking);
      const falloff = this._calculateFalloff(distance);

      let influence = intensity * falloff;
      
      if (picking && picking.getAlpha) {
        influence *= picking.getAlpha(vx, vy, vz);
      }

      // Вычисляем разницу между сглаженной и исходной позицией
      const detailX = originalVerts[i3] - smoothVerts[i3];
      const detailY = originalVerts[i3 + 1] - smoothVerts[i3 + 1];
      const detailZ = originalVerts[i3 + 2] - smoothVerts[i3 + 2];

      const detailMagnitude = Math.sqrt(detailX * detailX + detailY * detailY + detailZ * detailZ);

      // Если деталь меньше порога, полностью сглаживаем
      let detailPreservation = 1.0;
      if (detailMagnitude < this._detailThreshold) {
        detailPreservation = 0.0;
      } else {
        // Сохраняем детали выше порога
        detailPreservation = Math.min(1.0, (detailMagnitude - this._detailThreshold) / this._detailThreshold);
      }

      const effectiveInfluence = influence * (1.0 - detailPreservation * 0.5);
      const intComp = 1.0 - effectiveInfluence;

      positions[idx] = vx * intComp + smoothVerts[i3] * effectiveInfluence;
      positions[idx + 1] = vy * intComp + smoothVerts[i3 + 1] * effectiveInfluence;
      positions[idx + 2] = vz * intComp + smoothVerts[i3 + 2] * effectiveInfluence;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  smoothTangent(iVerts, intensity, picking) {
    const mesh = this.getMesh();
    if (!mesh || !mesh.geometry) return;

    const geometry = mesh.geometry;
    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normal?.array;
    const nbVerts = iVerts.length;

    if (!normals) {
      console.warn('No normals found, using regular smooth instead');
      this.smooth(iVerts, intensity, picking);
      return;
    }

    const smoothVerts = new Float32Array(nbVerts * 3);
    this.laplacianSmooth(iVerts, smoothVerts);

    for (let i = 0; i < nbVerts; i++) {
      const vertIndex = iVerts[i];
      const idx = vertIndex * 3;
      const i3 = i * 3;

      const vx = positions[idx];
      const vy = positions[idx + 1];
      const vz = positions[idx + 2];

      const nx = normals[idx];
      const ny = normals[idx + 1];
      const nz = normals[idx + 2];

      const len = nx * nx + ny * ny + nz * nz;
      if (len === 0.0) continue;

      const invLen = 1.0 / Math.sqrt(len);
      const normalizedNX = nx * invLen;
      const normalizedNY = ny * invLen;
      const normalizedNZ = nz * invLen;

      const smx = smoothVerts[i3];
      const smy = smoothVerts[i3 + 1];
      const smz = smoothVerts[i3 + 2];

      const dot = normalizedNX * (smx - vx) + normalizedNY * (smy - vy) + normalizedNZ * (smz - vz);

      // Falloff
      const distance = this._calculateDistance(vx, vy, vz, picking);
      const falloff = this._calculateFalloff(distance);

      let influence = intensity * falloff;
      
      if (picking && picking.getAlpha) {
        influence *= picking.getAlpha(vx, vy, vz);
      }

      positions[idx] = vx + (smx - normalizedNX * dot - vx) * influence;
      positions[idx + 1] = vy + (smy - normalizedNY * dot - vy) * influence;
      positions[idx + 2] = vz + (smz - normalizedNZ * dot - vz) * influence;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  smoothAlongNormals(iVerts, intensity, picking) {
    const mesh = this.getMesh();
    if (!mesh || !mesh.geometry) return;

    const geometry = mesh.geometry;
    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normal?.array;
    const nbVerts = iVerts.length;

    if (!normals) {
      console.warn('No normals found for smooth along normals');
      return;
    }

    const smoothVerts = new Float32Array(nbVerts * 3);
    this.laplacianSmooth(iVerts, smoothVerts);

    for (let i = 0; i < nbVerts; i++) {
      const vertIndex = iVerts[i];
      const idx = vertIndex * 3;
      const i3 = i * 3;

      const vx = positions[idx];
      const vy = positions[idx + 1];
      const vz = positions[idx + 2];

      const nx = normals[idx];
      const ny = normals[idx + 1];
      const nz = normals[idx + 2];

      const dot = nx * (smoothVerts[i3] - vx) + ny * (smoothVerts[i3 + 1] - vy) + nz * (smoothVerts[i3 + 2] - vz);
      const len = nx * nx + ny * ny + nz * nz;

      // Falloff
      const distance = this._calculateDistance(vx, vy, vz, picking);
      const falloff = this._calculateFalloff(distance);

      let influence = (dot / (len || 1)) * intensity * falloff;
      
      if (picking && picking.getAlpha) {
        influence *= picking.getAlpha(vx, vy, vz);
      }

      positions[idx] = vx + nx * influence;
      positions[idx + 1] = vy + ny * influence;
      positions[idx + 2] = vz + nz * influence;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }
}

export default Smooth;