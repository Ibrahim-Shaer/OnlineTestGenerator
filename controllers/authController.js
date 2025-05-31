const pool = require('../config/db');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

// authController.js
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // 1) Проверка дали email или username съществуват (ако имаш колона username):
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // 2) Вмъкваме нов потребител
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(`
      INSERT INTO users (username, email, password, role)
      VALUES (?, ?, ?, ?)
    `, [username, email, hashedPassword, role || 'student']);

    // 3) При успех връщаме JSON
    res.json({ message: 'Registration successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Записваме потребителя в сесията
    req.session.user = {
      id: user.id,
      username: user.username,        
      role: user.role,
      avatar: user.avatar || null 
    };

    // Пренасочваме според ролята
    if (user.role === 'admin') {
      // Ако е админ, пращаме го в adminPanel.html
      return res.redirect('/adminPanel.html');
    } else if(user.role === 'student') {
      // Ако е студент, пращаме го в профил (или друга страница)
      return res.redirect('/profile');
    }
    else
    {
      //Ако е учител го пращаме директно на страницата с въпроси
      return res.redirect('/profile.html');
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error while logging out');
    }
    // След като унищожим сесията, пренасочваме към login.html 
    res.redirect('/');
  });
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });

    const avatarPath = '/uploads/' + req.file.filename;

    await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarPath, req.session.user.id]);

    
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
    if (rows.length > 0) {
      const user = rows[0];
      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        avatar: user.avatar || null
      };
    }

    // ЛОГ: какво има в сесията след upload
    console.log('Session after avatar upload:', req.session.user);

    res.json({ message: 'Avatar uploaded successfully', avatar: avatarPath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


