'use strict';

var dbm;
var type;
var seed;

exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db, callback) {
  db.runSql(
    `ALTER TABLE assigned_tests
      ADD COLUMN score INT DEFAULT 0,
      ADD COLUMN manual_reviewed BOOLEAN DEFAULT 0;`,
    callback
  );
};

exports.down = function (db, callback) {
  db.runSql(
    `ALTER TABLE assigned_tests
      DROP COLUMN score,
      DROP COLUMN manual_reviewed;`,
    callback
  );
};

exports._meta = {
  "version": 1
}; 