// LoginForm.jsx - Username + password box. On success it calls onLoggedIn().

import { useState } from 'react';
import { login } from '../services/api.js';

export default function LoginForm({ onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); // stop the browser from reloading the page
    setBusy(true);
    setError('');
    try {
      await login(username, password);
      onLoggedIn();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <section className="login">
      <h1 className="login-title">Admin login</h1>
      <form className="login-form" onSubmit={handleSubmit}>
        <label>
          Username
          <input type="text" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      {error && <p className="status status-error">{error}</p>}
      <a className="login-back" href="#/">← Back to homepage</a>
    </section>
  );
}
