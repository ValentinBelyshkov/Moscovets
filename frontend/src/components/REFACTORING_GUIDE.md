# Руководство по рефакторингу фронтенда

Этот документ описывает структуру рефакторинга для всех компонентов > 400 строк.

## Общие принципы:

1. **Максимальный размер файла: 400 строк**
2. **Разделение ответственности:**
   - Константы и типы → отдельные файлы
   - State management → custom hooks
   - Бизнес-логика → custom hooks  
   - UI компоненты → отдельные файлы
   - Главный компонент → композиция под-компонентов

3. **Структура папок:**
   ```
   components/
     └── moduleName/
         ├── README.md
         ├── constants.js
         ├── utils.js
         ├── hooks/
         │   ├── useModuleState.js
         │   ├── useModuleLogic.js
         │   └── useModuleHandlers.js
         ├── components/
         │   ├── SubComponent1.js
         │   ├── SubComponent2.js
         │   └── SubComponent3.js
         └── ModuleName.js (main)
   ```

## Файлы для рефакторинга:

### 1. PhotometryModuleNew.js (4742 строки → 13 файлов)
**Статус:** В процессе
- ✓ photometry/pointDefinitions.js
- ✓ photometry/PatientInfoPanel.js
- ✓ photometry/README.md
- ⏳ Остальные компоненты

### 2. MedicalCard.js (4115 строк → 11 файлов)
**Статус:** Требуется
- medicalCard/README.md
- medicalCard/sections/* (7 секций)
- medicalCard/hooks/useMedicalCardData.js
- medicalCard/MedicalCard.js

### 3. CephalometryModule.js (3794 строки → 10 файлов)
**Статус:** Требуется
- cephalometry/README.md
- cephalometry/landmarkDefinitions.js
- cephalometry/components/* (6 компонентов)
- cephalometry/hooks/* (2 хука)
- cephalometry/CephalometryModule.js

### 4. PhotometryModule.js (2264 строки → 6 файлов)
**Статус:** Требуется проверка (возможно дубликат PhotometryModuleNew.js)

### 5. ThreeDViewer2.js (1930 строк → 5 файлов)
**Статус:** Требуется
- threeDViewer/README.md
- threeDViewer/hooks/useThreeScene.js
- threeDViewer/components/* (3 компонента)
- threeDViewer/ThreeDViewer2.js

### 6. PresentationGenerator.js (1253 строки → 4 файла)
**Статус:** Требуется
- presentation/README.md
- presentation/components/* (3 компонента)
- presentation/PresentationGenerator.js

### 7. ModelingModule.js (1076 строк → 3 файла)
**Статус:** Требуется
- modeling/README.md
- modeling/components/* (2 компонента)
- modeling/ModelingModule.js

### 8. VTKViewer.js (1004 строки → 3 файла)
**Статус:** Требуется
- vtk/README.md
- vtk/components/* (2 компонента)
- vtk/VTKViewer.js

### 9. CTModule.js (856 строк → 5 файлов)
**Статус:** ✅ Завершено
- ✓ ct/README.md
- ✓ ct/useCTState.js (96 строк)
- ✓ ct/useCTHandlers.js (169 строк)
- ✓ ct/CTViewerControls.js (69 строк)
- ✓ ct/CTMeasurementsPanel.js (73 строки)
- ✓ ct/CTModuleRefactored.js (372 строки)

## Процесс рефакторинга:

1. **Анализ:** Изучить структуру файла, определить логические части
2. **План:** Создать README с описанием структуры
3. **Извлечение:** Начать с констант и утилит
4. **Хуки:** Создать custom hooks для state и логики
5. **Компоненты:** Разбить JSX на под-компоненты
6. **Интеграция:** Обновить главный компонент
7. **Тестирование:** Проверить работоспособность
8. **Cleanup:** Удалить старый файл после проверки

## Инструменты:

- `refactor_helper.py` - Анализ структуры файла
- `auto_refactor.py` - Автоматическое извлечение хуков

## Примеры:

См. папку `photometry/` для примера правильного рефакторинга.
