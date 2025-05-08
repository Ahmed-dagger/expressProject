const bcrypt = require('bcrypt');
const User = require('../models/User');

// Show the signup page
exports.showSignup = (req, res) => {
    if (req.session.userId) {
        return res.redirect('/home');
    }
    res.render('signup', { error: null });
};

// Handle the signup process
exports.signup = async (req, res) => {
    const { firstname, lastname, email, password, confirmPassword } = req.body;

    // Check for missing fields
    if (!firstname || !lastname || !email || !password || !confirmPassword) {
        return res.render('signup', { error: 'Please fill in all fields' });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
        return res.render('signup', { error: 'Passwords do not match' });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.render('signup', { error: 'Password must be at least 8 characters long and contain both letters and numbers' });
    }

    try {
        // Check if the email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('signup', { error: 'Email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const user = new User({ firstname, lastname, email, password: hashedPassword });

        // Save the user to the database
        await user.save();

        // Store the user ID in the session
        req.session.userId = user._id;

        // Redirect to home page after successful signup
        res.redirect('/home');
    } catch (err) {
        console.error(err);
        res.render('signup', { error: 'Something went wrong. Please try again later.' });
    }
};

// Show the login page
exports.showLogin = (req, res) => {
    if (req.session.userId) {
        return res.redirect('/home');
    }
    res.render('login', { error: null });
};

// Handle the login process
exports.login = async (req, res) => {
    const { email, password } = req.body;
  
    try {
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('login', { error: 'No user found with this email' });
        }

        // Compare the password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { error: 'Invalid credentials' });
        }

        // If the credentials are valid, store the user ID in the session
        req.session.userId = user._id;

        // Redirect to the home page
        res.redirect('/home');
    } catch (err) {
        console.error(err);
        res.render('login', { error: 'Server error. Please try again.' });
    }
};

// Handle the logout process
exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
};

// Show the home page (protected)
exports.showHome = (req, res) => {
    res.render('home');
};