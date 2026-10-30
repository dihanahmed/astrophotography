// PhotoCard.jsx - One card: the image on top, details (title, description, buttons) below.
// Title and description are kept in local state so you can type freely,
// and only sent to the backend when you press "Save".

import { useState } from 'react';
import { READ_ONLY, deletePhoto, imageUrl, updatePhoto } from '../services/api.js';

const CAPTURED_LABELS = { seestar: 'Seestar', camera: 'Camera' };

export default function PhotoCard({ photo, onUpdated, onDeleted, onOpen }) {
  const [title, setTitle] = useState(photo.title);
  const [description, setDescription] = useState(photo.description);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }

  const [capturedBy, setCapturedBy] = useState(photo.capturedBy || '');

  const changed =
    title !== photo.title ||
    description !== photo.description ||
    capturedBy !== (photo.capturedBy || '');

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await updatePhoto(photo.id, title, description, capturedBy);
      onUpdated(updated);
      setMessage({ type: 'success', text: 'Saved!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    // window.confirm shows the browser's OK/Cancel popup
    if (!window.confirm(`Delete "${photo.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deletePhoto(photo.id);
      onDeleted(photo.id);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      setDeleting(false);
    }
  };

  return (
    <article className="card">
      {/* TOP: the photo. Clicking opens the lightbox. */}
      <button className="card-image-btn" onClick={() => onOpen(photo)} aria-label={`Open ${photo.title} full size`}>
        <img className="card-image" src={imageUrl(photo.filename)} alt={photo.title} loading="lazy" />
      </button>

      {/* BOTTOM: details */}
      <div className="card-details">
        {READ_ONLY ? (
          // Published site: plain text, no editing controls
          <>
            <h3 className="card-title card-title-static">{photo.title}</h3>
            <p className="card-text">{photo.description || 'No description yet.'}</p>
            {photo.capturedBy && (
              <p className="card-captured">Captured by: {CAPTURED_LABELS[photo.capturedBy]}</p>
            )}
          </>
        ) : (
          <>
        <input
          className="card-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Title"
        />
        <textarea
          className="card-description"
          placeholder="What is it? Equipment, exposure, date, location…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
        />
        {/* Decides which page (Seestar / Camera) this photo shows up on */}
        <label className="card-captured-field">
          Captured by
          <select value={capturedBy} onChange={(e) => setCapturedBy(e.target.value)}>
            <option value="">Not set</option>
            <option value="seestar">Seestar</option>
            <option value="camera">Camera</option>
          </select>
        </label>
        <div className="card-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !changed}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
          {message && <span className={`status status-${message.type}`}>{message.text}</span>}
        </div>
          </>
        )}
      </div>
    </article>
  );
}
