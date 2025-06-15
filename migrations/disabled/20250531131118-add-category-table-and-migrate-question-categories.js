'use strict';

var dbm;
var type;
var seed;
var fs = require('fs');
var path = require('path');
var Promise;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
  Promise = options.Promise;
};

exports.up = async function(db) {
  // 1. Drop tables if exist
  await db.runSql('DROP TABLE IF EXISTS questions;');
  await db.runSql('DROP TABLE IF EXISTS category;');

  // 2. Create category table
  await db.runSql(`
    CREATE TABLE category (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE
    );
  `);

  // 3. Create questions table
  await db.runSql(`
    CREATE TABLE questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_id INT NOT NULL,
      question_type ENUM('multiple_choice', 'true_false', 'open_text') NOT NULL,
      question_text TEXT NOT NULL,
      points INT NOT NULL DEFAULT 1,
      answers JSON DEFAULT NULL,
      correct JSON DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES category(id)
    );
  `);

  // 4. Insert categories and get their ids
  await db.runSql('DELETE FROM category;');
  await db.runSql(`INSERT INTO category (name) VALUES ('Математика'), ('История'), ('География');`);

  const allCatsRes = await db.runSql(`SELECT id, name FROM category WHERE name IN ('Математика', 'История', 'География')`);
  console.log('allCatsRes:', allCatsRes);

  let mathId = null, historyId = null, geoId = null;
  if (allCatsRes) {
    allCatsRes.forEach(row => {
      if (row.name === 'Математика') mathId = row.id;
      if (row.name === 'История') historyId = row.id;
      if (row.name === 'География') geoId = row.id;
    });
  }

  if (!mathId || !historyId || !geoId) {
    throw new Error('Някоя от категориите не е намерена! mathId=' + mathId + ', historyId=' + historyId + ', geoId=' + geoId);
  }

  const cat = {
    'Математика': mathId,
    'История': historyId,
    'География': geoId
  };

  // 5. Insert example questions
  // Множествен избор (верен: София)
  await db.runSql(`
    INSERT INTO questions (category_id, question_type, question_text, points, answers, correct)
    VALUES (?, 'multiple_choice', ?, 2, ?, ?)
  `, [
    cat['География'],
    'Коя е столицата на България?',
    JSON.stringify(["София", "Пловдив", "Варна", "Русе"]),
    JSON.stringify([0])
  ]);

  // Вярно/Грешно (верен: вярно)
  await db.runSql(`
    INSERT INTO questions (category_id, question_type, question_text, points, correct)
    VALUES (?, 'true_false', ?, 1, ?)
  `, [
    cat['Математика'],
    '5 + 5 = 10',
    JSON.stringify(true)
  ]);

  // Отворен отговор (верен: Васил Левски)
  await db.runSql(`
    INSERT INTO questions (category_id, question_type, question_text, points, correct)
    VALUES (?, 'open_text', ?, 3, ?)
  `, [
    cat['История'],
    'Кой е Апостолът на свободата?',
    JSON.stringify("Васил Левски")
  ]);
};

exports.down = async function(db) {
  await db.runSql('DROP TABLE IF EXISTS questions;');
  await db.runSql('DROP TABLE IF EXISTS category;');
};

exports._meta = {
  "version": 1
};
