-- Миграция для добавления расширенных полей пациента
-- Дата: 2025-02-02
-- Описание: Добавление полей для места регистрации, социально-демографических данных и кефалометрии

-- Создание ENUM типов
DO $$ BEGIN
    CREATE TYPE locality_type AS ENUM ('urban', 'rural');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE marital_status AS ENUM ('registered_marriage', 'unregistered_marriage', 'not_married', 'unknown');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE education_level AS ENUM ('higher', 'incomplete_higher', 'secondary', 'primary', 'none', 'unknown');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE profile_type AS ENUM ('convex', 'concave', 'straight');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lip_position AS ENUM ('protrudes', 'recedes', 'correct');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE chin_shift AS ENUM ('right', 'left', 'none');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Добавление колонок для места регистрации
ALTER TABLE patients ADD COLUMN IF NOT EXISTS registration_republic VARCHAR;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS registration_district VARCHAR;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS registration_city VARCHAR;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS registration_settlement VARCHAR;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS registration_street VARCHAR;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS registration_house VARCHAR;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS registration_apartment VARCHAR;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS registration_phone VARCHAR;

-- Добавление колонок для социально-демографических данных
ALTER TABLE patients ADD COLUMN IF NOT EXISTS locality_type locality_type;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS marital_status marital_status;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS education_level education_level;

-- Добавление колонок для кефалометрических данных (лицо анфас)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS cephalometry_zy_zy FLOAT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS cephalometry_n_me FLOAT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS cephalometry_n_sn FLOAT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS face_symmetric BOOLEAN;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS chin_shift chin_shift;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS mental_fold_pronounced BOOLEAN;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS lips_closed BOOLEAN;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS gummy_smile BOOLEAN;

-- Добавление колонок для кефалометрических данных (лицо в профиль)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS profile_type profile_type;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS upper_lip_position lip_position;

-- Комментарии к таблице
COMMENT ON COLUMN patients.registration_republic IS 'Республика, край, область регистрации';
COMMENT ON COLUMN patients.registration_district IS 'Район регистрации';
COMMENT ON COLUMN patients.registration_city IS 'Город регистрации';
COMMENT ON COLUMN patients.registration_settlement IS 'Населенный пункт регистрации';
COMMENT ON COLUMN patients.registration_street IS 'Улица регистрации';
COMMENT ON COLUMN patients.registration_house IS 'Дом регистрации';
COMMENT ON COLUMN patients.registration_apartment IS 'Квартира регистрации';
COMMENT ON COLUMN patients.registration_phone IS 'Телефон регистрации';

COMMENT ON COLUMN patients.locality_type IS 'Тип местности: городская или сельская';
COMMENT ON COLUMN patients.marital_status IS 'Семейное положение';
COMMENT ON COLUMN patients.education_level IS 'Уровень образования';

COMMENT ON COLUMN patients.cephalometry_zy_zy IS 'Ширина лица (zy-zy) в миллиметрах';
COMMENT ON COLUMN patients.cephalometry_n_me IS 'Высота лица (n-me) в миллиметрах';
COMMENT ON COLUMN patients.cephalometry_n_sn IS 'Высота верхней части лица (n-sn) в миллиметрах';
COMMENT ON COLUMN patients.face_symmetric IS 'Симметричность лица';
COMMENT ON COLUMN patients.chin_shift IS 'Смещение подбородка';
COMMENT ON COLUMN patients.mental_fold_pronounced IS 'Выраженность надподбородочной складки';
COMMENT ON COLUMN patients.lips_closed IS 'Губы сомкнуты';
COMMENT ON COLUMN patients.gummy_smile IS 'Симптом десневой улыбки';
COMMENT ON COLUMN patients.profile_type IS 'Тип профиля: выпуклый, вогнутый, прямой';
COMMENT ON COLUMN patients.upper_lip_position IS 'Положение верхней губы: выступает, западает, правильное';
