// Gallery.jsx - Grid of photo cards (2 per row on desktop, 1 on mobile; see global.css).
// Shows a friendly message when there are no photos yet.

import PhotoCard from './PhotoCard.jsx';

export default function Gallery({ photos, onOpen }) {
  if (photos.length === 0) {
    return <p className="empty">No astrophotos yet — check back soon!</p>;
  }

  return (
    <section className="gallery">
      {photos.map((photo) => (
        <PhotoCard key={photo.id} photo={photo} onOpen={onOpen} />
      ))}
    </section>
  );
}
