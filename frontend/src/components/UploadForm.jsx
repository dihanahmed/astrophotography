// UploadForm.jsx - Admin upload box: pick an image, add title, description and "Captured by".
// The image is uploaded exactly as it is (original resolution, no compression), up to 25 MB.
// A progress bar shows how much has been sent. On success it calls onUploaded(photo).

import { useRef, useState } from 'react';
import { IMAGE_EXTENSIONS, MAX_IMAGE_BYTES, SAVED_MESSAGE, uploadPhoto } from '../services/api.js';

export default function UploadForm({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [capturedBy, setCapturedBy] = useState('');
  const [progress, setProgress] = useState(null); // null = not uploading, 0-100 = percent sent
  const [message, setMessage] = useState(null); // { type: 'error' | 'success', text }
  const fileInput = useRef(null); // lets us clear the file picker after upload

  const handleSubmit = async (e) => {
    e.preventDefault(); // stop the browser from reloading the page
    if (!file) return setMessage({ type: 'error', text: 'Please choose an image first.' });
    if (!IMAGE_EXTENSIONS.includes(file.name.split('.').pop().toLowerCase())) {
      return setMessage({ type: 'error', text: 'Only jpg, jpeg, png, webp and tif images are allowed.' });
    }
    if (file.size > MAX_IMAGE_BYTES) return setMessage({ type: 'error', text: 'Image is larger than 25 MB.' });
    if (!title.trim()) return setMessage({ type: 'error', text: 'Please enter a title.' });

    setProgress(0);
    setMessage(null);
    try {
      const photo = await uploadPhoto(file, { title: title.trim(), description, capturedBy }, setProgress);
      onUploaded(photo);
      setMessage({ type: 'success', text: SAVED_MESSAGE });
      setFile(null);
      setTitle('');
      setDescription('');
      setCapturedBy('');
      fileInput.current.value = '';
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setProgress(null);
    }
  };

  const uploading = progress !== null;

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
        <textarea
          placeholder="Description: what is it? Equipment, exposure, date, location…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <label className="card-captured-field">
          Captured by
          <select value={capturedBy} onChange={(e) => setCapturedBy(e.target.value)}>
            <option value="">Not set</option>
            <option value="seestar">Seestar</option>
            <option value="camera">Camera</option>
          </select>
        </label>
        <button type="submit" className="btn btn-primary" disabled={uploading}>
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </form>

      {uploading && (
        <div className="upload-progress">
          <progress max="100" value={progress} />
          <span>{progress < 100 ? `${progress}% sent` : 'Saving to GitHub…'}</span>
        </div>
      )}
      {file && !uploading && <p className="status">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
      {message && <p className={`status status-${message.type}`}>{message.text}</p>}
    </section>
  );
}
