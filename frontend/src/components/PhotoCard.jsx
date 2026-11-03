// PhotoCard.jsx - One homepage card: the image on top, then title, description and "Captured by".
// Read-only; editing happens in the admin panel (AdminPhotoCard.jsx).

import { imageUrl } from '../services/api.js';

export const CAPTURED_LABELS = { seestar: 'Seestar', camera: 'Camera' };

export default function PhotoCard({ photo, onOpen }) {
  return (
    <article className="card">
      {/* TOP: the photo. Clicking opens the lightbox. */}
      <button className="card-image-btn" onClick={() => onOpen(photo)} aria-label={`Open ${photo.title} full size`}>
        <img className="card-image" src={imageUrl(photo.filename)} alt={photo.title} loading="lazy" />
      </button>

      {/* BOTTOM: details */}
      <div className="card-details">
        <h3 className="card-title card-title-static">{photo.title}</h3>
        <p className="card-text">{photo.description || 'No description yet.'}</p>
        {photo.capturedBy && (
          <p className="card-captured">Captured by: {CAPTURED_LABELS[photo.capturedBy]}</p>
        )}
      </div>
    </article>
  );
}
