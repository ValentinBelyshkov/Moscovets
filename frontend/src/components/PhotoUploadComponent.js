import React, { useState } from 'react';
import './PhotoUploadComponent.css';

const PhotoUploadComponent = ({ onPhotosUploaded }) => {
  const [photos, setPhotos] = useState({
    lateral: null,
    frontal: null
  });
  
  const [previews, setPreviews] = useState({
    lateral: null,
    frontal: null
  });
  
  const [errors, setErrors] = useState({});

  const handleFileChange = (event, projectionType) => {
    const file = event.target.files[0];
    
    if (file) {
      // Validate file type
      if (!file.type.match('image.*')) {
        setErrors(prev => ({
          ...prev,
          [projectionType]: 'Пожалуйста, выберите файл изображения (JPEG, PNG)'
        }));
        return;
      }
      
      // Clear any previous errors
      setErrors(prev => ({
        ...prev,
        [projectionType]: null
      }));
      
      // Set the file
      setPhotos(prev => ({
        ...prev,
        [projectionType]: file
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => ({
          ...prev,
          [projectionType]: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    // Check if both photos are uploaded
    if (!photos.lateral || !photos.frontal) {
      alert('Пожалуйста, загрузите оба изображения перед продолжением.');
      return;
    }
    
    // Pass the photos to the parent component
    onPhotosUploaded(photos);
  };

  return (
    <div className="photo-upload-component">
      <h3>Загрузка фотографий для цефалометрии</h3>
      
      <div className="photo-upload-section">
        <div className="photo-type">
          <h4>Боковая проекция</h4>
          <div className="upload-area">
            <input
              type="file"
              accept="image/*"
              id="lateral-upload"
              onChange={(e) => handleFileChange(e, 'lateral')}
              style={{ display: 'none' }}
            />
            <label htmlFor="lateral-upload" className="upload-button">
              {previews.lateral ? 'Изменить изображение' : 'Загрузить изображение'}
            </label>
            
            {previews.lateral && (
              <div className="preview-container">
                <img 
                  src={previews.lateral} 
                  alt="Боковая проекция" 
                  className="preview-image"
                />
                <p className="file-name">{photos.lateral.name}</p>
              </div>
            )}
            
            {errors.lateral && (
              <p className="error-message">{errors.lateral}</p>
            )}
          </div>
        </div>
        
        <div className="photo-type">
          <h4>Прямая проекция</h4>
          <div className="upload-area">
            <input
              type="file"
              accept="image/*"
              id="frontal-upload"
              onChange={(e) => handleFileChange(e, 'frontal')}
              style={{ display: 'none' }}
            />
            <label htmlFor="frontal-upload" className="upload-button">
              {previews.frontal ? 'Изменить изображение' : 'Загрузить изображение'}
            </label>
            
            {previews.frontal && (
              <div className="preview-container">
                <img 
                  src={previews.frontal} 
                  alt="Прямая проекция" 
                  className="preview-image"
                />
                <p className="file-name">{photos.frontal.name}</p>
              </div>
            )}
            
            {errors.frontal && (
              <p className="error-message">{errors.frontal}</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="submit-section">
        <button 
          className="submit-button"
          onClick={handleSubmit}
          disabled={!photos.lateral || !photos.frontal}
        >
          Продолжить к расстановке точек
        </button>
        
        {!photos.lateral || !photos.frontal ? (
          <p className="instruction">
            Пожалуйста, загрузите оба изображения, чтобы продолжить.
          </p>
        ) : (
          <p className="success-message">
            Хотя бы одно изображение успешно загружено. Теперь вы можете перейти к расстановке точек.
          </p>
        )}
      </div>
    </div>
  );
};

export default PhotoUploadComponent;