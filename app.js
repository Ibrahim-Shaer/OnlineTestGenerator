require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');


const authRoutes = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');
const testRoutes = require('./routes/testRoutes');

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

// Directory for static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Authentication routes (login, register, logout)
app.use('/auth', authRoutes);

// Routes for questions
app.use('/questions', questionRoutes);

// Routes for tests
app.use('/tests', testRoutes);

// Example profile route (only if logged in)
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



// Start the server 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});




