const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

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
            fullName: student.full_name,
            course: student.course,
            group: student.group_name,
            specialty: student.specialty,
            enrollmentDate: student.enrollment_date
        };

        res.status(200).json(studentData);

    } catch (error) {
        console.error('Ошибка при входе:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер успешно запущен на порту ${PORT}`);
});