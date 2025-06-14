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
      `SELECT at.*, t.title, t.description, t.duration,
        (SELECT SUM(q.points) FROM test_questions tq JOIN questions q ON tq.question_id = q.id WHERE tq.test_id = at.test_id) as max_score
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
// Get questions (with answers) for a given assigned test
exports.getTestQuestions = async (req, res) => {
  const assigned_id = req.params.assignedId;
  const student_id = req.session.user.id;

  try {
    const [assigned] = await pool.query(
      'SELECT * FROM assigned_tests WHERE id = ? AND student_id = ?',
      [assigned_id, student_id]
    );
    if (!assigned.length) {
      return res.status(403).json({ message: 'Нямате достъп до този тест.' });
    }

    const test_id = assigned[0].test_id;

    // 🔥 Get test meta (includes duration)
    const [testMeta] = await pool.query(
      'SELECT duration FROM tests WHERE id = ?',
      [test_id]
    );

    const [questions] = await pool.query(
      `SELECT q.id, q.question_text, q.question_type
       FROM questions q
       JOIN test_questions tq ON q.id = tq.question_id
       WHERE tq.test_id = ?`,
      [test_id]
    );

    for (let q of questions) {
      if (q.question_type === 'multiple_choice') {
        const [answers] = await pool.query(
          'SELECT id, answer_text FROM answers WHERE question_id = ?',
          [q.id]
        );
        q.answers = answers;
      }
    }

    // 🔁 Добавяме duration в `assigned`
    const responseAssigned = {
      ...assigned[0],
      duration: testMeta[0]?.duration || 0,
    };

    res.json({ questions, assigned: responseAssigned });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit answers for assigned test
exports.submitAssignedTest = async (req, res) => {
  const assigned_id = req.params.assignedId;
  const student_id = req.session.user.id;
  const { answers } = req.body;

  try {
    // Get the specific assignment
    const [assigned] = await pool.query(
      'SELECT * FROM assigned_tests WHERE id = ? AND student_id = ? AND status = "assigned"',
      [assigned_id, student_id]
    );
    if (!assigned.length) {
      return res.status(403).json({ message: 'Нямате достъп или вече сте завършили този тест.' });
    }

    const test_id = assigned[0].test_id;

    // Get all questions for this test
    const [questions] = await pool.query(
      `SELECT q.id, q.question_type, q.points
       FROM questions q
       JOIN test_questions tq ON q.id = tq.question_id
       WHERE tq.test_id = ?`,
      [test_id]
    );

    let autoScore = 0;

    for (let ans of answers) {
      const q = questions.find(q => q.id == ans.question_id);
      if (!q) continue;

      if (q.question_type === 'multiple_choice') {
        // ans.answer must be the ID of the answer
        const [correctAnswers] = await pool.query(
          'SELECT id FROM answers WHERE question_id = ? AND is_correct = 1',
          [q.id]
        );
        if (correctAnswers.length && ans.answer == correctAnswers[0].id.toString()) {
          autoScore += q.points || 1;
        }
      }
      else if (q.question_type === 'true_false') {
        // ans.answer must be "Да" or "Не"
        const [correctAnswers] = await pool.query(
          'SELECT answer_text FROM answers WHERE question_id = ? AND is_correct = 1',
          [q.id]
        );
        if (correctAnswers.length && ans.answer === correctAnswers[0].answer_text) {
          autoScore += q.points || 1;
        }
      }
      // open_text – don't give points, just save the answer
      await pool.query(
        'INSERT INTO test_answers (test_id, question_id, student_id, answer_text) VALUES (?, ?, ?, ?)',
        [test_id, ans.question_id, student_id, ans.answer]
      );
    }

    // Update score and status
    await pool.query(
      'UPDATE assigned_tests SET status = "completed", score = ? WHERE id = ?',
      [autoScore, assigned_id]
    );

    res.json({ message: 'Тестът е изпратен успешно!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Returns all answers for a given assignment (for the teacher)
exports.getAssignedTestReview = async (req, res) => {
  const assigned_id = req.params.assignedId;
  try {
    // Get the assignment and the student
    const [[assigned]] = await pool.query(
      `SELECT at.*, u.username as student_username, t.title as test_title
       FROM assigned_tests at
       JOIN users u ON at.student_id = u.id
       JOIN tests t ON at.test_id = t.id
       WHERE at.id = ?`,
      [assigned_id]
    );
    if (!assigned) return res.status(404).json({ message: 'Assigned test not found' });

    // Get all questions and answers
    const [questions] = await pool.query(
      `SELECT q.id, q.question_text, q.question_type, q.points, ta.answer_text,
        CASE 
          WHEN q.question_type = 'multiple_choice' THEN (SELECT a.answer_text FROM answers a WHERE a.id = ta.answer_text)
          WHEN q.question_type = 'true_false' THEN ta.answer_text
          ELSE ta.answer_text
        END as answer_text_display
       FROM questions q
       JOIN test_questions tq ON q.id = tq.question_id
       LEFT JOIN test_answers ta ON ta.question_id = q.id AND ta.test_id = ? AND ta.student_id = ?
       WHERE tq.test_id = ?`,
      [assigned.test_id, assigned.student_id, assigned.test_id]
    );

    res.json({ assigned, questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Save the manual review
exports.manualReviewAssignedTest = async (req, res) => {
  const assigned_id = req.params.assignedId;
  const { openScores } = req.body; // [{question_id, points}]
  try {
    // Get the assignment
    const [[assigned]] = await pool.query('SELECT * FROM assigned_tests WHERE id = ?', [assigned_id]);
    if (!assigned) return res.status(404).json({ message: 'Assigned test not found' });

    // Sum the points for the open questions
    let manualScore = 0;
    for (let s of openScores) {
      manualScore += Number(s.points) || 0;
      
    }

    // Update score and manual_reviewed
    await pool.query(
      'UPDATE assigned_tests SET score = score + ?, manual_reviewed = 1 WHERE id = ?',
      [manualScore, assigned_id]
    );

    res.json({ message: 'Оценката е записана успешно!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

