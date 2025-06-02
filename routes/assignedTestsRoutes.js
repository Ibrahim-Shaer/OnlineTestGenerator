const express = require('express');
const router = express.Router();
const assignedTestsController = require('../controllers/assignedTestsController');
const { isAuthenticated, isTeacherOrAdmin } = require('../middleware/auth');

// Assign test to students (only for teachers/admins)
router.post('/', isAuthenticated, isTeacherOrAdmin, assignedTestsController.assignTestToStudents);

// Get assigned tests for current student
router.get('/mine', isAuthenticated, assignedTestsController.getAssignedTestsForStudent);

// Get assigned tests by current teacher
router.get('/assigned-by-me', isAuthenticated, isTeacherOrAdmin, assignedTestsController.getAssignedTestsByTeacher);

router.get('/:testId/questions', isAuthenticated, assignedTestsController.getTestQuestions);
router.post('/:testId/submit', isAuthenticated, assignedTestsController.submitAssignedTest);

module.exports = router;
