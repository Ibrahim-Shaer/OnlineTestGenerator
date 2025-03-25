const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

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
        // може и email, ако искаш
      }
    });
  });
  
module.exports = router;
