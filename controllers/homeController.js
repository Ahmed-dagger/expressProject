const User = require('../models/User');

// GET /home
exports.getHome = async (req, res, next) => {
  
    const user = await User.findById(req.session.userId).lean();
    if (!user) return res.redirect('/login');
    res.render('home', {
      balance:      user.balance.toFixed(2),
      investments: user.investments
    });
};

// POST /home/deposit
exports.postDeposit = async (req, res, next) => {
  const amt = parseFloat(req.body.amount);
  if (isNaN(amt) || amt <= 0) return res.redirect('/home');
  await User.findByIdAndUpdate(req.session.userId, {
    $inc: { balance: amt }
  });
  res.redirect('/home');
};

// POST /home/invest
exports.postInvest = async (req, res, next) => {
  const amt     = parseFloat(req.body.amount);
  const roiRate = parseFloat(req.body.roiRate);
  const user    = await User.findById(req.session.userId);

  if (!user || isNaN(amt)||isNaN(roiRate) || amt <= 0 || amt > user.balance) {
    return res.redirect('/home');
  }

  user.balance -= amt;
  user.investments.push({ amount: amt, roiRate });
  await user.save();

  res.redirect('/home');
};

// POST /home/investments/:id/update
exports.updateInvestment = async (req, res, next) => {
  
    const { amount, roiRate } = req.body;
    const invId = req.params.id;

    // Find the user and the specific investment
    const user = await User.findById(req.session.userId);
    const inv  = user.investments.id(invId);
    if (!inv) return res.status(404).send('Investment not found');

    // Update fields
    inv.amount  = Number(amount);
    inv.roiRate = Number(roiRate);
    await user.save();

    res.redirect('/home');
};

// POST /home/investments/:id/close
exports.closeInvestment = async (req, res, next) => {
    const invId = req.params.id;
    const user  = await User.findById(req.session.userId);
    const inv   = user.investments.id(invId);
    if (!inv) return res.status(404).send('Investment not found');

    const closeDate = new Date();
    const createdAt = new Date(inv.createdAt);

    // compute days held
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysHeld = (closeDate - createdAt) / msPerDay;

    // simple interest: P * r * (days/365)
    const principal  = inv.amount;
    const annualRate = inv.roiRate / 100;
    const gain       = principal * annualRate * (daysHeld / 365);

    // credit back principal + prorated gain
    user.balance += principal + gain;

    // mark closed and save
    inv.status = 'closed';
    await user.save();

    res.redirect('/home');

};

