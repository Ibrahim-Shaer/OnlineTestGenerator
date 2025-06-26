const pool = require('../config/db');



// Creating a test with selected questions
exports.createTest = async (req, res) => {
  try {
    const { title, description, duration, questions } = req.body;
    const teacher_id = req.session.user.id;
    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Липсва заглавие или въпроси!' });
    }
    // 1. Create the test
    const [testResult] = await pool.query(
      'INSERT INTO tests (title, description, duration, created_by) VALUES (?, ?, ?, ?)',
      [title, description || '', duration || 30, teacher_id]
    );
    const testId = testResult.insertId;
    // 2. Connect the questions to the test (test_questions table)
    for (const qid of questions) {
      await pool.query('INSERT INTO test_questions (test_id, question_id) VALUES (?, ?)', [testId, qid]);
    }
    res.json({ message: 'Тестът е създаден успешно!', testId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Returns all tests for the current teacher or all (if admin)
exports.getAllTests = async (req, res) => {
  try {
    const user = req.session.user;
    let rows;
    if (user.role_id === 2) {
      [rows] = await pool.query('SELECT id, title, description, duration, created_by FROM tests');
    } else {
      [rows] = await pool.query('SELECT id, title, description, duration, created_by FROM tests WHERE created_by = ?', [user.id]);
    }
    // Add questionCount field (number of questions in the test)
    for (const test of rows) {
      const [qCount] = await pool.query('SELECT COUNT(*) as cnt FROM test_questions WHERE test_id = ?', [test.id]);
      test.questionCount = qCount[0].cnt;

      //  get the assigned students for this test
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

// Returns the questions for a given test
exports.getTestQuestions = async (req, res) => {
  try {
    const testId = req.params.id;
    const [questions] = await pool.query(
      `SELECT q.id, q.question_text, q.question_type
       FROM test_questions tq
       JOIN questions q ON tq.question_id = q.id
       WHERE tq.test_id = ?`,
      [testId]
    );
    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


  
