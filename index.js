const express = require('express');
const pool = require('./db');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json()); // чтобы приложение понимало JSON в запросах

// Маршрут: Получить всех сотрудников
app.get('/api/employees', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM employees');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Ошибка сервера');
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});