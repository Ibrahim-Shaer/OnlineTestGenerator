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
  db.runSql('DROP TABLE IF EXISTS test_answers;', function() {
    db.runSql('DROP TABLE IF EXISTS answers;', function() {
      db.runSql('DROP TABLE IF EXISTS test_questions;', function() {
        db.runSql('DROP TABLE IF EXISTS questions;', callback);
      });
    });
  });
};

exports.down = function (db, callback) {
  
};

exports._meta = { "version": 1 };
