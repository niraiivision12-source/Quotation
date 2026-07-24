import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import CustomerOverview from "./components/CustomerOverview";
import CustomerPaymentsTab from "../payment/components/CustomerPaymentsTab";
import CustomerTasks from "./components/CustomerTasks";
import CustomerReminders from "./components/CustomerReminders";
import { useCustomer } from "./customer.query";
import {
  CreditCard,
  LayoutDashboard,
  ListTodo,
  Calendar,
  Layers,
  History,
  TrendingUp,
  DollarSign,
  CalendarDays,
  Clock,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  FileText,
  User,
} from "lucide-react";

type Tab = "overview" | "opportunities" | "timeline" | "purchase-history" | "payments" | "tasks" | "reminders";

export default function CustomerDetails() {
  const { id } = useParams();
  const { data: customer } = useCustomer(id || "");
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  if (!customer) {
    return <div className="p-6 text-sm text-slate-500 animate-pulse">Loading Customer details...</div>;
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Compile timeline events
  const getTimelineEvents = (cust: any) => {
    const events: any[] = [];

    // Customer activities
    if (cust.activities) {
      cust.activities.forEach((act: any) => {
        events.push({
          date: new Date(act.createdAt),
          title: act.type.replace(/_/g, " "),
          message: act.message,
          type: "general",
          iconColor: "bg-blue-500 text-white",
        });
      });
    }

    // Opportunity activities
    if (cust.opportunities) {
      cust.opportunities.forEach((opp: any) => {
        events.push({
          date: new Date(opp.createdAt),
          title: "Opportunity Created",
          message: `Opportunity created for ${opp.category} category. Source: ${opp.source || "MANUAL"}.`,
          type: "opportunity",
          iconColor: "bg-purple-600 text-white",
        });

        if (opp.activities) {
          opp.activities.forEach((act: any) => {
            events.push({
              date: new Date(act.createdAt),
              title: act.type.replace(/_/g, " "),
              message: act.message,
              type: "opportunity",
              iconColor: "bg-violet-500 text-white",
            });
          });
        }
      });
    }

    // Quotations
    if (cust.quotations) {
      cust.quotations.forEach((q: any) => {
        events.push({
          date: new Date(q.createdAt),
          title: "Quotation Sent",
          message: `Quotation #${q.quotationNumber} created (Version ${q.version}) for ₹${Number(q.totalAmount).toLocaleString()}. Status: ${q.status}.`,
          type: "quotation",
          iconColor: "bg-sky-500 text-white",
        });

        if (q.approvedAt) {
          events.push({
            date: new Date(q.approvedAt),
            title: "Quotation Approved",
            message: `Quotation #${q.quotationNumber} approved successfully.`,
            type: "quotation",
            iconColor: "bg-emerald-500 text-white",
          });
        }

        if (q.rejectedAt) {
          events.push({
            date: new Date(q.rejectedAt),
            title: "Quotation Rejected",
            message: `Quotation #${q.quotationNumber} was rejected. Reason: ${q.revisionReason || "None specified"}.`,
            type: "quotation",
            iconColor: "bg-rose-500 text-white",
          });
        }
      });
    }

    // Payments
    if (cust.payments) {
      cust.payments.forEach((p: any) => {
        events.push({
          date: new Date(p.createdAt),
          title: "Invoice Generated",
          message: `Linked Tally Bill #${p.billNumber} for ₹${Number(p.totalBillAmount).toLocaleString()}. Status: ${p.status}.`,
          type: "payment",
          iconColor: "bg-amber-500 text-white",
        });

        // Loop through transactions if present
        if (p.transactions) {
          p.transactions.forEach((tx: any) => {
            events.push({
              date: new Date(tx.date || tx.createdAt),
              title: "Payment Recorded",
              message: `Recorded payment of ₹${Number(tx.amount).toLocaleString()} via ${tx.paymentMethod}. Ref: ${tx.referenceNumber || "N/A"}.`,
              type: "payment",
              iconColor: "bg-green-600 text-white",
            });
          });
        }
      });
    }

    // Reminders
    if (cust.reminders) {
      cust.reminders.forEach((r: any) => {
        events.push({
          date: new Date(r.createdAt),
          title: "Follow-up Created",
          message: `Scheduled follow-up: "${r.title}" due at ${new Date(r.dueAt).toLocaleDateString()}. Priority: ${r.priority}.`,
          type: "reminder",
          iconColor: "bg-indigo-500 text-white",
        });

        if (r.completedAt) {
          events.push({
            date: new Date(r.completedAt),
            title: "Follow-up Completed",
            message: `Completed scheduled reminder: "${r.title}".`,
            type: "reminder",
            iconColor: "bg-teal-500 text-white",
          });
        }
      });
    }

    // Sort descending chronologically
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const timelineEvents = getTimelineEvents(customer);

  // Filter won opportunities for purchase history
  const wonOpportunities = customer.opportunities?.filter((o: any) => o.status === "WON") || [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between border-b pb-4">
        <PageHeader title={customer.name} description="Customer details & operational overview" />
        <Link to="/customers" className="text-xs font-semibold text-slate-500 hover:text-slate-700">
          &larr; Back to Customers
        </Link>
      </div>

      {/* Overview stats metrics row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Outstanding Amount */}
        <Card className="border border-slate-100 bg-white rounded-2xl p-5 shadow-none flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Outstanding Amount</span>
            <span className="text-xl font-bold text-red-600 tracking-tight">
              {formatCurrency(customer.outstandingAmount || 0)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-red-50 text-red-600 shrink-0">
            <CreditCard size={18} />
          </div>
        </Card>

        {/* Total Revenue */}
        <Card className="border border-slate-100 bg-white rounded-2xl p-5 shadow-none flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Revenue</span>
            <span className="text-xl font-bold text-emerald-600 tracking-tight">
              {formatCurrency(customer.totalRevenue || 0)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <DollarSign size={18} />
          </div>
        </Card>

        {/* Last Purchase */}
        <Card className="border border-slate-100 bg-white rounded-2xl p-5 shadow-none flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Last Purchase</span>
            <span className="text-sm font-bold text-slate-800 tracking-tight">
              {customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString() : "No purchases yet"}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <CalendarDays size={18} />
          </div>
        </Card>

        {/* Last Contact */}
        <Card className="border border-slate-100 bg-white rounded-2xl p-5 shadow-none flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Last Contact</span>
            <span className="text-sm font-bold text-slate-800 tracking-tight">
              {customer.lastContact ? new Date(customer.lastContact).toLocaleDateString() : "Just created"}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
            <Clock size={18} />
          </div>
        </Card>
      </div>

      {/* Tabs navigation list */}
      <div className="flex border-b overflow-x-auto shrink-0 scrollbar-none gap-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === "overview"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <LayoutDashboard size={14} />
          Overview
        </button>

        <button
          onClick={() => setActiveTab("opportunities")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === "opportunities"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers size={14} />
          Opportunities
        </button>

        <button
          onClick={() => setActiveTab("timeline")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === "timeline"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <History size={14} />
          Timeline
        </button>

        <button
          onClick={() => setActiveTab("purchase-history")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === "purchase-history"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <TrendingUp size={14} />
          Purchase History
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === "payments"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CreditCard size={14} />
          Payments
        </button>

        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === "tasks"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ListTodo size={14} />
          Tasks
        </button>

        <button
          onClick={() => setActiveTab("reminders")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === "reminders"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar size={14} />
          Reminders
        </button>
      </div>

      {/* Tabs Content */}
      <div className="mt-4">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact info card */}
              <Card className="border border-slate-100 bg-white shadow-sm rounded-2xl">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                    <Phone size={14} className="text-violet-600" /> Contact & Billing Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 text-xs space-y-3.5">
                  <div className="flex items-center gap-3">
                    <User size={14} className="text-slate-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Full Name</span>
                      <span className="font-semibold text-slate-700">{customer.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={14} className="text-slate-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Mobile Number</span>
                      <span className="font-semibold text-slate-700">{customer.mobile}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={14} className="text-slate-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Email Address</span>
                      <span className="font-semibold text-slate-700">{customer.email || "-"}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin size={14} className="text-slate-400 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Billing Address</span>
                      <span className="font-semibold text-slate-700">{customer.address || "No address provided."}</span>
                    </div>
                  </div>
                  {customer.assignedTo && (
                    <div className="flex items-center gap-3 border-t pt-3 mt-3">
                      <ShieldCheck size={14} className="text-slate-400" />
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Primary Account Manager</span>
                        <span className="font-semibold text-slate-700">{customer.assignedTo.name}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Credit controls settings card */}
              <CustomerOverview customer={customer} />
            </div>
          </div>
        )}

        {activeTab === "opportunities" && (
          <Card className="border border-slate-100 bg-white rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <Layers size={14} className="text-violet-600" /> Customer Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!customer.opportunities || customer.opportunities.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">No opportunities recorded for this customer.</div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-b border-slate-100">
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider pl-6">Category</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider">Salesperson</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center">Stage</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center">Quotation</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center">Payment Status</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right pr-6">Created Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.opportunities.map((opp: any) => {
                      const hasQuote = opp.quotations && opp.quotations.length > 0;
                      const hasPayment = opp.payments && opp.payments.length > 0;
                      const latestQuoteStatus = hasQuote ? opp.quotations[0].status : "N/A";
                      const paymentStatus = hasPayment ? opp.payments[0].status : "UNBILLED";

                      return (
                        <TableRow key={opp.id} className="border-b border-slate-100 hover:bg-slate-50/20">
                          <TableCell className="font-semibold text-slate-800 pl-6">{opp.category}</TableCell>
                          <TableCell>{opp.assignedTo?.name || "Unassigned"}</TableCell>
                          <TableCell className="text-center font-semibold">
                            <Badge
                              variant="outline"
                              className={`text-[9px] font-bold uppercase px-2 border-none ${
                                opp.status === "WON"
                                  ? "bg-green-50 text-green-700"
                                  : opp.status === "LOST"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {opp.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="text-[9px] font-semibold">
                              {latestQuoteStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={`text-[9px] font-bold uppercase border-none ${
                                paymentStatus === "FULLY_PAID"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : paymentStatus === "OVERDUE"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6 font-mono text-slate-500 text-xs">
                            {new Date(opp.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "timeline" && (
          <Card className="border border-slate-100 bg-white rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <History size={14} className="text-violet-600" /> Chronological Activity Stream
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {timelineEvents.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-6">No historical actions logged yet.</div>
              ) : (
                <div className="relative border-l-2 border-slate-100 pl-6 space-y-6">
                  {timelineEvents.map((evt: any, i: number) => (
                    <div key={i} className="relative">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[31px] top-0.5 rounded-full w-4 h-4 flex items-center justify-center ring-4 ring-white ${evt.iconColor}`} />
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs font-bold text-slate-800 capitalize">{evt.title}</span>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {evt.date.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{evt.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "purchase-history" && (
          <div className="space-y-6">
            {/* Purchase summary card */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {/* Active / Won opportunites sales list */}
              <Card className="border border-slate-100 bg-white rounded-2xl shadow-sm">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-500" /> Won Sales Categories
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {wonOpportunities.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">No successfully closed sales yet.</div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-b border-slate-100">
                          <TableHead className="pl-6 text-[10px] font-bold uppercase tracking-wider">Product Category</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right pr-6">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {wonOpportunities.map((opp: any) => (
                          <TableRow key={opp.id} className="border-b border-slate-100 hover:bg-slate-50/10">
                            <TableCell className="pl-6 font-semibold text-slate-800">{opp.category}</TableCell>
                            <TableCell className="text-right pr-6 font-bold text-slate-700">
                              {opp.estimatedValue ? formatCurrency(Number(opp.estimatedValue)) : "₹0"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Related Quotations */}
              <Card className="border border-slate-100 bg-white rounded-2xl shadow-sm">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                    <FileText size={14} className="text-sky-500" /> Quotations History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {!customer.quotations || customer.quotations.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">No quotation invoices generated.</div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-b border-slate-100">
                          <TableHead className="pl-6 text-[10px] font-bold uppercase tracking-wider">Quote No</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center">Status</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right pr-6">Total Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customer.quotations.map((q: any) => (
                          <TableRow key={q.id} className="border-b border-slate-100 hover:bg-slate-50/10">
                            <TableCell className="pl-6 font-semibold text-slate-800">{q.quotationNumber}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="text-[9px] font-semibold">
                                {q.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6 font-bold text-slate-700">
                              {formatCurrency(Number(q.totalAmount))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Invoices and ledger collections */}
            <Card className="border border-slate-100 bg-white rounded-2xl shadow-sm">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <CreditCard size={14} className="text-amber-500" /> Billing Ledger Invoices
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {!customer.payments || customer.payments.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No billed invoices in Tally.</div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="border-b border-slate-100">
                        <TableHead className="pl-6 text-[10px] font-bold uppercase tracking-wider">Bill Number</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center">Date</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center">Invoiced Amt</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center">Received Amt</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center">Outstanding Balance</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right pr-6">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.payments.map((p: any) => (
                        <TableRow key={p.id} className="border-b border-slate-100 hover:bg-slate-50/10">
                          <TableCell className="pl-6 font-semibold text-slate-800">{p.billNumber}</TableCell>
                          <TableCell className="text-center font-mono text-[11px] text-slate-500">
                            {new Date(p.billDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-center font-semibold text-slate-700">
                            {formatCurrency(Number(p.totalBillAmount))}
                          </TableCell>
                          <TableCell className="text-center font-semibold text-emerald-600">
                            {formatCurrency(Number(p.amountReceived))}
                          </TableCell>
                          <TableCell className="text-center font-bold text-red-600">
                            {formatCurrency(Number(p.pendingAmount))}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Badge
                              variant="outline"
                              className={`text-[9px] font-bold uppercase border-none ${
                                p.status === "FULLY_PAID"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : p.status === "OVERDUE"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {p.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "payments" && (
          <CustomerPaymentsTab customerId={id || ""} customer={customer} />
        )}

        {activeTab === "tasks" && (
          <CustomerTasks customerId={id || ""} />
        )}

        {activeTab === "reminders" && (
          <CustomerReminders customerId={id || ""} />
        )}
      </div>
    </div>
  );
}
