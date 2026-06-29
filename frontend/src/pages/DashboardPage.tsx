import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useDashboardSummary } from "@/modules/dashboard/dashboard.query";
import { DashboardCards } from "@/modules/dashboard/DashboardCards";
import { DashboardStats } from "@/modules/dashboard/DashboardStats";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlusCircle,
  FileText,
  Briefcase,
  Users,
  UserPlus,
  Settings as SettingsIcon,
  ListTodo,
} from "lucide-react";
import { Link } from "react-router-dom";

type PeriodType = "today" | "this_week" | "this_month" | "this_year" | "custom";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const role = user?.role || "SALESMAN";

  const [period, setPeriod] = useState<PeriodType>("this_month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const queryParams = {
    period,
    ...(period === "custom" && startDate ? { startDate } : {}),
    ...(period === "custom" && endDate ? { endDate } : {}),
  };

  const { data, isLoading, isError, error } = useDashboardSummary(queryParams);

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    if (newPeriod !== "custom") {
      setStartDate("");
      setEndDate("");
    }
  };

  // Quick Actions Layout mapping by Role
  const renderQuickActions = () => {
    switch (role) {
      case "OWNER":
        return (
          <div className="flex flex-wrap gap-3">
            <Button asChild size="sm" variant="outline" className="border-foreground/10 hover:border-foreground/20">
              <Link to="/leads?create=true" className="flex items-center gap-1.5">
                <PlusCircle size={15} /> Create Lead
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-foreground/10 hover:border-foreground/20">
              <Link to="/customers?create=true" className="flex items-center gap-1.5">
                <UserPlus size={15} /> Create Customer
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-foreground/10 hover:border-foreground/20">
              <Link to="/projects?create=true" className="flex items-center gap-1.5">
                <Briefcase size={15} /> Create Project
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-foreground/10 hover:border-foreground/20">
              <Link to="/quotations?create=true" className="flex items-center gap-1.5">
                <FileText size={15} /> Create Quotation
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-foreground/10 hover:border-foreground/20">
              <Link to="/settings?tab=products&create=true" className="flex items-center gap-1.5">
                <SettingsIcon size={15} /> Add Product
              </Link>
            </Button>
          </div>
        );
      case "SALESMAN":
        return (
          <div className="flex flex-wrap gap-3">
            <Button asChild size="sm" variant="outline" className="border-foreground/10 hover:border-foreground/20">
              <Link to="/leads?create=true" className="flex items-center gap-1.5">
                <PlusCircle size={15} /> Create Lead
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-foreground/10 hover:border-foreground/20">
              <Link to="/quotations?create=true" className="flex items-center gap-1.5">
                <FileText size={15} /> Create Quotation
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-foreground/10 hover:border-foreground/20">
              <Link to="/leads" className="flex items-center gap-1.5">
                <Users size={15} /> View My Leads
              </Link>
            </Button>
          </div>
        );
      case "ACCOUNTANT":
        return (
          <div className="flex flex-wrap gap-3">
            <Button asChild size="sm" variant="outline" className="border-foreground/10 hover:border-foreground/20">
              <Link to="/quotations?create=true" className="flex items-center gap-1.5">
                <FileText size={15} /> Create Quotation
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-foreground/10 hover:border-foreground/20">
              <Link to="/settings?tab=products" className="flex items-center gap-1.5">
                <SettingsIcon size={15} /> Manage Products
              </Link>
            </Button>
          </div>
        );
      case "ATTENDANT":
        return (
          <div className="flex flex-wrap gap-3">
            <Button asChild size="sm" variant="outline" className="border-foreground/10 hover:border-foreground/20">
              <Link to="/tasks" className="flex items-center gap-1.5">
                <ListTodo size={15} /> View Tasks
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-foreground/10 hover:border-foreground/20">
              <Link to="/projects" className="flex items-center gap-1.5">
                <Briefcase size={15} /> View Projects
              </Link>
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Top Header Block */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-5">
        <div>
          <PageHeader
            title={role === "OWNER" ? "Company Dashboard" : "My Personal Dashboard"}
            description={role === "OWNER" ? "Overview of business performance and metrics" : `Welcome back, ${user?.name}`}
          />
        </div>

        {/* Date Filter Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex rounded-lg border border-foreground/10 p-0.5 bg-muted/20">
            {(["today", "this_week", "this_month", "this_year", "custom"] as const).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  period === p
                    ? "bg-white text-foreground shadow-sm dark:bg-zinc-800"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === "this_week"
                  ? "This Week"
                  : p === "this_month"
                  ? "This Month"
                  : p === "this_year"
                  ? "This Year"
                  : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {/* Custom Date Picker Inputs */}
          {period === "custom" && (
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-xs py-1 px-2 border-foreground/10 w-32"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-xs py-1 px-2 border-foreground/10 w-32"
              />
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Actions</h3>
        {renderQuickActions()}
      </div>

      {/* Error State */}
      {isError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-4 rounded-xl dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400">
          Failed to load dashboard metrics: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[105px] w-full rounded-xl" />
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-[240px] w-full rounded-xl" />
            <Skeleton className="h-[240px] w-full rounded-xl" />
            <Skeleton className="h-[240px] w-full rounded-xl" />
          </div>
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      )}

      {/* Loaded Dashboard Content */}
      {!isLoading && !isError && data && (
        <div className="space-y-6">
          {/* 1. KPI Cards */}
          <DashboardCards data={data.kpiCards} />

          {/* 2-9. Dashboard Analytical Collapsible Widgets */}
          <DashboardStats data={data} role={role} />
        </div>
      )}
    </div>
  );
}
