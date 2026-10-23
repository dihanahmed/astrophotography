// UploadForm.jsx - Pick an image, type a title, upload it.
// On success it calls onUploaded(photo) so App adds the new card to the gallery.

import { useRef, useState } from 'react';
import { uploadPhoto } from '../services/api.js';

export default function UploadForm({ onUploaded }) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'error' | 'success', text }
  const fileInput = useRef(null); // lets us clear the file picker after upload

  const handleSubmit = async (e) => {
    e.preventDefault(); // stop the browser from reloading the page
    if (!file) return setMessage({ type: 'error', text: 'Please choose an image first.' });
    if (!title.trim()) return setMessage({ type: 'error', text: 'Please enter a title.' });

    setUploading(true);
    setMessage(null);
    try {
      const photo = await uploadPhoto(file, title.trim());
      onUploaded(photo);
      setMessage({ type: 'success', text: 'Uploaded! Add a description on the new card.' });
      setTitle('');
      setFile(null);
      fileInput.current.value = '';
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="upload">
      <h2>Upload Astrophoto</h2>
      <form className="upload-form" onSubmit={handleSubmit}>
        <input
          ref={fileInput}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.tif,.tiff"
          onChange={(e) => setFile(e.target.files[0] || null)}
        />
        <input
          type="text"
          placeholder="Title (e.g. Orion Nebula M42)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={uploading}>
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </form>
      {message && <p className={`status status-${message.type}`}>{message.text}</p>}
    </section>
  );
}
