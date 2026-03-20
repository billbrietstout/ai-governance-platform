"use client";

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: "default" | "large";
  disabled?: boolean;
};

export function Toggle({ checked, onChange, size = "default", disabled = false }: ToggleProps) {
  const isLarge = size === "large";
  const trackClasses = isLarge ? "h-7 w-12" : "h-5 w-9";
  const thumbClasses = isLarge ? "h-5 w-5" : "h-4 w-4";
  const thumbTranslate = isLarge
    ? checked
      ? "translate-x-5"
      : "translate-x-0.5"
    : checked
      ? "translate-x-4"
      : "translate-x-0.5";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`focus:ring-navy-500 relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${trackClasses} ${checked ? "bg-navy-600" : "bg-slate-200"} `}
    >
      <span
        className={`pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${thumbClasses} ${thumbTranslate} `}
      />
    </button>
  );
}
