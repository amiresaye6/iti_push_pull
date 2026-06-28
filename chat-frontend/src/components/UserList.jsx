import React, { useEffect, useState } from 'react';

export default function UserList({ currentUser, activeUser, onSelectUser, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    try {
      const response = await fetch(`${apiUrl}/api/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.filter(u => u.username !== currentUser));
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  return (
    <aside className="sidebar">
      <div className="user-profile">
        <div className="profile-info">
          <div className="avatar">
            {currentUser.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="profile-name">{currentUser}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--short-poll-color)' }}>● Online</div>
          </div>
        </div>
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </div>

      <div className="sidebar-title">Choose Chat Contact</div>
      
      <div className="user-list">
        {loading && users.length === 0 ? (
          <div style={{ padding: '16px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Loading users...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: '16px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>No other users online. Open another window to login.</div>
        ) : (
          users.map(user => (
            <div
              key={user._id}
              className={`user-item ${activeUser === user.username ? 'active' : ''}`}
              onClick={() => onSelectUser(user.username)}
            >
              <div className="user-item-avatar">
                {user.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="user-item-name">{user.username}</div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
