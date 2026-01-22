import * as THREE from 'three';

class SculptManager {
  constructor(viewer) {
    this.viewer = viewer;
    this.activeMesh = null;
    this.isDrawing = false;
    this.lastIntersection = null;
    
    this.brushSettings = {
      size: 5,
      strength: 0.5,
      operation: 'sculpt',
      mode: 'add',
      falloff: 2.0
    };
    
    // История для undo
    this.history = [];
    this.historyIndex = -1;
    
    // Визуализация кисти
    this.brushVisualization = null;
  }

  setActiveMesh(mesh) {
    this.activeMesh = mesh;
    if (mesh) {
      this.prepareMeshForSculpting(mesh);
    }
  }

  prepareMeshForSculpting(mesh) {
    if (!mesh.geometry) return;
    
    // Убедимся, что у меша есть все необходимые атрибуты
    if (!mesh.geometry.attributes.normal) {
      mesh.geometry.computeVertexNormals();
    }
    
    // Создаем копию оригинальных позиций для undo
    if (!mesh.userData.originalPositions) {
      const positions = mesh.geometry.attributes.position.array;
      mesh.userData.originalPositions = new Float32Array(positions);
    }
  }

  startStroke(event) {
    if (!this.activeMesh) return false;
    
    const intersection = this.getIntersection(event);
    if (!intersection) return false;
    
    this.isDrawing = true;
    this.lastIntersection = intersection;
    
    // Сохраняем состояние для undo
    this.saveState();
    
    // Визуализируем кисть
    this.showBrush(intersection.point, intersection.face.normal);
    
    // Применяем кисть
    this.applyBrush(intersection);
    
    return true;
  }

  continueStroke(event) {
    if (!this.isDrawing || !this.activeMesh) return false;
    
    const intersection = this.getIntersection(event);
    if (!intersection) return false;
    
    // Обновляем визуализацию кисти
    this.updateBrushVisualization(intersection.point, intersection.face.normal);
    
    // Применяем кисть
    this.applyBrush(intersection);
    
    this.lastIntersection = intersection;
    return true;
  }

  endStroke() {
    if (!this.isDrawing) return;
    
    this.isDrawing = false;
    
    // Убираем визуализацию кисти
    this.removeBrushVisualization();
    
    // Оптимизируем геометрию
    if (this.activeMesh && this.activeMesh.geometry) {
      this.activeMesh.geometry.attributes.position.needsUpdate = true;
      this.activeMesh.geometry.computeVertexNormals();
    }
    
    // Автоматическая адаптация пересечений
    this.fixIntersections();
    
    console.log('Штрих завершен');
  }

