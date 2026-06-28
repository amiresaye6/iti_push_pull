import React, { useState } from 'react';
import Login from './components/Login';
import UserList from './components/UserList';
import ChatBox from './components/ChatBox';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  const [mode, setMode] = useState('short');

  const handleLoginSuccess = (username) => {
    setCurrentUser(username);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setTargetUser(null);
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <div className="app-layout">
        {/* Sidebar */}
        <UserList
          currentUser={currentUser}
          activeUser={targetUser}
          onSelectUser={setTargetUser}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className="main-chat-area">
          {/* Tabs */}
          <div className="chat-tabs">
            <button
              className={`tab-btn short-polling ${mode === 'short' ? 'active' : ''}`}
              onClick={() => setMode('short')}
            >
              Short Polling
              <span className="tab-badge">3s</span>
            </button>
            <button
              className={`tab-btn long-polling ${mode === 'long' ? 'active' : ''}`}
              onClick={() => setMode('long')}
            >
              Long Polling
              <span className="tab-badge">Suspended</span>
            </button>
          </div>

          {targetUser ? (
            <ChatBox
              key={`${targetUser}-${mode}`}
              currentUser={currentUser}
              targetUser={targetUser}
              mode={mode}
            />
          ) : (
            <div className="chat-placeholder">
              <div className="placeholder-icon">💬</div>
              <h2>Select a user to chat</h2>
              <p>Choose a contact from the active list on the left to start sending messages.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
