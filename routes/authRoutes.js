const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const multer = require('multer');
const path = require('path');
const { isAuthenticated, isTeacherOrAdmin } = require('../middleware/auth');

// Registration
router.post('/register', authController.register);
// Login
router.post('/login', authController.login);
// Logout 
router.get('/logout', authController.logout);

router.get('/status', (req, res) => {
  // LOG: what is in the session at the status request
  console.log('Session in /status:', req.session.user);
  if (!req.session.user) {
    return res.json({ loggedIn: false });
  }
  res.json({
    loggedIn: true,
    user: {
      id: req.session.user.id,
      username: req.session.user.username,
      role: req.session.user.role,
      avatar: req.session.user.avatar || null
    }
  });
});
  

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.session.user.id}${ext}`);
  }
});
const upload = multer({ storage });

router.post('/upload-avatar', upload.single('avatar'), authController.uploadAvatar);

// Returns all students (only for teachers/admins)
router.get('/students', isAuthenticated, isTeacherOrAdmin, authController.getAllStudents);

module.exports = router;
