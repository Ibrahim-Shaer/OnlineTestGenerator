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
  console.log('Adding foreign key constraint from users.role_id to roles.id...');
  await db.runSql(`
    ALTER TABLE users
    ADD CONSTRAINT users_role_id_fk
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
  `);
};

exports.down = async function (db) {
  console.log('Dropping foreign key constraint from users.role_id...');
  await db.runSql(`ALTER TABLE users DROP FOREIGN KEY users_role_id_fk;`);
};

exports._meta = {
  version: 1
};
