'use strict';

var dbm;
var type;
var seed;

exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};
console.log('Creating roles...');
exports.up = async function (db) {
  await db.runSql(`
    CREATE TABLE roles (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(50) NOT NULL UNIQUE
    );
  `);
  console.log('Creating permissions...');
  await db.runSql(`
    CREATE TABLE permissions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL UNIQUE
    );
  `);
  console.log('Creating role_permissions...');
  await db.runSql(`
    CREATE TABLE role_permissions (
      role_id INT NOT NULL,
      permission_id INT NOT NULL,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    );
  `);
};

exports.down = async function (db) {
  await db.runSql(`DROP TABLE role_permissions;`);
  await db.runSql(`DROP TABLE permissions;`);
  await db.runSql(`DROP TABLE roles;`);
};

exports._meta = {
  version: 1
};
