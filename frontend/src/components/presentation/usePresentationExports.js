import { createFullHTMLPresentation } from './PresentationHTML';

export const usePresentationExports = (state, patient) => {
  const handleExportPresentation = () => {
    const presentationData = JSON.parse(localStorage.getItem(`presentation_${patient?.id || 'demo'}`) || '{}');
    
    if (state.exportFormat === 'html') {
      const htmlContent = createFullHTMLPresentation(presentationData);
      const dataStr = `<!DOCTYPE html>\n${htmlContent}`;
      const dataBlob = new Blob([dataStr], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Презентация_${presentationData.patient.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
      link.click();
      URL.revokeObjectURL(url);
      
      state.setShowHtmlPreview(true);
    } else {
      alert(`Для формата ${state.exportFormat.toUpperCase()} требуется подключение к внешнему API. В этом примере доступен только HTML экспорт.`);
    }
  };

  return { handleExportPresentation };
};
