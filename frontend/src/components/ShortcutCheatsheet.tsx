import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useShortcutStore } from "../store/shortcut.store";
import { Keyboard } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShortcutCheatsheet({ open, onOpenChange }: Props) {
  const shortcuts = useShortcutStore((state) => state.shortcuts);

  // Group shortcuts by category
  const categories = shortcuts.reduce<Record<string, typeof shortcuts>>((acc, s) => {
    if (!acc[s.category]) {
      acc[s.category] = [];
    }
    acc[s.category].push(s);
    return acc;
  }, {});

  const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/80 shadow-2xl p-0 overflow-hidden text-gray-800 animate-in zoom-in-95 duration-200">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-gray-50/50">
          <DialogTitle className="text-lg font-bold flex items-center gap-2.5 text-gray-900">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Keyboard size={20} />
            </div>
            Keyboard Shortcuts Manual
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
          {Object.keys(categories).length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-4">No active shortcuts in this view.</p>
          ) : (
            Object.entries(categories).map(([category, items]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100/50 transition-all duration-150"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {item.description}
                      </span>
                      <div className="flex gap-1">
                        {item.keys.split("+").map((keyPart, idx) => (
                          <kbd
                            key={idx}
                            className="px-2 py-1 text-xs font-mono font-bold bg-white text-gray-800 border border-gray-200 rounded-md shadow-sm uppercase shrink-0"
                          >
                            {keyPart === "mod" ? (isMac ? "⌘" : "Ctrl") : keyPart}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="bg-gray-50/50 border-t border-gray-100 px-6 py-4 flex justify-between items-center text-xs text-gray-400 font-medium">
          <span>NKP Quotation Management System</span>
          <span>
            Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded font-mono shadow-sm">Esc</kbd> to close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
