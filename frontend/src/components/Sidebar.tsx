import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="w-64 border-r h-screen p-4">
      <nav className="flex flex-col gap-3">
        <Link to="/">Dashboard</Link>

        <Link to="/projects">Projects</Link>

        <Link to="/leads">Leads</Link>

        <Link to="/reminders">Reminders</Link>

        <Link to="/quotations">Quotations</Link>

        <Link to="/tasks">Tasks</Link>

        <Link to="/users">Users</Link>
      </nav>
    </aside>
  );
}
