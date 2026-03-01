import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { usePatientNavigation } from '../hooks/usePatientNavigation';
import ArchiveUpload from './ArchiveUpload';
import './CTModule.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const CTModule = () => {
  const { id } = useParams();
  const patientId = id ? parseInt(id) : 1;
  
  usePatientNavigation(patientId);

  const [ctData, setCtData] = useState({
    scanDate: null,
    archiveName: null,
    dicomFiles: [],
    loaded: false,
    error: null
  });

  const [viewerMode, setViewerMode] = useState('3d'); // '3d' или 'slices'
  const [currentSlice, setCurrentSlice] = useState(0);
  const [volumeData, setVolumeData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Three.js refs
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const volumeMeshRef = useRef(null);
  const frameRef = useRef(null);

  // Canvas refs для срезов
  const canvasRef = useRef(null);

  // Проверка загруженных КТ при монтировании
  useEffect(() => {
    loadExistingCT();
  }, [patientId]);

  // Загрузка существующих КТ данных
  const loadExistingCT = async () => {
    try {
      setLoading(true);
      
      // Пробуем загрузить из localStorage
      const savedCT = localStorage.getItem(`ct_data_${patientId}`);
      if (savedCT) {
        const ct = JSON.parse(savedCT);
        if (ct.dicomFiles && ct.dicomFiles.length > 0) {
          // Загружаем данные срезов
          const slices = await loadSlicesFromFiles(ct.dicomFiles);
          if (slices.length > 0) {
            setCtData({
              ...ct,
              dicomFiles: slices,
              loaded: true
            });
            setCurrentSlice(Math.floor(slices.length / 2));
            return;
          }
        }
      }
      
      setCtData(prev => ({ ...prev, loaded: false }));
    } catch (error) {
      console.error('Error loading existing CT:', error);
      setCtData(prev => ({ ...prev, error: error.message }));
    } finally {
      setLoading(false);
    }
  };

  // Загрузка срезов из файлов
  const loadSlicesFromFiles = async (files) => {
    const slices = [];
    
    for (const file of files) {
      try {
        if (file.data_url) {
          const response = await fetch(file.data_url);
          const buffer = await response.arrayBuffer();
          const slice = await parseDicomSlice(buffer);
          if (slice) {
            slices.push({
              ...slice,
              name: file.name,
              data_url: file.data_url
            });
          }
        }
      } catch (error) {
        console.warn('Error loading slice:', file.name, error);
      }
    }
    
    // Сортируем по номеру среза
    slices.sort((a, b) => (a.sliceNumber || 0) - (b.sliceNumber || 0));
    
    return slices;
  };

  // Простой парсер DICOM (упрощенный)
  const parseDicomSlice = async (arrayBuffer) => {
    try {
      // Пробуем использовать dicomParser если доступен
      let pixelData = null;
      let rows = 256;
      let columns = 256;
      let sliceNumber = 0;
      
      // Пробуем как base64 изображение
      try {
        const byteArray = new Uint8Array(arrayBuffer);
        // Проверяем, является ли это DICOM по сигнатуре
        if (byteArray[0] === 0x44 && byteArray[1] === 0x49 && byteArray[2] === 0x43 && byteArray[3] === 0x4D) {
          // Это DICOM - используем упрощенный парсинг
          // Для простоты, попробуем найти pixel данные
          // Или просто покажем как есть
        }
        
        // Пробуем загрузить как обычное изображение
        const blob = new Blob([byteArray]);
        const url = URL.createObjectURL(blob);
        
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            
            resolve({
              rows: img.height,
              columns: img.width,
              pixelData: imageData.data,
              sliceNumber: sliceNumber
            });
            URL.revokeObjectURL(url);
          };
          img.onerror = () => {
            resolve(null);
            URL.revokeObjectURL(url);
          };
          img.src = url;
        });
      } catch (e) {
        console.warn('Error parsing DICOM:', e);
        return null;
      }
    } catch (error) {
      console.warn('Error parsing DICOM slice:', error);
      return null;
    }
  };

  // Инициализация 3D вьювера
  useEffect(() => {
    if (viewerMode !== '3d' || !mountRef.current || ctData.dicomFiles.length === 0) return;

    // Очищаем предыдущий вьювер
    if (mountRef.current && mountRef.current.children.length > 0) {
      mountRef.current.innerHTML = '';
    }

    // Создаём сцену
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Камера
    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 150);
    cameraRef.current = camera;

    // Рендерер
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Создаём volume из срезов
    createVolumeFromSlices();

    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Анимация
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Ресайз
    const handleResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        mountRef.current?.removeChild(rendererRef.current.domElement);
      }
    };
  }, [viewerMode, ctData.dicomFiles]);

  // Создание 3D объёма из срезов
  const createVolumeFromSlices = () => {
    if (!sceneRef.current || ctData.dicomFiles.length === 0) return;

    // Удаляем старый объём
    if (volumeMeshRef.current) {
      sceneRef.current.remove(volumeMeshRef.current);
      volumeMeshRef.current.geometry?.dispose();
      volumeMeshRef.current.material?.dispose();
    }

    // Создаём группу для всех срезов
    const volumeGroup = new THREE.Group();
    volumeGroup.name = 'volume';

    // Добавляем каждый срез как плоскость
    const sliceCount = ctData.dicomFiles.length;
    const spacing = 2; // Расстояние между срезами

    ctData.dicomFiles.forEach((slice, index) => {
      // Создаём текстуру из данных среза
      if (slice.pixelData) {
        const width = slice.columns || 256;
        const height = slice.rows || 256;
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        const imageData = ctx.createImageData(width, height);
        // Копируем данные пикселей
        for (let i = 0; i < slice.pixelData.length; i++) {
          imageData.data[i] = slice.pixelData[i];
        }
        ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(canvas);
        
        // Создаём плоскость для среза
        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = (index - sliceCount / 2) * spacing;
        volumeGroup.add(mesh);
      }
    });

    // Центрируем объём
    const box = new THREE.Box3().setFromObject(volumeGroup);
    const center = box.getCenter(new THREE.Vector3());
    volumeGroup.children.forEach(child => {
      child.position.sub(center);
    });

    // Добавляем подсветку
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    sceneRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    sceneRef.current.add(directionalLight);

    sceneRef.current.add(volumeGroup);
    volumeMeshRef.current = volumeGroup;
  };

  // Отрисовка среза на canvas
  useEffect(() => {
    if (viewerMode !== 'slices' || !canvasRef.current || ctData.dicomFiles.length === 0) return;

    const slice = ctData.dicomFiles[currentSlice];
    if (!slice || !slice.pixelData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = slice.columns || 512;
    const height = slice.rows || 512;

    canvas.width = width;
    canvas.height = height;

    const imageData = ctx.createImageData(width, height);
    
    // Копируем данные пикселей
    for (let i = 0; i < slice.pixelData.length && i < imageData.data.length; i++) {
      imageData.data[i] = slice.pixelData[i];
    }
    
    ctx.putImageData(imageData, 0, 0);
  }, [viewerMode, currentSlice, ctData.dicomFiles]);

  // Обработка успешной загрузки архива
  const handleArchiveUploadSuccess = async (result) => {
    try {
      setLoading(true);
      
      const { uploadedFiles } = result;
      
      if (uploadedFiles.length === 0) {
        setCtData(prev => ({ ...prev, error: 'Из архива не было загружено ни одного файла' }));
        return;
      }

      // Загружаем срезы
      const slices = await loadSlicesFromFiles(uploadedFiles);
      
      if (slices.length === 0) {
        setCtData(prev => ({ ...prev, error: 'Не удалось обработать DICOM файлы' }));
        return;
      }

      // Сохраняем в localStorage
      const ctInfo = {
        scanDate: result.scanDate || new Date().toISOString().split('T')[0],
        archiveName: result.archiveName,
        dicomFiles: uploadedFiles,
        loaded: true
      };
      
      localStorage.setItem(`ct_data_${patientId}`, JSON.stringify({
        ...ctInfo,
        dicomFiles: uploadedFiles.map(f => ({
          id: f.id,
          name: f.name,
          data_url: f.data_url,
          sliceNumber: f.sliceNumber
        }))
      }));

      setCtData({
        scanDate: ctInfo.scanDate,
        archiveName: ctInfo.archiveName,
        dicomFiles: slices,
        loaded: true,
        error: null
      });
      
      setCurrentSlice(Math.floor(slices.length / 2));
      
      alert(`Загружено ${slices.length} срезов КТ`);
    } catch (error) {
      console.error('Error processing CT:', error);
      setCtData(prev => ({ ...prev, error: error.message }));
    } finally {
      setLoading(false);
    }
  };

  // Обработка ошибки загрузки
  const handleArchiveUploadError = (errorMessage) => {
    setCtData(prev => ({ ...prev, error: errorMessage }));
  };

  // Удаление КТ
  const handleDeleteCT = () => {
    if (window.confirm('Вы уверены, что хотите удалить данные КТ?')) {
      localStorage.removeItem(`ct_data_${patientId}`);
      setCtData({
        scanDate: null,
        archiveName: null,
        dicomFiles: [],
        loaded: false,
        error: null
      });
      setCurrentSlice(0);
    }
  };

  // Форматирование даты
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div className="ct-module">
      <h2>Модуль КТ</h2>
      
      {ctData.error && (
        <div className="error-message" style={{ 
          padding: '15px', 
          backgroundColor: '#fee2e2', 
          color: '#dc2626',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {ctData.error}
          <button 
            onClick={() => setCtData(prev => ({ ...prev, error: null }))}
            style={{ marginLeft: '10px', padding: '5px 10px' }}
          >
            Закрыть
          </button>
        </div>
      )}

      {!ctData.loaded ? (
        <div className="ct-upload-section">
          <h3>Загрузка КТ</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Загрузите ZIP архив с DICOM файлами компьютерной томографии
          </p>
          
          <ArchiveUpload
            onUploadSuccess={handleArchiveUploadSuccess}
            onUploadError={handleArchiveUploadError}
            patientId={patientId}
            enableBackendUpload={false}
          />
        </div>
      ) : (
        <div className="ct-viewer-section">
          <div className="ct-info" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px'
          }}>
            <div>
              <h3 style={{ margin: '0 0 5px 0' }}>КТ от {formatDate(ctData.scanDate)}</h3>
              <p style={{ margin: 0, color: '#666' }}>
                Архив: {ctData.archiveName} | Срезов: {ctData.dicomFiles.length}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setViewerMode(viewerMode === '3d' ? 'slices' : '3d')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {viewerMode === '3d' ? 'Показать срезы' : 'Показать 3D'}
              </button>
              <button
                onClick={handleDeleteCT}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Удалить КТ
              </button>
            </div>
          </div>

          {/* 3D Viewer */}
          {viewerMode === '3d' && (
            <div 
              ref={mountRef} 
              style={{
                width: '100%',
                height: '500px',
                backgroundColor: '#1a1a1a',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              {ctData.dicomFiles.length === 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#999'
                }}>
                  Нет данных для отображения
                </div>
              )}
            </div>
          )}

          {/* Slices Viewer */}
          {viewerMode === 'slices' && (
            <div className="slices-viewer" style={{
              width: '100%',
              backgroundColor: '#1a1a1a',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <canvas
                  ref={canvasRef}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '450px',
                    imageRendering: 'pixelated'
                  }}
                />
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                color: 'white'
              }}>
                <button
                  onClick={() => setCurrentSlice(Math.max(0, currentSlice - 1))}
                  disabled={currentSlice === 0}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: currentSlice === 0 ? '#4b5563' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: currentSlice === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ← Предыдущий
                </button>
                
                <div style={{ minWidth: '150px', textAlign: 'center' }}>
                  Срез {currentSlice + 1} из {ctData.dicomFiles.length}
                </div>
                
                <input
                  type="range"
                  min="0"
                  max={ctData.dicomFiles.length - 1}
                  value={currentSlice}
                  onChange={(e) => setCurrentSlice(parseInt(e.target.value))}
                  style={{ width: '200px' }}
                />
                
                <button
                  onClick={() => setCurrentSlice(Math.min(ctData.dicomFiles.length - 1, currentSlice + 1))}
                  disabled={currentSlice === ctData.dicomFiles.length - 1}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: currentSlice === ctData.dicomFiles.length - 1 ? '#4b5563' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: currentSlice === ctData.dicomFiles.length - 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Следующий →
                </button>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {loading && (
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '20px 40px',
              borderRadius: '8px',
              zIndex: 1000
            }}>
              Загрузка данных КТ...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CTModule;
