-- Создание таблиц для Telegram бота аренды автомобилей

-- Таблица автомобилей
CREATE TABLE IF NOT EXISTS cars (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  stage VARCHAR(255),
  price_day VARCHAR(50),
  price_week VARCHAR(50),
  price_month VARCHAR(50),
  zalog VARCHAR(50),
  img TEXT[], -- массив изображений
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица бронирований
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  car_id INTEGER REFERENCES cars(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL,
  user_name VARCHAR(255),
  booking_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица арендованных автомобилей
CREATE TABLE IF NOT EXISTS used_cars (
  id SERIAL PRIMARY KEY,
  car_id INTEGER REFERENCES cars(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL,
  user_name VARCHAR(255),
  rental_duration VARCHAR(50), -- 'day', 'week', 'month'
  rental_term INTEGER, -- количество дней/недель/месяцев
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица для хранения индексов пользователей (для навигации по каталогу)
CREATE TABLE IF NOT EXISTS user_car_index (
  user_id BIGINT PRIMARY KEY,
  car_index INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_used_cars_user_id ON used_cars(user_id);
CREATE INDEX IF NOT EXISTS idx_used_cars_end_date ON used_cars(end_date);
CREATE INDEX IF NOT EXISTS idx_cars_available ON cars(is_available);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON cars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_car_index_updated_at BEFORE UPDATE ON user_car_index
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Вставка начальных данных из data.json
INSERT INTO cars (name, stage, price_day, price_week, price_month, zalog, img) VALUES
  ('Ferrari 348 GTB', 'База Скорость Баланс Скорость', '45.000', '240.000', '750.000', '40.000', ARRAY['Ferrari_348GTB_Stas.png']),
  ('Mazda RX-7', 'База Скорость Скорость Скорость', '25.000', '120.000', '300.000', '25.000', ARRAY['Mazda_RX-7_Stas.png']),
  ('Toyota Chaser', 'База Скорость Скорость Скорость', '15.000', '80.000', '250.000', '10.000', ARRAY['Toyota_Chaser_Stas.png']),
  ('Honda Civic Type R', 'База Скорость Скорость', '15.000', '70.000', '180.000', '15.000', ARRAY['Honda_Civic_Stas.png']),
  ('Mercedes 190e AMG', 'База Скорость Скорость Скорость', '30.000', '100.000', '350.000', '20.000', ARRAY['Mercedes_190e_AMG_Stas.png']),
  ('Chevrolet Tahoe', 'База Скорость Баланс', '25.000', '130.000', '380.000', '15.000', ARRAY['Сhevrolet_Tahoe_Stas.png']),
  ('ВАЗ 2107 VFTS', 'База Скорость  Скорость Скорость', '20.000', '120.000', '350.000', '20.000', ARRAY['Lada_VFTS_Stas.png']),
  ('Toyota Mark 2', 'База Скорость Скорость Скорость', '18.000', '120.000', '350.000', '15.000', ARRAY['Toyota_Mark2_Stas.png']),
  ('Nissan 200sx', 'База Скорость Скорость Скорость', '12.000', '70.000', '180.000', '15.000', ARRAY['Nissan_200sx_Stas.png']),
  ('BMW M6 (f13)', 'База Скорость', '25.000', '150.000', '500.000', '25.000', ARRAY['BMW_M6_Vanya.png']),
  ('Nissan Skyline r34', 'База Скорость Скорость ', '18.000', '80.000', '200.000', '20.000', ARRAY['Nissan_r34_Stas.png']),
  ('Subaru Impreza WRX STI', 'База Скорость Баланс', '20.000', '100.000', '300.000', '15.000', ARRAY['Subaru_impreza_Stas.png']),
  ('Nissan Skyline r32', 'База Скорость Скорость Скорость', '16.000', '100.000', '320.000', '15.000', ARRAY['Nissan_r32_Stas.png']),
  ('Ford Mustang Shelby GT-500', 'База Скорость', '30.000', '180.000', '500.000', '40.000', ARRAY['Ford_Mustang_Shelby_Lexa.png']),
  ('NissanGTR r34', 'База Скорость Скорость Скорость', '20.000', '85.000', '200.000', '20.000', ARRAY['Nissan_r34_Vanya.png']);
