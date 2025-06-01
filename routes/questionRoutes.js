const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { isTeacherOrAdmin, isAuthenticated } = require('../middleware/auth');

// ВРЪЩАНЕ НА ВСИЧКИ КАТЕГОРИИ (ТРЯБВА ДА Е ПРЕДИ :id!)
router.get('/categories', isAuthenticated, questionController.getCategories);

// ВРЪЩАНЕ НА ВСИЧКИ ВЪПРОСИ (за тестове и т.н.)
router.get('/all', isTeacherOrAdmin, questionController.getAllQuestions);

// Creating a question (POST /questions)
router.post('/', isTeacherOrAdmin, questionController.createQuestion);

// Reading all questions (GET /questions)
router.get('/', isTeacherOrAdmin, questionController.getAllQuestions);

// Reading a question by ID (GET /questions/:id)
router.get('/:id', isTeacherOrAdmin, questionController.getQuestionById);

// Editing a question (PUT /questions/:id)
router.put('/:id', isTeacherOrAdmin, questionController.updateQuestion);

// Deleting a question (DELETE /questions/:id)
router.delete('/:id', isTeacherOrAdmin, questionController.deleteQuestion);

module.exports = router;
