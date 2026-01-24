import { useCallback } from 'react';

export const useCephalometryCanvasHandlers = (state) => {
  const {
    cephalometryData, setCephalometryData,
    imagesUploaded,
    activeTool, setActiveTool,
    selectedPoint, setSelectedPoint,
    setSelectedPointImage,
    nextPointToPlace, setNextPointToPlace,
    isDragging, setIsDragging,
    setDragOffset,
    canvasRef,
    imageInfoRef,
    setIsMagnifierActive,
    setMagnifierPosition
  } = state;

  const handleCanvasClick = useCallback((e) => {
    if (!cephalometryData.images[cephalometryData.projectionType] || !imagesUploaded) return;
    
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
        const isScaleSet = cephalometryData.scale > 1;
        if (!isScaleSet) {
          alert('Пожалуйста, сначала установите масштаб перед расстановкой точек.');
          return;
        }
        
        if (nextPointToPlace) {
          setSelectedPoint(nextPointToPlace);
          
          if (nextPointToPlace === 'E1' &&
              cephalometryData.points['ii'] &&
              cephalometryData.points['Is']) {
            
            const iiPoint = cephalometryData.points['ii'];
            const IsPoint = cephalometryData.points['Is'];
            const e1X = (iiPoint.x + IsPoint.x) / 2;
            const e1Y = (iiPoint.y + IsPoint.y) / 2;
            
            setCephalometryData(prev => ({
              ...prev,
              points: {
                ...prev.points,
                E1: { x: e1X, y: e1Y }
              }
            }));
            setNextPointToPlace(null);
          } else {
            setCephalometryData(prev => ({
              ...prev,
              points: {
                ...prev.points,
                [nextPointToPlace]: { x: originalX, y: originalY }
              }
            }));
          }
          
          if (nextPointToPlace === 'C' &&
              cephalometryData.points['ii'] &&
              cephalometryData.points['Is']) {
            const iiPoint = cephalometryData.points['ii'];
            const IsPoint = cephalometryData.points['Is'];
            const e1X = (iiPoint.x + IsPoint.x) / 2;
            const e1Y = (iiPoint.y + IsPoint.y) / 2;
            
            setCephalometryData(prev => ({
              ...prev,
              points: {
                ...prev.points,
                E1: { x: e1X, y: e1Y }
              }
            }));
          }
        }
      } else if (activeTool === 'select') {
        let clickedPointId = null;
        Object.entries(cephalometryData.points || {}).forEach(([id, point]) => {
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
        if (cephalometryData.projectionType === 'lateral') {
          if (cephalometryData.scaleMode === '10mm') {
            if (!cephalometryData.scalePoints.point0) {
              setCephalometryData(prev => ({
                ...prev,
                scalePoints: { ...prev.scalePoints, point0: { x: originalX, y: originalY } }
              }));
            } else if (!cephalometryData.scalePoints.point10) {
              const dx = originalX - cephalometryData.scalePoints.point0.x;
              const dy = originalY - cephalometryData.scalePoints.point0.y;
              const pixelDistance = Math.sqrt(dx * dx + dy * dy);
              const calculatedScale = pixelDistance / 10;
              
              setCephalometryData(prev => ({
                ...prev,
                scalePoints: { ...prev.scalePoints, point10: { x: originalX, y: originalY } },
                scale: calculatedScale,
                isSettingScale: false
              }));
              setActiveTool('point');
            }
          } else {
            if (!cephalometryData.scalePoints30.point0) {
              setCephalometryData(prev => ({
                ...prev,
                scalePoints30: { ...prev.scalePoints30, point0: { x: originalX, y: originalY } }
              }));
            } else if (!cephalometryData.scalePoints30.point30) {
              const dx = originalX - cephalometryData.scalePoints30.point0.x;
              const dy = originalY - cephalometryData.scalePoints30.point0.y;
              const pixelDistance = Math.sqrt(dx * dx + dy * dy);
              const calculatedScale = pixelDistance / 30;
              
              setCephalometryData(prev => ({
                ...prev,
                scalePoints30: { ...prev.scalePoints30, point30: { x: originalX, y: originalY } },
                scale: calculatedScale,
                isSettingScale: false
              }));
              setActiveTool('point');
            }
          }
        } else {
          if (!cephalometryData.calibrationPoints.point1) {
            setCephalometryData(prev => ({
              ...prev,
              calibrationPoints: { ...prev.calibrationPoints, point1: { x: originalX, y: originalY } }
            }));
          } else if (!cephalometryData.calibrationPoints.point2) {
            const dx = originalX - cephalometryData.calibrationPoints.point1.x;
            const dy = originalY - cephalometryData.calibrationPoints.point1.y;
            const pixelDistance = Math.sqrt(dx * dx + dy * dy);
            const calculatedScale = pixelDistance / cephalometryData.calibrationObjectSize;
            
            setCephalometryData(prev => ({
              ...prev,
              calibrationPoints: { ...prev.calibrationPoints, point2: { x: originalX, y: originalY } },
              scale: calculatedScale,
              isSettingScale: false
            }));
            setActiveTool('point');
          }
        }
      }
    }
  }, [cephalometryData, imagesUploaded, canvasRef, imageInfoRef, activeTool, nextPointToPlace, setSelectedPoint, setSelectedPointImage, setCephalometryData, setNextPointToPlace, setActiveTool]);

  const handleCanvasMouseDown = useCallback((e) => {
    if (activeTool !== 'select' || !selectedPoint) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const { x: imageX, y: imageY, scale } = imageInfoRef.current;
    const point = cephalometryData.points[selectedPoint];
    
    if (point) {
      const adjustedX = imageX + point.x * scale;
      const adjustedY = imageY + point.y * scale;
      const distance = Math.sqrt(Math.pow(adjustedX - clickX, 2) + Math.pow(adjustedY - clickY, 2));
      
      if (distance <= 15) {
        setIsDragging(true);
        setDragOffset({
          x: clickX - adjustedX,
          y: clickY - adjustedY
        });
      }
    }
  }, [activeTool, selectedPoint, canvasRef, imageInfoRef, cephalometryData.points, setIsDragging, setDragOffset]);

  const handleCanvasMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMagnifierPosition({ x, y });
    setIsMagnifierActive(true);
    
    if (isDragging && selectedPoint) {
      const { x: imageX, y: imageY, scale } = imageInfoRef.current;
      const newX = (x - imageX) / scale;
      const newY = (y - imageY) / scale;
      
      setCephalometryData(prev => ({
        ...prev,
        points: {
          ...prev.points,
          [selectedPoint]: { x: newX, y: newY }
        }
      }));
    }
  }, [canvasRef, setMagnifierPosition, setIsMagnifierActive, isDragging, selectedPoint, imageInfoRef, setCephalometryData]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);

  const handleCanvasMouseLeave = useCallback(() => {
    setIsDragging(false);
    setIsMagnifierActive(false);
  }, [setIsDragging, setIsMagnifierActive]);

  const deleteSelectedPoint = useCallback(() => {
    if (selectedPoint) {
      setCephalometryData(prev => {
        const newPoints = { ...prev.points };
        delete newPoints[selectedPoint];
        return { ...prev, points: newPoints };
      });
      setSelectedPoint(null);
      setSelectedPointImage(null);
    }
  }, [selectedPoint, setCephalometryData, setSelectedPoint, setSelectedPointImage]);

  return {
    handleCanvasClick,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleCanvasMouseLeave,
    deleteSelectedPoint
  };
};
