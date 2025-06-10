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

    // Вземи role_id по име
    const [roleRows] = await pool.query('SELECT id FROM roles WHERE name = ?', [role || 'student']);
    if (roleRows.length === 0) {
      return res.status(400).json({ message: 'Невалидна роля!' });
    }
    const role_id = roleRows[0].id;

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(`
      INSERT INTO users (username, email, password, role_id)
      VALUES (?, ?, ?, ?)
    `, [username, email, hashedPassword, role_id]);

    
    res.json({ message: 'Registration successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query(
      `SELECT u.*, r.name as role_name, r.id as role_id
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.email = ?`, [email]);
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
      role_id: user.role_id,
      role_name: user.role_name,
      avatar: user.avatar || null,
      email: user.email
    };

    res.json({ message: 'Login successful', role: user.role_name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error while logging out' });
    }
    res.json({ success: true });
  });
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });

    const avatarPath = '/uploads/' + req.file.filename;

    await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarPath, req.session.user.id]);

    
    const [rows] = await pool.query(
      `SELECT u.*, r.name as role_name, r.id as role_id
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`, [req.session.user.id]);
    if (rows.length > 0) {
      const user = rows[0];
      req.session.user = {
        id: user.id,
        username: user.username,
        role_id: user.role_id,
        role_name: user.role_name,
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
    // Вземи role_id за student
    const [roleRows] = await pool.query('SELECT id FROM roles WHERE name = "student"');
    if (roleRows.length === 0) return res.json([]);
    const studentRoleId = roleRows[0].id;
    const [rows] = await pool.query(
      'SELECT id, username, email FROM users WHERE role_id = ?', [studentRoleId]
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

    // Вземи user с join към roles и презареди сесията
    const [rows2] = await pool.query(
      `SELECT u.*, r.name as role_name, r.id as role_id
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`, [userId]);
    if (rows2.length > 0) {
      const user = rows2[0];
      req.session.user = {
        id: user.id,
        username: user.username,
        role_id: user.role_id,
        role_name: user.role_name,
        avatar: user.avatar || null,
        email: user.email
      };
    }

    res.json({ message: 'Данните са обновени успешно!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Вътрешна грешка на сървъра!' });
  }
};

// Check status and return the current user
exports.status = (req, res) => {
  if (req.session && req.session.user) {
    const { id, username, email, avatar, role_id, role_name } = req.session.user;
    res.json({ loggedIn: true, user: { id, username, email, avatar, role_id, role_name } });
  } else {
    res.json({ loggedIn: false });
  }
};


