import React, { useState } from 'react';
import fileService from '../services/fileService';

const PhotoUpload = ({ patientId, onUploadSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('clinical');
  const [studyDate, setStudyDate] = useState(new Date().toISOString().split('T')[0]);
  const [bodyPart, setBodyPart] = useState('face');
  const [description, setDescription] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError('Пожалуйста, выберите хотя бы один файл');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = selectedFiles.map(file => 
        fileService.uploadFile(
          file, 
          patientId, 
          'photo', 
          category, 
          studyDate, 
          bodyPart, 
          description
        )
      );

      const results = await Promise.all(uploadPromises);
      console.log('Upload results:', results);
      
      setSelectedFiles([]);
      setDescription('');
      if (onUploadSuccess) {
        onUploadSuccess(results);
      }
      alert('Фото успешно загружены!');
    } catch (err) {
      console.error('Upload error:', err);
      setError('Ошибка при загрузке: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-300 mb-6">
      <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <span>📤</span> Загрузить новые фотографии
      </h4>
      
      <form onSubmit={handleUpload} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Выберите файлы
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
              disabled={uploading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Категория
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
              disabled={uploading}
            >
              <option value="clinical">Клинические</option>
              <option value="diagnostic">Диагностические</option>
              <option value="treatment">Лечение</option>
              <option value="surgical">Хирургические</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Дата исследования
            </label>
            <input
              type="date"
              value={studyDate}
              onChange={(e) => setStudyDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
              disabled={uploading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Область тела
            </label>
            <input
              type="text"
              value={bodyPart}
              onChange={(e) => setBodyPart(e.target.value)}
              placeholder="напр. Лицо, Верхняя челюсть"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
              disabled={uploading}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Описание
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
            rows="2"
            disabled={uploading}
          ></textarea>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || selectedFiles.length === 0}
          className={`w-full py-2 px-4 rounded-lg text-white font-semibold transition duration-300 ${
            uploading || selectedFiles.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-cyan-600 hover:bg-cyan-700 shadow-md hover:shadow-lg'
          }`}
        >
          {uploading ? 'Загрузка...' : `Загрузить ${selectedFiles.length} фото`}
        </button>
      </form>
    </div>
  );
};

export default PhotoUpload;
