const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { isTeacherOrAdmin, isAuthenticated } = require('../middleware/auth');

// Създаване на въпрос (POST /questions)
router.post('/', isTeacherOrAdmin, questionController.createQuestion);

// Четене на всички въпроси (GET /questions)
router.get('/', isTeacherOrAdmin, questionController.getAllQuestions);

// Четене на въпрос по ID (GET /questions/:id)
router.get('/:id', isTeacherOrAdmin, questionController.getQuestionById);

// Редактиране на въпрос (PUT /questions/:id)
router.put('/:id', isTeacherOrAdmin, questionController.updateQuestion);

// Изтриване на въпрос (DELETE /questions/:id)
router.delete('/:id', isTeacherOrAdmin, questionController.deleteQuestion);

// Връща всички категории (GET /questions/categories)
router.get('/categories', isAuthenticated, questionController.getCategories);

module.exports = router;
