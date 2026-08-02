import { useMyReminders } from "../modules/reminder/reminder.query";
import { useTasks } from "../modules/task/task.query";
import { useAuthStore } from "../store/auth.store";
import { Bell, CheckCircle, Clock, LogOut, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: reminderData } = useMyReminders();
  // Only fetch when user is loaded — prevents sending assignedToId="" which returns 0 results
  const { data: taskData } = useTasks(
    1,
    { assignedToId: user?.id },
    50,
    !!user?.id,
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Reminders due within 24h
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() + 24);
  const pendingReminders = (reminderData?.items ?? []).filter(
    (r) => r.status === "PENDING" && new Date(r.dueAt) <= cutoff,
  );

  // Active tasks assigned to me (pending + in-progress)
  const pendingTasks = (taskData?.items ?? []).filter(
    (t) => t.status === "PENDING" || t.status === "IN_PROGRESS",
  );
  const totalCount = pendingReminders.length + pendingTasks.length;

  // One-time toast per day when tasks load
  useEffect(() => {
    if (!user?.id || pendingTasks.length === 0) return;
    const key = `task-notified-${user.id}-${new Date().toDateString()}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    toast.info(
      `You have ${pendingTasks.length} task${pendingTasks.length > 1 ? "s" : ""} assigned to you`,
      {
        description: "Click the bell icon to view them",
        action: { label: "View Tasks", onClick: () => navigate("/tasks") },
        duration: 8000,
      },
    );
  }, [pendingTasks.length, user?.id]);

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="border-b px-4 lg:px-6 py-3 flex items-center justify-between bg-white shrink-0">
      <div className="flex items-center lg:hidden">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
        >
          <Menu size={24} />
        </button>
      </div>

      <div className="flex items-center justify-end gap-4 ml-auto">

        {/* Notification bell */}
        <div ref={panelRef} className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative inline-flex items-center text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <Bell size={20} />
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                {totalCount > 99 ? "99+" : totalCount}
              </span>
            )}
          </button>

          {/* Notification dropdown panel */}
          {notifOpen && (
            <div className="absolute right-0 top-10 w-80 bg-white rounded-xl border shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
                <p className="text-sm font-semibold">Notifications</p>
                {totalCount > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                    {totalCount} new
                  </span>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {/* Tasks section */}
                {pendingTasks.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-4 pt-3 pb-1">
                      My Tasks
                    </p>
                    {pendingTasks.map((task) => {
                      const overdue = task.dueAt && new Date(task.dueAt) < new Date();
                      return (
                        <button
                          key={task.id}
                          onClick={() => { setNotifOpen(false); navigate("/tasks"); }}
                          className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-start gap-3 border-b last:border-0"
                        >
                          <CheckCircle size={16} className="text-blue-500 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{task.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                task.priority === "CRITICAL" ? "bg-red-100 text-red-600" :
                                task.priority === "HIGH" ? "bg-orange-100 text-orange-600" :
                                "bg-blue-100 text-blue-600"
                              }`}>
                                {task.priority}
                              </span>
                              {task.dueAt && (
                                <span className={`text-xs ${overdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                                  {overdue ? "Overdue" : "Due"}: {new Date(task.dueAt).toLocaleDateString([], { day: "numeric", month: "short" })}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => { setNotifOpen(false); navigate("/tasks"); }}
                      className="w-full px-4 py-2 text-xs text-violet-600 font-medium hover:bg-violet-50 text-center"
                    >
                      View all tasks →
                    </button>
                  </div>
                )}

                {/* Reminders section */}
                {pendingReminders.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-4 pt-3 pb-1">
                      Reminders
                    </p>
                    {pendingReminders.slice(0, 5).map((reminder) => {
                      const isOverdue = new Date(reminder.dueAt) < new Date();
                      return (
                        <button
                          key={reminder.id}
                          onClick={() => { setNotifOpen(false); navigate("/reminders"); }}
                          className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-start gap-3 border-b last:border-0"
                        >
                          <Clock size={16} className="text-orange-500 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{reminder.title}</p>
                            <p className={`text-xs mt-0.5 ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                              {isOverdue ? "Overdue" : "Due"}: {new Date(reminder.dueAt).toLocaleDateString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => { setNotifOpen(false); navigate("/reminders"); }}
                      className="w-full px-4 py-2 text-xs text-violet-600 font-medium hover:bg-violet-50 text-center"
                    >
                      View all reminders →
                    </button>
                  </div>
                )}

                {totalCount === 0 && (
                  <div className="px-4 py-8 text-center">
                    <Bell size={28} className="mx-auto text-muted-foreground mb-2 opacity-40" />
                    <p className="text-sm text-muted-foreground">All caught up!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">No pending tasks or reminders</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-500 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
