import { useState, useRef } from 'react';

export const usePhotometryState = () => {
  // Main photometry data state
  const [photometryData, setPhotometryData] = useState({
    patientName: 'John Doe',
    analysisDate: new Date().toISOString().split('T')[0],
    images: {
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
    scale: 1,
    scaleMode: '10mm',
    scalePoints: { point0: null, point10: null },
    scalePoints30: { point0: null, point30: null },
    isSettingScale: false,
    projectionType: 'frontal',
    points: {},
    measurements: {},
    interpretation: {},
    calibrationType: 'implant',
    calibrationObjectSize: 10,
    calibrationPoints: { point1: null, point2: null },
    calibrationDistance: 0
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
  const [activeTool, setActiveTool] = useState('select');
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [selectedPointImage, setSelectedPointImage] = useState(null);
  const [nextPointToPlace, setNextPointToPlace] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFileLibrary, setShowFileLibrary] = useState(false);
  const [isMagnifierActive, setIsMagnifierActive] = useState(false);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
  const [magnifierZoom] = useState(2.0);

  // Save status
  const [saveStatus, setSaveStatus] = useState({
    isSaving: false,
    success: false,
    message: ''
  });

  // Refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pointsListRef = useRef(null);
  const imageInfoRef = useRef({ scale: 1, x: 0, y: 0, width: 0, height: 0 });

  return {
    photometryData,
    setPhotometryData,
    imagesUploaded,
    setImagesUploaded,
    showPlanes,
    setShowPlanes,
    showAngles,
    setShowAngles,
    activeTool,
    setActiveTool,
    selectedPoint,
    setSelectedPoint,
    selectedPointImage,
    setSelectedPointImage,
    nextPointToPlace,
    setNextPointToPlace,
    isDragging,
    setIsDragging,
    dragOffset,
    setDragOffset,
    reportData,
    setReportData,
    loading,
    setLoading,
    error,
    setError,
    showFileLibrary,
    setShowFileLibrary,
    isMagnifierActive,
    setIsMagnifierActive,
    magnifierPosition,
    setMagnifierPosition,
    magnifierZoom,
    saveStatus,
    setSaveStatus,
    canvasRef,
    containerRef,
    pointsListRef,
    imageInfoRef
  };
};