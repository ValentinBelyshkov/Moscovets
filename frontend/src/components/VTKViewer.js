import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as dicomParser from 'dicom-parser';

const VTKViewer = ({ dataUrl, activeTool, viewerMode, windowLevel, zoomLevel, panOffset, onMeasurementComplete, onAnnotationAdd, annotations = [] }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dicomData, setDicomData] = useState(null);
  
  // Measurement state (managed by parent component through callbacks)
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurementStart, setMeasurementStart] = useState(null);
  const [measurementMiddle, setMeasurementMiddle] = useState(null);
  const [currentMousePos, setCurrentMousePos] = useState(null);
  
  // Calibration state
  const [calibrationType, setCalibrationType] = useState('implant'); // 'implant', 'crown', 'distance', 'known_object'
  const [calibrationObjectSize, setCalibrationObjectSize] = useState(10); // Size in mm
  const [calibrationPoints, setCalibrationPoints] = useState({ point1: null, point2: null });
  const [calibrationDistance, setCalibrationDistance] = useState(0); // pixels per mm

  // Parse DICOM data
  const parseDICOM = (arrayBuffer) => {
    try {
      const byteArray = new Uint8Array(arrayBuffer);
      const dataSet = dicomParser.parseDicom(byteArray);
      
      // Extract basic DICOM information
      const rows = dataSet.uint16('x00280010');
      const columns = dataSet.uint16('x00280011');
      const bitsAllocated = dataSet.uint16('x00280100');
      const bitsStored = dataSet.uint16('x00280101');
      const highBit = dataSet.uint16('x00280102');
      const pixelRepresentation = dataSet.uint16('x00280103');
      const samplesPerPixel = dataSet.uint16('x00280002') || 1;
      const photometricInterpretation = dataSet.string('x00280004') || 'MONOCHROME2';
      
      // Extract pixel spacing information for measurement conversion
      let pixelSpacing = null;
      try {
        const pixelSpacingStr = dataSet.string('x00280030');
        if (pixelSpacingStr) {
          const spacingValues = pixelSpacingStr.split('\\').map(parseFloat);
          if (spacingValues.length === 2 && !isNaN(spacingValues[0]) && !isNaN(spacingValues[1])) {
            pixelSpacing = {
              row: spacingValues[0],
              column: spacingValues[1]
            };
          }
        }
      } catch (e) {
        console.warn('Could not extract pixel spacing:', e);
      }
      
      // Extract pixel data using dicom-parser's getUint16 method
      let pixelData;
      const pixelDataElement = dataSet.elements.x7fe00010;
      
      if (!pixelDataElement) {
        throw new Error('No pixel data found in DICOM file');
      }
      
      if (bitsAllocated === 8) {
        pixelData = new Uint8Array(arrayBuffer, pixelDataElement.dataOffset, pixelDataElement.length);
      } else if (bitsAllocated === 16) {
        // For 16-bit data, we need to extract each value properly
        pixelData = new Uint16Array(pixelDataElement.length / 2);
        let pixelDataOffset = pixelDataElement.dataOffset;
        for (let i = 0; i < pixelData.length; i++) {
          pixelData[i] = dataSet.byteArray[pixelDataOffset++] + (dataSet.byteArray[pixelDataOffset++] << 8);
        }
      } else if (bitsAllocated === 32) {
        pixelData = new Int32Array(pixelDataElement.length / 4);
        let pixelDataOffset = pixelDataElement.dataOffset;
        for (let i = 0; i < pixelData.length; i++) {
          pixelData[i] = dataSet.byteArray[pixelDataOffset++] + 
                        (dataSet.byteArray[pixelDataOffset++] << 8) + 
                        (dataSet.byteArray[pixelDataOffset++] << 16) + 
                        (dataSet.byteArray[pixelDataOffset++] << 24);
        }
      } else {
        throw new Error(`Unsupported bit depth: ${bitsAllocated}`);
      }

      return {
        rows,
        columns,
        bitsAllocated,
        bitsStored,
        highBit,
        pixelRepresentation,
        samplesPerPixel,
        photometricInterpretation,
        pixelData,
        dataSet,
        pixelSpacing
      };
    } catch (err) {
      console.error('DICOM parsing error:', err);
      throw new Error(`Failed to parse DICOM file: ${err.message}`);
    }
  };

  // Convert DICOM pixel data to canvas image data
  const convertToCanvasImageData = (dicomData, windowSettings) => {
    const { rows, columns, pixelData, bitsAllocated, pixelRepresentation, photometricInterpretation } = dicomData;
    const { window, level } = windowSettings;
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = columns;
    canvas.height = rows;
    const ctx = canvas.getContext('2d');
    
    // Create image data
    const imageData = ctx.createImageData(columns, rows);
    const data = imageData.data;
    
    // Calculate window parameters
    const windowMin = level - window / 2;
    const windowMax = level + window / 2;
    const windowRange = windowMax - windowMin;
    
    // Convert pixel data to RGB
    for (let i = 0; i < pixelData.length; i++) {
      let pixelValue = pixelData[i];
      
      // Handle signed data
      if (pixelRepresentation === 1 && pixelValue >= Math.pow(2, bitsAllocated - 1)) {
        pixelValue -= Math.pow(2, bitsAllocated);
      }
      
      // Apply window/level
      let normalizedValue = 0;
      if (windowRange !== 0) {
        normalizedValue = ((pixelValue - windowMin) / windowRange) * 255;
      }
      
      // Clamp to 0-255 range
      normalizedValue = Math.max(0, Math.min(255, normalizedValue));
      
      // Handle photometric interpretation
      if (photometricInterpretation === 'MONOCHROME1') {
        normalizedValue = 255 - normalizedValue; // Invert for MONOCHROME1
      }
      
      // Set RGB values (grayscale)
      const idx = i * 4;
      data[idx] = normalizedValue;     // Red
      data[idx + 1] = normalizedValue; // Green
      data[idx + 2] = normalizedValue; // Blue
      data[idx + 3] = 255;             // Alpha
    }
    
    return imageData;
  };

  // Apply mode-specific transformations to simulate different views
  const applyModeTransformations = (imageData, mode) => {
    const width = imageData.width;
    const height = imageData.height;
    
    // Create a new canvas for transformed image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Put original image data on canvas
    ctx.putImageData(imageData, 0, 0);
    
    // Apply transformation based on mode
    switch (mode) {
      case 'axial':
        // Axial view - normal orientation with slight enhancement
        // Just return the original image with minor adjustments
        const axialImageData = ctx.getImageData(0, 0, width, height);
        const axialData = axialImageData.data;
        
        // Slight contrast enhancement for axial view
        for (let i = 0; i < axialData.length; i += 4) {
          let val = axialData[i];
          val = ((val - 128) * 1.1) + 128; // Increase contrast by 10%
          val = Math.max(0, Math.min(255, val));
          axialData[i] = val;
          axialData[i + 1] = val;
          axialData[i + 2] = val;
        }
        
        return new ImageData(axialData, width, height);
        
      case 'coronal':
        // Coronal view - flip vertically to simulate front view
        ctx.save();
        ctx.translate(0, height);
        ctx.scale(1, -1);
        ctx.drawImage(canvas, 0, 0);
        ctx.restore();
        
        // Add slight brightness for coronal view
        const coronalImageData = ctx.getImageData(0, 0, width, height);
        const coronalData = coronalImageData.data;
        for (let i = 0; i < coronalData.length; i += 4) {
          coronalData[i] = Math.min(255, coronalData[i] + 15);
          coronalData[i + 1] = Math.min(255, coronalData[i + 1] + 15);
          coronalData[i + 2] = Math.min(255, coronalData[i + 2] + 15);
        }
        
        return coronalImageData;
        
      case 'sagittal':
        // Sagittal view - rotate 90 degrees to simulate side view
        const sagittalCanvas = document.createElement('canvas');
        sagittalCanvas.width = height;
        sagittalCanvas.height = width;
        const sagittalCtx = sagittalCanvas.getContext('2d');
        
        sagittalCtx.save();
        sagittalCtx.translate(height / 2, width / 2);
        sagittalCtx.rotate(Math.PI / 2);
        sagittalCtx.drawImage(canvas, -width / 2, -height / 2);
        sagittalCtx.restore();
        
        // Add slight desaturation for sagittal view
        const rotatedImageData = sagittalCtx.getImageData(0, 0, height, width);
        const rotatedData = rotatedImageData.data;
        for (let i = 0; i < rotatedData.length; i += 4) {
          const avg = (rotatedData[i] + rotatedData[i + 1] + rotatedData[i + 2]) / 3;
          rotatedData[i] = avg * 0.8 + rotatedData[i] * 0.2;
          rotatedData[i + 1] = avg * 0.8 + rotatedData[i + 1] * 0.2;
          rotatedData[i + 2] = avg * 0.8 + rotatedData[i + 2] * 0.2;
        }
        
        return rotatedImageData;
        
      case '3d':
        // 3D view - simulate volume rendering with pseudo-3D effect
        const originalImageData = ctx.getImageData(0, 0, width, height);
        const originalData = originalImageData.data;
        const threeDData = new Uint8ClampedArray(originalData);
        
        // Create a simple emboss effect to simulate 3D
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            const leftIdx = (y * width + (x - 1)) * 4;
            const topIdx = ((y - 1) * width + x) * 4;
            
            // Calculate gradient for emboss effect
            const dx = originalData[leftIdx] - originalData[idx];
            const dy = originalData[topIdx] - originalData[idx];
            const gradient = (dx + dy) / 2;
            
            // Apply emboss effect
            const newVal = Math.max(0, Math.min(255, originalData[idx] + gradient + 50));
            threeDData[idx] = newVal;
            threeDData[idx + 1] = newVal;
            threeDData[idx + 2] = newVal;
          }
        }
        
        return new ImageData(threeDData, width, height);
        
      default:
        return imageData;
    }
  };

  // Draw image on canvas with mode-specific transformations
  const drawImageOnCanvas = useCallback((imageData, mode = 'axial') => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Apply mode-specific transformations
    const transformedImageData = applyModeTransformations(imageData, mode);
    
    // Set canvas size to match transformed image
    canvas.width = transformedImageData.width;
    canvas.height = transformedImageData.height;
    
    // Draw transformed image data
    ctx.putImageData(transformedImageData, 0, 0);
    
    // Draw crosshairs for medical imaging reference
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    
    // Draw current measurement line if measuring
    if (isMeasuring && measurementStart && currentMousePos) {
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(measurementStart.x, measurementStart.y);
      ctx.lineTo(currentMousePos.x, currentMousePos.y);
      ctx.stroke();
      
      // Draw measurement points
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.beginPath();
      ctx.arc(measurementStart.x, measurementStart.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(currentMousePos.x, currentMousePos.y, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // For protractor, draw second line segment when middle point is set
      if (activeTool === 'protractor' && measurementMiddle) {
        // Draw line from start to middle point
        ctx.beginPath();
        ctx.moveTo(measurementStart.x, measurementStart.y);
        ctx.lineTo(measurementMiddle.x, measurementMiddle.y);
        ctx.stroke();
        
        // Draw line from middle to current point
        ctx.beginPath();
        ctx.moveTo(measurementMiddle.x, measurementMiddle.y);
        ctx.lineTo(currentMousePos.x, currentMousePos.y);
        ctx.stroke();
        
        // Draw all three points
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(measurementStart.x, measurementStart.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(measurementMiddle.x, measurementMiddle.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(currentMousePos.x, currentMousePos.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Draw calibration points if in calibration mode
    if (activeTool === 'calibrate') {
      if (calibrationPoints.point1) {
        const point = calibrationPoints.point1;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#00ff00'; // Green for point 1
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw label
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('1', point.x + 15, point.y - 15);
      }
      
      if (calibrationPoints.point2) {
        const point = calibrationPoints.point2;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff9900'; // Orange for point 2
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw label
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('2', point.x + 15, point.y - 15);
      }
      
      // Draw line between calibration points if both are set
      if (calibrationPoints.point1 && calibrationPoints.point2) {
        const point1 = calibrationPoints.point1;
        const point2 = calibrationPoints.point2;
        ctx.beginPath();
        ctx.moveTo(point1.x, point1.y);
        ctx.lineTo(point2.x, point2.y);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
    
    // Draw annotations
    annotations.forEach(annotation => {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'; // Red color for annotations (changed from yellow)
      ctx.beginPath();
      ctx.arc(annotation.x, annotation.y, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Add a small label for the annotation
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('+', annotation.x + 8, annotation.y + 4);
    });
    
    // Add mode-specific overlay text only when we have DICOM data
    if (dicomData) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '14px Arial';
      ctx.textAlign = 'right';
      
      let modeText = '';
      switch (mode) {
        case 'axial':
          modeText = 'Аксиальная (трансверзальная)';
          break;
        case 'coronal':
          modeText = 'Корональная (фронтальная)';
          break;
        case 'sagittal':
          modeText = 'Сагиттальная';
          break;
        case '3d':
          modeText = '3D-объем (Volume Rendering)';
          break;
        default:
          modeText = mode;
      }
      
      ctx.fillText(modeText, canvas.width - 10, 20);
    }
  }, [isMeasuring, measurementStart, currentMousePos, activeTool, measurementMiddle, annotations, dicomData, calibrationPoints]);

  // Load and process DICOM image
  const loadDICOMImage = useCallback(async (url) => {
    try {
      console.log('Loading image from URL:', url);
      
      // Log the URL for debugging
      console.log('Attempting to load image from URL:', url);
      console.log('URL type:', typeof url);
      console.log('URL length:', url ? url.length : 'N/A');
      console.log('URL starts with:', url ? url.substring(0, 50) : 'N/A');
      
      // Check if URL is valid
      if (!url) {
        throw new Error('Недопустимый URL файла изображения: URL не определен или пуст');
      }
      
      // Check if URL is a valid string
      if (typeof url !== 'string') {
        throw new Error(`Недопустимый формат URL файла изображения: ожидается строка, получено ${typeof url}`);
      }
      
      // Check if URL is not just whitespace
      if (url.trim() === '') {
        throw new Error('Недопустимый URL файла изображения: URL состоит только из пробельных символов');
      }
      
      // Fetch image data
      let response;
      try {
        response = await fetch(url);
      } catch (fetchError) {
        console.error('Network error when fetching image:', fetchError);
        throw new Error(`Не удалось загрузить изображение: сетевая ошибка - ${fetchError.message || 'Неизвестная сетевая ошибка'}`);
      }
      
      // Check if response is ok
      if (!response.ok) {
        throw new Error(`Не удалось загрузить изображение: ${response.status} ${response.statusText}`);
      }
      
      let arrayBuffer;
      try {
        arrayBuffer = await response.arrayBuffer();
      } catch (bufferError) {
        console.error('Error reading response as array buffer:', bufferError);
        throw new Error(`Не удалось прочитать данные изображения: ${bufferError.message || 'Неизвестная ошибка чтения данных'}`);
      }
      
      // Try to parse as DICOM first
      try {
        // Parse DICOM
        const parsedData = parseDICOM(arrayBuffer);
        console.log('DICOM parsed successfully:', parsedData);
        
        setDicomData(parsedData);
        
        // Convert to canvas image data
        const imageData = convertToCanvasImageData(parsedData, windowLevel);
        
        // Draw on canvas with current viewer mode
        drawImageOnCanvas(imageData, viewerMode);
        
        return imageData;
      } catch (dicomError) {
        // If DICOM parsing fails, try to load as regular image
        console.log('Not a DICOM file, loading as regular image');
        setDicomData(null);
        
        // Check if this is a 3D model file that should be handled differently
        if (url && (url.endsWith('.stl') || url.endsWith('.obj'))) {
          // For 3D model files, we'll display a placeholder
          if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            // Set canvas size
            canvas.width = 500;
            canvas.height = 500;
            
            // Clear canvas
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Display message
            ctx.fillStyle = '#fff';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('3D Model Preview', canvas.width / 2, canvas.height / 2);
            ctx.font = '16px Arial';
            ctx.fillText('STL/OBJ files are displayed in 3D viewer', canvas.width / 2, canvas.height / 2 + 30);
          }
          
          // Return a mock image object
          return { width: 500, height: 500 };
        }
        
        // Create image element to get dimensions
        const img = new Image();
        img.src = url;
        
        // Wait for image to load
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = (error) => {
            console.error('Error loading image:', error);
            reject(new Error(`Не удалось загрузить изображение: ${error.message || 'Неизвестная ошибка загрузки изображения'}`));
          };
        });
        
        // Draw image on canvas
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          
          // Set canvas size to match image
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image
          ctx.drawImage(img, 0, 0);
          
          // Draw crosshairs for medical imaging reference
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(canvas.width / 2, 0);
          ctx.lineTo(canvas.width / 2, canvas.height);
          ctx.moveTo(0, canvas.height / 2);
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();
        }
        
        return img;
      }
    } catch (err) {
      console.error('Error loading image:', err);
      const errorMessage = err.message || 'Неизвестная ошибка при загрузке изображения';
      throw new Error(`Failed to load image: ${errorMessage}`);
    }
  }, [windowLevel, viewerMode, drawImageOnCanvas]);

  useEffect(() => {
    if (!containerRef.current || !dataUrl) {
      // Clear canvas and reset state when no dataUrl is provided
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setError(null);
      setLoading(false);
      return;
    }
    
    // Additional validation for dataUrl
    if (typeof dataUrl !== 'string' || dataUrl.trim() === '') {
      setError('Недопустимый URL файла изображения: URL не определен или пуст');
      setLoading(false);
      return;
    }
    
    // Validate that dataUrl is a valid data URL or HTTP URL
    // File URLs are now supported through conversion to relative paths
    // Also support blob URLs which are created when loading files from the computer
    if (!dataUrl.startsWith('data:') && !dataUrl.startsWith('http:') && !dataUrl.startsWith('https:') && !dataUrl.startsWith('file://') && !dataUrl.startsWith('blob:')) {
      setError('Недопустимый формат URL файла изображения: должен начинаться с "data:", "http:", "https:", "file://" или "blob:"');
      setLoading(false);
      return;
    }
    
    // If it's a file:// URL, convert it to a valid URL for the browser
    let processedUrl = dataUrl;
    if (dataUrl.startsWith('file://')) {
      // Extract the file path from file:// URL
      const filePath = dataUrl.substring(7); // Remove 'file://' prefix
      
      // For local files in a web app, we need to serve them through the web server
      // In development, we can use the public folder
      // In production, we need to ensure files are properly served
      // For now, we'll convert file:// to a relative path assuming files are in public folder
      const publicPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
      processedUrl = `/${publicPath}`;
      
      console.log('Converting file:// URL to:', processedUrl);
    }

    let isCancelled = false;
    
    console.log('Processing DICOM image with URL:', processedUrl);
    console.log('Processed URL type:', typeof processedUrl);
    console.log('Processed URL length:', processedUrl ? processedUrl.length : 'N/A');
    if (processedUrl) {
      console.log('Processed URL starts with:', processedUrl.substring(0, 100));
    }
    
    // Show loading indicator
    setLoading(true);
    setError(null);
    
    // Load and display DICOM
    loadDICOMImage(processedUrl)
      .then((imageData) => {
        if (isCancelled) return;
        
        console.log('DICOM image loaded successfully');
        setLoading(false);
      })
      .catch((err) => {
        if (isCancelled) return;
        
        console.error('Error loading DICOM image:', err);
        setLoading(false);
        const errorMessage = err.message || 'Неизвестная ошибка при загрузке DICOM изображения';
        setError('Failed to load DICOM image: ' + errorMessage);
      });
    
    return () => {
      isCancelled = true;
    };
  }, [dataUrl, loadDICOMImage]);

  useEffect(() => {
    // Re-apply window/level when settings change
    if (dicomData && windowLevel) {
      try {
        const imageData = convertToCanvasImageData(dicomData, windowLevel);
        drawImageOnCanvas(imageData, viewerMode);
      } catch (err) {
        console.error('Error applying window/level:', err);
      }
    }
  }, [windowLevel, dicomData, viewerMode, drawImageOnCanvas]);

  // Effect to redraw when viewer mode changes
  useEffect(() => {
    if (dicomData) {
      try {
        const imageData = convertToCanvasImageData(dicomData, windowLevel);
        drawImageOnCanvas(imageData, viewerMode);
      } catch (err) {
        console.error('Error applying viewer mode:', err);
        setError('Ошибка при применении режима просмотра: ' + err.message);
      }
    }
  }, [viewerMode, dicomData, windowLevel, drawImageOnCanvas]);

  // Error display
  if (error) {
    return (
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '500px', 
          position: 'relative',
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '16px',
          padding: '20px',
          textAlign: 'center'
        }} 
      >
        Error: {error}
      </div>
    );
  }

  // Loading display
  if (loading) {
    return (
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '500px', 
          position: 'relative',
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '18px'
        }} 
      >
        Loading DICOM image...
      </div>
    );
  }

  // Mouse event handlers for analysis tools
  const handleMouseDown = (e) => {
    if (!activeTool || activeTool === 'select') return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomLevel - panOffset.x;
    const y = (e.clientY - rect.top) / zoomLevel - panOffset.y;
    
    if (activeTool === 'ruler') {
      if (!isMeasuring) {
        // Start measurement
        setIsMeasuring(true);
        setMeasurementStart({ x, y });
      } else {
        // Complete measurement
        if (measurementStart) {
          const distance = Math.sqrt(
            Math.pow(x - measurementStart.x, 2) +
            Math.pow(y - measurementStart.y, 2)
          );
          
          // Calculate distance in mm if calibration is set
          let distanceInMm = distance;
          
          // Use calibration if available, otherwise use pixel spacing
          if (calibrationDistance > 0) {
            distanceInMm = distance / calibrationDistance;
          } else if (dicomData?.pixelSpacing && dicomData.pixelSpacing.row && dicomData.pixelSpacing.column) {
            // Use average of row and column spacing for isotropic approximation
            const avgPixelSpacing = (dicomData.pixelSpacing.row + dicomData.pixelSpacing.column) / 2;
            distanceInMm = distance * avgPixelSpacing;
          }
          
          // Call parent callback with measurement result
          if (onMeasurementComplete) {
            onMeasurementComplete({
              tool: activeTool,
              startX: measurementStart.x,
              startY: measurementStart.y,
              endX: x,
              endY: y,
              distance: distanceInMm,
              pixelSpacing: dicomData?.pixelSpacing,
              calibrationUsed: calibrationDistance > 0,
              calibrationType: calibrationDistance > 0 ? calibrationType : null
            });
          }
        }
        setIsMeasuring(false);
        setMeasurementStart(null);
      }
    } else if (activeTool === 'protractor') {
      if (!isMeasuring) {
        // Start protractor measurement (first point)
        setIsMeasuring(true);
        setMeasurementStart({ x, y });
      } else if (!measurementMiddle) {
        // Set middle point
        setMeasurementMiddle({ x, y });
      } else {
        // Complete protractor measurement (third point)
        if (measurementStart && measurementMiddle) {
          // Calculate angle between three points (1-2-3 instead of 1-3-2)
          // Vector from start to middle point
          const vector1 = {
            x: measurementStart.x - measurementMiddle.x,
            y: measurementStart.y - measurementMiddle.y
          };
          
          // Vector from middle to end point (current point)
          const vector2 = {
            x: x - measurementMiddle.x,
            y: y - measurementMiddle.y
          };
          
          // Calculate angle using dot product formula
          const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
          const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
          const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
          
          // Avoid division by zero
          if (magnitude1 !== 0 && magnitude2 !== 0) {
            const cosAngle = dotProduct / (magnitude1 * magnitude2);
            // Clamp to [-1, 1] to avoid numerical errors
            const clampedCosAngle = Math.max(-1, Math.min(1, cosAngle));
            const angleRad = Math.acos(clampedCosAngle);
            const angleDeg = angleRad * (180 / Math.PI);
            
            // Call parent callback with angle measurement result
            if (onMeasurementComplete) {
              onMeasurementComplete({
                tool: activeTool,
                startX: measurementStart.x,
                startY: measurementStart.y,
                midX: measurementMiddle.x,
                midY: measurementMiddle.y,
                endX: x,
                endY: y,
                angle: angleDeg
              });
            }
          }
        }
        setIsMeasuring(false);
        setMeasurementStart(null);
        setMeasurementMiddle(null);
      }
    } else if (activeTool === 'annotate') {
      // Add annotation
      if (onAnnotationAdd) {
        onAnnotationAdd({ x, y });
      }
    } else if (activeTool === 'calibrate') {
      // Handle calibration point setting
      if (!calibrationPoints.point1) {
        // Set the first calibration point
        setCalibrationPoints(prev => ({
          ...prev,
          point1: { x, y }
        }));
      } else if (!calibrationPoints.point2) {
        // Set the second calibration point
        setCalibrationPoints(prev => ({
          ...prev,
          point2: { x, y }
        }));
        
        // Calculate calibration distance: pixels per mm
        const dx = x - calibrationPoints.point1.x;
        const dy = y - calibrationPoints.point1.y;
        const pixelDistance = Math.sqrt(dx * dx + dy * dy);
        const calculatedDistance = pixelDistance / calibrationObjectSize; // pixels per mm
        
        setCalibrationDistance(calculatedDistance);
        
        // Show calibration result
        alert(`Калибровка завершена! ${calibrationObjectSize} мм = ${pixelDistance.toFixed(2)} пикселей\nМасштаб: ${calculatedDistance.toFixed(4)} пикселей/мм`);
      }
    }
  };
  
  const handleMouseMove = (e) => {
    if (!activeTool || activeTool === 'select') return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomLevel - panOffset.x;
    const y = (e.clientY - rect.top) / zoomLevel - panOffset.y;
    
    if (activeTool === 'ruler' && isMeasuring) {
      setCurrentMousePos({ x, y });
    } else if (activeTool === 'protractor' && isMeasuring) {
      setCurrentMousePos({ x, y });
    }
  };
  
  const handleMouseUp = (e) => {
    // Handle mouse up if needed
  };
  
  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '500px',
        position: 'relative',
        backgroundColor: '#000',
        overflow: 'hidden'
      }}
    >
      {/* Calibration controls */}
      {activeTool === 'calibrate' && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 1000,
          fontSize: '12px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Калибровка</h4>
          <div style={{ marginBottom: '5px' }}>
            <label>Тип эталонного объекта:</label>
            <select
              value={calibrationType}
              onChange={(e) => setCalibrationType(e.target.value)}
              style={{ marginLeft: '5px', fontSize: '12px' }}
            >
              <option value="implant">Имплантат</option>
              <option value="crown">Коронка/брекет</option>
              <option value="distance">Межзубное расстояние</option>
              <option value="known_object">Известный объект</option>
            </select>
          </div>
          <div style={{ marginBottom: '5px' }}>
            <label>Размер объекта (мм):</label>
            <input
              type="number"
              min="1"
              max="100"
              step="0.1"
              value={calibrationObjectSize}
              onChange={(e) => setCalibrationObjectSize(parseFloat(e.target.value) || 0)}
              style={{ marginLeft: '5px', fontSize: '12px', width: '80px' }}
            />
          </div>
          <div style={{ marginBottom: '5px' }}>
            <p>Точек установлено: {calibrationPoints.point1 ? 1 : 0}{calibrationPoints.point2 ? ' + 1' : ''}</p>
            {calibrationDistance > 0 && (
              <p>Масштаб: {calibrationDistance.toFixed(4)} пикселей/мм</p>
            )}
          </div>
          <div style={{ fontSize: '11px', color: '#ccc' }}>
            Установите первую точку на одном конце эталонного объекта, затем вторую точку на другом конце
          </div>
          <button
            onClick={() => {
              setCalibrationPoints({ point1: null, point2: null });
              setCalibrationDistance(0);
            }}
            style={{
              marginTop: '5px',
              padding: '3px 6px',
              fontSize: '11px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Сбросить калибровку
          </button>
        </div>
      )}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: '0 0',
          cursor: activeTool === 'ruler' || activeTool === 'protractor' ? 'crosshair' :
                  activeTool === 'annotate' ? 'pointer' : 'default',
          imageRendering: 'pixelated'
        }}
      />
      {dicomData && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          color: 'white',
          fontSize: '12px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '5px'
        }}>
          Размер: {dicomData.columns}×{dicomData.rows} | Битность: {dicomData.bitsAllocated}
        </div>
      )}
      {!dicomData && dataUrl && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          color: 'white',
          fontSize: '14px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '5px'
        }}>
          Загрузка...
        </div>
      )}
    </div>
  );
};

export default VTKViewer;