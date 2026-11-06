// PhotoCard.jsx - One homepage card: the image on top, then title, description, "Captured by"
// and a "View full image" button. Both the image and the button open the same full-screen viewer (Lightbox.jsx).
// Read-only; editing happens in the admin panel (AdminPhotoCard.jsx).

import { imageUrl } from '../services/api.js';

export const CAPTURED_LABELS = { seestar: 'Seestar', camera: 'Camera' };

export default function PhotoCard({ photo, onOpen }) {
  return (
    <article className="card">
      {/* TOP: the photo. Clicking opens the lightbox. */}
      <button className="card-image-btn" onClick={() => onOpen(photo)} aria-label={`Open ${photo.title} full size`}>
        <img className="card-image" src={imageUrl(photo.filename)} alt={photo.title} loading="lazy" decoding="async" />
      </button>

      {/* BOTTOM: details */}
      <div className="card-details">
        <h3 className="card-title card-title-static">{photo.title}</h3>
        <p className="card-text">{photo.description || 'No description yet.'}</p>
        {photo.capturedBy && (
          <p className="card-captured">Captured by: {CAPTURED_LABELS[photo.capturedBy]}</p>
        )}

        {/* Same as clicking the image: opens the full-screen viewer, with a ✕ to close it. */}
        <button className="btn btn-primary card-full-view" onClick={() => onOpen(photo)}>
          View full image
        </button>
      </div>
    </article>
  );
}
