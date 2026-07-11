import { useState } from "react";
import { usePayments } from "../payment.query";
import { useProjectQuotations } from "../../quotation/quotation.query";
import { Button } from "../../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import RecordPaymentDialog from "./RecordPaymentDialog";
import PaymentHistory from "./PaymentHistory";
import { CreditCard, DollarSign, Receipt, AlertTriangle, Calendar } from "lucide-react";
import type { Payment } from "../payment.types";

interface Props {
  projectId: string;
  project: any;
}

const STATUS_BADGE_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PARTIALLY_PAID: "bg-blue-100 text-blue-700",
  FULLY_PAID: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-rose-100 text-rose-700",
  CANCELLED: "bg-gray-100 text-gray-700",
};

export default function ProjectPaymentsTab({ projectId, project: _project }: Props) {
  const { data: paymentsData, isLoading: paymentsLoading } = usePayments({ projectId });
  const { data: quotations = [], isLoading: quotesLoading } = useProjectQuotations(projectId);

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [viewHistoryPayment, setViewHistoryPayment] = useState<Payment | null>(null);

  if (paymentsLoading || quotesLoading) {
    return <div className="text-sm text-muted-foreground animate-pulse py-6 text-center">Loading payments...</div>;
  }

  const payments: Payment[] = paymentsData?.data?.items || [];

  // 1. Calculate Metrics
  const approvedQuotes = quotations.filter((q: any) => q.status === "APPROVED");
  const totalQuotationValue = approvedQuotes.reduce((sum: number, q: any) => sum + Number(q.totalAmount), 0);

  const nonCancelledPayments = payments.filter((p) => p.status !== "CANCELLED");
  const totalBillAmount = nonCancelledPayments.reduce((sum, p) => sum + Number(p.totalBillAmount), 0);
  const totalPaid = nonCancelledPayments.reduce((sum, p) => sum + Number(p.amountReceived), 0);
  const pendingAmount = nonCancelledPayments.reduce((sum, p) => sum + Number(p.pendingAmount), 0);

  // Get latest transaction date/amount
  let latestPaymentDate: string | null = null;
  let latestPaymentAmount = 0;
  const allTransactions = nonCancelledPayments.flatMap((p) => p.transactions || []);
  if (allTransactions.length > 0) {
    const sortedTx = [...allTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    latestPaymentDate = sortedTx[0].date;
    latestPaymentAmount = Number(sortedTx[0].amount);
  }

  // Calculate Overall Project Payment Status
  let overallStatus = "No Bills Linked";
  if (payments.length > 0) {
    if (payments.every((p) => p.status === "CANCELLED")) {
      overallStatus = "Cancelled";
    } else if (payments.some((p) => p.status === "OVERDUE")) {
      overallStatus = "Overdue";
    } else if (pendingAmount <= 0) {
      overallStatus = "Fully Paid";
    } else if (totalPaid > 0) {
      overallStatus = "Partially Paid";
    } else {
      overallStatus = "Pending";
    }
  }

  const handleRecordPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setRecordOpen(true);
  };

  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case "Fully Paid":
        return "text-emerald-600";
      case "Overdue":
        return "text-rose-600";
      case "Partially Paid":
        return "text-blue-600";
      case "Pending":
        return "text-amber-600";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Quotation Value */}
        <Card className="border border-gray-100 shadow-none bg-white rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-violet-50 text-violet-600 rounded-lg shrink-0">
              <DollarSign size={16} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase leading-none mb-1">Approved Quotes</p>
              <p className="text-base font-bold text-gray-900">₹{totalQuotationValue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Bill Amount */}
        <Card className="border border-gray-100 shadow-none bg-white rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <Receipt size={16} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase leading-none mb-1">Total Bill Value</p>
              <p className="text-base font-bold text-gray-900">₹{totalBillAmount.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Paid */}
        <Card className="border border-gray-100 shadow-none bg-white rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
              <CreditCard size={16} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase leading-none mb-1">Amount Collected</p>
              <p className="text-base font-bold text-gray-900">₹{totalPaid.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Pending Amount */}
        <Card className="border border-gray-100 shadow-none bg-white rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg shrink-0 ${pendingAmount > 0 ? "bg-rose-50 text-rose-600" : "bg-zinc-50 text-zinc-400"}`}>
              <AlertTriangle size={16} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase leading-none mb-1">Pending Balance</p>
              <p className={`text-base font-bold ${pendingAmount > 0 ? "text-rose-600" : "text-gray-900"}`}>
                ₹{pendingAmount.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card className="border border-gray-100 shadow-none bg-white rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg shrink-0">
              <Calendar size={16} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase leading-none mb-1">Overall Status</p>
              <p className={`text-base font-bold ${getOverallStatusColor()}`}>{overallStatus}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latest payment information */}
      {latestPaymentDate && (
        <div className="text-xs text-muted-foreground bg-slate-50 border p-3 rounded-xl flex justify-between items-center">
          <span>
            Latest collection: <strong className="text-gray-900">₹{latestPaymentAmount.toLocaleString()}</strong> on{" "}
            {new Date(latestPaymentDate).toLocaleDateString()}
          </span>
        </div>
      )}

      {/* Bills Table & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-gray-100 shadow-none bg-white rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-900">Linked Tally Bills & Outstanding Balance</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs text-muted-foreground italic">No Tally bills linked for this project.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      <TableHead>Bill No</TableHead>
                      <TableHead>Bill Date</TableHead>
                      <TableHead>Bill Amount</TableHead>
                      <TableHead>Collected</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {payments.map((p) => {
                      const isPending = p.status === "PENDING" || p.status === "PARTIALLY_PAID" || p.status === "OVERDUE";
                      return (
                        <TableRow key={p.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-bold text-gray-900">{p.billNumber}</TableCell>
                          <TableCell>{new Date(p.billDate).toLocaleDateString()}</TableCell>
                          <TableCell className="font-semibold">₹{Number(p.totalBillAmount).toLocaleString()}</TableCell>
                          <TableCell className="text-emerald-600 font-medium">₹{Number(p.amountReceived).toLocaleString()}</TableCell>
                          <TableCell className={`font-semibold ${Number(p.pendingAmount) > 0 ? "text-rose-600" : ""}`}>
                            ₹{Number(p.pendingAmount).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] font-bold ${STATUS_BADGE_STYLE[p.status]}`}>
                              {p.status.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1.5">
                              {isPending && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[10px] bg-slate-900 text-white hover:bg-slate-800"
                                  onClick={() => handleRecordPayment(p)}
                                >
                                  Collect
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[10px]"
                                onClick={() => setViewHistoryPayment(p.id === viewHistoryPayment?.id ? null : p)}
                              >
                                {viewHistoryPayment?.id === p.id ? "Hide History" : "History"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Details / History Sidebar */}
        <div className="lg:col-span-1">
          {viewHistoryPayment ? (
            <Card className="border border-gray-100 shadow-none bg-white rounded-2xl">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-gray-900">
                  History: Bill #{viewHistoryPayment.billNumber}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewHistoryPayment(null)}
                  className="h-6 w-6 p-0 text-xs"
                >
                  ×
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-xs border-b pb-3">
                    <div>
                      <p className="text-muted-foreground text-[10px] uppercase">Assigned Collector</p>
                      <p className="font-semibold text-gray-900">{viewHistoryPayment.collector?.name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px] uppercase">Due Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(viewHistoryPayment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Transaction List</h5>
                    <PaymentHistory transactions={viewHistoryPayment.transactions || []} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-gray-100 shadow-none bg-slate-50/50 rounded-2xl h-full flex flex-col justify-center items-center text-center p-6 min-h-[220px]">
              <Receipt size={24} className="text-muted-foreground opacity-60 mb-2" />
              <p className="text-xs font-semibold text-gray-700">Select a Tally Bill History</p>
              <p className="text-[11px] text-muted-foreground max-w-[200px] mt-1">
                Click "History" on any linked bill to view its collector details, due date, and chronological payment records.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Record payment modal */}
      {selectedPayment && (
        <RecordPaymentDialog
          open={recordOpen}
          onOpenChange={setRecordOpen}
          payment={selectedPayment}
        />
      )}
    </div>
  );
}
