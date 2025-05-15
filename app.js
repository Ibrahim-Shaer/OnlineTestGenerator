require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

// Импорт на роутове
const authRoutes = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');
// (ако имаш и други: testRoutes и т.н.)

const app = express();

// Парсване на JSON и URLENCODED данни от формите
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Инициализация на сесиите
app.use(session({
  secret: 'my_super_secret_key', // смени с реална тайна
  resave: false,
  saveUninitialized: false,
  cookie: {
    //maxAge: 1000 * 60 // пример: 1 minute
  }
}));

// Директория за статични файлове (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Роутове за автентикация (login, register, logout)
app.use('/auth', authRoutes);

// Роутове за въпроси
app.use('/questions', questionRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use('/uploads', express.static('uploads'));

// Примерен маршрут за профил (само ако си логнат)
app.get('/profile', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login.html');
  }
  res.send(`
    <h1>Здравей, ${req.session.user.username}!</h1>
    <p>Ти си в ролята: ${req.session.user.role}</p>
    <a href="/auth/logout">Изход</a>
  `);
});

app.get('/auth/status', (req, res) => {
  if (!req.session.user) {
    return res.json({ loggedIn: false });
  }
  res.json({
    loggedIn: true,
    user: {
      id: req.session.user.id,
      username: req.session.user.username,
      role: req.session.user.role,
      avatar: req.session.user.avatar || null   // 🟢 добави avatar
    }
  });
});



// Стартираме сървъра(трябва да е най-отдолу)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});




