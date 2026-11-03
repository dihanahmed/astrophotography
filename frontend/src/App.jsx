// App.jsx - Picks which page to show, based on the part of the URL after "#".
//   .../#/admin  -> admin login / admin panel
//   anything else -> the homepage
// "Hash" URLs work on GitHub Pages, which can't route real paths like /admin to our app.

import { useEffect, useState } from 'react';
import HomePage from './components/HomePage.jsx';
import AdminPage from './components/AdminPage.jsx';

export default function App() {
  const [hash, setHash] = useState(window.location.hash);

  // Listen for the hash changing (clicking an "#/..." link, or the back button).
  useEffect(() => {
    const onHashChange = () => {
      setHash(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return hash === '#/admin' ? <AdminPage /> : <HomePage />;
}
