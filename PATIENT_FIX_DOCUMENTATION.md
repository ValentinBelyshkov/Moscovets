# Документация по исправлению функционала добавления пациентов

## Проблема
Функционал добавления новых пациентов не работал:
- При создании пациента данные добавлялись только в локальное состояние на фронтенде
- Нет запроса к API бэкенда
- Нет загрузки пациентов из базы данных
- Пациенты не сохранялись в БД

## Решение

### Изменения на фронтенде

#### 1. Создан сервис patientService.js
- **Расположение**: `frontend/src/services/patientService.js`
- **Функции**:
  - `getPatients()` - загрузка списка пациентов с сервера
  - `createPatient()` - создание нового пациента через API
  - `getPatientById()` - получение пациента по ID
  - `updatePatient()` - обновление данных пациента
  - `deletePatient()` - удаление пациента
- **Особенности**:
  - Все запросы включают заголовок Authorization с JWT токеном
  - Добавлены таймауты для предотвращения зависания
  - Обработка ошибок с информативными сообщениями

#### 2. Обновлен компонент PatientDirectory.js
- **Изменения**:
  - Удалены хардкодные данные пациентов
  - Добавлен useEffect для автоматической загрузки пациентов при монтировании
  - Обновлен handleSubmit для отправки данных на бэкенд
  - Добавлены состояния: loading, error для UX
  - Изменены имена полей для соответствия API:
    - `fullName` → `full_name`
    - `birthDate` → `birth_date`
    - `contactInfo` → `contact_info`
  - Добавлена кнопка "Обновить список"
  - Добавлен спиннер загрузки
  - Добавлено отображение ошибок
- **UI улучшения**:
  - Счетчик пациентов в заголовке
  - Сообщение при отсутствии пациентов
  - Улучшенное отображение пола (male → Мужской, female → Женский)

#### 3. Обновлен компонент PatientCard.js
- Поддержка обоих форматов полей для обратной совместимости:
  - API формат: `full_name`, `birth_date`, `gender`, `contact_info`, `created_at`
  - Старый формат: `fullName`, `birthDate`, `gender`, `contactInfo`, `lastVisit`

#### 4. Обновлен сервис authService.js
- Изменен на работу с реальным API вместо локальной симуляции
- Использует OAuth2 Password Flow (application/x-www-form-urlencoded)
- Сохраняет JWT токен в localStorage
- Добавлены таймауты и обработка ошибок

### Изменения на бэкенде

#### 1. Обновлен patients.py (API endpoints)
- **Расположение**: `backend/app/api/v1/endpoints/patients.py`
- **Изменения прав доступа**:
  - `create_patient`: `get_current_active_admin` → `get_current_active_user`
  - `update_patient`: `get_current_active_admin` → `get_current_active_user`
  - `delete_patient`: `get_current_active_admin` → `get_current_active_user`
- **Причина**: Позволить обычным пользователям управлять своими пациентами

#### 2. Обновлен init_db.py
- **Расположение**: `backend/app/db/init_db.py`
- **Добавлено**: Автоматическое создание админ-пользователя при инициализации
- **Учетные данные**:
  - Username: `admin`
  - Password: `admin123`
  - Role: `administrator`
  - Email: `admin@example.com`

## Как это работает

### 1. Вход в систему
1. Пользователь вводит логин/пароль в форме входа
2. authService отправляет POST запрос к `/api/v1/auth/login`
3. Бэкенд возвращает JWT токен
4. Токен сохраняется в localStorage

### 2. Просмотр списка пациентов
1. При загрузке компонента PatientDirectory
2. Автоматически вызывается `loadPatients()`
3. patientService делает GET запрос к `/api/v1/patients/`
4. Заголовок Authorization: `Bearer {token}`
5. Бэкенд возвращает список пациентов из БД
6. Данные отображаются в таблице

