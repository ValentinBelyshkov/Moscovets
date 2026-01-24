import { useNavigate } from 'react-router-dom';
import ModuleDataViewer from '../ModuleDataViewer';

const MedicalCardOverview = ({ orthodonticData, moduleData, patient }) => {
  const navigate = useNavigate();

  // Вспомогательная функция для расчета возраста
  const calculateAge = (birthDate) => {
    if (!birthDate) return 0;

    let birth;
    // Попробуем распарсить различные форматы дат
    if (typeof birthDate === 'string') {
      // Формат DD.MM.YYYY
      if (birthDate.match(/^\d{1,2}\.\d{1,2}\.\d{4}$/)) {
        const [day, month, year] = birthDate.split('.');
        birth = new Date(year, month - 1, day);
      } else if (birthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Формат YYYY-MM-DD
        birth = new Date(birthDate);
      } else {
        birth = new Date(birthDate);
      }
    } else if (birthDate instanceof Date) {
      birth = birthDate;
    } else {
      return 0;
    }

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  return (
    <div className="overview-section">
      <div className="overview-header mb-6">
        <h3 className="text-2xl font-bold text-gray-800">📊 Обзор медицинской карты</h3>
        <p className="text-gray-600 mt-2">Полная интеграция данных из всех диагностических модулей</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
          <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="text-2xl">👤</span> Пациент
          </h4>
          <div className="space-y-2">
            <p><strong>ФИО:</strong> {orthodonticData.personalData?.fullName || 'Не указано'}</p>
            <p><strong>Возраст:</strong> {calculateAge(orthodonticData.personalData?.birthDate)} лет</p>
            <p><strong>Дата исследования:</strong> {orthodonticData.personalData?.examinationDate}</p>
            <p><strong>Жалобы:</strong> {orthodonticData.personalData?.complaints}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200 shadow-sm">
          <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="text-2xl">🩺</span> Основные диагнозы
          </h4>
          {(orthodonticData.diagnoses || []).slice(0, 3).map(dx => (
            <p key={dx.id} className="text-gray-800">• {dx.diagnosis}</p>
          ))}
          {(orthodonticData.diagnoses || []).length > 3 && (
            <p className="text-sm text-gray-600 mt-2">
              и ещё {orthodonticData.diagnoses.length - 3} диагнозов
            </p>
          )}
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-sm">
          <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="text-2xl">📈</span> Ключевые показатели
          </h4>
          <div className="space-y-2">
            <p><strong>Скелетный класс:</strong> {orthodonticData.cephalometry?.lateralTRG?.skeletalClass || 'I класс'}</p>
            <p><strong>Окклюзия:</strong> {orthodonticData.intraoralAnalysis?.occlusion?.vertical?.anterior || 'глубокая резцовая'}</p>
            <p><strong>Сложность лечения:</strong> {orthodonticData.treatmentPlan?.complexity || 'средняя'}</p>
            <p><strong>Длительность:</strong> {orthodonticData.treatmentPlan?.estimatedDuration || '18-24 месяца'}</p>
          </div>
        </div>
      </div>

      <div className="overview-modules">
        <h4 className="text-xl font-semibold text-gray-800 mb-4">📊 Загруженные диагностические модули</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Object.entries(moduleData).map(([moduleName, moduleDataItem]) => {
            const hasImages = moduleDataItem.data && (
              (moduleDataItem.data.images && Object.values(moduleDataItem.data.images).some(img => img !== null)) ||
              (moduleDataItem.data.models && Object.values(moduleDataItem.data.models).some(model => model !== null))
            );

            return (
              <div key={moduleName} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="text-2xl">
                  {moduleName === 'cephalometry' ? '🦴' :
                   moduleName === 'biometry' ? '📐' :
                   moduleName === 'photometry' ? '📷' :
                   moduleName === 'modeling' ? '🖥️' :
                   moduleName === 'ct' ? '🖥️' : '📊'}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-700">
                    {moduleName === 'cephalometry' ? 'Цефалометрия' :
                     moduleName === 'biometry' ? 'Биометрия' :
                     moduleName === 'photometry' ? 'Фотометрия' :
                     moduleName === 'modeling' ? '3D Моделирование' :
                     moduleName === 'ct' ? 'КТ анализ' : moduleName}
                  </div>
                  <div className="text-sm">
                    <span className={moduleDataItem.data ? 'text-green-600' : 'text-red-600'}>
                      {moduleDataItem.data ? '✓ Данные загружены' : '✗ Нет данных'}
                    </span>
                    {hasImages && <span className="text-purple-600 ml-2"> 📷</span>}
                  </div>
                  {moduleDataItem.loadedAt && (
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(moduleDataItem.loadedAt).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {Object.keys(moduleData).length === 0 && (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <p className="text-gray-600 mb-4">Нет загруженных диагностических модулей</p>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition duration-300"
              onClick={() => navigate('/modules')}
            >
              🔬 Перейти к диагностическим модулям
            </button>
          </div>
        )}

        {/* Модульные данные */}
        {moduleData.photometry && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <ModuleDataViewer
              moduleData={moduleData.photometry}
              moduleType="photometry"
            />
          </div>
        )}

        {moduleData.biometry && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <ModuleDataViewer
              moduleData={moduleData.biometry}
              moduleType="biometry"
            />
          </div>
        )}

        {moduleData.cephalometry && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <ModuleDataViewer
              moduleData={moduleData.cephalometry}
              moduleType="cephalometry"
            />
          </div>
        )}

        {moduleData.modeling && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <ModuleDataViewer
              moduleData={moduleData.modeling}
              moduleType="modeling"
            />
          </div>
        )}

        {moduleData.ct && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <ModuleDataViewer
              moduleData={moduleData.ct}
              moduleType="ct"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalCardOverview;
