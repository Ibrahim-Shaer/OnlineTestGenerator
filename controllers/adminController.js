const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Returns all users
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.username, u.email, u.role_id, r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id`
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Creates a new user
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: 'Липсват задължителни полета.' });
    }
    const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length > 0) {
      return res.status(400).json({ message: 'Този имейл вече съществува.' });
    }
    // Get role_id by name
    const [roleRows] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
    if (roleRows.length === 0) {
      return res.status(400).json({ message: 'Невалидна роля!' });
    }
    const role_id = roleRows[0].id;
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, email, password, role_id) VALUES (?, ?, ?, ?)', [username, email, hashedPassword, role_id]);
    res.json({ message: 'Потребителят е създаден успешно!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Edits a user
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, email, password, role } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Потребителят не е намерен.' });
    }
    let passwordToSave = users[0].password;
    if (password) {
      passwordToSave = await bcrypt.hash(password, 10);
    }
    // Get role_id by name
    const [roleRows] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
    if (roleRows.length === 0) {
      return res.status(400).json({ message: 'Невалидна роля!' });
    }
    const role_id = roleRows[0].id;
    await pool.query('UPDATE users SET username = ?, email = ?, password = ?, role_id = ? WHERE id = ?', [username, email, passwordToSave, role_id, userId]);
    res.json({ message: 'Потребителят е обновен успешно!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Deletes a user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'Потребителят е изтрит успешно!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Returns statistics for the admin panel
exports.getStats = async (req, res) => {
  try {
    // Get role_id for teacher and admin
    const [[teacherRole]] = await pool.query('SELECT id FROM roles WHERE name = "teacher"');
    const [[adminRole]] = await pool.query('SELECT id FROM roles WHERE name = "admin"');
    const [[users]] = await pool.query('SELECT COUNT(*) as cnt FROM users');
    const [[teachers]] = teacherRole ? await pool.query('SELECT COUNT(*) as cnt FROM users WHERE role_id = ?', [teacherRole.id]) : [{ cnt: 0 }];
    const [[admins]] = adminRole ? await pool.query('SELECT COUNT(*) as cnt FROM users WHERE role_id = ?', [adminRole.id]) : [{ cnt: 0 }];
    const [[categories]] = await pool.query('SELECT COUNT(*) as cnt FROM category');
    const [[questions]] = await pool.query('SELECT COUNT(*) as cnt FROM questions');
    const [[tests]] = await pool.query('SELECT COUNT(*) as cnt FROM tests');
    res.json({
      users: users.cnt,
      teachers: teachers.cnt,
      admins: admins.cnt,
      categories: categories.cnt,
      questions: questions.cnt,
      tests: tests.cnt
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Returns all roles
exports.getAllRoles = async (req, res) => {
  try {
    const [roles] = await pool.query('SELECT id, name FROM roles');
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 