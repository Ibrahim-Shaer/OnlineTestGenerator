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

// Creating a test with selected questions
router.post('/', isAuthenticated, testController.createTest);

// Returning all tests
router.get('/', isAuthenticated, testController.getAllTests);

// GET /tests/:id/questions - връща въпросите за даден тест
router.get('/:id/questions', testController.getTestQuestions);

module.exports = router;
