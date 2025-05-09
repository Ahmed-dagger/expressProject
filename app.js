require('dotenv').config(); // Add this at the top
const path = require('path'); // add this at the top

const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const authRoutes = require('./routes/auth');
const homeRoutes = require('./routes/home')

const app = express();

// Middleware to parse form data and JSON data
app.use(express.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
app.use(express.json());  // parse application/json requests


// MongoDB connection using MONGO_URI from .env
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Atlas connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static('public'));

// Session setup
app.use(session({
  secret: 'your-secret-key', // Change this to a random string
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

app.use('/', authRoutes);
app.use('/', homeRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

console.log('MONGO_URI:', process.env.MONGO_URI);
