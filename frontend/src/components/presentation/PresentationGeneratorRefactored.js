import React from 'react';
import '../PresentationGenerator.css';
import { usePresentationState } from './usePresentationState';
import { usePresentationHandlers } from './usePresentationHandlers';
import { usePresentationExports } from './usePresentationExports';
import PresentationHeader from './PresentationHeader';
import SlideSelector from './SlideSelector';
import PresentationPreview from './PresentationPreview';

const PresentationGeneratorRefactored = ({ patient }) => {
  const state = usePresentationState();
  const handlers = usePresentationHandlers(state, patient);
  const exports = usePresentationExports(state, patient);

  if (state.loading) {
    return (
      <div className="presentation-generator loading">
        <div className="loader"></div>
        <p>Подготовка данных для презентации...</p>
      </div>
    );
  }

  return (
    <div className="presentation-generator">
      <PresentationHeader 
        patient={patient || state.medicalData?.personalInfo}
        exportFormat={state.exportFormat}
        setExportFormat={state.setExportFormat}
        onGenerate={handlers.handleGeneratePresentation}
        onSelectAll={handlers.handleSelectAll}
        onDeselectAll={handlers.handleDeselectAll}
      />

      <div className="presentation-content-section">
        <div className="section-title">
          <h3>Выберите слайды для включения</h3>
          <p>Отметьте нужные разделы для генерации отчета</p>
        </div>
        
        <SlideSelector 
          slides={state.presentationSlides}
          selectedSlides={state.selectedSlides}
          onToggle={handlers.handleSlideToggle}
        />
      </div>

      <div className="generator-footer-info">
        <div className="info-item">
          <span className="info-label">Всего доступно:</span>
          <span className="info-value">{state.presentationSlides.length} слайдов</span>
        </div>
        <div className="info-item">
          <span className="info-label">Выбрано:</span>
          <span className="info-value">
            {Object.values(state.selectedSlides).filter(Boolean).length} слайдов
          </span>
        </div>
      </div>

      {state.previewMode && (
        <PresentationPreview 
          state={state}
          onClose={() => state.setPreviewMode(false)}
          onExport={exports.handleExportPresentation}
        />
      )}
    </div>
  );
};

export default PresentationGeneratorRefactored;
