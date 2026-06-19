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

  return (
    <header className="border-b p-4 flex items-center justify-between">
      <div className="text-sm font-medium">{user?.name}</div>

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
    </header>
  );
}