### 3. Создание пациента
1. Пользователь заполняет форму
2. Нажимает "Добавить пациента"
3. handleSubmit отправляет данные в `patientService.createPatient()`
4. POST запрос к `/api/v1/patients/` с данными:
   ```json
   {
     "full_name": "Иванов Иван Иванович",
     "birth_date": "1990-01-01",
     "gender": "male",
     "contact_info": "+7 (999) 123-45-67"
   }
   ```
5. Бэкенд сохраняет пациента в SQLite БД
6. Возвращает созданного пациента с ID
7. Фронтенд обновляет список пациентов

## API Endpoints

### Пациенты
- `GET /api/v1/patients/` - получить список пациентов
- `POST /api/v1/patients/` - создать пациента
- `GET /api/v1/patients/{id}` - получить пациента по ID
- `PUT /api/v1/patients/{id}` - обновить пациента
- `DELETE /api/v1/patients/{id}` - удалить пациента

### Аутентификация
- `POST /api/v1/auth/login` - получить токен
  - Тело: `username=admin&password=admin123`
  - Ответ: `{"access_token": "...", "token_type": "bearer"}`

## Требования к токену
Все запросы к API должны содержать заголовок:
```
Authorization: Bearer {access_token}
```

## Структура данных пациента

### Запрос (PatientCreate)
```typescript
{
  full_name: string;
  birth_date: string (ISO date);
  gender: 'male' | 'female' | 'other';
  contact_info?: string;
}
```

### Ответ (Patient)
```typescript
{
  id: number;
  full_name: string;
  birth_date: string (ISO date);
  gender: 'male' | 'female' | 'other';
  contact_info: string | null;
  created_at: string (ISO date);
  updated_at: string (ISO date);
}
```

## Учетные данные по умолчанию
- **Username**: `admin`
- **Password**: `admin123`

## Тестирование

### Тест 1: Создание пациента
1. Войти как `admin`/`admin123`
2. Перейти в директорию пациентов
3. Нажать "Добавить нового пациента"
4. Заполнить форму:
   - Имя: Тестовый Пациент
   - Дата рождения: 1995-05-10
   - Пол: Мужской
   - Контакты: +7 (900) 123-45-67
5. Нажать "Добавить пациента"
6. ✅ Пациент должен появиться в списке
7. ✅ Пациент должен иметь ID из БД

### Тест 2: Перезагрузка страницы
1. Создать пациента
2. Перезагрузить страницу
3. ✅ Пациент должен остаться в списке (проверка БД)

### Тест 3: Нажать "Открыть карту"
1. Выбрать пациента из списка
2. Нажать "Открыть карту"
3. ✅ Должна открыться карточка пациента с корректными данными

### Тест 4: Обновление списка
1. Добавить пациента через другой браузер/клиент
2. Нажать "Обновить список"
3. ✅ Новый пациент должен появиться

## Потенциальные проблемы и решения

### 1. Проблема: "Unauthorized" / 401
**Причина**: Токен истек или отсутствует
**Решение**: Выйти и войти заново

### 2. Проблема: "Превышено время ожидания"
**Причина**: Бэкенд не запущен
**Решение**: Запустить бэкенд: `cd backend && python main.py`

### 3. Проблема: CORS ошибка
**Причина**: Настройки CORS на бэкенде
**Решение**: Проверить `BACKEND_CORS_ORIGINS` в `backend/app/core/config.py`

### 4. Проблема: Пациент не создается, без ошибки
**Причина**: Ошибка валидации на бэкенде
**Решение**: Проверить консоль браузера и логи бэкенда

## Технологии
- Frontend: React 19, fetch API
- Backend: FastAPI, SQLAlchemy, Pydantic
- БД: SQLite
- Аутентификация: JWT (OAuth2 Password Flow)

## Файлы, затронутые изменениями
- `frontend/src/services/patientService.js` (новый)
- `frontend/src/components/PatientDirectory.js` (изменен)
- `frontend/src/components/PatientCard.js` (изменен)
- `frontend/src/services/authService.js` (изменен)
- `backend/app/api/v1/endpoints/patients.py` (изменен)
- `backend/app/db/init_db.py` (изменен)
