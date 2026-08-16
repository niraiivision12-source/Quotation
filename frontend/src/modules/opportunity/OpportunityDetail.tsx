import { Link, useParams } from "react-router-dom";

import PageHeader from "../../components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Phone, Mail, MapPin, Calendar, User, History, FileText, DollarSign } from "lucide-react";

import { useOpportunity } from "./opportunity.query";

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-amber-100 text-amber-700",
  QUOTATION_SENT: "bg-purple-100 text-purple-700",
  NEGOTIATION: "bg-orange-100 text-orange-700",
  WON: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
};

function whatsappLink(mobile: string) {
  const digits = mobile.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

export default function OpportunityDetail() {
  const { id } = useParams();
  const { data: opportunity, isLoading } = useOpportunity(id || null);

  if (isLoading) {
    return <div className="p-6 text-sm text-slate-500 animate-pulse">Loading opportunity details...</div>;
  }

  if (!opportunity) {
    return <div className="p-6 text-sm text-slate-500">Opportunity not found.</div>;
  }

  const oppAny = opportunity as any;
  const customer = oppAny.customer;

  const timelineEvents = [...(oppAny.activities || [])]
    .map((a: any) => ({
      date: new Date(a.createdAt),
      title: a.type.replace(/_/g, " "),
      message: a.message,
      by: a.user?.name,
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <PageHeader title={customer?.name || "Opportunity"} description="Opportunity details & activity timeline" />
        <Link to="/leads" className="text-xs font-semibold text-slate-500 hover:text-slate-700">
          &larr; Back to Leads
        </Link>
      </div>

      {/* Header info card */}
      <Card className="border border-slate-100 bg-white rounded-2xl shadow-sm">
        <CardContent className="pt-5 flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${STATUS_STYLES[opportunity.status] || "bg-slate-100 text-slate-700"} font-bold text-xs px-2.5 py-1`}>
                {opportunity.status === "NEGOTIATION" ? "Follow-up" : opportunity.status.replace(/_/g, " ")}
              </Badge>
              <Badge variant="secondary" className="text-xs font-semibold">
                {opportunity.category}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              {customer?.mobile && (
                <a href={`tel:${customer.mobile}`} className="flex items-center gap-1.5 font-semibold text-blue-700 hover:underline">
                  <Phone size={14} /> {customer.mobile}
                </a>
              )}
              {customer?.email && (
                <span className="flex items-center gap-1.5">
                  <Mail size={14} className="text-slate-400" /> {customer.email}
                </span>
              )}
              {customer?.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" /> {customer.city}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <User size={14} className="text-slate-400" /> {opportunity.assignedTo?.name || "Unassigned"}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-400" /> Created {new Date(opportunity.createdAt).toLocaleDateString()}
              </span>
              {opportunity.estimatedValue != null && (
                <span className="flex items-center gap-1.5">
                  <DollarSign size={14} className="text-slate-400" /> ₹{Number(opportunity.estimatedValue).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {customer?.mobile && (
            <a
              href={whatsappLink(customer.mobile)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center h-9 px-4 rounded-md text-sm font-medium border border-green-200 text-green-700 hover:bg-green-50 shrink-0"
            >
              WhatsApp
            </a>
          )}
        </CardContent>
      </Card>

      {/* Quotations */}
      {oppAny.quotations && oppAny.quotations.length > 0 && (
        <Card className="border border-slate-100 bg-white rounded-2xl shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <FileText size={14} className="text-blue-600" /> Quotations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b border-slate-100">
                  <TableHead className="pl-6 text-[10px] font-bold uppercase tracking-wider">Quote No</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right pr-6">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {oppAny.quotations.map((q: any) => (
                  <TableRow key={q.id} className="border-b border-slate-100 hover:bg-slate-50/20">
                    <TableCell className="pl-6 font-semibold text-slate-800">
                      <Link to={`/quotations/${q.id}/history`} className="text-blue-600 hover:underline">
                        {q.quotationNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-[9px] font-semibold">
                        {q.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 font-bold text-slate-700">
                      ₹{Number(q.totalAmount).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card className="border border-slate-100 bg-white rounded-2xl shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
            <History size={14} className="text-blue-600" /> Chronological Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {timelineEvents.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-6">No historical actions logged yet.</div>
          ) : (
            <div className="relative border-l-2 border-slate-100 pl-6 space-y-6">
              {timelineEvents.map((evt, i) => (
                <div key={i} className="relative">
                  <span className="absolute -left-[31px] top-0.5 rounded-full w-4 h-4 flex items-center justify-center ring-4 ring-white bg-blue-500 text-white" />
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-bold text-slate-800 capitalize">{evt.title}</span>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">{evt.date.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                      {evt.message}
                      {evt.by && <span className="text-slate-400"> — by {evt.by}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
