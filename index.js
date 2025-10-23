
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');


if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || 'your_default_super_secret_key';

app.use(cors());
app.use(express.json());

app.post('/login', async (req, res) => {
    const { login, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM students WHERE login = $1', [login]);
        const student = result.rows[0];
        if (!student) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        const isPasswordCorrect = await bcrypt.compare(password, student.password_hash);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Неверный пароль' });
        }
        const studentData = {
            fullName: student.full_name, course: student.course, group: student.group_name,
            specialty: student.specialty, enrollmentDate: student.enrollment_date,
            sessionSchedule: student.session_schedule, academicDebts: student.academic_debts
        };
        res.status(200).json(studentData);
    } catch (error) {
        console.error('Ошибка при входе студента:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});


app.post('/admin/login', async (req, res) => {
    const { login, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM admins WHERE login = $1', [login]);
        const admin = result.rows[0];
        if (!admin) {
            return res.status(404).json({ message: 'Администратор не найден' });
        }
        const isPasswordCorrect = await bcrypt.compare(password, admin.password_hash);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Неверный пароль' });
        }
        const token = jwt.sign({ adminId: admin.id }, JWT_SECRET, { expiresIn: '3h' });
        res.status(200).json({ token });
    } catch (error) {
        console.error('Ошибка при входе администратора:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Нет токена, авторизация отклонена' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Токен недействителен' });
    }
};

app.get('/api/students', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM students ORDER BY full_name ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении студентов' });
    }
});

app.post('/api/students', authMiddleware, async (req, res) => {
    const { login, password, fullName, course, group_name, specialty, enrollmentDate, sessionSchedule, academicDebts } = req.body;
    try {
        const password_hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO students (login, password_hash, full_name, course, group_name, specialty, enrollment_date, session_schedule, academic_debts)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [login, password_hash, fullName, course, group_name, specialty, enrollmentDate, sessionSchedule, academicDebts]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при добавлении студента' });
    }
});

app.put('/api/students/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { fullName, course, group_name, specialty, enrollmentDate, sessionSchedule, academicDebts } = req.body;
    try {
        const result = await pool.query(
            `UPDATE students SET full_name = $1, course = $2, group_name = $3, specialty = $4, enrollment_date = $5, session_schedule = $6, academic_debts = $7
             WHERE id = $8 RETURNING *`,
            [fullName, course, group_name, specialty, enrollmentDate, sessionSchedule, academicDebts, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при обновлении студента' });
    }
});

app.delete('/api/students/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM students WHERE id = $1', [id]);
        res.status(200).json({ message: 'Студент успешно удален' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при удалении студента' });
    }
});


app.listen(PORT, () => {
    console.log(`Сервер успешно запущен на порту ${PORT}`);
});