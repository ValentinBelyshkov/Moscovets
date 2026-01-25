import React, { useState } from 'react';
import archiveService from '../services/archiveService';
import ctService from '../services/ctService';

const ArchiveUpload = ({ onUploadSuccess, onUploadError, patientId = 1, scanDate, enableBackendUpload = false }) => {
  const [archiveFile, setArchiveFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [archiveInfo, setArchiveInfo] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Обработка выбора файла
  const handleFileSelect = (file) => {
    if (!file) return;
    
    // Валидация архива
    const validation = archiveService.validateArchive(file);
    if (!validation.isValid) {
      onUploadError && onUploadError(validation.errors.join('\n'));
      return;
    }
    
    setArchiveFile(file);
    setArchiveInfo(null);
    
    // Получаем информацию об архиве
    archiveService.getArchiveInfo(file)
      .then(info => {
        setArchiveInfo(info);
        if (info.dicomFiles === 0) {
          onUploadError && onUploadError('В архиве не найдено DICOM файлов (.dcm)');
        }
      })
      .catch(error => {
        onUploadError && onUploadError(`Ошибка при чтении архива: ${error.message}`);
      });
  };

  // Обработка изменения файла
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Обработка загрузки архива
  const handleArchiveUpload = async () => {
    if (!archiveFile) {
      onUploadError && onUploadError('Пожалуйста, выберите архив');
      return;
    }
    
    if (archiveInfo && archiveInfo.dicomFiles === 0) {
      onUploadError && onUploadError('В архиве не найдено DICOM файлов');
      return;
    }

    if (enableBackendUpload && !scanDate) {
      onUploadError && onUploadError('Пожалуйста, выберите дату сканирования');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      let result;
      
      if (enableBackendUpload && scanDate) {
        // Use backend CT service
        result = await ctService.uploadCTArchive(
          archiveFile,
          patientId,
          scanDate,
          `CT Scan from ${archiveFile.name}`
        );
        
        if (result.success) {
          onUploadSuccess && onUploadSuccess({
            uploadedFiles: result.uploadedFiles,
            dicomFiles: result.dicomFiles,
            totalExtracted: result.totalExtracted,
            archiveName: archiveFile.name,
            scanDate: scanDate,
            storagePath: result.storagePath
          });
        }
      } else {
        // Use local archive service
        result = await archiveService.processArchiveUpload(archiveFile, patientId);
        
        if (result.success) {
          onUploadSuccess && onUploadSuccess({
            uploadedFiles: result.uploadedFiles,
            dicomFiles: result.dicomFiles,
            totalExtracted: result.totalExtracted,
            archiveName: archiveFile.name
          });
        }
      }
      
      // Сброс формы
      setArchiveFile(null);
      setArchiveInfo(null);
    } catch (error) {
      onUploadError && onUploadError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Сброс выбора
  const handleReset = () => {
    setArchiveFile(null);
    setArchiveInfo(null);
  };

  // Форматирование размера файла
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="archive-upload">
      <h3>Загрузка архива с DICOM файлами</h3>
      
      {/* Drag and drop area */}
      <div
        className={`archive-drop-area ${dragActive ? 'drag-active' : ''} ${archiveFile ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="archive-upload"
          accept=".zip"
          onChange={handleFileChange}
          disabled={isProcessing}
          style={{ display: 'none' }}
        />
        
        {!archiveFile ? (
          <div className="drop-area-content">
            <div className="drop-icon">📦</div>
            <p>Перетащите ZIP архив сюда или нажмите для выбора файла</p>
            <p className="drop-hint">Поддерживаются только ZIP архивы, содержащие DICOM файлы (.dcm)</p>
            <label htmlFor="archive-upload" className="browse-button">
              Выбрать архив
            </label>
          </div>
        ) : (
          <div className="selected-file">
            <div className="file-icon">📦</div>
            <div className="file-info">
              <p className="file-name">{archiveFile.name}</p>
              <p className="file-size">Размер: {formatFileSize(archiveFile.size)}</p>
              {archiveInfo && (
                <div className="archive-details">
                  <p>Файлов в архиве: {archiveInfo.totalFiles}</p>
                  <p>DICOM файлов: {archiveInfo.dicomFiles}</p>
                  <p>Размер после распаковки: {formatFileSize(archiveInfo.uncompressedSize)}</p>
                </div>
              )}
            </div>
            <button 
              type="button" 
              className="reset-button"
              onClick={handleReset}
              disabled={isProcessing}
            >
              ✕
            </button>
          </div>
        )}
      </div>
      
      {/* Кнопка загрузки */}
      {archiveFile && archiveInfo && archiveInfo.dicomFiles > 0 && (
        <div className="upload-actions">
          <button
            className="upload-button"
            onClick={handleArchiveUpload}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="spinner"></span>
                Распаковка и загрузка...
              </>
            ) : (
              <>
                📤 Распаковать и загрузить {archiveInfo.dicomFiles} DICOM файлов
              </>
            )}
          </button>
        </div>
      )}
      
      {/* Информация о поддерживаемых форматах */}
      <div className="archive-info">
        <h4>Информация о загрузке архивов:</h4>
        <ul>
          <li>Поддерживаются только ZIP архивы</li>
          <li>Максимальный размер архива: {formatFileSize(archiveService.maxArchiveSize)}</li>
          <li>Архив должен содержать DICOM файлы с расширением .dcm</li>
          <li>Система автоматически определит плоскости по названиям файлов</li>
          <li>Поддерживаются файлы с названиями содержащими: sag/sagittal, cor/coronal, ax/axial/trans</li>
        </ul>
      </div>
    </div>
  );
};

export default ArchiveUpload;