require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');
const validator = require('validator');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();

// Конфигурация
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '1h';

// Middleware
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static('public'));

// Настройка Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`)
});
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    file.mimetype.startsWith('image/') 
      ? cb(null, true) 
      : cb(new Error('Только изображения!'));
  }
});

// Хелперы
const readUsers = async () => {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const saveUsers = async (users) => {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
};

// Роуты API
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!validator.isEmail(email)) 
      return res.status(400).json({ error: 'Некорректный email' });

    const users = await readUsers();
    if (users.some(u => u.email === email)) 
      return res.status(409).json({ error: 'Пользователь уже существует' });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      profile: {},
      publicUrl: uuidv4(),
      verified: true
    };

    await saveUsers([...users, newUser]);
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = await readUsers();
    const user = users.find(u => u.email === email);

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Неверные данные' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { 
      expiresIn: TOKEN_EXPIRY 
    });

    res.json({ token, publicUrl: user.publicUrl });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/profile', upload.single('avatar'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Требуется авторизация' });

    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const users = await readUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) return res.status(404).json({ error: 'Пользователь не найден' });

    users[userIndex].profile = {
      ...users[userIndex].profile,
      ...req.body,
      avatar: req.file?.filename || users[userIndex].profile.avatar
    };

    await saveUsers(users);
    res.json({ success: true, publicUrl: users[userIndex].publicUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/profile/:publicUrl', async (req, res) => {
  try {
    const users = await readUsers();
    const user = users.find(u => u.publicUrl === req.params.publicUrl);
    
    if (!user) return res.status(404).json({ error: 'Профиль не найден' });
    
    res.json({
      ...user.profile,
      avatar: user.profile.avatar ? `/uploads/${user.profile.avatar}` : null
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Отдача статических файлов
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});