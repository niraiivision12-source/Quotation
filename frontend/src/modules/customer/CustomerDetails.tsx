import { useState } from "react";
import { useParams } from "react-router-dom";

import PageHeader from "@/components/ui/PageHeader";

import CustomerOverview from "./components/CustomerOverview";
import CustomerProjects from "./components/CustomerProjects";
import CustomerPaymentsTab from "../payment/components/CustomerPaymentsTab";
import { useCustomer } from "./customer.query";
import { CreditCard, LayoutDashboard } from "lucide-react";

type Tab = "overview" | "payments";

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
      </div>
    </div>
  );
}
