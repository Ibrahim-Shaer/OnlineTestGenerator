const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { isAuthenticated } = require('../middleware/auth');

// Generating a new test 
router.post('/generate', isAuthenticated, testController.generateTest);

// Saving the answers
router.post('/submit', isAuthenticated, testController.submitTestAnswers);

// Viewing the result
router.get('/:testId', isAuthenticated, testController.getTestResult);

// Създаване на тест с избрани въпроси
router.post('/', isAuthenticated, testController.createTest);

// Връща всички тестове
router.get('/', isAuthenticated, testController.getAllTests);

module.exports = router;
