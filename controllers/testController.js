const pool = require('../config/db');

exports.generateTest = async (req, res) => {
  try {
    const { category_id, questionCount } = req.body;
    const student_id = req.session.user.id;

    // 1. Случайно подбиране на въпроси
    const [questions] = await pool.query(
      `SELECT * FROM questions
       WHERE category_id = ?
       ORDER BY RAND()
       LIMIT ?`,
      [category_id, Number(questionCount)]
    );

    // 2. Създаваме запис в tests
    const start_time = new Date();
    const [testResult] = await pool.query(
      'INSERT INTO tests (student_id, category_id, start_time) VALUES (?, ?, ?)',
      [student_id, category_id, start_time]
    );
    const testId = testResult.insertId;

    // Връщаме на клиента списъка с въпроси (и отговори, ако е multiple_choice/true_false)
    // За да вземем отговорите:
    // for ... на всеки question => SELECT * FROM answers WHERE question_id = ?
    // но може и да го правим на фронтенд при нужда.

    // Ще върнем testId и самите въпроси, за да се визуализират
    res.json({ testId, questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.submitTestAnswers = async (req, res) => {
  try {
    const { testId, answers } = req.body; // answers може да е масив от {question_id, answer_text или answer_id}

    // 1. За всеки отговор записваме в test_answers
    for (let ans of answers) {
      // проверка дали е correct, ако е multiple_choice => сравняваме с answers.is_correct
      let isCorrect = false;
      // Примерна логика (ако имаме answer_id):
      if (ans.answer_id) {
        const [dbAnswer] = await pool.query('SELECT is_correct FROM answers WHERE id = ?', [ans.answer_id]);
        if (dbAnswer.length > 0 && dbAnswer[0].is_correct) {
          isCorrect = true;
        }
      }
      // Ако е отворен отговор, оставяме is_correct = null или false, за ръчно оценяване
      await pool.query(
        'INSERT INTO test_answers (test_id, question_id, student_answer, is_correct) VALUES (?, ?, ?, ?)',
        [testId, ans.question_id, ans.answer_text || ans.answer_id, isCorrect]
      );
    }

    // 2. Ъпдейтваме tests.end_time
    const end_time = new Date();
    await pool.query('UPDATE tests SET end_time = ? WHERE id = ?', [end_time, testId]);

    // 3. Изчисляваме резултата (само за затворени въпроси)
    const [correctCount] = await pool.query(
      `SELECT COUNT(*) as correct
       FROM test_answers
       WHERE test_id = ?
         AND is_correct = 1`,
      [testId]
    );
    const total = answers.length;
    const score = (correctCount[0].correct / total) * 100; // примерно изчисление

    await pool.query('UPDATE tests SET score = ? WHERE id = ?', [score, testId]);

    res.json({ message: 'Answers submitted', score });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTestResult = async (req, res) => {
  try {
    const testId = req.params.testId;
    // Връщаме резултата от tests + подробности, ако искаме
    const [[testData]] = await pool.query('SELECT * FROM tests WHERE id = ?', [testId]);
    if (!testData) {
      return res.status(404).json({ message: 'Test not found' });
    }
    // По желание, може да върнем и detailed answers
    const [answers] = await pool.query(
      `SELECT ta.*, q.question_text
       FROM test_answers ta
       JOIN questions q ON ta.question_id = q.id
       WHERE ta.test_id = ?`,
      [testId]
    );
    res.json({ test: testData, answers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
