const pool = require('../config/db');

//Generating a new test
exports.generateTest = async (req, res) => {
  try {
    const { category_id, questionCount } = req.body;
    const student_id = req.session.user.id;

    // 1. Randomly selecting questions
    const [questions] = await pool.query(
      `SELECT * FROM questions
       WHERE category_id = ?
       ORDER BY RAND()
       LIMIT ?`,
      [category_id, Number(questionCount)]
    );

    // 2. Creating a record in tests
    const start_time = new Date();
    const [testResult] = await pool.query(
      'INSERT INTO tests (student_id, category_id, start_time) VALUES (?, ?, ?)',
      [student_id, category_id, start_time]
    );
    const testId = testResult.insertId;

    
    res.json({ testId, questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

//Saving the answers
exports.submitTestAnswers = async (req, res) => {
  try {
    const { testId, answers } = req.body; //Getting testId and answers from body  
    // 1. For each answer, we write in test_answers
    for (let ans of answers) {
      // checking if it is correct, if it is multiple_choice => comparing with answers.is_correct
      let isCorrect = false;
      
      if (ans.answer_id) {
        const [dbAnswer] = await pool.query('SELECT is_correct FROM answers WHERE id = ?', [ans.answer_id]);
        if (dbAnswer.length > 0 && dbAnswer[0].is_correct) {
          isCorrect = true;
        }
      }
      // If it is open answer, we leave is_correct = null or false, for manual evaluation
      await pool.query(
        'INSERT INTO test_answers (test_id, question_id, student_answer, is_correct) VALUES (?, ?, ?, ?)',
        [testId, ans.question_id, ans.answer_text || ans.answer_id, isCorrect]
      );
    }

    // 2. Updating tests.end_time
    const end_time = new Date();
    await pool.query('UPDATE tests SET end_time = ? WHERE id = ?', [end_time, testId]);

    // 3. Calculating the result (only for closed questions)
    const [correctCount] = await pool.query(
      `SELECT COUNT(*) as correct
       FROM test_answers
       WHERE test_id = ?
         AND is_correct = 1`,
      [testId]
    );
    const total = answers.length;
    const score = (correctCount[0].correct / total) * 100; 
    await pool.query('UPDATE tests SET score = ? WHERE id = ?', [score, testId]);

    res.json({ message: 'Answers submitted', score });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

//Viewing the result
exports.getTestResult = async (req, res) => {
  try {
    const testId = req.params.testId;
    
    const [[testData]] = await pool.query('SELECT * FROM tests WHERE id = ?', [testId]);
    if (!testData) {
      return res.status(404).json({ message: 'Test not found' });
    }
   
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

// Създаване на тест с избрани въпроси
exports.createTest = async (req, res) => {
  try {
    const { title, description, duration, questions } = req.body;
    const teacher_id = req.session.user.id;
    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Липсва заглавие или въпроси!' });
    }
    // 1. Създай теста
    const [testResult] = await pool.query(
      'INSERT INTO tests (title, description, duration, created_by) VALUES (?, ?, ?, ?)',
      [title, description || '', duration || 30, teacher_id]
    );
    const testId = testResult.insertId;
    // 2. Свържи въпросите с теста (таблица test_questions)
    for (const qid of questions) {
      await pool.query('INSERT INTO test_questions (test_id, question_id) VALUES (?, ?)', [testId, qid]);
    }
    res.json({ message: 'Тестът е създаден успешно!', testId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Връща всички тестове за текущия учител или всички (ако е админ)
exports.getAllTests = async (req, res) => {
  try {
    const user = req.session.user;
    let rows;
    if (user.role === 'admin') {
      [rows] = await pool.query('SELECT id, title, description, duration, created_by FROM tests');
    } else {
      [rows] = await pool.query('SELECT id, title, description, duration, created_by FROM tests WHERE created_by = ?', [user.id]);
    }
    // Добавяме поле questionCount (брой въпроси в теста)
    for (const test of rows) {
      const [qCount] = await pool.query('SELECT COUNT(*) as cnt FROM test_questions WHERE test_id = ?', [test.id]);
      test.questionCount = qCount[0].cnt;

      // --- ДОБАВИ ТОВА: вземи възложените студенти за този тест
      const [assigned] = await pool.query(`
        SELECT u.username
        FROM assigned_tests at
        JOIN users u ON at.student_id = u.id
        WHERE at.test_id = ?
      `, [test.id]);
      test.assignedTo = assigned.length
        ? assigned.map(a => a.username).join(', ')
        : '-';
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
