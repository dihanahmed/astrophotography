// AdminPanel.jsx - Shown after login: toolbar (Back / Logout), upload form, and an editable card per photo.
// The photo list comes from the Worker (straight from GitHub), so it's always current,
// even while the live site is still rebuilding.

import { useEffect, useState } from 'react';
import UploadForm from './UploadForm.jsx';
import AdminPhotoCard from './AdminPhotoCard.jsx';
import { getAdminPhotos } from '../services/api.js';

export default function AdminPanel({ onLogout }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(''); // message shown after a delete

  useEffect(() => {
    getAdminPhotos()
      .then(setPhotos)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Helpers that update the list without reloading from the server.
  const addPhoto = (photo) => setPhotos((prev) => [photo, ...prev]);
  const replacePhoto = (photo) => setPhotos((prev) => prev.map((p) => (p.id === photo.id ? photo : p)));
  const removePhoto = (id) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setNotice('Deleted! The live site will update in 1–2 minutes.');
  };

  return (
    <>
      <div className="admin-toolbar">
        <h1 className="admin-title">Admin</h1>
        <a className="page-nav-btn" href="#/">← Back to homepage</a>
        <button className="page-nav-btn" onClick={onLogout}>Logout</button>
      </div>

      <UploadForm onUploaded={addPhoto} />

      {notice && <p className="status status-success admin-notice">{notice}</p>}
      {loading && <p className="status">Loading photos…</p>}
      {error && <p className="status status-error">{error}</p>}

      {!loading && !error && photos.length === 0 && <p className="empty">No photos yet — upload your first one!</p>}
      <section className="gallery">
        {photos.map((photo) => (
          <AdminPhotoCard key={photo.id} photo={photo} onUpdated={replacePhoto} onDeleted={removePhoto} />
        ))}
      </section>
    </>
  );
}
