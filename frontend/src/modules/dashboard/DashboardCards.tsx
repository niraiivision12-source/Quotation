import {
  Inbox,
  AlertCircle,
  Activity,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  Clock,
  Calendar,
  FileText,
  CreditCard,
  Layers,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { useAuthStore } from "../../store/auth.store";

interface DashboardCardsProps {
  data: any; // Dynamic based on role
}

export function DashboardCards({ data }: DashboardCardsProps) {
  const user = useAuthStore((state) => state.user);
  const role = user?.role || "SALESMAN";

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (role === "OWNER") {
    const kpis = data || {};
    const cards = [
      {
        title: "Total Enquiries",
        value: (kpis.totalEnquiries ?? 0).toString(),
        description: "Enquiries in selected period",
        icon: Inbox,
        color: "text-blue-600 bg-blue-50/60 dark:bg-blue-950/20",
      },
      {
        title: "New Enquiries Today",
        value: (kpis.newEnquiriesToday ?? 0).toString(),
        description: "Received since midnight",
        icon: AlertCircle,
        color: "text-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/20",
      },
      {
        title: "Pending Enquiries",
        value: (kpis.pendingEnquiries ?? 0).toString(),
        description: "Awaiting assignment",
        icon: Clock,
        color: "text-amber-600 bg-amber-50/60 dark:bg-amber-950/20",
      },
      {
        title: "Active Opportunities",
        value: (kpis.activeOpportunities ?? 0).toString(),
        description: "Opportunities in the pipeline",
        icon: Activity,
        color: "text-purple-600 bg-purple-50/60 dark:bg-purple-950/20",
      },
      {
        title: "Won Opportunities",
        value: (kpis.wonOpportunities ?? 0).toString(),
        description: "Successfully closed won",
        icon: CheckCircle2,
        color: "text-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/20",
      },
      {
        title: "Lost Opportunities",
        value: (kpis.lostOpportunities ?? 0).toString(),
        description: "Closed lost in period",
        icon: XCircle,
        color: "text-rose-600 bg-rose-50/60 dark:bg-rose-950/20",
      },
      {
        title: "Potential Revenue",
        value: formatCurrency(kpis.potentialRevenue ?? 0),
        description: "Estimated pipeline value",
        icon: TrendingUp,
        color: "text-cyan-600 bg-cyan-50/60 dark:bg-cyan-950/20",
      },
      {
        title: "Closed Revenue",
        value: formatCurrency(kpis.closedRevenue ?? 0),
        description: "Won opportunities value",
        icon: DollarSign,
        color: "text-green-600 bg-green-50/60 dark:bg-green-950/20",
      },
      {
        title: "Today's Follow-ups",
        value: (kpis.todayFollowups ?? 0).toString(),
        description: "Pending reminders due today",
        icon: Calendar,
        color: "text-teal-600 bg-teal-50/60 dark:bg-teal-950/20",
      },
      {
        title: "Overdue Follow-ups",
        value: (kpis.overdueFollowups ?? 0).toString(),
        description: "Missed follow-ups requiring attention",
        icon: AlertCircle,
        color: "text-red-600 bg-red-50/60 dark:bg-red-950/20",
        isWarning: (kpis.overdueFollowups ?? 0) > 0,
      },
      {
        title: "Today's Quotations",
        value: (kpis.todayQuotations ?? 0).toString(),
        description: "Created in system today",
        icon: FileText,
        color: "text-sky-600 bg-sky-50/60 dark:bg-sky-950/20",
      },
      {
        title: "Pending Payments",
        value: (kpis.pendingPayments ?? 0).toString(),
        description: "Awaiting collection or partial pay",
        icon: CreditCard,
        color: "text-pink-600 bg-pink-50/60 dark:bg-pink-950/20",
      },
    ];

    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card
              key={i}
              className={`transition-all hover:shadow-md border border-slate-100 hover:border-slate-200 rounded-2xl bg-white ${
                card.isWarning ? "ring-1 ring-red-100 bg-red-50/10" : ""
              }`}
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                    {card.title}
                  </p>
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight leading-none mb-1.5">
                    {card.value}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{card.description}</p>
                </div>
                <div className={`p-2.5 rounded-xl shrink-0 ${card.color}`}>
                  <Icon size={20} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // --- SALESPERSON DASHBOARD ---
  const kpis = data || {};
  const cards = [
    {
      title: "Assigned Categories",
      value: Array.isArray(kpis.assignedCategories) ? kpis.assignedCategories.length.toString() : "0",
      description: kpis.assignedCategories?.join(", ") || "No categories",
      icon: Layers,
      color: "text-violet-600 bg-violet-50/60 dark:bg-violet-950/20",
    },
    {
      title: "Today's Follow-ups",
      value: (kpis.todayFollowups ?? 0).toString(),
      description: "My reminders due today",
      icon: Calendar,
      color: "text-teal-600 bg-teal-50/60 dark:bg-teal-950/20",
    },
    {
      title: "Yesterday's Pending",
      value: (kpis.yesterdayPendingFollowups ?? 0).toString(),
      description: "Overdue follow-ups",
      icon: AlertCircle,
      color: "text-red-600 bg-red-50/60 dark:bg-red-950/20",
      isWarning: (kpis.yesterdayPendingFollowups ?? 0) > 0,
    },
    {
      title: "New Opportunities",
      value: (kpis.newOpportunities ?? 0).toString(),
      description: "Untouched assigned leads",
      icon: Activity,
      color: "text-blue-600 bg-blue-50/60 dark:bg-blue-950/20",
    },
    {
      title: "Quotation Pending",
      value: (kpis.quotationPending ?? 0).toString(),
      description: "Awaiting cost details",
      icon: FileText,
      color: "text-amber-600 bg-amber-50/60 dark:bg-amber-950/20",
    },
    {
      title: "Follow-ups",
      value: (kpis.negotiations ?? 0).toString(),
      description: "Under active discussion",
      icon: TrendingUp,
      color: "text-cyan-600 bg-cyan-50/60 dark:bg-cyan-950/20",
    },
    {
      title: "Won This Month",
      value: (kpis.wonThisMonth ?? 0).toString(),
      description: "Deals converted in period",
      icon: CheckCircle2,
      color: "text-green-600 bg-green-50/60 dark:bg-green-950/20",
    },
    {
      title: "Lost This Month",
      value: (kpis.lostThisMonth ?? 0).toString(),
      description: "Closed lost in period",
      icon: XCircle,
      color: "text-rose-600 bg-rose-50/60 dark:bg-rose-950/20",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <Card
            key={i}
            className={`transition-all hover:shadow-md border border-slate-100 hover:border-slate-200 rounded-2xl bg-white ${
              card.isWarning ? "ring-1 ring-red-100 bg-red-50/10" : ""
            }`}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                  {card.title}
                </p>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight leading-none mb-1.5">
                  {card.value}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1" title={card.description}>
                  {card.description}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl shrink-0 ${card.color}`}>
                <Icon size={20} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
