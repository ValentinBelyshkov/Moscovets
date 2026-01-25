import React, { useState, useEffect } from 'react';
import ctService from '../../services/ctService';

const CTScanDateSelector = ({ patientId, onDateSelect, selectedDate }) => {
  const [scanDates, setScanDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadScanDates();
  }, [patientId]);

  const loadScanDates = async () => {
    if (!patientId) return;

    setLoading(true);
    setError(null);
    try {
      const dates = await ctService.getPatientScanDates(patientId);
      setScanDates(dates);
    } catch (err) {
      console.error('Error loading scan dates:', err);
      setError('Не удалось загрузить даты сканирования');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="ct-scan-date-selector" style={{
      border: '1px solid #ddd',
      borderRadius: '6px',
      padding: '15px',
      marginBottom: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>
        История сканирований КТ
      </h4>

      {loading && (
        <p style={{ fontSize: '12px', color: '#666' }}>Загрузка...</p>
      )}

      {error && (
        <p style={{ fontSize: '12px', color: '#dc3545' }}>{error}</p>
      )}

      {!loading && !error && scanDates.length === 0 && (
        <p style={{ fontSize: '12px', color: '#666' }}>
          Нет загруженных сканирований КТ
        </p>
      )}

      {!loading && !error && scanDates.length > 0 && (
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px' }}>
            Выберите дату сканирования:
          </label>
          <select
            value={selectedDate || ''}
            onChange={(e) => onDateSelect(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            <option value="">-- Выберите дату --</option>
            {scanDates.map((date) => (
              <option key={date} value={date}>
                {formatDate(date)}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default CTScanDateSelector;
