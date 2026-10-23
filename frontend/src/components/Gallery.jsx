// Gallery.jsx - Grid of photo cards (2 per row on desktop, 1 on mobile; see global.css).
// Shows a friendly message when there are no photos yet.

import PhotoCard from './PhotoCard.jsx';
import { READ_ONLY } from '../services/api.js';

export default function Gallery({ photos, onUpdated, onDeleted, onOpen }) {
  if (photos.length === 0) {
    return <p className="empty">{READ_ONLY ? 'No astrophotos yet — check back soon!' : 'No astrophotos yet — upload your first one!'}</p>;
  }

  return (
    <section className="gallery">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          onUpdated={onUpdated}
          onDeleted={onDeleted}
          onOpen={onOpen}
        />
      ))}
    </section>
  );
}
