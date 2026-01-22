import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
// Используем локальные сервисы вместо серверных
import localFileService from '../services/localFileService';
import localMedicalRecordService from '../services/localMedicalRecordService';
import { useData } from '../contexts/DataContext';
import FileLibrary from './FileLibrary';
import PhotoTypeSelection from './PhotoTypeSelection';
import './PhotometryModule.css';

// In a real application, you would import these libraries:
// import jsPDF from 'jspdf';
// import 'jspdf-autotable';
// import pptxgen from 'pptxgenjs';

const PhotometryModule = () => {
  // State for photometry data
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
      profileSmileRight: null,
      profileSmileLeft: null,
      profile45Right: null,
      profile45Left: null,
      intraoralFrontalClosed: null,
      intraoralFrontalOpen: null,
      intraoralRight90: null,
      intraoralRight45: null,
      intraoralLeft90: null,
      intraoralLeft45: null,
      intraoralUpper: null,
      intraoralLower: null
    },
    imageDimensions: { width: 0, height: 0 },
    scale: 1, // pixels per mm
    scaleMode: '10mm', // '10mm' or '30mm'
    calibrationType: 'known_object', // 'dicom', 'known_object', 'magnification'
    calibrationObjectSize: 10, // size in mm for known object calibration
    scalePoints: { point0: null, point10: null }, // For 10mm mode
    scalePoints30: { point0: null, point30: null }, // For 30mm mode
    isSettingScale: false, // Flag to indicate if we're in scale setting mode
    projectionType: 'frontal', // 'frontal', 'frontalSmile', 'frontalRetractorsClosed', 'frontalRetractorsOpen', 'profileRight', 'profileLeft', 'profileSmileRight', 'profileSmileLeft', 'profile45Right', 'profile45Left', 'intraoralFrontalClosed', 'intraoralFrontalOpen', 'intraoralRight90', 'intraoralRight45', 'intraoralLeft90', 'intraoralLeft45', 'intraoralUpper', 'intraoralLower'
    points: {},
    measurements: {},
    interpretation: {},
    // New calibration system based on Калибровка.docx
    calibration: {
      type: 'none', // 'dicom', 'known_object', 'magnification', 'none'
      dicomPixelSpacing: null, // DICOM pixel spacing in mm/pixel
      knownObject: {
        type: 'implant', // 'implant', 'crown', 'distance', 'bracket', 'marker'
        size: 10, // size in mm
        points: { point1: null, point2: null }
      },
      magnification: {
        factor: 1.0, // magnification factor (e.g., 1.1 for 10%)
        source: 'apparatus' // 'apparatus', 'passport', 'printed'
      },
      calibrationPoints: { point1: null, point2: null },
      pixelsPerMm: 0,
      isCalibrated: false
    }
  });
  
  // State to track if images are uploaded
  const [imagesUploaded, setImagesUploaded] = useState(false);
  
  // Visualization settings
  const [showPlanes, setShowPlanes] = useState({
    frontal: false,
    frontalSmile: false,
    frontalRetractorsClosed: false,
    frontalRetractorsOpen: false,
    profileRight: false,
    profileLeft: false,
    profileSmileRight: false,
    profileSmileLeft: false,
    profile45Right: false,
    profile45Left: false,
    intraoralFrontalClosed: false,
    intraoralFrontalOpen: false,
    intraoralRight90: false,
    intraoralRight45: false,
    intraoralLeft90: false,
    intraoralLeft45: false,
    intraoralUpper: false,
    intraoralLower: false
  });
  
  const [showAngles, setShowAngles] = useState({
    facialProfile: false,
    nasolabial: false
  });

  // UI state
  const [activeTool, setActiveTool] = useState('select'); // 'select', 'point', 'scale'
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [selectedPointImage, setSelectedPointImage] = useState(null); // New state for selected point image
  const [nextPointToPlace, setNextPointToPlace] = useState(null); // New state for next point to be placed
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // Калибровка по прямой (аналогично цефалометрии)
  const [isSettingScale, setIsSettingScale] = useState(false); // Флаг режима калибровки
  const [scaleMode, setScaleMode] = useState('10mm'); // '10mm' или '30mm'
  const [scalePoints, setScalePoints] = useState({ point0: null, point10: null }); // Для 10мм режима
  const [scalePoints30, setScalePoints30] = useState({ point0: null, point30: null }); // Для 30мм режима
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
    frontalSmile: [
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
      { id: 'oph', name: 'oph - Оphrion (точка на пересечении средней линии лица и касательной к надбровным дугам)' },
      { id: 'ch_L', name: 'ch_L - Commissura labiorum (угол рта слева)' },
      { id: 'ch_R', name: 'ch_R - Commissura labiorum (угол рта справа)' }
    ],
    frontalRetractorsClosed: [
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
      { id: 'oph', name: 'oph - Оphrion (точка на пересечении средней линии лица и касательной к надбровным дугам)' },
      { id: 'u1_tip', name: 'u1_tip - Верхушка центрального резца' },
      { id: 'l1_tip', name: 'l1_tip - Верхушка нижнего центрального резца' }
    ],
    frontalRetractorsOpen: [
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
      { id: 'oph', name: 'oph - Оphrion (точка на пересечении средней линии лица и касательной к надбровным дугам)' },
      { id: 'u1_tip', name: 'u1_tip - Верхушка центрального резца' },
      { id: 'l1_tip', name: 'l1_tip - Верхушка нижнего центрального резца' },
      { id: 'u6_mesiobuccal', name: 'u6_mesiobuccal - Медиально-щечная точка верхнего первого моляра' },
      { id: 'l6_mesiobuccal', name: 'l6_mesiobuccal - Медиально-щечная точка нижнего первого моляра' }
    ],
    profileRight: [
      { id: 'n', name: 'n - Nasion (наиболее глубокая точка между носом и лбом)' },
      { id: 'sn', name: 'sn - Subnasale (середина перехода перегородки носа к верхней губе)' },
      { id: 'pg', name: 'pg - Pogonion (наиболее выступающая точка подбородочного выступа)' },
      { id: 'pro', name: 'pro - Pronasale (кончик носа)' },
      { id: 'pog', name: 'pog - Pogonion (наиболее выступающая точка подбородка)' },
      { id: 'ls', name: 'ls - Labrale superius (наиболее выступающая точка верхней губы)' },
      { id: 'coll', name: 'coll - Точка для проведения касательной к нижнему краю носа' },
      { id: 'go_R', name: 'go_R - Точка угла нижней челюсти справа' },
      { id: 'me', name: 'me - Menton (нижняя точка подбородка)' }
    ],
    profileLeft: [
      { id: 'n', name: 'n - Nasion (наиболее глубокая точка между носом и лбом)' },
      { id: 'sn', name: 'sn - Subnasale (середина перехода перегородки носа к верхней губе)' },
      { id: 'pg', name: 'pg - Pogonion (наиболее выступающая точка подбородочного выступа)' },
      { id: 'pro', name: 'pro - Pronasale (кончик носа)' },
      { id: 'pog', name: 'pog - Pogonion (наиболее выступающая точка подбородка)' },
      { id: 'ls', name: 'ls - Labrale superius (наиболее выступающая точка верхней губы)' },
      { id: 'coll', name: 'coll - Точка для проведения касательной к нижнему краю носа' },
      { id: 'go_L', name: 'go_L - Точка угла нижней челюсти слева' },
      { id: 'me', name: 'me - Menton (нижняя точка подбородка)' }
    ],
    profileSmileRight: [
      { id: 'n', name: 'n - Nasion (наиболее глубокая точка между носом и лбом)' },
      { id: 'sn', name: 'sn - Subnasale (середина перехода перегородки носа к верхней губе)' },
      { id: 'pg', name: 'pg - Pogonion (наиболее выступающая точка подбородочного выступа)' },
      { id: 'pro', name: 'pro - Pronasale (кончик носа)' },
      { id: 'pog', name: 'pog - Pogonion (наиболее выступающая точка подбородка)' },
      { id: 'ls', name: 'ls - Labrale superius (наиболее выступающая точка верхней губы)' },
      { id: 'coll', name: 'coll - Точка для проведения касательной к нижнему краю носа' },
      { id: 'ch_R', name: 'ch_R - Commissura labiorum (угол рта справа)' },
      { id: 'go_R', name: 'go_R - Точка угла нижней челюсти справа' }
    ],
    profileSmileLeft: [
      { id: 'n', name: 'n - Nasion (наиболее глубокая точка между носом и лбом)' },
      { id: 'sn', name: 'sn - Subnasale (середина перехода перегородки носа к верхней губе)' },
      { id: 'pg', name: 'pg - Pogonion (наиболее выступающая точка подбородочного выступа)' },
      { id: 'pro', name: 'pro - Pronasale (кончик носа)' },
      { id: 'pog', name: 'pog - Pogonion (наиболее выступающая точка подбородка)' },
      { id: 'ls', name: 'ls - Labrale superius (наиболее выступающая точка верхней губы)' },
      { id: 'coll', name: 'coll - Точка для проведения касательной к нижнему краю носа' },
      { id: 'ch_L', name: 'ch_L - Commissura labiorum (угол рта слева)' },
      { id: 'go_L', name: 'go_L - Точка угла нижней челюсти слева' }
    ],
    profile45Right: [
      { id: 'n', name: 'n - Nasion (наиболее глубокая точка между носом и лбом)' },
      { id: 'sn', name: 'sn - Subnasale (середина перехода перегородки носа к верхней губе)' },
      { id: 'pg', name: 'pg - Pogonion (наиболее выступающая точка подбородочного выступа)' },
      { id: 'zy_R', name: 'zy_R - Наиболее выступающая кнаружи точка скуловой дуги справа' },
      { id: 'go_R', name: 'go_R - Точка угла нижней челюсти справа' },
      { id: 'pro', name: 'pro - Pronasale (кончик носа)' },
      { id: 'ls', name: 'ls - Labrale superius (наиболее выступающая точка верхней губы)' }
    ],
    profile45Left: [
      { id: 'n', name: 'n - Nasion (наиболее глубокая точка между носом и лбом)' },
      { id: 'sn', name: 'sn - Subnasale (середина перехода перегородки носа к верхней губе)' },
      { id: 'pg', name: 'pg - Pogonion (наиболее выступающая точка подбородочного выступа)' },
      { id: 'zy_L', name: 'zy_L - Наиболее выступающая кнаружи точка скуловой дуги слева' },
      { id: 'go_L', name: 'go_L - Точка угла нижней челюсти слева' },
      { id: 'pro', name: 'pro - Pronasale (кончик носа)' },
      { id: 'ls', name: 'ls - Labrale superius (наиболее выступающая точка верхней губы)' }
    ],
    intraoralFrontalClosed: [
      { id: 'midline_upper', name: 'midline_upper - Средняя линия верхней челюсти' },
      { id: 'midline_lower', name: 'midline_lower - Средняя линия нижней челюсти' },
      { id: 'canine_R', name: 'canine_R - Клык справа' },
      { id: 'canine_L', name: 'canine_L - Клык слева' },
      { id: 'u1_R', name: 'u1_R - Центральный резец справа' },
      { id: 'u1_L', name: 'u1_L - Центральный резец слева' },
      { id: 'u2_R', name: 'u2_R - Боковой резец справа' },
      { id: 'u2_L', name: 'u2_L - Боковой резец слева' }
    ],
    intraoralFrontalOpen: [
      { id: 'midline_upper', name: 'midline_upper - Средняя линия верхней челюсти' },
      { id: 'midline_lower', name: 'midline_lower - Средняя линия нижней челюсти' },
      { id: 'canine_R', name: 'canine_R - Клык справа' },
      { id: 'canine_L', name: 'canine_L - Клык слева' },
      { id: 'u1_R', name: 'u1_R - Центральный резец справа' },
      { id: 'u1_L', name: 'u1_L - Центральный резец слева' },
      { id: 'u2_R', name: 'u2_R - Боковой резец справа' },
      { id: 'u2_L', name: 'u2_L - Боковой резец слева' },
      { id: 'l1_R', name: 'l1_R - Нижний центральный резец справа' },
      { id: 'l1_L', name: 'l1_L - Нижний центральный резец слева' },
      { id: 'l2_R', name: 'l2_R - Нижний боковой резец справа' },
      { id: 'l2_L', name: 'l2_L - Нижний боковой резец слева' }
    ],
    intraoralRight90: [
      { id: 'midline_upper', name: 'midline_upper - Средняя линия верхней челюсти' },
      { id: 'midline_lower', name: 'midline_lower - Средняя линия нижней челюсти' },
      { id: 'canine_R', name: 'canine_R - Клык справа' },
      { id: 'canine_L', name: 'canine_L - Клык слева' },
      { id: 'u6_mesiobuccal', name: 'u6_mesiobuccal - Медиально-щечная точка верхнего первого моляра' },
      { id: 'u7_mesiobuccal', name: 'u7_mesiobuccal - Медиально-щечная точка верхнего второго моляра' },
      { id: 'l6_mesiobuccal', name: 'l6_mesiobuccal - Медиально-щечная точка нижнего первого моляра' },
      { id: 'l7_mesiobuccal', name: 'l7_mesiobuccal - Медиально-щечная точка нижнего второго моляра' }
    ],
    intraoralRight45: [
      { id: 'midline_upper', name: 'midline_upper - Средняя линия верхней челюсти' },
      { id: 'midline_lower', name: 'midline_lower - Средняя линия нижней челюсти' },
      { id: 'canine_R', name: 'canine_R - Клык справа' },
      { id: 'canine_L', name: 'canine_L - Клык слева' },
      { id: 'u5_distobuccal', name: 'u5_distobuccal - Дистально-щечная точка верхнего первого премоляра' },
      { id: 'u6_mesiobuccal', name: 'u6_mesiobuccal - Медиально-щечная точка верхнего первого моляра' },
      { id: 'l5_distobuccal', name: 'l5_distobuccal - Дистально-щечная точка нижнего первого премоляра' },
      { id: 'l6_mesiobuccal', name: 'l6_mesiobuccal - Медиально-щечная точка нижнего первого моляра' }
    ],
    intraoralLeft90: [
      { id: 'midline_upper', name: 'midline_upper - Средняя линия верхней челюсти' },
      { id: 'midline_lower', name: 'midline_lower - Средняя линия нижней челюсти' },
      { id: 'canine_R', name: 'canine_R - Клык справа' },
      { id: 'canine_L', name: 'canine_L - Клык слева' },
      { id: 'u6_mesiobuccal', name: 'u6_mesiobuccal - Медиально-щечная точка верхнего первого моляра слева' },
      { id: 'u7_mesiobuccal', name: 'u7_mesiobuccal - Медиально-щечная точка верхнего второго моляра слева' },
      { id: 'l6_mesiobuccal', name: 'l6_mesiobuccal - Медиально-щечная точка нижнего первого моляра слева' },
      { id: 'l7_mesiobuccal', name: 'l7_mesiobuccal - Медиально-щечная точка нижнего второго моляра слева' }
    ],
    intraoralLeft45: [
      { id: 'midline_upper', name: 'midline_upper - Средняя линия верхней челюсти' },
      { id: 'midline_lower', name: 'midline_lower - Средняя линия нижней челюсти' },
      { id: 'canine_R', name: 'canine_R - Клык справа' },
      { id: 'canine_L', name: 'canine_L - Клык слева' },
      { id: 'u5_distobuccal', name: 'u5_distobuccal - Дистально-щечная точка верхнего первого премоляра слева' },
      { id: 'u6_mesiobuccal', name: 'u6_mesiobuccal - Медиально-щечная точка верхнего первого моляра слева' },
      { id: 'l5_distobuccal', name: 'l5_distobuccal - Дистально-щечная точка нижнего первого премоляра слева' },
      { id: 'l6_mesiobuccal', name: 'l6_mesiobuccal - Медиально-щечная точка нижнего первого моляра слева' }
    ],
    intraoralUpper: [
      { id: 'midline_upper', name: 'midline_upper - Средняя линия верхней челюсти' },
      { id: 'canine_R', name: 'canine_R - Клык справа' },
      { id: 'canine_L', name: 'canine_L - Клык слева' },
      { id: 'u1_R', name: 'u1_R - Центральный резец справа' },
      { id: 'u1_L', name: 'u1_L - Центральный резец слева' },
      { id: 'u6_mesiobuccal', name: 'u6_mesiobuccal - Медиально-щечная точка верхнего первого моляра справа' },
      { id: 'u6_mesiobuccal_L', name: 'u6_mesiobuccal_L - Медиально-щечная точка верхнего первого моляра слева' }
    ],
    intraoralLower: [
      { id: 'midline_lower', name: 'midline_lower - Средняя линия нижней челюсти' },
      { id: 'canine_R', name: 'canine_R - Клык справа' },
      { id: 'canine_L', name: 'canine_L - Клык слева' },
      { id: 'l1_R', name: 'l1_R - Нижний центральный резец справа' },
      { id: 'l1_L', name: 'l1_L - Нижний центральный резец слева' },
      { id: 'l6_mesiobuccal', name: 'l6_mesiobuccal - Медиально-щечная точка нижнего первого моляра справа' },
      { id: 'l6_mesiobuccal_L', name: 'l6_mesiobuccal_L - Медиально-щечная точка нижнего первого моляра слева' }
    ]
  }), []);

  // Load image from local storage
  const handleLoadImageFromDatabase = async (fileId) => {
    try {
      setLoading(true);
      const response = await localFileService.downloadFile(fileId);
      
      console.log('PhotometryNew load image response:', response);
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
      
      console.log('PhotometryNew creating object URL with blob:', blob);
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
    if (!photometryData.images[photometryData.projectionType] || !imagesUploaded) return;
    
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
      
      // Если активирован режим калибровки, обрабатываем установку точек
      if (activeTool === 'scale' && isSettingScale) {
        handleScalePointSet({ x: originalX, y: originalY });
        return;
      }
      
      if (activeTool === 'point') {
        // Check if calibration is set before allowing point placement
        const isCalibrated = photometryData.calibration.isCalibrated || photometryData.scale > 1;
        if (!isCalibrated) {
          alert('Пожалуйста, сначала выполните калибровку перед расстановкой точек.');
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
      } else if (activeTool === 'select' && imagesUploaded) {
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
      } else if (activeTool === 'calibrate') {
        // Handle calibration point setting
        handleCalibrationPointSet({ x: originalX, y: originalY });
      }
    }
  };

  // Handle right-click context menu to delete the last point
  const handleCanvasContextMenu = (e) => {
    // Prevent default context menu
    e.preventDefault();
    
    // Check if we're in point placement mode and have at least one point
    if (activeTool === 'point' && photometryData.images[photometryData.projectionType] && imagesUploaded) {
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
    if (!photometryData.images[photometryData.projectionType] || !imagesUploaded) return;
    
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
    if (!photometryData.images[photometryData.projectionType] || !imagesUploaded) return;
    
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
    if (e.button === 1 && photometryData.images[photometryData.projectionType] && imagesUploaded) {
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

  // Calculate distance between two points in mm
  const calculateDistanceInMm = (point1, point2) => {
    if (!point1 || !point2) return 0;
    
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    
    // Use calibration data if available
    if (photometryData.calibration.isCalibrated && photometryData.calibration.pixelsPerMm > 0) {
      return pixelDistance / photometryData.calibration.pixelsPerMm;
    }
    
    // Fallback to old scale system
    return photometryData.scale > 0 ? pixelDistance / photometryData.scale : pixelDistance;
  };

  // Функции калибровки по прямой (аналогично цефалометрии)
  const handleScalePointSet = (point) => {
    if (scaleMode === '10mm') {
      if (!scalePoints.point0) {
        // Устанавливаем первую точку
        setScalePoints(prev => ({ ...prev, point0: point }));
        alert('Первая точка установлена. Установите вторую точку на расстоянии 10 мм от первой.');
      } else if (!scalePoints.point10) {
        // Устанавливаем вторую точку и рассчитываем масштаб
        setScalePoints(prev => ({ ...prev, point10: point }));
        
        // Рассчитываем расстояние в пикселях
        const dx = point.x - scalePoints.point0.x;
        const dy = point.y - scalePoints.point0.y;
        const pixelDistance = Math.sqrt(dx * dx + dy * dy);
        
        // Рассчитываем масштаб (пикселей на мм)
        const pixelsPerMm = pixelDistance / 10; // 10 мм
        
        setPhotometryData(prev => ({
          ...prev,
          scale: pixelsPerMm,
          calibration: {
            ...prev.calibration,
            type: 'known_object',
            knownObject: {
              type: 'distance',
              size: 10,
              points: { point1: scalePoints.point0, point2: point }
            },
            pixelsPerMm: pixelsPerMm,
            isCalibrated: true
          }
        }));
        
        setIsSettingScale(false);
        alert(`Калибровка завершена!\nПикселей на мм: ${pixelsPerMm.toFixed(4)}\nРасстояние: 10 мм`);
      }
    } else { // 30mm mode
      if (!scalePoints30.point0) {
        // Устанавливаем первую точку
        setScalePoints30(prev => ({ ...prev, point0: point }));
        alert('Первая точка установлена. Установите вторую точку на расстоянии 30 мм от первой.');
      } else if (!scalePoints30.point30) {
        // Устанавливаем вторую точку и рассчитываем масштаб
        setScalePoints30(prev => ({ ...prev, point30: point }));
        
        // Рассчитываем расстояние в пикселях
        const dx = point.x - scalePoints30.point0.x;
        const dy = point.y - scalePoints30.point0.y;
        const pixelDistance = Math.sqrt(dx * dx + dy * dy);
        
        // Рассчитываем масштаб (пикселей на мм)
        const pixelsPerMm = pixelDistance / 30; // 30 мм
        
        setPhotometryData(prev => ({
          ...prev,
          scale: pixelsPerMm,
          calibration: {
            ...prev.calibration,
            type: 'known_object',
            knownObject: {
              type: 'distance',
              size: 30,
              points: { point1: scalePoints30.point0, point2: point }
            },
            pixelsPerMm: pixelsPerMm,
            isCalibrated: true
          }
        }));
        
        setIsSettingScale(false);
        alert(`Калибровка завершена!\nПикселей на мм: ${pixelsPerMm.toFixed(4)}\nРасстояние: 30 мм`);
      }
    }
  };

  // Функция для сброса калибровки
  const resetScaleCalibration = () => {
    setScalePoints({ point0: null, point10: null });
    setScalePoints30({ point0: null, point30: null });
    setPhotometryData(prev => ({
      ...prev,
      scale: 1,
      calibration: {
        ...prev.calibration,
        type: 'none',
        pixelsPerMm: 0,
        isCalibrated: false
      }
    }));
    setIsSettingScale(false);
    alert('Калибровка сброшена');
  };

  // New calibration functions based on Калибровка.docx
  const handleDICOMCalibration = (pixelSpacing) => {
    if (!pixelSpacing || !pixelSpacing.row || !pixelSpacing.column) {
      alert('Недостаточно данных для DICOM-калибровки. Используйте альтернативный метод калибровки.');
      return false;
    }
    
    // For DICOM, pixel spacing is already in mm/pixel
    const avgPixelSpacing = (pixelSpacing.row + pixelSpacing.column) / 2;
    const pixelsPerMm = 1 / avgPixelSpacing;
    
    setPhotometryData(prev => ({
      ...prev,
      calibration: {
        ...prev.calibration,
        type: 'dicom',
        dicomPixelSpacing: pixelSpacing,
        pixelsPerMm: pixelsPerMm,
        isCalibrated: true
      },
      scale: pixelsPerMm
    }));
    
    alert(`DICOM-калибровка завершена!\nПикселей на мм: ${pixelsPerMm.toFixed(4)}\nРазмер пикселя: ${avgPixelSpacing.toFixed(4)} мм`);
    return true;
  };

  const handleKnownObjectCalibration = (objectType, objectSize, point1, point2) => {
    if (!point1 || !point2) {
      alert('Необходимо установить две точки для калибровки.');
      return false;
    }
    
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    const pixelsPerMm = pixelDistance / objectSize;
    
    setPhotometryData(prev => ({
      ...prev,
      calibration: {
        ...prev.calibration,
        type: 'known_object',
        knownObject: {
          type: objectType,
          size: objectSize,
          points: { point1, point2 }
        },
        pixelsPerMm: pixelsPerMm,
        isCalibrated: true
      },
      scale: pixelsPerMm
    }));
    
    alert(`Калибровка по известному объекту завершена!\nТип: ${objectType}\nРазмер: ${objectSize} мм\nПикселей на мм: ${pixelsPerMm.toFixed(4)}`);
    return true;
  };


  // Function to handle calibration point setting from canvas
  const handleCalibrationPointSet = (point) => {
    const currentType = photometryData.calibration.type;
    
    if (currentType === 'known_object') {
      const currentPoints = photometryData.calibration.knownObject.points;
      
      if (!currentPoints.point1) {
        // Set first point
        setPhotometryData(prev => ({
          ...prev,
          calibration: {
            ...prev.calibration,
            knownObject: {
              ...prev.calibration.knownObject,
              points: {
                ...prev.calibration.knownObject.points,
                point1: point
              }
            }
          }
        }));
        
        alert('Первая точка установлена. Установите вторую точку на противоположном конце эталонного объекта.');
      } else if (!currentPoints.point2) {
        // Set second point and complete calibration
        handleKnownObjectCalibration(
          photometryData.calibration.knownObject.type,
          photometryData.calibration.knownObject.size,
          currentPoints.point1,
          point
        );
      }
    }
  };

  const handleMagnificationCalibration = (magnificationFactor) => {
    if (magnificationFactor <= 0 || magnificationFactor > 2) {
      alert('Некорректный коэффициент увеличения. Должен быть в диапазоне 0.1-2.0.');
      return false;
    }
    
    setPhotometryData(prev => ({
      ...prev,
      calibration: {
        ...prev.calibration,
        type: 'magnification',
        magnification: {
          factor: magnificationFactor,
          source: 'apparatus'
        },
        isCalibrated: true
      }
    }));
    
    alert(`Калибровка по увеличению аппарата завершена!\nКоэффициент увеличения: ${magnificationFactor}`);
    return true;
  };

  const resetCalibration = () => {
    setPhotometryData(prev => ({
      ...prev,
      calibration: {
        type: 'none',
        dicomPixelSpacing: null,
        knownObject: {
          type: 'implant',
          size: 10,
          points: { point1: null, point2: null }
        },
        magnification: {
          factor: 1.0,
          source: 'apparatus'
        },
        calibrationPoints: { point1: null, point2: null },
        pixelsPerMm: 0,
        isCalibrated: false
      },
      scale: 1,
      scalePoints: { point0: null, point10: null },
      scalePoints30: { point0: null, point30: null }
    }));
    
    alert('Калибровка сброшена');
  };

  // Calculate measurements
  const calculateMeasurements = () => {
    const measurements = {};
    const points = photometryData.points;
    
    // Calculate standard photometric measurements based on projection type
    if (photometryData.projectionType === 'frontal') {
      // Width measurements
      if (points['eu_L'] && points['eu_R']) {
        const euEuValue = calculateDistanceInMm(points['eu_L'], points['eu_R']);
        let euEuInterpretation = '';
        if (euEuValue < 130) {
          euEuInterpretation = 'Узкая голова';
        } else if (euEuValue > 160) {
          euEuInterpretation = 'Широкая голова';
        } else {
          euEuInterpretation = 'Норма';
        }
        
        measurements.euEu = {
          name: 'Ширина головы (eu—eu)',
          value: euEuValue,
          unit: 'mm',
          interpretation: euEuInterpretation,
          norm: '130-160mm'
        };
      }
      
      if (points['zy_L'] && points['zy_R']) {
        const zyZyValue = calculateDistanceInMm(points['zy_L'], points['zy_R']);
        let zyZyInterpretation = '';
        if (zyZyValue < 120) {
          zyZyInterpretation = 'Узкое лицо';
        } else if (zyZyValue > 150) {
          zyZyInterpretation = 'Широкое лицо';
        } else {
          zyZyInterpretation = 'Норма';
        }
        
        measurements.zyZy = {
          name: 'Морфологическая ширина лица (zy—zy)',
          value: zyZyValue,
          unit: 'mm',
          interpretation: zyZyInterpretation,
          norm: '120-150mm'
        };
      }
      
      if (points['go_L'] && points['go_R']) {
        const goGoValue = calculateDistanceInMm(points['go_L'], points['go_R']);
        let goGoInterpretation = '';
        if (goGoValue < 90) {
          goGoInterpretation = 'Узкий нижний отдел лица';
        } else if (goGoValue > 120) {
          goGoInterpretation = 'Широкий нижний отдел лица';
        } else {
          goGoInterpretation = 'Норма';
        }
        
        measurements.goGo = {
          name: 'Гониальная ширина лица (go—go)',
          value: goGoValue,
          unit: 'mm',
          interpretation: goGoInterpretation,
          norm: '90-120mm'
        };
      }
      
      // Height measurements
      if (points['oph'] && points['gn']) {
        const ophGnValue = calculateDistanceInMm(points['oph'], points['gn']);
        let ophGnInterpretation = '';
        if (ophGnValue < 110) {
          ophGnInterpretation = 'Короткое лицо';
        } else if (ophGnValue > 140) {
          ophGnInterpretation = 'Длинное лицо';
        } else {
          ophGnInterpretation = 'Норма';
        }
        
        measurements.ophGn = {
          name: 'Полная морфологическая высота лица (oph—gn)',
          value: ophGnValue,
          unit: 'mm',
          interpretation: ophGnInterpretation,
          norm: '110-140mm'
        };
      }
      
      if (points['oph'] && points['sn']) {
        const ophSnValue = calculateDistanceInMm(points['oph'], points['sn']);
        let ophSnInterpretation = '';
        if (ophSnValue < 50) {
          ophSnInterpretation = 'Короткий верхний отдел лица';
        } else if (ophSnValue > 70) {
          ophSnInterpretation = 'Длинный верхний отдел лица';
        } else {
          ophSnInterpretation = 'Норма';
        }
        
        measurements.ophSn = {
          name: 'Средняя морфологическая высота лица (oph—sn)',
          value: ophSnValue,
          unit: 'mm',
          interpretation: ophSnInterpretation,
          norm: '50-70mm'
        };
      }
      
      if (points['sn'] && points['gn']) {
        const snGnValue = calculateDistanceInMm(points['sn'], points['gn']);
        let snGnInterpretation = '';
        if (snGnValue < 60) {
          snGnInterpretation = 'Короткий нижний отдел лица';
        } else if (snGnValue > 80) {
          snGnInterpretation = 'Длинный нижний отдел лица';
        } else {
          snGnInterpretation = 'Норма';
        }
        
        measurements.snGn = {
          name: 'Нижняя морфологическая высота лица (sn—gn)',
          value: snGnValue,
          unit: 'mm',
          interpretation: snGnInterpretation,
          norm: '60-80mm'
        };
      }
      
      // Indices
      if (points['zy_L'] && points['zy_R'] && points['oph'] && points['gn']) {
        const zyZy = calculateDistanceInMm(points['zy_L'], points['zy_R']);
        const ophGn = calculateDistanceInMm(points['oph'], points['gn']);
        const headFormIndex = (zyZy / ophGn) * 100;
        let headFormInterpretation = '';
        if (headFormIndex < 75.9) {
          headFormInterpretation = 'Долихоцефалическая форма головы';
        } else if (headFormIndex > 85.4) {
          headFormInterpretation = 'Брахицефалическая форма головы';
        } else {
          headFormInterpretation = 'Мезоцефалическая форма головы';
        }
        
        measurements.headFormIndex = {
          name: 'Индекс формы головы',
          value: headFormIndex,
          unit: '%',
          interpretation: headFormInterpretation,
          norm: '76.0-85.4%'
        };
      }
      
      if (points['zy_L'] && points['zy_R'] && points['oph'] && points['gn']) {
        const zyZy = calculateDistanceInMm(points['zy_L'], points['zy_R']);
        const ophGn = calculateDistanceInMm(points['oph'], points['gn']);
        const izaraIndex = (ophGn * 100) / zyZy;
        let izaraInterpretation = '';
        if (izaraIndex >= 104) {
          izaraInterpretation = 'Узкое лицо';
        } else if (izaraIndex <= 96) {
          izaraInterpretation = 'Широкое лицо';
        } else {
          izaraInterpretation = 'Среднее лицо';
        }
        
        measurements.izaraIndex = {
          name: 'Индекс Изара',
          value: izaraIndex,
          unit: '%',
          interpretation: izaraInterpretation,
          norm: '97-103%'
        };
      }
    } else if (photometryData.projectionType === 'profile') {
      // Profile angle measurements
      if (points['n'] && points['sn'] && points['pg']) {
        const profileAngleValue = calculateAngle(points['n'], points['sn'], points['pg']);
        let profileInterpretation = '';
        if (profileAngleValue < 165) {
          profileInterpretation = 'Выпуклый (дистальный) профиль';
        } else if (profileAngleValue > 175) {
          profileInterpretation = 'Вогнутый (мезиальный) профиль';
        } else {
          profileInterpretation = 'Прямой профиль';
        }
        
        measurements.profileAngle = {
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
          nasolabialInterpretation = 'Протрузионный';
        } else if (nasolabialAngleValue > 110) {
          nasolabialInterpretation = 'Ретрузионный';
        } else {
          nasolabialInterpretation = 'Нормальный';
        }
        
        measurements.nasolabialAngle = {
          name: 'Носогубный угол (sn-ls-coll)',
          value: nasolabialAngleValue,
          unit: '°',
          interpretation: nasolabialInterpretation,
          norm: '100-110°'
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
      if (measurement.interpretation && measurement.interpretation !== 'Норма' && 
          measurement.interpretation !== 'Мезоцефалическая форма головы' &&
          measurement.interpretation !== 'Среднее лицо' &&
          measurement.interpretation !== 'Прямой профиль' &&
          measurement.interpretation !== 'Нормальный') {
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
    if (activeTool === 'point' && photometryData.images[photometryData.projectionType] && imagesUploaded) {
      // Check if calibration is set
      const isCalibrated = photometryData.calibration.isCalibrated || photometryData.scale > 1;
      if (isCalibrated) {
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
  }, [activeTool, photometryData, photometryData.points, photometryData.projectionType, photometryData.scale, photometryData.calibration.isCalibrated, pointDefinitions, imagesUploaded]);
   
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
      if (photometryData.images[photometryData.projectionType] && imagesUploaded) {
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
  }, [photometryData.images, photometryData.projectionType, imagesUploaded]);
  
  // Handle projection type change
  useEffect(() => {
    // Reinitialize image info when projection type changes
    if (photometryData.images[photometryData.projectionType] && imagesUploaded) {
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
  }, [photometryData.projectionType, photometryData.images, imagesUploaded]);
  
  // Function to draw all elements on a canvas context (used for both main canvas and magnifier)
  const drawAllElements = useCallback((ctx, img, canvasWidth, canvasHeight, imageX, imageY, scaledImgWidth, scaledImgHeight, scale) => {
    // Draw image
    ctx.drawImage(img, imageX, imageY, scaledImgWidth, scaledImgHeight);
    
    // Draw calibration points if in scale setting mode
    if (isSettingScale) {
      // Draw first point (point0)
      if (scaleMode === '10mm' && scalePoints.point0) {
        const x = imageX + scalePoints.point0.x * scale;
        const y = imageY + scalePoints.point0.y * scale;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff0000';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Label the point
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText('0', x + 8, y - 8);
        ctx.fillText('0', x + 8, y - 8);
      } else if (scaleMode === '30mm' && scalePoints30.point0) {
        const x = imageX + scalePoints30.point0.x * scale;
        const y = imageY + scalePoints30.point0.y * scale;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff0000';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Label the point
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText('0', x + 8, y - 8);
        ctx.fillText('0', x + 8, y - 8);
      }
      
      // Draw second point (point10 or point30)
      if (scaleMode === '10mm' && scalePoints.point10) {
        const x = imageX + scalePoints.point10.x * scale;
        const y = imageY + scalePoints.point10.y * scale;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#00ff00';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Label the point
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText('10', x + 8, y - 8);
        ctx.fillText('10', x + 8, y - 8);
        
        // Draw line between points
        if (scalePoints.point0) {
          const x1 = imageX + scalePoints.point0.x * scale;
          const y1 = imageY + scalePoints.point0.y * scale;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x, y);
          ctx.strokeStyle = '#ffff00';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      } else if (scaleMode === '30mm' && scalePoints30.point30) {
        const x = imageX + scalePoints30.point30.x * scale;
        const y = imageY + scalePoints30.point30.y * scale;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#00ff00';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Label the point
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText('30', x + 8, y - 8);
        ctx.fillText('30', x + 8, y - 8);
        
        // Draw line between points
        if (scalePoints30.point0) {
          const x1 = imageX + scalePoints30.point0.x * scale;
          const y1 = imageY + scalePoints30.point0.y * scale;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x, y);
          ctx.strokeStyle = '#ffff00';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }
    
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
      
      // Draw lines for frontal projection
      if (showPlanes.frontal && points['n'] && points['gn']) {
        drawLine('n', 'gn', '#0000ff', 2);
      }
      if (showPlanes.frontalSmile && points['zy_L'] && points['zy_R']) {
        drawLine('zy_L', 'zy_R', '#0000ff', 2);
      }
      if (showPlanes.frontalRetractorsClosed && points['go_L'] && points['go_R']) {
        drawLine('go_L', 'go_R', '#0000ff', 2);
      }
      if (showPlanes.frontalRetractorsOpen && points['oph'] && points['sn']) {
        drawLine('oph', 'sn', '#0000ff', 2);
      }
    } else if (photometryData.projectionType === 'frontalSmile') {
      // Draw lines for frontal smile analysis
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
      
      // Draw lines for frontal smile projection
      if (showPlanes.frontalSmile && points['ch_L'] && points['ch_R']) {
        drawLine('ch_L', 'ch_R', '#0000ff', 2);
      }
      if (showPlanes.frontalSmile && points['zy_L'] && points['zy_R']) {
        drawLine('zy_L', 'zy_R', '#0000ff', 2);
      }
    } else if (photometryData.projectionType === 'frontalRetractorsClosed') {
      // Draw lines for frontal retractors closed analysis
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
      
      // Draw lines for frontal retractors closed projection
      if (showPlanes.frontalRetractorsClosed && points['u1_tip'] && points['l1_tip']) {
        drawLine('u1_tip', 'l1_tip', '#0000ff', 2);
      }
      if (showPlanes.frontalRetractorsClosed && points['zy_L'] && points['zy_R']) {
        drawLine('zy_L', 'zy_R', '#0000ff', 2);
      }
    } else if (photometryData.projectionType === 'frontalRetractorsOpen') {
      // Draw lines for frontal retractors open analysis
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
      
      // Draw lines for frontal retractors open projection
      if (showPlanes.frontalRetractorsOpen && points['u1_tip'] && points['l1_tip']) {
        drawLine('u1_tip', 'l1_tip', '#0000ff', 2);
      }
      if (showPlanes.frontalRetractorsOpen && points['u6_mesiobuccal'] && points['l6_mesiobuccal']) {
        drawLine('u6_mesiobuccal', 'l6_mesiobuccal', '#0000ff', 2);
      }
    } else if (photometryData.projectionType === 'profileRight' || photometryData.projectionType === 'profileLeft') {
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
      
      // Draw lines for profile projection
      if (showPlanes.profileRight && points['pro'] && points['pog']) {
        drawLine('pro', 'pog', '#0000ff', 2);
      }
      if (showPlanes.profileLeft && points['coll'] && points['sn']) {
        drawLine('coll', 'sn', '#0000ff', 2);
      }
      if (showPlanes.profileRight && points['n'] && points['pg']) {
        drawLine('n', 'pg', '#0000ff', 2);
      }
      if (showPlanes.profileLeft && points['go_L'] && points['me']) {
        drawLine('go_L', 'me', '#0000ff', 2);
      }
    } else if (photometryData.projectionType === 'profileSmileRight' || photometryData.projectionType === 'profileSmileLeft') {
      // Draw lines for profile smile analysis
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
      
      // Draw lines for profile smile projection
      if (showPlanes.profileSmileRight && points['ch_R'] && points['ls']) {
        drawLine('ch_R', 'ls', '#0000ff', 2);
      }
      if (showPlanes.profileSmileLeft && points['ch_L'] && points['ls']) {
        drawLine('ch_L', 'ls', '#0000ff', 2);
      }
      if (showPlanes.profileSmileRight && points['pro'] && points['pog']) {
        drawLine('pro', 'pog', '#0000ff', 2);
      }
      if (showPlanes.profileSmileLeft && points['n'] && points['pg']) {
        drawLine('n', 'pg', '#0000ff', 2);
      }
    } else if (photometryData.projectionType === 'profile45Right' || photometryData.projectionType === 'profile45Left') {
      // Draw lines for profile 45° analysis
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
      
      // Draw lines for profile 45° projection
      if (showPlanes.profile45Right && points['zy_R'] && points['go_R']) {
        drawLine('zy_R', 'go_R', '#0000ff', 2);
      }
      if (showPlanes.profile45Left && points['zy_L'] && points['go_L']) {
        drawLine('zy_L', 'go_L', '#0000ff', 2);
      }
      if (showPlanes.profile45Right && points['pro'] && points['ls']) {
        drawLine('pro', 'ls', '#0000ff', 2);
      }
      if (showPlanes.profile45Left && points['n'] && points['pg']) {
        drawLine('n', 'pg', '#0000ff', 2);
      }
    } else if (photometryData.projectionType === 'intraoralFrontalClosed') {
      // Draw lines for intraoral frontal closed analysis
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
      
      // Draw lines for intraoral frontal closed projection
      if (showPlanes.intraoralFrontalClosed && points['midline_upper'] && points['midline_lower']) {
        drawLine('midline_upper', 'midline_lower', '#0000ff', 2);
      }
      if (showPlanes.intraoralFrontalClosed && points['canine_R'] && points['canine_L']) {
        drawLine('canine_R', 'canine_L', '#0000ff', 2);
      }
      if (showPlanes.intraoralFrontalClosed && points['u1_R'] && points['u1_L']) {
        drawLine('u1_R', 'u1_L', '#0000ff', 2);
      }
    } else if (photometryData.projectionType === 'intraoralFrontalOpen') {
      // Draw lines for intraoral frontal open analysis
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
      
      // Draw lines for intraoral frontal open projection
      if (showPlanes.intraoralFrontalOpen && points['midline_upper'] && points['midline_lower']) {
        drawLine('midline_upper', 'midline_lower', '#0000ff', 2);
      }
      if (showPlanes.intraoralFrontalOpen && points['canine_R'] && points['canine_L']) {
        drawLine('canine_R', 'canine_L', '#0000ff', 2);
      }
      if (showPlanes.intraoralFrontalOpen && points['u1_R'] && points['l1_R']) {
        drawLine('u1_R', 'l1_R', '#0000ff', 2);
      }
      if (showPlanes.intraoralFrontalOpen && points['u1_L'] && points['l1_L']) {
        drawLine('u1_L', 'l1_L', '#0000ff', 2);
      }
    } else if (photometryData.projectionType === 'intraoralRight90') {
      // Draw lines for intraoral right 90° analysis
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
      
      // Draw lines for intraoral right 90° projection
      if (showPlanes.intraoralRight90 && points['midline_upper'] && points['midline_lower']) {
        drawLine('midline_upper', 'midline_lower', '#0000ff', 2);
      }
      if (showPlanes.intraoralRight90 && points['u6_mesiobuccal'] && points['l6_mesiobuccal']) {
        drawLine('u6_mesiobuccal', 'l6_mesiobuccal', '#0000ff', 2);
      }
      if (showPlanes.intraoralRight90 && points['u7_mesiobuccal'] && points['l7_mesiobuccal']) {
        drawLine('u7_mesiobuccal', 'l7_mesiobuccal', '#0000ff', 2);
      }
    } else if (photometryData.projectionType === 'intraoralRight45') {
      // Draw lines for intraoral right 45° analysis
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
      
      // Draw lines for intraoral right 45° projection
      if (showPlanes.intraoralRight45 && points['canine_R'] && points['canine_L']) {
        drawLine('canine_R', 'canine_L', '#0000ff', 2);
      }
      if (showPlanes.intraoralRight45 && points['u5_distobuccal'] && points['l5_distobuccal']) {
        drawLine('u5_distobuccal', 'l5_distobuccal', '#0000ff', 2);
      }
      if (showPlanes.intraoralRight45 && points['u6_mesiobuccal'] && points['l6_mesiobuccal']) {
        drawLine('u6_mesiobuccal', 'l6_mesiobuccal', '#0000ff', 2);
      }
    } else if (photometryData.projectionType === 'intraoralLeft90') {
      // Draw lines for intraoral left 90° analysis
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
      
      // Draw lines for intraoral left 90° projection
      if (showPlanes.intraoralLeft90 && points['midline_upper'] && points['midline_lower']) {
        drawLine('midline_upper', 'midline_lower', '#0000ff', 2);
      }
      if (showPlanes.intraoralLeft90 && points['u6_mesiobuccal_L'] && points['l6_mesiobuccal_L']) {
        drawLine('u6_mesiobuccal_L', 'l6_mesiobuccal_L', '#0000ff', 2);
      }
      if (showPlanes.intraoralLeft90 && points['u7_mesiobuccal'] && points['l7_mesiobuccal']) {
        drawLine('u7_mesiobuccal', 'l7_mesiobuccal', '#0000ff', 2);
      }
    } else if (photometryData.projectionType === 'intraoralLeft45') {
      // Draw lines for intraoral left 45° analysis
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
      
      // Draw lines for intraoral left 45° projection
      if (showPlanes.intraoralLeft45 && points['canine_R'] && points['canine_L']) {
        drawLine('canine_R', 'canine_L', '#0000ff', 2);
      }
      if (showPlanes.intraoralLeft45 && points['u5_distobuccal'] && points['l5_distobuccal']) {
        drawLine('u5_distobuccal', 'l5_distobuccal', '#0000ff', 2);
      }
      if (showPlanes.intraoralLeft45 && points['u6_mesiobuccal_L'] && points['l6_mesiobuccal_L']) {
        drawLine('u6_mesiobuccal_L', 'l6_mesiobuccal_L', '#0000ff', 2);
      }
    } else if (photometryData.projectionType === 'intraoralUpper') {
      // Draw lines for upper jaw analysis
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
      
      // Draw lines for upper jaw projection
      if (showPlanes.intraoralUpper && points['midline_upper'] && points['canine_R']) {
        drawLine('midline_upper', 'canine_R', '#0000ff', 2);
      }
      if (showPlanes.intraoralUpper && points['midline_upper'] && points['canine_L']) {
        drawLine('midline_upper', 'canine_L', '#0000ff', 2);
      }
      if (showPlanes.intraoralUpper && points['u1_R'] && points['u1_L']) {
        drawLine('u1_R', 'u1_L', '#0000ff', 2);
      }
    } else if (photometryData.projectionType === 'intraoralLower') {
      // Draw lines for lower jaw analysis
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
      
      // Draw lines for lower jaw projection
      if (showPlanes.intraoralLower && points['midline_lower'] && points['canine_R']) {
        drawLine('midline_lower', 'canine_R', '#0000ff', 2);
      }
      if (showPlanes.intraoralLower && points['midline_lower'] && points['canine_L']) {
        drawLine('midline_lower', 'canine_L', '#0000ff', 2);
      }
      if (showPlanes.intraoralLower && points['l1_R'] && points['l1_L']) {
        drawLine('l1_R', 'l1_L', '#0000ff', 2);
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
    }
  }, [photometryData, selectedPoint, showPlanes, showAngles, activeTool]);

  // Draw points and measurements on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !photometryData.images[photometryData.projectionType] || !imagesUploaded) return;
    
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
  }, [photometryData, selectedPoint, showPlanes, showAngles, activeTool, drawAllElements, photometryData.projectionType, imagesUploaded]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const { addMeasurements } = useData();
  
  const handleSave = async () => {
    try {
      // Сохраняем измерения в общем хранилище
      addMeasurements('photometry', photometryData.measurements);
      
      // Save to local storage
      try {
        // Prepare data for saving to medical record
        const photometryDataToSave = {
          patient_id: 1, // This would come from the current patient context in a real app
          record_type: 'photometry',
          data: JSON.stringify({
            patientName: photometryData.patientName,
            analysisDate: photometryData.analysisDate,
            projectionType: photometryData.projectionType,
            measurements: photometryData.measurements,
            points: photometryData.points,
            scale: photometryData.scale
          }),
          notes: 'Photometry analysis'
        };
        
        // Save to medical records database using local service
        await localMedicalRecordService.createMedicalRecord(photometryDataToSave);
        
        alert('Данные фотометрии сохранены успешно и переданы в модуль моделирования!');
      } catch (error) {
        console.error('Error saving photometry data:', error);
        alert('Ошибка при сохранении данных фотометрии: ' + error.message);
      }
    } catch (error) {
      console.error('Error saving photometry data:', error);
      alert('Ошибка при сохранении данных фотометрии: ' + error.message);
    }
  };
  
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
      <h2>Модуль фотометрии</h2>
      
      {/* Main Photometry Interface */}
      {
        <>
          
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
                <option value="frontalSmile">Анфас с улыбкой</option>
                <option value="frontalRetractorsClosed">Анфас с закрытыми щечками</option>
                <option value="frontalRetractorsOpen">Анфас с открытыми щечками</option>
                <option value="profileRight">Профиль справа</option>
                <option value="profileLeft">Профиль слева</option>
                <option value="profileSmileRight">Профиль справа с улыбкой</option>
                <option value="profileSmileLeft">Профиль слева с улыбкой</option>
                <option value="profile45Right">Профиль 45° справа</option>
                <option value="profile45Left">Профиль 45° слева</option>
                <option value="intraoralFrontalClosed">Внутриротовые анфас закрыто</option>
                <option value="intraoralFrontalOpen">Внутриротовые анфас открыто</option>
                <option value="intraoralRight90">Внутриротовые справа 90°</option>
                <option value="intraoralRight45">Внутриротовые справа 45°</option>
                <option value="intraoralLeft90">Внутриротовые слева 90°</option>
                <option value="intraoralLeft45">Внутриротовые слева 45°</option>
                <option value="intraoralUpper">Верхняя челюсть</option>
                <option value="intraoralLower">Нижняя челюсть</option>
              </select>
            </div>
          </div>
          
          {/* Image Upload */}
          <div className="image-upload">
            <h3>Фотографии лица</h3>
            {!imagesUploaded ? (
              <PhotoTypeSelection onPhotosSelected={(photos) => {
                // Handle all types of photos for photometry
                const newImages = { ...photometryData.images };
                
                // Map photos to appropriate projection types
                if (photos.frontal) {
                  const imageUrl = URL.createObjectURL(photos.frontal);
                  newImages.frontal = imageUrl;
                }
                
                if (photos.frontalSmile) {
                  const imageUrl = URL.createObjectURL(photos.frontalSmile);
                  newImages.frontalSmile = imageUrl;
                }
                
                if (photos.frontalRetractorsClosed) {
                  const imageUrl = URL.createObjectURL(photos.frontalRetractorsClosed);
                  newImages.frontalRetractorsClosed = imageUrl;
                }
                
                if (photos.frontalRetractorsOpen) {
                  const imageUrl = URL.createObjectURL(photos.frontalRetractorsOpen);
                  newImages.frontalRetractorsOpen = imageUrl;
                }
                
                if (photos.profileRight) {
                  const imageUrl = URL.createObjectURL(photos.profileRight);
                  newImages.profileRight = imageUrl;
                }
                
                if (photos.profileLeft) {
                  const imageUrl = URL.createObjectURL(photos.profileLeft);
                  newImages.profileLeft = imageUrl;
                }
                
                if (photos.profileSmileRight) {
                  const imageUrl = URL.createObjectURL(photos.profileSmileRight);
                  newImages.profileSmileRight = imageUrl;
                }
                
                if (photos.profileSmileLeft) {
                  const imageUrl = URL.createObjectURL(photos.profileSmileLeft);
                  newImages.profileSmileLeft = imageUrl;
                }
                
                if (photos.profile45Right) {
                  const imageUrl = URL.createObjectURL(photos.profile45Right);
                  newImages.profile45Right = imageUrl;
                }
                
                if (photos.profile45Left) {
                  const imageUrl = URL.createObjectURL(photos.profile45Left);
                  newImages.profile45Left = imageUrl;
                }
                
                if (photos.intraoralFrontalClosed) {
                  const imageUrl = URL.createObjectURL(photos.intraoralFrontalClosed);
                  newImages.intraoralFrontalClosed = imageUrl;
                }
                
                if (photos.intraoralFrontalOpen) {
                  const imageUrl = URL.createObjectURL(photos.intraoralFrontalOpen);
                  newImages.intraoralFrontalOpen = imageUrl;
                }
                
                if (photos.intraoralRight90) {
                  const imageUrl = URL.createObjectURL(photos.intraoralRight90);
                  newImages.intraoralRight90 = imageUrl;
                }
                
                if (photos.intraoralRight45) {
                  const imageUrl = URL.createObjectURL(photos.intraoralRight45);
                  newImages.intraoralRight45 = imageUrl;
                }
                
                if (photos.intraoralLeft90) {
                  const imageUrl = URL.createObjectURL(photos.intraoralLeft90);
                  newImages.intraoralLeft90 = imageUrl;
                }
                
                if (photos.intraoralLeft45) {
                  const imageUrl = URL.createObjectURL(photos.intraoralLeft45);
                  newImages.intraoralLeft45 = imageUrl;
                }
                
                if (photos.intraoralUpper) {
                  const imageUrl = URL.createObjectURL(photos.intraoralUpper);
                  newImages.intraoralUpper = imageUrl;
                }
                
                if (photos.intraoralLower) {
                  const imageUrl = URL.createObjectURL(photos.intraoralLower);
                  newImages.intraoralLower = imageUrl;
                }
                
                // Update the state with all images
                setPhotometryData(prev => ({
                  ...prev,
                  images: newImages
                }));
                
                // Set images uploaded flag
                setImagesUploaded(true);
                
                // If we have an image for the current projection type, activate scale setting mode
                if (newImages[photometryData.projectionType]) {
                  // Get image dimensions
                  const img = new Image();
                  img.onload = () => {
                    setPhotometryData(prev => ({
                      ...prev,
                      imageDimensions: { width: img.width, height: img.height }
                    }));
                    // Automatically activate scale setting mode when image is loaded
                    setActiveTool('scale');
                  };
                  img.src = newImages[photometryData.projectionType];
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
                  
                  {/* New Calibration section based on Калибровка.docx */}
                  <div className="calibration-section">
                    <h3>Калибровка изображения</h3>
                    
                    {/* Calibration status */}
                    <div className="calibration-status">
                      {photometryData.calibration.isCalibrated ? (
                        <div className="calibrated">
                          ✓ Калибровка завершена
                          <div className="calibration-details">
                            <span>Тип: {photometryData.calibration.type}</span>
                            {photometryData.calibration.pixelsPerMm > 0 && (
                              <span>Масштаб: {photometryData.calibration.pixelsPerMm.toFixed(4)} пикселей/мм</span>
                            )}
                            {photometryData.calibration.magnification?.factor && (
                              <span>Увеличение: {photometryData.calibration.magnification.factor}x</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="not-calibrated">⚠ Требуется калибровка для точных измерений в мм</p>
                      )}
                    </div>
                    
                    {/* Calibration method selection */}
                    <div className="calibration-methods">
                      <h4>Метод калибровки:</h4>
                      
                      {/* DICOM calibration */}
                      <div className="calibration-method">
                        <input
                          type="radio"
                          id="dicom-calibration"
                          name="calibration-type"
                          value="dicom"
                          checked={photometryData.calibration.type === 'dicom'}
                          onChange={(e) => {
                            setPhotometryData(prev => ({
                              ...prev,
                              calibration: {
                                ...prev.calibration,
                                type: e.target.value
                              }
                            }));
                          }}
                        />
                        <label htmlFor="dicom-calibration">
                          <strong>DICOM (рекомендуется)</strong>
                          <span>Использует встроенный масштаб из DICOM-файла</span>
                        </label>
                        <button
                          onClick={() => {
                            // Try to use DICOM pixel spacing if available
                            // This would be implemented when loading DICOM files
                            alert('DICOM-калибровка автоматически применяется при загрузке DICOM-файлов с метаданными');
                          }}
                          disabled={photometryData.calibration.type !== 'dicom'}
                          className="calibration-btn"
                        >
                          Применить
                        </button>
                      </div>
                      
                      {/* Known object calibration */}
                      <div className="calibration-method">
                        <input
                          type="radio"
                          id="known-object-calibration"
                          name="calibration-type"
                          value="known_object"
                          checked={photometryData.calibration.type === 'known_object'}
                          onChange={(e) => {
                            setPhotometryData(prev => ({
                              ...prev,
                              calibration: {
                                ...prev.calibration,
                                type: e.target.value
                              }
                            }));
                          }}
                        />
                        <label htmlFor="known-object-calibration">
                          <strong>Известный объект</strong>
                          <span>Калибровка по объекту с известным размером</span>
                        </label>
                      </div>
                      
                      {/* Known object settings */}
                      {photometryData.calibration.type === 'known_object' && (
                        <div className="known-object-settings">
                          <div className="form-group">
                            <label>Тип объекта:</label>
                            <select
                              value={photometryData.calibration.knownObject.type}
                              onChange={(e) => {
                                setPhotometryData(prev => ({
                                  ...prev,
                                  calibration: {
                                    ...prev.calibration,
                                    knownObject: {
                                      ...prev.calibration.knownObject,
                                      type: e.target.value
                                    }
                                  }
                                }));
                              }}
                            >
                              <option value="implant">Имплантат</option>
                              <option value="crown">Коронка/брекет</option>
                              <option value="distance">Межзубное расстояние</option>
                              <option value="bracket">Ортодонтический брекет</option>
                              <option value="marker">Металлический маркер</option>
                            </select>
                          </div>
                          
                          <div className="form-group">
                            <label>Размер объекта (мм):</label>
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={photometryData.calibration.knownObject.size}
                              onChange={(e) => {
                                setPhotometryData(prev => ({
                                  ...prev,
                                  calibration: {
                                    ...prev.calibration,
                                    knownObject: {
                                      ...prev.calibration.knownObject,
                                      size: parseFloat(e.target.value) || 0
                                    }
                                  }
                                }));
                              }}
                            />
                          </div>
                          
                          <div className="calibration-points">
                            <p>Точек установлено: {photometryData.calibration.knownObject.points.point1 ? 1 : 0}{photometryData.calibration.knownObject.points.point2 ? ' + 1' : ''}</p>
                            {photometryData.calibration.knownObject.points.point1 && photometryData.calibration.knownObject.points.point2 && (
                              <p>Расстояние: {Math.sqrt(
                                Math.pow(photometryData.calibration.knownObject.points.point2.x - photometryData.calibration.knownObject.points.point1.x, 2) +
                                Math.pow(photometryData.calibration.knownObject.points.point2.y - photometryData.calibration.knownObject.points.point1.y, 2)
                              ).toFixed(2)} пикселей</p>
                            )}
                          </div>
                          
                          <button
                            onClick={() => {
                              // Start known object calibration
                              setActiveTool('calibrate');
                              alert('Установите первую точку на одном конце эталонного объекта, затем вторую точку на другом конце');
                            }}
                            className="calibration-btn"
                          >
                            Начать калибровку
                          </button>
                        </div>
                      )}
                      
                      {/* Magnification calibration */}
                      <div className="calibration-method">
                        <input
                          type="radio"
                          id="magnification-calibration"
                          name="calibration-type"
                          value="magnification"
                          checked={photometryData.calibration.type === 'magnification'}
                          onChange={(e) => {
                            setPhotometryData(prev => ({
                              ...prev,
                              calibration: {
                                ...prev.calibration,
                                type: e.target.value
                              }
                            }));
                          }}
                        />
                        <label htmlFor="magnification-calibration">
                          <strong>Увеличение аппарата</strong>
                          <span>Коррекция по коэффициенту увеличения</span>
                        </label>
                      </div>
                      
                      {/* Magnification settings */}
                      {photometryData.calibration.type === 'magnification' && (
                        <div className="magnification-settings">
                          <div className="form-group">
                            <label>Коэффициент увеличения:</label>
                            <input
                              type="number"
                              min="1.0"
                              max="2.0"
                              step="0.01"
                              value={photometryData.calibration.magnification.factor}
                              onChange={(e) => {
                                setPhotometryData(prev => ({
                                  ...prev,
                                  calibration: {
                                    ...prev.calibration,
                                    magnification: {
                                      ...prev.calibration.magnification,
                                      factor: parseFloat(e.target.value) || 1.0
                                    }
                                  }
                                }));
                              }}
                            />
                            <span className="hint">Например: 1.1 для 10% увеличения</span>
                          </div>
                          
                          <div className="form-group">
                            <label>Источник данных:</label>
                            <select
                              value={photometryData.calibration.magnification.source}
                              onChange={(e) => {
                                setPhotometryData(prev => ({
                                  ...prev,
                                  calibration: {
                                    ...prev.calibration,
                                    magnification: {
                                      ...prev.calibration.magnification,
                                      source: e.target.value
                                    }
                                  }
                                }));
                              }}
                            >
                              <option value="apparatus">Аппарат</option>
                              <option value="passport">Паспорт аппарата</option>
                              <option value="printed">Распечатано на снимке</option>
                            </select>
                          </div>
                          
                          <button
                            onClick={() => {
                              handleMagnificationCalibration(photometryData.calibration.magnification.factor);
                            }}
                            className="calibration-btn"
                          >
                            Применить увеличение
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Calibration instructions */}
                    <div className="calibration-info">
                      <h4>Инструкции по калибровке:</h4>
                      <ul>
                        <li><strong>DICOM:</strong> Самый точный метод. Используется автоматически при наличии DICOM-файла с метаданными.</li>
                        <li><strong>Известный объект:</strong> Подходит для JPG/PNG изображений. Используйте имплантат, коронку или измеренное расстояние.</li>
                        <li><strong>Увеличение:</strong> Используйте, если известен коэффициент увеличения аппарата (обычно 1.1 или 1.08).</li>
                        <li><strong>Важно:</strong> Калибровка необходима для получения точных измерений в миллиметрах.</li>
                      </ul>
                    </div>
                    
                    {/* Reset calibration */}
                    <button
                      onClick={resetCalibration}
                      className="reset-calibration-btn"
                    >
                      Сбросить калибровку
                    </button>
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
                            if (canvas && photometryData.images[photometryData.projectionType] && imagesUploaded) {
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
                    
                    {/* Калибровка по прямой */}
                    {activeTool === 'scale' && (
                      <div className="scale-control">
                        <h4>Калибровка по прямой</h4>
                        <div className="scale-mode-controls">
                          <label>Режим калибровки:</label>
                          <select
                            value={scaleMode}
                            onChange={(e) => {
                              const newMode = e.target.value;
                              setScaleMode(newMode);
                              
                              // Reset scale points when switching modes
                              if (newMode === '10mm') {
                                setScalePoints30({ point0: null, point30: null });
                              } else {
                                setScalePoints({ point0: null, point10: null });
                              }
                            }}
                          >
                            <option value="10mm">10 мм</option>
                            <option value="30mm">30 мм</option>
                          </select>
                        </div>
                        
                        <div className="scale-instructions">
                          <p>1. Установите первую точку (0)</p>
                          <p>2. Установите вторую точку на расстоянии {scaleMode === '10mm' ? '10 мм' : '30 мм'}</p>
                          <p>3. Система автоматически рассчитает масштаб</p>
                        </div>
                        
                        <div className="scale-points-status">
                          <p>Точек установлено:
                            {scaleMode === '10mm'
                              ? `${scalePoints.point0 ? '1' : '0'}${scalePoints.point10 ? ' + 1' : ''}`
                              : `${scalePoints30.point0 ? '1' : '0'}${scalePoints30.point30 ? ' + 1' : ''}`
                            }
                          </p>
                          <p>Текущий масштаб: {photometryData.scale.toFixed(4)} пикселей/мм</p>
                        </div>
                        
                        <div className="scale-actions">
                          <button
                            onClick={() => {
                              if (scaleMode === '10mm') {
                                setScalePoints({ point0: null, point10: null });
                              } else {
                                setScalePoints30({ point0: null, point30: null });
                              }
                              setPhotometryData(prev => ({
                                ...prev,
                                scale: 1,
                                calibration: {
                                  ...prev.calibration,
                                  type: 'none',
                                  pixelsPerMm: 0,
                                  isCalibrated: false
                                }
                              }));
                              setIsSettingScale(false);
                            }}
                            style={{ marginTop: '10px', padding: '5px 10px' }}
                          >
                            Сбросить калибровку
                          </button>
                          
                          <button
                            onClick={() => {
                              setIsSettingScale(false);
                              setActiveTool('point');
                            }}
                            disabled={photometryData.scale <= 1}
                            style={{ marginTop: '10px', padding: '5px 10px', marginLeft: '10px' }}
                          >
                            Перейти к расстановке точек
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="scale-control">
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
                      
                      
                      <button
                        onClick={() => {
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
                        }}
                        style={{ marginTop: '10px', padding: '5px 10px' }}
                      >
                        Сбросить масштаб
                      </button>
                      
                      {activeTool === 'scale' && (
                        <div className="scale-instructions">
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
                                frontalSmile: true,
                                frontalRetractorsClosed: true,
                                frontalRetractorsOpen: true,
                                profileRight: true,
                                profileLeft: true,
                                profileSmileRight: true,
                                profileSmileLeft: true,
                                profile45Right: true,
                                profile45Left: true,
                                intraoralFrontalClosed: true,
                                intraoralFrontalOpen: true,
                                intraoralRight90: true,
                                intraoralRight45: true,
                                intraoralLeft90: true,
                                intraoralLeft45: true,
                                intraoralUpper: true,
                                intraoralLower: true
                              }))}
                              className="select-all-btn"
                            >
                              Выбрать все линии
                            </button>
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: false,
                                frontalRetractorsClosed: false,
                                frontalRetractorsOpen: false,
                                profileRight: false,
                                profileLeft: false,
                                profileSmileRight: false,
                                profileSmileLeft: false,
                                profile45Right: false,
                                profile45Left: false,
                                intraoralFrontalClosed: false,
                                intraoralFrontalOpen: false,
                                intraoralRight90: false,
                                intraoralRight45: false,
                                intraoralLeft90: false,
                                intraoralLeft45: false,
                                intraoralUpper: false,
                                intraoralLower: false
                              }))}
                              className="deselect-all-btn"
                            >
                              Убрать все линии
                            </button>
                          </div>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalSmile}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalSmile: e.target.checked }))}
                            />
                            Срединная линия (n-gn)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalRetractorsClosed}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalRetractorsClosed: e.target.checked }))}
                            />
                            Зрачковая линия
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalRetractorsOpen}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalRetractorsOpen: e.target.checked }))}
                            />
                            Окклюзионная линия
                          </label>
                        </div>
                      )}
                      
                      {photometryData.projectionType === 'frontal' && (
                        <div className="control-group">
                          <h5>Углы</h5>
                          <div className="control-buttons">
                            <button
                              onClick={() => setShowAngles(prev => ({
                                facialProfile: true
                              }))}
                              className="select-all-btn"
                            >
                              Выбрать все углы
                            </button>
                            <button
                              onClick={() => setShowAngles(prev => ({
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
                                frontalSmile: true,
                                frontalRetractorsClosed: true,
                                frontalRetractorsOpen: true,
                                profileRight: true,
                                profileLeft: true,
                                profileSmileRight: true,
                                profileSmileLeft: true,
                                profile45Right: true,
                                profile45Left: true,
                                intraoralFrontalClosed: true,
                                intraoralFrontalOpen: true,
                                intraoralRight90: true,
                                intraoralRight45: true,
                                intraoralLeft90: true,
                                intraoralLeft45: true,
                                intraoralUpper: true,
                                intraoralLower: true
                              }))}
                              className="select-all-btn"
                            >
                              Выбрать все линии
                            </button>
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: false,
                                frontalRetractorsClosed: false,
                                frontalRetractorsOpen: false,
                                profileRight: false,
                                profileLeft: false,
                                profileSmileRight: false,
                                profileSmileLeft: false,
                                profile45Right: false,
                                profile45Left: false,
                                intraoralFrontalClosed: false,
                                intraoralFrontalOpen: false,
                                intraoralRight90: false,
                                intraoralRight45: false,
                                intraoralLeft90: false,
                                intraoralLeft45: false,
                                intraoralUpper: false,
                                intraoralLower: false
                              }))}
                              className="deselect-all-btn"
                            >
                              Убрать все линии
                            </button>
                          </div>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.profileRight}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, profileRight: e.target.checked }))}
                            />
                            E-line (pro-pog)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.profileLeft}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, profileLeft: e.target.checked }))}
                            />
                            Носогубная линия (coll-sn)
                          </label>
                        </div>
                      )}
                      
                      {photometryData.projectionType === 'profile' && (
                        <div className="control-group">
                          <h5>Углы</h5>
                          <div className="control-buttons">
                            <button
                              onClick={() => setShowAngles(prev => ({
                                nasolabial: true
                              }))}
                              className="select-all-btn"
                            >
                              Выбрать все углы
                            </button>
                            <button
                              onClick={() => setShowAngles(prev => ({
                                nasolabial: false
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
                        </div>
                      )}
                      
                      {/* Visualization controls for frontal smile projection */}
                      {photometryData.projectionType === 'frontalSmile' && (
                        <div className="control-group">
                          <h5>Линии</h5>
                          <div className="control-buttons">
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: true,
                                frontalRetractorsClosed: true,
                                frontalRetractorsOpen: true,
                                profileRight: true,
                                profileLeft: true,
                                profileSmileRight: true,
                                profileSmileLeft: true,
                                profile45Right: true,
                                profile45Left: true,
                                intraoralFrontalClosed: true,
                                intraoralFrontalOpen: true,
                                intraoralRight90: true,
                                intraoralRight45: true,
                                intraoralLeft90: true,
                                intraoralLeft45: true,
                                intraoralUpper: true,
                                intraoralLower: true
                              }))}
                              className="select-all-btn"
                            >
                              Выбрать все линии
                            </button>
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: false,
                                frontalRetractorsClosed: false,
                                frontalRetractorsOpen: false,
                                profileRight: false,
                                profileLeft: false,
                                profileSmileRight: false,
                                profileSmileLeft: false,
                                profile45Right: false,
                                profile45Left: false,
                                intraoralFrontalClosed: false,
                                intraoralFrontalOpen: false,
                                intraoralRight90: false,
                                intraoralRight45: false,
                                intraoralLeft90: false,
                                intraoralLeft45: false,
                                intraoralUpper: false,
                                intraoralLower: false
                              }))}
                              className="deselect-all-btn"
                            >
                              Убрать все линии
                            </button>
                          </div>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalSmile}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalSmile: e.target.checked }))}
                            />
                            Линия улыбки (ch_L-ch_R)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalRetractorsClosed}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalRetractorsClosed: e.target.checked }))}
                            />
                            Межзрачковая линия (zy_L-zy_R)
                          </label>
                        </div>
                      )}
                      
                      {/* Visualization controls for frontal retractors closed projection */}
                      {photometryData.projectionType === 'frontalRetractorsClosed' && (
                        <div className="control-group">
                          <h5>Линии</h5>
                          <div className="control-buttons">
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: true,
                                frontalRetractorsClosed: true,
                                frontalRetractorsOpen: true,
                                profileRight: true,
                                profileLeft: true,
                                profileSmileRight: true,
                                profileSmileLeft: true,
                                profile45Right: true,
                                profile45Left: true,
                                intraoralFrontalClosed: true,
                                intraoralFrontalOpen: true,
                                intraoralRight90: true,
                                intraoralRight45: true,
                                intraoralLeft90: true,
                                intraoralLeft45: true,
                                intraoralUpper: true,
                                intraoralLower: true
                              }))}
                              className="select-all-btn"
                            >
                              Выбрать все линии
                            </button>
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: false,
                                frontalRetractorsClosed: false,
                                frontalRetractorsOpen: false,
                                profileRight: false,
                                profileLeft: false,
                                profileSmileRight: false,
                                profileSmileLeft: false,
                                profile45Right: false,
                                profile45Left: false,
                                intraoralFrontalClosed: false,
                                intraoralFrontalOpen: false,
                                intraoralRight90: false,
                                intraoralRight45: false,
                                intraoralLeft90: false,
                                intraoralLeft45: false,
                                intraoralUpper: false,
                                intraoralLower: false
                              }))}
                              className="deselect-all-btn"
                            >
                              Убрать все линии
                            </button>
                          </div>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalRetractorsClosed}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalRetractorsClosed: e.target.checked }))}
                            />
                            Вертикальная линия (u1_tip-l1_tip)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalRetractorsOpen}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalRetractorsOpen: e.target.checked }))}
                            />
                            Межзрачковая линия (zy_L-zy_R)
                          </label>
                        </div>
                      )}
                      
                      {/* Visualization controls for frontal retractors open projection */}
                      {photometryData.projectionType === 'frontalRetractorsOpen' && (
                        <div className="control-group">
                          <h5>Линии</h5>
                          <div className="control-buttons">
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: true,
                                frontalRetractorsClosed: true,
                                frontalRetractorsOpen: true,
                                profileRight: true,
                                profileLeft: true,
                                profileSmileRight: true,
                                profileSmileLeft: true,
                                profile45Right: true,
                                profile45Left: true,
                                intraoralFrontalClosed: true,
                                intraoralFrontalOpen: true,
                                intraoralRight90: true,
                                intraoralRight45: true,
                                intraoralLeft90: true,
                                intraoralLeft45: true,
                                intraoralUpper: true,
                                intraoralLower: true
                              }))}
                              className="select-all-btn"
                            >
                              Выбрать все линии
                            </button>
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: false,
                                frontalRetractorsClosed: false,
                                frontalRetractorsOpen: false,
                                profileRight: false,
                                profileLeft: false,
                                profileSmileRight: false,
                                profileSmileLeft: false,
                                profile45Right: false,
                                profile45Left: false,
                                intraoralFrontalClosed: false,
                                intraoralFrontalOpen: false,
                                intraoralRight90: false,
                                intraoralRight45: false,
                                intraoralLeft90: false,
                                intraoralLeft45: false,
                                intraoralUpper: false,
                                intraoralLower: false
                              }))}
                              className="deselect-all-btn"
                            >
                              Убрать все линии
                            </button>
                          </div>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalRetractorsOpen}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalRetractorsOpen: e.target.checked }))}
                            />
                            Вертикальная линия (u1_tip-l1_tip)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalSmile}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalSmile: e.target.checked }))}
                            />
                            Окклюзионная линия (u6_mesiobuccal-l6_mesiobuccal)
                          </label>
                        </div>
                      )}
                      
                      {/* Visualization controls for profile right projection */}
                      {photometryData.projectionType === 'profileRight' && (
                        <div className="control-group">
                          <h5>Линии</h5>
                          <div className="control-buttons">
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: true,
                                frontalRetractorsClosed: true,
                                frontalRetractorsOpen: true,
                                profileRight: true,
                                profileLeft: true,
                                profileSmileRight: true,
                                profileSmileLeft: true,
                                profile45Right: true,
                                profile45Left: true,
                                intraoralFrontalClosed: true,
                                intraoralFrontalOpen: true,
                                intraoralRight90: true,
                                intraoralRight45: true,
                                intraoralLeft90: true,
                                intraoralLeft45: true,
                                intraoralUpper: true,
                                intraoralLower: true
                              }))}
                              className="select-all-btn"
                            >
                              Выбрать все линии
                            </button>
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: false,
                                frontalRetractorsClosed: false,
                                frontalRetractorsOpen: false,
                                profileRight: false,
                                profileLeft: false,
                                profileSmileRight: false,
                                profileSmileLeft: false,
                                profile45Right: false,
                                profile45Left: false,
                                intraoralFrontalClosed: false,
                                intraoralFrontalOpen: false,
                                intraoralRight90: false,
                                intraoralRight45: false,
                                intraoralLeft90: false,
                                intraoralLeft45: false,
                                intraoralUpper: false,
                                intraoralLower: false
                              }))}
                              className="deselect-all-btn"
                            >
                              Убрать все линии
                            </button>
                          </div>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.profileRight}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, profileRight: e.target.checked }))}
                            />
                            E-line (pro-pog)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalSmile}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalSmile: e.target.checked }))}
                            />
                            Профильная линия (n-pg)
                          </label>
                        </div>
                      )}
                      
                      {/* Visualization controls for profile left projection */}
                      {photometryData.projectionType === 'profileLeft' && (
                        <div className="control-group">
                          <h5>Линии</h5>
                          <div className="control-buttons">
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: true,
                                frontalRetractorsClosed: true,
                                frontalRetractorsOpen: true,
                                profileRight: true,
                                profileLeft: true,
                                profileSmileRight: true,
                                profileSmileLeft: true,
                                profile45Right: true,
                                profile45Left: true,
                                intraoralFrontalClosed: true,
                                intraoralFrontalOpen: true,
                                intraoralRight90: true,
                                intraoralRight45: true,
                                intraoralLeft90: true,
                                intraoralLeft45: true,
                                intraoralUpper: true,
                                intraoralLower: true
                              }))}
                              className="select-all-btn"
                            >
                              Выбрать все линии
                            </button>
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: false,
                                frontalRetractorsClosed: false,
                                frontalRetractorsOpen: false,
                                profileRight: false,
                                profileLeft: false,
                                profileSmileRight: false,
                                profileSmileLeft: false,
                                profile45Right: false,
                                profile45Left: false,
                                intraoralFrontalClosed: false,
                                intraoralFrontalOpen: false,
                                intraoralRight90: false,
                                intraoralRight45: false,
                                intraoralLeft90: false,
                                intraoralLeft45: false,
                                intraoralUpper: false,
                                intraoralLower: false
                              }))}
                              className="deselect-all-btn"
                            >
                              Убрать все линии
                            </button>
                          </div>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.profileLeft}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, profileLeft: e.target.checked }))}
                            />
                            Носогубная линия (coll-sn)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalRetractorsClosed}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalRetractorsClosed: e.target.checked }))}
                            />
                            Линия подбородка (go_L-me)
                          </label>
                        </div>
                      )}
                      
                      {/* Visualization controls for profile smile right projection */}
                      {photometryData.projectionType === 'profileSmileRight' && (
                        <div className="control-group">
                          <h5>Линии</h5>
                          <div className="control-buttons">
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: true,
                                frontalRetractorsClosed: true,
                                frontalRetractorsOpen: true,
                                profileRight: true,
                                profileLeft: true,
                                profileSmileRight: true,
                                profileSmileLeft: true,
                                profile45Right: true,
                                profile45Left: true,
                                intraoralFrontalClosed: true,
                                intraoralFrontalOpen: true,
                                intraoralRight90: true,
                                intraoralRight45: true,
                                intraoralLeft90: true,
                                intraoralLeft45: true,
                                intraoralUpper: true,
                                intraoralLower: true
                              }))}
                              className="select-all-btn"
                            >
                              Выбрать все линии
                            </button>
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: false,
                                frontalRetractorsClosed: false,
                                frontalRetractorsOpen: false,
                                profileRight: false,
                                profileLeft: false,
                                profileSmileRight: false,
                                profileSmileLeft: false,
                                profile45Right: false,
                                profile45Left: false,
                                intraoralFrontalClosed: false,
                                intraoralFrontalOpen: false,
                                intraoralRight90: false,
                                intraoralRight45: false,
                                intraoralLeft90: false,
                                intraoralLeft45: false,
                                intraoralUpper: false,
                                intraoralLower: false
                              }))}
                              className="deselect-all-btn"
                            >
                              Убрать все линии
                            </button>
                          </div>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.profileSmileRight}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, profileSmileRight: e.target.checked }))}
                            />
                            Линия улыбки (ch_R-ls)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalSmile}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalSmile: e.target.checked }))}
                            />
                            E-line (pro-pog)
                          </label>
                        </div>
                      )}
                      
                      {/* Visualization controls for profile smile left projection */}
                      {photometryData.projectionType === 'profileSmileLeft' && (
                        <div className="control-group">
                          <h5>Линии</h5>
                          <div className="control-buttons">
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: true,
                                frontalRetractorsClosed: true,
                                frontalRetractorsOpen: true,
                                profileRight: true,
                                profileLeft: true,
                                profileSmileRight: true,
                                profileSmileLeft: true,
                                profile45Right: true,
                                profile45Left: true,
                                intraoralFrontalClosed: true,
                                intraoralFrontalOpen: true,
                                intraoralRight90: true,
                                intraoralRight45: true,
                                intraoralLeft90: true,
                                intraoralLeft45: true,
                                intraoralUpper: true,
                                intraoralLower: true
                              }))}
                              className="select-all-btn"
                            >
                              Выбрать все линии
                            </button>
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: false,
                                frontalRetractorsClosed: false,
                                frontalRetractorsOpen: false,
                                profileRight: false,
                                profileLeft: false,
                                profileSmileRight: false,
                                profileSmileLeft: false,
                                profile45Right: false,
                                profile45Left: false,
                                intraoralFrontalClosed: false,
                                intraoralFrontalOpen: false,
                                intraoralRight90: false,
                                intraoralRight45: false,
                                intraoralLeft90: false,
                                intraoralLeft45: false,
                                intraoralUpper: false,
                                intraoralLower: false
                              }))}
                              className="deselect-all-btn"
                            >
                              Убрать все линии
                            </button>
                          </div>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.profileSmileLeft}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, profileSmileLeft: e.target.checked }))}
                            />
                            Линия улыбки (ch_L-ls)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalRetractorsClosed}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalRetractorsClosed: e.target.checked }))}
                            />
                            Профильная линия (n-pg)
                          </label>
                        </div>
                      )}
                      
                      {/* Visualization controls for profile 45° right projection */}
                      {photometryData.projectionType === 'profile45Right' && (
                        <div className="control-group">
                          <h5>Линии</h5>
                          <div className="control-buttons">
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: true,
                                frontalRetractorsClosed: true,
                                frontalRetractorsOpen: true,
                                profileRight: true,
                                profileLeft: true,
                                profileSmileRight: true,
                                profileSmileLeft: true,
                                profile45Right: true,
                                profile45Left: true,
                                intraoralFrontalClosed: true,
                                intraoralFrontalOpen: true,
                                intraoralRight90: true,
                                intraoralRight45: true,
                                intraoralLeft90: true,
                                intraoralLeft45: true,
                                intraoralUpper: true,
                                intraoralLower: true
                              }))}
                              className="select-all-btn"
                            >
                              Выбрать все линии
                            </button>
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: false,
                                frontalRetractorsClosed: false,
                                frontalRetractorsOpen: false,
                                profileRight: false,
                                profileLeft: false,
                                profileSmileRight: false,
                                profileSmileLeft: false,
                                profile45Right: false,
                                profile45Left: false,
                                intraoralFrontalClosed: false,
                                intraoralFrontalOpen: false,
                                intraoralRight90: false,
                                intraoralRight45: false,
                                intraoralLeft90: false,
                                intraoralLeft45: false,
                                intraoralUpper: false,
                                intraoralLower: false
                              }))}
                              className="deselect-all-btn"
                            >
                              Убрать все линии
                            </button>
                          </div>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.profile45Right}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, profile45Right: e.target.checked }))}
                            />
                            Скулово-угловая линия (zy_R-go_R)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalSmile}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalSmile: e.target.checked }))}
                            />
                            Носогубная линия (pro-ls)
                          </label>
                        </div>
                      )}
                      
                      {/* Visualization controls for profile 45° left projection */}
                      {photometryData.projectionType === 'profile45Left' && (
                        <div className="control-group">
                          <h5>Линии</h5>
                          <div className="control-buttons">
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: true,
                                frontalRetractorsClosed: true,
                                frontalRetractorsOpen: true,
                                profileRight: true,
                                profileLeft: true,
                                profileSmileRight: true,
                                profileSmileLeft: true,
                                profile45Right: true,
                                profile45Left: true,
                                intraoralFrontalClosed: true,
                                intraoralFrontalOpen: true,
                                intraoralRight90: true,
                                intraoralRight45: true,
                                intraoralLeft90: true,
                                intraoralLeft45: true,
                                intraoralUpper: true,
                                intraoralLower: true
                              }))}
                              className="select-all-btn"
                            >
                              Выбрать все линии
                            </button>
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: false,
                                frontalRetractorsClosed: false,
                                frontalRetractorsOpen: false,
                                profileRight: false,
                                profileLeft: false,
                                profileSmileRight: false,
                                profileSmileLeft: false,
                                profile45Right: false,
                                profile45Left: false,
                                intraoralFrontalClosed: false,
                                intraoralFrontalOpen: false,
                                intraoralRight90: false,
                                intraoralRight45: false,
                                intraoralLeft90: false,
                                intraoralLeft45: false,
                                intraoralUpper: false,
                                intraoralLower: false
                              }))}
                              className="deselect-all-btn"
                            >
                              Убрать все линии
                            </button>
                          </div>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.profile45Left}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, profile45Left: e.target.checked }))}
                            />
                            Скулово-угловая линия (zy_L-go_L)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalRetractorsClosed}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalRetractorsClosed: e.target.checked }))}
                            />
                            Профильная линия (n-pg)
                          </label>
                        </div>
                      )}
                      
                      {/* Visualization controls for intraoral frontal closed projection */}
                      {photometryData.projectionType === 'intraoralFrontalClosed' && (
                        <div className="control-group">
                          <h5>Линии</h5>
                          <div className="control-buttons">
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: true,
                                frontalRetractorsClosed: true,
                                frontalRetractorsOpen: true,
                                profileRight: true,
                                profileLeft: true,
                                profileSmileRight: true,
                                profileSmileLeft: true,
                                profile45Right: true,
                                profile45Left: true,
                                intraoralFrontalClosed: true,
                                intraoralFrontalOpen: true,
                                intraoralRight90: true,
                                intraoralRight45: true,
                                intraoralLeft90: true,
                                intraoralLeft45: true,
                                intraoralUpper: true,
                                intraoralLower: true
                              }))}
                              className="select-all-btn"
                            >
                              Выбрать все линии
                            </button>
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: false,
                                frontalRetractorsClosed: false,
                                frontalRetractorsOpen: false,
                                profileRight: false,
                                profileLeft: false,
                                profileSmileRight: false,
                                profileSmileLeft: false,
                                profile45Right: false,
                                profile45Left: false,
                                intraoralFrontalClosed: false,
                                intraoralFrontalOpen: false,
                                intraoralRight90: false,
                                intraoralRight45: false,
                                intraoralLeft90: false,
                                intraoralLeft45: false,
                                intraoralUpper: false,
                                intraoralLower: false
                              }))}
                              className="deselect-all-btn"
                            >
                              Убрать все линии
                            </button>
                          </div>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.intraoralFrontalClosed}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, intraoralFrontalClosed: e.target.checked }))}
                            />
                            Срединная линия (midline_upper-midline_lower)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalSmile}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalSmile: e.target.checked }))}
                            />
                            Межклыковая линия (canine_R-canine_L)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalRetractorsClosed}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalRetractorsClosed: e.target.checked }))}
                            />
                            Межрезцовая линия (u1_R-u1_L)
                          </label>
                        </div>
                      )}
                      
                      {/* Visualization controls for intraoral frontal open projection */}
                      {photometryData.projectionType === 'intraoralFrontalOpen' && (
                        <div className="control-group">
                          <h5>Линии</h5>
                          <div className="control-buttons">
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: true,
                                frontalRetractorsClosed: true,
                                frontalRetractorsOpen: true,
                                profileRight: true,
                                profileLeft: true,
                                profileSmileRight: true,
                                profileSmileLeft: true,
                                profile45Right: true,
                                profile45Left: true,
                                intraoralFrontalClosed: true,
                                intraoralFrontalOpen: true,
                                intraoralRight90: true,
                                intraoralRight45: true,
                                intraoralLeft90: true,
                                intraoralLeft45: true,
                                intraoralUpper: true,
                                intraoralLower: true
                              }))}
                              className="select-all-btn"
                            >
                              Выбрать все линии
                            </button>
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: false,
                                frontalRetractorsClosed: false,
                                frontalRetractorsOpen: false,
                                profileRight: false,
                                profileLeft: false,
                                profileSmileRight: false,
                                profileSmileLeft: false,
                                profile45Right: false,
                                profile45Left: false,
                                intraoralFrontalClosed: false,
                                intraoralFrontalOpen: false,
                                intraoralRight90: false,
                                intraoralRight45: false,
                                intraoralLeft90: false,
                                intraoralLeft45: false,
                                intraoralUpper: false,
                                intraoralLower: false
                              }))}
                              className="deselect-all-btn"
                            >
                              Убрать все линии
                            </button>
                          </div>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.intraoralFrontalOpen}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, intraoralFrontalOpen: e.target.checked }))}
                            />
                            Срединная линия (midline_upper-midline_lower)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalSmile}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalSmile: e.target.checked }))}
                            />
                            Межклыковая линия (canine_R-canine_L)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalRetractorsClosed}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalRetractorsClosed: e.target.checked }))}
                            />
                            Верхне-нижнерезцовая линия (u1_R-l1_R)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalRetractorsOpen}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalRetractorsOpen: e.target.checked }))}
                            />
                            Верхне-нижнерезцовая линия (u1_L-l1_L)
                          </label>
                        </div>
                      )}
                      
                      {/* Visualization controls for intraoral right 90° projection */}
                      {photometryData.projectionType === 'intraoralRight90' && (
                        <div className="control-group">
                          <h5>Линии</h5>
                          <div className="control-buttons">
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: true,
                                frontalRetractorsClosed: true,
                                frontalRetractorsOpen: true,
                                profileRight: true,
                                profileLeft: true,
                                profileSmileRight: true,
                                profileSmileLeft: true,
                                profile45Right: true,
                                profile45Left: true,
                                intraoralFrontalClosed: true,
                                intraoralFrontalOpen: true,
                                intraoralRight90: true,
                                intraoralRight45: true,
                                intraoralLeft90: true,
                                intraoralLeft45: true,
                                intraoralUpper: true,
                                intraoralLower: true
                              }))}
                              className="select-all-btn"
                            >
                              Выбрать все линии
                            </button>
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: false,
                                frontalRetractorsClosed: false,
                                frontalRetractorsOpen: false,
                                profileRight: false,
                                profileLeft: false,
                                profileSmileRight: false,
                                profileSmileLeft: false,
                                profile45Right: false,
                                profile45Left: false,
                                intraoralFrontalClosed: false,
                                intraoralFrontalOpen: false,
                                intraoralRight90: false,
                                intraoralRight45: false,
                                intraoralLeft90: false,
                                intraoralLeft45: false,
                                intraoralUpper: false,
                                intraoralLower: false
                              }))}
                              className="deselect-all-btn"
                            >
                              Убрать все линии
                            </button>
                          </div>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.intraoralRight90}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, intraoralRight90: e.target.checked }))}
                            />
                            Срединная линия (midline_upper-midline_lower)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalSmile}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalSmile: e.target.checked }))}
                            />
                            Правая молярная линия (u6_mesiobuccal-l6_mesiobuccal)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalRetractorsClosed}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalRetractorsClosed: e.target.checked }))}
                            />
                            Правая второмолярная линия (u7_mesiobuccal-l7_mesiobuccal)
                          </label>
                        </div>
                      )}
                      
                      {/* Visualization controls for intraoral right 45° projection */}
                      {photometryData.projectionType === 'intraoralRight45' && (
                        <div className="control-group">
                          <h5>Линии</h5>
                          <div className="control-buttons">
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: true,
                                frontalRetractorsClosed: true,
                                frontalRetractorsOpen: true,
                                profileRight: true,
                                profileLeft: true,
                                profileSmileRight: true,
                                profileSmileLeft: true,
                                profile45Right: true,
                                profile45Left: true,
                                intraoralFrontalClosed: true,
                                intraoralFrontalOpen: true,
                                intraoralRight90: true,
                                intraoralRight45: true,
                                intraoralLeft90: true,
                                intraoralLeft45: true,
                                intraoralUpper: true,
                                intraoralLower: true
                              }))}
                              className="select-all-btn"
                            >
                              Выбрать все линии
                            </button>
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: false,
                                frontalRetractorsClosed: false,
                                frontalRetractorsOpen: false,
                                profileRight: false,
                                profileLeft: false,
                                profileSmileRight: false,
                                profileSmileLeft: false,
                                profile45Right: false,
                                profile45Left: false,
                                intraoralFrontalClosed: false,
                                intraoralFrontalOpen: false,
                                intraoralRight90: false,
                                intraoralRight45: false,
                                intraoralLeft90: false,
                                intraoralLeft45: false,
                                intraoralUpper: false,
                                intraoralLower: false
                              }))}
                              className="deselect-all-btn"
                            >
                              Убрать все линии
                            </button>
                          </div>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.intraoralRight45}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, intraoralRight45: e.target.checked }))}
                            />
                            Межклыковая линия (canine_R-canine_L)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalSmile}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalSmile: e.target.checked }))}
                            />
                            Дистопремолярная линия (u5_distobuccal-l5_distobuccal)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalRetractorsClosed}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalRetractorsClosed: e.target.checked }))}
                            />
                            Мезиомолярная линия (u6_mesiobuccal-l6_mesiobuccal)
                          </label>
                        </div>
                      )}
                      
                      {/* Visualization controls for intraoral left 90° projection */}
                      {photometryData.projectionType === 'intraoralLeft90' && (
                        <div className="control-group">
                          <h5>Линии</h5>
                          <div className="control-buttons">
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: true,
                                frontalRetractorsClosed: true,
                                frontalRetractorsOpen: true,
                                profileRight: true,
                                profileLeft: true,
                                profileSmileRight: true,
                                profileSmileLeft: true,
                                profile45Right: true,
                                profile45Left: true,
                                intraoralFrontalClosed: true,
                                intraoralFrontalOpen: true,
                                intraoralRight90: true,
                                intraoralRight45: true,
                                intraoralLeft90: true,
                                intraoralLeft45: true,
                                intraoralUpper: true,
                                intraoralLower: true
                              }))}
                              className="select-all-btn"
                            >
                              Выбрать все линии
                            </button>
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: false,
                                frontalRetractorsClosed: false,
                                frontalRetractorsOpen: false,
                                profileRight: false,
                                profileLeft: false,
                                profileSmileRight: false,
                                profileSmileLeft: false,
                                profile45Right: false,
                                profile45Left: false,
                                intraoralFrontalClosed: false,
                                intraoralFrontalOpen: false,
                                intraoralRight90: false,
                                intraoralRight45: false,
                                intraoralLeft90: false,
                                intraoralLeft45: false,
                                intraoralUpper: false,
                                intraoralLower: false
                              }))}
                              className="deselect-all-btn"
                            >
                              Убрать все линии
                            </button>
                          </div>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.intraoralLeft90}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, intraoralLeft90: e.target.checked }))}
                            />
                            Срединная линия (midline_upper-midline_lower)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalSmile}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalSmile: e.target.checked }))}
                            />
                            Левая молярная линия (u6_mesiobuccal_L-l6_mesiobuccal_L)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalRetractorsClosed}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalRetractorsClosed: e.target.checked }))}
                            />
                            Левая второмолярная линия (u7_mesiobuccal-l7_mesiobuccal)
                          </label>
                        </div>
                      )}
                      
                      {/* Visualization controls for intraoral left 45° projection */}
                      {photometryData.projectionType === 'intraoralLeft45' && (
                        <div className="control-group">
                          <h5>Линии</h5>
                          <div className="control-buttons">
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: true,
                                frontalRetractorsClosed: true,
                                frontalRetractorsOpen: true,
                                profileRight: true,
                                profileLeft: true,
                                profileSmileRight: true,
                                profileSmileLeft: true,
                                profile45Right: true,
                                profile45Left: true,
                                intraoralFrontalClosed: true,
                                intraoralFrontalOpen: true,
                                intraoralRight90: true,
                                intraoralRight45: true,
                                intraoralLeft90: true,
                                intraoralLeft45: true,
                                intraoralUpper: true,
                                intraoralLower: true
                              }))}
                              className="select-all-btn"
                            >
                              Выбрать все линии
                            </button>
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: false,
                                frontalRetractorsClosed: false,
                                frontalRetractorsOpen: false,
                                profileRight: false,
                                profileLeft: false,
                                profileSmileRight: false,
                                profileSmileLeft: false,
                                profile45Right: false,
                                profile45Left: false,
                                intraoralFrontalClosed: false,
                                intraoralFrontalOpen: false,
                                intraoralRight90: false,
                                intraoralRight45: false,
                                intraoralLeft90: false,
                                intraoralLeft45: false,
                                intraoralUpper: false,
                                intraoralLower: false
                              }))}
                              className="deselect-all-btn"
                            >
                              Убрать все линии
                            </button>
                          </div>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.intraoralLeft45}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, intraoralLeft45: e.target.checked }))}
                            />
                            Межклыковая линия (canine_R-canine_L)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalSmile}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalSmile: e.target.checked }))}
                            />
                            Левая дистопремолярная линия (u5_distobuccal-l5_distobuccal)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalRetractorsClosed}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalRetractorsClosed: e.target.checked }))}
                            />
                            Левая мезиомолярная линия (u6_mesiobuccal_L-l6_mesiobuccal_L)
                          </label>
                        </div>
                      )}
                      
                      {/* Visualization controls for intraoral upper projection */}
                      {photometryData.projectionType === 'intraoralUpper' && (
                        <div className="control-group">
                          <h5>Линии</h5>
                          <div className="control-buttons">
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: true,
                                frontalRetractorsClosed: true,
                                frontalRetractorsOpen: true,
                                profileRight: true,
                                profileLeft: true,
                                profileSmileRight: true,
                                profileSmileLeft: true,
                                profile45Right: true,
                                profile45Left: true,
                                intraoralFrontalClosed: true,
                                intraoralFrontalOpen: true,
                                intraoralRight90: true,
                                intraoralRight45: true,
                                intraoralLeft90: true,
                                intraoralLeft45: true,
                                intraoralUpper: true,
                                intraoralLower: true
                              }))}
                              className="select-all-btn"
                            >
                              Выбрать все линии
                            </button>
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: false,
                                frontalRetractorsClosed: false,
                                frontalRetractorsOpen: false,
                                profileRight: false,
                                profileLeft: false,
                                profileSmileRight: false,
                                profileSmileLeft: false,
                                profile45Right: false,
                                profile45Left: false,
                                intraoralFrontalClosed: false,
                                intraoralFrontalOpen: false,
                                intraoralRight90: false,
                                intraoralRight45: false,
                                intraoralLeft90: false,
                                intraoralLeft45: false,
                                intraoralUpper: false,
                                intraoralLower: false
                              }))}
                              className="deselect-all-btn"
                            >
                              Убрать все линии
                            </button>
                          </div>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.intraoralUpper}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, intraoralUpper: e.target.checked }))}
                            />
                            Срединная линия (midline_upper)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalSmile}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalSmile: e.target.checked }))}
                            />
                            Правая клыковая линия (midline_upper-canine_R)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalRetractorsClosed}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalRetractorsClosed: e.target.checked }))}
                            />
                            Левая клыковая линия (midline_upper-canine_L)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalRetractorsOpen}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalRetractorsOpen: e.target.checked }))}
                            />
                            Межрезцовая линия (u1_R-u1_L)
                          </label>
                        </div>
                      )}
                      
                      {/* Visualization controls for intraoral lower projection */}
                      {photometryData.projectionType === 'intraoralLower' && (
                        <div className="control-group">
                          <h5>Линии</h5>
                          <div className="control-buttons">
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: true,
                                frontalRetractorsClosed: true,
                                frontalRetractorsOpen: true,
                                profileRight: true,
                                profileLeft: true,
                                profileSmileRight: true,
                                profileSmileLeft: true,
                                profile45Right: true,
                                profile45Left: true,
                                intraoralFrontalClosed: true,
                                intraoralFrontalOpen: true,
                                intraoralRight90: true,
                                intraoralRight45: true,
                                intraoralLeft90: true,
                                intraoralLeft45: true,
                                intraoralUpper: true,
                                intraoralLower: true
                              }))}
                              className="select-all-btn"
                            >
                              Выбрать все линии
                            </button>
                            <button
                              onClick={() => setShowPlanes(prev => ({
                                frontalSmile: false,
                                frontalRetractorsClosed: false,
                                frontalRetractorsOpen: false,
                                profileRight: false,
                                profileLeft: false,
                                profileSmileRight: false,
                                profileSmileLeft: false,
                                profile45Right: false,
                                profile45Left: false,
                                intraoralFrontalClosed: false,
                                intraoralFrontalOpen: false,
                                intraoralRight90: false,
                                intraoralRight45: false,
                                intraoralLeft90: false,
                                intraoralLeft45: false,
                                intraoralUpper: false,
                                intraoralLower: false
                              }))}
                              className="deselect-all-btn"
                            >
                              Убрать все линии
                            </button>
                          </div>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.intraoralLower}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, intraoralLower: e.target.checked }))}
                            />
                            Срединная линия (midline_lower)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalSmile}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalSmile: e.target.checked }))}
                            />
                            Правая клыковая линия (midline_lower-canine_R)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalRetractorsClosed}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalRetractorsClosed: e.target.checked }))}
                            />
                            Левая клыковая линия (midline_lower-canine_L)
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={showPlanes.frontalRetractorsOpen}
                              onChange={(e) => setShowPlanes(prev => ({ ...prev, frontalRetractorsOpen: e.target.checked }))}
                            />
                            Межрезцовая линия (l1_R-l1_L)
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
            <button onClick={handleSave} disabled={!imagesUploaded}>
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
        </>
      }
    </div>
  );
};

export default PhotometryModule;