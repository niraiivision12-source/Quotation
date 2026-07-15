import { useState } from "react";
import { Link } from "react-router-dom";
import { usePayments } from "../payment.query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import RecordPaymentDialog from "./RecordPaymentDialog";
import type { Payment } from "../payment.types";
import { Receipt, Search } from "lucide-react";
import { useFuzzySearch } from "../../../hooks/useFuzzySearch";
import { highlightText } from "../../../utils/highlight.utils";

const STATUS_BADGE_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PARTIALLY_PAID: "bg-blue-100 text-blue-700",
  FULLY_PAID: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-rose-100 text-rose-700",
  CANCELLED: "bg-gray-100 text-gray-700",
};

export default function PaymentList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("ALL");

  const queryParams = {
    page: 1,
    limit: 10000,
    status: status !== "ALL" ? status : undefined,
  };

  const { data: rawPaymentsData, isLoading } = usePayments(queryParams);

  const rawPayments = rawPaymentsData?.data?.items || [];

  const { results: visiblePayments, total } = useFuzzySearch<Payment>({
    items: rawPayments as Payment[],
    keys: ["billNumber", "customer.name", "project.projectName"],
    searchQuery: search,
    page,
    limit: 20,
    customRankFn: (payment: Payment, q: string) => {
      const qLower = q.toLowerCase();
      const billNumber = payment.billNumber.toLowerCase();
      const custName = (payment.customer?.name || "").toLowerCase();
      const projName = (payment.project?.projectName || "").toLowerCase();

      if (billNumber === qLower) return 1;
      if (billNumber.startsWith(qLower)) return 2;
      if (custName.startsWith(qLower) || projName.startsWith(qLower)) return 3;
      if (billNumber.includes(qLower) || custName.includes(qLower) || projName.includes(qLower)) return 4;
      return 5;
    }
  });

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);

  const payments: Payment[] = visiblePayments;

  const handleRecordPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setRecordOpen(true);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by Bill Number, Customer or Project Name..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="pl-9 h-10 text-sm"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <Select
            value={status}
            onValueChange={(val) => {
              setPage(1);
              setStatus(val);
            }}
          >
            <SelectTrigger className="w-40 h-10 text-sm">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
              <SelectItem value="FULLY_PAID">Fully Paid</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="text-sm text-muted-foreground animate-pulse py-12 text-center">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <Receipt size={28} className="text-muted-foreground opacity-60 mb-2" />
            <p className="text-xs font-semibold text-gray-700">No payment invoices found</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Try widening your search terms or filters.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                <TableHead>Bill No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Bill Amount</TableHead>
                <TableHead>Collected</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Collector</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {payments.map((p) => {
                const isPending = p.status === "PENDING" || p.status === "PARTIALLY_PAID" || p.status === "OVERDUE";
                return (
                  <TableRow key={p.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-bold text-gray-900">{highlightText(p.billNumber, search)}</TableCell>
                    <TableCell>
                      {p.customer ? (
                        <Link to={`/customers/${p.customerId}`} className="text-blue-600 hover:underline font-medium">
                          {highlightText(p.customer.name, search)}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {p.project ? (
                        <Link to={`/projects/${p.projectId}`} className="text-blue-600 hover:underline font-medium">
                          {highlightText(p.project.projectName, search)}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">₹{Number(p.totalBillAmount).toLocaleString()}</TableCell>
                    <TableCell className="text-emerald-600 font-medium">₹{Number(p.amountReceived).toLocaleString()}</TableCell>
                    <TableCell className={`font-semibold ${Number(p.pendingAmount) > 0 ? "text-rose-600" : ""}`}>
                      ₹{Number(p.pendingAmount).toLocaleString()}
                    </TableCell>
                    <TableCell>{p.collector?.name || "-"}</TableCell>
                    <TableCell>{new Date(p.dueDate).toLocaleDateString()}</TableCell>
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
                        <Link to={`/projects/${p.projectId}?tab=payments`}>
                          <Button variant="ghost" size="sm" className="h-7 text-[10px]">
                            Details
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination controls */}
      {total > 20 && (
        <div className="flex justify-between items-center text-xs mt-4">
          <span className="text-muted-foreground">
            Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} of {total} payments
          </span>
          <div className="flex gap-2">
            <Button
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
              variant="outline"
              size="sm"
              className="h-8"
            >
              Previous
            </Button>
            <Button
              disabled={page * 20 >= total}
              onClick={() => setPage((prev) => prev + 1)}
              variant="outline"
              size="sm"
              className="h-8"
            >
              Next
            </Button>
          </div>
        </div>
      )}

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
