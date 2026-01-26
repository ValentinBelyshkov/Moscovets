import React, { useState, useEffect } from 'react';
import FileUpload from './FileUpload';
import FileVersionHistory from './FileVersionHistory';
// Используем локальный сервис и API сервис для работы с файлами
import localFileService from '../services/localFileService';
import fileService from '../services/fileService';
import './FileVersionHistory.css';

// Use runtime configuration with fallback to build-time environment variable
const getApiBaseUrl = () => {
  // First try runtime config (from env-config.js)
  if (typeof window !== 'undefined' && window._env_ && window._env_.REACT_APP_URL_API) {
    return window._env_.REACT_APP_URL_API;
  }
  // Fallback to build-time environment variable
  return process.env.REACT_APP_URL_API || 'http://109.196.102.193:5001';
};

const API_BASE_URL = 'http://109.196.102.193:5001';

const FileLibrary = ({ onSelectFile, onClose, patientId, fileType }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState(null);

  const currentFileType = fileType || 'mri';

  // Загрузка списка файлов из локального хранилища или API
  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      // Если указан patientId, загружаем через API
      if (patientId) {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Не авторизован');
        }

        let url = `${API_BASE_URL}/files/patient/${patientId}/files`;
        if (currentFileType) {
          url += `?file_type=${currentFileType}`;
        }

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Не удалось загрузить файлы');
        }

        const filesData = await response.json();
        
        const formattedFiles = filesData.map(file => ({
          id: file.id,
          name: file.name,
          type: file.file_type,
          size: file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : 'Unknown',
          uploaded: file.created_at ? new Date(file.created_at).toLocaleDateString('ru-RU') : 'Unknown',
          patient: `Patient ID: ${file.patient_id}`,
          created_at: file.created_at,
          updated_at: file.updated_at
        }));
        setFiles(formattedFiles);
      } else {
        // Иначе загружаем из локального хранилища
        const filesData = await localFileService.getFiles();
        // Преобразуем данные файлов для отображения
        const formattedFiles = filesData.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown',
          uploaded: new Date(file.created_at).toLocaleDateString('ru-RU'),
          patient: `Patient ID: ${file.patient_id}`,
          created_at: file.created_at,
          updated_at: file.updated_at
        }));
        setFiles(formattedFiles);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка файлов при монтировании компонента
  useEffect(() => {
    loadFiles();
  }, [patientId, fileType]);

  const handleUploadSuccess = (newFile) => {
    // Обновляем список файлов из локального хранилища
    loadFiles();
    setShowUploadForm(false);
  };


  const handleDownload = async (fileId) => {
    try {
      let blob;

      // Если указан patientId, используем API для скачивания
      if (patientId) {
        blob = await fileService.downloadFile(fileId);
      } else {
        // Иначе используем локальное хранилище
        const response = await localFileService.downloadFile(fileId);

        // Check if response is a Blob or has data property
        if (response instanceof Blob) {
          blob = response;
        } else if (response && response.data instanceof Blob) {
          blob = response.data;
        } else {
          throw new Error('Invalid response format from downloadFile');
        }
      }

      console.log('FileLibrary creating object URL with blob:', blob);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `file_${fileId}`;
      document.body.appendChild(a);
      a.click();
      // Remove the element after a short delay to ensure download completes
      setTimeout(() => {
        if (document.body.contains(a)) {
          if (a.parentNode && document.body.contains(a)) {
            document.body.removeChild(a);
          }
        }
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Ошибка при скачивании файла: ' + error.message);
    }
  };
  
  const handleShowVersionHistory = (fileId) => {
    setSelectedFileId(fileId);
    setShowVersionHistory(true);
  };

  const handleDelete = async (fileId) => {
    try {
      await localFileService.deleteFile(fileId);
      // Обновляем список файлов после удаления
      loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Ошибка при удалении файла: ' + error.message);
    }
  };

  const handleCleanup = async () => {
    if (window.confirm('Вы уверены, что хотите очистить хранилище? Будут удалены старые файлы.')) {
      try {
        const result = await localFileService.forceCleanup();
        alert(result.message);
        loadFiles(); // Обновляем список файлов
      } catch (error) {
        console.error('Error during cleanup:', error);
        alert('Ошибка при очистке хранилища: ' + error.message);
      }
    }
  };

  return (
    <div className="file-library">
      <h2>Библиотека файлов</h2>
      
      <div className="library-actions">
        <button onClick={() => setShowUploadForm(true)}>Загрузить новый файл</button>
        <button onClick={loadFiles}>Обновить список</button>
        <button onClick={handleCleanup}>Очистить хранилище</button>
        {onClose && (
          <button onClick={onClose}>Закрыть</button>
        )}
      </div>
      
      {loading && <p>Загрузка файлов...</p>}
      {error && <p className="error">Ошибка: {error}</p>}
      
      {showUploadForm && (
        <div className="upload-file-form">
          <FileUpload
            onUploadSuccess={handleUploadSuccess}
            patientId={patientId}
            initialFileType={currentFileType}
          />
          <button type="button" onClick={() => setShowUploadForm(false)}>Отмена</button>
        </div>
      )}
      
      <div className="file-list">
        <h3>Файлы</h3>
        <table>
          <thead>
            <tr>
              <th>Имя</th>
              <th>Тип</th>
              <th>Размер</th>
              <th>Загружен</th>
              <th>Пациент</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {files.map(file => (
              <tr key={file.id}>
                <td>{file.name}</td>
                <td>{file.type}</td>
                <td>{file.size}</td>
                <td>{file.uploaded}</td>
                <td>{file.patient}</td>
                <td>
                  <button onClick={() => handleDownload(file.id)}>Скачать</button>
                  <button onClick={() => handleDelete(file.id)}>Удалить</button>
                  <button onClick={() => handleShowVersionHistory(file.id)}>История</button>
                  {onSelectFile && (
                    <button onClick={() => onSelectFile(file.id)}>Выбрать</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showVersionHistory && (
        <FileVersionHistory
          fileId={selectedFileId}
          onClose={() => setShowVersionHistory(false)}
        />
      )}
    </div>
  );
};

export default FileLibrary;