'use strict';

var dbm;
var type;
var seed;

exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async function (db) {
  console.log('Adding role_id column...');
  await db.runSql(`ALTER TABLE users ADD COLUMN role_id INT;`);

  console.log('Inserting roles...');
  await db.runSql(`
    INSERT INTO roles (name) VALUES ('admin'), ('teacher'), ('student');
  `);

  console.log('Inserting permissions...');
  await db.runSql(`
    INSERT INTO permissions (name) VALUES
    ('manage_users'),
    ('manage_questions'),
    ('manage_tests'),
    ('view_statistics'),
    ('manage_categories');
  `);
};

exports.down = async function (db) {
  await db.runSql(`ALTER TABLE users DROP COLUMN role_id;`);
};

exports._meta = {
  version: 1
};
