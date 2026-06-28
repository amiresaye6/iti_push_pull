import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { getAvatarColor } from './NewGroupModal';

const formatMessageTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MessageBubble = ({ message, currentUserId, isGroupChat }) => {
  if (!message || !message.sender) return null;

  const isSent = message.sender._id === currentUserId;
  const senderName = message.sender.username;

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-1.5 px-4`}>
      {/* Bubble Container */}
      <div
        className={`relative max-w-[70%] sm:max-w-[60%] md:max-w-[50%] px-3 py-1.5 shadow-sm rounded-md transition-all ${
          isSent
            ? 'bg-whatsapp-bubbleSent text-gray-800 rounded-tr-none'
            : 'bg-whatsapp-bubbleRecv text-gray-800 rounded-tl-none'
        }`}
      >
        {/* Sender display for group chat */}
        {!isSent && isGroupChat && (
          <p className={`text-[11px] font-bold mb-0.5 tracking-wide leading-none ${getAvatarColor(senderName).split(' ')[0].replace('bg-', 'text-')}`}>
            {senderName}
          </p>
        )}

        {/* Message Content */}
        <p className="text-[13.5px] leading-relaxed break-words whitespace-pre-wrap pr-10">
          {message.content}
        </p>

        {/* Timestamp and Delivery Status */}
        <div className="absolute bottom-1 right-1.5 flex items-center gap-0.5 select-none">
          <span className="text-[9px] text-gray-400 font-medium">
            {formatMessageTime(message.createdAt)}
          </span>
          {isSent && (
            <CheckCheck className="w-3.5 h-3.5 text-blue-500 ml-0.5" />
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
