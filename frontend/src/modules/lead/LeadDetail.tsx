import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

import PageHeader from "../../components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  History,
  FileText,
  RefreshCw,
  MessageSquare,
  StickyNote,
} from "lucide-react";

import { useLead, useUpdateLead } from "./lead.query";
import LeadStatusDialog from "./components/LeadStatusDialog";
import LeadReminders from "./components/LeadReminders";
import type { LeadStatus } from "./lead.types";

type Tab = "overview" | "quotations" | "reminders" | "timeline";

const STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-amber-100 text-amber-700",
  NOT_RESPONDING: "bg-gray-100 text-gray-700",
  QUOTATION_SENT: "bg-purple-100 text-purple-700",
  NEGOTIATION: "bg-orange-100 text-orange-700",
  WON: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
};

function whatsappLink(mobile: string) {
  const digits = mobile.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

export default function LeadDetail() {
  const { id } = useParams();
  const { data: lead, isLoading } = useLead(id || "");
  const [activeTab, setActiveTab] = useState<Tab>("timeline");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  const updateMutation = useUpdateLead();

  if (isLoading) {
    return <div className="p-6 text-sm text-slate-500 animate-pulse">Loading lead details...</div>;
  }

  if (!lead) {
    return <div className="p-6 text-sm text-slate-500">Lead not found.</div>;
  }

  const leadAny = lead as any;

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await updateMutation.mutateAsync({ id: lead.id, data: { notes: noteText.trim() } });
      toast.success("Note added");
      setNoteText("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add note");
    }
  };

  // Merge activities + notes into one chronological timeline
  const timelineEvents = [
    ...(leadAny.activities || []).map((a: any) => ({
      date: new Date(a.createdAt),
      title: a.type.replace(/_/g, " "),
      message: a.message,
      iconColor: "bg-blue-500 text-white",
    })),
    ...(leadAny.notesHistory || []).map((n: any) => ({
      date: new Date(n.createdAt),
      title: `Note by ${n.user?.name || "Unknown"}`,
      message: n.note,
      iconColor: "bg-indigo-500 text-white",
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <PageHeader title={lead.name} description="Lead details & follow-up tracking" />
        <Link to="/leads" className="text-xs font-semibold text-slate-500 hover:text-slate-700">
          &larr; Back to Leads
        </Link>
      </div>

      {/* Header info card */}
      <Card className="border border-slate-100 bg-white rounded-2xl shadow-sm">
        <CardContent className="pt-5 flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${STATUS_STYLES[lead.status]} font-bold text-xs px-2.5 py-1`}>
                {lead.status.replace(/_/g, " ")}
              </Badge>
              {lead.source && (
                <Badge variant="secondary" className="text-xs font-semibold">
                  {lead.source}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <a href={`tel:${lead.mobile}`} className="flex items-center gap-1.5 font-semibold text-blue-700 hover:underline">
                <Phone size={14} /> {lead.mobile}
              </a>
              {lead.email && (
                <span className="flex items-center gap-1.5">
                  <Mail size={14} className="text-slate-400" /> {lead.email}
                </span>
              )}
              {lead.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" /> {lead.city}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <User size={14} className="text-slate-400" /> {lead.assignedTo?.name || "Unassigned"}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-400" /> Created {new Date(lead.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={whatsappLink(lead.mobile)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center h-9 px-4 rounded-md text-sm font-medium border border-green-200 text-green-700 hover:bg-green-50"
            >
              <MessageSquare size={15} className="mr-1.5" /> WhatsApp
            </a>
            <Button onClick={() => setIsStatusOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw size={15} className="mr-1.5" /> Change Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs navigation */}
      <div className="flex border-b overflow-x-auto shrink-0 scrollbar-none gap-2">
        {[
          { key: "overview", label: "Overview", icon: User },
          { key: "quotations", label: "Quotations", icon: FileText },
          { key: "reminders", label: "Follow-ups", icon: Calendar },
          { key: "timeline", label: "Notes & Activity", icon: History },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as Tab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "overview" && (
          <Card className="border border-slate-100 bg-white rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <StickyNote size={14} className="text-blue-600" /> Latest Note
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-sm space-y-4">
              <p className="text-slate-700">{lead.notes || "No notes yet."}</p>
              {lead.estimatedValue != null && (
                <div className="text-xs text-slate-500">
                  Estimated Value: <span className="font-bold text-slate-700">₹{Number(lead.estimatedValue).toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "quotations" && (
          <Card className="border border-slate-100 bg-white rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <FileText size={14} className="text-blue-600" /> Quotations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!leadAny.quotations || leadAny.quotations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">No quotations created for this lead yet.</div>
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
                    {leadAny.quotations.map((q: any) => (
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
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "reminders" && <LeadReminders leadId={lead.id} />}

        {activeTab === "timeline" && (
          <div className="space-y-4">
            <Card className="border border-slate-100 bg-white rounded-2xl shadow-sm">
              <CardContent className="pt-4 flex items-start gap-3">
                <Textarea
                  rows={2}
                  placeholder="Add a quick note (e.g. call summary, customer request)..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddNote} disabled={!noteText.trim() || updateMutation.isPending} className="shrink-0">
                  Add Note
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-slate-100 bg-white rounded-2xl shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <History size={14} className="text-blue-600" /> Chronological Activity Stream
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {timelineEvents.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-6">No historical actions logged yet.</div>
                ) : (
                  <div className="relative border-l-2 border-slate-100 pl-6 space-y-6">
                    {timelineEvents.map((evt, i) => (
                      <div key={i} className="relative">
                        <span className={`absolute -left-[31px] top-0.5 rounded-full w-4 h-4 flex items-center justify-center ring-4 ring-white ${evt.iconColor}`} />
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs font-bold text-slate-800 capitalize">{evt.title}</span>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">{evt.date.toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{evt.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <LeadStatusDialog lead={lead} open={isStatusOpen} onClose={() => setIsStatusOpen(false)} />
    </div>
  );
}
