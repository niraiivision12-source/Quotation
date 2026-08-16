import { useState, useEffect } from "react";
import PageHeader from "../components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { api } from "../lib/axios";
import {
  TrendingUp,
  DollarSign,
  Clock,
  Briefcase,
  Download,
  Calendar,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export default function ReportsPage() {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(lastDayOfMonth);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/reports/summary?startDate=${startDate}&endDate=${endDate}`);
      setReportData(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load report data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error("No data available to export");
      return;
    }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) =>
      Object.values(row)
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filename} exported successfully!`);
  };

  const exportWonOpportunities = () => {
    if (!reportData?.wonOpportunitiesList) return;
    const data = reportData.wonOpportunitiesList.map((item: any) => ({
      Customer: item.customerName,
      Salesperson: item.salespersonName,
      Category: item.category,
      Amount: item.value,
      ClosedDate: new Date(item.closedDate).toLocaleDateString(),
    }));
    exportToCSV(data, `NKP_Won_Opportunities_${startDate}_to_${endDate}.csv`);
  };

  const exportCategoryPerformance = () => {
    if (!reportData?.opportunitiesByCategory) return;
    const data = reportData.opportunitiesByCategory.map((item: any) => ({
      Category: item.category,
      DealsCount: item.count,
      EstimatedValue: item.value,
    }));
    exportToCSV(data, `NKP_Category_Performance_${startDate}_to_${endDate}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-5">
        <PageHeader title="Analytical Reports" description="Business metrics, sales conversion rates, and revenue collections" />

        {/* Date controls */}
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm shrink-0">
          <Calendar size={15} className="text-slate-400" />
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <span>From:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 py-0 px-2 text-xs border-slate-200 w-32 focus:bg-white"
            />
            <span>To:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 py-0 px-2 text-xs border-slate-200 w-32 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {isLoading || !reportData ? (
        <div className="p-12 text-center text-sm text-slate-400 animate-pulse">Loading report metrics...</div>
      ) : (
        <div className="space-y-6">
          {/* KPI Metrics Cards Grid */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Sales Conversion Rate */}
            <Card className="border border-slate-100 bg-white rounded-2xl p-5 shadow-none flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Sales Conversion Rate</span>
                <span className="text-2xl font-bold text-slate-800 tracking-tight">
                  {reportData.salesConversionRate}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Won vs Lost opportunities</span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                <TrendingUp size={20} />
              </div>
            </Card>

            {/* Total Invoice Value */}
            <Card className="border border-slate-100 bg-white rounded-2xl p-5 shadow-none flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Invoice Billed</span>
                <span className="text-2xl font-bold text-slate-800 tracking-tight">
                  {formatCurrency(reportData.totalInvoiceValue)}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
                  Collected: {formatCurrency(reportData.amountCollected)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <DollarSign size={20} />
              </div>
            </Card>

            {/* Average Cycle Time */}
            <Card className="border border-slate-100 bg-white rounded-2xl p-5 shadow-none flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Average Sales Cycle</span>
                <span className="text-2xl font-bold text-slate-800 tracking-tight">
                  {reportData.averageCycleTimeDays} Days
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Lead assignment to conversion time</span>
              </div>
              <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 shrink-0">
                <Clock size={20} />
              </div>
            </Card>

            {/* Outstanding Collection */}
            <Card className="border border-slate-100 bg-white rounded-2xl p-5 shadow-none flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Outstanding Balance</span>
                <span className="text-2xl font-bold text-red-600 tracking-tight">
                  {formatCurrency(reportData.outstandingCollection)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Collectable payments</span>
              </div>
              <div className="p-2.5 rounded-xl bg-red-50 text-red-600 shrink-0">
                <DollarSign size={20} />
              </div>
            </Card>
          </div>

          {/* Tables layout */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Category Performance */}
            <Card className="border border-slate-100 bg-white rounded-2xl shadow-sm md:col-span-1">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <Briefcase size={14} className="text-violet-600" /> Category Breakdown
                </CardTitle>
                <Button size="icon" variant="ghost" onClick={exportCategoryPerformance} className="h-7 w-7 text-slate-400 hover:text-slate-700">
                  <Download size={14} />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-b border-slate-100">
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider pl-4">Category</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center">Deals</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right pr-4">Est. Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.opportunitiesByCategory.map((cat: any) => (
                      <TableRow key={cat.category} className="border-b border-slate-100 bg-white hover:bg-slate-50/20">
                        <TableCell className="font-semibold text-slate-700 pl-4">{cat.category}</TableCell>
                        <TableCell className="text-center font-bold text-slate-600">{cat.count}</TableCell>
                        <TableCell className="text-right pr-4 font-bold text-slate-800">
                          {formatCurrency(cat.value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Won opportunities list */}
            <Card className="border border-slate-100 bg-white rounded-2xl shadow-sm md:col-span-2">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" /> Won Sales Transactions
                </CardTitle>
                <Button variant="outline" size="sm" onClick={exportWonOpportunities} className="h-7 px-2 border-slate-200">
                  <Download size={13} className="mr-1" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {reportData.wonOpportunitiesList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No deals closed won in this period.</div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="border-b border-slate-100">
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider pl-6">Customer</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider">Salesman</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center">Category</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right pr-6">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.wonOpportunitiesList.map((opp: any) => (
                        <TableRow key={opp.id} className="border-b border-slate-100 bg-white hover:bg-slate-50/20">
                          <TableCell className="font-semibold text-slate-800 pl-6">{opp.customerName}</TableCell>
                          <TableCell className="text-xs text-slate-600">{opp.salespersonName}</TableCell>
                          <TableCell className="text-center font-medium">
                            <Badge variant="secondary" className="text-[9px] font-bold uppercase px-1.5 py-0 border-none">
                              {opp.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6 font-bold text-slate-800">
                            {formatCurrency(opp.value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
