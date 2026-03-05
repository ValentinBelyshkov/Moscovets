import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { usePatientNavigation } from '../hooks/usePatientNavigation';
import DWVViewer from './DWVViewer';
import JSZip from 'jszip';
import './CTModule.css';

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

  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [archiveInfo, setArchiveInfo] = useState(null);

  // Валидация DICOM файлов
  const validateDicomFiles = (files) => {
    console.log('[CTModule] Validating DICOM files:', files.length);

    const errors = [];
    const validFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Проверяем что это File объект
      if (!(file instanceof File)) {
        errors.push(`Файл ${i + 1} не является File объектом: ${file?.constructor?.name}`);
        continue;
      }

      // Проверяем имя файла
      if (!file.name) {
        errors.push(`Файл ${i + 1} не имеет имени`);
        continue;
      }

      // Проверяем расширение
      const lowerName = file.name.toLowerCase();
      if (!lowerName.endsWith('.dcm') && !lowerName.endsWith('.dicom')) {
        errors.push(`Файл "${file.name}" имеет неверное расширение (ожидаются .dcm или .dicom)`);
      }

      // Проверяем размер
      if (file.size === 0) {
        errors.push(`Файл "${file.name}" имеет размер 0 байт`);
        continue;
      }

      // Проверяем что файл читается
      if (file.size > 0) {
        try {
          // Пытаемся прочитать первые 132 байта (DICOM preamble)
          const reader = new FileReader();
          reader.readAsArrayBuffer(file.slice(0, 132));
        } catch (e) {
          console.warn('[CTModule] Warning: Could not read file:', file.name, e);
        }
      }

      console.log('[CTModule] File validated:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      validFiles.push(file);
    }

    return {
      valid: errors.length === 0,
      errors,
      validFiles
    };
  };

  // Проверка загруженных КТ при монтировании
  useEffect(() => {
    loadExistingCT();
  }, [patientId]);

  // Загрузка существующих КТ данных из localStorage
  const loadExistingCT = async () => {
    try {
      setLoading(true);
      
      const savedCT = localStorage.getItem(`ct_data_${patientId}`);
      if (savedCT) {
        const ct = JSON.parse(savedCT);
        if (ct.dicomFiles && ct.dicomFiles.length > 0) {
          // Загружаем файлы как File объекты если они сохранены
          if (ct.fileBlobs) {
            const files = await loadFilesFromBlobs(ct.fileBlobs);
            setCtData({
              ...ct,
              dicomFiles: files,
              loaded: true
            });
            setSelectedFiles(files);
          } else {
            setCtData({
              ...ct,
              loaded: true
            });
          }
          return;
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

  // Загрузка файлов из сохраненных blob
  const loadFilesFromBlobs = async (fileBlobs) => {
    console.log('[CTModule] Loading files from blobs. Total blobs:', fileBlobs.length);
    const files = [];
    for (let i = 0; i < fileBlobs.length; i++) {
      const blobData = fileBlobs[i];
      try {
        console.log('[CTModule] Reconstructing file from blob:', {
          index: i + 1,
          name: blobData.name,
          type: blobData.type,
          dataLength: blobData.data?.length
        });

        const blob = new Blob([new Uint8Array(blobData.data)], { type: blobData.type });
        console.log('[CTModule] Blob created:', {
          size: blob.size,
          type: blob.type
        });

        const file = new File([blob], blobData.name, { type: blobData.type });
        console.log('[CTModule] File object reconstructed:', {
          name: file.name,
          size: file.size,
          type: file.type,
          constructor: file.constructor.name
        });

        files.push(file);
      } catch (e) {
        console.error('[CTModule] Error loading file from blob:', blobData.name, e);
        console.error('[CTModule] Error stack:', e.stack);
      }
    }
    console.log('[CTModule] Successfully reconstructed files from blobs:', files.length);
    return files;
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(Array.from(e.dataTransfer.files));
    }
  };

  // Обработка выбора файлов
  const handleFilesSelect = async (files) => {
    if (!files || files.length === 0) return;

    // Проверяем, есть ли ZIP архив
    const zipFile = files.find(f => f.name.toLowerCase().endsWith('.zip'));
    
    if (zipFile) {
      await processZipArchive(zipFile);
    } else {
      // Проверяем DICOM файлы
      const dicomFiles = files.filter(f => {
        const name = f.name.toLowerCase();
        return name.endsWith('.dcm') || name.endsWith('.dicom');
      });
      
      if (dicomFiles.length > 0) {
        setSelectedFiles(dicomFiles);
        setArchiveInfo({
          name: 'DICOM файлы',
          totalFiles: dicomFiles.length,
          dicomFiles: dicomFiles.length,
          size: dicomFiles.reduce((sum, f) => sum + f.size, 0)
        });
      } else {
        setCtData(prev => ({ ...prev, error: 'Не найдено DICOM файлов (.dcm) или ZIP архива' }));
      }
    }
  };

  // Обработка ZIP архива
  const processZipArchive = async (zipFile) => {
    try {
      setLoading(true);
      setCtData(prev => ({ ...prev, error: null }));

      console.log('[CTModule] Starting ZIP archive processing:', {
        fileName: zipFile.name,
        fileSize: zipFile.size,
        fileType: zipFile.type,
        lastModified: zipFile.lastModified
      });

      const zip = new JSZip();
      const zipContent = await zip.loadAsync(zipFile);

      console.log('[CTModule] ZIP loaded. Total entries:', Object.keys(zipContent.files).length);

      const dicomFiles = [];
      let totalSize = 0;

      // Извлекаем DICOM файлы из архива
      for (const [relativePath, zipEntry] of Object.entries(zipContent.files || {})) {
        if (zipEntry.dir) {
          console.log('[CTModule] Skipping directory:', relativePath);
          continue;
        }

        const fileName = zipEntry.name.toLowerCase();
        if (fileName.endsWith('.dcm') || fileName.endsWith('.dicom')) {
          try {
            console.log('[CTModule] Extracting DICOM file:', {
              name: zipEntry.name,
              size: zipEntry._data?.uncompressedSize,
              compressedSize: zipEntry._data?.compressedSize,
              date: zipEntry.date
            });

            const blob = await zipEntry.async('blob');
            console.log('[CTModule] Blob created:', {
              size: blob.size,
              type: blob.type
            });

            const file = new File([blob], zipEntry.name, {
              type: 'application/dicom',
              lastModified: zipEntry.date?.getTime() || Date.now()
            });

            console.log('[CTModule] File object created:', {
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
              constructor: file.constructor.name
            });

            dicomFiles.push(file);
            totalSize += file.size;
          } catch (error) {
            console.error('[CTModule] Ошибка при извлечении файла', zipEntry.name, ':', error);
          }
        } else {
          console.log('[CTModule] Skipping non-DICOM file:', zipEntry.name);
        }
      }

      console.log('[CTModule] Extraction complete. DICOM files found:', dicomFiles.length);
      console.log('[CTModule] Total size:', totalSize, 'bytes');

      if (dicomFiles.length === 0) {
        throw new Error('В архиве не найдено DICOM файлов (.dcm или .dicom)');
      }

      // Сортируем файлы по имени (обычно соответствует порядку срезов)
      dicomFiles.sort((a, b) => a.name.localeCompare(b.name));
      console.log('[CTModule] Files sorted. First file:', dicomFiles[0]?.name, 'Last file:', dicomFiles[dicomFiles.length - 1]?.name);

      setSelectedFiles(dicomFiles);
      setArchiveInfo({
        name: zipFile.name,
        totalFiles: Object.keys(zipContent.files).length,
        dicomFiles: dicomFiles.length,
        size: totalSize
      });

      console.log('[CTModule] ZIP processing completed successfully');

    } catch (error) {
      console.error('[CTModule] Error processing ZIP archive:', error);
      console.error('[CTModule] Error stack:', error.stack);
      setCtData(prev => ({ ...prev, error: error.message }));
    } finally {
      setLoading(false);
    }
  };

  // Обработка выбора файла через input
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelect(Array.from(e.target.files));
    }
  };

  // Загрузка и отображение DICOM
  const handleLoadDICOM = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setLoading(true);

      console.log('[CTModule] Loading DICOM into viewer. Files:', selectedFiles.length);

      // Сохраняем файлы в localStorage для persistency
      // Конвертируем файлы в blob для хранения
      console.log('[CTModule] Converting files to localStorage format...');
      const fileBlobs = await Promise.all(
        selectedFiles.map(async (file) => {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            console.log('[CTModule] Converted file:', {
              name: file.name,
              originalSize: file.size,
              arrayBufferSize: arrayBuffer.byteLength,
              uint8ArrayLength: uint8Array.length
            });
            return {
              name: file.name,
              type: file.type,
              data: Array.from(uint8Array)
            };
          } catch (error) {
            console.error('[CTModule] Error converting file', file.name, ':', error);
            throw error;
          }
        })
      );

      const ctInfo = {
        scanDate: new Date().toISOString().split('T')[0],
        archiveName: archiveInfo?.name || 'DICOM файлы',
        dicomFiles: selectedFiles.map(f => ({ name: f.name, size: f.size })),
        fileBlobs: fileBlobs,
        loaded: true
      };

      console.log('[CTModule] Saving to localStorage:', {
        patientId,
        dataLength: JSON.stringify(ctInfo).length,
        filesCount: selectedFiles.length
      });

      localStorage.setItem(`ct_data_${patientId}`, JSON.stringify(ctInfo));

      console.log('[CTModule] Setting ctData state with files:');
      selectedFiles.forEach((f, i) => {
        console.log(`[CTModule]   File ${i + 1}:`, {
          name: f.name,
          size: f.size,
          type: f.type,
          constructor: f.constructor.name
        });
      });

      setCtData({
        ...ctInfo,
        dicomFiles: selectedFiles,
        error: null
      });

      console.log('[CTModule] DICOM loading completed successfully');

    } catch (error) {
      console.error('[CTModule] Error loading DICOM:', error);
      console.error('[CTModule] Error stack:', error.stack);
      setCtData(prev => ({ ...prev, error: error.message }));
    } finally {
      setLoading(false);
    }
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
      setSelectedFiles([]);
      setArchiveInfo(null);
    }
  };

  // Обработка успешной загрузки в DWV
  const handleDWVLoaded = useCallback((data) => {
    console.log('DWV loaded:', data);
  }, []);

  // Обработка ошибки DWV
  const handleDWVError = useCallback((error) => {
    console.error('DWV error:', error);
    setCtData(prev => ({ ...prev, error }));
  }, []);

  // Форматирование размера файла
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{ctData.error}</span>
          <button 
            onClick={() => setCtData(prev => ({ ...prev, error: null }))}
            style={{ 
              padding: '5px 10px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {!ctData.loaded ? (
        <div className="ct-upload-section">
          <h3>Загрузка DICOM КТ</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Загрузите ZIP архив с DICOM файлами или выберите DICOM файлы (.dcm) напрямую
          </p>
          
          {/* Drag and drop area */}
          <div
            className={`archive-drop-area ${dragActive ? 'drag-active' : ''} ${selectedFiles.length > 0 ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: '2px dashed #ccc',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              backgroundColor: dragActive ? '#f0f9ff' : '#f9fafb',
              transition: 'all 0.2s ease',
              marginBottom: '20px'
            }}
          >
            <input
              type="file"
              id="dicom-upload"
              accept=".zip,.dcm,.dicom"
              multiple
              onChange={handleFileChange}
              disabled={loading}
              style={{ display: 'none' }}
            />
            
            {selectedFiles.length === 0 ? (
              <div className="drop-area-content">
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                <p style={{ fontSize: '16px', color: '#374151', marginBottom: '8px' }}>
                  Перетащите ZIP архив или DICOM файлы сюда
                </p>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
                  или нажмите для выбора файлов
                </p>
                <label 
                  htmlFor="dicom-upload" 
                  style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Выбрать файлы
                </label>
              </div>
            ) : (
              <div className="selected-files-info" style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '32px', marginRight: '16px' }}>📁</span>
                  <div>
                    <p style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>
                      {archiveInfo?.name || 'Выбранные файлы'}
                    </p>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                      DICOM файлов: <strong>{archiveInfo?.dicomFiles || selectedFiles.length}</strong>
                      {archiveInfo?.totalFiles > archiveInfo?.dicomFiles && (
                        <span> (всего файлов: {archiveInfo?.totalFiles})</span>
                      )}
                    </p>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
                      Размер: {formatFileSize(archiveInfo?.size || selectedFiles.reduce((sum, f) => sum + f.size, 0))}
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleLoadDICOM}
                    disabled={loading}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: loading ? '#9ca3af' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner" style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: 'white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></span>
                        Загрузка...
                      </>
                    ) : (
                      <>
                        ▶️ Открыть в просмотрщике
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedFiles([]);
                      setArchiveInfo(null);
                    }}
                    disabled={loading}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    ✕ Очистить
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Информация о поддерживаемых форматах */}
          <div style={{
            backgroundColor: '#f3f4f6',
            padding: '16px',
            borderRadius: '8px'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>Информация о загрузке:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280' }}>
              <li>Поддерживаются ZIP архивы с DICOM файлами (.dcm)</li>
              <li>Можно выбрать несколько DICOM файлов одновременно</li>
              <li>Файлы обрабатываются локально, без отправки на сервер</li>
              <li>Все инструменты просмотра доступны после загрузки</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="ct-viewer-section">
          {/* Информация о КТ */}
          <div style={{
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
                {ctData.archiveName} | Срезов: {ctData.dicomFiles?.length || 0}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
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
                🗑️ Удалить КТ
              </button>
            </div>
          </div>

          {/* DWV Viewer */}
          <div style={{
            width: '100%',
            height: '700px',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            {(() => {
              // Валидация файлов перед передачей в DWV
              if (ctData.dicomFiles && ctData.dicomFiles.length > 0) {
                const validation = validateDicomFiles(ctData.dicomFiles);
                if (!validation.valid) {
                  return (
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      borderRadius: '8px',
                      textAlign: 'left'
                    }}>
                      <h3 style={{ marginTop: 0 }}>Ошибки валидации DICOM файлов:</h3>
                      <ul style={{ marginBottom: 0 }}>
                        {validation.errors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  );
                }
              }
              return (
                <DWVViewer
                  files={ctData.dicomFiles}
                  onLoaded={handleDWVLoaded}
                  onError={handleDWVError}
                />
              );
            })()}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CTModule;
