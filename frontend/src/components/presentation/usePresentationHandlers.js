import { useEffect } from 'react';
import { usePresentationData } from './usePresentationData';

export const usePresentationHandlers = (state, patient) => {
  const { getDemoMedicalData, generateSlides } = usePresentationData();

  useEffect(() => {
    const loadMedicalData = async () => {
      try {
        state.setLoading(true);
        const savedData = localStorage.getItem(`medical_card_${patient?.id || 'demo'}`);
        
        let data;
        if (savedData) {
          data = JSON.parse(savedData);
        } else {
          data = getDemoMedicalData();
        }
        
        state.setMedicalData(data);
        const slides = generateSlides(data, patient);
        state.setPresentationSlides(slides);
        
        const initialSelection = {};
        slides.forEach(slide => {
          initialSelection[slide.number] = true;
        });
        state.setSelectedSlides(initialSelection);
        
        state.setLoading(false);
      } catch (error) {
        console.error('Error loading medical data:', error);
        state.setLoading(false);
      }
    };

    if (patient?.id) {
      loadMedicalData();
    } else {
      const data = getDemoMedicalData();
      state.setMedicalData(data);
      const slides = generateSlides(data, patient);
      state.setPresentationSlides(slides);
      
      const initialSelection = {};
      slides.forEach(slide => {
        initialSelection[slide.number] = true;
      });
      state.setSelectedSlides(initialSelection);
      
      state.setLoading(false);
    }
  }, [patient?.id]);

  const handleSlideToggle = (slideNumber) => {
    state.setSelectedSlides(prev => ({
      ...prev,
      [slideNumber]: !prev[slideNumber]
    }));
  };

  const handleSelectAll = () => {
    const allSelected = {};
    state.presentationSlides.forEach(slide => {
      allSelected[slide.number] = true;
    });
    state.setSelectedSlides(allSelected);
  };

  const handleDeselectAll = () => {
    const noneSelected = {};
    state.presentationSlides.forEach(slide => {
      noneSelected[slide.number] = false;
    });
    state.setSelectedSlides(noneSelected);
  };

  const handleGeneratePresentation = () => {
    const selectedSlideNumbers = Object.keys(state.selectedSlides)
      .filter(key => state.selectedSlides[key])
      .map(key => parseInt(key));
    
    const selectedSlidesData = state.presentationSlides
      .filter(slide => selectedSlideNumbers.includes(slide.number))
      .map(slide => ({
        ...slide,
        patient: state.medicalData?.personalInfo || patient
      }));
    
    const presentationData = {
      patient: state.medicalData?.personalInfo || patient,
      slides: selectedSlidesData,
      generatedAt: new Date().toISOString(),
      totalSlides: selectedSlidesData.length,
      format: state.exportFormat
    };
    
    localStorage.setItem(`presentation_${patient?.id || 'demo'}`, JSON.stringify(presentationData));
    
    state.setPreviewMode(true);
    state.setCurrentSlide(0);
    
    alert(`✅ Презентация успешно сгенерирована!\n\n📊 Статистика:\n• Выбрано слайдов: ${selectedSlidesData.length}\n• Формат: ${state.exportFormat.toUpperCase()}\n• Пациент: ${presentationData.patient.fullName}`);
  };

  return {
    handleSlideToggle,
    handleSelectAll,
    handleDeselectAll,
    handleGeneratePresentation
  };
};
