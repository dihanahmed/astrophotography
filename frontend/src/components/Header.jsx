// Header.jsx - Centered box with your name and contact info.
// The values come from src/config/profile.js, so edit them there.

import profile from '../config/profile.js';

export default function Header() {
  return (
    <header className="header">
      <h1 className="header-name">{profile.name}</h1>
      <p className="header-subtitle">Astrophotography</p>
      <ul className="header-contact">
        <li>
          <a href={`mailto:${profile.email}`}>✉ {profile.email}</a>
        </li>
        <li>
          {/* Link only if an Instagram URL is set in profile.js */}
          {profile.instagramUrl ? (
            <a href={profile.instagramUrl} target="_blank" rel="noreferrer">
              ◎ {profile.instagram}
            </a>
          ) : (
            <>◎ {profile.instagram}</>
          )}
        </li>
        <li>⌖ {profile.location}</li>
      </ul>
    </header>
  );
}
