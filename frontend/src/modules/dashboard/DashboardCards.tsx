
import {
  DollarSign,
  TrendingUp,
  Briefcase,
  Users,
  Target,
  FileText,
  AlertTriangle,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import type { KPICardData } from "./dashboard.types";

interface DashboardCardsProps {
  data: {
    totalRevenue: KPICardData;
    potentialRevenue: KPICardData;
    totalLeads: KPICardData;
    activeCustomers: KPICardData;
    activeProjects: KPICardData;
    pendingQuotations: KPICardData;
    lowStockProducts: KPICardData;
    pendingReminders: KPICardData;
  };
}

export function DashboardCards({ data }: DashboardCardsProps) {
  const cards = [
    {
      title: "Total Revenue",
      value: formatCurrency(data.totalRevenue.current),
      change: data.totalRevenue.changePercent,
      trend: data.totalRevenue.trend,
      description: "Approved quotations in period",
      icon: DollarSign,
      iconColor: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
    },
    {
      title: "Potential Revenue",
      value: formatCurrency(data.potentialRevenue.current),
      change: data.potentialRevenue.changePercent,
      trend: data.potentialRevenue.trend,
      description: "Pipeline (Draft & Sent quotes)",
      icon: TrendingUp,
      iconColor: "text-blue-500 bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Total Leads",
      value: data.totalLeads.current.toString(),
      change: data.totalLeads.changePercent,
      trend: data.totalLeads.trend,
      description: "Leads created in period",
      icon: Target,
      iconColor: "text-pink-500 bg-pink-50 dark:bg-pink-950/20",
    },
    {
      title: "Active Customers",
      value: data.activeCustomers.current.toString(),
      change: data.activeCustomers.changePercent,
      trend: data.activeCustomers.trend,
      description: "New active customers",
      icon: Users,
      iconColor: "text-violet-500 bg-violet-50 dark:bg-violet-950/20",
    },
    {
      title: "Active Projects",
      value: data.activeProjects.current.toString(),
      change: data.activeProjects.changePercent,
      trend: data.activeProjects.trend,
      description: "Active pipelines",
      icon: Briefcase,
      iconColor: "text-orange-500 bg-orange-50 dark:bg-orange-950/20",
    },
    {
      title: "Pending Quotations",
      value: data.pendingQuotations.current.toString(),
      change: data.pendingQuotations.changePercent,
      trend: data.pendingQuotations.trend,
      description: "Drafts and Sent quotes",
      icon: FileText,
      iconColor: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/20",
    },
    {
      title: "Low Stock Products",
      value: data.lowStockProducts.current.toString(),
      change: data.lowStockProducts.changePercent,
      trend: data.lowStockProducts.trend,
      description: "Stock quantity <= 10",
      icon: AlertTriangle,
      iconColor: "text-amber-500 bg-amber-50 dark:bg-amber-950/20",
      isWarning: data.lowStockProducts.current > 0,
    },
    {
      title: "Pending Reminders",
      value: data.pendingReminders.current.toString(),
      change: data.pendingReminders.changePercent,
      trend: data.pendingReminders.trend,
      description: "Reminders due in period",
      icon: Bell,
      iconColor: "text-rose-500 bg-rose-50 dark:bg-rose-950/20",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        const trendColor =
          card.trend === "up"
            ? "text-emerald-600 dark:text-emerald-400"
            : card.trend === "down"
            ? "text-rose-600 dark:text-rose-400"
            : "text-muted-foreground";

        const TrendIcon =
          card.trend === "up" ? (
            <ArrowUpRight size={16} className="inline mr-0.5" />
          ) : card.trend === "down" ? (
            <ArrowDownRight size={16} className="inline mr-0.5" />
          ) : (
            <Minus size={16} className="inline mr-0.5" />
          );

        return (
          <Card
            key={i}
            className="h-full flex flex-col transition-all hover:shadow-md border border-foreground/10 hover:border-foreground/20 rounded-xl overflow-hidden bg-card"
          >
            <CardContent className="p-5 flex-1 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground tracking-wider uppercase mb-1 truncate" title={card.title}>
                    {card.title}
                  </p>
                  <h3 className="text-2xl font-bold text-foreground leading-none tracking-tight truncate" title={card.value}>
                    {card.value}
                  </h3>
                </div>
                <div className={`p-2.5 rounded-lg shrink-0 ${card.iconColor}`}>
                  <Icon size={20} />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <span className={`text-xs font-semibold flex items-center shrink-0 ${trendColor}`}>
                  {TrendIcon}
                  {Math.abs(card.change)}%
                </span>
                <span className="text-[11px] text-muted-foreground truncate" title={card.description}>
                  {card.description}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}
