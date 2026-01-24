import React from 'react';

const SlideSelector = ({ 
  slides, 
  selectedSlides, 
  onToggle 
}) => {
  return (
    <div className="slides-grid">
      {slides.map((slide) => (
        <div 
          key={slide.number} 
          className={`slide-card ${selectedSlides[slide.number] ? 'selected' : ''}`}
          onClick={() => onToggle(slide.number)}
        >
          <div className="slide-card-checkbox">
            <input 
              type="checkbox" 
              checked={!!selectedSlides[slide.number]} 
              readOnly 
            />
          </div>
          <div className="slide-card-preview">
            <div className={`preview-icon type-${slide.type}`}></div>
            <span className="slide-number-badge">{slide.number}</span>
          </div>
          <div className="slide-card-info">
            <h4>{slide.title}</h4>
            <p>{slide.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SlideSelector;
