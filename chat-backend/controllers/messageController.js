const Message = require('../models/Message');

let pendingClients = [];

const removePendingClient = (clientRecord) => {
  pendingClients = pendingClients.filter(c => c !== clientRecord);
};

const sendMessage = async (req, res) => {
  const { sender, receiver, text } = req.body;
  if (!sender || !receiver || !text || !text.trim()) {
    return res.status(400).json({ error: 'Sender, receiver and non-empty text are required' });
  }

  try {
    const message = new Message({
      sender: sender.trim(),
      receiver: receiver.trim(),
      text: text.trim(),
      createdAt: new Date()
    });

    await message.save();

    const waitingClients = pendingClients.filter(c => 
      (c.sender === message.sender && c.receiver === message.receiver) ||
      (c.sender === message.receiver && c.receiver === message.sender)
    );

    waitingClients.forEach(client => {
      clearTimeout(client.timeoutId);
      client.res.status(200).json([message]);
      removePendingClient(client);
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Short Polling
const getMessagesShortPoll = async (req, res) => {
  const { sender, receiver, since } = req.query;
  if (!sender || !receiver) {
    return res.status(400).json({ error: 'Sender and receiver are required' });
  }

  const parsedSince = since ? new Date(since) : new Date(0);

  try {
    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender }
      ],
      createdAt: { $gt: parsedSince }
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Long Polling
const getMessagesLongPoll = async (req, res) => {
  const { sender, receiver, since } = req.query;
  if (!sender || !receiver) {
    return res.status(400).json({ error: 'Sender and receiver are required' });
  }

  const parsedSince = since ? new Date(since) : new Date(0);

  try {
    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender }
      ],
      createdAt: { $gt: parsedSince }
    }).sort({ createdAt: 1 });

    if (messages.length > 0) {
      return res.status(200).json(messages);
    }

    const timeoutId = setTimeout(() => {
      res.status(200).json([]);
      removePendingClient(clientRecord);
    }, 25000);

    const clientRecord = {
      sender,
      receiver,
      since: parsedSince,
      res,
      timeoutId
    };

    pendingClients.push(clientRecord);

    // If connection closes prematurely, clean up
    req.on('close', () => {
      clearTimeout(timeoutId);
      removePendingClient(clientRecord);
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  sendMessage,
  getMessagesShortPoll,
  getMessagesLongPoll
};
