// Подключаем установленные пакеты
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

// Создаем приложение
const app = express();
const PORT = 3000; // Порт, на котором будет работать наш сервер

// Middleware, которые нужны для работы
app.use(cors()); // Разрешает запросы с других доменов (с нашего сайта на GitHub Pages)
app.use(express.json()); // Позволяет серверу понимать JSON формат

// --- НАША ВЫМЫШЛЕННАЯ БАЗА ДАННЫХ ---
// В реальном проекте здесь будет подключение к настоящей БД (PostgreSQL, MySQL и т.д.)
const studentsDB = [
    {
        login: 'ivanov_ii',
        // Пароль '12345' в зашифрованном (хэшированном) виде. НИКОГДА не храните пароли в открытом виде!
        passwordHash: '$2a$10$tWb5Gj8s7.hf9Xo8ihiCq.SRGdBdJ2I.V3eGjfIZNPX3c/WGbQk5K',
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
        // Пароль 'qwerty' в зашифрованном виде
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
// ------------------------------------

// Создаем "ручку" (endpoint) для входа
app.post('/login', async (req, res) => {
    // Получаем логин и пароль из тела запроса, который пришлет наш сайт
    const { login, password } = req.body;

    // 1. Ищем студента в нашей "базе" по логину
    const student = studentsDB.find(s => s.login === login);

    if (!student) {
        // Если студент с таким логином не найден, отправляем ошибку 404 (Not Found)
        return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // 2. Сравниваем пароль, который ввел пользователь, с хэшем в "базе"
    // bcrypt.compare сама все сделает и вернет true (если пароли совпали) или false
    const isPasswordCorrect = await bcrypt.compare(password, student.passwordHash);

    if (!isPasswordCorrect) {
        // Если пароли не совпали, отправляем ошибку 401 (Unauthorized)
        return res.status(401).json({ message: 'Неверный пароль' });
    }

    // 3. Если все проверки пройдены, отправляем данные студента
    // Важно: отправляем только нужные данные, без хэша пароля!
    res.status(200).json(student.data);
});

// Запускаем сервер, чтобы он начал "слушать" запросы
app.listen(PORT, () => {
    console.log(`Сервер успешно запущен на http://localhost:${PORT}`);
});