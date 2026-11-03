// HomePage.jsx - The public homepage: page buttons + Admin button, header, and the gallery.
// This component owns the list of photos (state) and the active page filter.

import { useEffect, useState } from 'react';
import Header from './Header.jsx';
import PageNav from './PageNav.jsx';
import Gallery from './Gallery.jsx';
import Lightbox from './Lightbox.jsx';
import { getPhotos } from '../services/api.js';

export default function HomePage() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxPhoto, setLightboxPhoto] = useState(null); // photo shown full-size, or null
  const [page, setPage] = useState(''); // active page filter (see PageNav)

  // Load photos once when the page opens.
  useEffect(() => {
    getPhotos()
      .then(setPhotos)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Which page is showing: '' = all, 'seestar', or 'camera'.
  // Photos with no "captured by" value only appear on "All Photos".
  const visiblePhotos = page ? photos.filter((p) => p.capturedBy === page) : photos;

  return (
    <main className="container">
      <PageNav active={page} onChange={setPage} />
      <Header />

      {loading && <p className="status">Loading astrophotos…</p>}
      {error && <p className="status status-error">{error}</p>}

      {!loading && !error && <Gallery photos={visiblePhotos} onOpen={setLightboxPhoto} />}

      {lightboxPhoto && <Lightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />}
    </main>
  );
}
