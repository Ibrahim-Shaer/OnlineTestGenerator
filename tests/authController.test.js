// tests/authController.test.js
const authCtrl = require('../controllers/authController');
const pool = require('../config/db');
const bcrypt = require('bcrypt');

jest.mock('../config/db');
jest.mock('bcrypt');

describe('authController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, session: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    pool.query.mockReset();
    bcrypt.hash.mockReset();
    bcrypt.compare.mockReset();
  });

  describe('register', () => {
    it('400 ако имейлът вече съществува', async () => {
      req.body = { username:'u', email:'e', password:'p', role:'student' };
      pool.query
        .mockResolvedValueOnce([[{id:1}]])   // SELECT id FROM users
      await authCtrl.register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email already exists' });
    });

    it('400 ако ролята е невалидна', async () => {
      req.body = { username:'u', email:'e', password:'p', role:'bogus' };
      pool.query
        .mockResolvedValueOnce([[]])          // no existing user
        .mockResolvedValueOnce([[]]);         // no such role
      await authCtrl.register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Невалидна роля!' });
    });

    it('201 при успешна регистрация', async () => {
      req.body = { username:'u', email:'e', password:'p', role:'student' };
      pool.query
        .mockResolvedValueOnce([[]])          // no existing user
        .mockResolvedValueOnce([[{id:2}]])    // roleRows
        .mockResolvedValueOnce([{ /* insert returns nothing */ }])
        .mockResolvedValueOnce([[{ id:5, username:'u', email:'e', role_id:2, role_name:'student', avatar:null }]]);
      bcrypt.hash.mockResolvedValue('hashed');
      await authCtrl.register(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Registration successful' });
      expect(req.session.user).toMatchObject({ id:5, username:'u', email:'e', role_name:'student' });
    });

    it('500 при грешка в базата', async () => {
      req.body = { username:'u', email:'e', password:'p' };
      pool.query.mockRejectedValueOnce(new Error('db'));
      await authCtrl.register(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('login', () => {
    it('400 ако няма такъв имейл', async () => {
      req.body = { email:'e', password:'p' };
      pool.query.mockResolvedValueOnce([[]]);
      await authCtrl.login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });

    it('400 ако паролата не съвпада', async () => {
      req.body = { email:'e', password:'p' };
      pool.query.mockResolvedValueOnce([[{ password:'h', id:1, username:'u', role_id:2, role_name:'student', avatar:null }]]);
      bcrypt.compare.mockResolvedValue(false);
      await authCtrl.login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });

    it('200 при успешен вход', async () => {
      req.body = { email:'e', password:'p' };
      pool.query.mockResolvedValueOnce([[{ password:'h', id:1, username:'u', role_id:2, role_name:'student', avatar:null }]]);
      bcrypt.compare.mockResolvedValue(true);
      await authCtrl.login(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Login successful', role: 'student' });
      expect(req.session.user).toMatchObject({ id:1, username:'u', role_name:'student' });
    });

    it('500 при грешка в базата', async () => {
      req.body = { email:'e', password:'p' };
      pool.query.mockRejectedValueOnce(new Error('db'));
      await authCtrl.login(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('logout', () => {
    it('200 при успешно излизане', () => {
      req.session.destroy = jest.fn(cb => cb());
      authCtrl.logout(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
    it('500 при грешка в destroy', () => {
      req.session.destroy = jest.fn(cb => cb(new Error('err')));
      authCtrl.logout(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error while logging out' });
    });
  });

  describe('uploadAvatar', () => {
    it('401 ако не е логнат', async () => {
      req.session.user = null;
      await authCtrl.uploadAvatar(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not logged in' });
    });
    it('200 при успешно качване', async () => {
      req.session.user = { id:1 };
      req.file = { filename:'pic.png' };
      pool.query
        .mockResolvedValueOnce()  // UPDATE
        .mockResolvedValueOnce([[{ id:1, username:'u', role_id:2, role_name:'student', avatar:'/uploads/pic.png', email:'e' }]]);
      await authCtrl.uploadAvatar(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Avatar uploaded successfully',
        avatar: '/uploads/pic.png'
      });
      expect(req.session.user.avatar).toBe('/uploads/pic.png');
    });
    it('500 при грешка', async () => {
      req.session.user = { id:1 };
      req.file = { filename:'pic.png' };
      pool.query.mockRejectedValueOnce(new Error());
      await authCtrl.uploadAvatar(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('getAllStudents', () => {
    it('връща празен масив ако няма роля student', async () => {
        pool.query.mockResolvedValueOnce([[]]);
        await authCtrl.getAllStudents(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
       expect(res.json).toHaveBeenCalledWith([]);
      });
    it('200 и списък с потребители', async () => {
      pool.query
        .mockResolvedValueOnce([[{id:2}]])   // roleRows
        .mockResolvedValueOnce([[{id:3, username:'s', email:'e'}]]);
      await authCtrl.getAllStudents(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{id:3, username:'s', email:'e'}]);
    });
    it('500 при грешка', async () => {
      pool.query.mockRejectedValueOnce(new Error());
      await authCtrl.getAllStudents(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('updateProfile', () => {
    it('404 ако няма потребител', async () => {
      req.session.user = { id:1 };
      req.body = {};
      pool.query.mockResolvedValueOnce([[]]);
      await authCtrl.updateProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Потребителят не е намерен!' });
    });
    it('200 при успешна актуализация', async () => {
      req.session.user = { id:1 };
      req.body = { username:'u2', email:'e2', newPassword:'np' };
      pool.query
        .mockResolvedValueOnce([[{password:'old'}]])          // select user
        .mockResolvedValueOnce()                              // update
        .mockResolvedValueOnce([[{id:1, username:'u2', email:'e2', role_id:2, role_name:'student', avatar:null}]]);
      bcrypt.hash.mockResolvedValue('h2');
      await authCtrl.updateProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Данните са обновени успешно!' });
      expect(req.session.user.username).toBe('u2');
    });
    it('500 при грешка', async () => {
      req.session.user = { id:1 };
      pool.query.mockRejectedValueOnce(new Error());
      await authCtrl.updateProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Вътрешна грешка на сървъра!' });
    });
  });

  describe('status', () => {
    it('връща loggedIn=false ако няма сесия', () => {
      req.session.user = null;
      authCtrl.status(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ loggedIn: false });
    });
    it('връща loggedIn=true и потребител', () => {
      req.session.user = { id:1, username:'u', email:'e', avatar:null, role_id:2, role_name:'student' };
      authCtrl.status(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        loggedIn: true,
        user: req.session.user
      });
    });
  });
});
