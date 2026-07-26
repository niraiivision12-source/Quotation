import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  TrendingUp,
  FolderLock,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";

interface DashboardStatsProps {
  data: any; // Dynamic based on role
  role: string;
}

// ---------------- EMPTY DATA STATE COMPONENT ----------------
function EmptyDataState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 w-full h-full min-h-[160px]">
      <AlertCircle size={20} className="text-slate-400 opacity-60 mb-2 animate-pulse" />
      <p className="text-xs font-semibold text-slate-500 max-w-[220px]">{message}</p>
    </div>
  );
}

// ---------------- DONUT CHART ----------------
export function DonutChart({
  data,
  totalLabel = "Total",
}: {
  data: { label: string; value: number; color: string }[];
  totalLabel?: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return <EmptyDataState message={`No ${totalLabel.toLowerCase()} metrics recorded`} />;
  }

  const formattedTotal = new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(total);

  type Segment = { item: (typeof data)[0]; idx: number; dashArray: string; dashOffset: number };
  const { segments } = data
    .filter((item) => item.value > 0)
    .reduce<{ segments: Segment[]; runningPercent: number }>(
      ({ segments: acc, runningPercent }, item, idx) => {
        const percent = (item.value / total) * 100;
        return {
          segments: [
            ...acc,
            {
              item,
              idx,
              dashArray: `${percent} ${100 - percent}`,
              dashOffset: 100 - runningPercent,
            },
          ],
          runningPercent: runningPercent + percent,
        };
      },
      { segments: [], runningPercent: 0 }
    );

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 justify-center py-4">
      <div className="relative w-32 h-32 shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
          <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="3" />
          {segments.map(({ item, idx, dashArray, dashOffset }) => (
            <circle
              key={idx}
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke={item.color}
              strokeWidth="3.2"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              className="transition-all duration-300 hover:stroke-[3.8] cursor-pointer"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-slate-800 leading-none text-center">
            {formattedTotal}
          </span>
          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-1">{totalLabel}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 shrink-0 w-full sm:w-auto">
        {data.map((item, idx) => {
          const pct = ((item.value / total) * 100).toFixed(0);
          return (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-500 truncate max-w-[100px]" title={item.label}>
                {item.label}
              </span>
              <span className="font-semibold text-slate-700 ml-auto">({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- LINE CHART ----------------
export function LineChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0) {
    return <EmptyDataState message="No sales trend data available" />;
  }

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 1000);
  const minVal = 0;
  const range = maxVal - minVal;

  const points = data
    .map((d, i) => {
      const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
      const y = 35 - (d.value / range) * 30; // scale from 5 to 35
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="w-full h-40">
      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
        <line x1="0" y1="5" x2="100" y2="5" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.2" />
        <line x1="0" y1="20" x2="100" y2="20" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.2" />
        <line x1="0" y1="35" x2="100" y2="35" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.2" />
        <polyline fill="none" stroke="#10b981" strokeWidth="1.2" points={points} className="drop-shadow-sm" />
        {data.length > 1 && (
          <polygon fill="url(#green-gradient)" opacity="0.1" points={`0,35 ${points} 100,35`} />
        )}
        <defs>
          <linearGradient id="green-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex justify-between text-[9px] text-slate-400 mt-2 px-1 font-mono">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

// ---------------- BAR CHART ----------------
export function BarChart({ data, color = "#3b82f6" }: { data: { label: string; value: number }[]; color?: string }) {
  if (data.length === 0) {
    return <EmptyDataState message="No category sales recorded" />;
  }

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 10);

  return (
    <div className="w-full h-40 flex items-end gap-3 px-2 pt-6">
      {data.map((item, idx) => {
        const heightPercent = (item.value / maxVal) * 80;
        return (
          <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
            <span className="absolute -top-6 text-[9px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1 py-0.5 border border-slate-100 rounded shadow-sm z-10 whitespace-nowrap">
              {item.value >= 1000 ? `₹${(item.value / 1000).toFixed(0)}k` : item.value}
            </span>
            <div
              className="w-full rounded-t transition-all duration-300 hover:opacity-80"
              style={{
                height: `${Math.max(heightPercent, 4)}%`,
                backgroundColor: color,
              }}
            />
            <span className="text-[9px] text-slate-400 font-medium mt-2 truncate w-full text-center" title={item.label}>
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------- COLLAPSIBLE SECTION COMPONENT ----------------
function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between bg-slate-50/50 font-bold text-sm text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <span className="tracking-wide uppercase text-[10px] text-slate-400 font-bold">{title}</span>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open && <div className="p-5 border-t border-slate-100 bg-white">{children}</div>}
    </div>
  );
}

// ---------------- MAIN COMPONENT ----------------
export function DashboardStats({ data, role }: DashboardStatsProps) {
  const isOwner = role === "OWNER";

  if (isOwner) {
    const charts = data.charts || {
      opportunityConversionRate: 0,
      revenueByCategory: [],
      enquirySourceDistribution: [],
      categoryWiseSales: [],
      monthlyRevenue: [],
      followupPerformance: { completed: 0, missed: 0, pending: 0 },
    };

    const colors = ["#f97316", "#eab308", "#3b82f6", "#8b5cf6", "#14b8a6", "#6b7280"];
    const revenueByCategoryChart = charts.revenueByCategory.map((item: any, i: number) => ({
      label: item.category,
      value: item.revenue,
      color: colors[i % colors.length],
    }));

    const enquirySourceDistributionChart = charts.enquirySourceDistribution.map((item: any, i: number) => ({
      label: item.source,
      value: item.count,
      color: colors[i % colors.length],
    }));

    const categoryWiseSalesChart = charts.categoryWiseSales.map((item: any) => ({
      label: item.category,
      value: item.sales,
    }));

    const monthlyRevenueChart = (charts.monthlyRevenue || []).map((item: any) => ({
      label: item.month,
      value: item.revenue,
    }));

    const followupPerformanceChart = [
      { label: "Completed", value: charts.followupPerformance.completed, color: "#10b981" },
      { label: "Missed", value: charts.followupPerformance.missed, color: "#f43f5e" },
      { label: "Pending", value: charts.followupPerformance.pending, color: "#eab308" },
    ];

    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Revenue by Category */}
          <CollapsibleSection title="Revenue by Category">
            <DonutChart data={revenueByCategoryChart} totalLabel="Revenue" />
          </CollapsibleSection>

          {/* Enquiry Source Distribution */}
          <CollapsibleSection title="Enquiry Source Distribution">
            <DonutChart data={enquirySourceDistributionChart} totalLabel="Enquiries" />
          </CollapsibleSection>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Category-wise Sales count */}
          <CollapsibleSection title="Category-wise Sales">
            <BarChart data={categoryWiseSalesChart} color="#f97316" />
          </CollapsibleSection>

          {/* Follow-up Performance */}
          <CollapsibleSection title="Follow-up Performance">
            <DonutChart data={followupPerformanceChart} totalLabel="Reminders" />
          </CollapsibleSection>
        </div>

        {/* Monthly Revenue Trend */}
        <CollapsibleSection title="Monthly Sales Trend">
          <LineChart data={monthlyRevenueChart} />
        </CollapsibleSection>

        {/* Conversion rate Card */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border border-slate-100 shadow-none bg-white rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Opportunity Conversion</h4>
              <p className="text-3xl font-bold text-slate-800 tracking-tight">
                {charts.opportunityConversionRate}%
              </p>
            </div>
            <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl flex items-center gap-1.5 border">
              <TrendingUp size={14} className="text-emerald-500 shrink-0" />
              <span>Conversion rate of Won vs Lost Opportunities</span>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // --- SALESPERSON DASHBOARD STATS ---
  const suggestions = data.kpiCards.upcomingReminderSuggestions || [];

  return (
    <div className="space-y-6">
      {/* 1. My Pipelines */}
      <Card className="border border-slate-100 bg-white rounded-2xl shadow-sm">
        <CardHeader className="pb-2 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-slate-400">
            <Layers size={14} className="text-violet-600" />
            My Pipelines (Assigned)
          </CardTitle>
          <Badge className="bg-violet-50 text-violet-700 border-none font-semibold text-[10px] px-2 py-0.5">Editable</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {!data.myPipelines || data.myPipelines.length === 0 ? (
            <div className="p-6"><EmptyDataState message="No categories assigned to you in settings yet." /></div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b border-slate-100 hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider py-3.5 pl-6">Category</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center py-3.5">Active</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center py-3.5">Won</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center py-3.5">Lost</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right pr-6 py-3.5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.myPipelines.map((pipe: any) => (
                  <TableRow key={pipe.category} className="border-b border-slate-100 bg-white hover:bg-slate-50/20">
                    <TableCell className="font-semibold text-slate-800 py-3.5 pl-6">{pipe.category}</TableCell>
                    <TableCell className="text-center font-bold text-blue-600 py-3.5">{pipe.active}</TableCell>
                    <TableCell className="text-center font-bold text-emerald-600 py-3.5">{pipe.won}</TableCell>
                    <TableCell className="text-center font-bold text-slate-500 py-3.5">{pipe.lost}</TableCell>
                    <TableCell className="text-right pr-6 py-3.5">
                      <Link
                        to={`/pipelines?category=${pipe.category}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700"
                      >
                        Open Pipeline <ArrowRight size={13} />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 2. Other Pipelines */}
      <Card className="border border-slate-100 bg-white rounded-2xl shadow-sm">
        <CardHeader className="pb-2 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-slate-400">
            <FolderLock size={14} className="text-slate-400" />
            Other Pipelines Overview
          </CardTitle>
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-semibold text-[10px] px-2 py-0.5">Read Only</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {!data.otherPipelines || data.otherPipelines.length === 0 ? (
            <div className="p-6 text-xs text-slate-400">No other pipelines found.</div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b border-slate-100 hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider py-3.5 pl-6">Category</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center py-3.5">Active</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center py-3.5">Won</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center py-3.5">Lost</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right pr-6 py-3.5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.otherPipelines.map((pipe: any) => (
                  <TableRow key={pipe.category} className="border-b border-slate-100 bg-white hover:bg-slate-50/20">
                    <TableCell className="font-semibold text-slate-700 py-3.5 pl-6">{pipe.category}</TableCell>
                    <TableCell className="text-center font-bold text-slate-600 py-3.5">{pipe.active}</TableCell>
                    <TableCell className="text-center font-bold text-slate-500 py-3.5">{pipe.won}</TableCell>
                    <TableCell className="text-center font-bold text-slate-400 py-3.5">{pipe.lost}</TableCell>
                    <TableCell className="text-right pr-6 py-3.5">
                      <Link
                        to={`/pipelines?category=${pipe.category}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
                      >
                        View Board <ArrowRight size={13} />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 3. Upcoming reminders / suggested opportunities */}
      <Card className="border border-slate-100 bg-white rounded-2xl shadow-sm">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-slate-400">
            <Sparkles size={14} className="text-amber-500" />
            Upcoming Reminders & Follow-up Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {suggestions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No upcoming reminders scheduled. Complete opportunity follow-ups to get started!</div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b border-slate-100 hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider py-3.5 pl-6">Customer</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider py-3.5">Reminder Action</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center py-3.5">Priority</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right pr-6 py-3.5">Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.map((rem: any) => (
                  <TableRow key={rem.id} className="border-b border-slate-100 bg-white hover:bg-slate-50/20">
                    <TableCell className="font-semibold text-slate-800 py-3.5 pl-6">
                      {rem.customer?.name || "General / Walk-in"}
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-slate-600 max-w-[280px] truncate" title={rem.title}>
                      <span className="font-medium text-slate-800 block mb-0.5">{rem.title}</span>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{rem.description || ""}</span>
                    </TableCell>
                    <TableCell className="text-center py-3.5">
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold uppercase px-1.5 py-0 border-none ${
                          rem.priority === "HIGH" || rem.priority === "CRITICAL"
                            ? "bg-red-50 text-red-700"
                            : rem.priority === "MEDIUM"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {rem.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 py-3.5 text-xs font-mono font-medium text-slate-500">
                      {new Date(rem.dueAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
