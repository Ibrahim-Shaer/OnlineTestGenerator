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
    CREATE TABLE assigned_tests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      test_id INT NOT NULL,
      student_id INT NOT NULL,
      assigned_by INT NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      status ENUM('assigned', 'completed', 'expired') DEFAULT 'assigned',
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
    );
    `,
    callback
  );
};

exports.down = function (db, callback) {
  db.runSql('DROP TABLE IF EXISTS assigned_tests;', callback);
};

exports._meta = {
  "version": 1
};
