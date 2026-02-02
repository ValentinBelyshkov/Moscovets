-- Откат миграции для расширенных полей пациента
-- Дата: 2025-02-02
-- ВНИМАНИЕ: Это удалит все данные в этих полях!

-- Удаление колонок для места регистрации
ALTER TABLE patients DROP COLUMN IF EXISTS registration_republic;
ALTER TABLE patients DROP COLUMN IF EXISTS registration_district;
ALTER TABLE patients DROP COLUMN IF EXISTS registration_city;
ALTER TABLE patients DROP COLUMN IF EXISTS registration_settlement;
ALTER TABLE patients DROP COLUMN IF EXISTS registration_street;
ALTER TABLE patients DROP COLUMN IF EXISTS registration_house;
ALTER TABLE patients DROP COLUMN IF EXISTS registration_apartment;
ALTER TABLE patients DROP COLUMN IF EXISTS registration_phone;

-- Удаление колонок для социально-демографических данных
ALTER TABLE patients DROP COLUMN IF EXISTS locality_type;
ALTER TABLE patients DROP COLUMN IF EXISTS marital_status;
ALTER TABLE patients DROP COLUMN IF EXISTS education_level;

-- Удаление колонок для кефалометрических данных
ALTER TABLE patients DROP COLUMN IF EXISTS cephalometry_zy_zy;
ALTER TABLE patients DROP COLUMN IF EXISTS cephalometry_n_me;
ALTER TABLE patients DROP COLUMN IF EXISTS cephalometry_n_sn;
ALTER TABLE patients DROP COLUMN IF EXISTS face_symmetric;
ALTER TABLE patients DROP COLUMN IF EXISTS chin_shift;
ALTER TABLE patients DROP COLUMN IF EXISTS mental_fold_pronounced;
ALTER TABLE patients DROP COLUMN IF EXISTS lips_closed;
ALTER TABLE patients DROP COLUMN IF EXISTS gummy_smile;
ALTER TABLE patients DROP COLUMN IF EXISTS profile_type;
ALTER TABLE patients DROP COLUMN IF EXISTS upper_lip_position;

-- Удаление ENUM типов (только если они не используются в других таблицах)
-- DROP TYPE IF EXISTS locality_type;
-- DROP TYPE IF EXISTS marital_status;
-- DROP TYPE IF EXISTS education_level;
-- DROP TYPE IF EXISTS profile_type;
-- DROP TYPE IF EXISTS lip_position;
-- DROP TYPE IF EXISTS chin_shift;

-- ПРИМЕЧАНИЕ: Удаление ENUM типов закомментировано, так как они могут использоваться
-- в других таблицах. Раскомментируйте только если вы уверены, что они больше не нужны.
