import React, { useState, useEffect } from 'react';
import fileService from '../services/fileService';

const FileVersionHistory = ({ fileId, onClose }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Загрузка истории версий файла
  useEffect(() => {
    const fetchVersions = async () => {
      if (!fileId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const versionsData = await fileService.getFileVersions(fileId);
        setVersions(versionsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVersions();
  }, [fileId]);

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return 'Нет данных';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU');
  };

  // Скачивание конкретной версии файла
  const downloadVersion = async (versionId) => {
    try {
      // В текущей реализации бэкенда скачивание конкретной версии не поддерживается
      // Поэтому мы скачиваем основной файл
      const response = await fileService.downloadFile(fileId);
      
      console.log('FileVersionHistory load file response:', response);
      console.log('Response type:', typeof response);
      console.log('Response instanceof Blob:', response instanceof Blob);
      console.log('Response data type:', response && typeof response.data);
      console.log('Response data instanceof Blob:', response && response.data instanceof Blob);
      
      // Check if response is a Blob or has data property
      let blob;
      if (response instanceof Blob) {
        blob = response;
      } else if (response && response.data instanceof Blob) {
        blob = response.data;
      } else {
        throw new Error('Invalid response format from downloadFile');
      }
      
      console.log('FileVersionHistory creating object URL with blob:', blob);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `file_version_${versionId}`;
      document.body.appendChild(a);
      a.click();
      // Remove the element after a short delay to ensure download completes
      setTimeout(() => {
        if (document.body.contains(a)) {
          // Check if element is still attached to DOM before removing
          // Check if element is still attached to DOM before removing
          if (a.parentNode && document.body.contains(a)) {
            document.body.removeChild(a);
          }
        }
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error downloading version:', error);
      alert('Ошибка при скачивании версии файла');
    }
  };

  if (loading) {
    return (
      <div className="file-version-history">
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>История версий файла</h3>
            <p>Загрузка...</p>
            <button onClick={onClose}>Закрыть</button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="file-version-history">
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>История версий файла</h3>
            <p className="error">Ошибка: {error}</p>
            <button onClick={onClose}>Закрыть</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="file-version-history">
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>История версий файла</h3>
          
          {versions.length === 0 ? (
            <p>Нет истории версий для этого файла</p>
          ) : (
            <div className="versions-list">
              <table>
                <thead>
                  <tr>
                    <th>Версия</th>
                    <th>Дата создания</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((version, index) => (
                    <tr key={version.id}>
                      <td>v{version.version_number}</td>
                      <td>{formatDate(version.created_at)}</td>
                      <td>
                        <button onClick={() => downloadVersion(version.id)}>
                          Скачать
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <button onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
};

export default FileVersionHistory;