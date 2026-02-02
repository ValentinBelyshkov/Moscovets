# Документация по полям пациента

Это документ описывает все поля модели пациента в базе данных, включая новые поля для анкетных данных и кефалометрии.

## Основные поля

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | Integer | Да (auto) | Уникальный идентификатор пациента |
| `full_name` | String | Да | ФИО пациента (ФАМИЛИЯ ИМЯ ОТЧЕСТВО) |
| `birth_date` | Date | Да | Дата рождения (YYYY-MM-DD) |
| `gender` | Enum | Да | Пол: `male` (муж.), `female` (жен.), `other` |
| `contact_info` | String | Нет | Контактная информация |

## Дополнительные медицинские поля

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `complaints` | Text | Нет | Жалобы пациента |
| `medical_card_number` | String(50) | Нет | Номер медицинской карты (уникальное значение) |
| `address` | Text | Нет | Адрес пациента |
| `emergency_contact` | Text | Нет | Контакт для экстренных случаев |
| `insurance_info` | Text | Нет | Информация о страховке |

## 4. Место регистрации (Registration Address)

Все поля группы "Место регистрации" являются необязательными.

| Поле | Тип | Описание |
|------|-----|----------|
| `registration_republic` | String | Республика, край, область |
| `registration_district` | String | Район |
| `registration_city` | String | Город |
| `registration_settlement` | String | Населенный пункт |
| `registration_street` | String | Улица |
| `registration_house` | String | Дом |
| `registration_apartment` | String | Квартира |
| `registration_phone` | String | Телефон (например: +7 (999) 123-45-67) |

## 5. Местность (Locality Type)

| Поле | Тип | Возможные значения |
|------|-----|--------------------|
| `locality_type` | Enum | `urban` (городская), `rural` (сельская) |

## 6. Семейное положение (Marital Status)

| Поле | Тип | Возможные значения |
|------|-----|--------------------|
| `marital_status` | Enum | `registered_marriage` (зарегистрированный брак)<br>`unregistered_marriage` (незарегистрированный брак)<br>`not_married` (не состоит)<br>`unknown` (неизвестно) |

## 7. Образование (Education Level)

| Поле | Тип | Возможные значения |
|------|-----|--------------------|
| `education_level` | Enum | `higher` (высшее)<br>`incomplete_higher` (неполное высшее)<br>`secondary` (среднее полное)<br>`primary` (начальное)<br>`none` (не имеет)<br>`unknown` (неизвестно) |

## 19. Осмотр лица. Кефалометрия

### 19.1. Лицо анфас (Frontal Face)

| Поле | Тип | Описание |
|------|-----|----------|
| `cephalometry_zy_zy` | Float | Расстояние zy-zy в миллиметрах (ширина лица) |
| `cephalometry_n_me` | Float | Расстояние n-me в миллиметрах (высота лица) |
| `cephalometry_n_sn` | Float | Расстояние n-sn в миллиметрах (высота верхней части лица) |
| `face_symmetric` | Boolean | Симметричное лицо (true/false) |
| `chin_shift` | Enum | Смещение подбородка: `right` (вправо), `left` (влево), `none` (нет) |
| `mental_fold_pronounced` | Boolean | Выраженность надподбородочной складки (true/false) |
| `lips_closed` | Boolean | Губы сомкнуты (true/false) |
| `gummy_smile` | Boolean | Симптом «десневой улыбки» (true/false) |

### 19.2. Лицо в профиль (Profile Face)

| Поле | Тип | Возможные значения/Описание |
|------|-----|-----------------------------|
| `profile_type` | Enum | Тип профиля:<br>`convex` (выпуклый)<br>`concave` (вогнутый)<br>`straight` (прямой) |
| `upper_lip_position` | Enum | Положение верхней губы:<br>`protrudes` (выступает)<br>`recedes` (западает)<br>`correct` (правильное) |

## Временные метки

| Поле | Тип | Описание |
|------|-----|----------|
| `created_at` | DateTime | Дата и время создания записи (auto) |
| `updated_at` | DateTime | Дата и время последнего обновления (auto) |

## Примеры использования API

### Создание пациента с полными данными

```json
POST /api/v1/patients/
{
  "full_name": "Иванов Иван Иванович",
  "birth_date": "1985-05-15",
  "gender": "male",
  "contact_info": "+7 (999) 123-45-67",
  "registration_republic": "Московская область",
  "registration_city": "Москва",
  "registration_street": "Ленина",
  "registration_house": "10",
  "registration_apartment": "5",
  "registration_phone": "+7 (999) 123-45-67",
  "locality_type": "urban",
  "marital_status": "registered_marriage",
  "education_level": "higher",
  "cephalometry_zy_zy": 145.5,
  "cephalometry_n_me": 120.3,
  "cephalometry_n_sn": 65.7,
  "face_symmetric": true,
  "chin_shift": "none",
  "mental_fold_pronounced": false,
  "lips_closed": true,
  "gummy_smile": false,
  "profile_type": "straight",
  "upper_lip_position": "correct"
}
```

### Обновление только кефалометрических данных

```json
PUT /api/v1/patients/{patient_id}
{
  "cephalometry_zy_zy": 145.5,
  "cephalometry_n_me": 120.3,
  "cephalometry_n_sn": 65.7,
  "face_symmetric": true,
  "profile_type": "straight"
}
```

### Обновление адреса регистрации

```json
PUT /api/v1/patients/{patient_id}
{
  "registration_republic": "Санкт-Петербург",
  "registration_city": "Санкт-Петербург",
  "registration_street": "Невский проспект",
  "registration_house": "28",
  "registration_apartment": "15"
}
```

## Примечания

1. Все enum поля хранятся в базе данных в виде строк на английском языке
2. Все необязательные поля могут быть `null` в базе данных
3. При обновлении пациента можно передавать только те поля, которые нужно изменить
4. Дата рождения должна быть в формате ISO 8601: `YYYY-MM-DD`
5. Boolean поля могут быть `true`, `false` или `null`
6. Float поля используются для хранения измерений в миллиметрах с десятичными знаками

## Валидация

- `full_name`: обязательное, не может быть пустым
- `birth_date`: обязательное, должна быть валидная дата
- `gender`: обязательное, должно быть одно из значений: `male`, `female`, `other`
- `medical_card_number`: должно быть уникальным, если указано
- Все enum поля валидируются согласно допустимым значениям
- Float поля принимают числа с плавающей точкой
- Boolean поля принимают `true`, `false` или `null`
