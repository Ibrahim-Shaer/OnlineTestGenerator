// tests/adminController.test.js

const adminCtrl = require('../controllers/adminController');
const pool = require('../config/db');
const bcrypt = require('bcrypt');

jest.mock('../config/db');
jest.mock('bcrypt');

describe('AdminController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, session: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    pool.query.mockReset();
    bcrypt.hash.mockReset();
  });

  describe('getAllUsers', () => {
    it('връща списък с потребители (200)', async () => {
      const mockUsers = [{ id:1, username:'u', email:'e', role_id:2, role_name:'student' }];
      pool.query.mockResolvedValueOnce([mockUsers]);
      await adminCtrl.getAllUsers(req, res);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    it('500 при грешка в базата', async () => {
      pool.query.mockRejectedValueOnce(new Error());
      await adminCtrl.getAllUsers(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('createUser', () => {
    beforeEach(() => {
      req.body = { username:'u', email:'e', password:'p', role:'student' };
    });

    it('400 при липсващи полета', async () => {
      req.body = { username:'u' };
      await adminCtrl.createUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Липсват задължителни полета.' });
    });

    it('400 при дублиран имейл', async () => {
      pool.query.mockResolvedValueOnce([[{id:1}]]);
      await adminCtrl.createUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Този имейл вече съществува.' });
    });

    it('400 при невалидна роля', async () => {
      pool.query
        .mockResolvedValueOnce([[]])   // exists
        .mockResolvedValueOnce([[]]);  // roleRows
      await adminCtrl.createUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Невалидна роля!' });
    });

    it('200 при успешно създаване', async () => {
      pool.query
        .mockResolvedValueOnce([[]])           // exists
        .mockResolvedValueOnce([[{id:2}]])     // roleRows
        .mockResolvedValueOnce([{ insertId:5 }]); // insert
      bcrypt.hash.mockResolvedValue('h');
      await adminCtrl.createUser(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Потребителят е създаден успешно!' });
    });

    it('500 при грешка в базата', async () => {
      pool.query.mockRejectedValueOnce(new Error());
      await adminCtrl.createUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('updateUser', () => {
    beforeEach(() => {
      req.params.id = '1';
      req.body = { username:'u2', email:'e2', password:'np', role:'student' };
    });

    it('404 при несъществуващ потребител', async () => {
      pool.query.mockResolvedValueOnce([[]]);
      await adminCtrl.updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Потребителят не е намерен.' });
    });

    

    it('200 при успешно обновяване', async () => {
      pool.query
        .mockResolvedValueOnce([[{ password:'old' }]])   // select user
        .mockResolvedValueOnce([[{ id:2 }]])             // roleRows
        .mockResolvedValueOnce();                        // update
      bcrypt.hash.mockResolvedValue('h2');
      await adminCtrl.updateUser(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Потребителят е обновен успешно!' });
    });

    it('500 при грешка в базата', async () => {
      pool.query.mockRejectedValueOnce(new Error());
      await adminCtrl.updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('deleteUser', () => {
    it('200 при успешно изтриване', async () => {
      req.params.id = '1';
      pool.query.mockResolvedValueOnce();
      await adminCtrl.deleteUser(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Потребителят е изтрит успешно!' });
    });

    it('500 при грешка в базата', async () => {
      pool.query.mockRejectedValueOnce(new Error());
      await adminCtrl.deleteUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('getStats', () => {
    it('200 при успешно връщане на статистики', async () => {
      pool.query
        .mockResolvedValueOnce([[{ id:10 }]])   // teacherRole
        .mockResolvedValueOnce([[{ id:20 }]])   // adminRole
        .mockResolvedValueOnce([[{ cnt:5 }]])   // users
        .mockResolvedValueOnce([[{ cnt:2 }]])   // teachers
        .mockResolvedValueOnce([[{ cnt:1 }]])   // admins
        .mockResolvedValueOnce([[{ cnt:3 }]])   // categories
        .mockResolvedValueOnce([[{ cnt:4 }]])   // questions
        .mockResolvedValueOnce([[{ cnt:6 }]]);  // tests
      await adminCtrl.getStats(req, res);
      expect(res.json).toHaveBeenCalledWith({
        users:5, teachers:2, admins:1, categories:3, questions:4, tests:6
      });
    });

    it('500 при грешка в базата', async () => {
      pool.query.mockRejectedValueOnce(new Error());
      await adminCtrl.getStats(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('getAllRoles', () => {
    it('200 при успешно връщане на роли', async () => {
      const mockRoles = [{ id:1, name:'admin' }];
      pool.query.mockResolvedValueOnce([mockRoles]);
      await adminCtrl.getAllRoles(req, res);
      expect(res.json).toHaveBeenCalledWith(mockRoles);
    });

    it('500 при грешка в базата', async () => {
      pool.query.mockRejectedValueOnce(new Error());
      await adminCtrl.getAllRoles(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });
});
