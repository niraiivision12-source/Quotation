import { useEffect } from "react";
import { useShortcutStore, Shortcut } from "../store/shortcut.store";

export function useKeyboardShortcuts(shortcuts: Shortcut[], deps: any[] = []) {
  useEffect(() => {
    const store = useShortcutStore.getState();

    // Register shortcuts
    shortcuts.forEach((s) => {
      store.register(s);
    });

    // Cleanup shortcuts on unmount or updates
    return () => {
      const currentStore = useShortcutStore.getState();
      shortcuts.forEach((s) => {
        currentStore.unregister(s.id);
      });
    };
  }, deps);
}
