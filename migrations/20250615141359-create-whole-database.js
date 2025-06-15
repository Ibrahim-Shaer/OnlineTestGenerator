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
  db.createTable('roles', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    name: { type: 'string', notNull: true, unique: true }
  }, () => {
    db.createTable('permissions', {
      id: { type: 'int', primaryKey: true, autoIncrement: true },
      name: { type: 'string', notNull: true, unique: true }
    }, () => {
      db.createTable('role_permissions', {
        role_id: { type: 'int', notNull: true },
        permission_id: { type: 'int', notNull: true }
      }, () => {
        db.addForeignKey('role_permissions', 'roles', 'fk_role_permissions_role_id', {
          role_id: 'id'
        }, { onDelete: 'CASCADE' }, () => {
          db.addForeignKey('role_permissions', 'permissions', 'fk_role_permissions_permission_id', {
            permission_id: 'id'
          }, { onDelete: 'CASCADE' }, () => {

            db.createTable('users', {
              id: { type: 'int', primaryKey: true, autoIncrement: true },
              username: { type: 'string', notNull: true },
              email: { type: 'string', notNull: true, unique: true },
              password: { type: 'string', notNull: true },
              avatar: { type: 'string' },
              role_id: { type: 'int' }
            }, () => {
              db.addForeignKey('users', 'roles', 'fk_users_role_id', {
                role_id: 'id'
              }, { onDelete: 'SET NULL' }, () => {

                db.createTable('category', {
                  id: { type: 'int', primaryKey: true, autoIncrement: true },
                  name: { type: 'string', notNull: true }
                }, () => {

                  db.createTable('questions', {
                    id: { type: 'int', primaryKey: true, autoIncrement: true },
                    question_text: 'text',
                    question_type: { type: 'string', length: 50, notNull: true },
                    points: { type: 'int', notNull: true },
                    category_id: { type: 'int' }
                  }, () => {
                    db.addForeignKey('questions', 'category', 'fk_questions_category_id', {
                      category_id: 'id'
                    }, {}, () => {

                      db.createTable('answers', {
                        id: { type: 'int', primaryKey: true, autoIncrement: true },
                        question_id: { type: 'int', notNull: true },
                        answer_text: 'text',
                        is_correct: { type: 'boolean', notNull: true, defaultValue: false }
                      }, () => {
                        db.addForeignKey('answers', 'questions', 'fk_answers_question_id', {
                          question_id: 'id'
                        }, { onDelete: 'CASCADE' }, () => {

                          db.createTable('tests', {
                            id: { type: 'int', primaryKey: true, autoIncrement: true },
                            title: { type: 'string', notNull: true },
                            description: 'text',
                            duration: 'int',
                            created_by: { type: 'int' },
                            created_at: { type: 'datetime', defaultValue: new Date() }
                          }, () => {
                            db.addForeignKey('tests', 'users', 'fk_tests_created_by', {
                              created_by: 'id'
                            }, {}, () => {

                              db.createTable('test_questions', {
                                id: { type: 'int', primaryKey: true, autoIncrement: true },
                                test_id: { type: 'int', notNull: true },
                                question_id: { type: 'int', notNull: true }
                              }, () => {
                                db.addForeignKey('test_questions', 'tests', 'fk_test_questions_test_id', {
                                  test_id: 'id'
                                }, {}, () => {
                                  db.addForeignKey('test_questions', 'questions', 'fk_test_questions_question_id', {
                                    question_id: 'id'
                                  }, {}, () => {

                                    db.createTable('assigned_tests', {
                                      id: { type: 'int', primaryKey: true, autoIncrement: true },
                                      test_id: { type: 'int', notNull: true },
                                      student_id: { type: 'int', notNull: true },
                                      assigned_by: { type: 'int', notNull: true },
                                      start_time: 'datetime',
                                      end_time: 'datetime',
                                      status: { type: 'string', length: 20, notNull: true },
                                      score: 'int',
                                      manual_reviewed: { type: 'boolean', defaultValue: false }
                                    }, () => {
                                      db.addForeignKey('assigned_tests', 'tests', 'fk_assigned_tests_test_id', {
                                        test_id: 'id'
                                      }, {}, () => {
                                        db.addForeignKey('assigned_tests', 'users', 'fk_assigned_tests_student_id', {
                                          student_id: 'id'
                                        }, {}, () => {
                                          db.addForeignKey('assigned_tests', 'users', 'fk_assigned_tests_assigned_by', {
                                            assigned_by: 'id'
                                          }, {}, callback);
                                        });
                                      });
                                    });

                                  });
                                });
                              });

                            });
                          });

                        });
                      });

                    });
                  });

                });

              });
            });

          });
        });
      });
    });
  });
};

exports.down = function (db, callback) {
  db.dropTable('assigned_tests', () => {
    db.dropTable('test_questions', () => {
      db.dropTable('tests', () => {
        db.dropTable('answers', () => {
          db.dropTable('questions', () => {
            db.dropTable('category', () => {
              db.dropTable('users', () => {
                db.dropTable('role_permissions', () => {
                  db.dropTable('permissions', () => {
                    db.dropTable('roles', callback);
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};


exports._meta = {
  "version": 1
};
