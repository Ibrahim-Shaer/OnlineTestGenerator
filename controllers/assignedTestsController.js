const pool = require('../config/db');
const { isAuthenticated, isTeacherOrAdmin } = require('../middleware/auth');

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
