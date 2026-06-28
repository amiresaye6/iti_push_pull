import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

// Map of userId -> Set of socketIds (handles multiple tabs)
const activeConnections = new Map();

export const socketHandler = (io) => {
  io.on('connection', async (socket) => {
    let userId = socket.handshake.query.userId;
    console.log(`Socket connected: ${socket.id}, User ID from query: ${userId}`);

    const registerUserSocket = async (uId) => {
      if (!uId) return;
      socket.userId = uId;
      
      if (!activeConnections.has(uId)) {
        activeConnections.set(uId, new Set());
      }
      activeConnections.get(uId).add(socket.id);

      try {
        // Set user online
        await User.findByIdAndUpdate(uId, { isOnline: true, lastSeen: new Date() });
        // Broadcast online status to all users
        io.emit('user_status_change', { userId: uId, isOnline: true });
        console.log(`User ${uId} is now online.`);
      } catch (err) {
        console.error('Error updating user online status:', err.message);
      }
    };

    if (userId) {
      await registerUserSocket(userId);
    }

    // Explicit setup event (fallback)
    socket.on('setup', async (uId) => {
      console.log(`Setup event received for user: ${uId}`);
      await registerUserSocket(uId);
    });

    // Join a chat room (direct or group)
    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined room/chat: ${chatId}`);
    });

    // Handle incoming message
    socket.on('send_message', async (messageData) => {
      const { sender: senderId, content, chat: chatId } = messageData;

      if (!senderId || !content || !chatId) {
        console.error('Invalid message data received:', messageData);
        return;
      }

      try {
        // Create and save message
        const newMessage = await Message.create({
          sender: senderId,
          content: content,
          chat: chatId,
        });

        // Update the chat with the latest message
        await Chat.findByIdAndUpdate(chatId, { latestMessage: newMessage._id });

        // Populate message fields
        const fullMessage = await Message.findById(newMessage._id)
          .populate('sender', 'username isOnline lastSeen')
          .populate('chat');

        // Broadcast to the chat room
        io.to(chatId).emit('receive_message', fullMessage);
        console.log(`Message in chat ${chatId} broadcasted.`);
      } catch (err) {
        console.error('Error saving or broadcasting message:', err.message);
      }
    });

    // Typing indicators
    socket.on('typing', (data) => {
      // data contains: { chatId, username }
      if (data && data.chatId) {
        socket.to(data.chatId).emit('typing', {
          chatId: data.chatId,
          userId: socket.userId,
          username: data.username,
        });
      }
    });

    socket.on('stop_typing', (data) => {
      // data contains: { chatId, username }
      if (data && data.chatId) {
        socket.to(data.chatId).emit('stop_typing', {
          chatId: data.chatId,
          userId: socket.userId,
          username: data.username,
        });
      }
    });

    // Handle client disconnect
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const uId = socket.userId;

      if (uId && activeConnections.has(uId)) {
        const sockets = activeConnections.get(uId);
        sockets.delete(socket.id);

        if (sockets.size === 0) {
          // No more tabs/connections open for this user, mark offline
          activeConnections.delete(uId);
          try {
            const lastSeenDate = new Date();
            await User.findByIdAndUpdate(uId, { isOnline: false, lastSeen: lastSeenDate });
            io.emit('user_status_change', { userId: uId, isOnline: false, lastSeen: lastSeenDate });
            console.log(`User ${uId} logged off (no active connections).`);
          } catch (err) {
            console.error('Error updating user offline status:', err.message);
          }
        }
      }
    });
  });
};
