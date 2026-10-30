// PageNav.jsx - Three buttons in the top-right corner that switch between
// the "pages": All photos, Seestar captures, Camera captures.
// There is no real URL routing; App just remembers which page is active,
// which also works on the static GitHub Pages site.

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
    </nav>
  );
}
