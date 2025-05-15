const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const multer = require('multer');
const path = require('path');

// Регистрация
router.post('/register', authController.register);
// Логин
router.post('/login', authController.login);
// Логаут (по избор)
router.get('/logout', authController.logout);

// authRoutes.js (или app.js)
router.get('/status', (req, res) => {
    if (!req.session.user) {
      return res.json({ loggedIn: false });
    }
    res.json({
      loggedIn: true,
      user: {
        id: req.session.user.id,
        username: req.session.user.username,
        role: req.session.user.role
        
      }
    });
  });
  
  // Настройка на multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.session.user.id}${ext}`);
  }
});
const upload = multer({ storage });

router.post('/upload-avatar', upload.single('avatar'), authController.uploadAvatar);

module.exports = router;
