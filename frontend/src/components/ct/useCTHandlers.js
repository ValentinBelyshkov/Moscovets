import localMedicalRecordService from '../../services/localMedicalRecordService';

export const useCTHandlers = ({ ctData, setCtData, setError, setMeasurements }) => {
  const handleArchiveUploadSuccess = (result) => {
    console.log('Archive upload successful:', result);
    
    const uploadedFiles = result.uploadedFiles;
    
    if (uploadedFiles.length === 0) {
      setError('Из архива не было загружено ни одного файла');
      return;
    }
    
    const filePlaneAssignments = {};
    uploadedFiles.forEach(file => {
      filePlaneAssignments[file.id] = null;
    });
    
    setCtData(prev => ({
      ...prev,
      ctScan: `${result.totalExtracted} DICOM файлов извлечено из архива "${result.archiveName}"`,
      selectedFile: uploadedFiles[0],
      uploadedFiles: uploadedFiles,
      availablePlanes: {},
      selectedPlane: null,
      filePlaneAssignments: filePlaneAssignments,
      showPlaneAssignment: true
    }));
    
    alert(`Успешно загружено ${result.totalExtracted} DICOM файлов из архива! Теперь вы можете назначить плоскости для каждого файла.`);
  };

  const handleArchiveUploadError = (errorMessage) => {
    setError(errorMessage);
    console.error('Archive upload error:', errorMessage);
  };

  const handleMeasurementChange = (measurement, value) => {
    setCtData(prev => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [measurement]: parseFloat(value) || 0
      }
    }));
  };

  const handlePlaneAssignment = (fileId, plane) => {
    setCtData(prev => {
      const newFilePlaneAssignments = { ...prev.filePlaneAssignments };
      const newAvailablePlanes = { ...prev.availablePlanes };
      
      const previousPlane = newFilePlaneAssignments[fileId];
      if (previousPlane && newAvailablePlanes[previousPlane]) {
        delete newAvailablePlanes[previousPlane];
      }
      
      if (plane) {
        newFilePlaneAssignments[fileId] = plane;
        const file = prev.uploadedFiles.find(f => f.id === fileId);
        if (file) {
          newAvailablePlanes[plane] = file;
        }
      } else {
        newFilePlaneAssignments[fileId] = null;
      }
      
      return {
        ...prev,
        filePlaneAssignments: newFilePlaneAssignments,
        availablePlanes: newAvailablePlanes
      };
    });
  };

  const togglePlaneAssignment = () => {
    setCtData(prev => ({
      ...prev,
      showPlaneAssignment: !prev.showPlaneAssignment
    }));
  };

  const getFilePreviewUrl = (file) => {
    return file.data_url || '';
  };

  const handleSave = async () => {
    try {
      const ctDataToSave = {
        patient_id: 1,
        record_type: 'ct',
        data: JSON.stringify({
          patientName: ctData.patientName,
          analysisDate: ctData.analysisDate,
          measurements: ctData.measurements,
          fileCount: ctData.uploadedFiles.length
        }),
        notes: `CT analysis with ${ctData.uploadedFiles.length} files`
      };
      
      await localMedicalRecordService.createMedicalRecord(ctDataToSave);
      alert('Данные КТ успешно сохранены!');
    } catch (error) {
      console.error('Error saving CT data:', error);
      alert('Ошибка при сохранении данных КТ: ' + error.message);
    }
  };

  const handleToolSelect = (tool) => {
    setCtData(prev => ({ ...prev, activeTool: tool }));
  };

  const handlePlaneSelect = (plane) => {
    console.log('Switching to plane:', plane);
    if (ctData.availablePlanes && ctData.availablePlanes[plane]) {
      const selectedFile = ctData.availablePlanes[plane];
      
      if (!selectedFile?.data_url) {
        setError(`Не удалось загрузить данные для плоскости ${plane}: отсутствует URL файла`);
        return;
      }
      
      setCtData(prev => ({
        ...prev,
        selectedFile: selectedFile,
        selectedPlane: plane
      }));
    } else {
      setError(`Плоскость ${plane} недоступна`);
    }
  };

  const handleMeasurementComplete = (measurement) => {
    setMeasurements(prev => [...prev, measurement]);
    
    if (measurement.tool === 'ruler') {
      if (measurement.pixelSpacing && measurement.pixelSpacing.row && measurement.pixelSpacing.column) {
        const avgPixelSpacing = (measurement.pixelSpacing.row + measurement.pixelSpacing.column) / 2;
        const distanceCm = (measurement.distance * avgPixelSpacing) / 10;
        console.log(`Measurement: ${distanceCm.toFixed(2)} cm`);
      }
    }
  };

  const handleAnnotationAdd = (annotation) => {
    const plane = ctData.selectedPlane || 'sagittal';
    setCtData(prev => ({
      ...prev,
      annotations: {
        ...prev.annotations,
        [plane]: [...(prev.annotations[plane] || []), annotation]
      }
    }));
  };

  return {
    handleArchiveUploadSuccess,
    handleArchiveUploadError,
    handleMeasurementChange,
    handlePlaneAssignment,
    togglePlaneAssignment,
    getFilePreviewUrl,
    handleSave,
    handleToolSelect,
    handlePlaneSelect,
    handleMeasurementComplete,
    handleAnnotationAdd
  };
};
