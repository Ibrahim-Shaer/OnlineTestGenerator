const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { isAdmin } = require('../middleware/auth');

// Създаване на въпрос (POST /questions)
router.post('/', isAdmin, questionController.createQuestion);

// Четене на всички въпроси (GET /questions)
router.get('/', isAdmin, questionController.getAllQuestions);

// Четене на въпрос по ID (GET /questions/:id)
router.get('/:id', isAdmin, questionController.getQuestionById);

// Редактиране на въпрос (PUT /questions/:id)
router.put('/:id', isAdmin, questionController.updateQuestion);

// Изтриване на въпрос (DELETE /questions/:id)
router.delete('/:id', isAdmin, questionController.deleteQuestion);

module.exports = router;
