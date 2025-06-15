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
  db.runSql(`
    ALTER TABLE questions
    ADD COLUMN category_id INT,
    ADD FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL
  `, callback);
};

exports.down = function (db, callback) {
  db.runSql(`
    ALTER TABLE questions
    DROP FOREIGN KEY questions_ibfk_1, -- може да е с друго име, виж с SHOW CREATE TABLE questions;
    DROP COLUMN category_id
  `, callback);
};

exports._meta = {
  "version": 1
};
