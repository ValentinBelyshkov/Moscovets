import { useCallback } from 'react';
import localFileService from '../../services/localFileService';

export const useCephalometryImageHandlers = (state) => {
  const {
    setCephalometryData,
    setImagesUploaded,
    setActiveTool,
    setLoading,
    setError,
    setShowFileLibrary,
    canvasRef,
    containerRef,
    imageInfoRef,
    cephalometryData
  } = state;

  const handlePhotosSelected = useCallback((photos) => {
    Object.entries(photos).forEach(([photoType, file]) => {
      if (file && file.id) {
        localFileService.downloadFile(file.id).then(response => {
          let blob;
          if (response instanceof Blob) {
            blob = response;
          } else if (response && response.data instanceof Blob) {
            blob = response.data;
          } else {
            console.error('Invalid response format:', response);
            alert('Ошибка: получен неверный формат данных изображения');
            return;
          }
          
          try {
            const imageUrl = URL.createObjectURL(blob);
            
            setCephalometryData(prev => ({
              ...prev,
              images: {
                ...prev.images,
                [photoType]: imageUrl
              },
              imageDimensions: { width: 0, height: 0 }
            }));
            
            if (!cephalometryData.projectionType || cephalometryData.projectionType === 'frontal') {
              setCephalometryData(prev => ({
                ...prev,
                projectionType: photoType
              }));
            }
            
            setActiveTool('scale');
          } catch (urlError) {
            console.error('Ошибка при создании URL изображения:', urlError);
            alert('Ошибка при создании URL изображения: ' + urlError.message);
          }
        }).catch(error => {
          console.error('Ошибка при загрузке изображения из локального хранилища:', error);
          alert('Ошибка при загрузке изображения из локального хранилища: ' + error.message);
        });
      }
    });
  }, [cephalometryData.projectionType, setActiveTool, setCephalometryData]);

  const handleLoadImageFromDatabase = useCallback(async (fileId, projectionType = null) => {
    try {
      setLoading(true);
      const response = await localFileService.downloadFile(fileId);
      
      let blob;
      if (response instanceof Blob) {
        blob = response;
      } else if (response && response.data instanceof Blob) {
        blob = response.data;
      } else {
        throw new Error('Invalid response format from downloadFile');
      }
      
      const imageUrl = URL.createObjectURL(blob);
      
      const img = new Image();
      img.onload = () => {
        const targetProjectionType = projectionType || cephalometryData.projectionType;
        setCephalometryData(prev => ({
          ...prev,
          images: {
            ...prev.images,
            [targetProjectionType]: imageUrl
          },
          projectionType: targetProjectionType,
          imageDimensions: { width: img.width, height: img.height }
        }));
        setActiveTool('scale');
        setLoading(false);
        setShowFileLibrary(false);
      };
      img.src = imageUrl;
    } catch (err) {
      setError('Ошибка при загрузке изображения из локального хранилища: ' + err.message);
      setLoading(false);
    }
  }, [setCephalometryData, cephalometryData.projectionType, setActiveTool, setLoading, setShowFileLibrary, setError]);

  const initializeImageInfo = useCallback((img) => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    
    canvas.width = containerRef.current.clientWidth;
    canvas.height = containerRef.current.clientHeight;
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgWidth = img.width;
    const imgHeight = img.height;
    
    const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
    const scaledImgWidth = imgWidth * scale;
    const scaledImgHeight = imgHeight * scale;
    
    const imageX = (canvasWidth - scaledImgWidth) / 2;
    const imageY = (canvasHeight - scaledImgHeight) / 2;
    
    imageInfoRef.current = {
      scale,
      x: imageX,
      y: imageY,
      width: scaledImgWidth,
      height: scaledImgHeight,
      imgWidth,
      imgHeight
    };
  }, [canvasRef, containerRef, imageInfoRef]);

  return {
    handlePhotosSelected,
    handleLoadImageFromDatabase,
    initializeImageInfo
  };
};
