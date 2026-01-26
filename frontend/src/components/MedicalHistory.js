import React, { useState, useEffect } from 'react';

// Use runtime configuration with fallback to build-time environment variable
const getApiBaseUrl = () => {
  // First try runtime config (from env-config.js)
  if (typeof window !== 'undefined' && window._env_ && window._env_.REACT_APP_URL_API) {
    return window._env_.REACT_APP_URL_API;
  }
  // Fallback to build-time environment variable
  return process.env.REACT_APP_URL_API || 'http://109.196.102.193:5001';
};

const API_BASE_URL = 'http://109.196.102.193:5001/api/v1';

const MedicalHistory = ({ patientId }) => {
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    diagnosis: '',
    treatment: '',
    doctor: '',
    notes: ''
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (patientId) {
      loadMedicalHistory();
    }
  }, [patientId]);

  const loadMedicalHistory = async () => {
    try {
      setLoading(true);
      
      // В реальном приложении был бы запрос к API
      // Для демонстрации используем mock данные
      const mockData = [
        {
          id: 1,
          date: '2024-01-15',
          diagnosis: 'Сужение зубных рядов',
          treatment: 'Рекомендовано ортодонтическое лечение',
          doctor: 'Ортодонт Иванова А.А.',
          notes: 'Пациент направлен на дополнительную диагностику'
        },
        {
          id: 2,
          date: '2024-01-10',
          diagnosis: 'Нормогнатический прикус',
          treatment: 'Наблюдение',
          doctor: 'Ортодонт Петров И.С.',
          notes: 'Случай средней сложности, требуется планирование лечения'
        },
        {
          id: 3,
          date: '2023-12-20',
          diagnosis: 'Кариес 2.6',
          treatment: 'Пломбирование',
          doctor: 'Стоматолог Сидорова М.В.',
          notes: 'Проведено лечение кариеса, рекомендована гигиена'
        }
      ];

      setMedicalHistory(mockData);
    } catch (error) {
      console.error('Error loading medical history:', error);
      // В случае ошибки используем пустой массив
      setMedicalHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    
    try {
      // В реальном приложении здесь был бы POST запрос
      const newEntryWithId = {
        id: medicalHistory.length + 1,
        ...newEntry
      };
      
      setMedicalHistory(prev => [newEntryWithId, ...prev]);
      
      // Очищаем форму
      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        diagnosis: '',
        treatment: '',
        doctor: '',
        notes: ''
      });
      
      setShowForm(false);
      
      alert('Новая запись добавлена в историю болезни');
      
    } catch (error) {
      console.error('Error adding medical history entry:', error);
      alert('Ошибка при добавлении записи');
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Удалить эту запись из истории болезни?')) {
      return;
    }
    
    try {
      // В реальном приложении здесь был бы DELETE запрос
      setMedicalHistory(prev => prev.filter(entry => entry.id !== id));
      alert('Запись удалена');
    } catch (error) {
      console.error('Error deleting medical history entry:', error);
      alert('Ошибка при удалении записи');
    }
  };

  if (loading) {
    return <div className="medical-history loading">Загрузка истории болезни...</div>;
  }

  return (
    <div className="medical-history">
      <div className="medical-history-header">
        <h3>📝 История болезни</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn-add-entry"
        >
          {showForm ? '❌ Отмена' : '➕ Добавить запись'}
        </button>
      </div>
      
      {showForm && (
        <div className="add-entry-form card-section">
          <h4>Добавить новую запись</h4>
          <form onSubmit={handleAddEntry}>
            <div className="form-grid">
              <div className="form-group">
                <label>Дата:</label>
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Врач:</label>
                <input
                  type="text"
                  value={newEntry.doctor}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, doctor: e.target.value }))}
                  placeholder="ФИО врача"
                  required
                />
              </div>
              
              <div className="form-group full-width">
                <label>Диагноз:</label>
                <input
                  type="text"
                  value={newEntry.diagnosis}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, diagnosis: e.target.value }))}
                  placeholder="Основной диагноз"
                  required
                />
              </div>
              
              <div className="form-group full-width">
                <label>Лечение/Назначения:</label>
                <textarea
                  value={newEntry.treatment}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, treatment: e.target.value }))}
                  placeholder="Проведенное лечение или назначения"
                  rows="3"
                  required
                />
              </div>
              
              <div className="form-group full-width">
                <label>Примечания:</label>
                <textarea
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Дополнительные заметки"
                  rows="2"
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                💾 Сохранить запись
              </button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}
      
      {medicalHistory.length === 0 ? (
        <div className="no-entries">
          <p>Нет записей в истории болезни</p>
          <button 
            onClick={() => setShowForm(true)}
            className="btn-add-first"
          >
            ➕ Добавить первую запись
          </button>
        </div>
      ) : (
        <div className="medical-history-list">
          <table className="medical-table">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Дата</th>
                <th style={{ width: '150px' }}>Врач</th>
                <th>Диагноз</th>
                <th>Лечение/Назначения</th>
                <th style={{ width: '80px' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {medicalHistory.map(entry => (
                <tr key={entry.id}>
                  <td>{entry.date}</td>
                  <td>{entry.doctor}</td>
                  <td>
                    <div className="diagnosis-cell">
                      <strong>{entry.diagnosis}</strong>
                      {entry.notes && (
                        <div className="notes">
                          <small>{entry.notes}</small>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{entry.treatment}</td>
                  <td>
                    <button 
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="btn-delete"
                      title="Удалить запись"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <style jsx>{`
        .medical-history {
          font-family: Arial, sans-serif;
        }
        
        .medical-history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .btn-add-entry {
          padding: 8px 16px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .card-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #dee2e6;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        .form-group.full-width {
          grid-column: 1 / -1;
        }
        
        .form-group label {
          margin-bottom: 5px;
          font-weight: bold;
          font-size: 14px;
        }
        
        .form-group input,
        .form-group textarea {
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .form-group textarea {
          resize: vertical;
        }
        
        .form-actions {
          display: flex;
          gap: 10px;
        }
        
        .btn-primary {
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .btn-secondary {
          padding: 10px 20px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .no-entries {
          text-align: center;
          padding: 40px 20px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 2px dashed #dee2e6;
        }
        
        .btn-add-first {
          margin-top: 15px;
          padding: 10px 20px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .medical-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        
        .medical-table thead {
          background: #e9ecef;
        }
        
        .medical-table th {
          padding: 12px 8px;
          text-align: left;
          border-bottom: 2px solid #dee2e6;
          font-weight: bold;
        }
        
        .medical-table td {
          padding: 12px 8px;
          border-bottom: 1px solid #dee2e6;
          vertical-align: top;
        }
        
        .medical-table tr:hover {
          background: #f8f9fa;
        }
        
        .diagnosis-cell {
          display: flex;
          flex-direction: column;
        }
        
        .notes {
          margin-top: 5px;
          color: #6c757d;
          font-size: 12px;
        }
        
        .btn-delete {
          padding: 5px 10px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
          color: #6c757d;
        }
        
        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .medical-table {
            display: block;
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default MedicalHistory;