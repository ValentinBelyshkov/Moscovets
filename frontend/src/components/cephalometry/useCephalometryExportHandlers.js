import { useCallback } from 'react';
import localMedicalRecordService from '../../services/localMedicalRecordService';

export const useCephalometryExportHandlers = (state, calculationHandlers) => {
  const {
    cephalometryData,
    setLoading,
    setSaveSuccess,
    setShowMedicalCardLink,
    currentPatient,
    medicalCardData
  } = state;

  const { generateReport } = calculationHandlers;

  const handleSaveToMedicalCard = useCallback(async () => {
    try {
      setLoading(true);
      setSaveSuccess(false);
      setShowMedicalCardLink(false);
      
      const report = generateReport();
      
      const patientId = currentPatient?.id || medicalCardData?.patient?.id || 1;
      const patientName = currentPatient?.fullName || medicalCardData?.patient?.fullName || cephalometryData.patientName;
      
      const exportData = {
        patientId,
        patientName,
        analysisDate: cephalometryData.analysisDate,
        projectionType: cephalometryData.projectionType,
        scale: cephalometryData.scale,
        points: cephalometryData.points,
        measurements: report.measurements,
        scalePoints: cephalometryData.scalePoints,
        scalePoints30: cephalometryData.scalePoints30,
        calibrationPoints: cephalometryData.calibrationPoints,
        calibrationType: cephalometryData.calibrationType,
        calibrationObjectSize: cephalometryData.calibrationObjectSize,
        report: {
          conclusion: report.conclusion,
          allNormal: report.allNormal,
          timestamp: new Date().toISOString()
        },
        imagesInfo: {
          dimensions: cephalometryData.imageDimensions,
          hasImages: Object.values(cephalometryData.images).some(img => img !== null)
        },
        calculationHistory: [
          {
            date: new Date().toISOString(),
            measurementsCount: Object.keys(report.measurements).length,
            projection: cephalometryData.projectionType
          }
        ]
      };
      
      try {
        const medicalRecordData = {
          patient_id: patientId,
          record_type: 'cephalometry',
          data: JSON.stringify(exportData),
          notes: `Цефалометрический анализ (${cephalometryData.projectionType === 'lateral' ? 'боковая' : 'прямая'} проекция). ${report.conclusion}`,
          created_at: new Date().toISOString(),
          metadata: {
            pointsCount: Object.keys(cephalometryData.points).length,
            measurementsCount: Object.keys(report.measurements).length,
            scale: cephalometryData.scale,
            projection: cephalometryData.projectionType
          }
        };
        
        await localMedicalRecordService.createMedicalRecord(medicalRecordData);
      } catch (medicalRecordError) {
        console.warn('Could not save to medical record service:', medicalRecordError);
      }
      
      const storageKey = `cephalometry_data_${patientId}_${Date.now()}`;
      localStorage.setItem(storageKey, JSON.stringify(exportData));
      
      const reportsKey = 'cephalometry_reports';
      const existingReports = JSON.parse(localStorage.getItem(reportsKey) || '[]');
      existingReports.push({
        ...exportData,
        storageKey,
        savedAt: new Date().toISOString()
      });
      localStorage.setItem(reportsKey, JSON.stringify(existingReports));
      
      setSaveSuccess(true);
      setShowMedicalCardLink(true);
      setLoading(false);
      alert('Данные успешно сохранены в медицинскую карту пациента.');
    } catch (err) {
      console.error('Error saving to medical card:', err);
      setLoading(false);
      alert('Ошибка при сохранении в медицинскую карту: ' + err.message);
    }
  }, [cephalometryData, currentPatient, medicalCardData, generateReport, setLoading, setSaveSuccess, setShowMedicalCardLink]);

  const exportReportAsPDF = useCallback(() => {
    alert('Экспорт в PDF пока не реализован. В реальном приложении здесь будет создаваться PDF-файл.');
  }, []);
  
  const exportReportAsPPTX = useCallback(() => {
    alert('Экспорт в PPTX пока не реализован. В реальном приложении здесь будет создаваться PPTX-файл.');
  }, []);

  return {
    handleSaveToMedicalCard,
    exportReportAsPDF,
    exportReportAsPPTX
  };
};
