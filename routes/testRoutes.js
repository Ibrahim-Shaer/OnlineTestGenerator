const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { isAuthenticated } = require('../middleware/auth');

// Генериране на нов тест (пример: студентът избира категория и брой въпроси)
router.post('/generate', isAuthenticated, testController.generateTest);

// Записване на отговорите
router.post('/submit', isAuthenticated, testController.submitTestAnswers);

// Преглед на резултат (примерно)
router.get('/:testId', isAuthenticated, testController.getTestResult);

module.exports = router;
