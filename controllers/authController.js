const pool = require('../config/db');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');


exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    //Checking if email is valid
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

  
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(`
      INSERT INTO users (username, email, password, role)
      VALUES (?, ?, ?, ?)
    `, [username, email, hashedPassword, role || 'student']);

    
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

    req.session.user = {
      id: user.id,
      username: user.username,        
      role: user.role,
      avatar: user.avatar || null,
      email: user.email
    };

    res.json({ message: 'Login successful', role: user.role });
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
    // After destroying the session, redirect to login.html
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
        avatar: user.avatar || null,
        email: user.email
      };
    }

    console.log('Session after avatar upload:', req.session.user);

    res.json({ message: 'Avatar uploaded successfully', avatar: avatarPath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Returns all students
exports.getAllStudents = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, email FROM users WHERE role = "student"'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { username, email, newPassword } = req.body;

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Потребителят не е намерен!' });
    }

    let passwordToSave = rows[0].password;
    if (newPassword) {
      passwordToSave = await bcrypt.hash(newPassword, 10);
    }

    await pool.query(
      'UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?',
      [username, email, passwordToSave, userId]
    );

    req.session.user.username = username;
    req.session.user.email = email;

    res.json({ message: 'Данните са обновени успешно!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Вътрешна грешка на сървъра!' });
  }
};


