import User from '../models/User.js';

// Login or register user
export const loginUser = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.trim().length < 2) {
      return res.status(400).json({ message: 'Username must be at least 2 characters long.' });
    }

    const trimmedUsername = username.trim();

    // Check if user already exists
    let user = await User.findOne({ username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') } });

    if (user) {
      // Log them in (update online status)
      user.isOnline = true;
      user.lastSeen = new Date();
      await user.save();
    } else {
      // Register a new user
      user = new User({
        username: trimmedUsername,
        isOnline: true,
        lastSeen: new Date()
      });
      await user.save();
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error in loginUser:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// Fetch all registered users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ username: 1 });
    res.status(200).json(users);
  } catch (error) {
    console.error('Error in getUsers:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};
