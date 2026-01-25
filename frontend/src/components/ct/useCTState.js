import { useState, useRef } from 'react';

export const useCTState = () => {
  const [ctData, setCtData] = useState({
    patientId: 1,
    patientName: 'Иванов Иван Иванович',
    scanDate: new Date().toISOString().split('T')[0],
    analysisDate: new Date().toISOString().split('T')[0],
    ctScan: null,
    selectedFile: null,
    uploadedFiles: [],
    availablePlanes: {},
    selectedPlane: null,
    filePlaneAssignments: {},
    showPlaneAssignment: false,
    storagePath: null,
    measurements: {
      rightClosedPositionX: 0,
      rightClosedPositionY: 0,
      rightOpenPositionX: 0,
      rightOpenPositionY: 0,
      leftClosedPositionX: 0,
      leftClosedPositionY: 0,
      leftOpenPositionX: 0,
      leftOpenPositionY: 0,
      toothWidthUpper: 0,
      toothWidthLower: 0,
      boneThicknessUpper: 0,
      boneThicknessLower: 0,
      molarInclinationUpper: 0,
      molarInclinationLower: 0,
      basalWidthUpper: 0,
      basalWidthLower: 0,
      basalWidthDeficit: 0,
      tonguePosition: 0,
      airwayVolume: 0,
      maxillaryWidth: 45.0,
      mandibularWidth: 42.0,
      anteriorMaxillaryHeight: 25.0,
      posteriorMaxillaryHeight: 30.0,
      anteriorMandibularHeight: 22.0,
      posteriorMandibularHeight: 28.0,
      maxillarySinusVolume: 15.0,
      nasalCavityVolume: 20.0,
      airwayVolumeTotal: 25.0,
      condyleHeight: 18.0,
      condyleWidth: 15.0,
      ramusWidth: 22.0,
      coronoidHeight: 35.0,
      gonialAngle: 125.0,
      mandibularLength: 100.0,
      bigonialWidth: 95.0,
      bicondylarWidth: 110.0,
      upperFacialHeight: 70.0,
      middleFacialHeight: 60.0,
      lowerFacialHeight: 50.0,
      facialIndex: 150.0,
      mandibularPlaneAngle: 32.0,
      yaxis: 60.0,
      sellaNasion: 88.0,
      nasionA: 85.0,
      nasionB: 78.5,
      aPointBPoint: 88.0,
    }
  });

  const [windowLevel, setWindowLevel] = useState({ window: 400, level: 40 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState('ruler');
  const [measurements, setMeasurements] = useState([]);
  const [annotations, setAnnotations] = useState({
    sagittal: [],
    coronal: [],
    axial: []
  });
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  return {
    ctData,
    setCtData,
    windowLevel,
    setWindowLevel,
    zoomLevel,
    setZoomLevel,
    panOffset,
    setPanOffset,
    activeTool,
    setActiveTool,
    measurements,
    setMeasurements,
    annotations,
    setAnnotations,
    error,
    setError,
    containerRef
  };
};
