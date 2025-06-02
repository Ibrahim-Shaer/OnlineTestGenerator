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

exports.up = function (db, callback) {
  db.runSql(
    `
    CREATE TABLE test_answers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      test_id INT NOT NULL,
      question_id INT NOT NULL,
      student_id INT NOT NULL,
      answer_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_test_question_student (test_id, question_id, student_id),
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );
    `,
    callback
  );
};

exports.down = function (db, callback) {
  db.runSql('DROP TABLE IF EXISTS test_answers;', callback);
};

exports._meta = {
  "version": 1
};
