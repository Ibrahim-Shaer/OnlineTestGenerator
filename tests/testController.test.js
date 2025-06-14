// tests/testController.test.js
const testCtrl = require('../controllers/testController');
const pool = require('../config/db');

jest.mock('../config/db');

describe('testController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, session: { user: { id: 5, role_name: 'teacher' } } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    pool.query.mockReset();
  });

  describe('createTest', () => {
    it('400 при липсващо заглавие или въпроси', async () => {
      req.body = { title: '', questions: [] };
      await testCtrl.createTest(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Липсва заглавие или въпроси!' });
    });

    it('200 при успешно създаване', async () => {
      req.body = { title: 'T', description: 'D', duration: 15, questions: [1,2] };
      pool.query
        .mockResolvedValueOnce([{ insertId: 10 }]) // INSERT INTO tests
        .mockResolvedValueOnce()                   // INSERT test_questions qid=1
        .mockResolvedValueOnce();                  // INSERT test_questions qid=2
      await testCtrl.createTest(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Тестът е създаден успешно!', testId: 10 });
    });

    it('500 при грешка в базата', async () => {
      req.body = { title: 'T', questions: [1] };
      pool.query.mockRejectedValueOnce(new Error('db'));
      await testCtrl.createTest(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('getAllTests', () => {
    const mockTests = [
      { id: 1, title: 'A', description: '', duration: 10, created_by: 5 }
    ];

    it('връща само собствените тестове за не-admin', async () => {
      // потребител е teacher (не е admin)
      pool.query
        .mockResolvedValueOnce([ mockTests ])        // SELECT tests WHERE created_by = 5
        .mockResolvedValueOnce([ [{ cnt: 2 }] ])    // COUNT(*) as cnt
        .mockResolvedValueOnce([ [] ]);              // assigned => празен масив
      await testCtrl.getAllTests(req, res);
      expect(res.json).toHaveBeenCalledWith([
        { ...mockTests[0], questionCount: 2, assignedTo: '-' }
      ]);
    });

    it('връща всички тестове за admin', async () => {
      req.session.user.role_name = 'admin';
      const all = [{ id: 2, title: 'B', description: 'x', duration: 5, created_by: 1 }];
      pool.query
        .mockResolvedValueOnce([ all ])              // SELECT * FROM tests
        .mockResolvedValueOnce([ [{ cnt: 1 }] ])    // COUNT(*) as cnt
        .mockResolvedValueOnce([ [{ username: 's' }] ]); // assigned => [{username:'s'}]
      await testCtrl.getAllTests(req, res);
      expect(res.json).toHaveBeenCalledWith([
        { ...all[0], questionCount: 1, assignedTo: 's' }
      ]);
    });

    it('500 при грешка', async () => {
      pool.query.mockRejectedValueOnce(new Error());
      await testCtrl.getAllTests(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('getTestQuestions', () => {
    it('200 и списък с въпроси', async () => {
      req.params = { id: 7 };
      const mockQs = [
        { id: 1, question_text: 'Q1', question_type: 'open_text' },
        { id: 2, question_text: 'Q2', question_type: 'multiple_choice' }
      ];
      pool.query
        .mockResolvedValueOnce([ mockQs ]); // SELECT q.id, ...
      await testCtrl.getTestQuestions(req, res);
      expect(res.json).toHaveBeenCalledWith(mockQs);
    });

    it('500 при грешка', async () => {
      req.params = { id: 7 };
      pool.query.mockRejectedValueOnce(new Error());
      await testCtrl.getTestQuestions(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });
});
