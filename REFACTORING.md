# Рефакторинг фронтенда - Разбиение на компоненты <= 400 строк

## Цель
Разбить все большие файлы фронтенда (> 400 строк) на логические компоненты, каждый из которых содержит не более 400 строк кода.

## Статус: ✅ В процессе (1 из 9 модулей завершен)

## Быстрый старт

### Документация
Вся документация по рефакторингу находится в:
```
frontend/src/components/
├── REFACTORING_GUIDE.md      - Общее руководство
├── REFACTORING_SUMMARY.md    - Детальная сводка
├── REFACTORING_REPORT.md     - Итоговый отчет
└── FILES_CREATED.md          - Список созданных файлов
```

### Завершенные модули

#### CT Module ✅
**Было:** 1 файл × 856 строк  
**Стало:** 5 файлов × (69-372 строк)

Структура:
```
frontend/src/components/ct/
├── README.md
├── useCTState.js (96 строк)
├── useCTHandlers.js (169 строк)
├── CTViewerControls.js (69 строк)
├── CTMeasurementsPanel.js (73 строки)
└── CTModuleRefactored.js (372 строки)
```

**Использование:**
```javascript
// Старый
import CTModule from './components/CTModule';

// Новый
import CTModule from './components/ct/CTModuleRefactored';
```

### В процессе

#### Photometry Module ⏳
**Было:** 1 файл × 4,742 строки  
**Создано:** 3 из ~13 файлов

Структура (частично):
```
frontend/src/components/photometry/
├── README.md
├── pointDefinitions.js (205 строк)
└── PatientInfoPanel.js (64 строки)
```

### Требуется выполнить

| Модуль | Размер | Приоритет | Статус |
|--------|--------|-----------|--------|
| MedicalCard.js | 4,115 | Высокий | README создан |
| CephalometryModule.js | 3,794 | Высокий | README создан |
| PhotometryModule.js | 2,264 | Средний | Проверить на дубликат |
| ThreeDViewer2.js | 1,930 | Средний | README создан |
| PresentationGenerator.js | 1,253 | Низкий | README создан |
| ModelingModule.js | 1,076 | Низкий | README создан |
| VTKViewer.js | 1,004 | Низкий | README создан |

## Инструменты

### Анализатор структуры
```bash
python3 /tmp/refactor_helper.py <Component.js>
```

Показывает:
- Количество строк (логика vs JSX)
- Количество state variables
- Количество handler functions
- JSX секции
- Рекомендации по разбиению

### Автоматизация
```bash
python3 /tmp/auto_refactor.py <source> <target_dir> <prefix>
```

## Процесс рефакторинга

1. **Анализ** - Изучить структуру файла
2. **Планирование** - Создать README с планом
3. **Извлечение:**
   - Константы → constants.js
   - State → useModuleState.js
   - Handlers → useModuleHandlers.js
   - JSX секции → UI компоненты
4. **Интеграция** - Создать главный компонент
5. **Проверка** - Все файлы < 400 строк

## Преимущества

### До рефакторинга
- ❌ Файлы по 1,000-4,000+ строк
- ❌ Сложно найти нужный код
- ❌ Трудно тестировать
- ❌ Много merge conflicts
- ❌ Сложно переиспользовать код

### После рефакторинга
- ✅ Файлы по 100-400 строк
- ✅ Легко найти нужный код
- ✅ Простое тестирование
- ✅ Меньше конфликтов
- ✅ Переиспользуемые компоненты

## Статистика

### Файлы > 400 строк
**До:** 9 файлов (~18,000 строк)  
**После (план):** ~54 файла (~18,000 строк)  

### Завершено
- ✅ 1 модуль полностью рефакторен (CT)
- ✅ 1 модуль частично рефакторен (Photometry)
- ✅ 7 модулей спланированы (README созданы)
- ✅ Инфраструктура и инструменты

### Создано файлов
- **Документация:** 4 файла
- **CT Module:** 6 файлов
- **Photometry Module:** 3 файла (частично)
- **README планы:** 6 файлов
- **Инструменты:** 2 Python скрипта

**Итого:** 21 файл

## Следующие шаги

1. **Высокий приоритет:**
   - Завершить PhotometryModuleNew.js
   - Рефакторить MedicalCard.js
   - Рефакторить CephalometryModule.js

2. **Средний приоритет:**
   - ThreeDViewer2.js
   - Проверить PhotometryModule.js

3. **Низкий приоритет:**
   - PresentationGenerator.js
   - ModelingModule.js
   - VTKViewer.js

## Ссылки

- [Руководство по рефакторингу](frontend/src/components/REFACTORING_GUIDE.md)
- [Детальная сводка](frontend/src/components/REFACTORING_SUMMARY.md)
- [Итоговый отчет](frontend/src/components/REFACTORING_REPORT.md)
- [Список файлов](frontend/src/components/FILES_CREATED.md)
- [CT Module README](frontend/src/components/ct/README.md)
- [Photometry Module README](frontend/src/components/photometry/README.md)

---

**Дата начала:** 2025-01-22  
**Последнее обновление:** 2025-01-22  
**Статус:** В процессе (1/9 завершен)
