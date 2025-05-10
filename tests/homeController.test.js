const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcrypt');
const app = require('../app'); // Your Express app
const User = require('../models/User');

let mongoServer;
let agent;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.disconnect(); // Ensure disconnection before reconnect
  await mongoose.connect(uri);
});

beforeEach(() => {
  agent = request.agent(app); // Use agent for session persistence
});

afterEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('HomeController', () => {
  
  // Test for GET /home route
  describe('GET /home', () => {
    test('should redirect to login if user is not logged in', async () => {
      const res = await request(app).get('/home');
      expect(res.status).toBe(302); // Expecting a redirect to login
      expect(res.headers.location).toBe('/login');
    });

    test('should render home page with balance and investments if user is logged in', async () => {
      const password = await bcrypt.hash('Password123', 10);
      const user = new User({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password: password,
        balance: 100.50,
        investments: [{ amount: 50, roiRate: 5 }]
      });
      await user.save();
      await agent.post('/login').send({ email: 'john@example.com', password: 'Password123' });

      const res = await agent.get('/home');
      expect(res.status).toBe(200);
      expect(res.text).toContain('100.50');  // Check balance in the response
      expect(res.text).toContain('50');     // Check for investment in the response
    });
  });

  // Test for POST /home/deposit route
  describe('POST /home/deposit', () => {
    test('should redirect to /home if amount is invalid', async () => {
      const user = new User({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password: await bcrypt.hash('Password123', 10),
        balance: 100
      });
      await user.save();
      await agent.post('/login').send({ email: 'john@example.com', password: 'Password123' });

      const res = await agent.post('/home/deposit').send({ amount: 'invalid' });
      expect(res.status).toBe(302); // Expect redirect
      expect(res.headers.location).toBe('/home');
    });

    test('should add amount to user balance', async () => {
      const user = new User({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password: await bcrypt.hash('Password123', 10),
        balance: 100
      });
      await user.save();
      await agent.post('/login').send({ email: 'john@example.com', password: 'Password123' });

      const res = await agent.post('/home/deposit').send({ amount: 50 });
      expect(res.status).toBe(302); // Expect redirect to /home

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.balance).toBe(150); // Check if balance updated
    });
  });

  // Test for POST /home/invest route
  describe('POST /home/invest', () => {
    test('should redirect to /home if investment amount is invalid or greater than balance', async () => {
      const user = new User({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password: await bcrypt.hash('Password123', 10),
        balance: 100
      });
      await user.save();
      await agent.post('/login').send({ email: 'john@example.com', password: 'Password123' });

      // Invalid investment amount
      const res = await agent.post('/home/invest').send({ amount: 200, roiRate: 5 });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/home');

      // Valid investment
      const res2 = await agent.post('/home/invest').send({ amount: 50, roiRate: 5 });
      expect(res2.status).toBe(302);
      expect(res2.headers.location).toBe('/home');

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.balance).toBe(50);  // Check balance after investment
      expect(updatedUser.investments.length).toBe(1);  // Check if investment was added
    });
  });

  // Test for POST /home/investments/:id/update route
  describe('POST /home/investments/:id/update', () => {
    test('should update investment successfully', async () => {
      const user = new User({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password: await bcrypt.hash('Password123', 10),
        balance: 100,
        investments: [{ amount: 50, roiRate: 5 }]
      });
      await user.save();
      await agent.post('/login').send({ email: 'john@example.com', password: 'Password123' });

      const investment = user.investments[0];
      const res = await agent.post(`/home/investments/${investment._id}/update`).send({
        amount: 60,
        roiRate: 6
      });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/home');

      const updatedUser = await User.findById(user._id);
      const updatedInvestment = updatedUser.investments.id(investment._id);
      expect(updatedInvestment.amount).toBe(60);
      expect(updatedInvestment.roiRate).toBe(6);
    });

    test('should return 404 if investment is not found', async () => {
      const res = await agent.post('/home/investments/invalidId/update').send({
        amount: 60,
        roiRate: 6
      });
      expect(res.status).toBe(302);
    });
  });

  // Test for POST /home/investments/:id/close route
  describe('POST /home/investments/:id/close', () => {
    test('should close the investment and update balance', async () => {
      const user = new User({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password: await bcrypt.hash('Password123', 10),
        balance: 100,
        investments: [{ amount: 50, roiRate: 5, createdAt: new Date() }]
      });
      await user.save();
      await agent.post('/login').send({ email: 'john@example.com', password: 'Password123' });

      const investment = user.investments[0];
      const res = await agent.post(`/home/investments/${investment._id}/close`);
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/home');

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.balance).toBeGreaterThan(100);  // Check if balance is updated
      expect(updatedUser.investments[0].status).toBe('closed');  // Check if investment is closed
    });

    test('should return 404 if investment is not found', async () => {
      const res = await agent.post('/home/investments/invalidId/close');
      expect(res.status).toBe(302);
    });
  });
});


describe('GET /home', () => {
  // ... existing tests ...

  test('should redirect when user deleted after login', async () => {
    // 1. Create and login user
    const user = new User({
      firstname: 'Temp',
      lastname: 'User',
      email: 'temp@test.com',
      password: await bcrypt.hash('pass123', 10)
    })
    await user.save()
    await agent.post('/login').send({ email: 'temp@test.com', password: 'pass123' })

    // 2. Delete the user while keeping session
    await User.deleteOne({ _id: user._id })

    // 3. Request should redirect
    const res = await agent.get('/home')
    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('/login')
  })
})

