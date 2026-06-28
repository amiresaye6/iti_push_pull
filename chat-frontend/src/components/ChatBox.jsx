/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from 'react';

// Helper function to deduplicate and sort messages by ID
const mergeMessages = (prev, newMsgs) => {
  const map = new Map();
  prev.forEach(m => map.set(m._id, m));
  newMsgs.forEach(m => map.set(m._id, m));
  return Array.from(map.values()).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

export default function ChatBox({ currentUser, targetUser, mode }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pollStatus, setPollStatus] = useState('idle'); // idle, polling, waiting
  
  const messagesEndRef = useRef(null);
  
  const stateRef = useRef({
    currentUser,
    targetUser,
    mode,
    lastTimestamp: new Date(0).toISOString()
  });

  const abortControllerRef = useRef(null);
  const shortPollIntervalRef = useRef(null);

  useEffect(() => {
    stateRef.current = {
      ...stateRef.current,
      currentUser,
      targetUser,
      mode
    };
  }, [currentUser, targetUser, mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!targetUser) return;

    setMessages([]);
    stateRef.current.lastTimestamp = new Date(0).toISOString();
    setPollStatus('idle');

    cleanupActivePolls();

    const loadHistory = async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      try {
        const res = await fetch(`${apiUrl}/api/messages?sender=${encodeURIComponent(currentUser)}&receiver=${encodeURIComponent(targetUser)}`);
        const data = await res.json();
        
        if (data.length > 0) {
          setMessages(data);
          const lastMsg = data[data.length - 1];
          stateRef.current.lastTimestamp = lastMsg.createdAt;
        }

        if (stateRef.current.mode === 'short') {
          startShortPolling();
        } else {
          startLongPolling();
        }

      } catch (err) {
        console.error('Failed to load chat history:', err);
        if (stateRef.current.mode === 'short') startShortPolling();
        else startLongPolling();
      }
    };

    loadHistory();

    return () => {
      cleanupActivePolls();
    };
  }, [targetUser, mode]);

  const cleanupActivePolls = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (shortPollIntervalRef.current) {
      clearInterval(shortPollIntervalRef.current);
      shortPollIntervalRef.current = null;
    }
  };

  const startShortPolling = () => {
    setPollStatus('polling');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    const pollTick = async () => {
      const { currentUser: s, targetUser: r, lastTimestamp: since } = stateRef.current;
      
      try {
        const url = `${apiUrl}/api/messages?sender=${encodeURIComponent(s)}&receiver=${encodeURIComponent(r)}&since=${encodeURIComponent(since)}`;
        const res = await fetch(url);
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();
        
        if (data.length > 0) {
          setMessages(prev => mergeMessages(prev, data));
          stateRef.current.lastTimestamp = data[data.length - 1].createdAt;
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Short poll error:', err);
      }
    };

    pollTick();
    shortPollIntervalRef.current = setInterval(pollTick, 3000);
  };

  const startLongPolling = () => {
    setPollStatus('waiting');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    const runLongPoll = async () => {
      const { currentUser: s, targetUser: r, lastTimestamp: since, mode: currentMode } = stateRef.current;
      
      if (currentMode !== 'long' || r !== targetUser) return;

      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      try {
        const url = `${apiUrl}/api/messages/long-poll?sender=${encodeURIComponent(s)}&receiver=${encodeURIComponent(r)}&since=${encodeURIComponent(since)}`;
        const res = await fetch(url, { signal: abortControllerRef.current.signal });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();

        if (data.length > 0) {
          setMessages(prev => mergeMessages(prev, data));
          stateRef.current.lastTimestamp = data[data.length - 1].createdAt;
        }

        // Trigger next long poll instantly
        runLongPoll();
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Long poll error:', err);

        // Retry after 3 seconds on error
        setTimeout(() => {
          if (stateRef.current.mode === 'long' && stateRef.current.targetUser === r) {
            runLongPoll();
          }
        }, 3000);
      }
    };

    runLongPoll();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    try {
      const response = await fetch(`${apiUrl}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: currentUser,
          receiver: targetUser,
          text: textToSend
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const sentMsg = await response.json();
      
      setMessages(prev => mergeMessages(prev, [sentMsg]));
      
      if (new Date(sentMsg.createdAt) > new Date(stateRef.current.lastTimestamp)) {
        stateRef.current.lastTimestamp = sentMsg.createdAt;
      }
      
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Could not send message: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const isShortMode = mode === 'short';
  const indicatorClass = isShortMode 
    ? 'short-polling-active' 
    : (pollStatus === 'waiting' ? 'long-polling-waiting' : 'long-polling-active');
    
  const indicatorLabel = isShortMode 
    ? 'Short Polling (3s)' 
    : 'Long Polling (suspended)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div className="chat-header">
        <div className="chat-recipient-info">
          <div className="avatar" style={{ background: isShortMode ? 'var(--short-poll-color)' : 'var(--long-poll-color)' }}>
            {targetUser.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="chat-recipient-name">{targetUser}</div>
            <div className="chat-recipient-status">Mode: {isShortMode ? 'Short Poll' : 'Long Poll'}</div>
          </div>
        </div>

        <div className={`connection-indicator ${indicatorClass}`}>
          <div className="indicator-led"></div>
          <span>{indicatorLabel}</span>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="chat-placeholder">
            <div className="placeholder-icon">💬</div>
            <h3>No messages yet</h3>
            <p>Start the conversation by sending a message below.</p>
          </div>
        ) : (
          messages.map(msg => {
            const isOutgoing = msg.sender === currentUser;
            const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return (
              <div key={msg._id} className={`message-wrapper ${isOutgoing ? 'outgoing' : 'incoming'}`}>
                <div className="message-bubble">{msg.text}</div>
                <div className="message-time">{time}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-bar">
        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            className="message-input"
            placeholder={`Type a message...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending}
          />
          <button type="submit" className="send-btn" disabled={isSending || !inputText.trim()}>
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
