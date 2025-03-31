require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const validator = require('validator');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Enhanced Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
}));
app.use(express.json());
app.use(morgan('dev'));

// Constants
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '1h';

// Ensure data directory exists
(async () => {
  try {
    await fs.mkdir(path.join(__dirname, 'data'));
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
})();

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many auth attempts'
});

app.use('/auth/', authLimiter);
app.use('/api/', apiLimiter);

// Database Helper Functions
const readUsers = async () => {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(USERS_FILE, '[]', 'utf8');
      return [];
    }
    throw error;
  }
};

const saveUsers = async (users) => {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
};

// Email Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// JWT Functions
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
    { expiresIn: TOKEN_EXPIRY }
  );
};

// Auth Endpoints
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validator.isStrongPassword(password, { 
      minLength: 8, 
      minLowercase: 1, 
      minUppercase: 1, 
      minNumbers: 1, 
      minSymbols: 1 
    })) {
      return res.status(400).json({ error: 'Password does not meet requirements' });
    }

    const users = await readUsers();
    if (users.some(u => u.email === email)) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const verificationToken = uuidv4();
    
    const newUser = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      verified: false,
      verificationToken,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await saveUsers(users);

    // Send verification email
    const verificationUrl = `${process.env.BASE_URL}/verify-email?token=${verificationToken}`;
    await transporter.sendMail({
      from: `"Auth Service" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email',
      html: `Click <a href="${verificationUrl}">here</a> to verify your email.`
    });

    res.status(201).json({ 
      success: true,
      message: 'User registered. Please check your email for verification.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = await readUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.verified) {
      return res.status(403).json({ error: 'Email not verified' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);
    res.json({ 
      success: true,
      token,
      userId: user.id
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Password Recovery
app.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const users = await readUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resetToken = uuidv4();
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await saveUsers(users);

    const resetUrl = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;
    await transporter.sendMail({
      from: `"Auth Service" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Password Reset',
      html: `Click <a href="${resetUrl}">here</a> to reset your password.`
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify Email Endpoint
app.get('/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    const users = await readUsers();
    const user = users.find(u => u.verificationToken === token);

    if (!user) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    user.verified = true;
    user.verificationToken = null;
    await saveUsers(users);

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});