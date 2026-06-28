import React, { useState } from 'react';
import { X, Search, Check, Users } from 'lucide-react';
import { useChat } from '../context/ChatContext';

export const getAvatarColor = (username) => {
  const colors = [
    'bg-rose-400 text-white',
    'bg-pink-400 text-white',
    'bg-purple-400 text-white',
    'bg-indigo-400 text-white',
    'bg-blue-400 text-white',
    'bg-cyan-500 text-white',
    'bg-teal-500 text-white',
    'bg-emerald-500 text-white',
    'bg-amber-500 text-white',
    'bg-orange-400 text-white',
  ];
  if (!username) return colors[0];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const NewGroupModal = ({ isOpen, onClose }) => {
  const { users, currentUser, createGroupChat } = useChat();
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');

  if (!isOpen) return null;

  // Filter out the current user, then apply search query
  const eligibleUsers = users.filter(
    (u) =>
      u._id !== currentUser?._id &&
      u.username.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const handleToggleSelect = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    } else {
      setSelectedUsers(prev => [...prev, userId]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return alert('Please enter a group name.');
    if (selectedUsers.length === 0) return alert('Please select at least one member.');

    const result = await createGroupChat(groupName, selectedUsers);
    if (result) {
      setGroupName('');
      setSelectedUsers([]);
      setMemberSearch('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] animate-slide-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-whatsapp-green text-white">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Create New Group</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white opacity-85 hover:opacity-100 transition-opacity"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="flex-1 flex flex-col p-6 overflow-hidden">
          {/* Group Name input */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Group Subject
            </label>
            <input
              type="text"
              placeholder="e.g., Project Team, Family, Weekend Plan"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full border-b-2 border-gray-200 focus:border-whatsapp-green outline-none py-2 transition-colors text-sm font-medium"
              required
              autoFocus
            />
          </div>

          {/* Member Search input */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Add Group Members ({selectedUsers.length} selected)
            </label>
            <div className="flex items-center gap-2 bg-gray-150 px-3 py-1.5 bg-gray-100 rounded-lg">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search contact name..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-sm placeholder-gray-400 py-0.5"
              />
            </div>
          </div>

          {/* Members list */}
          <div className="flex-1 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50 max-h-[30vh]">
            {eligibleUsers.length > 0 ? (
              eligibleUsers.map((user) => {
                const isSelected = selectedUsers.includes(user._id);
                return (
                  <div
                    key={user._id}
                    onClick={() => handleToggleSelect(user._id)}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ${getAvatarColor(
                          user.username
                        )}`}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{user.username}</p>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.isOnline ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          ></span>
                          {user.isOnline ? 'online' : 'offline'}
                        </span>
                      </div>
                    </div>

                    {/* Checkbox circle */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-whatsapp-green bg-whatsapp-green'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-sm text-gray-400">
                No contacts found matching "{memberSearch}"
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedUsers.length === 0 || !groupName.trim()}
              className="px-5 py-2 bg-whatsapp-green hover:bg-whatsapp-greenDark disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors shadow-md flex items-center gap-1.5"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewGroupModal;
