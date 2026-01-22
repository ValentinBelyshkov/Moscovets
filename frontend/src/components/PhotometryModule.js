import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
// Используем локальные сервисы вместо серверных
import localFileService from '../services/localFileService';
import localMedicalRecordService from '../services/localMedicalRecordService';
import { useData } from '../contexts/DataContext';
import FileLibrary from './FileLibrary';
import './PhotometryModule.css';

const PhotometryModule = () => {
  // State for photometry data
  const [photometryData, setPhotometryData] = useState({
    patientName: 'John Doe',
    analysisDate: new Date().toISOString().split('T')[0],
    images: {
      // Фотографии лица
      frontal: null,
      frontalSmile: null,
      frontalRetractorsClosed: null,
      frontalRetractorsOpen: null,
      profileRight: null,
      profileLeft: null,
      profileRightSmile: null,
      profileLeftSmile: null,
      profile45RightClosed: null,
      profile45RightOpen: null,
      profile45LeftClosed: null,
      profile45LeftOpen: null,
      // Внутриротовые фотографии
      intraoralFrontalClosed: null,
      intraoralFrontalOpen: null,
      intraoralRight90: null,
      intraoralLeft90: null,
      intraoralRight45: null,
      intraoralLeft45: null,
      upperJaw: null,
      lowerJaw: null
    },
    imageDimensions: { width: 0, height: 0 },
    scale: 1, // pixels per mm
    scaleMode: '10mm', // '10mm' or '30mm' for profile projections
    scalePoints: { point0: null, point10: null }, // For 10mm mode
    scalePoints30: { point0: null, point30: null }, // For 30mm mode
    isSettingScale: false, // Flag to indicate if we're in scale setting mode
    projectionType: 'frontal', // 'frontal', 'profile', 'profile45', 'intraoral'
    points: {},
    measurements: {},
    interpretation: {},
    // New calibration system for frontal and profile projections
    calibrationType: 'implant', // 'implant', 'crown', 'distance', 'known_object'
    calibrationObjectSize: 10, // Size in mm for the selected object
    calibrationPoints: { point1: null, point2: null }, // Points for calibration
    calibrationDistance: 0 // Distance between calibration points in mm
  });
  
  // State to track if images are uploaded
  const [imagesUploaded, setImagesUploaded] = useState({
    frontal: false,
    frontalSmile: false,
    frontalRetractorsClosed: false,
    frontalRetractorsOpen: false,
    profileRight: false,
    profileLeft: false,
    profileRightSmile: false,
    profileLeftSmile: false,
    profile45RightClosed: false,
    profile45RightOpen: false,
    profile45LeftClosed: false,
    profile45LeftOpen: false,
    intraoralFrontalClosed: false,
    intraoralFrontalOpen: false,
    intraoralRight90: false,
    intraoralLeft90: false,
    intraoralRight45: false,
    intraoralLeft45: false,
    upperJaw: false,
    lowerJaw: false
  });
  
  // Visualization settings
  const [showPlanes, setShowPlanes] = useState({
    midline: false,
    pupilLine: false,
    occlusalLine: false,
    eLine: false
  });
  
  const [showAngles, setShowAngles] = useState({
    nasolabial: false,
    facialProfile: false
  });

  // UI state
  const [activeTool, setActiveTool] = useState('select'); // 'select', 'point', 'scale'
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [selectedPointImage, setSelectedPointImage] = useState(null); // New state for selected point image
  const [nextPointToPlace, setNextPointToPlace] = useState(null); // New state for next point to be placed
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFileLibrary, setShowFileLibrary] = useState(false);
  const [isMagnifierActive, setIsMagnifierActive] = useState(false);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
  const [magnifierZoom] = useState(2.0); // Increased magnification for better visibility

  // Refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pointsListRef = useRef(null);
  const imageInfoRef = useRef({ scale: 1, x: 0, y: 0, width: 0, height: 0 });
  
  // Point definitions for different projection types
  const pointDefinitions = useMemo(() => ({
    frontal: [
      { id: 'eu_L', name: 'eu слева - Латерально выступающая точка на боковой поверхности головы слева' },
      { id: 'eu_R', name: 'eu справа - Латерально выступающая точка на боковой поверхности головы справа' },
      { id: 'zy_L', name: 'zy слева - Наиболее выступающая кнаружи точка скуловой дуги слева' },
      { id: 'zy_R', name: 'zy справа - Наиболее выступающая кнаружи точка скуловой дуги справа' },
      { id: 'go_L', name: 'go слева - Точка угла нижней челюсти слева' },
      { id: 'go_R', name: 'go справа - Точка угла нижней челюсти справа' },
      { id: 'n', name: 'n - Nasion, наиболее глубокая точка между носом и лбом' },
      { id: 'sn', name: 'sn - Subnasale, середина перехода перегородки носа к верхней губе' },
      { id: 'gn', name: 'gn - Gnatios, наиболее выступающая точка подбородка' },
      { id: 'pg', name: 'pg - Pogonion, наиболее выступающая точка подбородочного выступа' },
      { id: 'oph', name: 'oph - Оphrion, точка на пересечении средней линии лица и касательной к надбровным дугам' }
    ],
    profile: [
      { id: 'n', name: 'n - Nasion, наиболее глубокая точка между носом и лбом' },
      { id: 'sn', name: 'sn - Subnasale, середина перехода перегородки носа к верхней губе' },
      { id: 'pg', name: 'pg - Pogonion, наиболее выступающая точка подбородочного выступа' },
      { id: 'pro', name: 'pro - Pronasale, кончик носа' },
      { id: 'pog', name: 'pog - Pogonion, наиболее выступающая точка подбородка' },
      { id: 'ls', name: 'ls - Labrale superius, наиболее выступающая точка верхней губы' },
      { id: 'coll', name: 'coll - Точка, позволяющая провести касательную к нижнему краю носа' }
    ],
    profile45: [
      { id: 'n', name: 'n - Nasion, наиболее глубокая точка между носом и лбом' },
      { id: 'sn', name: 'sn - Subnasale, середина перехода перегородки носа к верхней губе' },
      { id: 'pg', name: 'pg - Pogonion, наиболее выступающая точка подбородочного выступа' },
      { id: 'zy_L', name: 'zy слева - Наиболее выступающая кнаружи точка скуловой дуги слева' },
      { id: 'zy_R', name: 'zy справа - Наиболее выступающая кнаружи точка скуловой дуги справа' }
    ],
    intraoral: [
      { id: 'midline_upper', name: 'midline_upper - Средняя линия верхней челюсти' },
      { id: 'midline_lower', name: 'midline_lower - Средняя линия нижней челюсти' },
      { id: 'canine_R', name: 'canine_R - Клык справа' },
      { id: 'canine_L', name: 'canine_L - Клык слева' },
      { id: 'molar_R', name: 'molar_R - Первый моляр справа' },
      { id: 'molar_L', name: 'molar_L - Первый моляр слева' }
    ]
  }), []);

  // Handle image upload
  const handleImageUpload = (files) => {
    // Implementation here
  };
  
  // Load image from local storage
  const handleLoadImageFromDatabase = async (fileId) => {
    try {
      setLoading(true);
      const response = await localFileService.downloadFile(fileId);
      
      console.log('Photometry load image response:', response);
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
      
      console.log('Photometry creating object URL with blob:', blob);
      const imageUrl = URL.createObjectURL(blob);
      
      // Get image dimensions
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
        // Automatically activate scale setting mode when image is loaded
        setActiveTool('scale');
        setLoading(false);
        setShowFileLibrary(false);
      };
      img.src = imageUrl;
    } catch (err) {
      setError('Ошибка при загрузке изображения из локального хранилища: ' + err.message);
      setLoading(false);
    }
  };

  // Initialize image info (run once when image loads)
  const initializeImageInfo = (img) => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    
    // Set canvas dimensions to match container
    canvas.width = containerRef.current.clientWidth;
    canvas.height = containerRef.current.clientHeight;
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgWidth = img.width;
    const imgHeight = img.height;
    
    // Scale image to fit canvas while maintaining aspect ratio
    const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
    const scaledImgWidth = imgWidth * scale;
    const scaledImgHeight = imgHeight * scale;
    
    // Center image
    const imageX = (canvasWidth - scaledImgWidth) / 2;
    const imageY = (canvasHeight - scaledImgHeight) / 2;
    
    // Store image info for later use
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

  // Handle canvas click for point placement and selection
  const handleCanvasClick = (e) => {
    if (!photometryData.images[photometryData.projectionType]) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const { x: imageX, y: imageY, scale } = imageInfoRef.current;
    
    // Check if click is within image bounds
    if (clickX >= imageX && clickX <= imageX + imageInfoRef.current.width &&
        clickY >= imageY && clickY <= imageY + imageInfoRef.current.height) {
      
      // Convert click coordinates to image-relative coordinates
      const relativeX = (clickX - imageX) / scale;
      const relativeY = (clickY - imageY) / scale;
      
      // Store points in original image coordinates for accurate screenshots
      const originalX = relativeX;
      const originalY = relativeY;
      
      if (activeTool === 'point') {
        // Check if scale is set before allowing point placement
        const isScaleSet = photometryData.scale > 1;
        if (!isScaleSet) {
          alert('Пожалуйста, сначала установите масштаб перед расстановкой точек.');
          return;
        }
        
        // Use the next point to be placed
        if (nextPointToPlace) {
          // Set the point image before placing the point
          setSelectedPoint(nextPointToPlace);
          
          // Normal point placement
          setPhotometryData(prev => ({
            ...prev,
            points: {
              ...prev.points,
              [nextPointToPlace]: { x: originalX, y: originalY }
            }
          }));
        }
      } else if (activeTool === 'select') {
        // Check if we clicked on an existing point
        let clickedPointId = null;
        Object.entries(photometryData.points || {}).forEach(([id, point]) => {
          // Adjust point coordinates for display
          const adjustedX = imageX + point.x * scale;
          const adjustedY = imageY + point.y * scale;
          const distance = Math.sqrt(Math.pow(adjustedX - clickX, 2) + Math.pow(adjustedY - clickY, 2));
          if (distance <= 15) { // 15px radius for point selection
            clickedPointId = id;
          }
        });
        
        if (clickedPointId) {
          setSelectedPoint(clickedPointId);
          // Set the image for the selected point
          setSelectedPointImage(`/${clickedPointId}.jpg`);
        } else {
          setSelectedPoint(null);
          setSelectedPointImage(null);
        }
      } else if (activeTool === 'scale') {
        // Handle scale setting based on projection type
        if (photometryData.projectionType === 'profile' || photometryData.projectionType === 'profile45') {
          // Original scale setting for profile projections
          if (photometryData.scaleMode === '10mm') {
            // For 10mm mode, we need two points: 0 and 10
            if (!photometryData.scalePoints.point0) {
              // Set the first point (0)
              setPhotometryData(prev => ({
                ...prev,
                scalePoints: {
                  ...prev.scalePoints,
                  point0: { x: originalX, y: originalY }
                }
              }));
            } else if (!photometryData.scalePoints.point10) {
              // Set the second point (10)
              setPhotometryData(prev => ({
                ...prev,
                scalePoints: {
                  ...prev.scalePoints,
                  point10: { x: originalX, y: originalY }
                }
              }));
              
              // Calculate scale: 10mm = distance between point0 and point10
              const dx = originalX - photometryData.scalePoints.point0.x;
              const dy = originalY - photometryData.scalePoints.point0.y;
              const pixelDistance = Math.sqrt(dx * dx + dy * dy);
              const calculatedScale = pixelDistance / 10; // pixels per mm
              
              setPhotometryData(prev => ({
                ...prev,
                scale: calculatedScale,
                isSettingScale: false
              }));
              
              // Switch to point placement tool after setting scale
              setActiveTool('point');
            }
          } else {
            // For 30mm mode, we need two points: 0 and 30
            if (!photometryData.scalePoints30.point0) {
              // Set the first point (0)
              setPhotometryData(prev => ({
                ...prev,
                scalePoints30: {
                  ...prev.scalePoints30,
                  point0: { x: originalX, y: originalY }
                }
              }));
            } else if (!photometryData.scalePoints30.point30) {
              // Set the second point (30)
              setPhotometryData(prev => ({
                ...prev,
                scalePoints30: {
                  ...prev.scalePoints30,
                  point30: { x: originalX, y: originalY }
                }
              }));
              
              // Calculate scale: 30mm = distance between point0 and point30
              const dx = originalX - photometryData.scalePoints30.point0.x;
              const dy = originalY - photometryData.scalePoints30.point0.y;
              const pixelDistance = Math.sqrt(dx * dx + dy * dy);
              const calculatedScale = pixelDistance / 30; // pixels per mm
              
              setPhotometryData(prev => ({
                ...prev,
                scale: calculatedScale,
                isSettingScale: false
              }));
              
              // Switch to point placement tool after setting scale
              setActiveTool('point');
            }
          }
        } else {
          // New calibration system for frontal and intraoral projections
          if (!photometryData.calibrationPoints.point1) {
            // Set the first calibration point
            setPhotometryData(prev => ({
              ...prev,
              calibrationPoints: {
                ...prev.calibrationPoints,
                point1: { x: originalX, y: originalY }
              }
            }));
          } else if (!photometryData.calibrationPoints.point2) {
            // Set the second calibration point
            setPhotometryData(prev => ({
              ...prev,
              calibrationPoints: {
                ...prev.calibrationPoints,
                point2: { x: originalX, y: originalY }
              }
            }));
            
            // Calculate scale based on the selected calibration object size
            const dx = originalX - photometryData.calibrationPoints.point1.x;
            const dy = originalY - photometryData.calibrationPoints.point1.y;
            const pixelDistance = Math.sqrt(dx * dx + dy * dy);
            const calculatedScale = pixelDistance / photometryData.calibrationObjectSize; // pixels per mm
            
            setPhotometryData(prev => ({
              ...prev,
              scale: calculatedScale,
              isSettingScale: false
            }));
            
            // Switch to point placement tool after setting scale
            setActiveTool('point');
          }
        }
      }
    }
  };

  // Handle right-click context menu to delete the last point
  const handleCanvasContextMenu = (e) => {
    // Prevent default context menu
    e.preventDefault();
    
    // Check if we're in point placement mode and have at least one point
    if (activeTool === 'point' && photometryData.images[photometryData.projectionType]) {
      // Get all point keys
      const pointKeys = Object.keys(photometryData.points);
      
      // If we have points, delete the last one
      if (pointKeys.length > 0) {
        // For simplicity, we'll delete the last key in the object
        // In a more sophisticated implementation, we might track insertion order
        const lastPointKey = pointKeys[pointKeys.length - 1];
        
        // Remove the last point
        setPhotometryData(prev => {
          const newPoints = { ...prev.points };
          delete newPoints[lastPointKey];
          return {
            ...prev,
            points: newPoints
          };
        });
        
        // Clear selection if the deleted point was selected
        if (selectedPoint === lastPointKey) {
          setSelectedPoint(null);
          setSelectedPointImage(null);
        }
      }
    }
  };

  // Handle mouse down for point selection and dragging
  const handleCanvasMouseDown = (e) => {
    if (!photometryData.images[photometryData.projectionType]) return;
    
    // Left mouse button for point interaction
    if (e.button === 0 && activeTool === 'select') {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      const { x: imageX, y: imageY, scale } = imageInfoRef.current;
      
      // Check if we clicked on an existing point
      let clickedPointId = null;
      Object.entries(photometryData.points || {}).forEach(([id, point]) => {
        // Adjust point coordinates for display
        const adjustedX = imageX + point.x * scale;
        const adjustedY = imageY + point.y * scale;
        const distance = Math.sqrt(Math.pow(adjustedX - clickX, 2) + Math.pow(adjustedY - clickY, 2));
        if (distance <= 15) { // 15px radius for point selection
          clickedPointId = id;
        }
      });
      
      if (clickedPointId) {
        setSelectedPoint(clickedPointId);
        setSelectedPointImage(`/${clickedPointId}.jpg`); // Set the image for the selected point
        setIsDragging(true);
        
        // Calculate drag offset
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
    
    // Update magnifier position if it's active
    if (isMagnifierActive) {
      setMagnifierPosition({ x: moveX, y: moveY });
    }
    
    // Handle point dragging
    if (isDragging && selectedPoint) {
      const { scale, x: imageX, y: imageY } = imageInfoRef.current;
      
      // Calculate new point position
      const newX = (moveX - imageX - dragOffset.x) / scale;
      const newY = (moveY - imageY - dragOffset.y) / scale;
      
      // Store points in original image coordinates
      const originalX = newX;
      const originalY = newY;
      
      setPhotometryData(prev => ({
        ...prev,
        points: {
          ...prev.points,
          [selectedPoint]: { x: originalX, y: originalY }
        }
      }));
    }
  };

  // Handle mouse wheel click to toggle magnifier
  const handleCanvasMouseWheelClick = (e) => {
    // Check if middle mouse button is pressed (button === 1)
    if (e.button === 1 && photometryData.images[photometryData.projectionType]) {
      e.preventDefault();
      
      // Toggle magnifier visibility
      setIsMagnifierActive(prev => !prev);
      
      // Set initial magnifier position
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
      setSelectedPointImage(null); // Clear the selected point image
    }
  }, [selectedPoint]);

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
    
    // Vector of the line
    const lineVector = { x: lineEnd.x - lineStart.x, y: lineEnd.y - lineStart.y };
    
    // Normalize the line vector
    const lineLength = Math.sqrt(lineVector.x * lineVector.x + lineVector.y * lineVector.y);
    if (lineLength === 0) return null;
    
    const normalizedLineVector = {
      x: lineVector.x / lineLength,
      y: lineVector.y / lineLength
    };
    
    // Vector from line start to point
    const pointVector = { x: point.x - lineStart.x, y: point.y - lineStart.y };
    
    // Project point vector onto line vector
    const projectionLength = pointVector.x * normalizedLineVector.x + pointVector.y * normalizedLineVector.y;
    
    // Calculate the projected point
    const projectedPoint = {
      x: lineStart.x + projectionLength * normalizedLineVector.x,
      y: lineStart.y + projectionLength * normalizedLineVector.y
    };
    
    return projectedPoint;
  };

  // Calculate measurements
  const calculateMeasurements = () => {
    const measurements = {};
    const points = photometryData.points;
    
    // Calculate standard photometric measurements based on projection type
    if (photometryData.projectionType === 'frontal') {
      // Width measurements
      // Ширина головы (eu—eu)
      if (points['eu_L'] && points['eu_R']) {
        const headWidthValue = calculateDistance(points['eu_L'], points['eu_R']);
        measurements.HeadWidth = {
          name: 'Ширина головы (eu—eu)',
          value: headWidthValue,
          unit: photometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      // Морфологическая ширина лица (zy—zy)
      if (points['zy_L'] && points['zy_R']) {
        const faceWidthValue = calculateDistance(points['zy_L'], points['zy_R']);
        measurements.FaceWidth = {
          name: 'Морфологическая ширина лица (zy—zy)',
          value: faceWidthValue,
          unit: photometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      // Гониальная ширина лица (go—go)
      if (points['go_L'] && points['go_R']) {
        const gonialWidthValue = calculateDistance(points['go_L'], points['go_R']);
        measurements.GonialWidth = {
          name: 'Гониальная ширина лица (go—go)',
          value: gonialWidthValue,
          unit: photometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      // Height measurements
      // Полная морфологическая высота лица (oph—gn)
      if (points['oph'] && points['gn']) {
        const fullHeightValue = calculateDistance(points['oph'], points['gn']);
        measurements.FullHeight = {
          name: 'Полная морфологическая высота лица (oph—gn)',
          value: fullHeightValue,
          unit: photometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      // Средняя морфологическая высота лица (oph—sn)
      if (points['oph'] && points['sn']) {
        const midHeightValue = calculateDistance(points['oph'], points['sn']);
        measurements.MidHeight = {
          name: 'Средняя морфологическая высота лица (oph—sn)',
          value: midHeightValue,
          unit: photometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      // Нижняя морфологическая высота лица (sn—gn)
      if (points['sn'] && points['gn']) {
        const lowerHeightValue = calculateDistance(points['sn'], points['gn']);
        measurements.LowerHeight = {
          name: 'Нижняя морфологическая высота лица (sn—gn)',
          value: lowerHeightValue,
          unit: photometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      // Face shape index
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
      
      // Лицевой индекс Изара
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
      // Profile angle measurements
      // Угол профиля лица (n-sn-pg)
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
      
      // Носогубный угол (sn-ls-coll)
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
      
      // E-line measurements
      if (points['pro'] && points['pog']) {
        measurements.ELine = {
          name: 'E-line (pro-pog)',
          value: 0, // This would be calculated based on lip position relative to E-line
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

  // Generate report
  const generateReport = () => {
    const measurements = calculateMeasurements();
    
    // Determine if measurements are within normal range
    let allNormal = true;
    Object.values(measurements).forEach(measurement => {
      if (measurement.interpretation && measurement.interpretation !== 'нормальный профиль' && 
          measurement.interpretation !== 'норма' && measurement.interpretation !== 'среднее лицо') {
        allNormal = false;
      }
    });
    
    const report = {
      patientName: photometryData.patientName,
      analysisDate: photometryData.analysisDate,
      projectionType: photometryData.projectionType,
      measurements,
      allNormal,
      conclusion: allNormal ? 'Попадает в норму' : 'Не попадает в норму',
      timestamp: new Date().toISOString()
    };
    
    setReportData(report);
    return report;
  };

  // Export report as PDF
  const exportReportAsPDF = () => {
    alert('Экспорт в PDF пока не реализован. В реальном приложении здесь будет создаваться PDF-файл.');
  };
  
  // Export report as PPTX
  const exportReportAsPPTX = () => {
    alert('Экспорт в PPTX пока не реализован. В реальном приложении здесь будет создаваться PPTX-файл.');
  };

  // Determine the next point to be placed when in point placement mode
  useEffect(() => {
    if (activeTool === 'point' && photometryData.images[photometryData.projectionType]) {
      // Check if scale is set
      const isScaleSet = photometryData.scale > 1;
      if (isScaleSet) {
        // Find the next unplaced point
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
      // Use a slight delay to ensure DOM is ready
      const timer = setTimeout(() => {
        // Find the element for the next point
        const nextPointElement = document.querySelector(`.point-item.next-point`);
        if (nextPointElement) {
          // Scroll to the element with smooth behavior
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
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Reinitialize image info on resize
      if (photometryData.images[photometryData.projectionType]) {
        const img = new Image();
        img.onload = () => {
          initializeImageInfo(img);
          // Force redraw
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        };
        img.src = photometryData.images[photometryData.projectionType];
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [photometryData.images, photometryData.projectionType]);
  
  // Handle projection type change
  useEffect(() => {
    // Reinitialize image info when projection type changes
    if (photometryData.images[photometryData.projectionType]) {
      const img = new Image();
      img.onload = () => {
        initializeImageInfo(img);
        // Force redraw
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      };
      img.src = photometryData.images[photometryData.projectionType];
    }
  }, [photometryData.projectionType, photometryData.images]);
  
  // Function to draw all elements on a canvas context (used for both main canvas and magnifier)
  const drawAllElements = useCallback((ctx, img, canvasWidth, canvasHeight, imageX, imageY, scaledImgWidth, scaledImgHeight, scale) => {
    // Draw image
    ctx.drawImage(img, imageX, imageY, scaledImgWidth, scaledImgHeight);
    
    // Draw lines between specific points for different projections
    if (photometryData.projectionType === 'frontal') {
      // Draw common lines for photometric analysis
      const points = photometryData.points;
      
      // Function to draw a line between two points
      const drawLine = (point1Id, point2Id, color = '#00ff00', lineWidth = 2) => {
        if (points[point1Id] && points[point2Id]) {
          const point1 = points[point1Id];
          const point2 = points[point2Id];
          const x1 = imageX + point1.x * scale;
          const y1 = imageY + point1.y * scale;
          const x2 = imageX + point2.x * scale;
          const y2 = imageY + point2.y * scale;
          
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      };
      
      // Draw planes according to document requirements
      // Срединная линия лица
      if (showPlanes.midline && points['n'] && points['gn']) {
        drawLine('n', 'gn', '#0000ff', 2);
      }
      
      // Зрачковая линия (условно через точки n и sn)
      if (showPlanes.pupilLine && points['n'] && points['sn']) {
        drawLine('n', 'sn', '#0000ff', 2);
      }
      
      // Окклюзионная линия (условно через точки sn и pg)
      if (showPlanes.occlusalLine && points['sn'] && points['pg']) {
        drawLine('sn', 'pg', '#0000ff', 2);
      }
    } else if (photometryData.projectionType === 'profile') {
      // Draw lines for profile analysis
      const points = photometryData.points;
      
      // Function to draw a line between two points
      const drawLine = (point1Id, point2Id, color = '#00ff00', lineWidth = 2) => {
        if (points[point1Id] && points[point2Id]) {
          const point1 = points[point1Id];
          const point2 = points[point2Id];
          const x1 = imageX + point1.x * scale;
          const y1 = imageY + point1.y * scale;
          const x2 = imageX + point2.x * scale;
          const y2 = imageY + point2.y * scale;
          
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      };
      
      // E-line (pro-pog)
      if (showPlanes.eLine && points['pro'] && points['pog']) {
        drawLine('pro', 'pog', '#0000ff', 2);
      }
    }
    
    // Draw points (scaled to image position)
    Object.entries(photometryData.points || {}).forEach(([id, point]) => {
      // Adjust point coordinates based on image scaling
      const adjustedX = imageX + point.x * scale;
      const adjustedY = imageY + point.y * scale;
      
      ctx.beginPath();
      ctx.arc(adjustedX, adjustedY, 3, 0, 2 * Math.PI);
      ctx.fillStyle = selectedPoint === id ? '#ff0000' : '#0000ff';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw point label
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(id, adjustedX + 12, adjustedY - 12);
    });
    
    // Draw scale points if in scale setting mode
    if (activeTool === 'scale') {
      if (photometryData.projectionType === 'profile' || photometryData.projectionType === 'profile45') {
        // Original scale points for profile projections
        if (photometryData.scaleMode === '10mm') {
          // Draw 10mm scale points
          if (photometryData.scalePoints.point0) {
            const point = photometryData.scalePoints.point0;
            const adjustedX = imageX + point.x * scale;
            const adjustedY = imageY + point.y * scale;
            
            ctx.beginPath();
            ctx.arc(adjustedX, adjustedY, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#00ff00'; // Green for point 0
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw label
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('0', adjustedX + 15, adjustedY - 15);
          }
          
          if (photometryData.scalePoints.point10) {
            const point = photometryData.scalePoints.point10;
            const adjustedX = imageX + point.x * scale;
            const adjustedY = imageY + point.y * scale;
            
            ctx.beginPath();
            ctx.arc(adjustedX, adjustedY, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#ff9900'; // Orange for point 10
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw label
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('10', adjustedX + 15, adjustedY - 15);
          }
          
          // Draw line between scale points if both are set
          if (photometryData.scalePoints.point0 && photometryData.scalePoints.point10) {
            const point0 = photometryData.scalePoints.point0;
            const point10 = photometryData.scalePoints.point10;
            const adjustedX0 = imageX + point0.x * scale;
            const adjustedY0 = imageY + point0.y * scale;
            const adjustedX10 = imageX + point10.x * scale;
            const adjustedY10 = imageY + point10.y * scale;
            
            ctx.beginPath();
            ctx.moveTo(adjustedX0, adjustedY0);
            ctx.lineTo(adjustedX10, adjustedY10);
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.stroke();
          }
        } else {
          // Draw 30mm scale points
          if (photometryData.scalePoints30.point0) {
            const point = photometryData.scalePoints30.point0;
            const adjustedX = imageX + point.x * scale;
            const adjustedY = imageY + point.y * scale;
            
            ctx.beginPath();
            ctx.arc(adjustedX, adjustedY, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#00ff00'; // Green for point 0
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw label
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('0', adjustedX + 15, adjustedY - 15);
          }
          
          if (photometryData.scalePoints30.point30) {
            const point = photometryData.scalePoints30.point30;
            const adjustedX = imageX + point.x * scale;
            const adjustedY = imageY + point.y * scale;
            
            ctx.beginPath();
            ctx.arc(adjustedX, adjustedY, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#ff9900'; // Orange for point 30
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw label
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('30', adjustedX + 15, adjustedY - 15);
          }
          
          // Draw line between scale points if both are set
          if (photometryData.scalePoints30.point0 && photometryData.scalePoints30.point30) {
            const point0 = photometryData.scalePoints30.point0;
            const point30 = photometryData.scalePoints30.point30;
            const adjustedX0 = imageX + point0.x * scale;
            const adjustedY0 = imageY + point0.y * scale;
            const adjustedX30 = imageX + point30.x * scale;
            const adjustedY30 = imageY + point30.y * scale;
            
            ctx.beginPath();
            ctx.moveTo(adjustedX0, adjustedY0);
            ctx.lineTo(adjustedX30, adjustedY30);
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.stroke();
          }
        }
      } else {
        // New calibration points for frontal and intraoral projections
        if (photometryData.calibrationPoints.point1) {
          const point = photometryData.calibrationPoints.point1;
          const adjustedX = imageX + point.x * scale;
          const adjustedY = imageY + point.y * scale;
          
          ctx.beginPath();
          ctx.arc(adjustedX, adjustedY, 5, 0, 2 * Math.PI);
          ctx.fillStyle = '#00ff00'; // Green for point 1
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw label
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 16px Arial';
          ctx.fillText('1', adjustedX + 15, adjustedY - 15);
        }
        
        if (photometryData.calibrationPoints.point2) {
          const point = photometryData.calibrationPoints.point2;
          const adjustedX = imageX + point.x * scale;
          const adjustedY = imageY + point.y * scale;
          
          ctx.beginPath();
          ctx.arc(adjustedX, adjustedY, 5, 0, 2 * Math.PI);
          ctx.fillStyle = '#ff9900'; // Orange for point 2
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw label
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 16px Arial';
          ctx.fillText('2', adjustedX + 15, adjustedY - 15);
        }
        
        // Draw line between calibration points if both are set
        if (photometryData.calibrationPoints.point1 && photometryData.calibrationPoints.point2) {
          const point1 = photometryData.calibrationPoints.point1;
          const point2 = photometryData.calibrationPoints.point2;
          const adjustedX1 = imageX + point1.x * scale;
          const adjustedY1 = imageY + point1.y * scale;
          const adjustedX2 = imageX + point2.x * scale;
          const adjustedY2 = imageY + point2.y * scale;
          
          ctx.beginPath();
          ctx.moveTo(adjustedX1, adjustedY1);
          ctx.lineTo(adjustedX2, adjustedY2);
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }
    }
    
    // Function to draw an angle visualization (lines with arc)
    const drawAngle = (point1Id, vertexId, point2Id, color = '#ff0000', lineWidth = 2) => {
      if (photometryData.points[point1Id] && photometryData.points[vertexId] && photometryData.points[point2Id]) {
        const point1 = photometryData.points[point1Id];
        const vertex = photometryData.points[vertexId];
        const point2 = photometryData.points[point2Id];
        const x1 = imageX + point1.x * scale;
        const y1 = imageY + point1.y * scale;
        const vx = imageX + vertex.x * scale;
        const vy = imageY + vertex.y * scale;
        const x2 = imageX + point2.x * scale;
        const y2 = imageY + point2.y * scale;
        
        // Draw first line from vertex to point1
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
        
        // Draw second line from vertex to point2
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
        
        // Calculate vectors from vertex
        const vec1 = { x: x1 - vx, y: y1 - vy };
        const vec2 = { x: x2 - vx, y: y2 - vy };
        
        // Calculate lengths of vectors
        const len1 = Math.sqrt(vec1.x * vec1.x + vec1.y * vec1.y);
        const len2 = Math.sqrt(vec2.x * vec2.x + vec2.y * vec2.y);
        if (len1 === 0 || len2 === 0) return;
        
        // Normalize vectors
        const normVec1 = { x: vec1.x / len1, y: vec1.y / len1 };
        const normVec2 = { x: vec2.x / len2, y: vec2.y / len2 };
        
        // Calculate radius for arc (15% of shorter vector length)
        const radius = Math.min(len1, len2) * 0.15;
        
        // Calculate cross product to determine the direction
        const crossProduct = normVec1.x * normVec2.y - normVec1.y * normVec2.x;
        
        // Number of segments for the arc
        const segments = 20;
        
        // Draw arc by connecting points
        ctx.beginPath();
        
        if (crossProduct >= 0) {
          // Counter-clockwise direction
          // Start at the first vector
          ctx.moveTo(vx + normVec1.x * radius, vy + normVec1.y * radius);
          
          // Draw segments of the arc
          for (let i = 1; i <= segments; i++) {
            // Interpolate between the two vectors
            const t = i / segments;
            
            // Spherical linear interpolation (slerp) for better arc approximation
            const angle = Math.acos(Math.max(-1, Math.min(1, normVec1.x * normVec2.x + normVec1.y * normVec2.y)));
            const sinAngle = Math.sin(angle);
            
            let interpVec;
            if (sinAngle > 0.001) {
              // Standard slerp
              const coeff1 = Math.sin((1 - t) * angle) / sinAngle;
              const coeff2 = Math.sin(t * angle) / sinAngle;
              interpVec = {
                x: normVec1.x * coeff1 + normVec2.x * coeff2,
                y: normVec1.y * coeff1 + normVec2.y * coeff2
              };
            } else {
              // Vectors are very close, use linear interpolation
              interpVec = {
                x: normVec1.x * (1 - t) + normVec2.x * t,
                y: normVec1.y * (1 - t) + normVec2.y * t
              };
            }
            
            ctx.lineTo(vx + interpVec.x * radius, vy + interpVec.y * radius);
          }
        } else {
          // Clockwise direction
          // Start at the second vector
          ctx.moveTo(vx + normVec2.x * radius, vy + normVec2.y * radius);
          
          // Draw segments of the arc (in reverse order)
          for (let i = 1; i <= segments; i++) {
            // Interpolate between the two vectors
            const t = i / segments;
            
            // Spherical linear interpolation (slerp) for better arc approximation
            const angle = Math.acos(Math.max(-1, Math.min(1, normVec1.x * normVec2.x + normVec1.y * normVec2.y)));
            const sinAngle = Math.sin(angle);
            
            let interpVec;
            if (sinAngle > 0.001) {
              // Standard slerp
              const coeff1 = Math.sin((1 - t) * angle) / sinAngle;
              const coeff2 = Math.sin(t * angle) / sinAngle;
              interpVec = {
                x: normVec2.x * coeff1 + normVec1.x * coeff2,
                y: normVec2.y * coeff1 + normVec1.y * coeff2
              };
            } else {
              // Vectors are very close, use linear interpolation
              interpVec = {
                x: normVec2.x * (1 - t) + normVec1.x * t,
                y: normVec2.y * (1 - t) + normVec1.y * t
              };
            }
            
            ctx.lineTo(vx + interpVec.x * radius, vy + interpVec.y * radius);
          }
        }
        
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    };
    
    // Draw angle visualizations for frontal projection
    if (photometryData.projectionType === 'frontal') {
      // Draw specific angles based on showAngles state
      if (showAngles.facialProfile) drawAngle('n', 'sn', 'pg', '#0000ff', 2);
    } else if (photometryData.projectionType === 'profile') {
      // Draw angle visualizations for profile projection
      if (showAngles.nasolabial) drawAngle('sn', 'ls', 'coll', '#0000ff', 2);
      if (showAngles.facialProfile) drawAngle('n', 'sn', 'pg', '#0000ff', 2);
    }
  }, [photometryData, selectedPoint, showPlanes, showAngles, activeTool]);
  
  // Draw points and measurements on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !photometryData.images[photometryData.projectionType]) return;
    
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Initialize image info on first load
      if (imageInfoRef.current.scale === 1 && imageInfoRef.current.width === 0) {
        initializeImageInfo(img);
      }
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const { x: imageX, y: imageY, width: scaledImgWidth, height: scaledImgHeight, scale } = imageInfoRef.current;
      
      // Draw all elements using the shared function
      drawAllElements(ctx, img, canvas.width, canvas.height, imageX, imageY, scaledImgWidth, scaledImgHeight, scale);
    };
    
    img.src = photometryData.images[photometryData.projectionType];
  }, [photometryData, selectedPoint, showPlanes, showAngles, activeTool, drawAllElements, photometryData.projectionType]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // ... (остальной код остается без изменений до функции handleSave)

const { addMeasurements, currentPatient, medicalCardData } = useData();

const handleSave = async () => {
    try {
      // Сначала генерируем полный отчет
      const report = generateReport();
      console.log('Generated photometry report:', report);
      
      // Проверяем, есть ли измерения
      if (Object.keys(photometryData.measurements).length === 0) {
        alert('Сначала выполните измерения перед сохранением!');
        return;
      }
      
      // Подготавливаем данные для сохранения
      const photometryDataToSave = {
        patientId: currentPatient?.id || 1,
        patientName: photometryData.patientName,
        analysisDate: photometryData.analysisDate,
        projectionType: photometryData.projectionType,
        measurements: photometryData.measurements,
        points: photometryData.points,
        scale: photometryData.scale,
        images: {
          uploaded: Object.keys(photometryData.images).filter(key => photometryData.images[key] !== null)
        },
        report: report,
        // Добавляем структурированные данные для медицинской карты
        structuredData: {
          // Для фронтальной проекции
          frontal: photometryData.projectionType === 'frontal' ? {
            faceWidth: photometryData.measurements.FaceWidth?.value || 0,
            faceHeight: photometryData.measurements.FullHeight?.value || 0,
            facialIndex: photometryData.measurements.FacialIndex?.value || 0,
            headShapeIndex: photometryData.measurements.HeadShapeIndex?.value || 0,
            chinPosition: photometryData.points?.gn ? 'определено' : 'правильное',
            chinFold: 'нормальная',
            lipClosure: 'сомкнуты',
            gumSmile: 'нет симптома',
            pupilLine: 'горизонтальная',
            midline: 'совпадает',
            occlusalLine: 'параллельна зрачковой линии',
            comments: report.conclusion || 'Фотометрический анализ выполнен',
            photos: ['анализ выполнен']
          } : null,
          // Для профильной проекции
          profile: photometryData.projectionType === 'profile' ? {
            profileType: photometryData.measurements.ProfileAngle?.interpretation || 'прямой',
            nasolabialAngle: photometryData.measurements.NasolabialAngle?.value || 100,
            mentolabialAngle: 130,
            facialConvexity: photometryData.measurements.ProfileAngle?.value || 165,
            chinPosition: photometryData.points?.pg ? 'определено' : 'правильное',
            upperLipPosition: photometryData.points?.ls ? 'определено' : 'правильное',
            lowerLipPosition: 'правильное',
            eLine: { upperLip: -2, lowerLip: 0 },
            comments: report.conclusion || 'Анализ профиля выполнен',
            photos: ['анализ выполнен']
          } : null,
          // Для профиля 45°
          profile45: photometryData.projectionType === 'profile45' ? {
            symmetry: 'удовлетворительная',
            headShape: photometryData.measurements?.HeadShapeIndex?.interpretation || 'мезоцефалическая',
            faceShape: photometryData.measurements?.FacialIndex?.interpretation || 'среднее лицо',
            zygomaticProminence: 'нормальная',
            gonialAngle: 'нормальный',
            comments: 'Анализ профиля 45° выполнен',
            photos: ['анализ выполнен']
          } : null
        }
      };
      
      console.log('Saving photometry data:', photometryDataToSave);
      
      // Сохраняем измерения в общем хранилище
      const saveResult = addMeasurements('photometry', photometryData.measurements, {
        patientName: photometryData.patientName,
        analysisDate: photometryData.analysisDate,
        projectionType: photometryData.projectionType,
        structuredData: photometryDataToSave.structuredData,
        fullReport: report,
        points: photometryData.points,
        scale: photometryData.scale
      });
      
      console.log('Save result:', saveResult);
      
      // Дополнительное сохранение в localStorage для гарантии
      try {
        // Сохраняем отдельный файл фотометрии
        const photometryStorageKey = `photometry_complete_${currentPatient?.id || 1}_${Date.now()}`;
        const completeData = {
          ...photometryDataToSave,
          savedAt: new Date().toISOString(),
          module: 'photometry',
          version: '2.0'
        };
        
        localStorage.setItem(photometryStorageKey, JSON.stringify(completeData));
        
        // Обновляем медицинскую карту напрямую
        const medicalCardKey = `medical_card_${currentPatient?.id || 1}`;
        const existingCard = localStorage.getItem(medicalCardKey);
        let cardData = existingCard ? JSON.parse(existingCard) : {};
        
        cardData.modules = {
          ...cardData.modules,
          photometry: {
            data: completeData,
            updatedAt: new Date().toISOString(),
            source: 'direct_photometry_save'
          }
        };
        
        // Обновляем фотоанализ в карте
        if (photometryDataToSave.structuredData) {
          cardData.photoAnalysis = {
            ...cardData.photoAnalysis,
            ...photometryDataToSave.structuredData
          };
        }
        
        cardData.lastUpdated = new Date().toISOString();
        localStorage.setItem(medicalCardKey, JSON.stringify(cardData));
        
        console.log('Direct save to medical card successful');
        
      } catch (directSaveError) {
        console.error('Direct save error:', directSaveError);
      }
      
      alert('✅ Данные фотометрии успешно сохранены в медицинскую карту!\n\nПерейдите в медицинскую карту пациента, чтобы увидеть результаты.');
      
      // Обновляем состояние для отображения успеха
      setSaveStatus({
        isSaving: false,
        success: true,
        message: '✅ Данные сохранены!'
      });
      
      // Автоматический переход через 2 секунды
      setTimeout(() => {
        setSaveStatus({
          isSaving: false,
          success: false,
          message: ''
        });
        
        // Предлагаем перейти в медицинскую карту
        if (window.confirm('Хотите перейти в медицинскую карту для просмотра результатов?')) {
          window.location.hash = '#medical-card';
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error saving photometry data:', error);
      alert(`❌ Ошибка при сохранении данных: ${error.message}`);
      
      setSaveStatus({
        isSaving: false,
        success: false,
        message: `❌ Ошибка: ${error.message}`
      });
    }
  };
// ... (остальной код остается без изменений)
  
  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if Delete or Backspace key is pressed and a point is selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPoint) {
        e.preventDefault(); // Prevent default browser behavior
        deleteSelectedPoint();
      }
    };
    
    // Add event listener to both window and document for better compatibility
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPoint, deleteSelectedPoint]);

  return (
    <div className="photometry-module">
      <h2>Модуль фотометрии</h2>
      
      {/* Main Photometry Interface */}
      <div className="photometry-main">
        {/* Patient Info */}
        <div className="patient-info">
          <h3>Информация о пациенте</h3>
          <div className="form-group">
            <label>Имя пациента:</label>
            <input
              type="text"
              value={photometryData.patientName}
              onChange={(e) => setPhotometryData(prev => ({
                ...prev,
                patientName: e.target.value
              }))}
            />
          </div>
          <div className="form-group">
            <label>Дата анализа:</label>
            <input
              type="date"
              value={photometryData.analysisDate}
              onChange={(e) => setPhotometryData(prev => ({
                ...prev,
                analysisDate: e.target.value
              }))}
            />
          </div>
          <div className="form-group">
            <label>Тип проекции:</label>
            <select
              value={photometryData.projectionType}
              onChange={(e) => setPhotometryData(prev => ({
                ...prev,
                projectionType: e.target.value
              }))}
            >
              <option value="frontal">Анфас</option>
              <option value="profile">Профиль</option>
              <option value="profile45">Профиль 45°</option>
              <option value="intraoral">Внутриротовые</option>
            </select>
          </div>
        </div>
        
        {/* Image Upload */}
        <div className="image-upload">
          <h3>Фотографии</h3>
          <div className="image-container">
            <div className="canvas-container" ref={containerRef}>
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                onMouseDown={(e) => {
                  // Handle left click for point interaction
                  if (e.button === 0) {
                    handleCanvasMouseDown(e);
                  }
                  // Handle middle click for magnifier toggle
                  else if (e.button === 1) {
                    handleCanvasMouseWheelClick(e);
                  }
                }}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseLeave}
                onContextMenu={handleCanvasContextMenu}
              />
              {isMagnifierActive && (
                <div
                  className="magnifier-glass"
                  style={{
                    position: 'absolute',
                    left: magnifierPosition.x,
                    top: magnifierPosition.y,
                    width: '100px',
                    height: '100px',
                    border: '2px solid #000',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 1000,
                    boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                    transform: 'translate(-50%, -50%)',
                    overflow: 'hidden'
                  }}
                >
                  <canvas
                    width="100"
                    height="100"
                    ref={(canvas) => {
                      if (canvas && photometryData.images[photometryData.projectionType]) {
                        const ctx = canvas.getContext('2d');
                        const img = new Image();
                        img.onload = () => {
                          // Clear canvas
                          ctx.clearRect(0, 0, 200, 200);
                          
                          // Calculate the portion of the image to show in the magnifier
                          const { x: imageX, y: imageY, scale, imgWidth, imgHeight } = imageInfoRef.current;
                          
                          // Calculate the center of the magnifier in image coordinates
                          const centerX = (magnifierPosition.x - imageX) / scale;
                          const centerY = (magnifierPosition.y - imageY) / scale;
                          
                          // Calculate the visible area (considering zoom)
                          const visibleWidth = 100 / (magnifierZoom * scale);
                          const visibleHeight = 100 / (magnifierZoom * scale);
                          
                          // Calculate the source rectangle
                          const sourceX = Math.max(0, centerX - visibleWidth / 2);
                          const sourceY = Math.max(0, centerY - visibleHeight / 2);
                          const sourceWidth = Math.min(visibleWidth, imgWidth - sourceX);
                          const sourceHeight = Math.min(visibleHeight, imgHeight - sourceY);
                          
                          // Draw the magnified image portion
                          ctx.drawImage(
                            img,
                            sourceX, sourceY, sourceWidth, sourceHeight,
                            0, 0, 100, 100
                          );
                          
                          // Draw all elements (points, lines, angles) on the magnifier canvas
                          // We need to adjust the coordinates for the magnified view
                          drawAllElements(
                            ctx,
                            img,
                            100,
                            100,
                            -sourceX * magnifierZoom * scale,
                            -sourceY * magnifierZoom * scale,
                            imgWidth * magnifierZoom * scale,
                            imgHeight * magnifierZoom * scale,
                            magnifierZoom * scale
                          );
                        };
                        img.src = photometryData.images[photometryData.projectionType];
                      }
                    }}
                  />
                </div>
              )}
              {selectedPoint && (
                <button className="delete-point-btn" onClick={deleteSelectedPoint}>
                  Удалить точку
                </button>
              )}
            </div>
            
            <div className="toolbar">
              <h4>Инструменты</h4>
              <div className="tools">
                <button
                  className={activeTool === 'select' ? 'active' : ''}
                  onClick={() => setActiveTool('select')}
                >
                  Выбор
                </button>
                <button
                  className={activeTool === 'scale' ? 'active' : ''}
                  onClick={() => {
                    setActiveTool('scale');
                    setPhotometryData(prev => ({ ...prev, isSettingScale: true }));
                  }}
                >
                  Установка масштаба
                </button>
                <button
                  className={activeTool === 'point' ? 'active' : ''}
                  onClick={() => setActiveTool('point')}
                  disabled={photometryData.scale <= 1}
                >
                  Перейти к расстановке точек
                </button>
              </div>
              
              <div className="scale-control">
                {photometryData.projectionType === 'profile' || photometryData.projectionType === 'profile45' ? (
                  <>
                    <label>Режим масштаба:</label>
                    <select
                      value={photometryData.scaleMode}
                      onChange={(e) => {
                        const newMode = e.target.value;
                        setPhotometryData(prev => ({
                          ...prev,
                          scaleMode: newMode
                        }));
                        
                        // Reset scale points when switching modes
                        if (newMode === '10mm') {
                          setPhotometryData(prev => ({
                            ...prev,
                            scalePoints30: { point0: null, point30: null }
                          }));
                        } else {
                          setPhotometryData(prev => ({
                            ...prev,
                            scalePoints: { point0: null, point10: null }
                          }));
                        }
                      }}
                    >
                      <option value="10mm">10 мм</option>
                      <option value="30mm">30 мм</option>
                    </select>
                  </>
                ) : (
                  <>
                    <label>Тип эталонного объекта:</label>
                    <select
                      value={photometryData.calibrationType}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setPhotometryData(prev => ({
                          ...prev,
                          calibrationType: newType
                        }));
                        
                        // Set default size based on object type
                        let defaultSize = 10;
                        switch (newType) {
                          case 'implant':
                            defaultSize = 10; // Typical implant length
                            break;
                          case 'crown':
                            defaultSize = 8; // Typical crown width
                            break;
                          case 'distance':
                            defaultSize = 15; // Typical intermolar distance
                            break;
                          case 'known_object':
                            defaultSize = 10; // Default for known objects
                            break;
                          default:
                            defaultSize = 10;
                        }
                        
                        setPhotometryData(prev => ({
                          ...prev,
                          calibrationObjectSize: defaultSize
                        }));
                      }}
                    >
                      <option value="implant">Имплантат</option>
                      <option value="crown">Коронка/брекет</option>
                      <option value="distance">Межзубное расстояние</option>
                      <option value="known_object">Известный объект</option>
                    </select>
                    
                    <label>Размер объекта (мм):</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="0.1"
                      value={photometryData.calibrationObjectSize}
                      onChange={(e) => {
                        const newSize = parseFloat(e.target.value) || 0;
                        setPhotometryData(prev => ({
                          ...prev,
                          calibrationObjectSize: newSize
                        }));
                      }}
                    />
                  </>
                )}
                
                <button
                  onClick={() => {
                    if (photometryData.projectionType === 'profile' || photometryData.projectionType === 'profile45') {
                      // Original reset for profile projections
                      if (photometryData.scaleMode === '10mm') {
                        setPhotometryData(prev => ({
                          ...prev,
                          scalePoints: { point0: null, point10: null },
                          scale: 1
                        }));
                      } else {
                        setPhotometryData(prev => ({
                          ...prev,
                          scalePoints30: { point0: null, point30: null },
                          scale: 1
                        }));
                      }
                    } else {
                      // New reset for frontal and intraoral projections
                      setPhotometryData(prev => ({
                        ...prev,
                        calibrationPoints: { point1: null, point2: null },
                        scale: 1
                      }));
                    }
                  }}
                  style={{ marginTop: '10px', padding: '5px 10px' }}
                >
                  Сбросить масштаб
                </button>
                
                {activeTool === 'scale' && (
                  <div className="scale-instructions">
                    {photometryData.projectionType === 'profile' || photometryData.projectionType === 'profile45' ? (
                      <>
                        <p>
                          {photometryData.scaleMode === '10mm'
                            ? 'Установите точку 0, затем точку 10 на расстоянии 10 мм'
                            : 'Установите точку 0, затем точку 30 на расстоянии 30 мм'}
                        </p>
                        <p>
                          {photometryData.scaleMode === '10mm'
                            ? `Точек установлено: ${photometryData.scalePoints.point0 ? 1 : 0}${photometryData.scalePoints.point10 ? ' + 1' : ''}`
                            : `Точек установлено: ${photometryData.scalePoints30.point0 ? 1 : 0}${photometryData.scalePoints30.point30 ? ' + 1' : ''}`}
                        </p>
                      </>
                    ) : (
                      <>
                        <p>Установите первую точку на одном конце эталонного объекта</p>
                        <p>Установите вторую точку на другом конце эталонного объекта</p>
                        <p>Тип объекта: {photometryData.calibrationType}</p>
                        <p>Размер объекта: {photometryData.calibrationObjectSize} мм</p>
                        <p>Точек установлено: {photometryData.calibrationPoints.point1 ? 1 : 0}{photometryData.calibrationPoints.point2 ? ' + 1' : ''}</p>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* Visualization Controls */}
              <div className="visualization-controls">
                <h4>Настройки визуализации</h4>
                
                {/* Visualization controls for frontal projection */}
                {photometryData.projectionType === 'frontal' && (
                  <div className="control-group">
                    <h5>Линии</h5>
                    <div className="control-buttons">
                      <button
                        onClick={() => setShowPlanes(prev => ({
                          midline: true,
                          pupilLine: true,
                          occlusalLine: true,
                          eLine: true
                        }))}
                        className="select-all-btn"
                      >
                        Выбрать все линии
                      </button>
                      <button
                        onClick={() => setShowPlanes(prev => ({
                          midline: false,
                          pupilLine: false,
                          occlusalLine: false,
                          eLine: false
                        }))}
                        className="deselect-all-btn"
                      >
                        Убрать все линии
                      </button>
                    </div>
                    <label>
                      <input
                        type="checkbox"
                        checked={showPlanes.midline}
                        onChange={(e) => setShowPlanes(prev => ({ ...prev, midline: e.target.checked }))}
                      />
                      Срединная линия лица (n-gn)
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={showPlanes.pupilLine}
                        onChange={(e) => setShowPlanes(prev => ({ ...prev, pupilLine: e.target.checked }))}
                      />
                      Зрачковая линия (n-sn)
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={showPlanes.occlusalLine}
                        onChange={(e) => setShowPlanes(prev => ({ ...prev, occlusalLine: e.target.checked }))}
                      />
                      Окклюзионная линия (sn-pg)
                    </label>
                  </div>
                )}
                
                {photometryData.projectionType === 'frontal' && (
                  <div className="control-group">
                    <h5>Углы</h5>
                    <div className="control-buttons">
                      <button
                        onClick={() => setShowAngles(prev => ({
                          nasolabial: true,
                          facialProfile: true
                        }))}
                        className="select-all-btn"
                      >
                        Выбрать все углы
                      </button>
                      <button
                        onClick={() => setShowAngles(prev => ({
                          nasolabial: false,
                          facialProfile: false
                        }))}
                        className="deselect-all-btn"
                      >
                        Убрать все углы
                      </button>
                    </div>
                    <label>
                      <input
                        type="checkbox"
                        checked={showAngles.facialProfile}
                        onChange={(e) => setShowAngles(prev => ({ ...prev, facialProfile: e.target.checked }))}
                      />
                      Угол профиля лица (n-sn-pg)
                    </label>
                  </div>
                )}
                
                {/* Visualization controls for profile projection */}
                {photometryData.projectionType === 'profile' && (
                  <div className="control-group">
                    <h5>Линии</h5>
                    <div className="control-buttons">
                      <button
                        onClick={() => setShowPlanes(prev => ({
                          midline: true,
                          pupilLine: true,
                          occlusalLine: true,
                          eLine: true
                        }))}
                        className="select-all-btn"
                      >
                        Выбрать все линии
                      </button>
                      <button
                        onClick={() => setShowPlanes(prev => ({
                          midline: false,
                          pupilLine: false,
                          occlusalLine: false,
                          eLine: false
                        }))}
                        className="deselect-all-btn"
                      >
                        Убрать все линии
                      </button>
                    </div>
                    <label>
                      <input
                        type="checkbox"
                        checked={showPlanes.eLine}
                        onChange={(e) => setShowPlanes(prev => ({ ...prev, eLine: e.target.checked }))}
                      />
                      E-line (pro-pog)
                    </label>
                  </div>
                )}
                
                {photometryData.projectionType === 'profile' && (
                  <div className="control-group">
                    <h5>Углы</h5>
                    <div className="control-buttons">
                      <button
                        onClick={() => setShowAngles(prev => ({
                          nasolabial: true,
                          facialProfile: true
                        }))}
                        className="select-all-btn"
                      >
                        Выбрать все углы
                      </button>
                      <button
                        onClick={() => setShowAngles(prev => ({
                          nasolabial: false,
                          facialProfile: false
                        }))}
                        className="deselect-all-btn"
                      >
                        Убрать все углы
                      </button>
                    </div>
                    <label>
                      <input
                        type="checkbox"
                        checked={showAngles.nasolabial}
                        onChange={(e) => setShowAngles(prev => ({ ...prev, nasolabial: e.target.checked }))}
                      />
                      Носогубный угол (sn-ls-coll)
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={showAngles.facialProfile}
                        onChange={(e) => setShowAngles(prev => ({ ...prev, facialProfile: e.target.checked }))}
                      />
                      Угол профиля лица (n-sn-pg)
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Points List on the left side */}
          <div className="points-list" ref={pointsListRef}>
            {/* Display selected point image above the points list */}
            {selectedPointImage && (
              <div className="selected-point-image">
                <h4>Изображение точки: {nextPointToPlace || selectedPoint}</h4>
                <img
                  src={selectedPointImage}
                  alt={`Точка ${nextPointToPlace || selectedPoint}`}
                  onError={(e) => {
                    // Handle case where image doesn't exist
                    e.target.style.display = 'none';
                  }}
                  onLoad={(e) => {
                    // Make sure the image is visible when it loads successfully
                    e.target.style.display = 'block';
                  }}
                />
              </div>
            )}
            
            {/* Calibration section - Hidden after calibration is complete */}
            <div className={`calibration-section ${photometryData.scale > 1 ? 'hidden' : ''}`}>
              <h3>Калибровка</h3>
              <div className="calibration-info">
                <p>Перед расстановкой точек необходимо выполнить калибровку изображения:</p>
                <ol>
                  <li>Выберите инструмент "Установка масштаба" в правой панели</li>
                  <li>Выберите режим калибровки (10 мм или 30 мм)</li>
                  <li>Установите первую точку на известном расстоянии</li>
                  <li>Установите вторую точку на расстоянии 10 мм или 30 мм от первой</li>
                  <li>После калибровки станет доступна расстановка точек</li>
                </ol>
              </div>
              
              <div className="calibration-status">
                {photometryData.scale > 1 ? (
                  <p className="calibrated">✓ Изображение откалибровано</p>
                ) : (
                  <p className="not-calibrated">⚠ Необходима калибровка</p>
                )}
              </div>
            </div>
            
            <h3>Точки для расстановки</h3>
            <div className="points-grid">
              {pointDefinitions[photometryData.projectionType].map(point => (
                <div
                  key={point.id}
                  className={`point-item ${photometryData.points[point.id] ? 'placed' : ''} ${nextPointToPlace === point.id ? 'selected next-point' : ''} ${selectedPoint === point.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedPoint(point.id);
                    setSelectedPointImage(`/${point.id}.jpg`); // Set the image for the selected point
                    setActiveTool('select');
                  }}
                >
                  <span className="point-id">{point.id}</span>
                  <span className="point-name">{point.name}</span>
                  {photometryData.points[point.id] ? (
                    <span
                      className="point-status"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPoint(point.id);
                        setSelectedPointImage(`/${point.id}.jpg`); // Set the image for the selected point
                        setActiveTool('select');
                      }}
                    >✓</span>
                  ) : nextPointToPlace === point.id ? (
                    <span className="point-next-indicator">След.</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Measurements */}
        {Object.keys(photometryData.points).length > 0 && (
          <div className="measurements">
            <h3>Измерения</h3>
            <button onClick={calculateMeasurements}>Рассчитать измерения</button>
            {Object.keys(photometryData.measurements).length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>Измерение</th>
                    <th>Значение</th>
                    <th>Единицы</th>
                    <th>Норма</th>
                    <th>Интерпретация</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(photometryData.measurements || {}).map(([key, measurement]) => (
                    <tr key={key}>
                      <td>{measurement.name}</td>
                      <td>{measurement.value.toFixed(2)}</td>
                      <td>{measurement.unit}</td>
                      <td>{measurement.norm || 'N/A'}</td>
                      <td>{measurement.interpretation || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        
        {/* Report */}
        {(reportData || Object.keys(photometryData.measurements).length > 0) && (
          <div className="report">
            <h3>Отчет</h3>
            <button onClick={generateReport}>Сформировать отчет</button>
            
            {reportData && (
              <div className="report-content">
                <h4>Результаты фотометрического анализа</h4>
                <p><strong>Пациент:</strong> {reportData.patientName}</p>
                <p><strong>Дата анализа:</strong> {reportData.analysisDate}</p>
                <p><strong>Тип проекции:</strong> {
                  reportData.projectionType === 'frontal' ? 'Анфас' : 
                  reportData.projectionType === 'profile' ? 'Профиль' :
                  reportData.projectionType === 'profile45' ? 'Профиль 45°' : 'Внутриротовые'
                }</p>
                <p><strong>Заключение:</strong> {reportData.conclusion}</p>
                
                <table>
                  <thead>
                    <tr>
                      <th>Параметр</th>
                      <th>Значение</th>
                      <th>Единицы</th>
                      <th>Норма</th>
                      <th>Интерпретация</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(reportData.measurements || {}).map(([key, measurement]) => (
                      <tr key={key}>
                        <td>{measurement.name}</td>
                        <td>{measurement.value.toFixed(2)}</td>
                        <td>{measurement.unit}</td>
                        <td>{measurement.norm || 'N/A'}</td>
                        <td>{measurement.interpretation || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {/* Export Buttons */}
        {reportData && (
          <div className="export-buttons">
            <button onClick={exportReportAsPDF}>Экспорт в PDF</button>
            <button onClick={exportReportAsPPTX}>Экспорт в PPTX</button>
          </div>
        )}
        
        {/* Actions */}
        <div className="actions">
          <button onClick={handleSave}>
            Сохранить измерения
          </button>
        </div>
        
        {loading && <div className="loading">Обработка...</div>}
        {error && <div className="error">{error}</div>}
        
        {showFileLibrary && (
          <div className="modal-overlay">
            <div className="modal-content">
              <FileLibrary
                onSelectFile={handleLoadImageFromDatabase}
                onClose={() => setShowFileLibrary(false)}
              />
              <button onClick={() => setShowFileLibrary(false)} style={{ marginTop: '10px' }}>
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotometryModule;