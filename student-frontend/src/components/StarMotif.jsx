/** The one recurring visual signature for this system: a plain geometric
 * 8-point star (two overlapping squares) — an abstract architectural/
 * tessellation motif, used sparingly (auth screens, empty states, the
 * loading spinner) rather than repeated as wallpaper. */
export default function StarMotif({ size = 40, className = '', spin = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={`${spin ? 'animate-spin' : ''} ${className}`}
      style={spin ? { animationDuration: '2.4s' } : undefined}
      aria-hidden="true"
    >
      <g transform="translate(32,32)">
        <rect x="-16" y="-16" width="32" height="32" stroke="currentColor" strokeWidth="2.5" />
        <rect x="-16" y="-16" width="32" height="32" stroke="currentColor" strokeWidth="2.5" transform="rotate(45)" />
      </g>
    </svg>
  );
}
