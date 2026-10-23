// App.jsx - Main layout: Header + Upload form + Gallery.
// This component owns the list of photos (state) and passes it, plus
// functions to change it, down to the child components.

import { useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import UploadForm from './components/UploadForm.jsx';
import Gallery from './components/Gallery.jsx';
import Lightbox from './components/Lightbox.jsx';
import { getPhotos, READ_ONLY } from './services/api.js';

export default function App() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxPhoto, setLightboxPhoto] = useState(null); // photo shown full-size, or null

  // Load photos once when the page opens.
  useEffect(() => {
    getPhotos()
      .then(setPhotos)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Helpers that update the list without reloading from the server.
  const addPhoto = (photo) => setPhotos((prev) => [photo, ...prev]);
  const replacePhoto = (photo) => setPhotos((prev) => prev.map((p) => (p.id === photo.id ? photo : p)));
  const removePhoto = (id) => setPhotos((prev) => prev.filter((p) => p.id !== id));

  return (
    <main className="container">
      <Header />
      {/* Uploading is only available when running locally */}
      {!READ_ONLY && <UploadForm onUploaded={addPhoto} />}

      {loading && <p className="status">Loading astrophotos…</p>}
      {error && <p className="status status-error">{error}</p>}

      {!loading && !error && (
        <Gallery
          photos={photos}
          onUpdated={replacePhoto}
          onDeleted={removePhoto}
          onOpen={setLightboxPhoto}
        />
      )}

      {lightboxPhoto && <Lightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />}
    </main>
  );
}
