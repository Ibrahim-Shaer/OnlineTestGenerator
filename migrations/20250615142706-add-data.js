'use strict';

const bcrypt = require('bcrypt');

exports.up = async function (db) {
  const hashedPassword = await bcrypt.hash('password123', 10);

  await db.insert('roles', ['id', 'name'], [
    [1, 'admin'],
    [2, 'student'],
    [3, 'teacher']
  ]);

  await db.insert('users', ['id', 'username', 'email', 'password', 'role_id'], [
    [1, 'Admin User', 'admin@admin.bg', hashedPassword, 1],
    [2, 'Student User', 'student@abv.bg', hashedPassword, 2],
    [3, 'Teacher User', 'teacher@abv.bg', hashedPassword, 3]
  ]);

  await db.insert('permissions', ['id', 'name'], [
    [1, 'create_test'],
    [2, 'delete_test'],
    [3, 'view_results'],
    [4, 'manage_users']
  ]);

  await db.insert('role_permissions', ['role_id', 'permission_id'], [
    [1, 1], [1, 2], [1, 3], [1, 4], // admin
    [2, 3],                        // student
    [3, 1], [3, 3]                 // teacher
  ]);

  await db.insert('category', ['id', 'name'], [
    [1, 'Математика'],
    [2, 'История'],
    [3, 'География']
  ]);
};

exports.down = async function (db) {
  await db.runSql('DELETE FROM role_permissions');
  await db.runSql('DELETE FROM permissions');
  await db.runSql('DELETE FROM users');
  await db.runSql('DELETE FROM roles');
  await db.runSql('DELETE FROM category');
};
