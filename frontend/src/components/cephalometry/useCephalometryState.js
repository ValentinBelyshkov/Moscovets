import { useState, useRef } from 'react';
import { INITIAL_CEPHALOMETRY_DATA } from './constants';

export const useCephalometryState = () => {
  const [cephalometryData, setCephalometryData] = useState(INITIAL_CEPHALOMETRY_DATA);
  const [imagesUploaded, setImagesUploaded] = useState(false);
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

  const [activeTool, setActiveTool] = useState('select'); // 'select', 'point', 'scale'
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
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showMedicalCardLink, setShowMedicalCardLink] = useState(false);
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pointsListRef = useRef(null);
  const imageInfoRef = useRef({ scale: 1, x: 0, y: 0, width: 0, height: 0 });

  return {
    cephalometryData, setCephalometryData,
    imagesUploaded, setImagesUploaded,
    showPlanes, setShowPlanes,
    showAngles, setShowAngles,
    activeTool, setActiveTool,
    selectedPoint, setSelectedPoint,
    selectedPointImage, setSelectedPointImage,
    nextPointToPlace, setNextPointToPlace,
    isDragging, setIsDragging,
    dragOffset, setDragOffset,
    reportData, setReportData,
    loading, setLoading,
    error, setError,
    showFileLibrary, setShowFileLibrary,
    isMagnifierActive, setIsMagnifierActive,
    magnifierPosition, setMagnifierPosition,
    magnifierZoom,
    saveSuccess, setSaveSuccess,
    showMedicalCardLink, setShowMedicalCardLink,
    canvasRef,
    containerRef,
    pointsListRef,
    imageInfoRef
  };
};
