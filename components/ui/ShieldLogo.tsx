/**
 * App logo – shield with circuit pattern (enterprise governance aesthetic).
 */
export function ShieldLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      width={32}
      height={32}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5b8cff" />
          <stop offset="100%" stopColor="#3367ff" />
        </linearGradient>
      </defs>
      <path
        d="M16 2L4 8v8c0 8 6 12 12 14 6-2 12-6 12-14V8L16 2z"
        stroke="url(#shieldGrad)"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Circuit pattern */}
      <path d="M10 12h4v2h-4z" fill="currentColor" className="text-navy-400" />
      <path d="M18 12h4v2h-4z" fill="currentColor" className="text-navy-400" />
      <path d="M12 14v4h2v-4z" fill="currentColor" className="text-navy-400" />
      <path d="M18 14v4h2v-4z" fill="currentColor" className="text-navy-400" />
      <path d="M14 16h4v2h-4z" fill="currentColor" className="text-navy-400" />
      <path d="M16 10v2" stroke="currentColor" strokeWidth="1" className="text-navy-400" />
      <path d="M16 18v4" stroke="currentColor" strokeWidth="1" className="text-navy-400" />
    </svg>
  );
}
