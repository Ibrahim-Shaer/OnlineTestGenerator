'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async function (db, callback) {
  // 1. Create the answers table (if it doesn't exist)
  await db.runSql(`
    CREATE TABLE IF NOT EXISTS answers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      question_id INT NOT NULL,
      answer_text VARCHAR(255) NOT NULL,
      is_correct BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );
  `);

  // 2. Get all questions with type multiple_choice
  const result = await db.runSql(`SELECT id, answers, correct FROM questions WHERE question_type = 'multiple_choice'`);
  const questions = result && result.length > 0 ? result : (result && result.rows ? result.rows : []);

  // 3. For each question, add the answers to the new table
  for (const q of questions) {
    if (!q.answers) continue;
    let answerArr;
    try {
      answerArr = JSON.parse(q.answers);
    } catch (e) {
      answerArr = [];
    }
    for (const ans of answerArr) {
      const isCorrect = (ans === q.correct) ? 1 : 0;
      await db.runSql(
        'INSERT INTO answers (question_id, answer_text, is_correct) VALUES (?, ?, ?);',
        [q.id, ans, isCorrect]
      );
    }
  }
  callback();
};

exports.down = function (db, callback) {
  db.runSql('DROP TABLE IF EXISTS answers;', callback);
};

exports._meta = {
  "version": 1
};
