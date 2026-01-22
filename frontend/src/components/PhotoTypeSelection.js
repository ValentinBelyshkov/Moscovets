import React, { useState } from 'react';
import './PhotoTypeSelection.css';

const PhotoTypeSelection = ({ onPhotosSelected }) => {
  // Все типы фотографий для фотометрии
  const photoTypes = [
    { key: 'frontal', name: 'Анфас' },
    { key: 'frontalSmile', name: 'Анфас с улыбкой' },
    { key: 'frontalRetractorsClosed', name: 'Анфас с закрытыми щечками' },
    { key: 'frontalRetractorsOpen', name: 'Анфас с открытыми щечками' },
    { key: 'profileRight', name: 'Профиль справа' },
    { key: 'profileLeft', name: 'Профиль слева' },
    { key: 'profileSmileRight', name: 'Профиль справа с улыбкой' },
    { key: 'profileSmileLeft', name: 'Профиль слева с улыбкой' },
    { key: 'profile45Right', name: 'Профиль 45° справа' },
    { key: 'profile45Left', name: 'Профиль 45° слева' },
    { key: 'intraoralFrontalClosed', name: 'Внутриротовые анфас закрыто' },
    { key: 'intraoralFrontalOpen', name: 'Внутриротовые анфас открыто' },
    { key: 'intraoralRight90', name: 'Внутриротовые справа 90°' },
    { key: 'intraoralRight45', name: 'Внутриротовые справа 45°' },
    { key: 'intraoralLeft90', name: 'Внутриротовые слева 90°' },
    { key: 'intraoralLeft45', name: 'Внутриротовые слева 45°' },
    { key: 'intraoralUpper', name: 'Верхняя челюсть' },
    { key: 'intraoralLower', name: 'Нижняя челюсть' }
  ];

  const [photos, setPhotos] = useState(
    Object.fromEntries(photoTypes.map(type => [type.key, null]))
  );
  
  const [previews, setPreviews] = useState(
    Object.fromEntries(photoTypes.map(type => [type.key, null]))
  );
  
  const [fileNames, setFileNames] = useState(
    Object.fromEntries(photoTypes.map(type => [type.key, '']))
  );

  const handleFileChange = (event, photoType) => {
    const file = event.target.files[0];
    
    if (file) {
      // Validate file type
      if (!file.type.match('image.*')) {
        alert('Пожалуйста, выберите файл изображения (JPEG, PNG)');
        return;
      }
      
      // Set the file
      setPhotos(prev => ({
        ...prev,
        [photoType]: file
      }));
      
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
    // Check if at least one photo is uploaded
    const hasAnyPhotos = Object.values(photos).some(photo => photo !== null);
    
    if (!hasAnyPhotos) {
      alert('Пожалуйста, загрузите хотя бы одно изображение перед продолжением.');
      return;
    }
    
    // Pass the photos to the parent component
    onPhotosSelected(photos);
  };

  const uploadedCount = Object.values(photos).filter(photo => photo !== null).length;

  return (
    <div className="photo-type-selection">
      <h3>Выбор типов фотографий для фотометрии</h3>
      
      <div className="photo-types-container">
        {photoTypes.map(photoType => (
          <div key={photoType.key} className={`photo-type-card ${photos[photoType.key] ? 'selected' : ''}`}>
            <div className="photo-type-header">
              <h4 className="photo-type-title">{photoType.name}</h4>
              <span className={`photo-type-status ${photos[photoType.key] ? 'uploaded' : 'not-uploaded'}`}>
                {photos[photoType.key] ? 'Загружено' : 'Не загружено'}
              </span>
            </div>
            
            <div className="photo-type-content">
              {!previews[photoType.key] ? (
                <div
                  className="upload-area"
                  onClick={() => document.getElementById(`${photoType.key}-upload`).click()}
                >
                  <div className="upload-icon">📁</div>
                  <p className="upload-text">Нажмите для загрузки изображения {photoType.name.toLowerCase()}</p>
                  <button className="upload-button">Выбрать файл</button>
                  <input
                    type="file"
                    accept="image/*"
                    id={`${photoType.key}-upload`}
                    onChange={(e) => handleFileChange(e, photoType.key)}
                    style={{ display: 'none' }}
                  />
                </div>
              ) : (
                <div className="preview-container">
                  <img
                    src={previews[photoType.key]}
                    alt={photoType.name}
                    className="preview-image"
                  />
                  <p className="file-name">{fileNames[photoType.key]}</p>
                  <button
                    className="remove-button"
                    onClick={() => handleRemovePhoto(photoType.key)}
                  >
                    Удалить изображение
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {uploadedCount > 0 && (
        <div className="all-photos-uploaded">
          ✅ Загружено {uploadedCount} изображений. Теперь вы можете перейти к расстановке точек.
        </div>
      )}
      
      <button
        className="continue-button"
        onClick={handleContinue}
        disabled={uploadedCount === 0}
      >
        Продолжить к расстановке точек
      </button>
      
      {uploadedCount === 0 && (
        <p className="instruction">
          Пожалуйста, загрузите хотя бы одно изображение, чтобы продолжить.
        </p>
      )}
    </div>
  );
};

export default PhotoTypeSelection;