const pool = require('../config/db');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
    if (rows.length > 0) {
      return res.status(400).json({ message: 'User or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role || 'student']
    );
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
      role: user.role
    };

    // Пренасочваме според ролята
    if (user.role === 'admin') {
      // Ако е админ, пращаме го в adminPanel.html
      return res.redirect('/adminPanel.html');
    } else {
      // Ако е студент, пращаме го в профил (или друга страница)
      return res.redirect('/profile');
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
    // След като унищожим сесията, пренасочваме към login.html (или началната страница)
    res.redirect('/');
  });
};