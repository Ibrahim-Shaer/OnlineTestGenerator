const pool = require('../config/db');
    

// Assign test to students
exports.assignTestToStudents = async (req, res) => {
  try {
    const { test_id, student_ids, start_time, end_time } = req.body;
    const assigned_by = req.session.user.id;

    if (!test_id || !student_ids || !Array.isArray(student_ids) || student_ids.length === 0 || !start_time || !end_time) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    for (const student_id of student_ids) {
      await pool.query(
        `INSERT INTO assigned_tests (test_id, student_id, assigned_by, start_time, end_time)
         VALUES (?, ?, ?, ?, ?)`,
        [test_id, student_id, assigned_by, start_time, end_time]
      );
    }

    res.json({ message: 'Test assigned successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get assigned tests for current student
exports.getAssignedTestsForStudent = async (req, res) => {
  try {
    const student_id = req.session.user.id;
    const [rows] = await pool.query(
      `SELECT at.*, t.title, t.description, t.duration
       FROM assigned_tests at
       JOIN tests t ON at.test_id = t.id
       WHERE at.student_id = ?`,
      [student_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get assigned tests by current teacher
exports.getAssignedTestsByTeacher = async (req, res) => {
  try {
    const assigned_by = req.session.user.id;
    const [rows] = await pool.query(
      `SELECT at.*, t.title, t.description, t.duration, u.username as student_username
       FROM assigned_tests at
       JOIN tests t ON at.test_id = t.id
       JOIN users u ON at.student_id = u.id
       WHERE at.assigned_by = ?`,
      [assigned_by]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get questions (with answers) for a given assigned test
exports.getTestQuestions = async (req, res) => {
  const test_id = req.params.testId;
  const student_id = req.session.user.id;

  try {
    // Check if the test is assigned to this student
    const [assigned] = await pool.query(
      'SELECT * FROM assigned_tests WHERE test_id = ? AND student_id = ?',
      [test_id, student_id]
    );
    if (!assigned.length) {
      return res.status(403).json({ message: 'Нямате достъп до този тест.' });
    }

    // Get questions for this test
    const [questions] = await pool.query(
      `SELECT q.id, q.question_text, q.question_type
       FROM questions q
       JOIN test_questions tq ON q.id = tq.question_id
       WHERE tq.test_id = ?`,
      [test_id]
    );

    // For each question, if it's multiple_choice, get the possible answers
    for (let q of questions) {
      if (q.question_type === 'multiple_choice') {
        const [answers] = await pool.query(
          'SELECT id, answer_text FROM answers WHERE question_id = ?',
          [q.id]
        );
        q.answers = answers;
      }
    }

    res.json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit answers for assigned test
exports.submitAssignedTest = async (req, res) => {
  const test_id = req.params.testId;
  const student_id = req.session.user.id;
  const { answers } = req.body;

  try {
    // Проверка дали тестът е възложен на този студент и не е вече завършен
    const [assigned] = await pool.query(
      'SELECT * FROM assigned_tests WHERE test_id = ? AND student_id = ? AND status = "assigned"',
      [test_id, student_id]
    );
    if (!assigned.length) {
      return res.status(403).json({ message: 'Нямате достъп или вече сте завършили този тест.' });
    }

    // Запис на отговорите (примерно в таблица test_answers)
    for (let ans of answers) {
      // ans: { question_id, answer }
      await pool.query(
        'INSERT INTO test_answers (test_id, question_id, student_id, answer_text) VALUES (?, ?, ?, ?)',
        [test_id, ans.question_id, student_id, ans.answer]
      );
    }

    // Маркирай теста като завършен
    await pool.query(
      'UPDATE assigned_tests SET status = "completed" WHERE test_id = ? AND student_id = ?',
      [test_id, student_id]
    );

    res.json({ message: 'Тестът е изпратен успешно!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
