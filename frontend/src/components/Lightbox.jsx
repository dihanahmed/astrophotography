// Lightbox.jsx - Full-screen overlay showing one photo large.
// Close it by clicking the dark background, the ✕ button, or pressing Escape.

import { useEffect } from 'react';
import { imageUrl } from '../services/api.js';

export default function Lightbox({ photo, onClose }) {
  // Listen for the Escape key while the lightbox is open.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey); // cleanup when closed
  }, [onClose]);

  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-label={photo.title}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">✕</button>
      {/* stopPropagation: clicking the image itself shouldn't close it */}
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl(photo.filename)} alt={photo.title} />
        <figcaption>{photo.title}</figcaption>
      </figure>
    </div>
  );
}
