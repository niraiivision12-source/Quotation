import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useShortcutStore, isInputElement, matchesPattern } from "../store/shortcut.store";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import ShortcutCheatsheet from "../components/ShortcutCheatsheet";

export default function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCheatsheetOpen, setIsCheatsheetOpen] = useState(false);
  const navigate = useNavigate();

  // Register global shortcuts
  useKeyboardShortcuts(
    [
      {
        id: "nav-dashboard",
        keys: "alt+g",
        description: "Go to Dashboard",
        category: "Global Navigation",
        action: () => navigate("/"),
      },
      {
        id: "nav-pipelines",
        keys: "alt+j",
        description: "Go to Pipelines (Projects)",
        category: "Global Navigation",
        action: () => navigate("/projects"),
      },
      {
        id: "nav-leads",
        keys: "alt+l",
        description: "Go to Leads",
        category: "Global Navigation",
        action: () => navigate("/leads"),
      },
      {
        id: "nav-reminders",
        keys: "alt+r",
        description: "Go to Reminders",
        category: "Global Navigation",
        action: () => navigate("/reminders"),
      },
      {
        id: "nav-products",
        keys: "alt+p",
        description: "Go to Products",
        category: "Global Navigation",
        action: () => navigate("/products"),
      },
      {
        id: "nav-quotations",
        keys: "alt+q",
        description: "Go to Quotation Creator",
        category: "Global Navigation",
        action: () => navigate("/quotations"),
      },
      {
        id: "nav-history",
        keys: "alt+h",
        description: "Go to Quotation History",
        category: "Global Navigation",
        action: () => navigate("/quotations/history"),
      },
      {
        id: "nav-payments",
        keys: "alt+y",
        description: "Go to Payments",
        category: "Global Navigation",
        action: () => navigate("/payments"),
      },
      {
        id: "nav-tasks",
        keys: "alt+t",
        description: "Go to Tasks",
        category: "Global Navigation",
        action: () => navigate("/tasks"),
      },
      {
        id: "nav-settings",
        keys: "alt+s",
        description: "Go to Settings",
        category: "Global Navigation",
        action: () => navigate("/settings"),
      },
      {
        id: "global-cheatsheet",
        keys: "shift+?",
        description: "Toggle Shortcuts Manual",
        category: "Global Navigation",
        action: () => setIsCheatsheetOpen((open) => !open),
      },
    ],
    [navigate]
  );

  // Setup the global listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeShortcuts = useShortcutStore.getState().shortcuts;
      const isInput = isInputElement(e.target as HTMLElement);

      const match = activeShortcuts.find((s) => {
        const isPatternMatch = matchesPattern(e, s.keys);
        if (!isPatternMatch) return false;

        // Skip if typing in an input element unless allowed
        if (isInput && !s.allowInInputs) {
          return false;
        }

        return true;
      });

      if (match) {
        if (match.preventDefault !== false) {
          e.preventDefault();
        }
        match.action(e);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onMobileClose={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      <ShortcutCheatsheet open={isCheatsheetOpen} onOpenChange={setIsCheatsheetOpen} />
    </div>
  );
}

