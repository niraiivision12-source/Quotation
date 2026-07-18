import { create } from "zustand";

export interface Shortcut {
  id: string;
  keys: string; // e.g. "alt+q", "mod+enter", "/"
  description: string;
  category: string; // e.g. "Navigation", "Quotation", "Lists"
  action: (e: KeyboardEvent) => void;
  allowInInputs?: boolean;
  preventDefault?: boolean;
}

interface ShortcutState {
  shortcuts: Shortcut[];
  register: (shortcut: Shortcut) => void;
  unregister: (id: string) => void;
}

export const useShortcutStore = create<ShortcutState>((set) => ({
  shortcuts: [],
  register: (shortcut) =>
    set((state) => {
      const filtered = state.shortcuts.filter((s) => s.id !== shortcut.id);
      return { shortcuts: [...filtered, shortcut] };
    }),
  unregister: (id) =>
    set((state) => ({
      shortcuts: state.shortcuts.filter((s) => s.id !== id),
    })),
}));

export function isInputElement(el: HTMLElement | null): boolean {
  if (!el) return false;
  const tagName = el.tagName.toLowerCase();
  if (tagName === "input") {
    const type = (el as HTMLInputElement).type?.toLowerCase();
    const textInputs = [
      "text",
      "number",
      "email",
      "password",
      "search",
      "tel",
      "url",
      "date",
      "datetime-local",
      "month",
      "week",
      "time",
    ];
    return textInputs.includes(type);
  }
  return tagName === "textarea" || tagName === "select" || el.isContentEditable;
}

export function matchesPattern(e: KeyboardEvent, pattern: string): boolean {
  const parts = pattern.toLowerCase().split("+");
  
  // Detect if on Mac OS
  const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  
  const hasCtrl = parts.includes("ctrl") || (parts.includes("mod") && !isMac);
  const hasMeta = parts.includes("meta") || (parts.includes("mod") && isMac);
  const hasAlt = parts.includes("alt");
  const hasShift = parts.includes("shift");
  
  const modifiers = ["ctrl", "meta", "alt", "shift", "mod"];
  const keyPart = parts.find((p) => !modifiers.includes(p));
  
  if (!keyPart) return false;

  const pressedKey = e.key.toLowerCase();
  
  return (
    e.ctrlKey === hasCtrl &&
    e.metaKey === hasMeta &&
    e.altKey === hasAlt &&
    e.shiftKey === hasShift &&
    pressedKey === keyPart
  );
}
