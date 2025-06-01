const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { isTeacherOrAdmin, isAuthenticated } = require('../middleware/auth');

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

// Returning all categories (GET /questions/categories)
router.get('/categories', isAuthenticated, questionController.getCategories);

module.exports = router;
