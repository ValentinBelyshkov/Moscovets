import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// Используем локальные сервисы вместо серверных
import localFileService from '../services/localFileService';
import localMedicalRecordService from '../services/localMedicalRecordService';
import { useData } from '../contexts/DataContext';
import FileLibrary from './FileLibrary';
// import ImageSelectionModal from './ImageSelectionModal'; // Removed as we're using PhotoTypeSelection instead
import CephalometryPhotoSelection from './CephalometryPhotoSelection';
import './CephalometryModule.css';

// In a real application, you would import these libraries:
// import jsPDF from 'jspdf';
// import 'jspdf-autotable';
// import pptxgen from 'pptxgenjs';


const CephalometryModule = () => {
  const navigate = useNavigate();
  
  // State for cephalometry data
  const [cephalometryData, setCephalometryData] = useState({
    patientName: 'John Doe',
    analysisDate: new Date().toISOString().split('T')[0],
    images: {
      frontal: null,
      lateral: null,
      profile45: null,
      intraoral: null
    },
    imageDimensions: { width: 0, height: 0 },
    scale: 1, // pixels per mm
    scaleMode: '10mm', // '10mm' or '30mm' for lateral projection
    scalePoints: { point0: null, point10: null }, // For 10mm mode
    scalePoints30: { point0: null, point30: null }, // For 30mm mode
    isSettingScale: false, // Flag to indicate if we're in scale setting mode
    projectionType: 'frontal', // 'frontal', 'lateral', 'profile45', 'intraoral'
    points: {},
    measurements: {},
    interpretation: {},
    // New calibration system for frontal projection
    calibrationType: 'implant', // 'implant', 'crown', 'distance', 'known_object'
    calibrationObjectSize: 10, // Size in mm for the selected object
    calibrationPoints: { point1: null, point2: null }, // Points for calibration
    calibrationDistance: 0 // Distance between calibration points in mm
  });
  
  // State to track if images are uploaded
  const [imagesUploaded, setImagesUploaded] = useState(false);
  // Visualization settings
  const [showPlanes, setShowPlanes] = useState({
    nsl: false,
    fh: false,
    nl: false,
    ocp: false,
    ml: false,
    goAr: false,
    gonialAngle: false
  });
  
  const [showAngles, setShowAngles] = useState({
    sna: false,
    snb: false,
    anb: false,
    snPg: false,
    beta: false,
    nsBa: false,
    nlNsl: false,
    mlNsl: false,
    nlMl: false,
    gonialAngle: false
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
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showMedicalCardLink, setShowMedicalCardLink] = useState(false);
  
  // Refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pointsListRef = useRef(null);
  const imageInfoRef = useRef({ scale: 1, x: 0, y: 0, width: 0, height: 0 });
  
  // Get data from context
  const { medicalCardData, updateMedicalCardData, currentPatient } = useData();
  
  // Point definitions for different projection types
  const pointDefinitions = useMemo(() => ({
    frontal: [
      { id: 'eu_L', name: 'eu_L - Латерально выступающая точка на боковой поверхности головы слева' },
      { id: 'eu_R', name: 'eu_R - Латерально выступающая точка на боковой поверхности головы справа' },
      { id: 'zy_L', name: 'zy_L - Наиболее выступающая кнаружи точка скуловой дуги слева' },
      { id: 'zy_R', name: 'zy_R - Наиболее выступающая кнаружи точка скуловой дуги справа' },
      { id: 'go_L', name: 'go_L - Точка угла нижней челюсти слева' },
      { id: 'go_R', name: 'go_R - Точка угла нижней челюсти справа' },
      { id: 'n', name: 'n - Nasion (наиболее глубокая точка между носом и лбом)' },
      { id: 'sn', name: 'sn - Subnasale (середина перехода перегородки носа к верхней губе)' },
      { id: 'gn', name: 'gn - Gnatios (наиболее выступающая точка подбородка)' },
      { id: 'pg', name: 'pg - Pogonion (наиболее выступающая точка подбородочного выступа)' },
      { id: 'oph', name: 'oph - Оphrion (точка на пересечении средней линии лица и касательной к надбровным дугам)' }
    ],
    lateral: [
      { id: 'S', name: 'S - Sella (точка в центре турецкого седла)' },
      { id: 'N', name: 'N - Nasion (наиболее глубокая точка между носом и лбом)' },
      { id: 'A', name: 'A - A point (точка на наиболее глубокой части передней стенки альвеолярного гребня верхней челюсти)' },
      { id: 'B', name: 'B - B point (точка на наиболее глубокой части передней стенки альвеолярного гребня нижней челюсти)' },
      { id: 'PNS', name: 'PNS - Posterior Nasal Spine (задняя носовая ость)' },
      { id: 'ANS', name: 'ANS - Anterior Nasal Spine (передняя носовая ость)' },
      { id: 'Go', name: 'Go - Gonion (точка на углу нижней челюсти)' },
      { id: 'Me', name: 'Me - Menton (точка на нижней точке подбородка)' },
      { id: 'Pg', name: 'Pg - Pogonion (наиболее выступающая точка подбородочного выступа)' },
      { id: 'Ar', name: 'Ar - Articulare (точка на пересечении контуров нижнего края ветви и заднего края мыщелкового отростка)' },
      { id: 'Ba', name: 'Ba - Basion (точка на нижнем конце передней границы большого затылочного отверстия)' },
      { id: 'Gn', name: 'Gn - Gnathion (точка на нижней точке подбородочного выступа)' },
      { id: 'E1', name: 'E1 - Точка на середине режущих краев резцов (середина отрезка между точками ii и Is)' },
      { id: 'P6', name: 'P6 - Точка на пересечении касательной к нижнему краю носа и линии ii-Is' },
      { id: 'ii', name: 'ii - Incision Inferius (точка на режущем крае нижнего центрального резца)' },
      { id: 'Is', name: 'Is - Incision Superius (точка на режущем крае верхнего центрального резца)' },
      { id: 'Aii', name: 'Aii - Точка на альвеолярной дуге у основания нижнего центрального резца' },
      { id: 'Ais', name: 'Ais - Точка на альвеолярной дуге у основания верхнего центрального резца' }
    ],
    profile45: [
      { id: 'n', name: 'n - Nasion (наиболее глубокая точка между носом и лбом)' },
      { id: 'sn', name: 'sn - Subnasale (середина перехода перегородки носа к верхней губе)' },
      { id: 'pg', name: 'pg - Pogonion (наиболее выступающая точка подбородочного выступа)' },
      { id: 'zy_L', name: 'zy_L - Наиболее выступающая кнаружи точка скуловой дуги слева' },
      { id: 'zy_R', name: 'zy_R - Наиболее выступающая кнаружи точка скуловой дуги справа' }
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
  
  // Handle photos selected from CephalometryPhotoSelection
  const handlePhotosSelected = (photos) => {
    // Convert uploaded files to URLs for display
    const convertedPhotos = {};
    
    Object.entries(photos).forEach(([photoType, file]) => {
      if (file && file.id) {
        // File is already uploaded to local storage, get it by ID
        localFileService.downloadFile(file.id).then(response => {
          console.log('Download file response:', response);
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
            console.error('Invalid response format:', response);
            alert('Ошибка: получен неверный формат данных изображения');
            return;
          }
          
          console.log('Creating object URL with blob:', blob);
          
          // Add error handling for createObjectURL
          try {
            const imageUrl = URL.createObjectURL(blob);
            
            setCephalometryData(prev => ({
              ...prev,
              images: {
                ...prev.images,
                [photoType]: imageUrl
              },
              imageDimensions: { width: 0, height: 0 } // Will be set when image loads
            }));
            
            // Set projection type to the first available photo
            if (!cephalometryData.projectionType || cephalometryData.projectionType === 'frontal') {
              setCephalometryData(prev => ({
                ...prev,
                projectionType: photoType
              }));
            }
            
            // Automatically activate scale setting mode when image is loaded
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
  };
  
  // Load image from local storage
  const handleLoadImageFromDatabase = async (fileId) => {
    try {
      setLoading(true);
      const response = await localFileService.downloadFile(fileId);
      
      console.log('Load image from database response:', response);
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
      
      console.log('Creating object URL with blob:', blob);
      const imageUrl = URL.createObjectURL(blob);
      
      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        setCephalometryData(prev => ({
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
    if (!cephalometryData.images[cephalometryData.projectionType] || !imagesUploaded) return;
    
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
        const isScaleSet = cephalometryData.scale > 1;
        if (!isScaleSet) {
          alert('Пожалуйста, сначала установите масштаб перед расстановкой точек.');
          return;
        }
        
        // Use the next point to be placed
        if (nextPointToPlace) {
          // Set the point image before placing the point
          setSelectedPoint(nextPointToPlace);
          
          // If the next point is E1 and both ii and Is are placed, calculate E1 automatically
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
            
            // Clear nextPointToPlace since E1 is automatically placed
            setNextPointToPlace(null);
          } else {
            // Normal point placement
            setCephalometryData(prev => ({
              ...prev,
              points: {
                ...prev.points,
                [nextPointToPlace]: { x: originalX, y: originalY }
              }
            }));
          }
          
          // Auto-place E1 immediately after placing C, if ii and Is are already placed
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
        // Check if we clicked on an existing point
        let clickedPointId = null;
        Object.entries(cephalometryData.points || {}).forEach(([id, point]) => {
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
        if (cephalometryData.projectionType === 'lateral') {
          // Original scale setting for lateral projection
          if (cephalometryData.scaleMode === '10mm') {
            // For 10mm mode, we need two points: 0 and 10
            if (!cephalometryData.scalePoints.point0) {
              // Set the first point (0)
              setCephalometryData(prev => ({
                ...prev,
                scalePoints: {
                  ...prev.scalePoints,
                  point0: { x: originalX, y: originalY }
                }
              }));
            } else if (!cephalometryData.scalePoints.point10) {
              // Set the second point (10)
              setCephalometryData(prev => ({
                ...prev,
                scalePoints: {
                  ...prev.scalePoints,
                  point10: { x: originalX, y: originalY }
                }
              }));
              
              // Calculate scale: 10mm = distance between point0 and point10
              const dx = originalX - cephalometryData.scalePoints.point0.x;
              const dy = originalY - cephalometryData.scalePoints.point0.y;
              const pixelDistance = Math.sqrt(dx * dx + dy * dy);
              const calculatedScale = pixelDistance / 10; // pixels per mm
              
              setCephalometryData(prev => ({
                ...prev,
                scale: calculatedScale,
                isSettingScale: false
              }));
              
              // Switch to point placement tool after setting scale
              setActiveTool('point');
            }
          } else {
            // For 30mm mode, we need two points: 0 and 30
            if (!cephalometryData.scalePoints30.point0) {
              // Set the first point (0)
              setCephalometryData(prev => ({
                ...prev,
                scalePoints30: {
                  ...prev.scalePoints30,
                  point0: { x: originalX, y: originalY }
                }
              }));
            } else if (!cephalometryData.scalePoints30.point30) {
              // Set the second point (30)
              setCephalometryData(prev => ({
                ...prev,
                scalePoints30: {
                  ...prev.scalePoints30,
                  point30: { x: originalX, y: originalY }
                }
              }));
              
              // Calculate scale: 30mm = distance between point0 and point30
              const dx = originalX - cephalometryData.scalePoints30.point0.x;
              const dy = originalY - cephalometryData.scalePoints30.point0.y;
              const pixelDistance = Math.sqrt(dx * dx + dy * dy);
              const calculatedScale = pixelDistance / 30; // pixels per mm
              
              setCephalometryData(prev => ({
                ...prev,
                scale: calculatedScale,
                isSettingScale: false
              }));
              
              // Switch to point placement tool after setting scale
              setActiveTool('point');
            }
          }
        } else {
          // New calibration system for frontal projection
          if (!cephalometryData.calibrationPoints.point1) {
            // Set the first calibration point
            setCephalometryData(prev => ({
              ...prev,
              calibrationPoints: {
                ...prev.calibrationPoints,
                point1: { x: originalX, y: originalY }
              }
            }));
          } else if (!cephalometryData.calibrationPoints.point2) {
            // Set the second calibration point
            setCephalometryData(prev => ({
              ...prev,
              calibrationPoints: {
                ...prev.calibrationPoints,
                point2: { x: originalX, y: originalY }
              }
            }));
            
            // Calculate scale based on the selected calibration object size
            const dx = originalX - cephalometryData.calibrationPoints.point1.x;
            const dy = originalY - cephalometryData.calibrationPoints.point1.y;
            const pixelDistance = Math.sqrt(dx * dx + dy * dy);
            const calculatedScale = pixelDistance / cephalometryData.calibrationObjectSize; // pixels per mm
            
            setCephalometryData(prev => ({
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
    if (activeTool === 'point' && cephalometryData.images[cephalometryData.projectionType] && imagesUploaded) {
      // Get all point keys
      const pointKeys = Object.keys(cephalometryData.points);
      
      // If we have points, delete the last one
      if (pointKeys.length > 0) {
        // For simplicity, we'll delete the last key in the object
        // In a more sophisticated implementation, we might track insertion order
        const lastPointKey = pointKeys[pointKeys.length - 1];
        
        // Remove the last point
        setCephalometryData(prev => {
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
    if (!cephalometryData.images[cephalometryData.projectionType] || !imagesUploaded) return;
    
    // Left mouse button for point interaction
    if (e.button === 0 && activeTool === 'select') {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      const { x: imageX, y: imageY, scale } = imageInfoRef.current;
      
      // Check if we clicked on an existing point
      let clickedPointId = null;
      Object.entries(cephalometryData.points || {}).forEach(([id, point]) => {
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
        const point = cephalometryData.points[clickedPointId];
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
    if (!cephalometryData.images[cephalometryData.projectionType] || !imagesUploaded) return;
    
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
      
      setCephalometryData(prev => ({
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
    if (e.button === 1 && cephalometryData.images[cephalometryData.projectionType] && imagesUploaded) {
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
      setCephalometryData(prev => {
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
    return cephalometryData.scale > 0 ? pixelDistance / cephalometryData.scale : pixelDistance;
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
    const points = cephalometryData.points;
    
    // Calculate standard cephalometric measurements based on projection type
    if (cephalometryData.projectionType === 'lateral') {
      // Document-required angles for lateral projection
      // SNA angle
      if (points['S'] && points['N'] && points['A']) {
        const snaValue = calculateAngle(points['S'], points['N'], points['A']);
        let snaInterpretation = '';
        if (snaValue < 80) {
          snaInterpretation = 'Ретрогнатия верхней челюсти';
        } else if (snaValue > 84) {
          snaInterpretation = 'Прогнатия верхней челюсти';
        } else {
          snaInterpretation = 'Норма';
        }
        
        measurements.SNA = {
          name: 'SNA',
          value: snaValue,
          unit: '°',
          interpretation: snaInterpretation,
          norm: '80-84°'
        };
      }
      
      // SNB angle
      if (points['S'] && points['N'] && points['B']) {
        const snbValue = calculateAngle(points['S'], points['N'], points['B']);
        let snbInterpretation = '';
        if (snbValue < 78) {
          snbInterpretation = 'Ретрогнатия нижней челюсти';
        } else if (snbValue > 82) {
          snbInterpretation = 'Прогнатия нижней челюсти';
        } else {
          snbInterpretation = 'Норма';
        }
        
        measurements.SNB = {
          name: 'SNB',
          value: snbValue,
          unit: '°',
          interpretation: snbInterpretation,
          norm: '78-82°'
        };
      }
      
      // ANB angle
      if (points['A'] && points['N'] && points['B']) {
        const anbValue = calculateAngle(points['A'], points['N'], points['B']);
        let anbInterpretation = '';
        if (anbValue < 0) {
          anbInterpretation = 'Мезиальное соотношение';
        } else if (anbValue > 4) {
          anbInterpretation = 'Дистальное соотношение';
        } else {
          anbInterpretation = 'Норма';
        }
        
        measurements.ANB = {
          name: 'ANB',
          value: anbValue,
          unit: '°',
          interpretation: anbInterpretation,
          norm: '0-4°'
        };
      }
      
      // SN-Pg angle
      if (points['S'] && points['N'] && points['Pg']) {
        const snpgValue = calculateAngle(points['S'], points['N'], points['Pg']);
        let snpgInterpretation = '';
        if (snpgValue < 82) {
          snpgInterpretation = 'Заднее положение подбородка';
        } else if (snpgValue > 82) {
          snpgInterpretation = 'Переднее положение подбородка';
        } else {
          snpgInterpretation = 'Норма';
        }
        
        measurements.SNPg = {
          name: 'SN-Pg',
          value: snpgValue,
          unit: '°',
          interpretation: snpgInterpretation,
          norm: '82°'
        };
      }
      
      // Beta angle
      // 1) Connect points E3 and B (line 1)
      // 2) Drop a perpendicular to line 1 from A
      // 3) Construct line AB
      // 4) Beta - angle between line AB and perpendicular to line 1 from A
      if (points['E3'] && points['B'] && points['A']) {
        // Step 1: Connect points E3 and B (line 1)
        // Step 2: Drop a perpendicular to line 1 from A
        const perpendicularPoint = projectPointOnLine(points['A'], points['E3'], points['B']);
        
        if (perpendicularPoint) {
          // Step 3: Construct line AB
          // Step 4: Beta - angle between line AB and perpendicular to line 1 from A
          const betaValue = calculateAngle(points['A'], points['B'], perpendicularPoint);
          let betaInterpretation = '';
          if (betaValue < 27) {
            betaInterpretation = 'II скелетный класс';
          } else if (betaValue > 35) {
            betaInterpretation = 'III скелетный класс';
          } else {
            betaInterpretation = 'I скелетный класс (норма)';
          }
          
          measurements.Beta = {
            name: 'Beta',
            value: betaValue,
            unit: '°',
            interpretation: betaInterpretation,
            norm: '27-35°'
          };
        }
      }
      
      // N-S-Ba angle
      if (points['N'] && points['S'] && points['Ba']) {
        const nsbaValue = calculateAngle(points['N'], points['S'], points['Ba']);
        let nsbaInterpretation = '';
        if (nsbaValue < 130) {
          nsbaInterpretation = 'Прогнатический тип профиля';
        } else if (nsbaValue > 133) {
          nsbaInterpretation = 'Ретрогнатический тип профиля';
        } else {
          nsbaInterpretation = 'Норма';
        }
        
        measurements.NSBa = {
          name: 'N-S-Ba',
          value: nsbaValue,
          unit: '°',
          interpretation: nsbaInterpretation,
          norm: '130-133°'
        };
      }
      
      // NL/NSL angle
      // Angle between maxillary plane (ANS-PNS) and anterior cranial base (N-S)
      if (points['N'] && points['S'] && points['ANS'] && points['PNS']) {
        // Vector for anterior cranial base (N-S)
        const nslVector = { x: points['S'].x - points['N'].x, y: points['S'].y - points['N'].y };
        
        // Vector for maxillary plane (ANS-PNS)
        const nlVector = { x: points['PNS'].x - points['ANS'].x, y: points['PNS'].y - points['ANS'].y };
        
        // Normalize vectors
        const nslLength = Math.sqrt(nslVector.x * nslVector.x + nslVector.y * nslVector.y);
        const nlLength = Math.sqrt(nlVector.x * nlVector.x + nlVector.y * nlVector.y);
        
        if (nslLength > 0 && nlLength > 0) {
          const normalizedNslVector = { x: nslVector.x / nslLength, y: nslVector.y / nslLength };
          const normalizedNlVector = { x: nlVector.x / nlLength, y: nlVector.y / nlLength };
          
          // Calculate dot product
          const dotProduct = normalizedNslVector.x * normalizedNlVector.x + normalizedNslVector.y * normalizedNlVector.y;
          
          // Calculate angle
          const cosAngle = Math.min(1, Math.max(-1, dotProduct));
          const angleRad = Math.acos(cosAngle);
          const nlNslValue = angleRad * (180 / Math.PI);
          
          let nlNslInterpretation = '';
          if (nlNslValue < 5) {
            nlNslInterpretation = 'Антеинклинация верхней челюсти';
          } else if (nlNslValue > 9) {
            nlNslInterpretation = 'Ретроинклинация верхней челюсти';
          } else {
            nlNslInterpretation = 'Норма';
          }
          
          measurements.NL_NSL = {
            name: 'NL/NSL',
            value: nlNslValue,
            unit: '°',
            interpretation: nlNslInterpretation,
            norm: '5-9°'
          };
        }
      }
      
      // ML-NSL angle
      // Angle between mandibular plane (Go-Me) and anterior cranial base (N-S)
      if (points['N'] && points['S'] && points['Go'] && points['Me']) {
        // Vector for anterior cranial base (N-S)
        const nslVector = { x: points['S'].x - points['N'].x, y: points['S'].y - points['N'].y };
        
        // Vector for mandibular plane (Go-Me)
        const mlVector = { x: points['Me'].x - points['Go'].x, y: points['Me'].y - points['Go'].y };
        
        // Normalize vectors
        const nslLength = Math.sqrt(nslVector.x * nslVector.x + nslVector.y * nslVector.y);
        const mlLength = Math.sqrt(mlVector.x * mlVector.x + mlVector.y * mlVector.y);
        
        if (nslLength > 0 && mlLength > 0) {
          const normalizedNslVector = { x: nslVector.x / nslLength, y: nslVector.y / nslLength };
          const normalizedMlVector = { x: mlVector.x / mlLength, y: mlVector.y / mlLength };
          
          // Calculate dot product
          const dotProduct = normalizedNslVector.x * normalizedMlVector.x + normalizedNslVector.y * normalizedMlVector.y;
          
          // Calculate angle
          const cosAngle = Math.min(1, Math.max(-1, dotProduct));
          const angleRad = Math.acos(cosAngle);
          const mlNslValue = 180 - (angleRad * (180 / Math.PI));
          
          let mlNslInterpretation = '';
          if (mlNslValue < 30) {
            mlNslInterpretation = 'Ретроинклинация нижней челюсти';
          } else if (mlNslValue > 34) {
            mlNslInterpretation = 'Антеинклинация нижней челюсти';
          } else {
            mlNslInterpretation = 'Норма';
          }
          
          measurements.ML_NSL = {
            name: 'ML-NSL',
            value: mlNslValue,
            unit: '°',
            interpretation: mlNslInterpretation,
            norm: '30-34°'
          };
        }
      }
      
      // NL-ML angle
      // Angle between maxillary plane (ANS-PNS) and mandibular plane (Go-Me)
      if (points['ANS'] && points['PNS'] && points['Go'] && points['Me']) {
        // Vector for maxillary plane (ANS-PNS)
        const nlVector = { x: points['PNS'].x - points['ANS'].x, y: points['PNS'].y - points['ANS'].y };
        
        // Vector for mandibular plane (Go-Me)
        const mlVector = { x: points['Me'].x - points['Go'].x, y: points['Me'].y - points['Go'].y };
        
        // Normalize vectors
        const nlLength = Math.sqrt(nlVector.x * nlVector.x + nlVector.y * nlVector.y);
        const mlLength = Math.sqrt(mlVector.x * mlVector.x + mlVector.y * mlVector.y);
        
        if (nlLength > 0 && mlLength > 0) {
          const normalizedNlVector = { x: nlVector.x / nlLength, y: nlVector.y / nlLength };
          const normalizedMlVector = { x: mlVector.x / mlLength, y: mlVector.y / mlLength };
          
          // Calculate dot product
          const dotProduct = normalizedNlVector.x * normalizedMlVector.x + normalizedNlVector.y * normalizedMlVector.y;
          
          // Calculate angle
          const cosAngle = Math.min(1, Math.max(-1, dotProduct));
          const angleRad = Math.acos(cosAngle);
          const nlMlValue = 180 - (angleRad * (180 / Math.PI));
          
          let nlMlInterpretation = '';
          if (nlMlValue < 22) {
            nlMlInterpretation = 'Гиподивергенция челюстей';
          } else if (nlMlValue > 26) {
            nlMlInterpretation = 'Гипердивергенция челюстей';
          } else {
            nlMlInterpretation = 'Норма';
          }
          
          measurements.NL_ML = {
            name: 'NL-ML',
            value: nlMlValue,
            unit: '°',
            interpretation: nlMlInterpretation,
            norm: '22-26°'
          };
        }
      }
      
      // NSAr angle
      if (points['N'] && points['S'] && points['Ar']) {
        const nsarValue = calculateAngle(points['N'], points['S'], points['Ar']);
        measurements.NSAr = {
          name: 'NSAr',
          value: nsarValue,
          unit: '°'
        };
      }
      
      // SArGo angle
      if (points['S'] && points['Ar'] && points['Go']) {
        const sargoValue = calculateAngle(points['S'], points['Ar'], points['Go']);
        measurements.SArGo = {
          name: 'SArGo',
          value: sargoValue,
          unit: '°'
        };
      }
      
      // ArGoMe angle
      if (points['Ar'] && points['Go'] && points['Me']) {
        const argomeValue = calculateAngle(points['Ar'], points['Go'], points['Me']);
        measurements.ArGoMe = {
          name: 'ArGoMe',
          value: argomeValue,
          unit: '°'
        };
      }
      
      // U1/NL angle
      // Angle between maxillary plane (ANS-PNS) and upper incisor line (ais-is)
      if (points['ANS'] && points['PNS'] && points['Ais'] && points['Is']) {
        // Vector for maxillary plane (ANS-PNS)
        const nlVector = { x: points['PNS'].x - points['ANS'].x, y: points['PNS'].y - points['ANS'].y };
        
        // Vector for upper incisor line (ais-is)
        const u1Vector = { x: points['Is'].x - points['Ais'].x, y: points['Is'].y - points['Ais'].y };
        
        // Normalize vectors
        const nlLength = Math.sqrt(nlVector.x * nlVector.x + nlVector.y * nlVector.y);
        const u1Length = Math.sqrt(u1Vector.x * u1Vector.x + u1Vector.y * u1Vector.y);
        
        if (nlLength > 0 && u1Length > 0) {
          const normalizedNlVector = { x: nlVector.x / nlLength, y: nlVector.y / nlLength };
          const normalizedU1Vector = { x: u1Vector.x / u1Length, y: u1Vector.y / u1Length };
          
          // Calculate dot product
          const dotProduct = normalizedNlVector.x * normalizedU1Vector.x + normalizedNlVector.y * normalizedU1Vector.y;
          
          // Calculate angle
          const cosAngle = Math.min(1, Math.max(-1, dotProduct));
          const angleRad = Math.acos(cosAngle);
          const u1NlValue = angleRad * (180 / Math.PI);
          
          let u1NlInterpretation = '';
          if (u1NlValue < 105) {
            u1NlInterpretation = 'Протрузия верхних резцов';
          } else if (u1NlValue > 115) {
            u1NlInterpretation = 'Ретрузия верхних резцов';
          } else {
            u1NlInterpretation = 'Норма';
          }
          
          measurements.U1_NL = {
            name: 'U1/NL',
            value: u1NlValue,
            unit: '°',
            interpretation: u1NlInterpretation,
            norm: '105-115°'
          };
        }
      }
      
      // L1/ML angle
      // Angle between mandibular plane (Go-Me) and lower incisor line (aii-ii)
      if (points['Go'] && points['Me'] && points['Aii'] && points['ii']) {
        // Vector for mandibular plane (Go-Me)
        const mlVector = { x: points['Me'].x - points['Go'].x, y: points['Me'].y - points['Go'].y };
        
        // Vector for lower incisor line (aii-ii)
        const l1Vector = { x: points['ii'].x - points['Aii'].x, y: points['ii'].y - points['Aii'].y };
        
        // Normalize vectors
        const mlLength = Math.sqrt(mlVector.x * mlVector.x + mlVector.y * mlVector.y);
        const l1Length = Math.sqrt(l1Vector.x * l1Vector.x + l1Vector.y * l1Vector.y);
        
        if (mlLength > 0 && l1Length > 0) {
          const normalizedMlVector = { x: mlVector.x / mlLength, y: mlVector.y / mlLength };
          const normalizedL1Vector = { x: l1Vector.x / l1Length, y: l1Vector.y / l1Length };
          
          // Calculate dot product
          const dotProduct = normalizedMlVector.x * normalizedL1Vector.x + normalizedMlVector.y * normalizedL1Vector.y;
          
          // Calculate angle
          const cosAngle = Math.min(1, Math.max(-1, dotProduct));
          const angleRad = Math.acos(cosAngle);
          const l1MlValue = angleRad * (180 / Math.PI);
          
          let l1MlInterpretation = '';
          if (l1MlValue < 90) {
            l1MlInterpretation = 'Ретрузия нижних резцов';
          } else if (l1MlValue > 95) {
            l1MlInterpretation = 'Протрузия нижних резцов';
          } else {
            l1MlInterpretation = 'Норма';
          }
          
          measurements.L1_ML = {
            name: 'L1/ML',
            value: l1MlValue,
            unit: '°',
            interpretation: l1MlInterpretation,
            norm: '90-95°'
          };
        }
      }
      
      // U1/L1 angle
      // Angle between upper incisor line (ais-is) and lower incisor line (aii-ii)
      if (points['Ais'] && points['Is'] && points['Aii'] && points['ii']) {
        // Vector for upper incisor line (ais-is)
        const u1Vector = { x: points['Is'].x - points['Ais'].x, y: points['Is'].y - points['Ais'].y };
        
        // Vector for lower incisor line (aii-ii)
        const l1Vector = { x: points['ii'].x - points['Aii'].x, y: points['ii'].y - points['Aii'].y };
        
        // Normalize vectors
        const u1Length = Math.sqrt(u1Vector.x * u1Vector.x + u1Vector.y * u1Vector.y);
        const l1Length = Math.sqrt(l1Vector.x * l1Vector.x + l1Vector.y * l1Vector.y);
        
        if (u1Length > 0 && l1Length > 0) {
          const normalizedU1Vector = { x: u1Vector.x / u1Length, y: u1Vector.y / u1Length };
          const normalizedL1Vector = { x: l1Vector.x / l1Length, y: l1Vector.y / l1Length };
          
          // Calculate dot product
          const dotProduct = normalizedU1Vector.x * normalizedL1Vector.x + normalizedU1Vector.y * normalizedL1Vector.y;
          
          // Calculate angle
          const cosAngle = Math.min(1, Math.max(-1, dotProduct));
          const angleRad = Math.acos(cosAngle);
          const u1L1Value = angleRad * (180 / Math.PI);
          
          let u1L1Interpretation = '';
          if (u1L1Value < 130) {
            u1L1Interpretation = 'Бипротузия резцов';
          } else if (u1L1Value > 130) {
            u1L1Interpretation = 'Биретрузия резцов';
          } else {
            u1L1Interpretation = 'Норма';
          }
          
          measurements.U1_L1 = {
            name: 'U1/L1',
            value: u1L1Value,
            unit: '°',
            interpretation: u1L1Interpretation,
            norm: '130°'
          };
        }
      }
      
      // Document-specific formulas
      // Bjork angle = Sum(N*S*Ar, S*Ar*Go, Ar*Go*Me)
      if (points['N'] && points['S'] && points['Ar'] && points['Go'] && points['Me']) {
        const NSAr = calculateAngle(points['N'], points['S'], points['Ar']);
        const SArGo = calculateAngle(points['S'], points['Ar'], points['Go']);
        const ArGoMe = calculateAngle(points['Ar'], points['Go'], points['Me']);
        const bjorkSum = NSAr + SArGo + ArGoMe;
        let bjorkInterpretation = '';
        
        // Гониальный угол - угол между касательными к ветви и телу нижней челюсти
        // Это угол Ar-Go-Me, который уже рассчитан как ArGoMe
        const gonialAngleValue = ArGoMe;
        let gonialAngleInterpretation = '';
        if (gonialAngleValue < 115) {
          gonialAngleInterpretation = 'Ретрогнатия нижней челюсти';
        } else if (gonialAngleValue > 135) {
          gonialAngleInterpretation = 'Прогнатия нижней челюсти';
        } else {
          gonialAngleInterpretation = 'Норма';
        }
        
        measurements.GonialAngle = {
          name: 'Гониальный угол (Ar-Go-Me)',
          value: gonialAngleValue,
          unit: '°',
          interpretation: gonialAngleInterpretation,
          norm: '115-135°'
        };
        if (bjorkSum < 396) {
          bjorkInterpretation = 'Горизонтальный тип роста';
        } else {
          bjorkInterpretation = 'Норма или вертикальный тип роста';
        }
        
        measurements.Bjork = {
          name: 'Bjork (Sum of N*S*Ar, S*Ar*Go, Ar*Go*Me)',
          value: bjorkSum,
          unit: '°',
          interpretation: bjorkInterpretation,
          norm: '<396°'
        };
      }
      
      // SGo:NMe ratio
      if (points['S'] && points['Go'] && points['N'] && points['Me']) {
        const SGo = calculateDistance(points['S'], points['Go']);
        const NMe = calculateDistance(points['N'], points['Me']);
        const ratio = (SGo / NMe) * 100;
        let ratioInterpretation = '';
        if (ratio < 62) {
          ratioInterpretation = 'Горизонтальный тип роста';
        } else if (ratio > 65) {
          ratioInterpretation = 'Вертикальный тип роста';
        } else {
          ratioInterpretation = 'Норма';
        }
        
        measurements.SGo_NMe = {
          name: 'SGo:NMe (%)',
          value: ratio,
          unit: '%',
          interpretation: ratioInterpretation,
          norm: '62-65%'
        };
      }
      
      // A'-Snp = NSL*0.7
      if (points['N'] && points['S'] && points['A'] && points['PNS']) {
        const NSL = calculateDistance(points['N'], points['S']);
        const expectedLength = NSL * 0.7;
        const aSnpValue = calculateDistance(points['A'], points['PNS']);
        let aSnpInterpretation = '';
        if (aSnpValue < expectedLength) {
          aSnpInterpretation = 'Микрогнатия';
        } else if (aSnpValue > expectedLength) {
          aSnpInterpretation = 'Макрогнатия';
        } else {
          aSnpInterpretation = 'Норма';
        }
        
        measurements.A_Snp = {
          name: "A'-Snp",
          value: aSnpValue,
          unit: cephalometryData.scale > 0 ? 'mm' : 'px',
          expected: expectedLength,
          interpretation: aSnpInterpretation,
          norm: expectedLength.toFixed(2)
        };
      }
      
      // GoGn = NS+6
      if (points['N'] && points['S'] && points['Go'] && points['Gn']) {
        const NS = calculateDistance(points['N'], points['S']);
        const expectedLength = NS + 6;
        const goGnValue = calculateDistance(points['Go'], points['Gn']);
        let goGnInterpretation = '';
        if (goGnValue < expectedLength) {
          goGnInterpretation = 'Микрогнатия';
        } else if (goGnValue > expectedLength) {
          goGnInterpretation = 'Макрогнатия';
        } else {
          goGnInterpretation = 'Норма';
        }
        
        measurements.GoGn = {
          name: 'GoGn',
          value: goGnValue,
          unit: cephalometryData.scale > 0 ? 'mm' : 'px',
          expected: expectedLength,
          interpretation: goGnInterpretation,
          norm: expectedLength.toFixed(2)
        };
      }
      
      // Anterior upper facial height = N to A
      if (points['N'] && points['A']) {
        const antUpperFaceHeightValue = calculateDistance(points['N'], points['A']);
        let antUpperFaceHeightInterpretation = '';
        if (antUpperFaceHeightValue < 47.5) {
          antUpperFaceHeightInterpretation = 'Меньше нормы';
        } else if (antUpperFaceHeightValue > 52.5) {
          antUpperFaceHeightInterpretation = 'Больше нормы';
        } else {
          antUpperFaceHeightInterpretation = 'Норма';
        }
        
        measurements.AntUpperFaceHeight = {
          name: 'Anterior Upper Facial Height (N-A)',
          value: antUpperFaceHeightValue,
          unit: cephalometryData.scale > 0 ? 'mm' : 'px',
          interpretation: antUpperFaceHeightInterpretation,
          norm: '47.5-52.5mm'
        };
      }
      
      // Anterior lower facial height = A to Gn
      if (points['A'] && points['Gn']) {
        const antLowerFaceHeightValue = calculateDistance(points['A'], points['Gn']);
        let antLowerFaceHeightInterpretation = '';
        if (antLowerFaceHeightValue < 60.5) {
          antLowerFaceHeightInterpretation = 'Меньше нормы';
        } else if (antLowerFaceHeightValue > 69.5) {
          antLowerFaceHeightInterpretation = 'Больше нормы';
        } else {
          antLowerFaceHeightInterpretation = 'Норма';
        }
        
        measurements.AntLowerFaceHeight = {
          name: 'Anterior Lower Facial Height (A-Gn)',
          value: antLowerFaceHeightValue,
          unit: cephalometryData.scale > 0 ? 'mm' : 'px',
          interpretation: antLowerFaceHeightInterpretation,
          norm: '60.5-69.5mm'
        };
      }
      
      // Wits appraisal
      // Wits (mm) = Расстояние между проекциями точек A и B на линию ii-P6
      if (points['A'] && points['B'] && points['ii'] && points['P6']) {
        // Calculate the projection of points A and B onto the ii-P6 line
        const ii = points['ii'];
        const P6 = points['P6'];
        
        // Vector of the ii-P6 line
        const lineVector = { x: P6.x - ii.x, y: P6.y - ii.y };
        
        // Normalize the line vector
        const lineLength = Math.sqrt(lineVector.x * lineVector.x + lineVector.y * lineVector.y);
        if (lineLength > 0) {
          const normalizedLineVector = {
            x: lineVector.x / lineLength,
            y: lineVector.y / lineLength
          };
          
          // Project point A onto the line
          const vectorAToIi = { x: points['A'].x - ii.x, y: points['A'].y - ii.y };
          const projectionALength = vectorAToIi.x * normalizedLineVector.x + vectorAToIi.y * normalizedLineVector.y;
          const projectedA = {
            x: ii.x + projectionALength * normalizedLineVector.x,
            y: ii.y + projectionALength * normalizedLineVector.y
          };
          
          // Project point B onto the line
          const vectorBToIi = { x: points['B'].x - ii.x, y: points['B'].y - ii.y };
          const projectionBLength = vectorBToIi.x * normalizedLineVector.x + vectorBToIi.y * normalizedLineVector.y;
          const projectedB = {
            x: ii.x + projectionBLength * normalizedLineVector.x,
            y: ii.y + projectionBLength * normalizedLineVector.y
          };
          
          // Calculate distance between projected points
          const witsValue = calculateDistance(projectedA, projectedB);
          
          let witsInterpretation = '';
          if (witsValue < 1) {
            witsInterpretation = '3 скелетный класс';
          } else if (witsValue > 1) {
            witsInterpretation = '2 скелетный класс';
          } else {
            witsInterpretation = 'Норма';
          }
          
          measurements.Wits = {
            name: 'Wits appraisal',
            value: witsValue,
            unit: cephalometryData.scale > 0 ? 'mm' : 'px',
            interpretation: witsInterpretation,
            norm: '1mm'
          };
        }
      }
    } else if (cephalometryData.projectionType === 'frontal') {
      // Document-required measurements for frontal projection
      // J-J (Maxillary apical base width)
      if (points['J_L'] && points['J_R']) {
        const jJValue = calculateDistance(points['J_L'], points['J_R']);
        measurements.J_J = {
          name: 'J-J (Maxillary apical base width)',
          value: jJValue,
          unit: cephalometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      // U6-U6 (Upper dental arch width)
      if (points['U6_L'] && points['U6_R']) {
        const u6U6Value = calculateDistance(points['U6_L'], points['U6_R']);
        measurements.U6_U6 = {
          name: 'U6-U6 (Upper dental arch width)',
          value: u6U6Value,
          unit: cephalometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      // L6-L6 (Lower dental arch width)
      if (points['L6_L'] && points['L6_R']) {
        const l6L6Value = calculateDistance(points['L6_L'], points['L6_R']);
        measurements.L6_L6 = {
          name: 'L6-L6 (Lower dental arch width)',
          value: l6L6Value,
          unit: cephalometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      // Ag-Ag (Mandibular apical base width)
      if (points['Ag_L'] && points['Ag_R']) {
        const agAgValue = calculateDistance(points['Ag_L'], points['Ag_R']);
        measurements.Ag_Ag = {
          name: 'Ag-Ag (Mandibular apical base width)',
          value: agAgValue,
          unit: cephalometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      // Co-Go (L,P) left/right (Ramus length)
      if (points['Co_L'] && points['Go_L']) {
        const coGoLValue = calculateDistance(points['Co_L'], points['Go_L']);
        measurements.CoGo_L = {
          name: 'Co-Go (left ramus length)',
          value: coGoLValue,
          unit: cephalometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      if (points['Co_R'] && points['Go_R']) {
        const coGoRValue = calculateDistance(points['Co_R'], points['Go_R']);
        measurements.CoGo_R = {
          name: 'Co-Go (right ramus length)',
          value: coGoRValue,
          unit: cephalometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      // Go-Me (L,P) left/right (Body length)
      if (points['Go_L'] && points['Me']) {
        const goMeLValue = calculateDistance(points['Go_L'], points['Me']);
        measurements.GoMe_L = {
          name: 'Go-Me (left body length)',
          value: goMeLValue,
          unit: cephalometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      if (points['Go_R'] && points['Me']) {
        const goMeRValue = calculateDistance(points['Go_R'], points['Me']);
        measurements.GoMe_R = {
          name: 'Go-Me (right body length)',
          value: goMeRValue,
          unit: cephalometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      // Cg-Me (Facial height)
      if (points['Cg'] && points['Me']) {
        const cgMeValue = calculateDistance(points['Cg'], points['Me']);
        measurements.Cg_Me = {
          name: 'Cg-Me (Facial height)',
          value: cgMeValue,
          unit: cephalometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      // Cg-Ans (Upper facial height)
      if (points['Cg'] && points['ANS']) {
        const cgAnsValue = calculateDistance(points['Cg'], points['ANS']);
        measurements.Cg_Ans = {
          name: 'Cg-Ans (Upper facial height)',
          value: cgAnsValue,
          unit: cephalometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      // ANS-Me (Lower facial height)
      if (points['ANS'] && points['Me']) {
        const ansMeValue = calculateDistance(points['ANS'], points['Me']);
        measurements.ANS_Me = {
          name: 'ANS-Me (Lower facial height)',
          value: ansMeValue,
          unit: cephalometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      // ArGoMe left/right
      if (points['Ar_L'] && points['Go_L'] && points['Me']) {
        const arGoMeLValue = calculateAngle(points['Ar_L'], points['Go_L'], points['Me']);
        measurements.ArGoMe_L = {
          name: 'ArGoMe (left)',
          value: arGoMeLValue,
          unit: '°'
        };
      }
      
      if (points['Ar_R'] && points['Go_R'] && points['Me']) {
        const arGoMeRValue = calculateAngle(points['Ar_R'], points['Go_R'], points['Me']);
        measurements.ArGoMe_R = {
          name: 'ArGoMe (right)',
          value: arGoMeRValue,
          unit: '°'
        };
      }
    }
    
    setCephalometryData(prev => ({
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
      if (measurement.interpretation && measurement.interpretation !== 'Норма') {
        allNormal = false;
      }
    });
    
    const report = {
      patientName: cephalometryData.patientName,
      analysisDate: cephalometryData.analysisDate,
      projectionType: cephalometryData.projectionType,
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
    // In a real application, you would use a library like jsPDF to generate a PDF
    // Example implementation:
    // const doc = new jsPDF();
    // doc.text('Результаты цефалометрического анализа', 10, 10);
    // doc.autoTable({
    //   head: [['Параметр', 'Значение', 'Единицы', 'Норма', 'Интерпретация']],
    //   body: Object.entries(reportData.measurements || {}).map(([key, measurement]) => [
    //     measurement.name,
    //     measurement.value.toFixed(2),
    //     measurement.unit,
    //     measurement.norm || 'N/A',
    //     measurement.interpretation || 'N/A'
    //   ]),
    //   startY: 20
    // });
    // doc.save('cephalometry-report.pdf');
    alert('Экспорт в PDF пока не реализован. В реальном приложении здесь будет создаваться PDF-файл.');
  };
  
  // Export report as PPTX
  const exportReportAsPPTX = () => {
    // In a real application, you would use a library like PptxGenJS to generate a PPTX
    // Example implementation:
    // const pptx = new pptxgen();
    // const slide = pptx.addSlide();
    // slide.addText('Результаты цефалометрического анализа', { x: 0.5, y: 0.5, fontSize: 18 });
    // // Add table with measurements
    // pptx.writeFile('cephalometry-report.pptx');
    alert('Экспорт в PPTX пока не реализован. В реальном приложении здесь будет создаваться PPTX-файл.');
  };

  // Handle save (placeholder function)
  const handleSave = () => {
    alert('Функция сохранения пока не реализована. В реальном приложении здесь будет сохраняться результат анализа.');
  };

  // Handle save to medical card
  const handleSaveToMedicalCard = async () => {
    try {
      setLoading(true);
      setSaveSuccess(false);
      setShowMedicalCardLink(false);
      
      // Генерируем отчет с измерениями
      const report = generateReport();
      
      // Определяем ID пациента (из контекста или заглушки)
      const patientId = currentPatient?.id || medicalCardData?.patient?.id || 1;
      const patientName = currentPatient?.fullName || medicalCardData?.patient?.fullName || cephalometryData.patientName;
      
      // Формируем полные данные для сохранения
      const exportData = {
        patientId: patientId,
        patientName: patientName,
        analysisDate: cephalometryData.analysisDate,
        projectionType: cephalometryData.projectionType,
        scale: cephalometryData.scale,
        points: cephalometryData.points,
        measurements: report.measurements,
        scalePoints: cephalometryData.scalePoints,
        scalePoints30: cephalometryData.scalePoints30,
        calibrationPoints: cephalometryData.calibrationPoints,
        calibrationType: cephalometryData.calibrationType,
        calibrationObjectSize: cephalometryData.calibrationObjectSize,
        report: {
          conclusion: report.conclusion,
          allNormal: report.allNormal,
          timestamp: new Date().toISOString()
        },
        imagesInfo: {
          dimensions: cephalometryData.imageDimensions,
          hasImages: Object.values(cephalometryData.images).some(img => img !== null)
        },
        // История измерений
        calculationHistory: [
          {
            date: new Date().toISOString(),
            measurementsCount: Object.keys(report.measurements).length,
            projection: cephalometryData.projectionType
          }
        ]
      };
      
      console.log('Saving comprehensive cephalometry data:', exportData);
      
      // 1. Сохраняем через localMedicalRecordService
      try {
        const medicalRecordData = {
          patient_id: patientId,
          record_type: 'cephalometry',
          data: JSON.stringify(exportData),
          notes: `Цефалометрический анализ (${cephalometryData.projectionType === 'lateral' ? 'боковая' : 'прямая'} проекция). ${report.conclusion}`,
          created_at: new Date().toISOString(),
          metadata: {
            pointsCount: Object.keys(cephalometryData.points).length,
            measurementsCount: Object.keys(report.measurements).length,
            scale: cephalometryData.scale,
            projection: cephalometryData.projectionType
          }
        };
        
        await localMedicalRecordService.createMedicalRecord(medicalRecordData);
        console.log('Saved to local medical record service');
      } catch (medicalRecordError) {
        console.warn('Could not save to medical record service:', medicalRecordError);
        // Это нормально, если сервис не доступен
      }
      
      // 2. Сохраняем в localStorage для надежности
      try {
        // Сохраняем отдельный файл с данными цефалометрии
        const storageKey = `cephalometry_data_${patientId}_${Date.now()}`;
        localStorage.setItem(storageKey, JSON.stringify(exportData));
        
        // Также сохраняем в общий список отчетов
        const reportsKey = 'cephalometry_reports';
        const existingReports = JSON.parse(localStorage.getItem(reportsKey) || '[]');
        existingReports.push({
          ...exportData,
          storageKey,
          savedAt: new Date().toISOString()
        });
        localStorage.setItem(reportsKey, JSON.stringify(existingReports));
        
        console.log('Saved cephalometry data to localStorage');
      } catch (storageError) {
        console.error('Error saving to localStorage:', storageError);
      }
      
      // 3. Обновляем контекст данных, если функция доступна
      if (updateMedicalCardData) {
        updateMedicalCardData({
          type: 'UPDATE_CEPHALOMETRY',
          data: exportData,
          patientId: patientId
        });
      }
      
      // 4. Создаем удобный для пользователя отчет
      const userReport = {
        patientId,
        patientName,
        analysisDate: cephalometryData.analysisDate,
        projection: cephalometryData.projectionType === 'lateral' ? 'Боковая ТРГ' : 'Прямая ТРГ',
        measurements: Object.keys(report.measurements).map(key => ({
          name: report.measurements[key].name,
          value: report.measurements[key].value,
          unit: report.measurements[key].unit,
          interpretation: report.measurements[key].interpretation
        })),
        conclusion: report.conclusion,
        recommendations: report.allNormal 
          ? ['Плановое наблюдение через 6 месяцев']
          : ['Требуется консультация ортодонта', 'Необходимо дополнительное обследование']
      };
      
      // Сохраняем пользовательский отчет
      localStorage.setItem(`cephalometry_report_${patientId}_latest`, JSON.stringify(userReport));
      
      setSaveSuccess(true);
      setShowMedicalCardLink(true);
      setLoading(false);
      
      // Показываем подробное уведомление об успехе
      const successMessage = `
✅ Данные цефалометрии успешно сохранены!

Пациент: ${patientName}
Тип проекции: ${cephalometryData.projectionType === 'lateral' ? 'Боковая' : 'Прямая'}
Измерений: ${Object.keys(report.measurements).length}
Заключение: ${report.conclusion}

Данные сохранены в:
• Локальное хранилище браузера
• Медицинскую карту пациента
• Историю измерений

Перейдите в медицинскую карту для просмотра полного отчета.
      `.trim();
      
      alert(successMessage);
      
      return { 
        success: true, 
        data: exportData,
        userReport: userReport,
        storageKey: `cephalometry_data_${patientId}_${Date.now()}`
      };
      
    } catch (error) {
      console.error('Error saving to medical card:', error);
      setLoading(false);
      setError('Ошибка при сохранении данных: ' + error.message);
      alert('❌ Ошибка при сохранении данных в медицинскую карту: ' + error.message);
      return { success: false, error: error.message };
    }
  };

  // Функция для экспорта данных в формат, совместимый с MedicalCard:
  const exportCephalometryForMedicalCard = () => {
    const report = generateReport();
    const patientId = currentPatient?.id || medicalCardData?.patient?.id || 1;
    
    // Формируем данные в формате, который понимает MedicalCard
    const medicalCardFormat = {
      patientId: patientId,
      moduleType: 'cephalometry',
      data: {
        projectionType: cephalometryData.projectionType,
        analysisDate: cephalometryData.analysisDate,
        measurements: report.measurements,
        points: cephalometryData.points,
        scale: cephalometryData.scale,
        conclusion: report.conclusion
      },
      summary: {
        totalMeasurements: Object.keys(report.measurements).length,
        normalCount: Object.values(report.measurements).filter(m => m.interpretation === 'Норма').length,
        abnormalCount: Object.values(report.measurements).filter(m => m.interpretation !== 'Норма').length,
        skeletalClass: cephalometryData.projectionType === 'lateral' ? 
          (report.measurements.ANB?.interpretation?.includes('II') ? 'II класс' : 
           report.measurements.ANB?.interpretation?.includes('III') ? 'III класс' : 'I класс') : 'N/A'
      },
      exportTimestamp: new Date().toISOString()
    };
    
    // Сохраняем в специальный ключ, который ищет MedicalCard
    localStorage.setItem(`medical_card_module_cephalometry_${patientId}`, JSON.stringify(medicalCardFormat));
    
    // Также добавляем в общий список модулей
    const moduleKey = `patient_${patientId}_modules`;
    const existingModules = JSON.parse(localStorage.getItem(moduleKey) || '{}');
    existingModules.cephalometry = medicalCardFormat;
    localStorage.setItem(moduleKey, JSON.stringify(existingModules));
    
    alert(`✅ Данные цефалометрии экспортированы в формат медицинской карты для пациента ID: ${patientId}`);
    
    return medicalCardFormat;
  };

  // Функция быстрого сохранения измерений
  const handleQuickSave = () => {
    const measurements = calculateMeasurements();
    if (Object.keys(measurements).length === 0) {
      alert('Нет измерений для сохранения. Сначала выполните расчет измерений.');
      return;
    }
    
    handleSaveToMedicalCard();
  };
  
  // Determine the next point to be placed when in point placement mode
  useEffect(() => {
    if (activeTool === 'point' && cephalometryData.images[cephalometryData.projectionType] && imagesUploaded) {
      // Check if scale is set
      const isScaleSet = cephalometryData.scale > 1;
      if (isScaleSet) {
        // Find the next unplaced point
        const points = pointDefinitions[cephalometryData.projectionType] || [];
        const nextPoint = points.find(point => !cephalometryData.points[point.id]);
        
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
  }, [activeTool, cephalometryData, cephalometryData.points, cephalometryData.projectionType, cephalometryData.scale, pointDefinitions, imagesUploaded]);
   
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
      if (imagesUploaded && cephalometryData.images[cephalometryData.projectionType]) {
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
        img.src = cephalometryData.images[cephalometryData.projectionType];
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [cephalometryData.images, cephalometryData.projectionType, imagesUploaded]);

  // Handle projection type change
  useEffect(() => {
    // When projection type changes, we might need to reset some state
    // For example, if we're switching between images, we might want to clear points
    // or reset scale settings
    // The image for the new projection type should already be loaded in cephalometryData.images
    // Reinitialize image info when projection type changes
    if (imagesUploaded && cephalometryData.images[cephalometryData.projectionType]) {
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
      img.src = cephalometryData.images[cephalometryData.projectionType];
    }
  }, [cephalometryData.projectionType, imagesUploaded, cephalometryData.images]);

  // Function to draw all elements on a canvas context (used for both main canvas and magnifier)
  const drawAllElements = useCallback((ctx, img, canvasWidth, canvasHeight, imageX, imageY, scaledImgWidth, scaledImgHeight, scale) => {
    // Draw image
    ctx.drawImage(img, imageX, imageY, scaledImgWidth, scaledImgHeight);
    
    // Draw lines between specific points for lateral projection
    if (cephalometryData.projectionType === 'lateral') {
      // Draw common lines for cephalometric analysis
      const points = cephalometryData.points;
      
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
      // NSL – плоскость основания переднего отдела черепа
      if (showPlanes.nsl) {
        drawLine('N', 'S', '#0000ff', 2);
      }
      
      // FH – франкфурская горизонталь
      if (showPlanes.fh && points['Po'] && points['Or']) {
        drawLine('Po', 'Or', '#0000ff', 2);
      }
      
      // NL – плоскость основания верхней челюсти
      if (showPlanes.nl && points['ANS'] && points['PNS']) {
        drawLine('ANS', 'PNS', '#0000ff', 2);
      }
      
      // OcP – окклюзионная плоскость
      // Важно: плоскость OcP (окклюзионная плоскость) проводится через точку P6 и через середину линии от ii - is
      // E1 (точка E1) - середина линии между режущими краями резцов (середина отрезка между точками ii и Is)
      if (showPlanes.ocp && points['E1'] && points['P6']) {
        // Draw a line from P6 to E1 (E1) as the occlusal plane
        drawLine('P6', 'E1', '#0000ff', 2);
      }
      
      // ML – плоскость основания нижней челюсти
      if (showPlanes.ml && points['Go'] && points['Me']) {
        drawLine('Go', 'Me', '#0000ff', 2);
      }
      
      // Go-Ar – плоскость ветви нижней челюсти
      if (showPlanes.goAr && points['Go'] && points['Ar']) {
        drawLine('Go', 'Ar', '#0000ff', 2);
      }
      
      // Гониальный угол: касательная к ветви и телу нижней челюсти
      if (showPlanes.gonialAngle && points['Go'] && points['Ar'] && points['Me']) {
        // Касательная к ветви: линия от Go к Ar
        drawLine('Go', 'Ar', '#ff0000', 2);
        // Касательная к телу: линия от Go к Me
        drawLine('Go', 'Me', '#ff0000', 2);
        // Угол между ними - визуализируется как угол Ar-Go-Me
        // (уже отображается как ArGoMe, но теперь с другим цветом)
      }
    } else if (cephalometryData.projectionType === 'frontal') {
        // Draw lines for frontal projection according to document requirements
        const points = cephalometryData.points;
        
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
        
        // Основные линии на прямой ТРГ:
        // Центральная линия
        if (showPlanes.nsl && points['N'] && points['Me']) {
          drawLine('N', 'Me', '#0000ff', 2);
        }
        
        // SO-SO (Interorbital line)
        if (showPlanes.fh && points['SO_L'] && points['SO_R']) {
          drawLine('SO_L', 'SO_R', '#0000ff', 2);
        }
        
        // Z-Z (Zygomatic line)
        if (showPlanes.nl && points['Z_L'] && points['Z_R']) {
          drawLine('Z_L', 'Z_R', '#0000ff', 2);
        }
        
        // Co-Co (Condylion line)
        if (showPlanes.ocp && points['Co_L'] && points['Co_R']) {
          drawLine('Co_L', 'Co_R', '#0000ff', 2);
        }
        
        // NC-NC (Nasal cavity line)
        if (showPlanes.ml && points['NC_L'] && points['NC_R']) {
          drawLine('NC_L', 'NC_R', '#0000ff', 2);
        }
        
        // J-J (Maxillary apical base width)
        if (showPlanes.goAr && points['J_L'] && points['J_R']) {
          drawLine('J_L', 'J_R', '#0000ff', 2);
        }
        
        // U6-U6 (Upper dental arch width)
        if (showPlanes.ml && points['U6_L'] && points['U6_R']) {
          drawLine('U6_L', 'U6_R', '#0000ff', 2);
        }
        
        // L6-L6 (Lower dental arch width)
        if (showPlanes.goAr && points['L6_L'] && points['L6_R']) {
          drawLine('L6_L', 'L6_R', '#0000ff', 2);
        }
        
        // Ag-Ag (Mandibular apical base width)
        if (showPlanes.ocp && points['Ag_L'] && points['Ag_R']) {
          drawLine('Ag_L', 'Ag_R', '#0000ff', 2);
        }
        
        // A-U1
        if (showPlanes.nl && points['A'] && points['U1_L']) {
          drawLine('A', 'U1_L', '#0000ff', 2);
        }
        
        // B-L1
        if (showPlanes.fh && points['B'] && points['L1_L']) {
          drawLine('B', 'L1_L', '#0000ff', 2);
        }
        
        // Co-Go (L,P) left/right (Ramus length)
        if (showPlanes.nsl && points['Co_L'] && points['Go_L']) {
          drawLine('Co_L', 'Go_L', '#0000ff', 2);
        }
        if (showPlanes.nsl && points['Co_R'] && points['Go_R']) {
          drawLine('Co_R', 'Go_R', '#0000ff', 2);
        }
        
        // Go-Me (L,P) left/right (Body length)
        if (showPlanes.ml && points['Go_L'] && points['Me']) {
          drawLine('Go_L', 'Me', '#0000ff', 2);
        }
        if (showPlanes.ml && points['Go_R'] && points['Me']) {
          drawLine('Go_R', 'Me', '#0000ff', 2);
        }
        
        // ArGoMe left/right
        if ((showAngles.sna || showAngles.snb) && points['Ar_L'] && points['Go_L'] && points['Me']) {
          // Draw triangle Ar_L-Go_L-Me
          drawLine('Ar_L', 'Go_L', '#0000ff', 1);
          drawLine('Go_L', 'Me', '#0000ff', 1);
          drawLine('Ar_L', 'Me', '#0000ff', 1);
        }
        if ((showAngles.sna || showAngles.snb) && points['Ar_R'] && points['Go_R'] && points['Me']) {
          // Draw triangle Ar_R-Go_R-Me
          drawLine('Ar_R', 'Go_R', '#0000ff', 1);
          drawLine('Go_R', 'Me', '#0000ff', 1);
          drawLine('Ar_R', 'Me', '#0000ff', 1);
        }
      }

    // Draw points (scaled to image position)
    Object.entries(cephalometryData.points || {}).forEach(([id, point]) => {
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
      if (cephalometryData.projectionType === 'lateral') {
        // Original scale points for lateral projection
        if (cephalometryData.scaleMode === '10mm') {
          // Draw 10mm scale points
          if (cephalometryData.scalePoints.point0) {
            const point = cephalometryData.scalePoints.point0;
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
          
          if (cephalometryData.scalePoints.point10) {
            const point = cephalometryData.scalePoints.point10;
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
          if (cephalometryData.scalePoints.point0 && cephalometryData.scalePoints.point10) {
            const point0 = cephalometryData.scalePoints.point0;
            const point10 = cephalometryData.scalePoints.point10;
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
          if (cephalometryData.scalePoints30.point0) {
            const point = cephalometryData.scalePoints30.point0;
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
          
          if (cephalometryData.scalePoints30.point30) {
            const point = cephalometryData.scalePoints30.point30;
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
          if (cephalometryData.scalePoints30.point0 && cephalometryData.scalePoints30.point30) {
            const point0 = cephalometryData.scalePoints30.point0;
            const point30 = cephalometryData.scalePoints30.point30;
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
        // New calibration points for frontal projection
        if (cephalometryData.calibrationPoints.point1) {
          const point = cephalometryData.calibrationPoints.point1;
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
        
        if (cephalometryData.calibrationPoints.point2) {
          const point = cephalometryData.calibrationPoints.point2;
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
        if (cephalometryData.calibrationPoints.point1 && cephalometryData.calibrationPoints.point2) {
          const point1 = cephalometryData.calibrationPoints.point1;
          const point2 = cephalometryData.calibrationPoints.point2;
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
    
    // Function to draw a line between two points
    const drawLine = (point1Id, point2Id, color = '#00ff00', lineWidth = 2) => {
      if (cephalometryData.points[point1Id] && cephalometryData.points[point2Id]) {
        const point1 = cephalometryData.points[point1Id];
        const point2 = cephalometryData.points[point2Id];
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
    
    // Function to draw an angle visualization (lines with arc)
    const drawAngle = (point1Id, vertexId, point2Id, color = '#ff0000', lineWidth = 2) => {
      if (cephalometryData.points[point1Id] && cephalometryData.points[vertexId] && cephalometryData.points[point2Id]) {
        const point1 = cephalometryData.points[point1Id];
        const vertex = cephalometryData.points[vertexId];
        const point2 = cephalometryData.points[point2Id];
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
    
    // Draw angle visualizations for lateral projection
    if (cephalometryData.projectionType === 'lateral') {
      // Draw specific angles based on showAngles state
      if (showAngles.sna) drawAngle('S', 'N', 'A', '#0000ff', 2);
      if (showAngles.snb) drawAngle('S', 'N', 'B', '#0000ff', 2);
      if (showAngles.anb) drawAngle('A', 'N', 'B', '#0000ff', 2);
      if (showAngles.snPg) drawAngle('S', 'N', 'Pg', '#0000ff', 2);
      if (showAngles.beta) {
        // Draw line E1-B (line 1)
        drawLine('E1', 'B', '#0000ff', 1);
        // Draw line AB
        drawLine('A', 'B', '#0000ff', 1);
        // Draw perpendicular from A to line E1-B (dashed)
        const perpendicularPoint = projectPointOnLine(cephalometryData.points['A'], cephalometryData.points['E1'], cephalometryData.points['B']);
        if (perpendicularPoint) {
          // Draw dashed line from A to perpendicularPoint
          ctx.beginPath();
          ctx.moveTo(imageX + cephalometryData.points['A'].x * scale, imageY + cephalometryData.points['A'].y * scale);
          ctx.lineTo(imageX + perpendicularPoint.x * scale, imageY + perpendicularPoint.y * scale);
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);
          
          // Draw angle between AB and the perpendicular using direct coordinates
          // Create a helper function to draw angle from coordinates
          const drawAngleFromCoordinates = (point1, vertex, point2, color = '#ff0000', lineWidth = 2) => {
            if (!point1 || !vertex || !point2) return;
            
            const x1 = imageX + point1.x * scale;
            const y1 = imageY + point1.y * scale;
            const vx = imageX + vertex.x * scale;
            const vy = imageY + vertex.y * scale;
            const x2 = imageX + point2.x * scale;
            const y2 = imageY + point2.y * scale;
            
            // Draw lines
            ctx.beginPath();
            ctx.moveTo(vx, vy);
            ctx.lineTo(x1, y1);
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(vx, vy);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
            
            // Calculate vectors and arc (same as existing drawAngle logic)
            const vec1 = { x: x1 - vx, y: y1 - vy };
            const vec2 = { x: x2 - vx, y: y2 - vy };
            
            const len1 = Math.sqrt(vec1.x * vec1.x + vec1.y * vec1.y);
            const len2 = Math.sqrt(vec2.x * vec2.x + vec2.y * vec2.y);
            if (len1 === 0 || len2 === 0) return;
            
            const normVec1 = { x: vec1.x / len1, y: vec1.y / len1 };
            const normVec2 = { x: vec2.x / len2, y: vec2.y / len2 };
            
            const crossProduct = normVec1.x * normVec2.y - normVec1.y * normVec2.x;
            const radius = Math.min(len1, len2) * 0.15;
            const segments = 20;
            
            ctx.beginPath();
            
            if (crossProduct >= 0) {
              ctx.moveTo(vx + normVec1.x * radius, vy + normVec1.y * radius);
              for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                const angle = Math.acos(Math.max(-1, Math.min(1, normVec1.x * normVec2.x + normVec1.y * normVec2.y)));
                const sinAngle = Math.sin(angle);
                let interpVec;
                if (sinAngle > 0.001) {
                  const coeff1 = Math.sin((1 - t) * angle) / sinAngle;
                  const coeff2 = Math.sin(t * angle) / sinAngle;
                  interpVec = {
                    x: normVec1.x * coeff1 + normVec2.x * coeff2,
                    y: normVec1.y * coeff1 + normVec2.y * coeff2
                  };
                } else {
                  interpVec = {
                    x: normVec1.x * (1 - t) + normVec2.x * t,
                    y: normVec1.y * (1 - t) + normVec2.y * t
                  };
                }
                ctx.lineTo(vx + interpVec.x * radius, vy + interpVec.y * radius);
              }
            } else {
              ctx.moveTo(vx + normVec2.x * radius, vy + normVec2.y * radius);
              for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                const angle = Math.acos(Math.max(-1, Math.min(1, normVec1.x * normVec2.x + normVec1.y * normVec2.y)));
                const sinAngle = Math.sin(angle);
                let interpVec;
                if (sinAngle > 0.001) {
                  const coeff1 = Math.sin((1 - t) * angle) / sinAngle;
                  const coeff2 = Math.sin(t * angle) / sinAngle;
                  interpVec = {
                    x: normVec2.x * coeff1 + normVec1.x * coeff2,
                    y: normVec2.y * coeff1 + normVec1.y * coeff2
                  };
                } else {
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
          };
          
          // Use the helper function to draw the angle
          drawAngleFromCoordinates(
            cephalometryData.points['B'],
            cephalometryData.points['A'],
            perpendicularPoint,
            '#0000ff',
            2
          );
        }
      }
      if (showAngles.nsBa) drawAngle('N', 'S', 'Ba', '#0000ff', 2);
      if (showAngles.nlNsl) drawAngle('N', 'ANS', 'PNS', '#0000ff', 2);
      if (showAngles.mlNsl) drawAngle('N', 'Go', 'Me', '#0000ff', 2);
      if (showAngles.nlMl) drawAngle('ANS', 'PNS', 'Go', '#0000ff', 2);
      if (showAngles.gonialAngle) drawAngle('Ar', 'Go', 'Me', '#ff0000', 2);
    } else if (cephalometryData.projectionType === 'frontal') {
        // Draw angle visualizations for frontal projection
        // Note: Frontal projection has fewer angle visualizations defined in the requirements
        // We'll visualize the ArGoMe angles if points are available
        if (showAngles.sna && cephalometryData.points['Ar_L'] && cephalometryData.points['Go_L'] && cephalometryData.points['Me']) {
          drawAngle('Ar_L', 'Go_L', 'Me', '#0000ff', 1);
        }
        if (showAngles.snb && cephalometryData.points['Ar_R'] && cephalometryData.points['Go_R'] && cephalometryData.points['Me']) {
          drawAngle('Ar_R', 'Go_R', 'Me', '#0000ff', 1);
        }
      }
  }, [cephalometryData, selectedPoint, showPlanes, showAngles, activeTool]);
  
  // Draw points and measurements on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cephalometryData.images[cephalometryData.projectionType] || !imagesUploaded) return;
    
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
    
    img.src = cephalometryData.images[cephalometryData.projectionType];
  }, [cephalometryData, selectedPoint, showPlanes, showAngles, activeTool, drawAllElements, cephalometryData.projectionType, imagesUploaded]); // eslint-disable-line react-hooks/exhaustive-deps
  
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
    <div className="cephalometry-module">
      <h2>Модуль цефалометрии</h2>
      
      {/* Main Cephalometry Interface */}
      {
        <>
          
          {/* Patient Info */}
          <div className="patient-info">
            <h3>Информация о пациенте</h3>
            <div className="form-group">
              <label>Имя пациента:</label>
              <input
                type="text"
                value={cephalometryData.patientName}
                onChange={(e) => setCephalometryData(prev => ({
                  ...prev,
                  patientName: e.target.value
                }))}
              />
            </div>
            <div className="form-group">
              <label>Дата анализа:</label>
              <input
                type="date"
                value={cephalometryData.analysisDate}
                onChange={(e) => setCephalometryData(prev => ({
                  ...prev,
                  analysisDate: e.target.value
                }))}
              />
            </div>
            <div className="form-group">
              <label>Тип проекции:</label>
              <select
                value={cephalometryData.projectionType}
                onChange={(e) => setCephalometryData(prev => ({
                  ...prev,
                  projectionType: e.target.value
                }))}
              >
                <option value="frontal">Прямая проекция</option>
                <option value="lateral">Боковая проекция</option>
              </select>
            </div>
          </div>
          
          {/* Image Upload */}
          <div className="image-upload">
            <h3>Рентгеновские снимки</h3>
            {!imagesUploaded ? (
              <CephalometryPhotoSelection onPhotosSelected={(photos) => {
                // Handle all types of photos for photometry
                const newImages = { ...cephalometryData.images };
                
                // Map photos to appropriate projection types
                if (photos.frontal) {
                  try {
                    console.log('Frontal photo type:', typeof photos.frontal);
                    console.log('Frontal photo instanceof Blob:', photos.frontal instanceof Blob);
                    console.log('Frontal photo instanceof File:', photos.frontal instanceof File);
                    console.log('Frontal photo constructor:', photos.frontal.constructor);
                    console.log('Frontal photo keys:', Object.keys(photos.frontal));
                    console.log('Frontal photo value:', photos.frontal);
                    
                    // Check if it's a proper Blob or File
                    if (photos.frontal instanceof Blob || photos.frontal instanceof File) {
                      const imageUrl = URL.createObjectURL(photos.frontal);
                      newImages.frontal = imageUrl;
                    } else if (typeof photos.frontal === 'string' && photos.frontal.startsWith('http')) {
                      // If it's already a URL, use it directly
                      newImages.frontal = photos.frontal;
                    } else if (typeof photos.frontal === 'string') {
                      // If it's a data URL or other string, use it directly
                      newImages.frontal = photos.frontal;
                    } else if (photos.frontal && photos.frontal.data_url) {
                      // If it's an uploaded file object with data_url property
                      newImages.frontal = photos.frontal.data_url;
                    } else {
                      console.error('Frontal photo is not a Blob, File, or URL:', photos.frontal);
                      alert('Ошибка: фронтальное фото имеет неправильный формат данных');
                    }
                  } catch (urlError) {
                    console.error('Ошибка при создании URL для фронтального фото:', urlError);
                    alert('Ошибка при создании URL для фронтального фото: ' + urlError.message);
                  }
                }
                
                if (photos.lateral) {
                  try {
                    console.log('Lateral photo type:', typeof photos.lateral);
                    console.log('Lateral photo instanceof Blob:', photos.lateral instanceof Blob);
                    console.log('Lateral photo instanceof File:', photos.lateral instanceof File);
                    console.log('Lateral photo constructor:', photos.lateral.constructor);
                    console.log('Lateral photo keys:', Object.keys(photos.lateral));
                    console.log('Lateral photo value:', photos.lateral);
                    
                    // Check if it's a proper Blob or File
                    if (photos.lateral instanceof Blob || photos.lateral instanceof File) {
                      const imageUrl = URL.createObjectURL(photos.lateral);
                      newImages.lateral = imageUrl;
                    } else if (typeof photos.lateral === 'string' && photos.lateral.startsWith('http')) {
                      // If it's already a URL, use it directly
                      newImages.lateral = photos.lateral;
                    } else if (typeof photos.lateral === 'string') {
                      // If it's a data URL or other string, use it directly
                      newImages.lateral = photos.lateral;
                    } else if (photos.lateral && photos.lateral.data_url) {
                      // If it's an uploaded file object with data_url property
                      newImages.lateral = photos.lateral.data_url;
                    } else {
                      console.error('Lateral photo is not a Blob, File, or URL:', photos.lateral);
                      alert('Ошибка: боковое фото имеет неправильный формат данных');
                    }
                  } catch (urlError) {
                    console.error('Ошибка при создании URL для бокового фото:', urlError);
                    alert('Ошибка при создании URL для бокового фото: ' + urlError.message);
                  }
                }
                
                if (photos.profile45) {
                  try {
                    console.log('Profile45 photo type:', typeof photos.profile45);
                    console.log('Profile45 photo instanceof Blob:', photos.profile45 instanceof Blob);
                    console.log('Profile45 photo instanceof File:', photos.profile45 instanceof File);
                    console.log('Profile45 photo constructor:', photos.profile45.constructor);
                    console.log('Profile45 photo keys:', Object.keys(photos.profile45));
                    console.log('Profile45 photo value:', photos.profile45);
                    
                    // Check if it's a proper Blob or File
                    if (photos.profile45 instanceof Blob || photos.profile45 instanceof File) {
                      const imageUrl = URL.createObjectURL(photos.profile45);
                      newImages.profile45 = imageUrl;
                    } else if (typeof photos.profile45 === 'string' && photos.profile45.startsWith('http')) {
                      // If it's already a URL, use it directly
                      newImages.profile45 = photos.profile45;
                    } else if (typeof photos.profile45 === 'string') {
                      // If it's a data URL or other string, use it directly
                      newImages.profile45 = photos.profile45;
                    } else if (photos.profile45 && photos.profile45.data_url) {
                      // If it's an uploaded file object with data_url property
                      newImages.profile45 = photos.profile45.data_url;
                    } else {
                      console.error('Profile45 photo is not a Blob, File, or URL:', photos.profile45);
                      alert('Ошибка: 45-градусное фото имеет неправильный формат данных');
                    }
                  } catch (urlError) {
                    console.error('Ошибка при создании URL для 45-градусного фото:', urlError);
                    alert('Ошибка при создании URL для 45-градусного фото: ' + urlError.message);
                  }
                }
                
                if (photos.intraoral) {
                  try {
                    console.log('Intraoral photo type:', typeof photos.intraoral);
                    console.log('Intraoral photo instanceof Blob:', photos.intraoral instanceof Blob);
                    console.log('Intraoral photo instanceof File:', photos.intraoral instanceof File);
                    console.log('Intraoral photo constructor:', photos.intraoral.constructor);
                    console.log('Intraoral photo keys:', Object.keys(photos.intraoral));
                    console.log('Intraoral photo value:', photos.intraoral);
                    
                    // Check if it's a proper Blob or File
                    if (photos.intraoral instanceof Blob || photos.intraoral instanceof File) {
                      const imageUrl = URL.createObjectURL(photos.intraoral);
                      newImages.intraoral = imageUrl;
                    } else if (typeof photos.intraoral === 'string' && photos.intraoral.startsWith('http')) {
                      // If it's already a URL, use it directly
                      newImages.intraoral = photos.intraoral;
                    } else if (typeof photos.intraoral === 'string') {
                      // If it's a data URL or other string, use it directly
                      newImages.intraoral = photos.intraoral;
                    } else if (photos.intraoral && photos.intraoral.data_url) {
                      // If it's an uploaded file object with data_url property
                      newImages.intraoral = photos.intraoral.data_url;
                    } else {
                      console.error('Intraoral photo is not a Blob, File, or URL:', photos.intraoral);
                      alert('Ошибка: внутриротовое фото имеет неправильный формат данных');
                    }
                  } catch (urlError) {
                    console.error('Ошибка при создании URL для внутриротового фото:', urlError);
                    alert('Ошибка при создании URL для внутриротового фото: ' + urlError.message);
                  }
                }
                
                // Update the state with all images
                setCephalometryData(prev => ({
                  ...prev,
                  images: newImages
                }));
                
                // Set images uploaded flag
                setImagesUploaded(true);
                
                // If we have an image for the current projection type, activate scale setting mode
                if (newImages[cephalometryData.projectionType]) {
                  // Get image dimensions
                  const img = new Image();
                  img.onload = () => {
                    setCephalometryData(prev => ({
                      ...prev,
                      imageDimensions: { width: img.width, height: img.height }
                    }));
                    // Automatically activate scale setting mode when image is loaded
                    setActiveTool('scale');
                  };
                  img.src = newImages[cephalometryData.projectionType];
                }
              }} />
            ) : (
              <div className="cephalometry-main">
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
                  <div className={`calibration-section ${cephalometryData.scale > 1 ? 'hidden' : ''}`}>
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
                      {cephalometryData.scale > 1 ? (
                        <p className="calibrated">✓ Изображение откалибровано</p>
                      ) : (
                        <p className="not-calibrated">⚠ Необходима калибровка</p>
                      )}
                    </div>
                    
                  </div>
                  
                  <h3>Точки для расстановки</h3>
                  <div className="points-grid">
                    {pointDefinitions[cephalometryData.projectionType]?.map(point => (
                      <div
                        key={point.id}
                        className={`point-item ${cephalometryData.points[point.id] ? 'placed' : ''} ${nextPointToPlace === point.id ? 'selected next-point' : ''} ${selectedPoint === point.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedPoint(point.id);
                          setSelectedPointImage(`/${point.id}.jpg`); // Set the image for the selected point
                          setActiveTool('select');
                        }}
                      >
                        <span className="point-id">{point.id}</span>
                        <span className="point-name">{point.name}</span>
                        {cephalometryData.points[point.id] ? (
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
                
                {/* TRG Area on the right side */}
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
                            if (canvas && cephalometryData.images[cephalometryData.projectionType] && imagesUploaded) {
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
                              
                              // Add error handling for image loading
                              img.onerror = (error) => {
                                console.error('Error loading image for magnifier:', error);
                              };
                              
                              img.src = cephalometryData.images[cephalometryData.projectionType];
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
                          setCephalometryData(prev => ({ ...prev, isSettingScale: true }));
                        }}
                      >
                        Установка масштаба
                      </button>
                      <button
                        className={activeTool === 'point' ? 'active' : ''}
                        onClick={() => setActiveTool('point')}
                        disabled={cephalometryData.scale <= 1 || !imagesUploaded}
                      >
                        Перейти к расстановке точек
                      </button>
                    </div>
                    
                    <div className="scale-control">
                      {cephalometryData.projectionType === 'lateral' ? (
                        <>
                          <label>Режим масштаба:</label>
                          <select
                            value={cephalometryData.scaleMode}
                            onChange={(e) => {
                              const newMode = e.target.value;
                              setCephalometryData(prev => ({
                                ...prev,
                                scaleMode: newMode
                              }));
                              
                              // Reset scale points when switching modes
                              if (newMode === '10mm') {
                                setCephalometryData(prev => ({
                                  ...prev,
                                  scalePoints30: { point0: null, point30: null }
                                }));
                              } else {
                                setCephalometryData(prev => ({
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
                            value={cephalometryData.calibrationType}
                            onChange={(e) => {
                              const newType = e.target.value;
                              setCephalometryData(prev => ({
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
                              
                              setCephalometryData(prev => ({
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
                            value={cephalometryData.calibrationObjectSize}
                            onChange={(e) => {
                              const newSize = parseFloat(e.target.value) || 0;
                              setCephalometryData(prev => ({
                                ...prev,
                                calibrationObjectSize: newSize
                              }));
                            }}
                          />
                        </>
                      )}
                      
                      
                      <button
                        onClick={() => {
                          if (cephalometryData.projectionType === 'lateral') {
                            // Original reset for lateral projection
                            if (cephalometryData.scaleMode === '10mm') {
                              setCephalometryData(prev => ({
                                ...prev,
                                scalePoints: { point0: null, point10: null },
                                scale: 1
                              }));
                            } else {
                              setCephalometryData(prev => ({
                                ...prev,
                                scalePoints30: { point0: null, point30: null },
                                scale: 1
                              }));
                            }
                          } else {
                            // New reset for frontal projection
                            setCephalometryData(prev => ({
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
                          {cephalometryData.projectionType === 'lateral' ? (
                            <>
                              <p>
                                {cephalometryData.scaleMode === '10mm'
                                  ? 'Установите точку 0, затем точку 10 на расстоянии 10 мм'
                                  : 'Установите точку 0, затем точку 30 на расстоянии 30 мм'}
                              </p>
                              <p>
                                {cephalometryData.scaleMode === '10mm'
                                  ? `Точек установлено: ${cephalometryData.scalePoints.point0 ? 1 : 0}${cephalometryData.scalePoints.point10 ? ' + 1' : ''}`
                                  : `Точек установлено: ${cephalometryData.scalePoints30.point0 ? 1 : 0}${cephalometryData.scalePoints30.point30 ? ' + 1' : ''}`}
                              </p>
                            </>
                          ) : (
                            <>
                              <p>Установите первую точку на одном конце эталонного объекта</p>
                              <p>Установите вторую точку на другом конце эталонного объекта</p>
                              <p>Тип объекта: {cephalometryData.calibrationType}</p>
                              <p>Размер объекта: {cephalometryData.calibrationObjectSize} мм</p>
                              <p>Точек установлено: {cephalometryData.calibrationPoints.point1 ? 1 : 0}{cephalometryData.calibrationPoints.point2 ? ' + 1' : ''}</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Visualization Controls */}
                    <div className="visualization-controls">
                      <h4>Настройки визуализации</h4>
                      
                      {/* Visualization controls for lateral projection */}
                                         {cephalometryData.projectionType === 'lateral' && (
                                           <div className="control-group">
                                             <h5>Плоскости</h5>
                                             <div className="control-buttons">
                                               <button
                                                 onClick={() => setShowPlanes(prev => ({
                                                   nsl: true,
                                                   fh: true,
                                                   nl: true,
                                                   ocp: true,
                                                   ml: true,
                                                   goAr: true,
                                                   gonialAngle: true
                                                 }))}
                                                 className="select-all-btn"
                                               >
                                                 Выбрать все плоскости
                                               </button>
                                               <button
                                                 onClick={() => setShowPlanes(prev => ({
                                                   nsl: false,
                                                   fh: false,
                                                   nl: false,
                                                   ocp: false,
                                                   ml: false,
                                                   goAr: false,
                                                   gonialAngle: false
                                                 }))}
                                                 className="deselect-all-btn"
                                               >
                                                 Убрать все плоскости
                                               </button>
                                             </div>
                                             <label>
                                               <input
                                                 type="checkbox"
                                                 checked={showPlanes.nsl}
                                                 onChange={(e) => setShowPlanes(prev => ({ ...prev, nsl: e.target.checked }))}
                                               />
                                               NSL – плоскость основания переднего отдела черепа
                                             </label>
                                             <label>
                                               <input
                                                 type="checkbox"
                                                 checked={showPlanes.fh}
                                                 onChange={(e) => setShowPlanes(prev => ({ ...prev, fh: e.target.checked }))}
                                               />
                                               FH – франкфурская горизонталь
                                             </label>
                                             <label>
                                               <input
                                                 type="checkbox"
                                                 checked={showPlanes.nl}
                                                 onChange={(e) => setShowPlanes(prev => ({ ...prev, nl: e.target.checked }))}
                                               />
                                               NL – плоскость основания верхней челюсти
                                             </label>
                                             <label>
                                               <input
                                                 type="checkbox"
                                                 checked={showPlanes.ocp}
                                                 onChange={(e) => setShowPlanes(prev => ({ ...prev, ocp: e.target.checked }))}
                                               />
                                               OcP – окклюзионная плоскость
                                             </label>
                                             <label>
                                               <input
                                                 type="checkbox"
                                                 checked={showPlanes.ml}
                                                 onChange={(e) => setShowPlanes(prev => ({ ...prev, ml: e.target.checked }))}
                                               />
                                               ML – плоскость основания нижней челюсти
                                             </label>
                                             <label>
                                               <input
                                                 type="checkbox"
                                                 checked={showPlanes.goAr}
                                                 onChange={(e) => setShowPlanes(prev => ({ ...prev, goAr: e.target.checked }))}
                                               />
                                               Go-Ar – плоскость ветви нижней челюсти
                                             </label>
                                             <label>
                                               <input
                                                 type="checkbox"
                                                 checked={showPlanes.gonialAngle}
                                                 onChange={(e) => setShowPlanes(prev => ({ ...prev, gonialAngle: e.target.checked }))}
                                               />
                                               Гониальный угол (касательные к ветви и телу нижней челюсти)
                                             </label>
                                           </div>
                                         )}
                                         
                                         {cephalometryData.projectionType === 'lateral' && (
                                           <div className="control-group">
                                             <h5>Углы</h5>
                                             <div className="control-buttons">
                                               <button
                                                 onClick={() => setShowAngles(prev => ({
                                                   sna: true,
                                                   snb: true,
                                                   anb: true,
                                                   snPg: true,
                                                   beta: true,
                                                   nsBa: true,
                                                   nlNsl: true,
                                                   mlNsl: true,
                                                   nlMl: true
                                                 }))}
                                                 className="select-all-btn"
                                               >
                                                 Выбрать все углы
                                               </button>
                                               <button
                                                 onClick={() => setShowAngles(prev => ({
                                                   sna: false,
                                                   snb: false,
                                                   anb: false,
                                                   snPg: false,
                                                   beta: false,
                                                   nsBa: false,
                                                   nlNsl: false,
                                                   mlNsl: false,
                                                   nlMl: false
                                                 }))}
                                                 className="deselect-all-btn"
                                               >
                                                 Убрать все углы
                                               </button>
                                             </div>
                                             <label>
                                               <input
                                                 type="checkbox"
                                                 checked={showAngles.sna}
                                                 onChange={(e) => setShowAngles(prev => ({ ...prev, sna: e.target.checked }))}
                                               />
                                               SNA
                                             </label>
                                             <label>
                                               <input
                                                 type="checkbox"
                                                 checked={showAngles.snb}
                                                 onChange={(e) => setShowAngles(prev => ({ ...prev, snb: e.target.checked }))}
                                               />
                                               SNB
                                             </label>
                                             <label>
                                               <input
                                                 type="checkbox"
                                                 checked={showAngles.anb}
                                                 onChange={(e) => setShowAngles(prev => ({ ...prev, anb: e.target.checked }))}
                                               />
                                               ANB
                                             </label>
                                             <label>
                                               <input
                                                 type="checkbox"
                                                 checked={showAngles.snPg}
                                                 onChange={(e) => setShowAngles(prev => ({ ...prev, snPg: e.target.checked }))}
                                               />
                                               SN-Pg
                                             </label>
                                             <label>
                                               <input
                                                 type="checkbox"
                                                 checked={showAngles.beta}
                                                 onChange={(e) => setShowAngles(prev => ({ ...prev, beta: e.target.checked }))}
                                               />
                                               Beta
                                             </label>
                                             <label>
                                               <input
                                                 type="checkbox"
                                                 checked={showAngles.nsBa}
                                                 onChange={(e) => setShowAngles(prev => ({ ...prev, nsBa: e.target.checked }))}
                                               />
                                               N-S-Ba
                                             </label>
                                             <label>
                                               <input
                                                 type="checkbox"
                                                 checked={showAngles.nlNsl}
                                                 onChange={(e) => setShowAngles(prev => ({ ...prev, nlNsl: e.target.checked }))}
                                               />
                                               NL/NSL
                                             </label>
                                             <label>
                                               <input
                                                 type="checkbox"
                                                 checked={showAngles.mlNsl}
                                                 onChange={(e) => setShowAngles(prev => ({ ...prev, mlNsl: e.target.checked }))}
                                               />
                                               ML-NSL
                                             </label>
                                             <label>
                                               <input
                                                 type="checkbox"
                                                 checked={showAngles.nlMl}
                                                 onChange={(e) => setShowAngles(prev => ({ ...prev, nlMl: e.target.checked }))}
                                               />
                                               NL-ML
                                             </label>
                                           </div>
                                         )}
                                         
                                         {/* Visualization controls for frontal projection */}
                                                            {cephalometryData.projectionType === 'frontal' && (
                                                              <div className="control-group">
                                                                <h5>Линии</h5>
                                                                <div className="control-buttons">
                                                                  <button
                                                                    onClick={() => setShowPlanes(prev => ({
                                                                      nsl: true,
                                                                      fh: true,
                                                                      nl: true,
                                                                      ocp: true,
                                                                      ml: true,
                                                                      goAr: true,
                                                                      gonialAngle: true
                                                                    }))}
                                                                    className="select-all-btn"
                                                                  >
                                                                    Выбрать все линии
                                                                  </button>
                                                                  <button
                                                                    onClick={() => setShowPlanes(prev => ({
                                                                      nsl: false,
                                                                      fh: false,
                                                                      nl: false,
                                                                      ocp: false,
                                                                      ml: false,
                                                                      goAr: false,
                                                                      gonialAngle: false
                                                                    }))}
                                                                    className="deselect-all-btn"
                                                                  >
                                                                    Убрать все линии
                                                                  </button>
                                                                </div>
                                                                <label>
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={showPlanes.nsl}
                                                                    onChange={(e) => setShowPlanes(prev => ({ ...prev, nsl: e.target.checked }))}
                                                                  />
                                                                  Центральная линия (N-Me)
                                                                </label>
                                                                <label>
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={showPlanes.fh}
                                                                    onChange={(e) => setShowPlanes(prev => ({ ...prev, fh: e.target.checked }))}
                                                                  />
                                                                  SO-SO (Interorbital line)
                                                                </label>
                                                                <label>
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={showPlanes.nl}
                                                                    onChange={(e) => setShowPlanes(prev => ({ ...prev, nl: e.target.checked }))}
                                                                  />
                                                                  Z-Z (Zygomatic line)
                                                                </label>
                                                                <label>
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={showPlanes.ocp}
                                                                    onChange={(e) => setShowPlanes(prev => ({ ...prev, ocp: e.target.checked }))}
                                                                  />
                                                                  Co-Co (Condylion line)
                                                                </label>
                                                                <label>
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={showPlanes.ml}
                                                                    onChange={(e) => setShowPlanes(prev => ({ ...prev, ml: e.target.checked }))}
                                                                  />
                                                                  NC-NC (Nasal cavity line)
                                                                </label>
                                                                <label>
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={showPlanes.goAr}
                                                                    onChange={(e) => setShowPlanes(prev => ({ ...prev, goAr: e.target.checked }))}
                                                                  />
                                                                  J-J (Maxillary apical base width)
                                                                </label>
                                                                <label>
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={showPlanes.ml}
                                                                    onChange={(e) => setShowPlanes(prev => ({ ...prev, ml: e.target.checked }))}
                                                                  />
                                                                  U6-U6 (Upper dental arch width)
                                                                </label>
                                                                <label>
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={showPlanes.goAr}
                                                                    onChange={(e) => setShowPlanes(prev => ({ ...prev, goAr: e.target.checked }))}
                                                                  />
                                                                  L6-L6 (Lower dental arch width)
                                                                </label>
                                                                <label>
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={showPlanes.gonialAngle}
                                                                    onChange={(e) => setShowPlanes(prev => ({ ...prev, gonialAngle: e.target.checked }))}
                                                                  />
                                                                  Гониальный угол (касательные к ветви и телу нижней челюсти)
                                                                </label>
                                                                <label>
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={showPlanes.ocp}
                                                                    onChange={(e) => setShowPlanes(prev => ({ ...prev, ocp: e.target.checked }))}
                                                                  />
                                                                  Ag-Ag (Mandibular apical base width)
                                                                </label>
                                                                <label>
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={showPlanes.nl}
                                                                    onChange={(e) => setShowPlanes(prev => ({ ...prev, nl: e.target.checked }))}
                                                                  />
                                                                  A-U1
                                                                </label>
                                                                <label>
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={showPlanes.fh}
                                                                    onChange={(e) => setShowPlanes(prev => ({ ...prev, fh: e.target.checked }))}
                                                                  />
                                                                  B-L1
                                                                </label>
                                                                <label>
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={showPlanes.nsl}
                                                                    onChange={(e) => setShowPlanes(prev => ({ ...prev, nsl: e.target.checked }))}
                                                                  />
                                                                  Co-Go (L,P) left/right (Ramus length)
                                                                </label>
                                                                <label>
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={showPlanes.gonialAngle}
                                                                    onChange={(e) => setShowPlanes(prev => ({ ...prev, gonialAngle: e.target.checked }))}
                                                                  />
                                                                  Гониальный угол (касательные к ветви и телу нижней челюсти)
                                                                </label>
                                                                <label>
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={showPlanes.ml}
                                                                    onChange={(e) => setShowPlanes(prev => ({ ...prev, ml: e.target.checked }))}
                                                                  />
                                                                  Go-Me (L,P) left/right (Body length)
                                                                </label>
                                                                <label>
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={showPlanes.gonialAngle}
                                                                    onChange={(e) => setShowPlanes(prev => ({ ...prev, gonialAngle: e.target.checked }))}
                                                                  />
                                                                  Гониальный угол (касательные к ветви и телу нижней челюсти)
                                                                </label>
                                                              </div>
                                                            )}
                                                            
                                                            {cephalometryData.projectionType === 'frontal' && (
                                                              <div className="control-group">
                                                                <h5>Углы</h5>
                                                                <div className="control-buttons">
                                                                  <button
                                                                    onClick={() => setShowAngles(prev => ({
                                                                      sna: true,
                                                                      snb: true,
                                                                      anb: true,
                                                                      snPg: true,
                                                                      beta: true,
                                                                      nsBa: true,
                                                                      nlNsl: true,
                                                                      mlNsl: true,
                                                                      nlMl: true
                                                                    }))}
                                                                    className="select-all-btn"
                                                                  >
                                                                    Выбрать все углы
                                                                  </button>
                                                                  <button
                                                                    onClick={() => setShowAngles(prev => ({
                                                                      sna: false,
                                                                      snb: false,
                                                                      anb: false,
                                                                      snPg: false,
                                                                      beta: false,
                                                                      nsBa: false,
                                                                      nlNsl: false,
                                                                      mlNsl: false,
                                                                      nlMl: false
                                                                    }))}
                                                                    className="deselect-all-btn"
                                                                  >
                                                                    Убрать все углы
                                                                  </button>
                                                                </div>
                                                                <label>
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={showAngles.sna}
                                                                    onChange={(e) => setShowAngles(prev => ({ ...prev, sna: e.target.checked }))}
                                                                  />
                                                                  ArGoMe (left)
                                                                </label>
                                                                <label>
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={showAngles.gonialAngle}
                                                                    onChange={(e) => setShowAngles(prev => ({ ...prev, gonialAngle: e.target.checked }))}
                                                                  />
                                                                  Гониальный угол (Ar-Go-Me)
                                                                </label>
                                                                <label>
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={showAngles.snb}
                                                                    onChange={(e) => setShowAngles(prev => ({ ...prev, snb: e.target.checked }))}
                                                                  />
                                                                  ArGoMe (right)
                                                                </label>
                                                                <label>
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={showAngles.gonialAngle}
                                                                    onChange={(e) => setShowAngles(prev => ({ ...prev, gonialAngle: e.target.checked }))}
                                                                  />
                                                                  Гониальный угол (Ar-Go-Me)
                                                                </label>
                                                              </div>
                                                            )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Measurements */}
          {Object.keys(cephalometryData.points).length > 0 && (
            <div className="measurements">
              <h3>Измерения</h3>
              <button onClick={calculateMeasurements}>Рассчитать измерения</button>
              {Object.keys(cephalometryData.measurements).length > 0 && (
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
                    {Object.entries(cephalometryData.measurements || {}).map(([key, measurement]) => (
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
          {(reportData || Object.keys(cephalometryData.measurements).length > 0) && (
            <div className="report">
              <h3>Отчет</h3>
              <button onClick={generateReport}>Сформировать отчет</button>
              
              {reportData && (
                <div className="report-content">
                  <h4>Результаты цефалометрического анализа</h4>
                  <p><strong>Пациент:</strong> {reportData.patientName}</p>
                  <p><strong>Дата анализа:</strong> {reportData.analysisDate}</p>
                  <p><strong>Тип проекции:</strong> {
                    reportData.projectionType === 'lateral' ? 'Боковая' : 'Прямая'
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
              <button 
                onClick={handleSaveToMedicalCard}
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Сохранение...' : '💾 Сохранить в медицинскую карту'}
              </button>

              <button 
                onClick={exportCephalometryForMedicalCard}
                className="btn-success"
              >
                📊 Экспорт для MedicalCard
              </button>
              
              {showMedicalCardLink && (
                <div className="medical-card-link">
                  <p>Данные сохранены! Перейти в медицинскую карту:</p>
                  <button 
                    onClick={() => navigate('/medical-card')}
                    className="btn-success"
                  >
                    📋 Открыть медицинскую карту
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Actions */}
          <div className="actions">
            <button onClick={handleSave} disabled={!imagesUploaded}>
              Сохранить измерения
            </button>
            <button onClick={handleQuickSave} className="btn-secondary">
              Быстрое сохранение
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
        </>
      }
    </div>
  );
};

export default CephalometryModule;