const bcrypt = require('bcrypt');

const users = []; // Format: { username, hashedPassword }

async function createUser(username, password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, hashedPassword });
}

function findUser(username) {
  return users.find(u => u.username === username);
}

module.exports = {
  createUser,
  findUser,
};
