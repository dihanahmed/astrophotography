// AdminPage.jsx - The page at #/admin. Shows the login form, or the admin panel once logged in.
// Even if someone forces the panel to show, the Worker refuses every change without a valid login.

import { useEffect, useState } from 'react';
import LoginForm from './LoginForm.jsx';
import AdminPanel from './AdminPanel.jsx';
import { SESSION_ENDED_EVENT, isLoggedIn, logout } from '../services/api.js';

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);

  // api.js sends this signal when the Worker says the login expired: go back to the login form.
  useEffect(() => {
    const onEnded = () => setLoggedIn(false);
    window.addEventListener(SESSION_ENDED_EVENT, onEnded);
    return () => window.removeEventListener(SESSION_ENDED_EVENT, onEnded);
  }, []);

  const handleLogout = () => {
    logout();
    setLoggedIn(false);
  };

  return (
    <main className="container">
      {loggedIn ? <AdminPanel onLogout={handleLogout} /> : <LoginForm onLoggedIn={() => setLoggedIn(true)} />}
    </main>
  );
}
