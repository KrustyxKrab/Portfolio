// Shared by the launcher and folder cards in both languages.
const refinementVersion = '2026-10-25-2';
const refinedPaths = new Set(
  ['journal', 'photos', 'contact', 'ideas', 'career'].map(name => `/os-icons/${name}.webp`),
);

export function iconSrc(icon: string): string {
  // Keep existing journal references working; new folders can use a clear name.
  const name = icon === 'folder' ? 'journal' : icon;
  const src = name.startsWith('/') ? name : name.includes('.') ? `/icons/${name}` : `/os-icons/${name}.webp`;
  // Replaced public assets need a new URL to bypass cached earlier artwork.
  return refinedPaths.has(src) ? `${src}?v=${refinementVersion}` : src;
}
