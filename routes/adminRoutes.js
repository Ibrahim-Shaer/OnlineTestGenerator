const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/auth');

// Returns all users
router.get('/users', isAdmin, adminController.getAllUsers);
// Creates a new user
router.post('/users', isAdmin, adminController.createUser);
// Edits a user
router.put('/users/:id', isAdmin, adminController.updateUser);
// Deletes a user
router.delete('/users/:id', isAdmin, adminController.deleteUser);
// Returns statistics for the admin panel
router.get('/stats', isAdmin, adminController.getStats);
// Returns all roles
router.get('/roles', isAdmin, adminController.getAllRoles);

module.exports = router; 