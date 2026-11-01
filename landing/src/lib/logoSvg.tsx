/** Logo mark as plain SVG elements, for next/og image generation (icons, social preview). */
export function LogoSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x="3" y="3" width="50" height="50" rx="13" fill="#fafafa" />
      <g transform="translate(8 8) scale(1.67)" stroke="#0a0a0a" strokeWidth="1.9" strokeLinejoin="round">
        <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5Z" />
        <path d="M12 6.5v13" />
      </g>
      <rect x="37" y="47" width="24" height="10" rx="5" fill="#facc15" transform="rotate(-12 49 52)" />
    </svg>
  );
}
