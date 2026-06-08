import { Outlet } from "react-router-dom";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function AppLayout() {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1">
        <Header />

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
