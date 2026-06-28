import React, { useState, useEffect } from 'react';
import { useChat, ChatProvider } from './context/ChatContext';
import { useSocket, SocketProvider } from './context/SocketContext';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { MessageSquare, AlertCircle } from 'lucide-react';

// Socket Event Manager Component
// This component listens to the active socket and updates the ChatContext state
const SocketManager = () => {
  const socket = useSocket();
  const {
    activeChat,
    setMessages,
    setChats,
    setOnlineUsers,
    setUsers,
    setTypingUsers,
    fetchChats,
  } = useChat();

  useEffect(() => {
    if (!socket) return;

    // Join room for current active chat
    if (activeChat) {
      socket.emit('join_chat', activeChat._id);
    }

    // Handle receiving a message
    const handleReceiveMessage = (message) => {
      // 1. If it belongs to active chat, append it to messages feed
      if (activeChat && message.chat._id === activeChat._id) {
        setMessages((prev) => [...prev, message]);
      }

      // 2. Update latest message in the chats list
      setChats((prevChats) => {
        const chatIndex = prevChats.findIndex((c) => c._id === message.chat._id);
        if (chatIndex !== -1) {
          const updatedChats = [...prevChats];
          updatedChats[chatIndex] = {
            ...updatedChats[chatIndex],
            latestMessage: message,
            updatedAt: message.createdAt,
          };
          // Re-sort chats list by updatedAt descending
          return updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        } else {
          // If the chat thread is not in the list, fetch all chats to get it (e.g. first group message)
          fetchChats();
          return prevChats;
        }
      });
    };

    // Handle user status changes (online/offline)
    const handleUserStatusChange = ({ userId, isOnline, lastSeen }) => {
      setOnlineUsers((prev) => ({
        ...prev,
        [userId]: isOnline,
      }));

      // Update in users directory list
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u._id === userId ? { ...u, isOnline, lastSeen } : u))
      );

      // Update inside the participants list of all chats
      setChats((prevChats) =>
        prevChats.map((chat) => ({
          ...chat,
          users: chat.users.map((u) => (u._id === userId ? { ...u, isOnline, lastSeen } : u)),
        }))
      );
    };

    // Handle typing indicator trigger
    const handleTyping = ({ chatId, username }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [chatId]: {
          ...(prev[chatId] || {}),
          [username]: true,
        },
      }));
    };

    // Handle typing indicator stop
    const handleStopTyping = ({ chatId, username }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [chatId]: {
          ...(prev[chatId] || {}),
          [username]: false,
        },
      }));
    };

    // Setup listeners
    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_status_change', handleUserStatusChange);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);

    return () => {
      // Teardown listeners
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_status_change', handleUserStatusChange);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
    };
  }, [socket, activeChat, setMessages, setChats, setOnlineUsers, setUsers, setTypingUsers, fetchChats]);

  return null; // Logic-only component
};

// Inner App Layout
const AppContent = () => {
  const { currentUser, login, fetchUsers, fetchChats, loading } = useChat();
  const [usernameInput, setUsernameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch initial chats and user list when logged in
  useEffect(() => {
    if (currentUser) {
      fetchUsers();
      fetchChats();
    }
  }, [currentUser]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!usernameInput.trim()) return;

    const result = await login(usernameInput.trim());
    if (!result.success) {
      setErrorMsg(result.message);
    }
  };

  // Login view
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#eae6df] flex flex-col justify-center items-center px-4 py-8 select-none">
        {/* WhatsApp branding banner */}
        <div className="absolute top-0 left-0 w-full h-[220px] bg-whatsapp-greenDark -z-10"></div>
        
        {/* Card */}
        <div className="bg-white rounded-lg shadow-xl w-full max-w-[420px] p-8 flex flex-col items-center z-10 animate-slide-in">
          {/* Logo */}
          <div className="w-16 h-16 bg-whatsapp-green flex items-center justify-center rounded-full mb-6 shadow-md">
            <MessageSquare className="w-8 h-8 text-white stroke-[2.5]" />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome to Linkly</h2>
          <p className="text-sm text-gray-400 mb-6 text-center">
            Sign in with a username to join direct and group chats in real time.
          </p>

          <form onSubmit={handleLoginSubmit} className="w-full flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Choose a Username
              </label>
              <input
                type="text"
                placeholder="e.g., Alice, Bob, Developer"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                maxLength={20}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-whatsapp-green outline-none transition-colors text-sm font-semibold text-gray-700"
                required
                autoFocus
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 text-rose-500 bg-rose-50 border border-rose-100 rounded-lg p-3 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !usernameInput.trim()}
              className="w-full py-2.5 bg-whatsapp-green hover:bg-whatsapp-greenDark disabled:opacity-50 text-white font-bold rounded-lg text-sm transition-colors shadow-md flex items-center justify-center"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Agree and Continue'
              )}
            </button>
          </form>
        </div>
        
        <footer className="mt-8 text-xs text-gray-400 text-center font-medium">
          Linkly App &copy; {new Date().getFullYear()} &middot; Designed for Pair Programming
        </footer>
      </div>
    );
  }

  // Logged-in Dashboard layout (Sidebar + ChatWindow)
  return (
    <SocketProvider userId={currentUser._id}>
      <SocketManager />
      <div className="w-screen h-screen flex bg-whatsapp-light overflow-hidden">
        {/* Main Interface wrapper */}
        <div className="w-full h-full flex overflow-hidden">
          <Sidebar />
          <ChatWindow />
        </div>
      </div>
    </SocketProvider>
  );
};

// Root wrapper with Context
const App = () => {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
};

export default App;