  applyBrush(intersection) {
    if (!this.activeMesh || !this.activeMesh.geometry) return;
    
    const geometry = this.activeMesh.geometry;
    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normal.array;
    const vertexCount = positions.length / 3;
    
    const brushCenter = intersection.point;
    const brushNormal = intersection.face.normal;
    const brushRadius = this.brushSettings.size;
    const brushStrength = this.brushSettings.strength;
    const operation = this.brushSettings.operation;
    const mode = this.brushSettings.mode;
    
    // Преобразуем центр кисти в локальные координаты меша
    const localCenter = new THREE.Vector3();
    const inverseMatrix = new THREE.Matrix4().copy(this.activeMesh.matrixWorld).invert();
    localCenter.copy(brushCenter).applyMatrix4(inverseMatrix);
    
    // Создаем временный массив для новых позиций
    const newPositions = new Float32Array(positions.length);
    
    for (let i = 0; i < vertexCount; i++) {
      const idx = i * 3;
      const vertex = new THREE.Vector3(positions[idx], positions[idx + 1], positions[idx + 2]);
      const normal = new THREE.Vector3(normals[idx], normals[idx + 1], normals[idx + 2]);
      
      // Расстояние от вершины до центра кисти
      const distance = vertex.distanceTo(localCenter);
      
      if (distance <= brushRadius) {
        // Вычисляем falloff (влияние кисти)
        const falloff = this.calculateFalloff(distance, brushRadius);
        const influence = brushStrength * falloff;
        
        // Вычисляем смещение в зависимости от операции
        let displacement = new THREE.Vector3();
        
        switch (operation) {
          case 'sculpt':
            // Смещение вдоль нормали кисти
            displacement = brushNormal.clone().multiplyScalar(influence * (mode === 'add' ? 1 : -1));
            break;
            
          case 'inflate':
            // Смещение вдоль нормали вершины
            displacement = normal.clone().multiplyScalar(influence * (mode === 'add' ? 1 : -1));
            break;
            
          case 'pinch':
            // Сжатие к центру кисти
            const toCenter = localCenter.clone().sub(vertex).normalize();
            displacement = toCenter.multiplyScalar(influence * (mode === 'add' ? 1 : -1));
            break;
            
          case 'flatten':
            // Выравнивание по плоскости
            const planeDistance = brushNormal.dot(vertex.clone().sub(localCenter));
            displacement = brushNormal.clone().multiplyScalar(-planeDistance * influence);
            break;
            
          case 'remove':
            // Удаление материала (обратное смещение)
            displacement = normal.clone().multiplyScalar(-influence);
            break;
            
          case 'smooth':
            // Сглаживание - усреднение с соседями
            if (this.lastIntersection) {
              displacement = this.calculateSmoothDisplacement(i, positions, normals, vertexCount) * influence;
            }
            break;
            
          default:
            // По умолчанию - скульптурирование
            displacement = brushNormal.clone().multiplyScalar(influence * (mode === 'add' ? 1 : -1));
        }
        
        // Применяем смещение
        vertex.add(displacement);
      }
      
      // Сохраняем новую позицию
      newPositions[idx] = vertex.x;
      newPositions[idx + 1] = vertex.y;
      newPositions[idx + 2] = vertex.z;
    }
    
    // Обновляем позиции вершин
    for (let i = 0; i < positions.length; i++) {
      positions[i] = newPositions[i];
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  calculateSmoothDisplacement(vertexIndex, positions, normals, vertexCount) {
    // Упрощенное сглаживание - усреднение с ближайшими вершинами
    const idx = vertexIndex * 3;
    const vertex = new THREE.Vector3(positions[idx], positions[idx + 1], positions[idx + 2]);
    
    let avgPos = new THREE.Vector3();
    let count = 0;
    const searchRadius = this.brushSettings.size * 0.5;
    
    for (let j = 0; j < vertexCount; j++) {
      if (j === vertexIndex) continue;
      
      const jdx = j * 3;
      const otherVertex = new THREE.Vector3(positions[jdx], positions[jdx + 1], positions[jdx + 2]);
      const distance = vertex.distanceTo(otherVertex);
      
      if (distance < searchRadius) {
        avgPos.add(otherVertex);
        count++;
      }
    }
    
    if (count > 0) {
      avgPos.divideScalar(count);
      return avgPos.sub(vertex).length() * 0.1; // Меньшее влияние для сглаживания
    }
    
    return 0;
  }

  calculateFalloff(distance, radius) {
    const t = 1.0 - (distance / radius);
    const curve = this.brushSettings.falloff;
    
    if (curve === 1.0) {
      return Math.max(0, t);
    } else {
      return Math.max(0, Math.pow(t, curve));
    }
  }

  getIntersection(event) {
    if (!this.viewer || !this.viewer.rendererRef?.current || 
        !this.viewer.cameraRef?.current || !this.activeMesh) {
      return null;
    }
    
    const renderer = this.viewer.rendererRef.current;
    const camera = this.viewer.cameraRef.current;
    
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObject(this.activeMesh, true);
    
    return intersects.length > 0 ? intersects[0] : null;
  }

  showBrush(position, normal) {
    this.removeBrushVisualization();
    
    if (!this.viewer.sceneRef?.current || !this.viewer.cameraRef?.current) return;
    
    const scene = this.viewer.sceneRef.current;
    const camera = this.viewer.cameraRef.current;
    
    const brushColor = this.brushSettings.mode === 'add' ? 0x00ff00 : 0xff0000;
    const brushOpacity = this.brushSettings.operation === 'smooth' ? 0.5 : 0.7;
    
    // Создаем круг для визуализации кисти
    const circleGeometry = new THREE.RingGeometry(
      this.brushSettings.size * 0.8,
      this.brushSettings.size,
      32
    );
    
    const circleMaterial = new THREE.MeshBasicMaterial({
      color: brushColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: brushOpacity
    });
    
    this.brushVisualization = new THREE.Mesh(circleGeometry, circleMaterial);
    this.brushVisualization.position.copy(position);
    
    // Ориентируем к камере
    this.brushVisualization.lookAt(camera.position);
    
    // Смещаем немного вперед от поверхности
    const cameraDirection = new THREE.Vector3()
      .subVectors(position, camera.position)
      .normalize();
    this.brushVisualization.position.add(cameraDirection.multiplyScalar(0.1));
    
    scene.add(this.brushVisualization);
  }

  updateBrushVisualization(position, normal) {
    if (!this.brushVisualization || !this.viewer.cameraRef?.current) return;
    
    const camera = this.viewer.cameraRef.current;
    
    this.brushVisualization.position.copy(position);
    this.brushVisualization.lookAt(camera.position);
    
    // Смещаем немного вперед от поверхности
    const cameraDirection = new THREE.Vector3()
      .subVectors(position, camera.position)
      .normalize();
    this.brushVisualization.position.add(cameraDirection.multiplyScalar(0.1));
  }

  removeBrushVisualization() {
    if (this.brushVisualization && this.viewer.sceneRef?.current) {
      this.viewer.sceneRef.current.remove(this.brushVisualization);
      this.brushVisualization = null;
    }
  }

  fixIntersections() {
    if (!this.activeMesh || !this.viewer.sceneRef?.current) return;
    
    const scene = this.viewer.sceneRef.current;
    
    // Находим другие модели для проверки пересечений
    const otherMeshes = [];
    scene.children.forEach(child => {
      if (child.isMesh && child !== this.activeMesh && child.userData?.type === 'occlusion_pad') {
        otherMeshes.push(child);
      }
    });
    
    otherMeshes.forEach(otherMesh => {
      this.resolveIntersection(otherMesh);
    });
  }

  resolveIntersection(otherMesh) {
    const box1 = new THREE.Box3().setFromObject(this.activeMesh);
    const box2 = new THREE.Box3().setFromObject(otherMesh);
    
    const intersection = new THREE.Box3();
    intersection.copy(box1).intersect(box2);
    
    if (!intersection.isEmpty()) {
      // Есть пересечение - смещаем активную модель
      const center1 = box1.getCenter(new THREE.Vector3());
      const center2 = box2.getCenter(new THREE.Vector3());
      
      // Вектор от другой модели к активной
      const direction = new THREE.Vector3().subVectors(center1, center2).normalize();
      
      // Размер пересечения
      const overlap = intersection.getSize(new THREE.Vector3());
      const displacement = direction.multiplyScalar(overlap.length() * 0.5);
      
      // Смещаем активную модель
      this.activeMesh.position.add(displacement);
      this.activeMesh.updateMatrixWorld();
      
      console.log(`Устранено пересечение, смещение: ${displacement.length().toFixed(2)}`);
    }
  }

  saveState() {
    if (!this.activeMesh || !this.activeMesh.geometry) return;
    
    const positions = this.activeMesh.geometry.attributes.position.array;
    const state = {
      positions: new Float32Array(positions),
      timestamp: Date.now(),
      operation: this.brushSettings.operation,
      mode: this.brushSettings.mode
    };
    
    this.history.push(state);
    
    // Ограничиваем историю
    if (this.history.length > 20) {
      this.history.shift();
    }
    
    this.historyIndex = this.history.length - 1;
  }

  undo() {
    if (this.historyIndex < 0 || !this.activeMesh) return false;
    
    const state = this.history[this.historyIndex];
    const positions = this.activeMesh.geometry.attributes.position.array;
    
    for (let i = 0; i < positions.length; i++) {
      positions[i] = state.positions[i];
    }
    
    this.activeMesh.geometry.attributes.position.needsUpdate = true;
    this.activeMesh.geometry.computeVertexNormals();
    
    this.historyIndex--;
    
    return true;
  }

  redo() {
    if (this.historyIndex >= this.history.length - 1 || !this.activeMesh) return false;
    
    this.historyIndex++;
    const state = this.history[this.historyIndex];
    const positions = this.activeMesh.geometry.attributes.position.array;
    
    for (let i = 0; i < positions.length; i++) {
      positions[i] = state.positions[i];
    }
    
    this.activeMesh.geometry.attributes.position.needsUpdate = true;
    this.activeMesh.geometry.computeVertexNormals();
    
    return true;
  }

  setBrushSettings(settings) {
    this.brushSettings = { ...this.brushSettings, ...settings };
  }
}

export default SculptManager;