const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// GET routes
router.get('/signup', auth.showSignup);
router.get('/login', auth.showLogin);
router.get('/home', authMiddleware.isAuthenticated, auth.showHome);
router.get('/logout', auth.logout);

// POST routes
router.post('/signup', auth.signup);
router.post('/login', auth.login);

module.exports = router;
