const User = require('../models/User');

// Create or login user
const loginOrCreateUser = async (req, res) => {
  const { username } = req.body;
  if (!username || typeof username !== 'string' || !username.trim()) {
    return res.status(400).json({ error: 'Username is required and must be a valid string' });
  }

  const cleanUsername = username.trim();

  try {
    let user = await User.findOne({ username: cleanUsername });
    if (!user) {
      user = new User({ username: cleanUsername });
      await user.save();
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ username: 1 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  loginOrCreateUser,
  getAllUsers
};
