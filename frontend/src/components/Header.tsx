import { useMyReminders } from "@/modules/reminder/reminder.query";
import { useAuthStore } from "@/store/auth.store";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";

export default function Header() {
  const user = useAuthStore((state) => state.user);
  const { data } = useMyReminders();

  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() + 24);

  const pendingCount = (data?.items ?? []).filter((r) => {
    if (r.status !== "PENDING") return false;
    return new Date(r.dueAt) <= cutoff;
  }).length;

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="border-b px-6 py-3 flex items-center justify-end gap-4">
      {/* Notification bell */}
      <Link
        to="/reminders"
        className="relative inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell size={20} />
        {pendingCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
            {pendingCount > 99 ? "99+" : pendingCount}
          </span>
        )}
      </Link>

      {/* User profile */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm shrink-0">
          {initials}
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">{user?.name}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {user?.role.toLowerCase()}
          </p>
        </div>
      </div>
    </header>
  );
}
