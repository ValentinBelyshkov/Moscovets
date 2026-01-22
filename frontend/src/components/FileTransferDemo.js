import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import './FileTransferDemo.css';

const FileTransferDemo = () => {
  const { addPatientFile, getPatientFiles, transferData } = useData();
  const [selectedFile, setSelectedFile] = useState(null);
  const [patientId, setPatientId] = useState('');
  const [description, setDescription] = useState('');
  const [transferTarget, setTransferTarget] = useState('');

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile || !patientId) {
      alert('Пожалуйста, выберите файл и укажите ID пациента');
      return;
    }

    try {
      await addPatientFile(selectedFile, patientId, description);
      alert('Файл успешно добавлен и доступен для передачи между модулями!');
      setSelectedFile(null);
      setPatientId('');
      setDescription('');
    } catch (error) {
      alert(`Ошибка добавления файла: ${error.message}`);
    }
  };

  const handleTransfer = () => {
    if (!transferTarget) {
      alert('Пожалуйста, выберите цель для передачи данных');
      return;
    }

    // Получаем файлы пациента
    const files = getPatientFiles(patientId);
    if (files.length === 0) {
      alert('У пациента нет файлов для передачи');
      return;
    }

    // Передаем данные целевому модулю
    transferData('file-transfer-demo', transferTarget, {
      patientId,
      files,
      timestamp: new Date().toISOString()
    });

    alert(`Данные переданы в модуль: ${transferTarget}`);
  };

  return (
    <div className="file-transfer-demo">
      <h2>Демонстрация передачи файлов между модулями</h2>
      
      <div className="upload-section">
        <h3>Добавить файл для пациента</h3>
        <div>
          <label htmlFor="file">Файл:</label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
          />
        </div>
        <div>
          <label htmlFor="patient-id">ID пациента:</label>
          <input
            type="text"
            id="patient-id"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="Введите ID пациента"
          />
        </div>
        <div>
          <label htmlFor="description">Описание:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание файла"
            rows="3"
          ></textarea>
        </div>
        <button onClick={handleUpload}>Добавить файл</button>
      </div>

      <div className="transfer-section">
        <h3>Передать данные в другой модуль</h3>
        <div>
          <label htmlFor="transfer-target">Целевой модуль:</label>
          <select
            id="transfer-target"
            value={transferTarget}
            onChange={(e) => setTransferTarget(e.target.value)}
          >
            <option value="">Выберите модуль</option>
            <option value="cephalometry">Цефалометрия</option>
            <option value="ct">КТ анализ</option>
            <option value="medical-card">Медицинская карта</option>
          </select>
        </div>
        <button onClick={handleTransfer}>Передать данные</button>
      </div>

      <div className="files-list">
        <h3>Файлы пациента</h3>
        {patientId && (
          <div>
            {getPatientFiles(patientId).length > 0 ? (
              <ul>
                {getPatientFiles(patientId).map((file, index) => (
                  <li key={index}>
                    <strong>{file.name}</strong> ({file.type}) - {file.description || 'Без описания'}
                  </li>
                ))}
              </ul>
            ) : (
              <p>У пациента пока нет файлов</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileTransferDemo;