import React from 'react';
import SlideContent from './SlideContent';

const PresentationPreview = ({ 
  state, 
  onClose, 
  onExport 
}) => {
  const { 
    presentationSlides, 
    selectedSlides, 
    currentSlide, 
    setCurrentSlide, 
    medicalData,
    showHtmlPreview,
    setShowHtmlPreview,
    exportFormat
  } = state;

  const filteredSlides = presentationSlides.filter(s => selectedSlides[s.number]);
  const currentSlideData = filteredSlides[currentSlide];

  const handlePrev = () => setCurrentSlide(prev => Math.max(0, prev - 1));
  const handleNext = () => setCurrentSlide(prev => Math.min(filteredSlides.length - 1, prev + 1));

  if (showHtmlPreview) {
    return (
      <div className="html-preview-overlay">
        <div className="html-preview-modal">
          <div className="preview-header">
            <h3>Предпросмотр HTML-версии</h3>
            <button className="close-preview" onClick={() => setShowHtmlPreview(false)}>×</button>
          </div>
          <div className="preview-iframe-container">
            <div className="preview-mock-content">
              <div className="mock-browser-bar">
                <div className="dots"><span></span><span></span><span></span></div>
                <div className="address-bar">presentation_${medicalData?.personalInfo?.fullName.replace(/\s+/g, '_')}.html</div>
              </div>
              <div className="mock-page-content">
                {filteredSlides.map((slide, idx) => (
                  <div key={idx} className="mock-slide">
                    <div className="mock-slide-header">
                      <span>{slide.title}</span>
                      <span>Слайд {idx + 1}</span>
                    </div>
                    <div className="mock-slide-body">
                      <div className="mock-placeholder-img"></div>
                      <div className="mock-text-lines">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="preview-footer">
            <p>Это упрощенная визуализация. Полная версия сохранена в файл.</p>
            <button className="btn-primary" onClick={() => setShowHtmlPreview(false)}>Понятно</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="presentation-preview-overlay">
      <div className="presentation-preview-container">
        <div className="preview-sidebar">
          <h3>Слайды ({filteredSlides.length})</h3>
          <div className="preview-thumbnails">
            {filteredSlides.map((slide, idx) => (
              <div 
                key={slide.number} 
                className={`thumb-item ${currentSlide === idx ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
              >
                <span className="thumb-num">{idx + 1}</span>
                <span className="thumb-title">{slide.title}</span>
              </div>
            ))}
          </div>
          <div className="preview-actions">
            <button className="btn-export" onClick={onExport}>
              Скачать {exportFormat.toUpperCase()}
            </button>
            <button className="btn-close" onClick={onClose}>
              Закрыть
            </button>
          </div>
        </div>
        
        <div className="preview-main">
          <div className="slide-viewer">
            {currentSlideData && (
              <div className="active-slide">
                <div className="active-slide-header">
                  <h2>{currentSlideData.title}</h2>
                  <div className="slide-meta">
                    Слайд {currentSlide + 1} из {filteredSlides.length}
                  </div>
                </div>
                <div className="active-slide-content">
                  <SlideContent slide={currentSlideData} />
                </div>
                <div className="active-slide-footer">
                  <div className="branding">Picasso Diagnostic Center</div>
                  <div className="patient-name">{medicalData?.personalInfo?.fullName}</div>
                </div>
              </div>
            )}
            
            <button className="nav-btn prev" onClick={handlePrev} disabled={currentSlide === 0}>
              <span>‹</span>
            </button>
            <button className="nav-btn next" onClick={handleNext} disabled={currentSlide === filteredSlides.length - 1}>
              <span>›</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresentationPreview;
