const qc = require('../controllers/questionController');
const pool = require('../config/db');

jest.mock('../config/db');

describe('questionController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, session: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    pool.query.mockReset();
  });

  describe('createQuestion', () => {
    it('201 при MC въпрос', async () => {
      req.session.user = { id: 1 };
      req.body = {
        category_id: 1,
        question_text: 'Q?',
        question_type: 'multiple_choice',
        points: 2,
        answers: [
          { answer_text: 'A1', is_correct: true },
          { answer_text: 'A2', is_correct: false },
        ],
      };
      pool.query
        .mockResolvedValueOnce([{ insertId: 10 }]) // INSERT question
        // Следващи два пъти за двата INSERT в answers
        .mockResolvedValueOnce()
        .mockResolvedValueOnce();
      await qc.createQuestion(req, res);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Въпросът е създаден успешно!',
        questionId: 10,
      });
    });

    it('201 при True/False въпрос', async () => {
      req.session.user = { id: 1 };
      req.body = {
        category_id: 1,
        question_text: 'QTF?',
        question_type: 'true_false',
        correct: 'Да',
      };
      pool.query
        .mockResolvedValueOnce([{ insertId: 20 }])
        .mockResolvedValueOnce(); // INSERT и за двата отговора
      await qc.createQuestion(req, res);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Въпросът е създаден успешно!',
        questionId: 20,
      });
    });

    it('500 при грешка в базата', async () => {
      pool.query.mockRejectedValueOnce(new Error('db error'));
      await qc.createQuestion(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('getAllQuestions', () => {
    it('връща списък с въпроси', async () => {
      const rows = [
        {
          id: 1,
          question_text: 'Q?',
          question_type: 'multiple_choice',
          category_id: 1,
          category_name: 'Cat',
        },
      ];
      pool.query.mockResolvedValueOnce([rows]);
      await qc.getAllQuestions(req, res);
      expect(res.json).toHaveBeenCalledWith(rows);
    });

    it('500 при грешка', async () => {
      pool.query.mockRejectedValueOnce(new Error());
      await qc.getAllQuestions(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('getQuestionById', () => {
    it('404 ако не съществува', async () => {
      req.params.id = 1;
      pool.query.mockResolvedValueOnce([[]]);
      await qc.getQuestionById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Question not found' });
    });

    it('200 и един въпрос', async () => {
      const question = { id: 1, question_text: 'Q?' };
      req.params.id = 1;
      pool.query.mockResolvedValueOnce([[question]]);
      await qc.getQuestionById(req, res);
      expect(res.json).toHaveBeenCalledWith(question);
    });

    it('500 при грешка', async () => {
      req.params.id = 1;
      pool.query.mockRejectedValueOnce(new Error());
      await qc.getQuestionById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('updateQuestion', () => {
    it('успешно обновяване MC въпрос', async () => {
      req.params.id = 1;
      req.body = {
        category_id: 2,
        question_text: 'Q updated?',
        question_type: 'multiple_choice',
        points: 3,
        answers: [
          { answer_text: 'A1', is_correct: false },
          { answer_text: 'A2', is_correct: true },
        ],
      };
      pool.query
        // UPDATE questions
        .mockResolvedValueOnce()
        // DELETE old answers
        .mockResolvedValueOnce()
        // INSERT new answers (две пъти)
        .mockResolvedValueOnce()
        .mockResolvedValueOnce();
      await qc.updateQuestion(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Въпросът е обновен успешно!' });
    });

    it('успешно обновяване TF въпрос', async () => {
      req.params.id = 1;
      req.body = {
        category_id: 2,
        question_text: 'TF?',
        question_type: 'true_false',
        correct: 'Не',
      };
      pool.query
        .mockResolvedValueOnce() // UPDATE questions
        .mockResolvedValueOnce() // DELETE answers
        .mockResolvedValueOnce(); // INSERT two answers in one query
      await qc.updateQuestion(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Въпросът е обновен успешно!' });
    });

    it('500 при грешка', async () => {
      req.params.id = 1;
      pool.query.mockRejectedValueOnce(new Error());
      await qc.updateQuestion(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('deleteQuestion', () => {
    it('успешно изтриване', async () => {
      req.params.id = 1;
      pool.query.mockResolvedValueOnce();
      await qc.deleteQuestion(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Question deleted' });
    });

    it('500 при грешка', async () => {
      req.params.id = 1;
      pool.query.mockRejectedValueOnce(new Error());
      await qc.deleteQuestion(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('getCategories', () => {
    it('връща списък с категории', async () => {
      const cats = [{ id: 1, name: 'C1' }];
      pool.query.mockResolvedValueOnce([cats]);
      await qc.getCategories(req, res);
      expect(res.json).toHaveBeenCalledWith(cats);
    });

    it('500 при грешка', async () => {
      pool.query.mockRejectedValueOnce(new Error());
      await qc.getCategories(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('getQuestions', () => {
    it('добавя answers към MC въпроси', async () => {
      const questions = [{ id: 1, question_type: 'multiple_choice' }];
      const answers = [{ id: 5, answer_text: 'Ans', is_correct: false }];
      pool.query
        .mockResolvedValueOnce([questions])
        .mockResolvedValueOnce([answers]);
      await qc.getQuestions(req, res);
      expect(res.json).toHaveBeenCalledWith([{ id: 1, question_type: 'multiple_choice', answers }]);
    });

    it('500 при грешка', async () => {
      pool.query.mockRejectedValueOnce(new Error());
      await qc.getQuestions(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('createCategory', () => {
    it('400 ако име е твърде късо', async () => {
      req.body.name = 'A';
      await qc.createCategory(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Името на категорията е твърде кратко.' });
    });

    it('400 при дублиране', async () => {
      req.body.name = 'Valid';
      pool.query.mockResolvedValueOnce([[{ id: 1 }]]);
      await qc.createCategory(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Тази категория вече съществува.' });
    });

    it('успешно създаване', async () => {
      req.body.name = 'ValidCat';
      pool.query
        .mockResolvedValueOnce([[]])            // проверка за съществуваща
        .mockResolvedValueOnce([{ insertId: 7 }]); // INSERT
      await qc.createCategory(req, res);
      expect(res.json).toHaveBeenCalledWith({ id: 7, name: 'ValidCat' });
    });

    it('500 при грешка', async () => {
      req.body.name = 'ValidCat';
      pool.query.mockRejectedValueOnce(new Error());
      await qc.createCategory(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Възникна грешка при създаване на категория.',
      });
    });
  });

  describe('getRandomQuestionsByCategory', () => {
    it('400 ако липсват параметри', async () => {
      req.query = {};
      await qc.getRandomQuestionsByCategory(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Липсва категория или брой.' });
    });

    it('400 ако недостатъчно въпроси', async () => {
      req.query = { category_id: '1', count: '5' };
      pool.query.mockResolvedValueOnce([[{ total: 2 }]]);
      await qc.getRandomQuestionsByCategory(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'В категорията има само 2 въпроса.',
      });
    });

    it('връща N въпроса', async () => {
      req.query = { category_id: '1', count: '2' };
      const questions = [{ id: 1 }, { id: 2 }];
      pool.query
        .mockResolvedValueOnce([[{ total: 5 }]]) // COUNT
        .mockResolvedValueOnce([questions]);
      await qc.getRandomQuestionsByCategory(req, res);
      expect(res.json).toHaveBeenCalledWith(questions);
    });

    it('500 при грешка', async () => {
      pool.query.mockRejectedValueOnce(new Error());
      await qc.getRandomQuestionsByCategory(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('updateCategory', () => {
    it('400 ако твърде кратко', async () => {
      req.params.id = 1;
      req.body.name = 'A';
      await qc.updateCategory(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Името на категорията е твърде кратко.' });
    });

    it('успешно обновяване', async () => {
      req.params.id = 1;
      req.body.name = 'NewName';
      pool.query.mockResolvedValueOnce();
      await qc.updateCategory(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Категорията е обновена успешно!' });
    });

    it('500 при грешка', async () => {
      req.params.id = 1;
      req.body.name = 'ValidName';
      pool.query.mockRejectedValueOnce(new Error());
      await qc.updateCategory(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Възникна грешка при редакция на категория.',
      });
    });
  });

  describe('deleteCategory', () => {
    it('успешно изтриване', async () => {
      req.params.id = 1;
      pool.query.mockResolvedValueOnce();
      await qc.deleteCategory(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Категорията е изтрита успешно!' });
    });

    it('500 при грешка', async () => {
      req.params.id = 1;
      pool.query.mockRejectedValueOnce(new Error());
      await qc.deleteCategory(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Възникна грешка при изтриване на категория.',
      });
    });
  });
});
