import React from "react";

export function highlightText(text: string, search: string): React.ReactNode {
  if (!text) return "";
  if (!search || !search.trim()) return text;
  
  const trimmed = search.trim();
  const regex = new RegExp(`(${escapeRegExp(trimmed)})`, "gi");
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="bg-amber-100 font-semibold text-amber-950 px-0.5 rounded-sm">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
