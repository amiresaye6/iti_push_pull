import React, { useState } from 'react';
import { MessageSquarePlus, LogOut, Search, MessageSquare, Users, User, Hash } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import NewGroupModal, { getAvatarColor } from './NewGroupModal';

const Sidebar = () => {
  const {
    currentUser,
    logout,
    chats,
    activeChat,
    setActiveChat,
    users,
    accessChat,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    onlineUsers,
  } = useChat();

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // Helper to format the latest message date
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper to get contact info for a direct chat
  const getDirectChatInfo = (chat) => {
    const contact = chat.users.find((u) => u._id !== currentUser?._id);
    return {
      name: contact ? contact.username : 'Unknown User',
      isOnline: contact ? onlineUsers[contact._id] ?? contact.isOnline : false,
      avatarChar: contact ? contact.username.charAt(0).toUpperCase() : '?',
      avatarColor: contact ? getAvatarColor(contact.username) : 'bg-gray-400',
    };
  };

  // Filtered chats based on tab and search
  const filteredChats = chats.filter((chat) => {
    const matchesSearch = chat.isGroupChat
      ? chat.chatName.toLowerCase().includes(searchQuery.toLowerCase())
      : getDirectChatInfo(chat).name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'direct' && !chat.isGroupChat) ||
      (activeTab === 'group' && chat.isGroupChat);

    return matchesSearch && matchesTab;
  });

  // Filtered available contacts that aren't already in active chats
  const activeChatContactIds = chats
    .filter((c) => !c.isGroupChat)
    .map((c) => c.users.find((u) => u._id !== currentUser?._id)?._id)
    .filter(Boolean);

  const availableContacts = users.filter((u) => {
    const isSelf = u._id === currentUser?._id;
    const hasActiveChat = activeChatContactIds.includes(u._id);
    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase());
    return !isSelf && !hasActiveChat && (searchQuery ? matchesSearch : true);
  });

  return (
    <div className="w-[380px] h-full border-r border-whatsapp-borderLight bg-white flex flex-col select-none flex-shrink-0">
      {/* Header */}
      <div className="h-[60px] bg-whatsapp-header px-4 flex items-center justify-between border-b border-whatsapp-borderLight">
        {/* User profile */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${getAvatarColor(
              currentUser?.username || ''
            )}`}
          >
            {currentUser?.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-800 leading-tight">
              {currentUser?.username}
            </h1>
            <span className="text-[10px] text-green-600 font-medium">My Account</span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3 text-whatsapp-iconGrey">
          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors relative group"
            title="Create New Group"
          >
            <MessageSquarePlus className="w-5 h-5" />
            <span className="absolute left-1/2 -translate-x-1/2 top-10 w-max hidden group-hover:block bg-gray-800 text-white text-[10px] py-1 px-2 rounded shadow-md z-30">
              New Group
            </span>
          </button>
          
          <button
            onClick={logout}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors relative group text-rose-500"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
            <span className="absolute left-1/2 -translate-x-1/2 top-10 w-max hidden group-hover:block bg-gray-800 text-white text-[10px] py-1 px-2 rounded shadow-md z-30">
              Log Out
            </span>
          </button>
        </div>
      </div>

      {/* Search area */}
      <div className="p-2.5 bg-white border-b border-whatsapp-borderLight">
        <div className="flex items-center gap-3 bg-whatsapp-searchBg px-3 py-1.5 rounded-lg">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm placeholder-gray-500 py-0.5 text-gray-700"
          />
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center justify-around border-b border-whatsapp-borderLight text-xs font-semibold text-gray-500 py-1 bg-gray-50">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 text-center transition-all ${
            activeTab === 'all'
              ? 'text-whatsapp-greenDark border-b-2 border-whatsapp-green'
              : 'hover:text-gray-800'
          }`}
        >
          All Chats
        </button>
        <button
          onClick={() => setActiveTab('direct')}
          className={`flex-1 py-2 text-center transition-all ${
            activeTab === 'direct'
              ? 'text-whatsapp-greenDark border-b-2 border-whatsapp-green'
              : 'hover:text-gray-800'
          }`}
        >
          Direct Messages
        </button>
        <button
          onClick={() => setActiveTab('group')}
          className={`flex-1 py-2 text-center transition-all ${
            activeTab === 'group'
              ? 'text-whatsapp-greenDark border-b-2 border-whatsapp-green'
              : 'hover:text-gray-800'
          }`}
        >
          Groups
        </button>
      </div>

      {/* Chat / User lists */}
      <div className="flex-1 overflow-y-auto bg-white">
        {/* Active chats */}
        {filteredChats.length > 0 && (
          <div>
            <div className="px-4 py-2 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Conversations
            </div>
            {filteredChats.map((chat) => {
              const isActive = activeChat?._id === chat._id;
              
              // Resolve details
              const chatName = chat.isGroupChat
                ? chat.chatName
                : getDirectChatInfo(chat).name;
              
              const isOnline = !chat.isGroupChat && getDirectChatInfo(chat).isOnline;
              const avatarChar = chat.isGroupChat ? '' : getDirectChatInfo(chat).avatarChar;
              const avatarColor = chat.isGroupChat ? 'bg-emerald-50 text-emerald-600' : getDirectChatInfo(chat).avatarColor;

              return (
                <div
                  key={chat._id}
                  onClick={() => setActiveChat(chat)}
                  className={`flex items-center justify-between p-3 border-b border-whatsapp-borderLight cursor-pointer transition-colors ${
                    isActive ? 'bg-[#eaeaea] hover:bg-[#eaeaea]' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-[45px] h-[45px] rounded-full flex items-center justify-center font-bold text-base ${avatarColor}`}
                      >
                        {chat.isGroupChat ? <Users className="w-5 h-5" /> : avatarChar}
                      </div>
                      
                      {/* Online dot */}
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>

                    {/* Chat Text Details */}
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-800 truncate">
                          {chatName}
                        </h2>
                        {chat.latestMessage && (
                          <span className="text-[10px] text-gray-400 flex-shrink-0">
                            {formatTime(chat.latestMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {chat.latestMessage ? (
                          <>
                            <span className="font-semibold text-gray-500 mr-1">
                              {chat.latestMessage.sender._id === currentUser?._id
                                ? 'You:'
                                : `${chat.latestMessage.sender.username}:`}
                            </span>
                            {chat.latestMessage.content}
                          </>
                        ) : (
                          <span className="italic text-gray-300">No messages yet</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Available Contacts section (for new DMs) */}
        {availableContacts.length > 0 && activeTab !== 'group' && (
          <div>
            <div className="px-4 py-2 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {searchQuery ? 'Available Contacts' : 'Start a New Chat'}
            </div>
            {availableContacts.map((contact) => (
              <div
                key={contact._id}
                onClick={() => accessChat(contact._id)}
                className="flex items-center gap-3 p-3 border-b border-whatsapp-borderLight hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {/* Avatar */}
                <div className="relative">
                  <div
                    className={`w-[45px] h-[45px] rounded-full flex items-center justify-center font-bold text-base ${getAvatarColor(
                      contact.username
                    )}`}
                  >
                    {contact.username.charAt(0).toUpperCase()}
                  </div>
                  {/* Online Dot */}
                  {onlineUsers[contact._id] && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  )}
                </div>

                {/* Name */}
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">
                    {contact.username}
                  </h2>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        onlineUsers[contact._id] ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    ></span>
                    {onlineUsers[contact._id] ? 'online' : 'offline'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty placeholder */}
        {filteredChats.length === 0 && availableContacts.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center h-48">
            <MessageSquare className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-400 font-medium">No chats or contacts found.</p>
            <p className="text-xs text-gray-300">Try searching for another user.</p>
          </div>
        )}
      </div>

      {/* Modal inclusion */}
      <NewGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
    </div>
  );
};

export default Sidebar;
