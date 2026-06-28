import React, { useState, useEffect, useRef } from 'react';
import { Smile, Send, Paperclip, MoreVertical, Phone, Video, Search, Users } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import MessageBubble from './MessageBubble';
import { getAvatarColor } from './NewGroupModal';

const ChatWindow = () => {
  const {
    activeChat,
    messages,
    currentUser,
    onlineUsers,
    typingUsers,
  } = useChat();

  const socket = useSocket();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  // Handle typing state and timeouts
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (!socket || !activeChat) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', {
        chatId: activeChat._id,
        username: currentUser.username,
      });
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', {
        chatId: activeChat._id,
        username: currentUser.username,
      });
      setIsTyping(false);
    }, 2000); // Stop typing after 2s of inactivity
  };

  // Submit message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !activeChat) return;

    // Clear typing timeout immediately
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('stop_typing', {
      chatId: activeChat._id,
      username: currentUser.username,
    });
    setIsTyping(false);

    // Send message payload
    socket.emit('send_message', {
      sender: currentUser._id,
      content: inputText.trim(),
      chat: activeChat._id,
    });

    setInputText('');
  };

  if (!activeChat) {
    return (
      <div className="flex-1 h-full bg-[#f8f9fa] border-b-[6px] border-[#00a884] flex flex-col items-center justify-center select-none">
        <div className="text-center max-w-md px-6">
          {/* Logo illustration */}
          <div className="w-32 h-32 bg-gray-150 mx-auto rounded-full flex items-center justify-center bg-emerald-50 mb-6 shadow-inner">
            <span className="text-6xl">💬</span>
          </div>
          <h2 className="text-2xl font-light text-gray-700 mb-2">Linkly Web</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Send and receive messages in real time. Select a contact from the sidebar or search for active users to begin chatting immediately.
          </p>
        </div>
      </div>
    );
  }

  // Resolve chat parameters
  const isGroup = activeChat.isGroupChat;
  
  // Direct Chat recipient resolution
  const recipient = !isGroup
    ? activeChat.users.find((u) => u._id !== currentUser?._id)
    : null;

  const chatTitle = isGroup
    ? activeChat.chatName
    : recipient
    ? recipient.username
    : 'Unknown User';

  const isOnline = recipient ? onlineUsers[recipient._id] ?? recipient.isOnline : false;

  // Resolve status subtitle
  let statusText = '';
  if (isGroup) {
    statusText = activeChat.users.map((u) => u.username).join(', ');
  } else {
    statusText = isOnline ? 'online' : 'offline';
  }

  // Resolve active typing indicators
  const chatTypingMap = typingUsers[activeChat._id] || {};
  const typers = Object.keys(chatTypingMap).filter((username) => chatTypingMap[username]);
  const isSomeoneTyping = typers.length > 0;

  return (
    <div className="flex-1 h-full flex flex-col bg-[#efeae2] relative overflow-hidden">
      {/* Header */}
      <div className="h-[60px] bg-whatsapp-header px-4 flex items-center justify-between border-b border-whatsapp-borderLight z-10 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div
            className={`w-[40px] h-[40px] rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 ${
              isGroup
                ? 'bg-emerald-50 text-emerald-600'
                : recipient
                ? getAvatarColor(recipient.username)
                : 'bg-gray-400'
            }`}
          >
            {isGroup ? <Users className="w-5 h-5" /> : recipient?.username.charAt(0).toUpperCase()}
          </div>

          {/* Titles */}
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-800 truncate leading-snug">
              {chatTitle}
            </h2>
            <p className="text-[11px] text-gray-500 truncate leading-none mt-0.5">
              {isSomeoneTyping ? (
                <span className="text-whatsapp-greenDark font-semibold italic animate-pulse">
                  {typers.join(', ')} {typers.length > 1 ? 'are' : 'is'} typing...
                </span>
              ) : (
                statusText
              )}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-4 text-whatsapp-iconGrey">
          <button className="hover:text-gray-800 transition-colors p-1.5 hover:bg-gray-100 rounded-full">
            <Video className="w-4.5 h-4.5" />
          </button>
          <button className="hover:text-gray-800 transition-colors p-1.5 hover:bg-gray-100 rounded-full">
            <Phone className="w-4.5 h-4.5" />
          </button>
          <div className="w-[1px] h-5 bg-gray-300"></div>
          <button className="hover:text-gray-800 transition-colors p-1.5 hover:bg-gray-100 rounded-full">
            <Search className="w-4.5 h-4.5" />
          </button>
          <button className="hover:text-gray-800 transition-colors p-1.5 hover:bg-gray-100 rounded-full">
            <MoreVertical className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Messages area (Scrollable) */}
      <div className="flex-1 overflow-y-auto py-4 chat-bg flex flex-col gap-1">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              currentUserId={currentUser?._id}
              isGroupChat={isGroup}
            />
          ))
        ) : (
          <div className="my-auto text-center p-6">
            <span className="bg-white bg-opacity-70 px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 shadow-sm">
              🔒 Messages are secured and end-to-end simulated.
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input bar */}
      <form
        onSubmit={handleSendMessage}
        className="h-[60px] bg-whatsapp-header px-4 flex items-center gap-3 border-t border-whatsapp-borderLight z-10 flex-shrink-0"
      >
        {/* Emoji trigger & attachment */}
        <div className="flex items-center gap-2 text-whatsapp-iconGrey">
          <button
            type="button"
            className="hover:text-gray-800 transition-colors p-2 hover:bg-gray-200 rounded-full"
            title="Emojis"
          >
            <Smile className="w-5.5 h-5.5" />
          </button>
          <button
            type="button"
            className="hover:text-gray-800 transition-colors p-2 hover:bg-gray-200 rounded-full"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5 rotate-[45deg]" />
          </button>
        </div>

        {/* Input box */}
        <input
          type="text"
          placeholder="Type a message"
          value={inputText}
          onChange={handleInputChange}
          className="flex-1 bg-white border-none outline-none rounded-lg px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 shadow-sm"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 bg-whatsapp-green hover:bg-whatsapp-greenDark disabled:opacity-50 text-white rounded-full transition-all shadow-md flex items-center justify-center"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
