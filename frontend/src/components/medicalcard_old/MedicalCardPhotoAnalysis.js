import { useState } from 'react';
import PhotoUpload from '../PhotoUpload';

const MedicalCardPhotoAnalysis = ({ orthodonticData, patientId }) => {
  const [activeTab, setActiveTab] = useState('frontal');
  const [showUpload, setShowUpload] = useState(false);
  const data = orthodonticData?.photoAnalysis || {};

  const tabs = [
    { id: 'frontal', label: 'Фас', icon: '👤' },
    { id: 'profile', label: 'Профиль', icon: '👁️' },
    { id: 'profile45', label: '45°', icon: '🔷' },
    { id: 'intraoral', label: 'Внутриротовые', icon: '🦷' }
  ];

  const currentData = data[activeTab] || {};

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-cyan-500">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <span>📷</span> Фотометрический анализ
        </h3>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-300 ${
            showUpload 
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
              : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200 border border-cyan-200'
          }`}
        >
          {showUpload ? '✕ Закрыть загрузку' : '➕ Добавить фото'}
        </button>
      </div>

      {showUpload && (
        <PhotoUpload 
          patientId={patientId} 
          onUploadSuccess={() => {
            // Можно добавить обновление данных здесь, если нужно
            // setShowUpload(false); 
          }} 
        />
      )}

      {/* Вкладки */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-2 rounded-lg transition duration-300 flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Содержимое вкладки */}
      {activeTab === 'frontal' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3">Лицевые пропорции</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ширина лица:</span>
                  <span className="font-medium">{currentData.faceWidth || '-'} мм</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Высота лица:</span>
                  <span className="font-medium">{currentData.faceHeight || '-'} мм</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Лицевой индекс:</span>
                  <span className="font-medium">{currentData.facialIndex || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Индекс формы головы:</span>
                  <span className="font-medium">{currentData.headShapeIndex || '-'}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3">Симметрия и эстетика</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Положение подбородка:</span>
                  <span className="font-medium">{currentData.chinPosition || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Подбородочная складка:</span>
                  <span className="font-medium">{currentData.chinFold || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Замыкание губ:</span>
                  <span className="font-medium">{currentData.lipClosure || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Десневая улыбка:</span>
                  <span className="font-medium">{currentData.gumSmile || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-3">Линии и оси</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Зрачковая линия:</span>
                <span className="font-medium">{currentData.pupilLine || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Срединная линия:</span>
                <span className="font-medium">{currentData.midline || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Окклюзионная линия:</span>
                <span className="font-medium">{currentData.occlusalLine || '-'}</span>
              </div>
            </div>
          </div>

          {currentData.actualImage && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3">Фотография</h4>
              <img
                src={currentData.actualImage}
                alt="Frontal view"
                className="max-w-full h-auto rounded-lg border border-gray-300"
              />
            </div>
          )}

          {currentData.comments && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-700 mb-2">Комментарий:</h4>
              <p className="text-gray-700">{currentData.comments}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3">Профильные параметры</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Тип профиля:</span>
                  <span className="font-medium">{currentData.profileType || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Назогубный угол:</span>
                  <span className="font-medium">{currentData.nasolabialAngle || '-'}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ментолабиальный угол:</span>
                  <span className="font-medium">{currentData.mentolabialAngle || '-'}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Лицевая выпуклость:</span>
                  <span className="font-medium">{currentData.facialConvexity || '-'}°</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3">Положение губ</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Положение верхней губы:</span>
                  <span className="font-medium">{currentData.upperLipPosition || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Положение нижней губы:</span>
                  <span className="font-medium">{currentData.lowerLipPosition || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Положение подбородка:</span>
                  <span className="font-medium">{currentData.chinPosition || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {currentData.eLine && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3">Линия Эстетика (E-line)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Верхняя губа:</span>
                  <span className="font-medium">{currentData.eLine.upperLip} мм</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Нижняя губа:</span>
                  <span className="font-medium">{currentData.eLine.lowerLip} мм</span>
                </div>
              </div>
            </div>
          )}

          {currentData.actualImage && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3">Фотография</h4>
              <img
                src={currentData.actualImage}
                alt="Profile view"
                className="max-w-full h-auto rounded-lg border border-gray-300"
              />
            </div>
          )}

          {currentData.comments && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-700 mb-2">Комментарий:</h4>
              <p className="text-gray-700">{currentData.comments}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile45' && (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-3">Характеристики</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Симметрия:</span>
                <span className="font-medium">{currentData.symmetry || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Форма головы:</span>
                <span className="font-medium">{currentData.headShape || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Форма лица:</span>
                <span className="font-medium">{currentData.faceShape || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Скуловой выступ:</span>
                <span className="font-medium">{currentData.zygomaticProminence || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Угловой угол:</span>
                <span className="font-medium">{currentData.gonialAngle || '-'}</span>
              </div>
            </div>
          </div>

          {currentData.actualImage && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3">Фотография</h4>
              <img
                src={currentData.actualImage}
                alt="45° profile view"
                className="max-w-full h-auto rounded-lg border border-gray-300"
              />
            </div>
          )}

          {currentData.comments && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-700 mb-2">Комментарий:</h4>
              <p className="text-gray-700">{currentData.comments}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'intraoral' && (
        <div className="space-y-4">
          {currentData.actualImage && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3">Внутриротовые фотографии</h4>
              <img
                src={currentData.actualImage}
                alt="Intraoral view"
                className="max-w-full h-auto rounded-lg border border-gray-300"
              />
            </div>
          )}

          {currentData.photos && currentData.photos.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3">Доступные фотографии:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {currentData.photos.map((photo, idx) => (
                  <li key={idx} className="text-gray-700">{photo}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicalCardPhotoAnalysis;
