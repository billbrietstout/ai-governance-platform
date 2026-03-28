"use client";

import { useState } from "react";

type Props = {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
};

export function Tooltip({ content, children, side = "top" }: Props) {
  const [visible, setVisible] = useState(false);

  const position =
    side === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
      : side === "bottom"
        ? "top-full left-1/2 -translate-x-1/2 mt-2"
        : side === "left"
          ? "right-full top-1/2 -translate-y-1/2 mr-2"
          : "left-full top-1/2 -translate-y-1/2 ml-2";

  return (
    <div
      className="relative inline-flex cursor-help"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={`pointer-events-none absolute z-50 ${position} border-slatePro-700 bg-slatePro-900 text-slatePro-200 max-w-xs rounded-lg border px-3 py-2 text-xs shadow-xl`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
