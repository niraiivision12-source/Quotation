import {
  Bell,
  Briefcase,
  LayoutDashboard,
  ListTodo,
  ScrollText,
  UserRound,
  Users,
  Settings,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  {
    to: "/",
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
    exact: true,
  },
  { to: "/projects", label: "Projects", icon: <Briefcase size={18} /> },
  { to: "/leads", label: "Leads", icon: <Users size={18} /> },
  { to: "/reminders", label: "Reminders", icon: <Bell size={18} /> },
  { to: "/quotations", label: "Quotations", icon: <ScrollText size={18} /> },
  { to: "/tasks", label: "Tasks", icon: <ListTodo size={18} /> },
  { to: "/users", label: "Users", icon: <UserRound size={18} /> },
  { to: "/settings", label: "Settings", icon: <Settings size={18} /> },
];

export default function Sidebar({
  onMobileClose,
}: {
  onMobileClose?: () => void;
}) {
  return (
    <aside className="w-60 border-r h-screen flex flex-col bg-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">NKP CRM</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            onClick={() => onMobileClose?.()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? "text-blue-600" : "text-gray-400"}>
                  {item.icon}
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
