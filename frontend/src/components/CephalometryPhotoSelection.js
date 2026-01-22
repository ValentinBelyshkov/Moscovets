import React, { useState } from 'react';
import './PhotoTypeSelection.css';
// Используем локальный сервис для сохранения файлов
import localFileService from '../services/localFileService';

const CephalometryPhotoSelection = ({ onPhotosSelected }) => {
  // Define the two required photo types for cephalometry
  const photoTypes = [
    { id: 'lateral', name: 'Боковая проекция' },
    { id: 'frontal', name: 'Прямая проекция' }
  ];

  const [photos, setPhotos] = useState({
    lateral: null,
    frontal: null
  });
  
  const [previews, setPreviews] = useState({
    lateral: null,
    frontal: null
  });
  
  const [fileNames, setFileNames] = useState({
    lateral: '',
    frontal: ''
  });

  const handleFileChange = async (event, photoType) => {
    const file = event.target.files[0];
    
    if (file) {
      // Validate file type
      if (!file.type.match('image.*')) {
        alert('Пожалуйста, выберите файл изображения (JPEG, PNG)');
        return;
      }
      
      // Set the file name
      setFileNames(prev => ({
        ...prev,
        [photoType]: file.name
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => ({
          ...prev,
          [photoType]: e.target.result
        }));
      };
      reader.readAsDataURL(file);
      
      // Save file to local storage automatically
      try {
        const fileName = file.name;
        const fileExtension = fileName.split('.').pop();
        const fileData = {
          name: fileName,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified
        };
        
        // Upload file to local storage
        const uploadedFile = await localFileService.uploadFile(file, fileData);
        
        // Update the photos state with the uploaded file
        setPhotos(prev => ({
          ...prev,
          [photoType]: uploadedFile
        }));
        
        console.log(`Файл ${fileName} успешно сохранен в локальное хранилище`);
      } catch (error) {
        console.error('Ошибка при сохранении файла в локальное хранилище:', error);
        alert(`Ошибка при сохранении файла ${file.name}: ${error.message}`);
      }
    }
  };

  const handleRemovePhoto = (photoType) => {
    setPhotos(prev => ({
      ...prev,
      [photoType]: null
    }));
    
    setPreviews(prev => ({
      ...prev,
      [photoType]: null
    }));
    
    setFileNames(prev => ({
      ...prev,
      [photoType]: ''
    }));
  };

  const handleContinue = () => {
    // Allow continuing with at least one photo uploaded
    // Pass the photos to the parent component regardless of whether both are uploaded
    onPhotosSelected(photos);
  };

  const areBothPhotosUploaded = photos.lateral && photos.frontal;
  const hasAtLeastOnePhoto = photos.lateral || photos.frontal;

  return (
    <div className="photo-type-selection">
      <h3>Выбор типов рентгеновских снимков для цефалометрии</h3>
      
      <div className="photo-types-container">
        {photoTypes.map(photoType => (
          <div key={photoType.id} className={`photo-type-card ${photos[photoType.id] ? 'selected' : ''}`}>
            <div className="photo-type-header">
              <h4 className="photo-type-title">{photoType.name}</h4>
              <span className={`photo-type-status ${photos[photoType.id] ? 'uploaded' : 'not-uploaded'}`}>
                {photos[photoType.id] ? 'Загружено' : 'Не загружено'}
              </span>
            </div>
            
            <div className="photo-type-content">
              {!previews[photoType.id] ? (
                <div 
                  className="upload-area"
                  onClick={() => document.getElementById(`${photoType.id}-upload`).click()}
                >
                  <div className="upload-icon">📁</div>
                  <p className="upload-text">Нажмите для загрузки изображения {photoType.name.toLowerCase()}</p>
                  <button className="upload-button">Выбрать файл</button>
                  <input
                    type="file"
                    accept="image/*"
                    id={`${photoType.id}-upload`}
                    onChange={(e) => handleFileChange(e, photoType.id)}
                    style={{ display: 'none' }}
                  />
                </div>
              ) : (
                <div className="preview-container">
                  <img 
                    src={previews[photoType.id]} 
                    alt={photoType.name} 
                    className="preview-image"
                  />
                  <p className="file-name">{fileNames[photoType.id]}</p>
                  <button 
                    className="remove-button"
                    onClick={() => handleRemovePhoto(photoType.id)}
                  >
                    Удалить изображение
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {hasAtLeastOnePhoto && (
        <div className="all-photos-uploaded">
          ✅ Хотя бы одно изображение успешно загружено. Теперь вы можете перейти к расстановке точек.
        </div>
      )}
      
      <button
        className="continue-button"
        onClick={handleContinue}
        disabled={!hasAtLeastOnePhoto}
      >
        Продолжить к расстановке точек
      </button>
      
      {!hasAtLeastOnePhoto && (
        <p className="instruction">
          Пожалуйста, загрузите хотя бы одно изображение, чтобы продолжить.
        </p>
      )}
    </div>
  );
};

export default CephalometryPhotoSelection;