// __tests__/authController.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcrypt');
const app = require('../app');
const User = require('../models/User');

let mongoServer;
let agent;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.disconnect(); // ensure disconnection before reconnect
  await mongoose.connect(uri);
});


beforeEach(() => {
  agent = request.agent(app); // use agent for session persistence
});

afterEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('GET /signup', () => {
  test('renders signup page if user not logged in', async () => {
    const res = await request(app).get('/signup');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('form');
  });
});

describe('POST /signup', () => {
  test('should show error for missing fields', async () => {
    const res = await request(app).post('/signup').send({});
    expect(res.text).toContain('Please fill in all fields');
  });

  test('should show error if passwords do not match', async () => {
    const res = await request(app).post('/signup').send({
      firstname: 'Test', lastname: 'User', email: 't@e.com', password: 'pass1234', confirmPassword: 'wrongpass'
    });
    expect(res.text).toContain('Passwords do not match');
  });

  test('should show error for weak password', async () => {
    const res = await request(app).post('/signup').send({
      firstname: 'Test', lastname: 'User', email: 't@e.com', password: 'abc', confirmPassword: 'abc'
    });
    expect(res.text).toContain('Password must be at least 8 characters');
  });

  test('should show error if email already exists', async () => {
    const user = new User({ firstname: 'Existing', lastname: 'User', email: 'exist@test.com', password: 'hash' });
    await user.save();

    const res = await request(app).post('/signup').send({
      firstname: 'New', lastname: 'User', email: 'exist@test.com', password: 'Password123', confirmPassword: 'Password123'
    });
    expect(res.text).toContain('Email already exists');
  });

  test('should register user and redirect to /home', async () => {
    const res = await agent.post('/signup').send({
      firstname: 'John', lastname: 'Doe', email: 'john@test.com', password: 'Password123', confirmPassword: 'Password123'
    });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/home');
  });
});

describe('GET /login', () => {
  test('renders login if not logged in', async () => {
    const res = await request(app).get('/login');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('form');
  });
});

describe('POST /login', () => {
  test('should return error if user not found', async () => {
    const res = await request(app).post('/login').send({ email: 'nouser@test.com', password: 'Password123' });
    expect(res.text).toContain('No user found');
  });

  test('should return error on invalid credentials', async () => {
    const user = new User({ firstname: 'Fake', lastname: 'User', email: 'fake@test.com', password: await bcrypt.hash('Password123', 10) });
    await user.save();
    const res = await request(app).post('/login').send({ email: 'fake@test.com', password: 'WrongPass' });
    expect(res.text).toContain('Invalid credentials');
  });

  test('should login and redirect to home', async () => {
    const password = await bcrypt.hash('Password123', 10);
    const user = new User({ firstname: 'Real', lastname: 'User', email: 'real@test.com', password });
    await user.save();
    const res = await agent.post('/login').send({ email: 'real@test.com', password: 'Password123' });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/home');
  });
});

describe('GET /home', () => {
  test('should redirect to login if not logged in', async () => {
    const res = await request(app).get('/home');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/login');
  });

  test('should render home if user is logged in', async () => {
    const user = new User({
      firstname: 'Home', lastname: 'User', email: 'home@test.com',
      password: await bcrypt.hash('Password123', 10), balance: 100.5, investments: []
    });
    await user.save();
    await agent.post('/login').send({ email: 'home@test.com', password: 'Password123' });

    const res = await agent.get('/home');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('100.50');
  });
});

describe('GET /logout', () => {
  test('should destroy session and redirect to login', async () => {
    const user = new User({ firstname: 'Logout', lastname: 'User', email: 'logout@test.com', password: await bcrypt.hash('Password123', 10) });
    await user.save();
    await agent.post('/login').send({ email: 'logout@test.com', password: 'Password123' });

    const res = await agent.get('/logout');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/login');
  });
});

describe('GET /home', () => {
  // ... existing tests ...

  test('should redirect to login if user not found in database (invalid session)', async () => {
    // Create a user and log in to establish a session
    const user = new User({
      firstname: 'Temp',
      lastname: 'User',
      email: 'temp@test.com',
      password: await bcrypt.hash('Password123', 10)
    });
    await user.save();
    await agent.post('/login').send({ email: 'temp@test.com', password: 'Password123' });

    // Delete the user to simulate a situation where the user was deleted but session remains
    await User.deleteOne({ _id: user._id });

    // Now make the request to /home - should redirect to login
    const res = await agent.get('/home');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/login');
  });
});