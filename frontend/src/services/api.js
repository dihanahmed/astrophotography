// api.js - Every call to the backend lives here, so components stay simple.
// Each function returns the parsed JSON, or throws an Error with a friendly message.

export const API_URL = 'http://localhost:5001';

// READ_ONLY is true for the published site (built with `npm run build:static`).
// In that mode there is no backend: photos come from static files, and editing is disabled.
export const READ_ONLY = import.meta.env.VITE_READ_ONLY === 'true';
const BASE = import.meta.env.BASE_URL;

// Full URL of an image file.
export const imageUrl = (filename) =>
  READ_ONLY ? `${BASE}photos/${filename}` : `${API_URL}/uploads/${filename}`;

// Shared helper: check the response and throw the server's error message if it failed.
async function handle(response) {
  let data = null;
  try {
    data = await response.json();
  } catch {
    // response had no JSON body
  }
  if (!response.ok) throw new Error((data && data.error) || 'Request failed.');
  return data;
}

// fetch() itself throws if the server can't be reached; give that a clearer message.
async function request(url, options) {
  try {
    return await handle(await fetch(url, options));
  } catch (err) {
    if (err instanceof TypeError) throw new Error('Cannot reach the server. Is the backend running?');
    throw err;
  }
}

// Read-only: load the exported photos.json file. Otherwise: ask the backend.
// 'no-cache' makes the browser check for a newer photos.json every time,
// so a fresh deploy never shows an old, cached photo list.
export const getPhotos = () =>
  READ_ONLY
    ? request(`${BASE}photos.json`, { cache: 'no-cache' })
    : request(`${API_URL}/api/photos`);

// Uploads use FormData (needed for sending files). Don't set Content-Type manually.
export const uploadPhoto = (file, title) => {
  const form = new FormData();
  form.append('image', file);
  form.append('title', title);
  return request(`${API_URL}/api/photos`, { method: 'POST', body: form });
};

export const updatePhoto = (id, title, description, capturedBy) =>
  request(`${API_URL}/api/photos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, capturedBy }),
  });

export const deletePhoto = (id) => request(`${API_URL}/api/photos/${id}`, { method: 'DELETE' });
