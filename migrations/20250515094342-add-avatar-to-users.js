'use strict';

var dbm;
var type;

exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
};

exports.up = function(db, callback) {
  db.addColumn('users', 'avatar', {
    type: 'string',
    length: 255,
    defaultValue: null
  }, callback);
};

exports.down = function(db, callback) {
  db.removeColumn('users', 'avatar', callback);
};

exports._meta = {
  "version": 1
};
