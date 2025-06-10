const pool = require('../config/db');

exports.isTeacherOrAdmin = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  if (req.session.user.role_name !== 'admin' && req.session.user.role_name !== 'teacher') {
    return res.status(403).json({ message: 'Access denied, not a teacher or admin' });
  }
  next();
};

exports.isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
};

exports.isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role_name === 'admin') {
    return next();
  }
  return res.status(403).send('Access denied, only for admins.');
}

exports.hasPermission = (permission) => async (req, res, next) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not authenticated' });
  const userId = req.session.user.id;
  const [rows] = await pool.query(
    `SELECT 1 FROM users u
     JOIN roles r ON u.role_id = r.id
     JOIN role_permissions rp ON r.id = rp.role_id
     JOIN permissions p ON rp.permission_id = p.id
     WHERE u.id = ? AND p.name = ?`, [userId, permission]);
  if (rows.length === 0) return res.status(403).json({ message: 'Нямате права!' });
  next();
};


  