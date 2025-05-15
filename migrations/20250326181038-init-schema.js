'use strict';

var dbm;
var type;
var seed;

exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db, callback) {
  // 1) CREATE TABLE users
  const createUsers = `
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('student','teacher','admin') NOT NULL DEFAULT 'student'
    )
  `;
  db.runSql(createUsers, function(err) {
    if (err) return callback(err);

    // 2) CREATE TABLE questions
    const createQuestions = `
      CREATE TABLE questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        question_text TEXT NOT NULL,
        question_type ENUM('multiple_choice','true_false','open_text') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    db.runSql(createQuestions, function(err2) {
      if (err2) return callback(err2);

      // 3) CREATE TABLE tests
      const createTests = `
        CREATE TABLE tests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          test_username VARCHAR(255) NOT NULL,
          duration INT NOT NULL,
          created_by INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `;
      db.runSql(createTests, function(err3) {
        if (err3) return callback(err3);

        // 4) INSERT в users
        const insertUsers = `
          INSERT INTO users (username, email, password, role)
          VALUES
            ('Teacher One','teacher1@example.com','1234','teacher'),
            ('Admin One','admin@example.com','1234','admin'),
            ('Student One','student1@example.com','1234','student');
        `;
        db.runSql(insertUsers, function(err4) {
          if (err4) return callback(err4);

          // 5) INSERT в questions
          const insertQuestions = `
            INSERT INTO questions (category, question_text, question_type)
            VALUES
              ('Програмиране','Какво е Node.js?','open_text'),
              ('Математика','Колко е 2+2?','multiple_choice'),
              ('Програмиране','JavaScript е...','true_false');
          `;
          db.runSql(insertQuestions, function(err5) {
            if (err5) return callback(err5);

            // 6) INSERT в tests
            const insertTests = `
              INSERT INTO tests (test_username, duration, created_by)
              VALUES ('Demo Test', 30, 2);
            `;
            db.runSql(insertTests, callback);
          });
        });
      });
    });
  });
};

exports.down = function(db, callback) {
  // При rollback трием таблиците
  const dropSql = `
    DROP TABLE IF EXISTS tests;
    DROP TABLE IF EXISTS questions;
    DROP TABLE IF EXISTS users;
  `;
  db.runSql(dropSql, callback);
};

exports._meta = {
  "version": 1
};
