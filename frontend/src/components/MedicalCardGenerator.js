import React, { useState } from 'react';

const MedicalCardGenerator = () => {
  // Sample patient data
  const [patients] = useState([
    { id: 1, fullName: 'John Doe', birthDate: '1990-01-01', gender: 'Male' },
    { id: 2, fullName: 'Jane Smith', birthDate: '1985-03-15', gender: 'Female' },
    { id: 3, fullName: 'Robert Johnson', birthDate: '1978-11-22', gender: 'Male' },
  ]);

  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('pdf');

  const handleGenerate = () => {
    if (!selectedPatient) {
      alert('Please select a patient for the medical card.');
      return;
    }
    
    // In a real application, this would generate the actual medical card
    alert(`Generating ${selectedFormat.toUpperCase()} medical card for patient ID: ${selectedPatient}.`);
  };

  return (
    <div className="medical-card-generator">
      <h2>Генератор медицинских карт</h2>
      
      <div className="generator-settings">
        <div>
          <label htmlFor="patient-select">Выберите пациента:</label>
          <select
            id="patient-select"
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
          >
            <option value="">-- Выберите пациента --</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.fullName}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="format">Формат:</label>
          <select
            id="format"
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
          >
            <option value="pdf">PDF (.pdf)</option>
            <option value="x">X (.x)</option>
          </select>
        </div>
      </div>
      
      <div className="generate-action">
        <button onClick={handleGenerate}>Сгенерировать медицинскую карту</button>
      </div>
    </div>
  );
};

export default MedicalCardGenerator;