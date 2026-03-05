# Исправление ошибки загрузки DICOM в DWV после распаковки ZIP

## Проблема

После распаковки ZIP архива с DICOM файлами на клиенте:
- DWV viewer не открывается
- Появляется ошибка "Не удалось обработать DICOM файлы"
- В Network видны blob URL запросы типа `blob:http://localhost:3630/...`

## Выполненные исправления

### 1. Детальное логирование (DWVViewer.js)

#### Добавлена полная цепочка событий DWV
```javascript
// Новые события с логированием:
- loadstart     // Начало загрузки
- loadprogress  // Прогресс с процентами
- load          // Успешная загрузка
- loadend       // Завершение
- loaditem      // Загрузка отдельного файла
- error         // Ошибки с детализацией
```

#### Улучшена обработка ошибок
- Детальное логирование всех свойств события ошибки
- Формирование понятного сообщения с деталями:
  - Тип ошибки
  - Сообщение
  - Детали
  - Информация о проблемном файле

#### Валидация файлов перед загрузкой
```javascript
// Проверяется перед app.loadFiles():
- File объекты
- Размер (не 0 байт)
- Конструктор объекта
- Количество файлов
```

#### Логирование инициализации DWV
- Создание экземпляра App
- Конфигурация инициализации
- Установка инструментов
- Ошибки инициализации с stack trace

### 2. Логирование обработки ZIP (CTModule.js)

#### processZipArchive()
- Логирование каждого этапа извлечения
- Проверка свойств ZIP entries
- Лог создания Blob из ZIP entry
- Лог создания File из Blob
- Вывод статистики (количество, размер, имена файлов)

#### loadFilesFromBlobs()
- Логирование восстановления файлов из localStorage
- Проверка целостности данных
- Лог создания Blob/File объектов
- Сравнение размеров до/после

#### handleLoadDICOM()
- Логирование конвертации файлов в ArrayBuffer
- Проверка целостности данных при конвертации
- Лог сохранения в localStorage
- Лог установки состояния с файлами

### 3. Валидация DICOM файлов (CTModule.js)

#### Новая функция validateDicomFiles()
```javascript
validateDicomFiles(files) {
  // Проверяет:
  - File объекты (instanceof File)
  - Имя файла (не пустое)
  - Расширение (.dcm или .dicom)
  - Размер (не 0 байт)
  - Читаемость файла (первые 132 байта)

  // Возвращает:
  {
    valid: boolean,
    errors: string[],
    validFiles: File[]
  }
}
```

#### Интеграция валидации
- Вызов перед рендерингом DWVViewer
- Отображение детального списка ошибок при проблемах
- Блокировка передачи некорректных файлов в DWV

### 4. Улучшена обработка ошибок

#### DWV error handler
```javascript
// Формируется детальное сообщение:
'Не удалось обработать DICOM файлы\n' +
'Ошибка: ' + event.error + '\n' +
'Dетали: ' + event.detail + '\n' +
'Файл: ' + file.name + ' (' + file.size + ' bytes)'
```

#### Try-catch блоки
- Вокруг `app.loadFiles()`
- В обработчиках событий
- При создании File/Blob объектов
- При извлечении из ZIP

## Как использовать изменения для диагностики

### 1. Откройте консоль браузера
```
F12 или Ctrl+Shift+I (Cmd+Option+I на Mac)
Перейдите на вкладку Console
```

### 2. Загрузите ZIP архив
```
- Перетащите ZIP архив в область загрузки
- Нажмите "Открыть в просмотрщике"
```

### 3. Анализируйте логи
Используйте фильтры:
```
[DWV]          - Логи из DWVViewer.js
[CTModule]     - Логи из CTModule.js
[DWV] error    - Только ошибки DWV
[CTModule] error - Только ошибки CTModule
```

### 4. Пример успешной загрузки
```
[CTModule] Starting ZIP archive processing...
[CTModule] ZIP loaded. Total entries: 150
[CTModule] Extracting DICOM file: { name: "slice001.dcm", ... }
[CTModule] Blob created: { size: 524288, type: "" }
[CTModule] File object created: { name: "slice001.dcm", size: 524288, type: "application/dicom", ... }
[CTModule] Extraction complete. DICOM files found: 150
[CTModule] Loading DICOM into viewer. Files: 150
[DWV] Initializing DWV application...
[DWV] DWV initialized successfully
[DWV] Starting file load. Total files received: 150
[DWV] DICOM files to load: 150
[DWV] Calling app.loadFiles()...
[DWV] loadstart event...
[DWV] loadprogress: { progress: "0.67%" }
...
[DWV] load event...
[DWV] Metadata loaded: { PatientName: ..., StudyDate: ... }
```

### 5. Пример ошибки с диагностикой
```
[DWV] Starting file load. Total files received: 150
[DWV] DICOM files to load: 150
[DWV] Calling app.loadFiles()...
[DWV] ERROR event: {
  error: "Cannot read property 'length' of undefined",
  message: "Error loading DICOM file",
  detail: "Invalid file format"
}
[DWV] Final error message:
Не удалось обработать DICOM файлы
Ошибка: Cannot read property 'length' of undefined
Детали: Invalid file format
Файл: slice001.dcm (0 bytes)
```

## Ожидаемые результаты

### До исправлений
- ❌ Ошибка без детализации
- ❌ Нет информации о проблемном файле
- ❌ Нет логов процесса
- ❌ Трудно найти причину ошибки

### После исправлений
- ✅ Детальные логи каждого этапа
- ✅ Понятное сообщение об ошибке
- ✅ Информация о проблемном файле
- ✅ Валидация до передачи в DWV
- ✅ Прогресс загрузки с процентами
- ✅ Метаданные DICOM при успехе

## Возможные причины ошибок и их решение

### 1. File объекты после localStorage
**Признаки:** Файлы проходят валидацию, но DWV выдает ошибку при загрузке
**Решение:** Проверьте логи `[CTModule] File object reconstructed`. Сравните размер до/после.

### 2. Неверный MIME тип
**Признаки:** Ошибка "File is not a DICOM file" или similar
**Решение:** Убедитесь что `type: 'application/dicom'` установлен при создании File.

### 3. Файлы размером 0 байт
**Признаки:** В логах "Файл имеет размер 0 байт"
**Решение:** Проверьте целостность ZIP архива.

### 4. Поврежденные файлы
**Признаки:** Ошибка "Invalid file format" или "Cannot read DICOM"
**Решение:** Проверьте файлы в другом просмотрщике DICOM.

### 5. Неправильный порядок срезов
**Признаки:** DICOM загружается, но срезы в неправильном порядке
**Решение:** Проверьте имена файлов (должны сортироваться правильно).

## Дополнительная документация

См. подробный гайд по отладке:
- `frontend/src/components/DICOM_DEBUGGING.md`

## Обратная связь

Если проблема сохраняется после всех исправлений:
1. Соберите логи из консоли браузера
2. Сделайте скриншот Network tab (фильтр: blob:)
3. Сохраните скриншот сообщения об ошибке в UI
4. Предоставьте всю информацию для анализа
