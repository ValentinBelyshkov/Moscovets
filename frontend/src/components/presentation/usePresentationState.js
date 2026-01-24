import { useState } from 'react';

export const usePresentationState = () => {
  const [medicalData, setMedicalData] = useState(null);
  const [presentationSlides, setPresentationSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlides, setSelectedSlides] = useState({});
  const [exportFormat, setExportFormat] = useState('html');
  const [previewMode, setPreviewMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);

  return {
    medicalData,
    setMedicalData,
    presentationSlides,
    setPresentationSlides,
    loading,
    setLoading,
    selectedSlides,
    setSelectedSlides,
    exportFormat,
    setExportFormat,
    previewMode,
    setPreviewMode,
    currentSlide,
    setCurrentSlide,
    showHtmlPreview,
    setShowHtmlPreview
  };
};
