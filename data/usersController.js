const fs = require('fs');
const path = require('path');

// Путь к файлу users.json
const USERS_PATH = path.join(__dirname, 'users.json');

app.post('/register', (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Проверка существования файла
        if (!fs.existsSync(USERS_PATH)) {
            fs.writeFileSync(USERS_PATH, '[]'); // Создаем файл, если его нет
        }

        // 2. Чтение данных
        const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));

        // 3. Проверка уникальности email
        if (users.some(u => u.email === email)) {
            return res.status(400).json({ error: 'Email уже занят' });
        }

        // 4. Добавление пользователя
        users.push({ email, password });

        // 5. Сохранение в файл
        fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));

        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});