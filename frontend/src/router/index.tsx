import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "@/components/ProtectedRoute";

import AppLayout from "@/layouts/AppLayout";

import CustomerDetailsPage from "@/pages/CustomerDetailsPage";
import CustomerPage from "@/pages/CustomerPage";
import DashboardPage from "@/pages/DashboardPage";
import LeadPage from "@/pages/LeadPage";
import LoginPage from "@/pages/LoginPage";
import ProjectPage from "@/pages/ProjectPage";
import QuotationPage from "@/pages/QuotationPage";
import ReminderPage from "@/pages/ReminderPage";
import TaskPage from "@/pages/TaskPage";
import UserPage from "@/pages/UserPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />

          <Route path="/customers" element={<CustomerPage />} />

          <Route path="/customers/:id" element={<CustomerDetailsPage />} />

          <Route path="/projects" element={<ProjectPage />} />

          <Route path="/leads" element={<LeadPage />} />

          <Route path="/reminders" element={<ReminderPage />} />

          <Route path="/quotations" element={<QuotationPage />} />

          <Route path="/tasks" element={<TaskPage />} />

          <Route path="/users" element={<UserPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
