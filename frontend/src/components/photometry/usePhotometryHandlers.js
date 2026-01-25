import { useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import localFileService from '../../services/localFileService';
import fileService from '../../services/fileService';
import { usePointDefinitions } from './pointDefinitions';

export const usePhotometryHandlers = (state) => {
  const pointDefinitions = usePointDefinitions();
  const {
    photometryData,
    setPhotometryData,
    setLoading,
    setError,
    setShowFileLibrary,
    canvasRef,
    containerRef,
    imageInfoRef,
    activeTool,
    setActiveTool,
    setSelectedPoint,
    setSelectedPointImage,
    nextPointToPlace,
    setNextPointToPlace,
    isDragging,
    setIsDragging,
    dragOffset,
    setDragOffset,
    setIsMagnifierActive,
    setMagnifierPosition,
    magnifierZoom,
    selectedPoint,
    showPlanes,
    showAngles,
    isMagnifierActive,
    magnifierPosition,
    pointsListRef
  } = state;

  // Handle image upload
  const handleImageUpload = (files) => {
    // Implementation would go here
    toast.info('Upload functionality would be implemented here');
  };

  // Load image from local storage or API
  const handleLoadImageFromDatabase = async (fileId) => {
    try {
      setLoading(true);
      // Используем fileService вместо localFileService для загрузки с сервера
      const blob = await fileService.downloadFile(fileId);

      console.log('Photometry creating object URL with blob:', blob);
      const imageUrl = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        setPhotometryData(prev => ({
          ...prev,
          images: {
            ...prev.images,
            [prev.projectionType]: imageUrl
          },
          imageDimensions: { width: img.width, height: img.height }
        }));
        setActiveTool('scale');
        setLoading(false);
        setShowFileLibrary(false);
      };
      img.src = imageUrl;
    } catch (err) {
      setError('Ошибка при загрузке изображения: ' + err.message);
      setLoading(false);
      toast.error('Failed to load image from database');
    }
  };

  // Initialize image info (run once when image loads)
  const initializeImageInfo = (img) => {
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
  };

  // Calculate distance between two points
  const calculateDistance = (point1, point2) => {
    if (!point1 || !point2) return 0;
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    return photometryData.scale > 0 ? pixelDistance / photometryData.scale : pixelDistance;
  };

  // Calculate angle between three points
  const calculateAngle = (point1, point2, point3) => {
    if (!point1 || !point2 || !point3) return 0;
    
    const vector1 = { x: point1.x - point2.x, y: point1.y - point2.y };
    const vector2 = { x: point3.x - point2.x, y: point3.y - point2.y };
    
    const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
    const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
    const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    
    const cosAngle = dotProduct / (magnitude1 * magnitude2);
    const angleRad = Math.acos(Math.min(1, Math.max(-1, cosAngle)));
    return angleRad * (180 / Math.PI);
  };

  // Calculate the projection of a point onto a line segment
  const projectPointOnLine = (point, lineStart, lineEnd) => {
    if (!point || !lineStart || !lineEnd) return null;
    
    const lineVector = { x: lineEnd.x - lineStart.x, y: lineEnd.y - lineStart.y };
    const lineLength = Math.sqrt(lineVector.x * lineVector.x + lineVector.y * lineVector.y);
    if (lineLength === 0) return null;
    
    const normalizedLineVector = {
      x: lineVector.x / lineLength,
      y: lineVector.y / lineLength
    };
    
    const pointVector = { x: point.x - lineStart.x, y: point.y - lineStart.y };
    const projectionLength = pointVector.x * normalizedLineVector.x + pointVector.y * normalizedLineVector.y;
    
    return {
      x: lineStart.x + projectionLength * normalizedLineVector.x,
      y: lineStart.y + projectionLength * normalizedLineVector.y
    };
  };

  // Calculate measurements
  const calculateMeasurements = () => {
    const measurements = {};
    const points = photometryData.points;
    
    if (photometryData.projectionType === 'frontal') {
      if (points['eu_L'] && points['eu_R']) {
        const headWidthValue = calculateDistance(points['eu_L'], points['eu_R']);
        measurements.HeadWidth = {
          name: 'Ширина головы (eu—eu)',
          value: headWidthValue,
          unit: photometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      if (points['zy_L'] && points['zy_R']) {
        const faceWidthValue = calculateDistance(points['zy_L'], points['zy_R']);
        measurements.FaceWidth = {
          name: 'Морфологическая ширина лица (zy—zy)',
          value: faceWidthValue,
          unit: photometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      if (points['go_L'] && points['go_R']) {
        const gonialWidthValue = calculateDistance(points['go_L'], points['go_R']);
        measurements.GonialWidth = {
          name: 'Гониальная ширина лица (go—go)',
          value: gonialWidthValue,
          unit: photometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      if (points['oph'] && points['gn']) {
        const fullHeightValue = calculateDistance(points['oph'], points['gn']);
        measurements.FullHeight = {
          name: 'Полная морфологическая высота лица (oph—gn)',
          value: fullHeightValue,
          unit: photometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      if (points['oph'] && points['sn']) {
        const midHeightValue = calculateDistance(points['oph'], points['sn']);
        measurements.MidHeight = {
          name: 'Средняя морфологическая высота лица (oph—sn)',
          value: midHeightValue,
          unit: photometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      if (points['sn'] && points['gn']) {
        const lowerHeightValue = calculateDistance(points['sn'], points['gn']);
        measurements.LowerHeight = {
          name: 'Нижняя морфологическая высота лица (sn—gn)',
          value: lowerHeightValue,
          unit: photometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      if (points['zy_L'] && points['zy_R'] && points['oph'] && points['gn']) {
        const faceWidth = calculateDistance(points['zy_L'], points['zy_R']);
        const faceHeight = calculateDistance(points['oph'], points['gn']);
        const headShapeIndex = (faceWidth / faceHeight) * 100;
        
        let headShapeInterpretation = '';
        if (headShapeIndex < 75.9) {
          headShapeInterpretation = 'долихоцефалическая форма';
        } else if (headShapeIndex >= 76.0 && headShapeIndex <= 80.9) {
          headShapeInterpretation = 'мезоцефалическая форма';
        } else if (headShapeIndex >= 81.0 && headShapeIndex <= 85.4) {
          headShapeInterpretation = 'брахицефалическая форма';
        } else {
          headShapeInterpretation = 'гипербрахицефалическая форма';
        }
        
        measurements.HeadShapeIndex = {
          name: 'Индекс формы головы',
          value: headShapeIndex,
          unit: '%',
          interpretation: headShapeInterpretation,
          norm: '75.9-85.4%'
        };
      }
      
      if (points['zy_L'] && points['zy_R'] && points['oph'] && points['gn']) {
        const faceWidth = calculateDistance(points['zy_L'], points['zy_R']);
        const faceHeight = calculateDistance(points['oph'], points['gn']);
        const facialIndex = (faceHeight * 100) / faceWidth;
        
        let facialIndexInterpretation = '';
        if (facialIndex >= 104) {
          facialIndexInterpretation = 'узкое лицо';
        } else if (facialIndex >= 97 && facialIndex <= 103) {
          facialIndexInterpretation = 'среднее лицо';
        } else {
          facialIndexInterpretation = 'широкое лицо';
        }
        
        measurements.FacialIndex = {
          name: 'Лицевой индекс Изара',
          value: facialIndex,
          unit: '%',
          interpretation: facialIndexInterpretation,
          norm: '97-104%'
        };
      }
    } else if (photometryData.projectionType === 'profile') {
      if (points['n'] && points['sn'] && points['pg']) {
        const profileAngleValue = calculateAngle(points['n'], points['sn'], points['pg']);
        let profileInterpretation = '';
        if (profileAngleValue < 165) {
          profileInterpretation = 'выпуклый профиль (дистальный)';
        } else if (profileAngleValue > 175) {
          profileInterpretation = 'вогнутый профиль (мезиальный)';
        } else {
          profileInterpretation = 'прямой профиль';
        }
        
        measurements.ProfileAngle = {
          name: 'Угол профиля лица (n-sn-pg)',
          value: profileAngleValue,
          unit: '°',
          interpretation: profileInterpretation,
          norm: '165-175°'
        };
      }
      
      if (points['sn'] && points['ls'] && points['coll']) {
        const nasolabialAngleValue = calculateAngle(points['sn'], points['ls'], points['coll']);
        let nasolabialInterpretation = '';
        if (nasolabialAngleValue < 100) {
          nasolabialInterpretation = 'протрузионный профиль';
        } else if (nasolabialAngleValue > 110) {
          nasolabialInterpretation = 'ретрузионный профиль';
        } else {
          nasolabialInterpretation = 'нормальный профиль';
        }
        
        measurements.NasolabialAngle = {
          name: 'Носогубный угол (sn-ls-coll)',
          value: nasolabialAngleValue,
          unit: '°',
          interpretation: nasolabialInterpretation,
          norm: '100-110°'
        };
      }
      
      if (points['pro'] && points['pog']) {
        measurements.ELine = {
          name: 'E-line (pro-pog)',
          value: 0,
          unit: 'mm',
          interpretation: 'В норме верхняя губа расположена за Е-линией и отстоит от нее на 2 мм, нижняя губа касается Е-линии или расположена на 1 мм за ней.',
          norm: 'Верхняя губа: -2 мм, Нижняя губа: 0 мм'
        };
      }
    }
    
    setPhotometryData(prev => ({
      ...prev,
      measurements
    }));
    
    return measurements;
  };

  // Handle canvas click for point placement and selection
  const handleCanvasClick = (e) => {
    if (!photometryData.images[photometryData.projectionType]) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const { x: imageX, y: imageY, scale } = imageInfoRef.current;
    
    if (clickX >= imageX && clickX <= imageX + imageInfoRef.current.width &&
        clickY >= imageY && clickY <= imageY + imageInfoRef.current.height) {
      
      const relativeX = (clickX - imageX) / scale;
      const relativeY = (clickY - imageY) / scale;
      const originalX = relativeX;
      const originalY = relativeY;
      
      if (activeTool === 'point') {
        const isScaleSet = photometryData.scale > 1;
        if (!isScaleSet) {
          toast.warn('Please set the scale before placing points');
          return;
        }
        
        if (nextPointToPlace) {
          setSelectedPoint(nextPointToPlace);
          
          setPhotometryData(prev => ({
            ...prev,
            points: {
              ...prev.points,
              [nextPointToPlace]: { x: originalX, y: originalY }
            }
          }));
        }
      } else if (activeTool === 'select') {
        let clickedPointId = null;
        Object.entries(photometryData.points || {}).forEach(([id, point]) => {
          const adjustedX = imageX + point.x * scale;
          const adjustedY = imageY + point.y * scale;
          const distance = Math.sqrt(Math.pow(adjustedX - clickX, 2) + Math.pow(adjustedY - clickY, 2));
          if (distance <= 15) {
            clickedPointId = id;
          }
        });
        
        if (clickedPointId) {
          setSelectedPoint(clickedPointId);
          setSelectedPointImage(`/${clickedPointId}.jpg`);
        } else {
          setSelectedPoint(null);
          setSelectedPointImage(null);
        }
      } else if (activeTool === 'scale') {
        if (photometryData.projectionType === 'profile' || photometryData.projectionType === 'profile45') {
          if (photometryData.scaleMode === '10mm') {
            if (!photometryData.scalePoints.point0) {
              setPhotometryData(prev => ({
                ...prev,
                scalePoints: {
                  ...prev.scalePoints,
                  point0: { x: originalX, y: originalY }
                }
              }));
            } else if (!photometryData.scalePoints.point10) {
              setPhotometryData(prev => ({
                ...prev,
                scalePoints: {
                  ...prev.scalePoints,
                  point10: { x: originalX, y: originalY }
                }
              }));
              
              const dx = originalX - photometryData.scalePoints.point0.x;
              const dy = originalY - photometryData.scalePoints.point0.y;
              const pixelDistance = Math.sqrt(dx * dx + dy * dy);
              const calculatedScale = pixelDistance / 10;
              
              setPhotometryData(prev => ({
                ...prev,
                scale: calculatedScale,
                isSettingScale: false
              }));
              
              setActiveTool('point');
              toast.success('Scale set successfully');
            }
          } else {
            if (!photometryData.scalePoints30.point0) {
              setPhotometryData(prev => ({
                ...prev,
                scalePoints30: {
                  ...prev.scalePoints30,
                  point0: { x: originalX, y: originalY }
                }
              }));
            } else if (!photometryData.scalePoints30.point30) {
              setPhotometryData(prev => ({
                ...prev,
                scalePoints30: {
                  ...prev.scalePoints30,
                  point30: { x: originalX, y: originalY }
                }
              }));
              
              const dx = originalX - photometryData.scalePoints30.point0.x;
              const dy = originalY - photometryData.scalePoints30.point0.y;
              const pixelDistance = Math.sqrt(dx * dx + dy * dy);
              const calculatedScale = pixelDistance / 30;
              
              setPhotometryData(prev => ({
                ...prev,
                scale: calculatedScale,
                isSettingScale: false
              }));
              
              setActiveTool('point');
              toast.success('Scale set successfully');
            }
          }
        } else {
          if (!photometryData.calibrationPoints.point1) {
            setPhotometryData(prev => ({
              ...prev,
              calibrationPoints: {
                ...prev.calibrationPoints,
                point1: { x: originalX, y: originalY }
              }
            }));
          } else if (!photometryData.calibrationPoints.point2) {
            setPhotometryData(prev => ({
              ...prev,
              calibrationPoints: {
                ...prev.calibrationPoints,
                point2: { x: originalX, y: originalY }
              }
            }));
            
            const dx = originalX - photometryData.calibrationPoints.point1.x;
            const dy = originalY - photometryData.calibrationPoints.point1.y;
            const pixelDistance = Math.sqrt(dx * dx + dy * dy);
            const calculatedScale = pixelDistance / photometryData.calibrationObjectSize;
            
            setPhotometryData(prev => ({
              ...prev,
              scale: calculatedScale,
              isSettingScale: false
            }));
            
            setActiveTool('point');
            toast.success('Scale set successfully');
          }
        }
      }
    }
  };

  // Handle right-click context menu to delete the last point
  const handleCanvasContextMenu = (e) => {
    e.preventDefault();
    
    if (activeTool === 'point' && photometryData.images[photometryData.projectionType]) {
      const pointKeys = Object.keys(photometryData.points);
      
      if (pointKeys.length > 0) {
        const lastPointKey = pointKeys[pointKeys.length - 1];
        
        setPhotometryData(prev => {
          const newPoints = { ...prev.points };
          delete newPoints[lastPointKey];
          return {
            ...prev,
            points: newPoints
          };
        });
        
        if (selectedPoint === lastPointKey) {
          setSelectedPoint(null);
          setSelectedPointImage(null);
        }
        
        toast.info(`Deleted point: ${lastPointKey}`);
      }
    }
  };

  // Handle mouse down for point selection and dragging
  const handleCanvasMouseDown = (e) => {
    if (!photometryData.images[photometryData.projectionType]) return;
    
    if (e.button === 0 && activeTool === 'select') {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      const { x: imageX, y: imageY, scale } = imageInfoRef.current;
      
      let clickedPointId = null;
      Object.entries(photometryData.points || {}).forEach(([id, point]) => {
        const adjustedX = imageX + point.x * scale;
        const adjustedY = imageY + point.y * scale;
        const distance = Math.sqrt(Math.pow(adjustedX - clickX, 2) + Math.pow(adjustedY - clickY, 2));
        if (distance <= 15) {
          clickedPointId = id;
        }
      });
      
      if (clickedPointId) {
        setSelectedPoint(clickedPointId);
        setSelectedPointImage(`/${clickedPointId}.jpg`);
        setIsDragging(true);
        
        const point = photometryData.points[clickedPointId];
        const adjustedX = imageX + point.x * scale;
        const adjustedY = imageY + point.y * scale;
        
        setDragOffset({
          x: clickX - adjustedX,
          y: clickY - adjustedY
        });
      }
    }
  };

  // Handle mouse move for dragging points and updating magnifier position
  const handleCanvasMouseMove = (e) => {
    if (!photometryData.images[photometryData.projectionType]) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const moveY = e.clientY - rect.top;
    
    if (isMagnifierActive) {
      setMagnifierPosition({ x: moveX, y: moveY });
    }
    
    if (isDragging && selectedPoint) {
      const { scale, x: imageX, y: imageY } = imageInfoRef.current;
      
      const newX = (moveX - imageX - dragOffset.x) / scale;
      const newY = (moveY - imageY - dragOffset.y) / scale;
      
      setPhotometryData(prev => ({
        ...prev,
        points: {
          ...prev.points,
          [selectedPoint]: { x: newX, y: newY }
        }
      }));
    }
  };

  // Handle mouse wheel click to toggle magnifier
  const handleCanvasMouseWheelClick = (e) => {
    if (e.button === 1 && photometryData.images[photometryData.projectionType]) {
      e.preventDefault();
      
      setIsMagnifierActive(prev => !prev);
      
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      setMagnifierPosition({ x: clickX, y: clickY });
    }
  };

  // Handle mouse up
  const handleCanvasMouseUp = (e) => {
    setIsDragging(false);
  };

  // Handle mouse leave
  const handleCanvasMouseLeave = () => {
    setIsDragging(false);
    setIsMagnifierActive(false);
  };

  // Delete selected point
  const deleteSelectedPoint = useCallback(() => {
    if (selectedPoint) {
      setPhotometryData(prev => {
        const newPoints = { ...prev.points };
        delete newPoints[selectedPoint];
        return {
          ...prev,
          points: newPoints
        };
      });
      setSelectedPoint(null);
      setSelectedPointImage(null);
      toast.info(`Deleted point: ${selectedPoint}`);
    }
  }, [selectedPoint]);

  // Determine the next point to be placed when in point placement mode
  useEffect(() => {
    if (activeTool === 'point' && photometryData.images[photometryData.projectionType]) {
      const isScaleSet = photometryData.scale > 1;
      if (isScaleSet) {
        const points = pointDefinitions[photometryData.projectionType];
        const nextPoint = points.find(point => !photometryData.points[point.id]);
        
        if (nextPoint) {
          setNextPointToPlace(nextPoint.id);
          setSelectedPointImage(`/${nextPoint.id}.jpg`);
        } else {
          setNextPointToPlace(null);
          setSelectedPointImage(null);
        }
      }
    } else {
      setNextPointToPlace(null);
    }
  }, [activeTool, photometryData, photometryData.points, photometryData.projectionType, photometryData.scale, pointDefinitions]);

  // Scroll to the next point when it changes
  useEffect(() => {
    if (nextPointToPlace && pointsListRef.current) {
      const timer = setTimeout(() => {
        const nextPointElement = document.querySelector(`.point-item.next-point`);
        if (nextPointElement) {
          nextPointElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [nextPointToPlace]);

  return {
    pointDefinitions,
    handleImageUpload,
    handleLoadImageFromDatabase,
    initializeImageInfo,
    calculateDistance,
    calculateAngle,
    projectPointOnLine,
    calculateMeasurements,
    handleCanvasClick,
    handleCanvasContextMenu,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseWheelClick,
    handleCanvasMouseUp,
    handleCanvasMouseLeave,
    deleteSelectedPoint
  };
};