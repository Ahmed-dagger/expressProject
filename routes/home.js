const express = require('express');
const router  = express.Router();
const home    = require('../controllers/homeController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/home', authMiddleware.isAuthenticated, home.getHome);
router.post('/home/deposit', authMiddleware.isAuthenticated, home.postDeposit);
router.post('/home/invest', authMiddleware.isAuthenticated, home.postInvest);

router.post(
    '/home/investments/:id/update',
    authMiddleware.isAuthenticated,
    home.updateInvestment
  );
  
  // Close (redeem) an existing investment
  router.post(
    '/home/investments/:id/close',
    authMiddleware.isAuthenticated,
    home.closeInvestment
  );

module.exports = router;
