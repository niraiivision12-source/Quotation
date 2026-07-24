import {
  Bell,
  Briefcase,
  History,
  LayoutDashboard,
  ListTodo,
  Package,
  ScrollText,
  UserRound,
  Settings,
  CreditCard,
  Activity,
  Inbox,
  TrendingUp,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import logoImg from "../assets/logo.jpg";

const NAV_ITEMS = [
  {
    to: "/",
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
    exact: true,
  },
  { to: "/pipelines", label: "Product Pipelines", icon: <Briefcase size={18} /> },
  { to: "/enquiries", label: "Enquiry Inbox", icon: <Inbox size={18} />, ownerOnly: true },
  { to: "/reminders", label: "Reminders", icon: <Bell size={18} /> },
  { to: "/products", label: "Products", icon: <Package size={18} /> },
  // `exact` so this stays unlit while /quotations/history is open.
  {
    to: "/quotations",
    label: "Quotations",
    icon: <ScrollText size={18} />,
    exact: true,
  },
  {
    to: "/quotations/history",
    label: "Quotation History",
    icon: <History size={18} />,
  },
  { to: "/payments", label: "Payments", icon: <CreditCard size={18} /> },
  { to: "/tasks", label: "Tasks", icon: <ListTodo size={18} /> },
  { to: "/reports", label: "Reports", icon: <TrendingUp size={18} />, ownerOnly: true },
  { to: "/users", label: "Users", icon: <UserRound size={18} />, ownerOnly: true },
  { to: "/settings", label: "Settings", icon: <Settings size={18} />, ownerOnly: true },
  { to: "/api-testing", label: "API Explorer", icon: <Activity size={18} />, ownerOnly: true },
];

export default function Sidebar({
  onMobileClose,
}: {
  onMobileClose?: () => void;
}) {
  const user = useAuthStore((state) => state.user);
  const visibleItems = NAV_ITEMS.filter((item) => !item.ownerOnly || user?.role === "OWNER");

  return (
    <aside className="w-60 border-r h-screen flex flex-col bg-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-3 border-b">
        <img src={logoImg} alt="NKP Logo" className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-100" />
        <div>
          <p className="font-bold text-sm leading-tight text-gray-900">N.K.Poduval & Co</p>
          <span className="text-[10px] text-gray-500 font-medium tracking-wide leading-none block mt-0.5">SINCE 1948</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            onClick={() => onMobileClose?.()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
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
