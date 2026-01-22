import React, { useState, useEffect } from 'react';
import FileLibrary from './FileLibrary';
// Используем локальный сервис вместо серверного
import localFileService from '../services/localFileService';
import './ImageSelectionModal.css';

const ImageSelectionModal = ({ onImagesSelected, onCancel }) => {
  const [directTRG, setDirectTRG] = useState(null);
  const [lateralTRG, setLateralTRG] = useState(null);
  const [showFileLibraryForDirect, setShowFileLibraryForDirect] = useState(false);
  const [showFileLibraryForLateral, setShowFileLibraryForLateral] = useState(false);
  const [previewDirect, setPreviewDirect] = useState(null);
  const [previewLateral, setPreviewLateral] = useState(null);
  const [fileNameDirect, setFileNameDirect] = useState('');
  const [fileNameLateral, setFileNameLateral] = useState('');

  // Load previously selected images from localStorage on component mount
  useEffect(() => {
    const savedImages = localStorage.getItem('cephalometrySelectedImages');
    if (savedImages) {
      try {
        const parsedImages = JSON.parse(savedImages);
        setDirectTRG(parsedImages.directTRG);
        setLateralTRG(parsedImages.lateralTRG);
        
        // Load previews if files exist
        if (parsedImages.directTRG) {
          loadPreviewImage(parsedImages.directTRG, 'direct');
        }
        if (parsedImages.lateralTRG) {
          loadPreviewImage(parsedImages.lateralTRG, 'lateral');
        }
      } catch (error) {
        console.error('Error loading saved images:', error);
      }
    }
  }, []);

  // Function to load preview image from local file service
  const loadPreviewImage = async (fileId, type) => {
    try {
      const response = await localFileService.downloadFile(fileId);
      
      console.log('ImageSelectionModal load image response:', response);
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
      
      console.log('ImageSelectionModal creating object URL with blob:', blob);
      const imageUrl = URL.createObjectURL(blob);
      
      // Get file name
      const files = await localFileService.getFiles();
      const file = files.find(f => f.id === fileId);
      
      if (type === 'direct') {
        setPreviewDirect(imageUrl);
        setFileNameDirect(file ? file.name : `Файл ${fileId}`);
      } else {
        setPreviewLateral(imageUrl);
        setFileNameLateral(file ? file.name : `Файл ${fileId}`);
      }
    } catch (error) {
      console.error(`Error loading ${type} TRG preview:`, error);
      if (type === 'direct') {
        setPreviewDirect('/placeholder-direct-trg.jpg');
        setFileNameDirect('Ошибка загрузки');
      } else {
        setPreviewLateral('/placeholder-lateral-trg.jpg');
        setFileNameLateral('Ошибка загрузки');
      }
    }
  };

  const handleSelectDirectTRG = async (fileId) => {
    try {
      setDirectTRG(fileId);
      setShowFileLibraryForDirect(false);
      
      // Load preview image
      await loadPreviewImage(fileId, 'direct');
    } catch (error) {
      console.error('Error selecting direct TRG:', error);
      alert('Ошибка при выборе прямого ТРГ: ' + error.message);
    }
  };

  const handleSelectLateralTRG = async (fileId) => {
    try {
      setLateralTRG(fileId);
      setShowFileLibraryForLateral(false);
      
      // Load preview image
      await loadPreviewImage(fileId, 'lateral');
    } catch (error) {
      console.error('Error selecting lateral TRG:', error);
      alert('Ошибка при выборе бокового ТРГ: ' + error.message);
    }
  };

  const handleConfirm = () => {
    if (!directTRG || !lateralTRG) {
      alert('Пожалуйста, выберите оба изображения (прямое ТРГ и боковое ТРГ)');
      return;
    }
    
    // Save selected images to localStorage
    const selectedImages = {
      directTRG: directTRG,
      lateralTRG: lateralTRG,
      fileNameDirect: fileNameDirect,
      fileNameLateral: fileNameLateral
    };
    localStorage.setItem('cephalometrySelectedImages', JSON.stringify(selectedImages));
    
    onImagesSelected(selectedImages);
  };

  const handleRemoveDirect = () => {
    setDirectTRG(null);
    setPreviewDirect(null);
    setFileNameDirect('');
    // Update localStorage
    const currentImages = JSON.parse(localStorage.getItem('cephalometrySelectedImages') || '{}');
    delete currentImages.directTRG;
    delete currentImages.fileNameDirect;
    if (Object.keys(currentImages).length === 0) {
      localStorage.removeItem('cephalometrySelectedImages');
    } else {
      localStorage.setItem('cephalometrySelectedImages', JSON.stringify(currentImages));
    }
  };

  const handleRemoveLateral = () => {
    setLateralTRG(null);
    setPreviewLateral(null);
    setFileNameLateral('');
    // Update localStorage
    const currentImages = JSON.parse(localStorage.getItem('cephalometrySelectedImages') || '{}');
    delete currentImages.lateralTRG;
    delete currentImages.fileNameLateral;
    if (Object.keys(currentImages).length === 0) {
      localStorage.removeItem('cephalometrySelectedImages');
    } else {
      localStorage.setItem('cephalometrySelectedImages', JSON.stringify(currentImages));
    }
  };

  return (
    <div className="image-selection-modal-overlay">
      <div className="image-selection-modal">
        <h2>Выбор изображений для цефалометрии</h2>
        <p>Пожалуйста, выберите оба изображения: прямое ТРГ и боковое ТРГ</p>
        
        <div className="image-selection-container">
          {/* Direct TRG Selection */}
          <div className="image-selection-box">
            <h3>Прямое ТРГ</h3>
            {previewDirect ? (
              <div className="image-preview">
                <img src={previewDirect} alt="Прямое ТРГ" />
                <p className="file-name">{fileNameDirect}</p>
                <button onClick={handleRemoveDirect} className="remove-button">Удалить</button>
              </div>
            ) : (
              <div className="image-placeholder">
                <p>Изображение не выбрано</p>
                <button onClick={() => setShowFileLibraryForDirect(true)}>
                  Выбрать изображение
                </button>
              </div>
            )}
          </div>
          
          {/* Lateral TRG Selection */}
          <div className="image-selection-box">
            <h3>Боковое ТРГ</h3>
            {previewLateral ? (
              <div className="image-preview">
                <img src={previewLateral} alt="Боковое ТРГ" />
                <p className="file-name">{fileNameLateral}</p>
                <button onClick={handleRemoveLateral} className="remove-button">Удалить</button>
              </div>
            ) : (
              <div className="image-placeholder">
                <p>Изображение не выбрано</p>
                <button onClick={() => setShowFileLibraryForLateral(true)}>
                  Выбрать изображение
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-actions">
          <button onClick={handleConfirm} disabled={!directTRG || !lateralTRG}>
            Подтвердить выбор
          </button>
          <button onClick={onCancel}>Отмена</button>
        </div>
        
        {/* File Library for Direct TRG */}
        {showFileLibraryForDirect && (
          <div className="file-library-overlay">
            <div className="file-library-modal">
              <FileLibrary
                onSelectFile={handleSelectDirectTRG}
                onClose={() => setShowFileLibraryForDirect(false)}
              />
              <button onClick={() => setShowFileLibraryForDirect(false)} style={{ marginTop: '10px' }}>
                Закрыть
              </button>
            </div>
          </div>
        )}
        
        {/* File Library for Lateral TRG */}
        {showFileLibraryForLateral && (
          <div className="file-library-overlay">
            <div className="file-library-modal">
              <FileLibrary
                onSelectFile={handleSelectLateralTRG}
                onClose={() => setShowFileLibraryForLateral(false)}
              />
              <button onClick={() => setShowFileLibraryForLateral(false)} style={{ marginTop: '10px' }}>
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageSelectionModal;