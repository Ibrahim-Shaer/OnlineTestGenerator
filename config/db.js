const mysql = require('mysql2');

// Четем променливите от .env (пример)
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,       // localhost или IP
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: 10, // колко едновременни връзки
});

module.exports = pool.promise();
