import { useState } from "react";
import { usePayments } from "../payment.query";
import { Button } from "../../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import RecordPaymentDialog from "./RecordPaymentDialog";
import PaymentHistory from "./PaymentHistory";
import { CreditCard, Receipt, AlertTriangle, ShieldCheck } from "lucide-react";
import type { Payment } from "../payment.types";

interface Props {
  customerId: string;
  customer: any;
}

const STATUS_BADGE_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PARTIALLY_PAID: "bg-blue-100 text-blue-700",
  FULLY_PAID: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-rose-100 text-rose-700",
  CANCELLED: "bg-gray-100 text-gray-700",
};

export default function CustomerPaymentsTab({ customerId, customer }: Props) {
  const { data: paymentsData, isLoading } = usePayments({ customerId });

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [viewHistoryPayment, setViewHistoryPayment] = useState<Payment | null>(null);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground animate-pulse py-6 text-center">Loading payments...</div>;
  }

  const payments: Payment[] = paymentsData?.data?.items || [];
  const nonCancelledPayments = payments.filter((p) => p.status !== "CANCELLED");

  // 1. Calculate Metrics
  const totalPurchases = nonCancelledPayments.reduce((sum, p) => sum + Number(p.totalBillAmount), 0);
  const totalPaid = nonCancelledPayments.reduce((sum, p) => sum + Number(p.amountReceived), 0);
  const totalOutstanding = nonCancelledPayments.reduce((sum, p) => sum + Number(p.pendingAmount), 0);
  const numberofBills = nonCancelledPayments.length;
  const overdueBillsCount = nonCancelledPayments.filter((p) => p.status === "OVERDUE").length;

  // Credit remaining limit
  const maxCredit = Number(customer.maxCreditAmount || 0);
  const remainingCredit = customer.creditAllowed ? Math.max(0, maxCredit - totalOutstanding) : 0;

  // Latest payment transaction date
  let latestPaymentDate: string | null = null;
  const allTransactions = nonCancelledPayments.flatMap((p) => p.transactions || []);
  if (allTransactions.length > 0) {
    const sortedTx = [...allTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    latestPaymentDate = sortedTx[0].date;
  }

  const handleRecordPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setRecordOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Purchases */}
        <Card className="border border-gray-100 shadow-none bg-white rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <Receipt size={16} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase leading-none mb-1">Total Purchases</p>
              <p className="text-base font-bold text-gray-900">₹{totalPurchases.toLocaleString()}</p>
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
              <p className="text-[10px] font-semibold text-muted-foreground uppercase leading-none mb-1">Total Paid</p>
              <p className="text-base font-bold text-gray-900">₹{totalPaid.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Balance */}
        <Card className="border border-gray-100 shadow-none bg-white rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg shrink-0 ${totalOutstanding > 0 ? "bg-rose-50 text-rose-600" : "bg-zinc-50 text-zinc-400"}`}>
              <AlertTriangle size={16} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase leading-none mb-1">Total Outstanding</p>
              <p className={`text-base font-bold ${totalOutstanding > 0 ? "text-rose-600" : "text-gray-900"}`}>
                ₹{totalOutstanding.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Available Credit Limit */}
        <Card className="border border-gray-100 shadow-none bg-white rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0">
              <ShieldCheck size={16} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase leading-none mb-1">Available Credit Limit</p>
              <p className="text-base font-bold text-gray-900">
                {customer.creditAllowed
                  ? maxCredit > 0
                    ? `₹${remainingCredit.toLocaleString()} / ₹${maxCredit.toLocaleString()}`
                    : "No Limit Set"
                  : "No Credit Allowed"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mini details summary */}
      <div className="text-xs text-muted-foreground bg-slate-50 border p-3 rounded-xl flex flex-wrap gap-x-6 gap-y-2 justify-between">
        <div>
          Number of Bills: <strong className="text-gray-900">{numberofBills}</strong> · Overdue Bills:{" "}
          <strong className="text-rose-600">{overdueBillsCount}</strong>
        </div>
        <div>
          Default Credit Period: <strong className="text-gray-900">{customer.defaultCreditDays || 0} Days</strong>
          {latestPaymentDate && (
            <>
              {" "}· Last Payment Date:{" "}
              <strong className="text-gray-900">{new Date(latestPaymentDate).toLocaleDateString()}</strong>
            </>
          )}
        </div>
      </div>

      {/* Grid for bills and history */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-gray-100 shadow-none bg-white rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-900">Tally Bill Invoices</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs text-muted-foreground italic">No linked bills found for this customer.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      <TableHead>Bill No</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Bill Date</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Outstanding</TableHead>
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
                          <TableCell>{p.project?.projectName || "-"}</TableCell>
                          <TableCell>{new Date(p.billDate).toLocaleDateString()}</TableCell>
                          <TableCell className="font-semibold">₹{Number(p.totalBillAmount).toLocaleString()}</TableCell>
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

        {/* Details/Sidebar */}
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
              <p className="text-xs font-semibold text-gray-700">Detailed Transaction Feed</p>
              <p className="text-[11px] text-muted-foreground max-w-[200px] mt-1">
                Click on the "History" button of any bill invoice to load its transaction timeline and collector parameters.
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
