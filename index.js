const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const studentsDB = [
    {
        login: 'ivanov_ii',
        passwordHash: '$2b$10$OJl8SCwt4NN6SGFJ3lmSr.OAIb5rKTTo7Dj33u6VVwxA13317O/7u',
        data: {
            fullName: 'Иванов Иван Иванович',
            course: 3,
            group: 'З-31ТП',
            specialty: 'Техническое обеспечение процессов сельскохозяйственного производства',
            enrollmentDate: '01.09.2021'
        }
    },
    {
        login: 'petrova_aa',
        passwordHash: '$2a$10$wAXx3aMy3kAN5i9I85xtpePqnsaU3bItiMTojZv0WpErqgJ5i4/Ay',
        data: {
            fullName: 'Петрова Анна Андреевна',
            course: 2,
            group: 'З-21БУ',
            specialty: 'Бухгалтерский учет, анализ и контроль',
            enrollmentDate: '01.09.2022'
        }
    }
];

app.post('/login', async (req, res) => {
        console.log('--- Получен новый запрос на /login ---');
    console.log('Тело запроса (req.body):', req.body);
    const { login, password } = req.body;
    const student = studentsDB.find(s => s.login === login);

    if (!student) {
        return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, student.passwordHash);

    console.log(`Сравнение пароля для логина "${login}": ${isPasswordCorrect ? 'УСПЕШНО' : 'НЕВЕРНО'}`);

    if (!isPasswordCorrect) {
        return res.status(401).json({ message: 'Неверный пароль' });
    }

    res.status(200).json(student.data);
});

app.listen(PORT, () => {
    console.log(`Сервер успешно запущен на http://localhost:${PORT}`);
});