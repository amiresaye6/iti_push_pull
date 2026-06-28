import React, { useState } from 'react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError('');

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    try {
      const response = await fetch(`${apiUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      if (!response.ok) {
        throw new Error('Failed to register/login user');
      }

      const data = await response.json();
      onLoginSuccess(data.username);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1 className="login-logo">💬 Polling Chat</h1>
        <p className="login-subtitle">Simple Short vs. Long Polling Demo</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Enter your username</label>
            <input
              type="text"
              id="username"
              className="form-input"
              placeholder="e.g. Alice, Bob"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</div>}
          
          <button type="submit" className="btn-primary" disabled={loading || !username.trim()}>
            {loading ? 'Joining...' : 'Enter Chatroom'}
          </button>
        </form>
      </div>
    </div>
  );
}
