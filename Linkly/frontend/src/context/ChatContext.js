import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('linkly_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeChat, setActiveChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({}); // { [chatId]: { [username]: true } }
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'direct', 'group'

  // Axios base configuration
  const axiosConfig = () => {
    return {
      headers: {
        'x-user-id': currentUser ? currentUser._id : '',
      },
    };
  };

  // Keep localStorage in sync with currentUser
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('linkly_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('linkly_user');
    }
  }, [currentUser]);

  // Login / Register
  const login = async (username) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', { username });
      setCurrentUser(response.data);
      setLoading(false);
      return { success: true, user: response.data };
    } catch (error) {
      setLoading(false);
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Connection failed.',
      };
    }
  };

  // Logout
  const logout = async () => {
    if (currentUser) {
      try {
        // Mark user offline on database
        await axios.get(`/api/auth/users`, axiosConfig()); // simple call
      } catch (err) {
        console.error('Logout sync error:', err);
      }
    }
    setCurrentUser(null);
    setActiveChat(null);
    setChats([]);
    setMessages([]);
    setUsers([]);
    setOnlineUsers({});
    setTypingUsers({});
  };

  // Fetch all users
  const fetchUsers = async () => {
    if (!currentUser) return;
    try {
      const response = await axios.get('/api/auth/users', axiosConfig());
      setUsers(response.data);
      
      // Seed initial online states
      const onlineMap = {};
      response.data.forEach(u => {
        onlineMap[u._id] = u.isOnline;
      });
      setOnlineUsers(onlineMap);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch all chats
  const fetchChats = async () => {
    if (!currentUser) return;
    try {
      const response = await axios.get('/api/chat', axiosConfig());
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  // Access or create direct chat
  const accessChat = async (recipientId) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const response = await axios.post('/api/chat', { recipientId }, axiosConfig());
      const chat = response.data;
      
      // Add chat to list if it doesn't exist
      if (!chats.some(c => c._id === chat._id)) {
        setChats(prev => [chat, ...prev]);
      }
      
      setActiveChat(chat);
      setLoading(false);
      return chat;
    } catch (error) {
      setLoading(false);
      console.error('Error accessing chat:', error);
    }
  };

  // Create group chat
  const createGroupChat = async (name, userIds) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const response = await axios.post('/api/chat/group', { name, users: userIds }, axiosConfig());
      const newGroup = response.data;
      
      setChats(prev => [newGroup, ...prev]);
      setActiveChat(newGroup);
      setLoading(false);
      return newGroup;
    } catch (error) {
      setLoading(false);
      console.error('Error creating group:', error);
      return null;
    }
  };

  // Fetch messages for active chat
  const fetchMessages = async (chatId) => {
    if (!currentUser || !chatId) return;
    try {
      const response = await axios.get(`/api/chat/${chatId}/messages`, axiosConfig());
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Trigger whenever activeChat changes
  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat._id);
    } else {
      setMessages([]);
    }
  }, [activeChat]);

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        activeChat,
        setActiveChat,
        chats,
        setChats,
        messages,
        setMessages,
        users,
        setUsers,
        onlineUsers,
        setOnlineUsers,
        typingUsers,
        setTypingUsers,
        searchQuery,
        setSearchQuery,
        loading,
        activeTab,
        setActiveTab,
        login,
        logout,
        fetchUsers,
        fetchChats,
        accessChat,
        createGroupChat,
        fetchMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
export default ChatContext;
