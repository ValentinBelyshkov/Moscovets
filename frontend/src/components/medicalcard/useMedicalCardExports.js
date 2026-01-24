import { EXPORT_SLIDE_TITLES } from './MedicalCardConstants';

export const useMedicalCardExports = (
  orthodonticData,
  medicalData,
  photometryImages,
  cephalometryImages,
  biometryModels,
  modeling3DModels,
  ctImages,
  patient,
  navigate
) => {
  const exportForPresentation = () => {
    const exportData = {
      title: `Медицинская карта и презентация пациента: ${orthodonticData?.personalData?.fullName || medicalData?.personalInfo?.fullName}`,
      patient: orthodonticData?.personalData || medicalData?.personalInfo,
      slides: [
        {
          title: EXPORT_SLIDE_TITLES.title,
          content: {
            photo: 'анфас без улыбки',
            birthDate: orthodonticData?.personalData?.birthDate,
            examinationDate: orthodonticData?.personalData?.examinationDate,
            complaints: orthodonticData?.personalData?.complaints,
            doctor: orthodonticData?.personalData?.doctor
          }
        },
        {
          title: EXPORT_SLIDE_TITLES.anamnesis,
          content: orthodonticData?.anamnesis
        },
        {
          title: EXPORT_SLIDE_TITLES.photoAnalysis,
          content: orthodonticData?.photoAnalysis
        },
        {
          title: EXPORT_SLIDE_TITLES.intraoralAnalysis,
          content: orthodonticData?.intraoralAnalysis
        },
        {
          title: EXPORT_SLIDE_TITLES.anthropometry,
          content: orthodonticData?.anthropometry
        },
        {
          title: EXPORT_SLIDE_TITLES.frontalTRG,
          content: orthodonticData?.cephalometry?.frontalTRG
        },
        {
          title: EXPORT_SLIDE_TITLES.lateralTRG,
          content: orthodonticData?.cephalometry?.lateralTRG
        },
        {
          title: EXPORT_SLIDE_TITLES.modeling3D,
          content: orthodonticData?.modeling3D
        },
        {
          title: EXPORT_SLIDE_TITLES.ctAnalysis,
          content: orthodonticData?.ctAnalysis
        },
        {
          title: EXPORT_SLIDE_TITLES.diagnoses,
          content: orthodonticData?.diagnoses
        },
        {
          title: EXPORT_SLIDE_TITLES.treatmentPlan,
          content: orthodonticData?.treatmentPlan
        },
        {
          title: EXPORT_SLIDE_TITLES.conclusions,
          content: orthodonticData?.conclusions
        }
      ],
      images: {
        photometry: photometryImages,
        cephalometry: cephalometryImages,
        biometry: biometryModels,
        modeling: modeling3DModels,
        ct: ctImages
      },
      exportedAt: new Date().toISOString(),
      exportedBy: 'Медицинская карта системы "Московиц 3D"'
    };

    localStorage.setItem(`presentation_data_${patient?.id || 'demo'}_${Date.now()}`, JSON.stringify(exportData, null, 2));

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `presentation_data_${patient?.id || 'unknown'}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert('Данные для презентации экспортированы в JSON файл');
    navigate('/presentation-generator');
  };

  const exportFullCard = (additionalData = {}) => {
    const exportData = {
      patient: orthodonticData?.personalData,
      anamnesis: orthodonticData?.anamnesis,
      photoAnalysis: orthodonticData?.photoAnalysis,
      intraoralAnalysis: orthodonticData?.intraoralAnalysis,
      anthropometry: orthodonticData?.anthropometry,
      cephalometry: orthodonticData?.cephalometry,
      modeling3D: orthodonticData?.modeling3D,
      ctAnalysis: orthodonticData?.ctAnalysis,
      diagnoses: orthodonticData?.diagnoses,
      treatmentPlan: orthodonticData?.treatmentPlan,
      conclusions: orthodonticData?.conclusions,
      moduleData: additionalData.moduleData,
      images: {
        photometry: photometryImages,
        cephalometry: cephalometryImages,
        biometry: biometryModels,
        modeling: modeling3DModels,
        ct: ctImages
      },
      exportedAt: new Date().toISOString(),
      ...additionalData
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medical_card_full_${patient?.id || 'demo'}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    alert('Полная медицинская карта экспортирована в JSON файл');
  };

  return {
    exportForPresentation,
    exportFullCard
  };
};
