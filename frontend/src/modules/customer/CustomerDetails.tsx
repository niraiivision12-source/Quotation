import { useState } from "react";
import { useParams } from "react-router-dom";

import PageHeader from "../../components/ui/PageHeader";

import CustomerOverview from "./components/CustomerOverview";
import CustomerProjects from "./components/CustomerProjects";
import CustomerPaymentsTab from "../payment/components/CustomerPaymentsTab";
import CustomerTasks from "./components/CustomerTasks";
import CustomerReminders from "./components/CustomerReminders";
import { useCustomer } from "./customer.query";
import { CreditCard, LayoutDashboard, ListTodo, Calendar } from "lucide-react";

type Tab = "overview" | "payments" | "tasks" | "reminders";

export default function CustomerDetails() {
  const { id } = useParams();
  const { data } = useCustomer(id || "");
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={data.name} />

      {/* Tabs list */}
      <div className="flex border-b overflow-x-auto shrink-0 scrollbar-none gap-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === "overview"
              ? "border-violet-600 text-violet-600 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayoutDashboard size={14} />
          Overview & Projects
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === "payments"
              ? "border-violet-600 text-violet-600 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CreditCard size={14} />
          Payments & Bills
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === "tasks"
              ? "border-violet-600 text-violet-600 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ListTodo size={14} />
          Tasks
        </button>
        <button
          onClick={() => setActiveTab("reminders")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === "reminders"
              ? "border-violet-600 text-violet-600 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar size={14} />
          Reminders
        </button>
      </div>

      <div className="mt-4">
        {activeTab === "overview" && (
          <>
            <CustomerOverview customer={data} />
            <CustomerProjects projects={data.projects} />
          </>
        )}
        {activeTab === "payments" && (
          <CustomerPaymentsTab customerId={id || ""} customer={data} />
        )}
        {activeTab === "tasks" && (
          <CustomerTasks customerId={id || ""} />
        )}
        {activeTab === "reminders" && (
          <CustomerReminders customerId={id || ""} />
        )}
      </div>
    </div>
  );
}
