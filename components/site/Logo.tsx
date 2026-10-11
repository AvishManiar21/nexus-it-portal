// Brand mark: a solid square monogram in the brand color (matches app/icon.svg).
export default function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="6" fill="#0369a1" />
      <path d="M10 22V10h2.4l7.2 8.2V10H22v12h-2.4l-7.2-8.2V22z" fill="#fff" />
    </svg>
  );
}
