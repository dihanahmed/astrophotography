// PageNav.jsx - Buttons in the top-right corner: three that switch between
// the "pages" (All photos, Seestar captures, Camera captures), plus "Admin".
// The three filters don't change the URL; HomePage just remembers which is active.

// value = what a photo's "capturedBy" must equal to appear on that page ('' = show everything)
export const PAGES = [
  { value: '', label: 'All Photos' },
  { value: 'seestar', label: 'Seestar Captures' },
  { value: 'camera', label: 'Camera Captures' },
];

export default function PageNav({ active, onChange }) {
  return (
    <nav className="page-nav" aria-label="Photo pages">
      {PAGES.map((page) => (
        <button
          key={page.value}
          className={`page-nav-btn${active === page.value ? ' active' : ''}`}
          onClick={() => onChange(page.value)}
          aria-current={active === page.value ? 'page' : undefined}
        >
          {page.label}
        </button>
      ))}
      {/* Opens the admin login page (see App.jsx) */}
      <a className="page-nav-btn" href="#/admin">Admin</a>
    </nav>
  );
}
