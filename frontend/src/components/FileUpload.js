import React, { useState, useEffect } from 'react';
// Используем локальный сервис и API сервис для работы с файлами
import localFileService from '../services/localFileService';
import fileService from '../services/fileService';

const FileUpload = ({ onUploadSuccess, patientId: initialPatientId, initialFileType = 'photo' }) => {
  const [files, setFiles] = useState([]);
  const [patientId, setPatientId] = useState(initialPatientId || '');
  const [description, setDescription] = useState('');
  const [fileType, setFileType] = useState(initialFileType);
  const [medicalCategory, setMedicalCategory] = useState('clinical');
  const [studyDate, setStudyDate] = useState(new Date().toISOString().split('T')[0]);
  const [bodyPart, setBodyPart] = useState('');
  const [uploading, setUploading] = useState(false);
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 0, percentage: 0, filesCount: 0 });

  // Update patientId and fileType when props change
  useEffect(() => {
    if (initialPatientId) {
      setPatientId(initialPatientId);
    }
  }, [initialPatientId]);

  useEffect(() => {
    if (initialFileType) {
      setFileType(initialFileType);
    }
  }, [initialFileType]);

  // Получение информации о хранилище при монтировании компонента
  useEffect(() => {
    const info = localFileService.getStorageInfo();
    setStorageInfo(info);
  }, []);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    // Получаем актуальную информацию о хранилище
    const info = localFileService.getStorageInfo();
    setStorageInfo(info);
    
    // Проверяем каждый файл на соответствие лимиту
    for (const file of selectedFiles) {
      if (file.size > localFileService.maxStorageSize) { // Используем лимит из сервиса
        alert(`Размер файла ${file.name} превышает допустимый лимит (${localFileService.maxStorageSize / (1024 * 1024)}MB). Пожалуйста, выберите файлы меньшего размера.`);
        e.target.value = ''; // Clear the input
        return;
      }
    }
    setFiles(selectedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0 || !patientId) {
      alert('Пожалуйста, выберите файлы и укажите ID пациента');
      return;
    }

    setUploading(true);

    try {
      let results;

      // Используем API сервис если указан patientId, иначе локальный сервис
      if (patientId) {
        // Загружаем через API на сервер
        const uploadPromises = files.map(file =>
          fileService.uploadFile(file, patientId, fileType, medicalCategory, studyDate, bodyPart, description)
        );

        results = await Promise.all(uploadPromises);
      } else {
        // Загружаем в локальное хранилище
        const uploadPromises = files.map(file =>
          localFileService.uploadFile(file, patientId, fileType, medicalCategory, studyDate, bodyPart, description)
        );

        results = await Promise.all(uploadPromises);

        // Обновляем информацию о хранилище только для локального хранилища
        const info = localFileService.getStorageInfo();
        setStorageInfo(info);
      }

      alert(`Успешно загружено ${results.length} файлов!`);
      onUploadSuccess && onUploadSuccess(results);
      setFiles([]);
      setDescription('');
    } catch (error) {
      console.error('File upload error:', error);
      // Проверяем тип ошибки и показываем соответствующее сообщение
      if (error.message.includes('лимит')) {
        alert(`Ошибка загрузки файлов: ${error.message} Рекомендуется удалить старые файлы для освобождения места.`);
      } else {
        alert(`Ошибка загрузки файлов: ${error.message}`);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload">
      <h3>Загрузить файл</h3>
      {/* Информация о хранилище */}
      <div className="storage-info">
        <p>Использование хранилища: {Math.round(storageInfo.percentage)}% ({Math.round(storageInfo.used / 1024)} KB / {Math.round(storageInfo.total / 1024)} KB)</p>
        <p>Файлов в хранилище: {storageInfo.filesCount}</p>
        {storageInfo.percentage > 80 && (
          <p className="warning">Внимание: Хранилище почти заполнено. Рекомендуется удалить старые файлы.</p>
        )}
      </div>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="file">Файл:</label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            required
            multiple
          />
        </div>
        <div>
          <label htmlFor="patient-id">ID пациента:</label>
          <input
            type="number"
            id="patient-id"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="file-type">Тип файла:</label>
          <select
            id="file-type"
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
          >
            <option value="photo">Фото</option>
            <option value="ct_scan">КТ</option>
            <option value="mri">МРТ</option>
            <option value="stl_model">STL модель</option>
            <option value="xray">Рентген</option>
            <option value="other">Другое</option>
          </select>
        </div>
        <div>
          <label htmlFor="medical-category">Категория:</label>
          <select
            id="medical-category"
            value={medicalCategory}
            onChange={(e) => setMedicalCategory(e.target.value)}
          >
            <option value="clinical">Клиническая</option>
            <option value="diagnostic">Диагностическая</option>
            <option value="treatment">Лечение</option>
            <option value="surgical">Хирургическая</option>
          </select>
        </div>
        <div>
          <label htmlFor="study-date">Дата исследования:</label>
          <input
            type="date"
            id="study-date"
            value={studyDate}
            onChange={(e) => setStudyDate(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="body-part">Область тела:</label>
          <input
            type="text"
            id="body-part"
            value={bodyPart}
            onChange={(e) => setBodyPart(e.target.value)}
            placeholder="напр. верхняя челюсть"
          />
        </div>
        <div>
          <label htmlFor="description">Описание:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
          ></textarea>
        </div>
        <button type="submit" disabled={uploading}>
          {uploading ? 'Загрузка...' : 'Загрузить'}
        </button>
      </form>
    </div>
  );
};

export default FileUpload;