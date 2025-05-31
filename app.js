require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');


const authRoutes = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');


const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(session({
  secret: 'my_super_secret_key', 
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

// app.get('/auth/status', (req, res) => {
//   if (!req.session.user) {
//     return res.json({ loggedIn: false });
//   }
//   res.json({
//     loggedIn: true,
//     user: {
//       id: req.session.user.id,
//       username: req.session.user.username,
//       role: req.session.user.role,
//       avatar: req.session.user.avatar || null   
//     }
//   });
// });



// Стартираме сървъра(трябва да е най-отдолу)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});




