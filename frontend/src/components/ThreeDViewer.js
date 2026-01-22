import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';

const ThreeDViewer = React.forwardRef(({
  models,
  modelTypes,
  points = {},
  selectedPoint,
  onPointAdd,
  onPointSelect,
  showPlanes = { 
    OcclusalPlane: true,
    CurveOfSpee: true,
    ApicalBasisPlane: false,
    ArchPlane: false,
    PontPremolarPlane: false,
    PontMolarPlane: false,
    MidlinePlane: true,
    TransversePlane: false
  },
  activeTool = 'select',
  nextPointToPlace,
  scale = 1.0,
  chainVisualization = true,
  visualizationSettings = {
    showDistances: true,
    showAngles: false,
    showLabels: false,
    showPlanes: true,
    showPoints: true,
    pointType: 'sphere',
    pointSize: 1.0,
    lineWidth: 2,
    planeOpacity: 0.3
  },
  editingMode = false,
}, ref) => {
  console.log('ThreeDViewer - points count:', Object.keys(points).length);

  // Refs
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const transformControlsRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  
  // Храним объекты сцены
  const sceneObjectsRef = useRef({
    models: {},
    points: {},
    lines: {},
    planes: {}
  });
  
  const raycasterRef = useRef(new THREE.Raycaster());
  
  // State
  const [error, setError] = useState(null);
  const [cursorStyle, setCursorStyle] = useState('grab');

  // Экспортируем функции через ref
  React.useImperativeHandle(ref, () => ({
    resetCamera: () => {
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(100, 100, 100);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    }
  }));

  // Создание геометрии точки
  const createPointGeometry = (type, size) => {
    const baseSize = size * visualizationSettings.pointSize;
    switch (type) {
      case 'cube':
        return new THREE.BoxGeometry(baseSize, baseSize, baseSize);
      case 'cylinder':
        return new THREE.CylinderGeometry(baseSize/2, baseSize/2, baseSize, 8);
      case 'tetrahedron':
        return new THREE.TetrahedronGeometry(baseSize);
      case 'pyramid':
        return new THREE.ConeGeometry(baseSize/2, baseSize, 4);
      case 'sphere':
      default:
        return new THREE.SphereGeometry(baseSize, 16, 16);
    }
  };

  // Создание линии измерения
  const createDistanceLine = (start, end, color = 0xff0000) => {
    if (!start || !end) return null;
    
    const pointsArray = [
      new THREE.Vector3(start.x, start.y, start.z),
      new THREE.Vector3(end.x, end.y, end.z)
    ];
    
    const geometry = new THREE.BufferGeometry().setFromPoints(pointsArray);
    const material = new THREE.LineBasicMaterial({
      color,
      linewidth: visualizationSettings.lineWidth,
      transparent: true,
      opacity: 0.8
    });
    
    return new THREE.Line(geometry, material);
  };

  // Очистка объектов сцены
  const clearSceneObjects = (type) => {
    if (!sceneRef.current) return;
    
    const objects = sceneObjectsRef.current[type];
    Object.values(objects).forEach(obj => {
      if (obj && sceneRef.current) {
        sceneRef.current.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }
    });
    sceneObjectsRef.current[type] = {};
  };

  // Обновление точек
  const updatePoints = () => {
    if (!sceneRef.current || !visualizationSettings.showPoints) return;
    
    const currentPoints = points || {};
    const existingPoints = sceneObjectsRef.current.points;
    
    // Удаляем точки, которых больше нет
    Object.keys(existingPoints).forEach(id => {
      if (!currentPoints[id]) {
        const mesh = existingPoints[id];
        if (mesh && sceneRef.current) {
          sceneRef.current.remove(mesh);
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) mesh.material.dispose();
          delete existingPoints[id];
        }
      }
    });
    
    // Создаем или обновляем точки
    Object.entries(currentPoints).forEach(([id, point]) => {
      if (!point || typeof point.x !== 'number') return;
      
      const isSelected = selectedPoint === id;
      const isNext = nextPointToPlace === id;
      
      let color;
      if (isSelected) {
        color = 0xffff00;
      } else if (isNext) {
        color = 0xffa500;
      } else {
        color = 0x00ff00;
      }
      
      const sizeMultiplier = isSelected ? 1.5 : 1.0;
      
      if (existingPoints[id]) {
        // Обновляем существующую точку
        const mesh = existingPoints[id];
        mesh.position.set(point.x, point.y, point.z);
        mesh.material.color.set(color);
        
        // Обновляем размер если нужно
        if ((isSelected && mesh.scale.x !== 1.5) || (!isSelected && mesh.scale.x !== 1.0)) {
          if (mesh.geometry) mesh.geometry.dispose();
          mesh.geometry = createPointGeometry(visualizationSettings.pointType, sizeMultiplier);
        }
      } else {
        // Создаем новую точку
        const geometry = createPointGeometry(visualizationSettings.pointType, sizeMultiplier);
        const material = new THREE.MeshPhongMaterial({ 
          color,
          transparent: true,
          opacity: 0.8
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(point.x, point.y, point.z);
        mesh.userData = { id, isPoint: true };
        
        sceneRef.current.add(mesh);
        existingPoints[id] = mesh;
      }
    });
  };

  // Обновление линий измерений
  const updateMeasurementLines = () => {
    if (!sceneRef.current || !visualizationSettings.showDistances) return;
    
    clearSceneObjects('lines');
    
    const pointEntries = Object.entries(points || {});
    if (pointEntries.length < 2) return;
    
    // Сортируем по ID для создания цепочки
    const sortedPoints = [...pointEntries].sort((a, b) => a[0].localeCompare(b[0]));
    
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const [id1, point1] = sortedPoints[i];
      const [id2, point2] = sortedPoints[i + 1];
      
      if (point1 && point2) {
        const line = createDistanceLine(point1, point2, 0xff0000);
        if (line) {
          sceneRef.current.add(line);
          sceneObjectsRef.current.lines[`${id1}-${id2}`] = line;
        }
      }
    }
  };

  // Обновление плоскостей
  const updatePlanes = () => {
    if (!sceneRef.current || !visualizationSettings.showPlanes) return;
    
    clearSceneObjects('planes');
    
    if (showPlanes.OcclusalPlane) {
      const planePoints = [
        { x: -50, y: 0, z: -50 },
        { x: 50, y: 0, z: -50 },
        { x: 0, y: 0, z: 50 }
      ];
      
      const geometry = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        planePoints[0].x, planePoints[0].y, planePoints[0].z,
        planePoints[1].x, planePoints[1].y, planePoints[1].z,
        planePoints[2].x, planePoints[2].y, planePoints[2].z,
      ]);
      
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geometry.computeVertexNormals();
      
      const material = new THREE.MeshBasicMaterial({
        color: 0x4a90e2,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: visualizationSettings.planeOpacity,
        depthWrite: false,
      });
      
      const plane = new THREE.Mesh(geometry, material);
      sceneRef.current.add(plane);
      sceneObjectsRef.current.planes['OcclusalPlane'] = plane;
    }
    
    if (showPlanes.MidlinePlane) {
      const planePoints = [
        { x: 0, y: -50, z: -50 },
        { x: 0, y: 50, z: -50 },
        { x: 0, y: 0, z: 50 }
      ];
      
      const geometry = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        planePoints[0].x, planePoints[0].y, planePoints[0].z,
        planePoints[1].x, planePoints[1].y, planePoints[1].z,
        planePoints[2].x, planePoints[2].y, planePoints[2].z,
      ]);
      
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geometry.computeVertexNormals();
      
      const material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: visualizationSettings.planeOpacity * 0.5,
        depthWrite: false,
      });
      
      const plane = new THREE.Mesh(geometry, material);
      sceneRef.current.add(plane);
      sceneObjectsRef.current.planes['MidlinePlane'] = plane;
    }
  };

  // Анимационный цикл
  const animate = () => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
    
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    
    animationFrameIdRef.current = requestAnimationFrame(animate);
  };

  // Инициализация Three.js
  useEffect(() => {
    if (!mountRef.current) return;
    
    console.log("🔧 Инициализация Three.js...");
    
    // Создание сцены
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;
    
    // Камера
    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 600;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 5000);
    camera.position.set(100, 100, 100);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Рендерер
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setClearColor(0xf0f0f0, 1);
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    
    // Очищаем и добавляем canvas
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    
    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.screenSpacePanning = true;
    controls.minDistance = 10;
    controls.maxDistance = 1000;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;
    
    // TransformControls
    try {
      const transformControls = new TransformControls(camera, renderer.domElement);
      transformControls.setMode('translate');
      
      // Отключаем OrbitControls когда TransformControls активны
      transformControls.addEventListener('dragging-changed', (event) => {
        controls.enabled = !event.value;
      });
      
      scene.add(transformControls);
      transformControlsRef.current = transformControls;
    } catch (error) {
      console.error("❌ Ошибка создания TransformControls:", error);
    }
    
    // Освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    scene.add(directionalLight);
    
    // Сетка и оси
    const gridHelper = new THREE.GridHelper(200, 20, 0x888888, 0x444444);
    gridHelper.position.y = -10;
    scene.add(gridHelper);
    
    const axesHelper = new THREE.AxesHelper(50);
    scene.add(axesHelper);
    
    // Запускаем анимационный цикл
    animate();
    
    console.log("✅ Three.js инициализирован");
    
    // Обработка изменения размера
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
      console.log("🧹 Очистка Three.js...");
      window.removeEventListener('resize', handleResize);
      
      // Останавливаем анимацию
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      
      // Очищаем все объекты
      Object.keys(sceneObjectsRef.current).forEach(type => {
        clearSceneObjects(type);
      });
      
      if (controlsRef.current) controlsRef.current.dispose();
      if (transformControlsRef.current) transformControlsRef.current.dispose();
      if (rendererRef.current) rendererRef.current.dispose();
      
      sceneRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      transformControlsRef.current = null;
    };
  }, []); // Пустой массив зависимостей - запускается один раз

  // Загрузка моделей
  useEffect(() => {
    if (!sceneRef.current || !models) return;
    
    const loadModels = async () => {
      setError(null);
      
      // Очищаем старые модели
      clearSceneObjects('models');
      
      const modelEntries = Object.entries(models).filter(([_, url]) => url);
      if (modelEntries.length === 0) return;
      
      console.log(`📦 Загрузка ${modelEntries.length} моделей...`);
      
      for (const [modelKey, modelUrl] of modelEntries) {
        try {
          const response = await fetch(modelUrl);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          
          const buffer = await response.arrayBuffer();
          const isOBJ = modelTypes[modelKey]?.toLowerCase() === 'obj';
          
          if (isOBJ) {
            const text = new TextDecoder().decode(buffer);
            const loader = new OBJLoader();
            const obj = loader.parse(text);
            
            const group = new THREE.Group();
            group.name = modelKey;
            
            obj.traverse((child) => {
              if (child.isMesh) {
                const material = new THREE.MeshPhongMaterial({
                  color: modelKey.includes('upper') ? 0x4a90e2 : 0xe24a4a,
                  side: THREE.DoubleSide,
                  transparent: true,
                  opacity: 0.8
                });
                child.material = material;
                group.add(child.clone());
              }
            });
            
            sceneRef.current.add(group);
            sceneObjectsRef.current.models[modelKey] = group;
            
          } else {
            const loader = new STLLoader();
            const geometry = loader.parse(buffer);
            
            const material = new THREE.MeshPhongMaterial({
              color: modelKey.includes('upper') ? 0x4a90e2 : 0xe24a4a,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.8
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.name = modelKey;
            
            // Центрирование
            geometry.computeBoundingBox();
            const bbox = geometry.boundingBox;
            const center = new THREE.Vector3();
            bbox.getCenter(center);
            
            mesh.position.x = -center.x;
            mesh.position.y = -center.y;
            mesh.position.z = -center.z;
            
            // Масштабирование
            const size = new THREE.Vector3();
            bbox.getSize(size);
            const maxSize = Math.max(size.x, size.y, size.z);
            
            if (maxSize < 10) {
              const scale = 50 / maxSize;
              mesh.scale.setScalar(scale);
            }
            
            sceneRef.current.add(mesh);
            sceneObjectsRef.current.models[modelKey] = mesh;
          }
        } catch (err) {
          console.error(`Ошибка загрузки ${modelKey}:`, err);
          setError(`Ошибка загрузки модели ${modelKey}: ${err.message}`);
        }
      }
    };
    
    loadModels();
  }, [models, modelTypes]);

  // Обновление визуализаций
  useEffect(() => {
    if (!sceneRef.current) return;
    
    updatePoints();
    updateMeasurementLines();
    updatePlanes();
  }, [points, selectedPoint, nextPointToPlace, visualizationSettings, showPlanes]);

  // Обновление курсора
  useEffect(() => {
    if (activeTool === 'point' && nextPointToPlace) {
      setCursorStyle('pointer');
    } else if (editingMode) {
      setCursorStyle('move');
    } else {
      setCursorStyle('grab');
    }
  }, [activeTool, nextPointToPlace, editingMode]);

  // Обработка кликов
  const handleCanvasClick = (event) => {
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;
    
    const rect = rendererRef.current.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    raycasterRef.current.setFromCamera(mouse, cameraRef.current);
    
    // Проверка пересечения с точками
    const pointMeshes = Object.values(sceneObjectsRef.current.points);
    const pointIntersects = raycasterRef.current.intersectObjects(pointMeshes);
    
    if (pointIntersects.length > 0) {
      const pointId = pointIntersects[0].object.userData.id;
      
      if ((event.ctrlKey || event.metaKey) || editingMode) {
        // Редактирование точки
        if (transformControlsRef.current) {
          transformControlsRef.current.attach(pointIntersects[0].object);
          transformControlsRef.current.visible = true;
        }
      } else {
        // Выбор точки
        if (onPointSelect) {
          onPointSelect(pointId);
        }
      }
    } else {
      // Проверка пересечения с моделями
      const modelMeshes = Object.values(sceneObjectsRef.current.models);
      const modelIntersects = raycasterRef.current.intersectObjects(modelMeshes, true);
      
      if (modelIntersects.length > 0 && onPointAdd && activeTool === 'point' && nextPointToPlace) {
        // Добавление точки на модель
        const { point } = modelIntersects[0];
        onPointAdd(nextPointToPlace, { 
          x: parseFloat(point.x.toFixed(3)), 
          y: parseFloat(point.y.toFixed(3)), 
          z: parseFloat(point.z.toFixed(3)) 
        });
      } else if (transformControlsRef.current && transformControlsRef.current.visible) {
        // Скрытие контролов
        transformControlsRef.current.detach();
        transformControlsRef.current.visible = false;
      }
    }
  };

  if (error) {
    return (
      <div style={{ 
        width: '100%', 
        height: '500px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#f8d7da', 
        color: '#721c24', 
        padding: '40px', 
        borderRadius: '10px' 
      }}>
        <h4>Ошибка загрузки 3D модели</h4>
        <p>{error}</p>
        <button 
          onClick={() => setError(null)}
          style={{ 
            marginTop: '20px', 
            padding: '10px 20px', 
            background: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer' 
          }}
        >
          Закрыть
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '800px' }}>
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: cursorStyle,
          backgroundColor: '#f0f0f0'
        }}
        onClick={handleCanvasClick}
      />
    </div>
  );
});

ThreeDViewer.displayName = 'ThreeDViewer';
export default ThreeDViewer;