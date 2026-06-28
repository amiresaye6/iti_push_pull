import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

// Access or create a 1-on-1 direct chat
export const accessChat = async (req, res) => {
  try {
    const currentUserId = req.headers['x-user-id'] || req.body.currentUserId;
    const { recipientId } = req.body;

    if (!currentUserId || !recipientId) {
      return res.status(400).json({ message: 'Current user ID and recipient ID are required.' });
    }

    if (currentUserId === recipientId) {
      return res.status(400).json({ message: 'You cannot start a chat with yourself.' });
    }

    // Check if chat already exists
    let isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: currentUserId } } },
        { users: { $elemMatch: { $eq: recipientId } } },
      ],
    })
      .populate('users', '-password')
      .populate('latestMessage');

    isChat = await User.populate(isChat, {
      path: 'latestMessage.sender',
      select: 'username isOnline lastSeen',
    });

    if (isChat.length > 0) {
      return res.status(200).json(isChat[0]);
    }

    // Create a new direct chat
    const chatData = {
      chatName: 'sender',
      isGroupChat: false,
      users: [currentUserId, recipientId],
    };

    const createdChat = await Chat.create(chatData);
    const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
      'users',
      '-password'
    );

    res.status(200).json(fullChat);
  } catch (error) {
    console.error('Error in accessChat:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// Fetch all chats for the current user
export const fetchChats = async (req, res) => {
  try {
    const currentUserId = req.headers['x-user-id'] || req.query.currentUserId;

    if (!currentUserId) {
      return res.status(400).json({ message: 'User ID is required in headers or query.' });
    }

    let chats = await Chat.find({ users: { $elemMatch: { $eq: currentUserId } } })
      .populate('users', '-password')
      .populate('groupAdmin', '-password')
      .populate('latestMessage')
      .sort({ updatedAt: -1 });

    chats = await User.populate(chats, {
      path: 'latestMessage.sender',
      select: 'username isOnline lastSeen',
    });

    res.status(200).json(chats);
  } catch (error) {
    console.error('Error in fetchChats:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// Create a new group chat
export const createGroupChat = async (req, res) => {
  try {
    const currentUserId = req.headers['x-user-id'] || req.body.currentUserId;
    const { name, users } = req.body; // users should be an array of user IDs stringified or parsed

    if (!currentUserId) {
      return res.status(400).json({ message: 'Group admin user ID is required.' });
    }

    if (!name || !users) {
      return res.status(400).json({ message: 'Group name and members list are required.' });
    }

    let parsedUsers = Array.isArray(users) ? users : JSON.parse(users);

    if (parsedUsers.length < 1) {
      return res.status(400).json({ message: 'More than 1 user is required to form a group chat.' });
    }

    // Add current user to group
    if (!parsedUsers.includes(currentUserId)) {
      parsedUsers.push(currentUserId);
    }

    const groupChat = await Chat.create({
      chatName: name.trim(),
      users: parsedUsers,
      isGroupChat: true,
      groupAdmin: currentUserId,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.status(200).json(fullGroupChat);
  } catch (error) {
    console.error('Error in createGroupChat:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// Fetch message history for a specific chat
export const fetchMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    if (!chatId) {
      return res.status(400).json({ message: 'Chat ID is required.' });
    }

    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'username isOnline lastSeen')
      .populate('chat')
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error in fetchMessages:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};
