const express = require('express');
const pool = require('./db');
const app = express();
const PORT = 3000;

app.use(express.json());

// --- 1. Получить всех сотрудников (с фильтрацией и поиском) ---
app.get('/api/employees', async (req, res) => {
    try {
        const { department_id, position_id, search } = req.query;
        
        // Начинаем формировать запрос. 
        // JOIN позволяет взять названия отдела и должности из других таблиц.
        let sql = `
            SELECT e.id, e.full_name, e.birth_date, e.passport, e.contact_info, 
                   e.address, e.salary, e.hire_date, e.is_fired,
                   d.name as department_name, 
                   p.name as position_name
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN positions p ON e.position_id = p.id
            WHERE 1=1
        `;
        
        const params = [];

        // Если передан отдел, добавляем фильтр
        if (department_id) {
            params.push(department_id);
            sql += ` AND e.department_id = $${params.length}`;
        }

        // Если передана должность, добавляем фильтр
        if (position_id) {
            params.push(position_id);
            sql += ` AND e.position_id = $${params.length}`;
        }

        // Если передан поиск по ФИО
        if (search) {
            params.push(`%${search}%`);
            sql += ` AND e.full_name ILIKE $${params.length}`;
        }

        const result = await pool.query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Ошибка сервера');
    }
});

// --- 2. Создать нового сотрудника ---
app.post('/api/employees', async (req, res) => {
    try {
        const { full_name, birth_date, passport, contact_info, address, department_id, position_id, salary, hire_date } = req.body;
        
        const sql = `
            INSERT INTO employees (full_name, birth_date, passport, contact_info, address, department_id, position_id, salary, hire_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
        `;
        
        const result = await pool.query(sql, [full_name, birth_date, passport, contact_info, address, department_id, position_id, salary, hire_date]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Ошибка сервера');
    }
});

// --- 3. Редактировать сотрудника ---
app.put('/api/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Сначала проверим, не уволен ли он
        const check = await pool.query('SELECT is_fired FROM employees WHERE id = $1', [id]);
        if (check.rows.length === 0) return res.status(404).send('Сотрудник не найден');
        
        if (check.rows[0].is_fired) {
            return res.status(403).json({ message: 'Нельзя редактировать уволенного сотрудника' });
        }

        const { full_name, birth_date, passport, contact_info, address, department_id, position_id, salary } = req.body;
        
        const sql = `
            UPDATE employees 
            SET full_name = $1, birth_date = $2, passport = $3, contact_info = $4, 
                address = $5, department_id = $6, position_id = $7, salary = $8
            WHERE id = $9 RETURNING *
        `;

        const result = await pool.query(sql, [full_name, birth_date, passport, contact_info, address, department_id, position_id, salary, id]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Ошибка сервера');
    }
});

// --- 4. Уволить сотрудника ---
app.put('/api/employees/:id/fire', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'UPDATE employees SET is_fired = true WHERE id = $1 RETURNING *';
        const result = await pool.query(sql, [id]);
        
        if (result.rows.length === 0) return res.status(404).send('Сотрудник не найден');
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Ошибка сервера');
    }
});

// --- Доп. маршрут: Получить списки отделов и должностей (для фильтров на фронтенде) ---
app.get('/api/departments', async (req, res) => {
    const result = await pool.query('SELECT * FROM departments ORDER BY name');
    res.json(result.rows);
});

app.get('/api/positions', async (req, res) => {
    const result = await pool.query('SELECT * FROM positions ORDER BY name');
    res.json(result.rows);
});


app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});