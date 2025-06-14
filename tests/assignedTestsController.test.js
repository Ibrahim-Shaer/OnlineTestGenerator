
const atc = require('../controllers/assignedTestsController');
const pool = require('../config/db');

jest.mock('../config/db');

describe('assignedTestsController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, session: { user: { id: 1, role_name: 'teacher' } } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    pool.query.mockReset();
  });

  describe('assignTestToStudents', () => {
    it('400 при липсващи полета', async () => {
      req.body = {};
      await atc.assignTestToStudents(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing required fields.' });
    });
    it('успешно възлагане', async () => {
      req.body = { test_id: 5, student_ids: [2,3], start_time: '2025-01-01', end_time: '2025-01-02' };
      pool.query.mockResolvedValueOnce(); // first INSERT
      pool.query.mockResolvedValueOnce(); // second INSERT
      await atc.assignTestToStudents(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Test assigned successfully.' });
    });
    it('500 при грешка в базата', async () => {
      req.body = { test_id: 5, student_ids: [2], start_time: 'a', end_time: 'b' };
      pool.query.mockRejectedValueOnce(new Error());
      await atc.assignTestToStudents(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('getAssignedTestsForStudent', () => {
    it('200 връща масив с тестове', async () => {
      const mock = [{id:1,title:'T',description:'D',duration:10,max_score:100}];
      pool.query.mockResolvedValueOnce([mock]);
      await atc.getAssignedTestsForStudent(req, res);
      expect(res.json).toHaveBeenCalledWith(mock);
    });
    it('500 при грешка', async () => {
      pool.query.mockRejectedValueOnce(new Error());
      await atc.getAssignedTestsForStudent(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('getAssignedTestsByTeacher', () => {
    it('200 връща задачени тестове', async () => {
      const mock = [{id:1,student_username:'s',title:'T'}];
      pool.query.mockResolvedValueOnce([mock]);
      await atc.getAssignedTestsByTeacher(req, res);
      expect(res.json).toHaveBeenCalledWith(mock);
    });
    it('500 при грешка', async () => {
      pool.query.mockRejectedValueOnce(new Error());
      await atc.getAssignedTestsByTeacher(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('getTestQuestions', () => {
    beforeEach(() => {
      req.params.assignedId = '7';
      req.session.user.id = 2;
    });
    it('403 ако няма достъп', async () => {
      pool.query.mockResolvedValueOnce([[]]); // assigned_tests SELECT
      await atc.getTestQuestions(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Нямате достъп до този тест.' });
    });
    it('200 връща въпроси и duration', async () => {
      pool.query
        .mockResolvedValueOnce([[{test_id:99}]])      // assigned_tests
        .mockResolvedValueOnce([[{duration:15}]])    // tests duration
        .mockResolvedValueOnce([[{id:5,question_text:'Q',question_type:'multiple_choice'}]]) // questions
        .mockResolvedValueOnce([[{id:10,answer_text:'A'}]]);                              // answers
      await atc.getTestQuestions(req, res);
      expect(res.json).toHaveBeenCalledWith({
        questions: [{ id:5, question_text:'Q', question_type:'multiple_choice', answers:[{id:10,answer_text:'A'}] }],
        assigned: expect.objectContaining({ test_id:99, duration:15 })
      });
    });
    it('500 при грешка', async () => {
      pool.query.mockRejectedValueOnce(new Error());
      await atc.getTestQuestions(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('submitAssignedTest', () => {
    beforeEach(() => {
      req.params.assignedId = '7';
      req.session.user.id = 2;
      req.body.answers = [{ question_id:5, answer:'X' }];
    });
    it('403 ако няма достъп или е завършен', async () => {
      pool.query.mockResolvedValueOnce([[]]); // assigned_tests SELECT
      await atc.submitAssignedTest(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Нямате достъп или вече сте завършили този тест.' });
    });
    it('успешно автоматично оценяване', async () => {
      pool.query
        .mockResolvedValueOnce([[{test_id:5}]])   // assigned_tests
        .mockResolvedValueOnce([[{id:5,question_type:'true_false',points:2}]]) // questions
        .mockResolvedValueOnce([[{answer_text:'X'}]]) // correctAnswers
        .mockResolvedValueOnce()                     // INSERT test_answers
        .mockResolvedValueOnce()                     // UPDATE assigned_tests
      await atc.submitAssignedTest(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Тестът е изпратен успешно!' });
    });
    it('500 при грешка', async () => {
      pool.query.mockRejectedValueOnce(new Error());
      await atc.submitAssignedTest(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('getAssignedTestReview', () => {
    it('404 ако няма задача', async () => {
      req.params.assignedId = '9';
      pool.query.mockResolvedValueOnce([[]]);
      await atc.getAssignedTestReview(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Assigned test not found' });
    });
    it('200 връща преглед', async () => {
      const assigned = { test_id:5, student_id:2 };
      const q = [{ id:1, question_text:'Q', question_type:'open_text', answer_text:'Ans', answer_text_display:'Ans' }];
      pool.query
        .mockResolvedValueOnce([[assigned]])   // assignment
        .mockResolvedValueOnce([q]);           // questions+answers
      await atc.getAssignedTestReview(req, res);
      expect(res.json).toHaveBeenCalledWith({ assigned, questions: q });
    });
    it('500 при грешка', async () => {
      pool.query.mockRejectedValueOnce(new Error());
      await atc.getAssignedTestReview(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('manualReviewAssignedTest', () => {
    beforeEach(() => {
      req.params.assignedId = '7';
      req.body.openScores = [{ question_id:5, points:3 }];
    });
    it('404 ако няма задача', async () => {
      pool.query.mockResolvedValueOnce([[]]);
      await atc.manualReviewAssignedTest(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Assigned test not found' });
    });
    it('успешно ръчно оценяване', async () => {
      pool.query
        .mockResolvedValueOnce([[{ }]])   // select assignment
        .mockResolvedValueOnce()          // UPDATE assigned_tests
      await atc.manualReviewAssignedTest(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Оценката е записана успешно!' });
    });
    it('500 при грешка', async () => {
      pool.query.mockRejectedValueOnce(new Error());
      await atc.manualReviewAssignedTest(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });
});
