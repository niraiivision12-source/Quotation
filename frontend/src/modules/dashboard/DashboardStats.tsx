import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  AlertCircle,
  User,
  Star,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { DashboardSummaryResponse, ProjectPhase } from "./dashboard.types";

interface DashboardStatsProps {
  data: DashboardSummaryResponse;
  role: string;
}

// ---------------- EMPTY DATA STATE COMPONENT ----------------

function EmptyDataState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-foreground/10 rounded-xl bg-muted/5 w-full h-full min-h-[160px]">
      <AlertCircle size={20} className="text-muted-foreground opacity-60 mb-2 animate-pulse" />
      <p className="text-xs font-semibold text-muted-foreground max-w-[220px]">{message}</p>
    </div>
  );
}

// ---------------- CHART COMPONENTS ----------------

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

  // Pre-compute segment data using reduce to avoid any variable mutation
  type Segment = { item: (typeof data)[0]; idx: number; dashArray: string; dashOffset: number };
  const { segments } = data
    .filter(item => item.value > 0)
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
      <div className="relative w-36 h-36 shrink-0">
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
          <span className="text-xl font-bold text-foreground leading-none text-center">
            {formattedTotal}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{totalLabel}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 shrink-0 w-full sm:w-auto max-w-[180px]">
        {data.map((item, idx) => {
          const pct = ((item.value / total) * 100).toFixed(0);
          return (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground truncate max-w-[100px]" title={item.label}>
                {item.label}
              </span>
              <span className="font-semibold text-foreground ml-auto">({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LineChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0) {
    return <EmptyDataState message="No sales trend data available for this period" />;
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
        {/* Grid lines (Theme aware currentColor stroke) */}
        <line x1="0" y1="5" x2="100" y2="5" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.2" />
        <line x1="0" y1="20" x2="100" y2="20" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.2" />
        <line x1="0" y1="35" x2="100" y2="35" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.2" />

        {/* Polylines */}
        <polyline fill="none" stroke="#10b981" strokeWidth="1.2" points={points} className="drop-shadow-sm" />

        {/* Gradient fill */}
        {data.length > 1 && (
          <polygon
            fill="url(#green-gradient)"
            opacity="0.1"
            points={`0,35 ${points} 100,35`}
          />
        )}

        <defs>
          <linearGradient id="green-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex justify-between text-[9px] text-muted-foreground mt-2 px-1">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

export function BarChart({ data, color = "#3b82f6" }: { data: { label: string; value: number }[]; color?: string }) {
  if (data.length === 0) {
    return <EmptyDataState message="No pipeline metrics available for this period" />;
  }

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 10);

  return (
    <div className="w-full h-40 flex items-end gap-3 px-2 pt-6">
      {data.map((item, idx) => {
        const heightPercent = (item.value / maxVal) * 80;
        return (
          <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
            <span className="absolute -top-6 text-[9px] font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity bg-background px-1 py-0.5 rounded border shadow-sm z-10 whitespace-nowrap">
              {item.value >= 1000 ? `₹${(item.value / 1000).toFixed(0)}k` : item.value}
            </span>
            <div
              className="w-full rounded-t transition-all duration-300 hover:opacity-80"
              style={{
                height: `${Math.max(heightPercent, 4)}%`,
                backgroundColor: color,
              }}
            />
            <span className="text-[9px] text-muted-foreground mt-2 truncate w-full text-center" title={item.label}>
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
    <div className="border border-foreground/10 dark:border-foreground/10 rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between bg-muted/20 dark:bg-muted/5 font-semibold text-sm text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
      >
        <span className="tracking-wide">{title}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div className="p-5 border-t border-foreground/10">{children}</div>}
    </div>
  );
}

// ---------------- MAIN COMPONENT ----------------

export function DashboardStats({ data, role }: DashboardStatsProps) {
  const isOwner = role === "OWNER";

  // Map Phase Enums to Labels
  const phaseColors: Record<ProjectPhase, string> = {
    PIPES: "#f97316",
    WIRING: "#eab308",
    SWITCHES: "#3b82f6",
    LIGHTS: "#8b5cf6",
    FANS: "#14b8a6",
    OTHERS: "#6b7280",
  };

  const revenueByPhaseChartData = data.salesAnalytics.revenueByProjectPhase.map(p => ({
    label: p.phase,
    value: p.revenue,
    color: phaseColors[p.phase] || "#ccc",
  }));

  const pipelineValueByPhaseChartData = data.projectAnalytics.pipelineValueByPhase.map(p => ({
    label: p.phase,
    value: p.pipelineValue,
  }));

  const projectsByPhaseChartData = data.projectAnalytics.projectsByPhase.map(p => ({
    label: p.phase,
    value: p.count,
  }));

  const leadSourceChartData = data.leadAnalytics.leadSourceDistribution.map((l, i) => {
    const colors = ["#ec4899", "#8b5cf6", "#3b82f6", "#14b8a6", "#f97316", "#eab308", "#6b7280"];
    return {
      label: l.source,
      value: l.count,
      color: colors[i % colors.length],
    };
  });

  return (
    <div className="space-y-6">
      {/* 2. Sales Analytics */}
      <CollapsibleSection title={isOwner ? "Sales Analytics" : "My Sales Analytics"}>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-0 shadow-none bg-transparent p-4 p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <LineChart data={data.salesAnalytics.revenueTrend.map(r => ({ label: r.date.slice(-5), value: r.revenue }))} />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-none bg-transparent p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Revenue by Project Phase</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DonutChart data={revenueByPhaseChartData} totalLabel="Revenue" />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-none bg-transparent p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Quotation Status Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Quotations Created</span>
                <span className="font-semibold text-foreground">{data.salesAnalytics.quotationsCreated}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Approved / Win Rate</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  {data.salesAnalytics.quotationsApproved} ({data.salesAnalytics.conversionRate}%)
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Quotations Rejected</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">{data.salesAnalytics.quotationsRejected}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t pt-3">
                <span className="text-muted-foreground">Avg. Quotation Value</span>
                <span className="font-bold text-foreground">
                  {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(data.salesAnalytics.averageQuotationValue)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      {/* 3. Lead Analytics */}
      <CollapsibleSection title={isOwner ? "Lead Analytics" : "My Lead Analytics"}>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-0 shadow-none bg-transparent p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Lead Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col items-center justify-center py-6">
              <div className="relative w-28 h-28 flex items-center justify-center rounded-full border-8 border-emerald-50 dark:border-emerald-950/20 text-center">
                <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{data.leadAnalytics.leadConversionRate}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Average conversion speed: <span className="font-semibold text-foreground">{data.leadAnalytics.averageTimeToConvert} hrs</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-none bg-transparent p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Leads by Status</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-2.5 pt-1">
              {[
                { label: "New", count: data.leadAnalytics.newLeads, color: "bg-pink-500" },
                { label: "Contacted", count: data.leadAnalytics.contacted, color: "bg-indigo-500" },
                { label: "Not Responding", count: data.leadAnalytics.notResponding, color: "bg-amber-500" },
                { label: "Quotation Sent", count: data.leadAnalytics.quotationSent, color: "bg-sky-500" },
                { label: "Negotiation", count: data.leadAnalytics.negotiation, color: "bg-violet-500" },
                { label: "Won", count: data.leadAnalytics.won, color: "bg-emerald-500" },
                { label: "Lost", count: data.leadAnalytics.lost, color: "bg-rose-500" },
              ].map((status, idx) => {
                const maxVal = Math.max(
                  data.leadAnalytics.newLeads,
                  data.leadAnalytics.contacted,
                  data.leadAnalytics.notResponding,
                  data.leadAnalytics.quotationSent,
                  data.leadAnalytics.negotiation,
                  data.leadAnalytics.won,
                  data.leadAnalytics.lost,
                  1
                );
                const widthPercent = (status.count / maxVal) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{status.label}</span>
                      <span className="font-semibold text-foreground">{status.count}</span>
                    </div>
                    <div className="w-full bg-foreground/5 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${status.color} rounded-full`} style={{ width: `${widthPercent}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-none bg-transparent p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Lead Source Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DonutChart data={leadSourceChartData} totalLabel="Sources" />
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      {/* 4. Project & Pipeline Analytics */}
      <CollapsibleSection title={isOwner ? "Project & Pipeline Analytics" : "My Project & Pipeline Analytics"}>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-0 shadow-none bg-transparent p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Pipeline Value by Phase</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <BarChart data={pipelineValueByPhaseChartData} color="#f97316" />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-none bg-transparent p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Current Phase Workload</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <BarChart data={projectsByPhaseChartData} color="#3b82f6" />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-none bg-transparent p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Project Performance Indicators</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Active Pipelines</span>
                <span className="font-semibold text-foreground">{data.projectAnalytics.activeProjects}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Completed Projects (Period)</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{data.projectAnalytics.completedProjects}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t pt-3">
                <span className="text-muted-foreground">Avg. Active Project Value</span>
                <span className="font-bold text-foreground">
                  {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(data.projectAnalytics.averageProjectValue)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      {/* 5. Inventory Analytics */}
      <CollapsibleSection title="Inventory Analytics">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-0 shadow-none bg-transparent p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Inventory Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Total Products</span>
                <span className="font-semibold text-foreground">{data.inventoryAnalytics.totalProducts}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Total Stock Value</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(data.inventoryAnalytics.currentInventoryValue)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Low Stock ({'<=10'})</span>
                <Badge variant={data.inventoryAnalytics.lowStockProductsCount > 0 ? "destructive" : "secondary"}>
                  {data.inventoryAnalytics.lowStockProductsCount} items
                </Badge>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Out of Stock</span>
                <Badge variant={data.inventoryAnalytics.outOfStockProductsCount > 0 ? "destructive" : "secondary"}>
                  {data.inventoryAnalytics.outOfStockProductsCount} items
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-none bg-transparent p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Highest Selling Products</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-1 h-full min-h-[160px]">
              {data.inventoryAnalytics.highestSellingProducts.length === 0 ? (
                <EmptyDataState message="No sales recorded in this period" />
              ) : (
                <div className="space-y-2.5">
                  {data.inventoryAnalytics.highestSellingProducts.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div className="truncate max-w-[160px]">
                        <p className="font-medium text-foreground truncate" title={p.name}>{p.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{p.sku}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-foreground">{p.quantitySold} units</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">₹{p.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-none bg-transparent p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Stock Movement Feed</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-1">
              <div className="flex gap-4 text-xs font-semibold text-muted-foreground pb-2.5 border-b border-foreground/5 mb-2.5">
                <span>Added: <span className="text-emerald-600 dark:text-emerald-400">+{data.inventoryAnalytics.stockMovement.added}</span></span>
                <span>Removed: <span className="text-rose-600 dark:text-rose-400">-{data.inventoryAnalytics.stockMovement.removed}</span></span>
              </div>
              <div className="space-y-2.5 max-h-[110px] overflow-y-auto pr-1">
                {data.inventoryAnalytics.stockMovement.history.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No recent stock movements</p>
                ) : (
                  data.inventoryAnalytics.stockMovement.history.map((hist, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] border-b pb-1 last:border-0 last:pb-0 border-foreground/5">
                      <span className="truncate max-w-[130px] font-medium text-muted-foreground" title={hist.productName}>{hist.productName}</span>
                      <span className={`font-semibold shrink-0 ${hist.type === "ADDED" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {hist.type === "ADDED" ? "+" : "-"}{hist.qty}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      {/* 6. Employee Performance (OWNER ONLY) */}
      {isOwner && data.employeePerformance && (
        <CollapsibleSection title="Employee Performance (OWNER Only)">
          <div className="space-y-6">
            {/* Rankings Quick Grid */}
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { title: "Top Performer", name: data.employeePerformance.rankings.topPerformer, color: "border-pink-500/20 text-pink-600 bg-pink-50/10 dark:text-pink-400 dark:bg-pink-950/10" },
                { title: "Highest Revenue", name: data.employeePerformance.rankings.highestRevenue, color: "border-emerald-500/20 text-emerald-600 bg-emerald-50/10 dark:text-emerald-400 dark:bg-emerald-950/10" },
                { title: "Highest Conversion", name: data.employeePerformance.rankings.highestConversion, color: "border-purple-500/20 text-purple-600 bg-purple-50/10 dark:text-purple-400 dark:bg-purple-950/10" },
                { title: "Most Active", name: data.employeePerformance.rankings.mostActive, color: "border-blue-500/20 text-blue-600 bg-blue-50/10 dark:text-blue-400 dark:bg-blue-950/10" },
              ].map((rank, i) => (
                <div key={i} className={`p-4 border rounded-xl ${rank.color} transition-all`}>
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">{rank.title}</p>
                  <p className="text-sm font-extrabold mt-1 truncate" title={rank.name || "N/A"}>{rank.name || "N/A"}</p>
                </div>
              ))}
            </div>

            {/* Salesmen Performance Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <User size={13} /> Salesman Rankings & Performance
              </h4>
              <div className="border border-foreground/10 rounded-xl overflow-x-auto w-full bg-card">
                <Table className="align-middle">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center align-middle">Rank</TableHead>
                      <TableHead className="align-middle">Salesman</TableHead>
                      <TableHead className="text-center align-middle">Leads (Won/Lost)</TableHead>
                      <TableHead className="text-center align-middle">Conv. Rate</TableHead>
                      <TableHead className="text-center align-middle">Active Projects</TableHead>
                      <TableHead className="text-right align-middle">Revenue Generated</TableHead>
                      <TableHead className="text-center align-middle">Pending Follow-ups</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.employeePerformance.salesmanPerformance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8 align-middle">
                          No salesman performance data available.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.employeePerformance.salesmanPerformance.map((salesman) => (
                        <TableRow key={salesman.id} className="hover:bg-muted/30">
                          <TableCell className="font-bold text-center align-middle">{salesman.rank}</TableCell>
                          <TableCell className="align-middle">
                            <div className="font-medium text-foreground leading-tight">{salesman.name}</div>
                            <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{salesman.email}</div>
                          </TableCell>
                          <TableCell className="text-center align-middle">
                            {salesman.assignedLeads} <span className="text-muted-foreground">({salesman.wonLeads}/{salesman.lostLeads})</span>
                          </TableCell>
                          <TableCell className="text-center font-semibold text-emerald-600 dark:text-emerald-400 align-middle">
                            {salesman.conversionRate}%
                          </TableCell>
                          <TableCell className="text-center align-middle">{salesman.activeProjects}</TableCell>
                          <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400 align-middle">
                            ₹{salesman.revenueGenerated.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center align-middle">{salesman.pendingFollowUps}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Accountant & Attendant quick tables */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <Star size={13} /> Accountant Performance
                </h4>
                <div className="border border-foreground/10 rounded-xl overflow-x-auto w-full bg-card">
                  <Table className="align-middle">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="align-middle">Accountant</TableHead>
                        <TableHead className="text-center align-middle">Quotes Processed</TableHead>
                        <TableHead className="text-center align-middle">Avg. Processing Time</TableHead>
                        <TableHead className="text-center align-middle">Pending Drafts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.employeePerformance.accountantPerformance.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-6 align-middle">
                            No accountant data available.
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.employeePerformance.accountantPerformance.map((acc) => (
                          <TableRow key={acc.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium align-middle">{acc.name}</TableCell>
                            <TableCell className="text-center align-middle">{acc.quotationsProcessed}</TableCell>
                            <TableCell className="text-center align-middle">{acc.averageProcessingTime} hrs</TableCell>
                            <TableCell className="text-center align-middle">{acc.pendingQuotations}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <Clock size={13} /> Attendant Task Performance
                </h4>
                <div className="border border-foreground/10 rounded-xl overflow-x-auto w-full bg-card">
                  <Table className="align-middle">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="align-middle">Attendant</TableHead>
                        <TableHead className="text-center align-middle">Assigned Tasks</TableHead>
                        <TableHead className="text-center align-middle">Completed Tasks</TableHead>
                        <TableHead className="text-center align-middle">Pending Tasks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.employeePerformance.attendantPerformance.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-6 align-middle">
                            No attendant data available.
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.employeePerformance.attendantPerformance.map((att) => (
                          <TableRow key={att.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium align-middle">{att.name}</TableCell>
                            <TableCell className="text-center align-middle">{att.assignedTasks}</TableCell>
                            <TableCell className="text-center text-emerald-600 dark:text-emerald-400 font-semibold align-middle">
                              {att.completedTasks}
                            </TableCell>
                            <TableCell className="text-center text-rose-500 dark:text-rose-400 font-semibold align-middle">
                              {att.pendingTasks}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* 6.5. Payment & Collections Analytics */}
      {data.paymentAnalytics && (
        <CollapsibleSection title={
          role === "OWNER"
            ? "Payment Collections Dashboard"
            : role === "SALESMAN"
              ? "My Collections"
              : "Billing & Collections Analytics"
        }>
          {role === "OWNER" && (
            <div className="space-y-6">
              {/* Cards row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border border-foreground/10 bg-card rounded-xl p-4 flex flex-col justify-between shadow-xs">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">Revenue Collected</div>
                  <div className="text-xl font-bold mt-1 text-emerald-600">₹{Number(data.paymentAnalytics.totalRevenueCollected || 0).toLocaleString()}</div>
                </Card>
                <Card className="border border-foreground/10 bg-card rounded-xl p-4 flex flex-col justify-between shadow-xs">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">Total Outstanding</div>
                  <div className="text-xl font-bold mt-1 text-gray-900">₹{Number(data.paymentAnalytics.outstandingAmount || 0).toLocaleString()}</div>
                </Card>
                <Card className="border border-foreground/10 bg-card rounded-xl p-4 flex flex-col justify-between shadow-xs">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase font-semibold text-rose-700">Overdue Collections</div>
                  <div className="text-xl font-bold mt-1 text-rose-600">₹{Number(data.paymentAnalytics.overdueAmount || 0).toLocaleString()}</div>
                </Card>
                <Card className="border border-foreground/10 bg-card rounded-xl p-4 flex flex-col justify-between shadow-xs">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">Collection Rate</div>
                  <div className="text-xl font-bold mt-1 text-violet-600">{(data.paymentAnalytics.collectionRate || 0).toFixed(1)}%</div>
                </Card>
              </div>

              {/* Grid lists */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Top Outstanding Customers */}
                <Card className="border border-foreground/10 bg-card rounded-xl p-4 shadow-xs">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3">Top Outstanding Customer Accounts</h4>
                  {(!data.paymentAnalytics.topOutstandingCustomers || data.paymentAnalytics.topOutstandingCustomers.length === 0) ? (
                    <div className="text-xs text-muted-foreground italic text-center py-6">No outstanding balances.</div>
                  ) : (
                    <div className="space-y-3">
                      {data.paymentAnalytics.topOutstandingCustomers.map((cust: any) => (
                        <div key={cust.customerId} className="flex justify-between items-center text-xs">
                          <Link to={`/customers/${cust.customerId}`} className="font-semibold text-blue-600 hover:underline">{cust.name}</Link>
                          <span className="font-bold text-rose-600">₹{cust.outstanding.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Collector Performance */}
                <Card className="border border-foreground/10 bg-card rounded-xl p-4 shadow-xs">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3">Collector Performance</h4>
                  {(!data.paymentAnalytics.collectorPerformance || data.paymentAnalytics.collectorPerformance.length === 0) ? (
                    <div className="text-xs text-muted-foreground italic text-center py-6">No collection activities.</div>
                  ) : (
                    <div className="space-y-2.5">
                      {data.paymentAnalytics.collectorPerformance.map((col: any) => (
                        <div key={col.collectorId} className="flex justify-between items-center text-xs">
                          <span className="font-medium text-gray-800">{col.name}</span>
                          <div className="text-right">
                            <span className="font-bold text-emerald-600">₹{col.collected.toLocaleString()}</span>
                            <span className="text-[10px] text-muted-foreground ml-2">({col.outstanding.toLocaleString()} pending)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Monthly Collection Trend */}
              {data.paymentAnalytics.monthlyCollections && data.paymentAnalytics.monthlyCollections.length > 0 && (
                <Card className="border border-foreground/10 bg-card rounded-xl p-4 shadow-xs">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3">Monthly Collections (Last 6 Months)</h4>
                  <div className="flex items-end justify-between gap-2 h-36 pt-4 px-2">
                    {data.paymentAnalytics.monthlyCollections.map((m: any, i: number) => {
                      const maxVal = Math.max(...data.paymentAnalytics.monthlyCollections.map((x: any) => x.amount), 1);
                      const pct = (m.amount / maxVal) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                          <div className="absolute bottom-full mb-1 bg-zinc-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 font-bold whitespace-nowrap">
                            ₹{m.amount.toLocaleString()}
                          </div>
                          <div className="w-full bg-blue-100 dark:bg-blue-950/20 rounded-t-md relative flex items-end overflow-hidden" style={{ height: '100px' }}>
                            <div className="bg-blue-600 w-full transition-all duration-300" style={{ height: `${pct}%` }} />
                          </div>
                          <span className="text-[9px] font-bold text-muted-foreground font-mono mt-1">{m.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>
          )}

          {role === "SALESMAN" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card className="border border-foreground/10 bg-card rounded-xl p-4 flex flex-col justify-between shadow-xs">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">My Collected Amount</div>
                  <div className="text-xl font-bold mt-1 text-emerald-600">₹{Number(data.paymentAnalytics.myCollectedAmount || 0).toLocaleString()}</div>
                </Card>
                <Card className="border border-foreground/10 bg-card rounded-xl p-4 flex flex-col justify-between shadow-xs">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase font-semibold text-rose-700">My Outstanding Collections</div>
                  <div className="text-xl font-bold mt-1 text-rose-600">₹{Number(data.paymentAnalytics.myPendingCollections || 0).toLocaleString()}</div>
                </Card>
              </div>

              {/* Outstanding Customers list for Salesman */}
              <Card className="border border-foreground/10 bg-card rounded-xl p-4 shadow-xs">
                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3">My Outstanding Customer Accounts</h4>
                {(!data.paymentAnalytics.myOutstandingCustomers || data.paymentAnalytics.myOutstandingCustomers.length === 0) ? (
                  <div className="text-xs text-muted-foreground italic text-center py-6">No pending collections.</div>
                ) : (
                  <div className="space-y-3">
                    {data.paymentAnalytics.myOutstandingCustomers.map((cust: any) => (
                      <div key={cust.customerId} className="flex justify-between items-center text-xs">
                        <Link to={`/customers/${cust.customerId}`} className="font-semibold text-blue-600 hover:underline">{cust.name}</Link>
                        <span className="font-bold text-rose-600">₹{cust.outstanding.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {role === "ACCOUNTANT" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border border-foreground/10 bg-card rounded-xl p-4 flex flex-col justify-between shadow-xs">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">Tally Bills Linked</div>
                  <div className="text-xl font-bold mt-1 text-gray-900">{data.paymentAnalytics.billsCreated || 0}</div>
                </Card>
                <Card className="border border-foreground/10 bg-card rounded-xl p-4 flex flex-col justify-between shadow-xs">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">Payments Logged</div>
                  <div className="text-xl font-bold mt-1 text-emerald-600">{data.paymentAnalytics.paymentsRecorded || 0}</div>
                </Card>
                <Card className="border border-foreground/10 bg-card rounded-xl p-4 flex flex-col justify-between shadow-xs">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">Pending Invoices</div>
                  <div className="text-xl font-bold mt-1 text-amber-600">{data.paymentAnalytics.pendingCollections || 0}</div>
                </Card>
                <Card className="border border-foreground/10 bg-card rounded-xl p-4 flex flex-col justify-between shadow-xs">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase font-semibold text-rose-700">Overdue Invoices</div>
                  <div className="text-xl font-bold mt-1 text-rose-600">{data.paymentAnalytics.overdueCollections || 0}</div>
                </Card>
              </div>
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* 7. Upcoming Work & Tasks */}
      <CollapsibleSection title="Upcoming Work & Reminders">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Today's Schedule unified */}
          <Card className="border border-foreground/10 shadow-none bg-card rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <Clock size={14} className="text-blue-500" /> Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.upcomingWork.todaySchedule.length === 0 ? (
                <EmptyDataState message="No reminders or tasks scheduled for today" />
              ) : (
                <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                  {data.upcomingWork.todaySchedule.map((sched, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b pb-2.5 last:border-0 last:pb-0 border-foreground/5 text-xs">
                      <div className="truncate max-w-[200px]">
                        <Link to={sched.link} className="font-semibold text-foreground hover:underline truncate block" title={sched.title}>
                          {sched.title}
                        </Link>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-[8px] px-1 py-0 uppercase shrink-0 leading-none">
                            {sched.type}
                          </Badge>
                          {new Date(sched.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={
                            sched.priority === "HIGH" || sched.priority === "CRITICAL"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-[9px] px-1 py-0 uppercase"
                        >
                          {sched.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overdue Work */}
          <Card className="border border-foreground/10 shadow-none bg-card rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <AlertCircle size={14} className="text-rose-500" /> Overdue Work & Follow-ups
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h5 className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Overdue Tasks</h5>
                {data.upcomingWork.overdueTasks.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-2 italic">No overdue tasks</div>
                ) : (
                  <div className="space-y-2">
                    {data.upcomingWork.overdueTasks.map((t, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-foreground/5 pb-1.5 last:border-0 last:pb-0">
                        <Link to="/tasks" className="truncate text-rose-600 dark:text-rose-400 hover:underline max-w-[200px]" title={t.title}>
                          {t.title}
                        </Link>
                        <span className="text-[9px] text-muted-foreground shrink-0 ml-2">
                          Due {new Date(t.dueAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h5 className="text-[10px] font-bold uppercase text-muted-foreground mb-2 border-t pt-3 border-foreground/5">Overdue Reminders / Follow-ups</h5>
                {data.upcomingWork.overdueFollowUps.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-2 italic">No overdue follow-ups</div>
                ) : (
                  <div className="space-y-2">
                    {data.upcomingWork.overdueFollowUps.map((r, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-foreground/5 pb-1.5 last:border-0 last:pb-0">
                        <Link to="/reminders" className="truncate text-rose-600 dark:text-rose-400 hover:underline max-w-[200px]" title={r.title}>
                          {r.title}
                        </Link>
                        <span className="text-[9px] text-muted-foreground shrink-0 ml-2">
                          Due {new Date(r.dueAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      {/* 8. Recent Activities Feed */}
      <CollapsibleSection title="Recent Activities">
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {data.recentActivityFeed.length === 0 ? (
            <EmptyDataState message="No recent activity recorded" />
          ) : (
            data.recentActivityFeed.map((act) => {
              const moduleIcons: Record<string, string> = {
                lead: "bg-pink-100 text-pink-700 dark:bg-pink-950/20 dark:text-pink-400",
                project: "bg-orange-100 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400",
                customer: "bg-violet-100 text-violet-700 dark:bg-violet-950/20 dark:text-violet-400",
                quotation: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/20 dark:text-cyan-400",
                reminder: "bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400",
                task: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400",
              };

              const modClass = moduleIcons[act.module] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

              return (
                <div key={act.id} className="flex gap-4 items-start border-b pb-3 last:border-0 border-foreground/5 text-xs">
                  <div className={`p-2 rounded-lg font-bold shrink-0 text-[10px] uppercase ${modClass} select-none`}>
                    {act.module.slice(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{act.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1.5">
                      <span className="font-medium text-foreground">{act.userName || "System"}</span>
                      <span>•</span>
                      <span>{new Date(act.createdAt).toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}
