-- Таблица отделов
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Таблица должностей
CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Таблица сотрудников
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    passport VARCHAR(20) NOT NULL, -- Серия/номер, строка для хранения маски
    contact_info VARCHAR(50),      -- Контактная информация
    address TEXT,                  -- Адрес проживания
    department_id INTEGER REFERENCES departments(id), -- Ссылка на отдел
    position_id INTEGER REFERENCES positions(id),     -- Ссылка на должность
    salary NUMERIC(10, 2),         -- Зарплата (число с копейками)
    hire_date DATE NOT NULL,       -- Дата принятия
    is_fired BOOLEAN DEFAULT FALSE -- Метка: уволен или нет
);

-- Добавим тестовые данные для проверки
INSERT INTO departments (name) VALUES ('IT'), ('HR'), ('Бухгалтерия');
INSERT INTO positions (name) VALUES ('Разработчик'), ('Менеджер'), ('Бухгалтер');

-- Добавим одного сотрудника для теста
INSERT INTO employees (full_name, birth_date, passport, contact_info, address, department_id, position_id, salary, hire_date)
VALUES ('Иванов Иван Иванович', '1990-01-15', '1234 567890', '+7 (999) 123-45-67', 'г. Москва, ул. Ленина, д. 1', 1, 1, 100000.00, '2023-01-10');