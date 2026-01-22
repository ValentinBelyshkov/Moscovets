import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';
import './ThreeDViewer2.css';

const ThreeDViewer2 = React.forwardRef(({
  models,
  modelTypes,
  showAssembly = false,
  showOcclusionPad = false,
  editingMode = false,
  sculptMode = false,
  brushSettings = {},
  onBrushEdit,
  onBrushSettingsChange,
  parameters = {},
  cementGap = 0.1,
  insertionPathAngle = 10
}, ref) => {
  // Refs - объявляем ВСЕ refs в начале
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const modelRefs = useRef({});
  const frameRef = useRef(null);
  const isInitializedRef = useRef(false);
  const raycasterRef = useRef(null);
  const mouseRef = useRef(null);
  const brushConfigRef = useRef({
    size: 5,
    strength: 0.5,
    operation: 'sculpt',
    mode: 'add',
    falloff: 2.0
  });

  // State - объявляем ВСЕ состояния в начале
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeModel, setActiveModel] = useState(null);
  const [assemblyVisualization, setAssemblyVisualization] = useState(null);
  const [occlusionPadMesh, setOcclusionPadMesh] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [fittingProgress, setFittingProgress] = useState(0);
  const [isFitting, setIsFitting] = useState(false);
  const [occlusionIntersection, setOcclusionIntersection] = useState(null);
  const [modelLoadStatus, setModelLoadStatus] = useState({});
  const [hasRealModels, setHasRealModels] = useState(false);
  const [assemblyCompleted, setAssemblyCompleted] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastBrushPosition, setLastBrushPosition] = useState(null);
  const [brushVisualization, setBrushVisualization] = useState(null);
  const [editHistory, setEditHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Инициализация refs, которые зависят от других значений
  useEffect(() => {
    if (!raycasterRef.current) {
      raycasterRef.current = new THREE.Raycaster();
    }
    if (!mouseRef.current) {
      mouseRef.current = new THREE.Vector2();
    }
  }, []);

  // Update brush config when props change
  useEffect(() => {
    if (brushSettings) {
      brushConfigRef.current = {
        ...brushConfigRef.current,
        ...brushSettings
      };
    }
  }, [brushSettings]);

  // 1. Функция сохранения состояния меша
  const saveMeshState = useCallback((mesh) => {
    if (!mesh || !mesh.geometry) return null;
    
    const positions = mesh.geometry.attributes.position.array;
    return new Float32Array(positions);
  }, []);

  // 2. Функция восстановления состояния меша
  const restoreMeshState = useCallback((mesh, state) => {
    if (!mesh || !mesh.geometry || !state) return false;
    
    const positions = mesh.geometry.attributes.position.array;
    
    if (positions.length !== state.length) {
      console.error('Размеры состояния не совпадают');
      return false;
    }
    
    for (let i = 0; i < positions.length; i++) {
      positions[i] = state[i];
    }
    
    mesh.geometry.attributes.position.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
    
    return true;
  }, []);

  // 3. Создание визуализации сборки
  const createAssemblyVisualization = useCallback((upperJaw, lowerJaw) => {
    if (!sceneRef.current || !showAssembly || !upperJaw || !lowerJaw) return null;
    
    // Удаляем старую визуализацию, если она существует
    const oldViz = sceneRef.current.getObjectByName('assembly_fitting_visualization');
    if (oldViz && sceneRef.current) {
      sceneRef.current.remove(oldViz);
      if (oldViz.geometry) oldViz.geometry.dispose();
      if (oldViz.material) oldViz.material.dispose();
    }
    
    const upperBox = new THREE.Box3().setFromObject(upperJaw);
    const lowerBox = new THREE.Box3().setFromObject(lowerJaw);
    
    const upperCenter = upperBox.getCenter(new THREE.Vector3());
    const lowerCenter = lowerBox.getCenter(new THREE.Vector3());
    
    // Создаем линию между центрами
    const points = [
      new THREE.Vector3(upperCenter.x, upperCenter.y, upperCenter.z),
      new THREE.Vector3(lowerCenter.x, lowerCenter.y, lowerCenter.z)
    ];
    
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineDashedMaterial({ 
      color: 0x00ff00,
      linewidth: 2,
      scale: 1,
      dashSize: 3,
      gapSize: 2
    });
    
    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.computeLineDistances();
    
    const mesh = new THREE.Group();
    mesh.add(line);
    mesh.name = 'assembly_fitting_visualization';
    mesh.userData = { type: 'assembly_fitting', fitted: true };
    
    sceneRef.current.add(mesh);
    console.log("📐 Визуализация сборки создана");
    
    return mesh;
  }, [showAssembly]);

  // 8. ФУНКЦИЯ ДЛЯ ПОИСКА ОТСУТСТВУЮЩЕГО ЗУБА - ИСПРАВЛЕННАЯ ВЕРСИЯ
  const findMissingToothPosition = useCallback((upperJaw, lowerJaw) => {
    console.log("🔍 Поиск места для накладки (отсутствующего зуба)...");
    
    // Получаем размеры челюстей
    const upperBox = new THREE.Box3().setFromObject(upperJaw);
    const lowerBox = new THREE.Box3().setFromObject(lowerJaw);
    
    const upperSize = upperBox.getSize(new THREE.Vector3());
    const lowerSize = lowerBox.getSize(new THREE.Vector3());
    
    // Определяем область сканирования зубного ряда
    const scanBox = new THREE.Box3();
    scanBox.min.x = Math.max(upperBox.min.x, lowerBox.min.x) + 5; // Сдвигаем от краев
    scanBox.max.x = Math.min(upperBox.max.x, lowerBox.max.x) - 5;
    scanBox.min.y = (upperBox.min.y + lowerBox.max.y) / 2 - 3; // Область между челюстями
    scanBox.max.y = scanBox.min.y + 6;
    scanBox.min.z = Math.max(upperBox.min.z, lowerBox.min.z) + 5;
    scanBox.max.z = Math.min(upperBox.max.z, lowerBox.max.z) - 5;
    
    console.log(`📏 Область сканирования: X=${scanBox.min.x.toFixed(1)}-${scanBox.max.x.toFixed(1)}, Y=${scanBox.min.y.toFixed(1)}-${scanBox.max.y.toFixed(1)}, Z=${scanBox.min.z.toFixed(1)}-${scanBox.max.z.toFixed(1)}`);
    
    // Сканируем область с высоким разрешением
    const scanPointsX = 30; // Увеличиваем разрешение
    const scanPointsZ = 15;
    
    // Матрица для хранения результатов сканирования
    const scanResults = [];
    
    // Сканируем область для поиска пустот
    for (let i = 0; i < scanPointsX; i++) {
      for (let j = 0; j < scanPointsZ; j++) {
        const x = scanBox.min.x + (scanBox.max.x - scanBox.min.x) * (i / (scanPointsX - 1));
        const z = scanBox.min.z + (scanBox.max.z - scanBox.min.z) * (j / (scanPointsZ - 1));
        
        // Создаем луч сверху вниз через всю область
        const raycaster = new THREE.Raycaster();
        const rayOrigin = new THREE.Vector3(x, upperBox.max.y + 10, z);
        const rayDirection = new THREE.Vector3(0, -1, 0);
        raycaster.set(rayOrigin, rayDirection);
        
        // Проверяем пересечение с верхней и нижней челюстями
        const upperIntersects = raycaster.intersectObject(upperJaw, true);
        const lowerIntersects = raycaster.intersectObject(lowerJaw, true);
        
        // Ключевое изменение: ищем места, где НЕТ пересечения с челюстями в области между ними
        let isGap = false;
        let gapHeight = 0;
        let gapCenterY = 0;
        
        if (upperIntersects.length > 0 && lowerIntersects.length > 0) {
          const upperPoint = upperIntersects[0].point;
          const lowerPoint = lowerIntersects[0].point;
          const distance = Math.abs(upperPoint.y - lowerPoint.y);
          
          // Если расстояние большое - это место для зуба
          if (distance > 5) { // Порог для обнаружения отсутствующего зуба
            isGap = true;
            gapHeight = distance;
            gapCenterY = (upperPoint.y + lowerPoint.y) / 2;
          }
        } else if (upperIntersects.length === 0 && lowerIntersects.length === 0) {
          // Нет пересечений вообще - полностью пустая область
          isGap = true;
          gapHeight = 10; // Примерная высота
          gapCenterY = scanBox.min.y + 3;
        }
        
        if (isGap) {
          scanResults.push({
            x: x,
            y: gapCenterY,
            z: z,
            height: gapHeight,
            score: gapHeight // Чем больше высота, тем лучше место для накладки
          });
        }
      }
    }
    
    console.log(`📊 Результаты сканирования: найдено ${scanResults.length} потенциальных мест`);
    
    if (scanResults.length === 0) {
      console.log("⚠️ Не найдено подходящих мест, использую центр");
      return new THREE.Vector3(
        (scanBox.min.x + scanBox.max.x) / 2,
        (scanBox.min.y + scanBox.max.y) / 2,
        (scanBox.min.z + scanBox.max.z) / 2
      );
    }
    
    // Группируем результаты по близким позициям
    const groups = [];
    const groupRadius = 3.0; // Радиус для группировки
    
    scanResults.forEach(result => {
      let addedToGroup = false;
      
      for (const group of groups) {
        const distance = Math.sqrt(
          Math.pow(result.x - group.center.x, 2) +
          Math.pow(result.y - group.center.y, 2) +
          Math.pow(result.z - group.center.z, 2)
        );
        
        if (distance < groupRadius) {
          group.points.push(result);
          // Пересчитываем центр группы
          const sumX = group.points.reduce((sum, p) => sum + p.x, 0);
          const sumY = group.points.reduce((sum, p) => sum + p.y, 0);
          const sumZ = group.points.reduce((sum, p) => sum + p.z, 0);
          group.center.x = sumX / group.points.length;
          group.center.y = sumY / group.points.length;
          group.center.z = sumZ / group.points.length;
          group.avgHeight = group.points.reduce((sum, p) => sum + p.height, 0) / group.points.length;
          addedToGroup = true;
          break;
        }
      }
      
      if (!addedToGroup) {
        groups.push({
          points: [result],
          center: new THREE.Vector3(result.x, result.y, result.z),
          avgHeight: result.height,
          size: 1
        });
      }
    });
    
    // Сортируем группы по средней высоте зазора (чем больше, тем лучше)
    groups.sort((a, b) => b.avgHeight - a.avgHeight);
    
    console.log(`📊 Сгруппировано ${groups.length} областей:`);
    groups.forEach((group, index) => {
      console.log(`  ${index + 1}. Центр: X=${group.center.x.toFixed(1)}, Y=${group.center.y.toFixed(1)}, Z=${group.center.z.toFixed(1)}, Высота: ${group.avgHeight.toFixed(1)}, Точек: ${group.points.length}`);
    });
    
    // Выбираем лучшую группу
    const bestGroup = groups[0];
    
    if (!bestGroup) {
      console.log("⚠️ Не удалось выбрать группу, использую первую точку");
      return new THREE.Vector3(scanResults[0].x, scanResults[0].y, scanResults[0].z);
    }
    
    console.log(`✅ Выбрана область: X=${bestGroup.center.x.toFixed(1)}, Y=${bestGroup.center.y.toFixed(1)}, Z=${bestGroup.center.z.toFixed(1)}`);
    console.log(`📏 Средняя высота зазора: ${bestGroup.avgHeight.toFixed(1)}`);
    
    return bestGroup.center;
  }, []);

  // 9. УЛУЧШЕННАЯ ФУНКЦИЯ ДЛЯ СОЗДАНИЯ ОККЛЮЗИОННОЙ НАКЛАДКИ
  const generateOcclusionPad = useCallback(() => {
    if (!sceneRef.current || !modelRefs.current.upperJaw || !modelRefs.current.lowerJaw) {
      setError("Необходимы модели челюстей для создания накладки");
      return;
    }

    if (!assemblyCompleted) {
      setError("Сначала необходимо выполнить сборку моделей");
      return;
    }

    console.log("🦷 Создание окклюзионной накладки-заместителя...");

    try {
      const upperJaw = modelRefs.current.upperJaw;
      const lowerJaw = modelRefs.current.lowerJaw;
      
      // 1. НАХОДИМ ПОЗИЦИЮ ОТСУТСТВУЮЩЕГО ЗУБА
      const padPosition = findMissingToothPosition(upperJaw, lowerJaw);
      
      // 2. УТОЧНЯЕМ ВЫСОТУ С ПОМОЩЬЮ RAYCASTING
      let finalPosition = padPosition.clone();
      let toothHeight = 8; // Значение по умолчанию
      
      // Используем raycasting для точного определения зазора
      const raycaster = new THREE.Raycaster();
      const rayOrigin = new THREE.Vector3(padPosition.x, upperJaw.position.y + 20, padPosition.z);
      const rayDirection = new THREE.Vector3(0, -1, 0);
      raycaster.set(rayOrigin, rayDirection);
      
      const upperIntersects = raycaster.intersectObject(upperJaw, true);
      const lowerIntersects = raycaster.intersectObject(lowerJaw, true);
      
      if (upperIntersects.length > 0 && lowerIntersects.length > 0) {
        const upperPoint = upperIntersects[0].point;
        const lowerPoint = lowerIntersects[0].point;
        
        // Вычисляем зазор между челюстями
        const gap = Math.abs(upperPoint.y - lowerPoint.y);
        
        // Высота накладки - 70% от зазора
        toothHeight = gap * 0.7;
        
        // Позиционируем накладку - 60% снизу
        finalPosition.y = lowerPoint.y + toothHeight * 0.6;
        
        console.log(`📏 Точные измерения:`);
        console.log(`   Верх: Y=${upperPoint.y.toFixed(2)}`);
        console.log(`   Низ: Y=${lowerPoint.y.toFixed(2)}`);
        console.log(`   Зазор: ${gap.toFixed(2)}`);
        console.log(`   Высота накладки: ${toothHeight.toFixed(2)}`);
        console.log(`   Позиция Y: ${finalPosition.y.toFixed(2)}`);
      } else {
        console.log("⚠️ Не удалось получить точные измерения, использую приближенные значения");
      }
      
      // 3. ОПРЕДЕЛЯЕМ РАЗМЕРЫ НАКЛАДКИ
      const upperBox = new THREE.Box3().setFromObject(upperJaw);
      const lowerBox = new THREE.Box3().setFromObject(lowerJaw);
      const upperSize = upperBox.getSize(new THREE.Vector3());
      const lowerSize = lowerBox.getSize(new THREE.Vector3());
      
      // Размеры накладки (реалистичные для зуба)
      const toothWidth = Math.min(upperSize.x, lowerSize.x) * 0.07; // 7% от ширины челюсти
      const toothDepth = Math.min(upperSize.z, lowerSize.z) * 0.09; // 9% от глубины
      
      console.log(`📏 Размеры накладки: ширина=${toothWidth.toFixed(2)}, высота=${toothHeight.toFixed(2)}, глубина=${toothDepth.toFixed(2)}`);
      
      // 4. СОЗДАЕМ НАКЛАДКУ (форма моляра)
      const segments = 16;
      
      // Создаем основу - цилиндр с зауженным основанием
      const toothGeometry = new THREE.CylinderGeometry(
        toothWidth / 2,      // Верхний радиус
        toothWidth / 2.5,    // Нижний радиус (уже)
        toothHeight,         // Высота
        segments             // Количество сегментов
      );
      
      // Модифицируем геометрию для создания жевательной поверхности
      const positions = toothGeometry.attributes.position.array;
      const normals = toothGeometry.attributes.normal.array;
      
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        
        // Создаем впадины на жевательной поверхности (верх)
        if (y > toothHeight / 2 - 1) {
          // Волнообразная поверхность
          const wave1 = 0.1 * Math.sin(x * 8) * Math.sin(z * 6);
          const wave2 = 0.05 * Math.sin(x * 12) * Math.cos(z * 8);
          positions[i + 1] = y - wave1 - wave2;
        }
        
        // Делаем основание уже
        if (y < -toothHeight / 2 + 1) {
          positions[i] = x * 0.8;
          positions[i + 2] = z * 0.8;
        }
      }
      
      toothGeometry.attributes.position.needsUpdate = true;
      toothGeometry.computeVertexNormals();
      
      const gap = cementGap || 0.05;
      
      // 5. СОЗДАЕМ МАТЕРИАЛ
      const material = new THREE.MeshPhongMaterial({
        color: 0xff9900,
        transparent: true,
        opacity: 0.9,
        shininess: 100,
        specular: 0x444444,
        side: THREE.DoubleSide,
        flatShading: false
      });
      
      const mesh = new THREE.Mesh(toothGeometry, material);
      
      // 6. ПОЗИЦИОНИРУЕМ НАКЛАДКУ
      mesh.position.copy(finalPosition);
      
      // Наклоняем немного вперед для естественности
      mesh.rotation.x = -0.15;
      mesh.rotation.z = 0.08;
      
      mesh.name = 'occlusion_pad_generated';
      mesh.userData = {
        type: 'occlusion_pad',
        editable: true,
        parameters: parameters,
        cementGap: gap,
        toothHeight: toothHeight,
        toothWidth: toothWidth,
        toothDepth: toothDepth,
        originalGeometry: toothGeometry.clone(),
        originalPositions: null,
        position: finalPosition.clone(),
        isToothReplacement: true,
        missingToothPosition: true
      };
      
      // 7. УДАЛЯЕМ СТАРУЮ НАКЛАДКУ
      if (occlusionPadMesh && sceneRef.current) {
        sceneRef.current.remove(occlusionPadMesh);
        if (occlusionPadMesh.geometry) occlusionPadMesh.geometry.dispose();
        if (occlusionPadMesh.material) occlusionPadMesh.material.dispose();
      }
      
      sceneRef.current.add(mesh);
      setOcclusionPadMesh(mesh);
      
      // 8. СОХРАНЯЕМ ОРИГИНАЛЬНЫЕ ПОЗИЦИИ
      if (mesh.geometry) {
        const positionsArray = mesh.geometry.attributes.position.array;
        mesh.userData.originalPositions = new Float32Array(positionsArray);
      }
      
      // 9. ВИЗУАЛИЗАЦИЯ МЕСТА УСТАНОВКИ
      // Создаем сферу для визуализации места
      const markerGeometry = new THREE.SphereGeometry(1.5, 8, 8);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.3,
        wireframe: true
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.copy(finalPosition);
      marker.name = 'tooth_replacement_marker';
      sceneRef.current.add(marker);
      
      // Удаляем маркер через 3 секунды
      setTimeout(() => {
        if (sceneRef.current && sceneRef.current.getObjectByName('tooth_replacement_marker')) {
          sceneRef.current.remove(sceneRef.current.getObjectByName('tooth_replacement_marker'));
        }
      }, 3000);
      
      console.log("✅ Окклюзионная накладка-заместитель успешно создана!");
      console.log(`📍 Позиция: X=${mesh.position.x.toFixed(1)}, Y=${mesh.position.y.toFixed(1)}, Z=${mesh.position.z.toFixed(1)}`);
      console.log(`📏 Размеры: ${toothWidth.toFixed(1)}×${toothHeight.toFixed(1)}×${toothDepth.toFixed(1)}`);
      console.log(`🎯 Замещение отсутствующего зуба`);
      
      return mesh;
      
    } catch (err) {
      console.error("❌ Ошибка создания накладки:", err);
      setError(`Ошибка создания накладки: ${err.message}`);
      return null;
    }
  }, [assemblyCompleted, cementGap, parameters, occlusionPadMesh, findMissingToothPosition]);

  // 10. Выделение области пересечения окклюзии
  const highlightOcclusionIntersection = useCallback((upperJaw, lowerJaw, pad) => {
    if (!sceneRef.current) return;
    
    if (occlusionIntersection && sceneRef.current) {
      sceneRef.current.remove(occlusionIntersection);
      if (occlusionIntersection.geometry) occlusionIntersection.geometry.dispose();
      if (occlusionIntersection.material) occlusionIntersection.material.dispose();
    }
    
    const upperBox = new THREE.Box3().setFromObject(upperJaw);
    const lowerBox = new THREE.Box3().setFromObject(lowerJaw);
    const padBox = new THREE.Box3().setFromObject(pad);
    
    const intersection = new THREE.Box3();
    intersection.copy(upperBox).intersect(lowerBox).intersect(padBox);
    
    if (!intersection.isEmpty()) {
      const size = intersection.getSize(new THREE.Vector3());
      const center = intersection.getCenter(new THREE.Vector3());
      
      const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
      const material = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.3,
        wireframe: true
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(center);
      mesh.name = 'occlusion_intersection';
      
      sceneRef.current.add(mesh);
      setOcclusionIntersection(mesh);
    }
  }, [occlusionIntersection]);

  // 11. Функция для получения пересечения с мышью
  const getMouseIntersection = useCallback((event, targetMesh = occlusionPadMesh) => {
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current || !targetMesh) {
      return null;
    }
    
    const rect = rendererRef.current.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    
    const intersects = raycaster.intersectObject(targetMesh, true);
    
    return intersects.length > 0 ? intersects[0] : null;
  }, [occlusionPadMesh]);

  // 12. Функция применения кисти к мешу
  const applyBrushToMesh = useCallback((mesh, intersection) => {
    if (!mesh || !mesh.geometry || !intersection) return false;
    
    const geometry = mesh.geometry;
    const positions = mesh.geometry.attributes.position.array;
    const normals = mesh.geometry.attributes.normal?.array;
    const vertexCount = positions.length / 3;
    
    if (!normals) {
      mesh.geometry.computeVertexNormals();
      return false;
    }
    
    const brushCenter = intersection.point;
    const brushNormal = intersection.face.normal;
    const brushRadius = brushConfigRef.current.size;
    const brushStrength = brushConfigRef.current.strength;
    const operation = brushConfigRef.current.operation;
    const mode = brushConfigRef.current.mode;
    const falloffCurve = brushConfigRef.current.falloff;
    
    const localCenter = new THREE.Vector3();
    const inverseMatrix = new THREE.Matrix4().copy(mesh.matrixWorld).invert();
    localCenter.copy(brushCenter).applyMatrix4(inverseMatrix);
    
    let modified = false;
    
    for (let i = 0; i < vertexCount; i++) {
      const idx = i * 3;
      const vertex = new THREE.Vector3(positions[idx], positions[idx + 1], positions[idx + 2]);
      const normal = new THREE.Vector3(normals[idx], normals[idx + 1], normals[idx + 2]);
      
      const distance = vertex.distanceTo(localCenter);
      
      if (distance <= brushRadius) {
        modified = true;
        
        const t = 1.0 - (distance / brushRadius);
        const falloff = Math.pow(t, falloffCurve);
        const influence = brushStrength * falloff;
        
        let displacement = new THREE.Vector3();
        
        switch (operation) {
          case 'sculpt':
            displacement = brushNormal.clone().multiplyScalar(influence * (mode === 'add' ? 1 : -1));
            break;
            
          case 'smooth':
            let avgX = 0, avgY = 0, avgZ = 0;
            let count = 0;
            
            const smoothRadius = brushRadius * 0.3;
            for (let j = 0; j < vertexCount; j++) {
              if (i === j) continue;
              
              const jdx = j * 3;
              const otherVertex = new THREE.Vector3(
                positions[jdx], 
                positions[jdx + 1], 
                positions[jdx + 2]
              );
              
              const vertDistance = vertex.distanceTo(otherVertex);
              if (vertDistance < smoothRadius) {
                avgX += positions[jdx];
                avgY += positions[jdx + 1];
                avgZ += positions[jdx + 2];
                count++;
              }
            }
            
            if (count > 0) {
              avgX /= count;
              avgY /= count;
              avgZ /= count;
              
              positions[idx] = positions[idx] * (1 - influence) + avgX * influence;
              positions[idx + 1] = positions[idx + 1] * (1 - influence) + avgY * influence;
              positions[idx + 2] = positions[idx + 2] * (1 - influence) + avgZ * influence;
            }
            break;
            
          case 'inflate':
            displacement = normal.clone().multiplyScalar(influence * (mode === 'add' ? 1 : -1));
            break;
            
          case 'pinch':
            const toCenter = localCenter.clone().sub(vertex).normalize();
            displacement = toCenter.multiplyScalar(influence * (mode === 'add' ? -1 : 1));
            break;
            
          case 'flatten':
            const planeDistance = brushNormal.dot(vertex.clone().sub(localCenter));
            displacement = brushNormal.clone().multiplyScalar(-planeDistance * influence);
            break;
            
          case 'remove':
            displacement = normal.clone().multiplyScalar(-influence);
            break;
            
          default:
            displacement = brushNormal.clone().multiplyScalar(influence * (mode === 'add' ? 1 : -1));
        }
        
        if (operation !== 'smooth') {
          positions[idx] += displacement.x;
          positions[idx + 1] += displacement.y;
          positions[idx + 2] += displacement.z;
        }
      }
    }
    
    if (modified) {
      mesh.geometry.attributes.position.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
      
      if (!mesh.userData.originalPositions) {
        mesh.userData.originalPositions = new Float32Array(positions);
      }
      
      return true;
    }
    
    return false;
  }, []);

  // 13. Автоматическое устранение пересечений
  const fixIntersections = useCallback(() => {
    if (!occlusionPadMesh || !sceneRef.current) return;
    
    const scene = sceneRef.current;
    const otherPads = [];
    
    scene.children.forEach(child => {
      if (child.isMesh && child !== occlusionPadMesh && child.userData?.type === 'occlusion_pad') {
        otherPads.push(child);
      }
    });
    
    otherPads.forEach(otherPad => {
      const box1 = new THREE.Box3().setFromObject(occlusionPadMesh);
      const box2 = new THREE.Box3().setFromObject(otherPad);
      
      const intersection = new THREE.Box3();
      intersection.copy(box1).intersect(box2);
      
      if (!intersection.isEmpty()) {
        const center1 = box1.getCenter(new THREE.Vector3());
        const center2 = box2.getCenter(new THREE.Vector3());
        
        const direction = new THREE.Vector3().subVectors(center1, center2).normalize();
        const overlap = intersection.getSize(new THREE.Vector3());
        const displacement = direction.multiplyScalar(overlap.length() * 0.5);
        
        occlusionPadMesh.position.add(displacement);
        occlusionPadMesh.updateMatrixWorld();
        
        console.log(`Автоматически устранено пересечение, смещение: ${displacement.length().toFixed(2)}`);
      }
    });
  }, [occlusionPadMesh]);

  // 14. Undo/Redo функции
  const undoBrushEdit = useCallback(() => {
    if (historyIndex < 0 || !occlusionPadMesh) return false;
    
    const prevState = editHistory[historyIndex];
    if (prevState && restoreMeshState(occlusionPadMesh, prevState)) {
      setHistoryIndex(historyIndex - 1);
      console.log('Undo выполнено');
      return true;
    }
    
    return false;
  }, [editHistory, historyIndex, occlusionPadMesh, restoreMeshState]);

  const redoBrushEdit = useCallback(() => {
    if (historyIndex >= editHistory.length - 1 || !occlusionPadMesh) return false;
    
    const nextState = editHistory[historyIndex + 1];
    if (nextState && restoreMeshState(occlusionPadMesh, nextState)) {
      setHistoryIndex(historyIndex + 1);
      console.log('Redo выполнено');
      return true;
    }
    
    return false;
  }, [editHistory, historyIndex, occlusionPadMesh, restoreMeshState]);

  // 15. Функции для работы с кистью
  const startBrushStroke = useCallback((event) => {
    if (!sculptMode || !occlusionPadMesh) return;
    
    const intersection = getMouseIntersection(event);
    if (!intersection) return;
    
    setIsDrawing(true);
    setLastBrushPosition(intersection.point);
    
    const currentState = saveMeshState(occlusionPadMesh);
    if (currentState) {
      const newHistory = editHistory.slice(0, historyIndex + 1);
      newHistory.push(currentState);
      setEditHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    
    const modified = applyBrushToMesh(occlusionPadMesh, intersection);
    
    if (modified && onBrushEdit) {
      onBrushEdit(brushConfigRef.current.operation, {
        coordinates: intersection.point,
        normal: intersection.face.normal,
        objectId: occlusionPadMesh.uuid,
        brushSize: brushConfigRef.current.size,
        brushStrength: brushConfigRef.current.strength
      });
    }
    
    showBrushVisualization(intersection.point, intersection.face.normal);
  }, [sculptMode, occlusionPadMesh, getMouseIntersection, saveMeshState, editHistory, historyIndex, applyBrushToMesh, onBrushEdit]);

  const continueBrushStroke = useCallback((event) => {
    if (!isDrawing || !occlusionPadMesh) return;
    
    const intersection = getMouseIntersection(event);
    if (!intersection) return;
    
    if (lastBrushPosition && intersection.point.distanceTo(lastBrushPosition) < 0.5) {
      return;
    }
    
    setLastBrushPosition(intersection.point);
    
    const modified = applyBrushToMesh(occlusionPadMesh, intersection);
    
    if (modified && onBrushEdit) {
      onBrushEdit(brushConfigRef.current.operation, {
        coordinates: intersection.point,
        normal: intersection.face.normal,
        objectId: occlusionPadMesh.uuid,
        brushSize: brushConfigRef.current.size,
        brushStrength: brushConfigRef.current.strength
      });
    }
    
    updateBrushVisualization(intersection.point, intersection.face.normal);
  }, [isDrawing, occlusionPadMesh, getMouseIntersection, lastBrushPosition, applyBrushToMesh, onBrushEdit]);

  const endBrushStroke = useCallback(() => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    setLastBrushPosition(null);
    
    removeBrushVisualization();
    
    if (occlusionPadMesh) {
      fixIntersections();
    }
    
    console.log('Штрих кистью завершен');
  }, [isDrawing, occlusionPadMesh, fixIntersections]);

  const showBrushVisualization = useCallback((position, normal) => {
    removeBrushVisualization();
    
    if (!sceneRef.current || !cameraRef.current) return;
    
    const brushColor = brushConfigRef.current.mode === 'add' ? 0x00ff00 : 0xff0000;
    const brushOpacity = brushConfigRef.current.operation === 'smooth' ? 0.5 : 0.7;
    
    const circleGeometry = new THREE.RingGeometry(
      brushConfigRef.current.size * 0.8,
      brushConfigRef.current.size,
      32
    );
    
    const circleMaterial = new THREE.MeshBasicMaterial({
      color: brushColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: brushOpacity
    });
    
    const circle = new THREE.Mesh(circleGeometry, circleMaterial);
    circle.position.copy(position);
    circle.lookAt(cameraRef.current.position);
    
    const cameraDirection = new THREE.Vector3()
      .subVectors(position, cameraRef.current.position)
      .normalize();
    circle.position.add(cameraDirection.multiplyScalar(0.1));
    
    sceneRef.current.add(circle);
    setBrushVisualization(circle);
  }, []);

  const updateBrushVisualization = useCallback((position, normal) => {
    if (!brushVisualization || !sceneRef.current || !cameraRef.current) return;
    
    brushVisualization.position.copy(position);
    brushVisualization.lookAt(cameraRef.current.position);
    
    const cameraDirection = new THREE.Vector3()
      .subVectors(position, cameraRef.current.position)
      .normalize();
    brushVisualization.position.add(cameraDirection.multiplyScalar(0.1));
  }, [brushVisualization]);

  const removeBrushVisualization = useCallback(() => {
    if (brushVisualization && sceneRef.current) {
      sceneRef.current.remove(brushVisualization);
      setBrushVisualization(null);
    }
  }, [brushVisualization]);

  // 16. Функция подгонки моделей
  const performModelFitting = useCallback(() => {
    if (!sceneRef.current || Object.keys(modelRefs.current).length < 2) {
      console.log("⚠️ Недостаточно моделей для подгонки");
      return;
    }

    console.log("🔧 Запуск подгонки моделей...");
    setIsFitting(true);
    setFittingProgress(0);

    try {
      // Найти верхнюю и нижнюю челюсти
      const upperJaw = modelRefs.current.upperJaw;
      const lowerJaw = modelRefs.current.lowerJaw;

      if (!upperJaw || !lowerJaw) {
        console.log("⚠️ Не найдены модели челюстей для подгонки");
        setIsFitting(false);
        return;
      }

      // Сохранить текущие позиции для возможного отката
      const originalUpperPos = upperJaw.position.clone();
      const originalLowerPos = lowerJaw.position.clone();

      // Обновить прогресс
      setFittingProgress(25);

      // Найти границы моделей для определения правильного позиционирования
      const upperBox = new THREE.Box3().setFromObject(upperJaw);
      const lowerBox = new THREE.Box3().setFromObject(lowerJaw);

      // Центрировать модели относительно друг друга
      const upperCenter = upperBox.getCenter(new THREE.Vector3());
      const lowerCenter = lowerBox.getCenter(new THREE.Vector3());

      // Найти среднюю плоскость между челюстями
      const centerY = (upperBox.min.y + lowerBox.max.y) / 2;

      // Позиционировать верхнюю челюсть над средней плоскостью
      const upperOffsetY = upperCenter.y - upperBox.min.y;
      upperJaw.position.y = centerY + upperOffsetY;

      // Позиционировать нижнюю челюсть под средней плоскостью
      const lowerOffsetY = lowerBox.max.y - lowerCenter.y;
      lowerJaw.position.y = centerY - lowerOffsetY;

      // Обновить прогресс
      setFittingProgress(75);

      // Скрыть модели прикуса при выполнении подгонки
      if (modelRefs.current.bite1) {
        modelRefs.current.bite1.visible = false;
      }
      if (modelRefs.current.bite2) {
        modelRefs.current.bite2.visible = false;
      }

      // Создать визуализацию сборки
      const assemblyViz = createAssemblyVisualization(upperJaw, lowerJaw);
      setAssemblyVisualization(assemblyViz);

      // Обновить прогресс
      setFittingProgress(100);

      // Установить флаг завершения сборки
      setAssemblyCompleted(true);

      console.log("✅ Подгонка моделей завершена");
      console.log(`📍 Новые позиции:`, {
        upper: upperJaw.position.toArray(),
        lower: lowerJaw.position.toArray()
      });

    } catch (error) {
      console.error("❌ Ошибка при подгонке моделей:", error);
      
      // Восстановить оригинальные позиции в случае ошибки
      if (modelRefs.current.upperJaw) {
        modelRefs.current.upperJaw.position.copy(originalUpperPos);
      }
      if (modelRefs.current.lowerJaw) {
        modelRefs.current.lowerJaw.position.copy(originalLowerPos);
      }
    } finally {
      setIsFitting(false);
    }
  }, [createAssemblyVisualization]);

  // Экспортируем функции через ref
  React.useImperativeHandle(ref, () => ({
    resetCamera: () => {
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(200, 200, 200);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    },
    getScene: () => sceneRef.current,
    getCamera: () => cameraRef.current,
    clearScene: () => {
      if (sceneRef.current) {
        Object.values(modelRefs.current).forEach(model => {
          if (model && sceneRef.current) {
            sceneRef.current.remove(model);
            if (model.geometry) model.geometry.dispose();
            if (model.material) {
              if (Array.isArray(model.material)) {
                model.material.forEach(m => m.dispose());
              } else {
                model.material.dispose();
              }
            }
          }
        });
        modelRefs.current = {};
      }
    },
    fitModels: () => {
      performModelFitting();
    },
    generateOcclusionPad: () => {
      generateOcclusionPad();
    },
    setBrushSettings: (settings) => {
      brushConfigRef.current = {
        ...brushConfigRef.current,
        ...settings
      };
    },
    debugScene: () => {
      console.log('=== ДЕБАГ СЦЕНЫ ===');
      Object.entries(modelRefs.current).forEach(([key, model]) => {
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        console.log(`${key}:`, {
          name: model.name,
          type: model.userData?.type,
          isTest: model.userData?.isTestModel,
          position: model.position.toArray(),
          rotation: model.rotation.toArray().map(r => THREE.MathUtils.radToDeg(r).toFixed(1)),
          scale: model.scale.toArray(),
          size: { x: size.x.toFixed(1), y: size.y.toFixed(1), z: size.z.toFixed(1) },
          center: center.toArray(),
          geometry: model.geometry?.type,
          vertices: model.geometry?.attributes?.position?.count || 0,
          material: model.material?.wireframe ? 'wireframe' : 'solid'
        });
      });
    },
    getModelInfo: () => {
      const info = {
        total: Object.keys(modelRefs.current).length,
        real: 0,
        test: 0,
        models: {}
      };
      
      Object.entries(modelRefs.current).forEach(([key, model]) => {
        info.models[key] = {
          isTest: model.userData?.isTestModel || false,
          vertices: model.geometry?.attributes?.position?.count || 0
        };
        if (model.userData?.isTestModel) {
          info.test++;
        } else {
          info.real++;
        }
      });
      
      return info;
    },
    undoEdit: () => undoBrushEdit(),
    redoEdit: () => redoBrushEdit(),
    autoFixIntersections: () => fixIntersections(),
    // Новая функция для управления видимостью прикуса
    toggleBiteVisibility: (visible) => {
      if (modelRefs.current.bite1) {
        modelRefs.current.bite1.visible = visible;
      }
      if (modelRefs.current.bite2) {
        modelRefs.current.bite2.visible = visible;
      }
      console.log(`Прикус ${visible ? 'показан' : 'скрыт'}`);
    },
    // Функция для поиска отсутствующего зуба
    findMissingTooth: () => {
      if (modelRefs.current.upperJaw && modelRefs.current.lowerJaw) {
        return findMissingToothPosition(modelRefs.current.upperJaw, modelRefs.current.lowerJaw);
      }
      return null;
    }
  }), [performModelFitting, generateOcclusionPad, undoBrushEdit, redoBrushEdit, fixIntersections, findMissingToothPosition, createAssemblyVisualization]);

  // ИНИЦИАЛИЗАЦИЯ THREE.JS
  useEffect(() => {
    if (isInitializedRef.current || !mountRef.current) return;
    
    console.log("🔧 Инициализация Three.js сцены...");
    isInitializedRef.current = true;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 600;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 5000);
    camera.position.set(200, 200, 200);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setClearColor(0x1a1a2e, 1);
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.minDistance = 50;
    controls.maxDistance = 1000;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const gridHelper = new THREE.GridHelper(200, 20, 0x444444, 0x222222);
    gridHelper.position.y = -10;
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(50);
    scene.add(axesHelper);

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      console.log("🧹 Очистка ресурсов Three.js...");
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener('resize', handleResize);
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      
      Object.values(modelRefs.current).forEach(model => {
        if (model && model.geometry) model.geometry.dispose();
        if (model && model.material) {
          if (Array.isArray(model.material)) {
            model.material.forEach(m => m.dispose());
          } else {
            model.material.dispose();
          }
        }
      });
      
      isInitializedRef.current = false;
    };
  }, []);

  // ЗАГРУЗКА МОДЕЛЕЙ
  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current) return;

    const loadModels = async () => {
      setError(null);
      setLoading(true);
      setModelLoadStatus({});
      setAssemblyCompleted(false);

      try {
        Object.values(modelRefs.current).forEach(model => {
          if (model && sceneRef.current) {
            sceneRef.current.remove(model);
            if (model.geometry) model.geometry.dispose();
            if (model.material) {
              if (Array.isArray(model.material)) {
                model.material.forEach(m => m.dispose());
              } else {
                model.material.dispose();
              }
            }
          }
        });
        modelRefs.current = {};

        const modelEntries = Object.entries(models || {}).filter(([_, url]) => 
          url && url !== 'null' && url !== 'undefined' && url.trim() !== ''
        );
        
        console.log(`📥 Найдено моделей для загрузки: ${modelEntries.length}`, modelEntries);
        
        const modelColors = {
          upperJaw: 0x4a90e2,
          lowerJaw: 0xe24a4a,
          bite1: 0x4ae24a,
          bite2: 0xe2e24a,
          occlusionPad: 0xff9900
        };

        let realModelsCount = 0;
        let testModelsCount = 0;

        for (const [modelKey, modelUrl] of modelEntries) {
          try {
            if (!modelUrl || typeof modelUrl !== 'string') {
              console.warn(`Пропущен ${modelKey}: неверный URL`);
              continue;
            }

            let mesh = null;
            
            if (modelKey === 'occlusionPad') {
              continue;
            }
            
            const isTestModel = modelUrl === 'data:model/test' || 
                               modelUrl.startsWith('data:model/test;');
            
            if (isTestModel) {
              console.log(`📦 Создание ТЕСТОВОЙ WIREFRAME модели для ${modelKey} (data URL)`);
              mesh = createTestGeometry(modelKey, modelColors[modelKey]);
              testModelsCount++;
            } else {
              console.log(`🚀 Загрузка РЕАЛЬНОЙ модели: ${modelKey} из ${modelUrl.substring(0, 100)}...`);
              
              try {
                const response = await fetch(modelUrl);
                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const contentType = response.headers.get('content-type') || '';
                const buffer = await response.arrayBuffer();
                
                if (buffer.byteLength === 0) {
                  throw new Error('Файл пуст');
                }
                
                const isOBJ = (modelTypes && modelTypes[modelKey]?.toLowerCase() === 'obj') ||
                              contentType.includes('obj') ||
                              modelUrl.toLowerCase().endsWith('.obj');
                const isSTL = (modelTypes && modelTypes[modelKey]?.toLowerCase() === 'stl') ||
                             contentType.includes('stl') ||
                             contentType.includes('application/vnd.ms-pki.stl') ||
                             modelUrl.toLowerCase().endsWith('.stl');
                
                if (isOBJ) {
                  const text = new TextDecoder().decode(buffer);
                  const loader = new OBJLoader();
                  const obj = loader.parse(text);
                  
                  let foundMesh = false;
                  obj.traverse((child) => {
                    if (child.isMesh && !foundMesh) {
                      const material = new THREE.MeshPhongMaterial({
                        color: modelColors[modelKey] || 0x888888,
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.85,
                        shininess: 50,
                        wireframe: false
                      });
                      child.material = material;
                      mesh = child.clone();
                      foundMesh = true;
                    }
                  });
                  
                  if (!foundMesh) {
                    throw new Error('OBJ файл не содержит мешей');
                  }
                } else if (isSTL) {
                  const loader = new STLLoader();
                  const geometry = loader.parse(buffer);
                  
                  if (!geometry.attributes.position || geometry.attributes.position.count === 0) {
                    throw new Error('STL файл пуст или поврежден');
                  }
                  
                  const material = new THREE.MeshPhongMaterial({
                    color: modelColors[modelKey] || 0x888888,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.85,
                    shininess: 50,
                    wireframe: false
                  });
                  
                  mesh = new THREE.Mesh(geometry, material);
                } else {
                  try {
                    const loader = new STLLoader();
                    const geometry = loader.parse(buffer);
                    if (geometry.attributes.position && geometry.attributes.position.count > 0) {
                      const material = new THREE.MeshPhongMaterial({
                        color: modelColors[modelKey] || 0x888888,
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.85,
                        shininess: 50,
                        wireframe: false
                      });
                      mesh = new THREE.Mesh(geometry, material);
                    } else {
                      throw new Error('Не удалось определить формат файла');
                    }
                  } catch {
                    throw new Error(`Неподдерживаемый формат для ${modelKey}`);
                  }
                }
                
                console.log(`✅ РЕАЛЬНАЯ модель ${modelKey} успешно загружена (${(buffer.byteLength / 1024).toFixed(1)} KB)`);
                realModelsCount++;
                
              } catch (fetchError) {
                console.error(`❌ Ошибка загрузки ${modelKey}:`, fetchError);
                mesh = createTestGeometry(modelKey, modelColors[modelKey]);
                testModelsCount++;
              }
            }
            
            if (mesh) {
              mesh.name = modelKey;
              const isTestModel = mesh.userData?.isTestModel || false;
              
              mesh.userData = {
                type: 'model',
                modelKey,
                editable: false,
                isTestModel: isTestModel,
                originalScale: mesh.scale.clone(),
                originalPosition: mesh.position.clone(),
                loadedAt: new Date().toISOString(),
                urlType: isTestModel ? 'data:test' : 'real',
                initiallyVisible: true
              };
              
              // ВАЖНОЕ ИЗМЕНЕНИЕ: Меняем местами верхнюю и нижнюю челюсти
              if (modelKey === 'upperJaw') {
                // Верхняя челюсть теперь будет ПОСЛЕ нижней (снизу)
                mesh.position.set(-20, -15, 0);
              } else if (modelKey === 'lowerJaw') {
                // Нижняя челюсть теперь будет ПЕРЕД верхней (сверху)
                mesh.position.set(20, 15, 0);
              } else if (modelKey === 'bite1') {
                mesh.position.set(0, 0, -10);
                // Прикус изначально видимый
                mesh.visible = true;
              } else if (modelKey === 'bite2') {
                mesh.position.set(0, 0, 10);
                // Прикус изначально видимый
                mesh.visible = true;
              }
              
              sceneRef.current.add(mesh);
              modelRefs.current[modelKey] = mesh;
              
              setModelLoadStatus(prev => ({
                ...prev,
                [modelKey]: {
                  loaded: true,
                  isTest: isTestModel,
                  name: mesh.name
                }
              }));
              
              console.log(`📦 Добавлена модель: ${mesh.name} (${isTestModel ? 'тестовая wireframe' : 'реальная'})`);
            }
            
          } catch (err) {
            console.error(`💥 Критическая ошибка обработки ${modelKey}:`, err);
            setModelLoadStatus(prev => ({
              ...prev,
              [modelKey]: {
                loaded: false,
                error: err.message,
                isTest: false
              }
            }));
          }
        }

        const hasReal = Object.values(modelRefs.current).some(model => 
          !model.userData?.isTestModel
        );
        setHasRealModels(hasReal);
        
        console.log(`📊 ИТОГО: ${realModelsCount} реальных, ${testModelsCount} тестовых моделей`);
        console.log(`📊 Всего моделей на сцене: ${Object.keys(modelRefs.current).length}`);

        if (Object.keys(modelRefs.current).length >= 2) {
          setAssemblyCompleted(false);
          setFittingProgress(0);
          setIsFitting(false);
        }

      } catch (err) {
        console.error('💥 Критическая ошибка загрузки моделей:', err);
        setError(`Ошибка загрузки моделей: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    const createTestGeometry = (modelKey, color) => {
      console.log(`🛠️ Создание ТЕСТОВОЙ геометрии для ${modelKey}`);
      
      let geometry;
      let scale = 1;
      
      if (modelKey.includes('upperJaw') || modelKey === 'upperJaw') {
        geometry = new THREE.CylinderGeometry(8, 6, 12, 16);
        scale = 1.2;
      } else if (modelKey.includes('lowerJaw') || modelKey === 'lowerJaw') {
        geometry = new THREE.CylinderGeometry(7, 5, 10, 16);
        scale = 1.0;
      } else if (modelKey.includes('bite')) {
        geometry = new THREE.BoxGeometry(6, 3, 4);
        scale = 0.8;
      } else {
        geometry = new THREE.BoxGeometry(4, 4, 4);
      }
      
      const material = new THREE.MeshPhongMaterial({
        color: color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
        shininess: 30,
        wireframe: true,
        wireframeLinewidth: 2
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.setScalar(scale);
      mesh.name = `${modelKey}_test`;
      mesh.userData = { 
        type: 'test', 
        modelKey,
        isTestModel: true,
        editable: false,
        createdAt: new Date().toISOString(),
        initiallyVisible: true
      };
      
      return mesh;
    };

    loadModels();
  }, [models, modelTypes]);

  // Отдельный эффект для окклюзионной накладки
  useEffect(() => {
    if (!sceneRef.current) return;
    
    if (showOcclusionPad && assemblyCompleted) {
      if (!occlusionPadMesh && modelRefs.current.upperJaw && modelRefs.current.lowerJaw) {
        const timer = setTimeout(() => {
          console.log("🦷 Автоматическое создание окклюзионной накладки...");
          generateOcclusionPad();
        }, 300);
        
        return () => clearTimeout(timer);
      }
    } else if (occlusionPadMesh && sceneRef.current) {
      sceneRef.current.remove(occlusionPadMesh);
      if (occlusionPadMesh.geometry) occlusionPadMesh.geometry.dispose();
      if (occlusionPadMesh.material) occlusionPadMesh.material.dispose();
      setOcclusionPadMesh(null);
    }
    
  }, [showOcclusionPad, assemblyCompleted, occlusionPadMesh, generateOcclusionPad]);

  // Обработка кликов для редактирования
  const handleCanvasMouseDown = useCallback((event) => {
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;
    
    if (sculptMode && occlusionPadMesh) {
      event.preventDefault();
      startBrushStroke(event);
      return;
    }
    
    const rect = rendererRef.current.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    if (mouseRef.current) {
      mouseRef.current.copy(mouse);
    }
    
    if (raycasterRef.current) {
      raycasterRef.current.setFromCamera(mouse, cameraRef.current);
    }

    const allMeshes = [...Object.values(modelRefs.current)];
    if (occlusionPadMesh) allMeshes.push(occlusionPadMesh);
    
    const intersects = raycasterRef.current ? raycasterRef.current.intersectObjects(allMeshes, true) : [];
    
    if (intersects.length > 0) {
      const { object } = intersects[0];
      
      let model = object;
      while (model.parent && model.parent !== sceneRef.current) {
        model = model.parent;
      }
      
      setActiveModel(model);
    } else {
      setActiveModel(null);
    }
  }, [sculptMode, occlusionPadMesh, startBrushStroke]);

  const handleCanvasMouseMove = useCallback((event) => {
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;
    
    if (sculptMode && isDrawing && occlusionPadMesh) {
      event.preventDefault();
      continueBrushStroke(event);
    }
    
    const rect = rendererRef.current.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    if (raycasterRef.current) {
      raycasterRef.current.setFromCamera(mouse, cameraRef.current);
    }
    
    let isOverEditable = false;
    if (sculptMode && occlusionPadMesh && raycasterRef.current) {
      const intersects = raycasterRef.current.intersectObject(occlusionPadMesh, true);
      isOverEditable = intersects.length > 0;
    }
    
    if (isOverEditable) {
      rendererRef.current.domElement.style.cursor = 'crosshair';
    } else if (activeModel) {
      rendererRef.current.domElement.style.cursor = 'pointer';
    } else {
      rendererRef.current.domElement.style.cursor = 'grab';
    }
  }, [sculptMode, isDrawing, occlusionPadMesh, continueBrushStroke, activeModel]);

  const handleCanvasMouseUp = useCallback(() => {
    if (sculptMode && isDrawing) {
      endBrushStroke();
    }
  }, [sculptMode, isDrawing, endBrushStroke]);

  const handleCanvasMouseLeave = useCallback(() => {
    if (sculptMode && isDrawing) {
      endBrushStroke();
    }
  }, [sculptMode, isDrawing, endBrushStroke]);

  // Сброс камеры
  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(200, 200, 200);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  // Панель управления редактированием кистью
  const renderSculptControls = () => {
    if (!sculptMode) return null;
    
    return (
      <div className="sculpt-controls-panel">
        <h4>🎨 Инструменты редактирования</h4>
        
        <div className="sculpt-tools">
          <button
            className={`sculpt-tool-btn ${brushConfigRef.current.operation === 'sculpt' ? 'active' : ''}`}
            onClick={() => onBrushSettingsChange && onBrushSettingsChange({ operation: 'sculpt' })}
            title="Скульптурирование"
          >
            <span className="tool-icon">🗿</span>
            <span className="tool-name">Скульптура</span>
          </button>
          <button
            className={`sculpt-tool-btn ${brushConfigRef.current.operation === 'smooth' ? 'active' : ''}`}
            onClick={() => onBrushSettingsChange && onBrushSettingsChange({ operation: 'smooth' })}
            title="Сглаживание"
          >
            <span className="tool-icon">✨</span>
            <span className="tool-name">Сглаживание</span>
          </button>
          <button
            className={`sculpt-tool-btn ${brushConfigRef.current.operation === 'inflate' ? 'active' : ''}`}
            onClick={() => onBrushSettingsChange && onBrushSettingsChange({ operation: 'inflate' })}
            title="Раздутие"
          >
            <span className="tool-icon">🔵</span>
            <span className="tool-name">Раздутие</span>
          </button>
          <button
            className={`sculpt-tool-btn ${brushConfigRef.current.operation === 'pinch' ? 'active' : ''}`}
            onClick={() => onBrushSettingsChange && onBrushSettingsChange({ operation: 'pinch' })}
            title="Зажим"
          >
            <span className="tool-icon">🤏</span>
            <span className="tool-name">Зажим</span>
          </button>
          <button
            className={`sculpt-tool-btn ${brushConfigRef.current.operation === 'flatten' ? 'active' : ''}`}
            onClick={() => onBrushSettingsChange && onBrushSettingsChange({ operation: 'flatten' })}
            title="Выравнивание"
          >
            <span className="tool-icon">📏</span>
            <span className="tool-name">Выравнивание</span>
          </button>
          <button
            className={`sculpt-tool-btn ${brushConfigRef.current.operation === 'remove' ? 'active' : ''}`}
            onClick={() => onBrushSettingsChange && onBrushSettingsChange({ operation: 'remove' })}
            title="Удаление"
          >
            <span className="tool-icon">🔥</span>
            <span className="tool-name">Удаление</span>
          </button>
        </div>
        
        <div className="brush-settings">
          <div className="brush-setting">
            <label>Размер кисти: {brushConfigRef.current.size.toFixed(1)}</label>
            <input
              type="range"
              min="1"
              max="30"
              step="0.5"
              value={brushConfigRef.current.size}
              onChange={(e) => onBrushSettingsChange && onBrushSettingsChange({ size: parseFloat(e.target.value) })}
            />
          </div>
          
          <div className="brush-setting">
            <label>Сила кисти: {brushConfigRef.current.strength.toFixed(1)}</label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={brushConfigRef.current.strength}
              onChange={(e) => onBrushSettingsChange && onBrushSettingsChange({ strength: parseFloat(e.target.value) })}
            />
          </div>
          
          <div className="brush-setting">
            <label>Falloff: {brushConfigRef.current.falloff.toFixed(1)}</label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={brushConfigRef.current.falloff}
              onChange={(e) => onBrushSettingsChange && onBrushSettingsChange({ falloff: parseFloat(e.target.value) })}
            />
          </div>
          
          <div className="brush-mode-selector">
            <button
              className={`brush-mode-btn ${brushConfigRef.current.mode === 'add' ? 'active' : ''}`}
              onClick={() => onBrushSettingsChange && onBrushSettingsChange({ mode: 'add' })}
              title="Добавление материала"
            >
              ➕ Добавить
            </button>
            <button
              className={`brush-mode-btn ${brushConfigRef.current.mode === 'subtract' ? 'active' : ''}`}
              onClick={() => onBrushSettingsChange && onBrushSettingsChange({ mode: 'subtract' })}
              title="Удаление материала"
            >
              ➖ Удалить
            </button>
          </div>
        </div>
        
        <div className="sculpt-actions">
          <button
            className="action-btn undo"
            onClick={undoBrushEdit}
            title="Отменить"
            disabled={historyIndex < 0}
          >
            ↩️ Отменить
          </button>
          <button
            className="action-btn redo"
            onClick={redoBrushEdit}
            title="Повторить"
            disabled={historyIndex >= editHistory.length - 1}
          >
            ↪️ Повторить
          </button>
          <button
            className="action-btn auto-fix"
            onClick={fixIntersections}
            title="Автоматическая адаптация"
          >
            🔄 Автоадаптация
          </button>
          <button
            className="action-btn toggle-bite"
            onClick={() => {
              if (modelRefs.current.bite1) {
                const isVisible = modelRefs.current.bite1.visible;
                modelRefs.current.bite1.visible = !isVisible;
                if (modelRefs.current.bite2) {
                  modelRefs.current.bite2.visible = !isVisible;
                }
                console.log(`Прикус ${!isVisible ? 'показан' : 'скрыт'}`);
              }
            }}
            title="Показать/скрыть прикус"
          >
            👁️ Прикус
          </button>
        </div>
      </div>
    );
  };

  // RENDER
  if (error) {
    return (
      <div className="viewer-error">
        <h4>⚠️ Ошибка 3D просмотра</h4>
        <p>{error}</p>
        <button 
          onClick={() => setError(null)}
          className="error-close-btn"
        >
          Закрыть
        </button>
      </div>
    );
  }

  return (
    <div className="three-d-viewer-container">
      <div className="three-d-viewer-header">
        <div className="viewer-title">
          <span className="viewer-title-icon">👁️</span>
          3D Просмотр моделей
          <span className="model-counter">
            ({Object.keys(modelRefs.current).length} моделей)
          </span>
        </div>
        <div className="viewer-status">
          <div className={`viewer-status-item ${loading ? 'loading' : 'ready'}`}>
            <span className="viewer-status-icon"></span>
            {loading ? 'Загрузка...' : 'Готово'}
          </div>
          {isFitting && (
            <div className="viewer-status-item fitting">
              <span className="viewer-status-icon"></span>
              Подгонка: {fittingProgress}%
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${fittingProgress}%` }}
                />
              </div>
            </div>
          )}
          {activeModel && (
            <div className="viewer-status-item active">
              <span className="viewer-status-icon"></span>
              Выбрано: {activeModel.name}
              {activeModel.userData?.isTestModel && <span className="test-badge">тест</span>}
            </div>
          )}
          {sculptMode && (
            <div className="viewer-status-item sculpt-mode">
              <span className="viewer-status-icon" style={{background: '#9c27b0'}}></span>
              Режим скульптинга
              {isDrawing && <span className="drawing-badge">рисует</span>}
            </div>
          )}
          {assemblyCompleted && (
            <div className="viewer-status-item success">
              <span className="viewer-status-icon" style={{background: '#4CAF50'}}></span>
              Сборка завершена
            </div>
          )}
        </div>
      </div>

      <div
        ref={mountRef}
        className={`viewer-canvas ${sculptMode ? 'sculpting' : ''}`}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseLeave}
      />

      <div className="viewer-controls">
        <button
          className="control-btn reset"
          onClick={resetCamera}
          title="Сбросить камеру"
        >
          🔄
        </button>
        <button
          className="control-btn fit"
          onClick={() => {
            if (assemblyVisualization && sceneRef.current) {
              sceneRef.current.remove(assemblyVisualization);
              setAssemblyVisualization(null);
            }
            setAssemblyCompleted(false);
            performModelFitting();
          }}
          title="Подогнать и собрать модели"
          disabled={isFitting || Object.keys(modelRefs.current).length < 2}
        >
          {isFitting ? '⚙️' : '🔧'}
        </button>
        <button
          className="control-btn generate"
          onClick={generateOcclusionPad}
          title="Создать окклюзионную накладку-заместитель"
          disabled={!assemblyCompleted}
        >
          🦷
        </button>
        <button
          className={`control-btn sculpt ${sculptMode ? 'active' : ''}`}
          onClick={() => onBrushSettingsChange && onBrushSettingsChange({ sculptMode: !sculptMode })}
          title="Режим редактирования кистью"
          disabled={!occlusionPadMesh}
        >
          {sculptMode ? '✏️' : '🖌️'}
        </button>
        <button
          className="control-btn debug"
          onClick={() => ref?.current?.debugScene?.()}
          title="Информация о сцене"
        >
          🔍
        </button>
        <button
          className="control-btn help"
          onClick={() => setShowHelp(!showHelp)}
          title="Показать подсказки"
        >
          ?
        </button>
        <button
          className="control-btn toggle-bite"
          onClick={() => {
            if (modelRefs.current.bite1) {
              const isVisible = modelRefs.current.bite1.visible;
              modelRefs.current.bite1.visible = !isVisible;
              if (modelRefs.current.bite2) {
                modelRefs.current.bite2.visible = !isVisible;
              }
            }
          }}
          title="Показать/скрыть прикус"
        >
          👁️
        </button>
      </div>

      {renderSculptControls()}

      {showHelp && (
        <div className="viewer-tooltip show">
          <h4>💡 Подсказки по управлению</h4>
          <ul>
            <li><strong>Сборка (🔧)</strong> — совмещает челюсти по высоте передних зубов и автоматически скрывает прикус</li>
            <li><strong>Прикус скрыт</strong> — после сборки модель прикуса автоматически скрывается</li>
            <li><strong>Показать/скрыть прикус (👁️)</strong> — управление видимостью модели прикуса</li>
            <li><strong>Окклюзионная накладка (🦷)</strong> — создается на месте отсутствующего зуба</li>
            <li><strong>Умное позиционирование</strong> — система анализирует зубной ряд и находит место для накладки</li>
            <li><strong>Реалистичная форма</strong> — накладка имеет форму моляра с жевательной поверхностью</li>
            <li><strong>Режим скульптинга (🖌️/✏️)</strong> — позволяет редактировать накладку кистью</li>
            <li><strong>Удерживайте ЛКМ</strong> для рисования кистью в режиме скульптинга</li>
            <li><strong>Зеленая подсветка</strong> — временно показывает место установки накладки</li>
          </ul>
        </div>
      )}
    </div>
  );
});

ThreeDViewer2.displayName = 'ThreeDViewer2';
export default ThreeDViewer2;