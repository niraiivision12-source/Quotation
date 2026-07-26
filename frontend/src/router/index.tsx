import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";
import { useAuthStore } from "../store/auth.store";

import AppLayout from "../layouts/AppLayout";

import CustomerDetailsPage from "../pages/CustomerDetailsPage";
import CustomerPage from "../pages/CustomerPage";
import DashboardPage from "../pages/DashboardPage";
import EnquiryInboxPage from "../pages/EnquiryInboxPage";
import LeadPage from "../pages/LeadPage";
import LeadDetailPage from "../pages/LeadDetailPage";
import PipelineBoardPage from "../pages/PipelineBoardPage";
import OpportunityDetailPage from "../pages/OpportunityDetailPage";
import LoginPage from "../pages/LoginPage";
import ProductPage from "../pages/ProductPage";
import DealerPage from "../pages/DealerPage";
import QuotationHistoryListPage from "../pages/QuotationHistoryListPage";
import QuotationHistoryPage from "../pages/QuotationHistoryPage";
import QuotationPage from "../pages/QuotationPage";
import PurchaseOrderPage from "../pages/PurchaseOrderPage";
import PurchaseOrderHistoryListPage from "../pages/PurchaseOrderHistoryListPage";
import PurchaseOrderHistoryPage from "../pages/PurchaseOrderHistoryPage";
import ReminderPage from "../pages/ReminderPage";
import TaskPage from "../pages/TaskPage";
import UserPage from "../pages/UserPage";
import SettingsPage from "../pages/SettingsPage";
import PaymentPage from "../pages/PaymentPage";
import ReportsPage from "../pages/ReportsPage";
import ApiTestingPage from "../pages/ApiTestingPage";

function OwnerRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  if (!user || user.role !== "OWNER") {
    return <Navigate to="/" replace />;
  }
  return children;
}

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

          <Route path="/pipelines" element={<PipelineBoardPage />} />

          <Route path="/leads" element={<LeadPage />} />

          <Route path="/leads/:id" element={<LeadDetailPage />} />

          <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />

          <Route
            path="/enquiries"
            element={
              <OwnerRoute>
                <EnquiryInboxPage />
              </OwnerRoute>
            }
          />

          <Route path="/reminders" element={<ReminderPage />} />

          <Route path="/products" element={<ProductPage />} />

          <Route path="/dealers" element={<DealerPage />} />

          <Route path="/quotations" element={<QuotationPage />} />

          <Route
            path="/quotations/history"
            element={<QuotationHistoryListPage />}
          />

          <Route
            path="/quotations/:id/history"
            element={<QuotationHistoryPage />}
          />

          <Route path="/purchase-orders" element={<PurchaseOrderPage />} />

          <Route path="/purchase-orders/:id/edit" element={<PurchaseOrderPage />} />

          <Route
            path="/purchase-orders/history"
            element={<PurchaseOrderHistoryListPage />}
          />

          <Route
            path="/purchase-orders/:id/history"
            element={<PurchaseOrderHistoryPage />}
          />

          <Route path="/tasks" element={<TaskPage />} />

          <Route
            path="/users"
            element={
              <OwnerRoute>
                <UserPage />
              </OwnerRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <OwnerRoute>
                <SettingsPage />
              </OwnerRoute>
            }
          />

          <Route path="/payments" element={<PaymentPage />} />

          <Route
            path="/reports"
            element={
              <OwnerRoute>
                <ReportsPage />
              </OwnerRoute>
            }
          />

          <Route
            path="/api-testing"
            element={
              <OwnerRoute>
                <ApiTestingPage />
              </OwnerRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

