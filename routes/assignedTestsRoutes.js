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

// Get questions for an assigned test
router.get('/:assignedId/questions', assignedTestsController.getTestQuestions);

// Submit answers for an assigned test
router.post('/:assignedId/submit', assignedTestsController.submitAssignedTest);

// Get review for an assigned test
router.get('/:assignedId/review', isAuthenticated, isTeacherOrAdmin, assignedTestsController.getAssignedTestReview);

// Manual review for an assigned test
router.post('/:assignedId/review', isAuthenticated, isTeacherOrAdmin, assignedTestsController.manualReviewAssignedTest);

module.exports = router;
