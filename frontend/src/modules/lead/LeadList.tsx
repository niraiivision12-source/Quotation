import { Calendar, CheckCircle, MoreVertical, Users, XCircle } from "lucide-react";
import { useState } from "react";
import {
  FaFacebook,
  FaInstagram,
  FaPhone,
  FaUserFriends,
  FaWhatsapp,
} from "react-icons/fa";

import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import LeadDetailDrawer from "./LeadDetailDrawer";
import LeadForm from "./LeadForm";
import { useUsers } from "../user/user.query";
import { useDeleteLead, useLeadStats, useLeads, useUpdateLead } from "./lead.query";
import type { Lead } from "./lead.types";

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  FOLLOW_UP: "bg-orange-100 text-orange-700",
  QUOTATION_SENT: "bg-purple-100 text-purple-700",
  NEGOTIATION: "bg-pink-100 text-pink-700",
  WON: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
};

const SOURCE_MAP: Record<
  string,
  { icon: React.ReactNode; color: string }
> = {
  instagram: { icon: <FaInstagram size={13} />, color: "bg-pink-100 text-pink-600" },
  facebook: { icon: <FaFacebook size={13} />, color: "bg-blue-100 text-blue-600" },
  whatsapp: { icon: <FaWhatsapp size={13} />, color: "bg-green-100 text-green-600" },
  phone: { icon: <FaPhone size={13} />, color: "bg-gray-100 text-gray-600" },
  "phone call": { icon: <FaPhone size={13} />, color: "bg-gray-100 text-gray-600" },
  referral: { icon: <FaUserFriends size={13} />, color: "bg-violet-100 text-violet-600" },
};

function SourceBadge({ source }: { source?: string | null }) {
  if (!source) return <span className="text-sm text-muted-foreground">—</span>;
  const key = source.toLowerCase();
  const match = SOURCE_MAP[key];
  if (!match) return <span className="text-sm">{source}</span>;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${match.color}`}
    >
      {match.icon}
      {source}
    </span>
  );
}

function LeadAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm shrink-0">
      {initials}
    </div>
  );
}

function relativeFollowUp(dateStr: string): { label: string; urgent: boolean } {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0)
    return { label: new Date(dateStr).toLocaleDateString(), urgent: true };
  if (diffDays === 0) return { label: "Today", urgent: true };
  if (diffDays === 1) return { label: "Tomorrow", urgent: false };
  return { label: `${diffDays} days left`, urgent: false };
}

function LeadActions({ lead }: { lead: Lead }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteMutation = useDeleteLead();
  const updateMutation = useUpdateLead();

  const reopen = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateMutation.mutate({ id: lead.id, data: { status: "FOLLOW_UP" } });
  };

  const confirmDelete = async () => {
    await deleteMutation.mutateAsync(lead.id);
    setDeleteOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {lead.status === "LOST" && (
            <DropdownMenuItem onClick={reopen}>Reopen</DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteOpen(true);
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{lead.name}</strong>? This
            action cannot be undone.
          </p>
          <div className="flex gap-2 mt-4">
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const STAT_CARDS = [
  {
    key: "total",
    label: "All Leads",
    icon: <Users size={20} className="text-blue-500" />,
    bg: "bg-blue-50",
  },
  {
    key: "followUp",
    label: "Follow Up",
    icon: <Calendar size={20} className="text-orange-500" />,
    bg: "bg-orange-50",
  },
  {
    key: "todayFollowUp",
    label: "Today Follow-up",
    icon: <Calendar size={20} className="text-violet-500" />,
    bg: "bg-violet-50",
  },
  {
    key: "won",
    label: "Converted",
    icon: <CheckCircle size={20} className="text-green-500" />,
    bg: "bg-green-50",
  },
  {
    key: "lost",
    label: "Lost",
    icon: <XCircle size={20} className="text-red-500" />,
    bg: "bg-red-50",
  },
] as const;

export default function LeadList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filters, setFilters] = useState<{
    source?: string;
    status?: string;
    assignedToId?: string;
    city?: string;
  }>({});

  const { data: usersData } = useUsers(1);
  const { data, isLoading } = useLeads(page, search, filters);
  const { data: stats } = useLeadStats();

  const setFilter = (key: keyof typeof filters, value?: string) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const clearFilters = () => {
    setPage(1);
    setFilters({});
  };

  return (
    <div>
      <PageHeader title="Lead Management" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className={`rounded-xl border p-4 flex items-center gap-3 ${card.bg}`}
          >
            <div className="shrink-0">{card.icon}</div>
            <div>
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-bold">
                {stats ? stats[card.key] : "—"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Input
          placeholder="Search leads..."
          value={search}
          className="w-48"
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
        />

        {/* Source filter */}
        <Select
          value={filters.source ?? "all"}
          onValueChange={(v) => setFilter("source", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {Object.keys(SOURCE_MAP).map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) => setFilter("status", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {["NEW","CONTACTED","FOLLOW_UP","QUOTATION_SENT","NEGOTIATION","WON","LOST"].map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Contact Owner filter */}
        <Select
          value={filters.assignedToId ?? "all"}
          onValueChange={(v) => setFilter("assignedToId", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Contact Owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {usersData?.items.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* City / Location filter */}
        <Input
          placeholder="Location"
          value={filters.city ?? ""}
          className="w-36"
          onChange={(e) => setFilter("city", e.target.value || undefined)}
        />

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            Clear filters
          </Button>
        )}

        <div className="ml-auto">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>+ Create Lead</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Lead</DialogTitle>
            </DialogHeader>
            <LeadForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Contact Owner</TableHead>
              <TableHead>Next Follow-up</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            )}

            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-muted-foreground"
                >
                  No leads found.
                </TableCell>
              </TableRow>
            )}

            {data?.items.map((lead) => {
              const followUp = lead.nextFollowUpAt
                ? relativeFollowUp(lead.nextFollowUpAt)
                : null;
              return (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedLead(lead)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <LeadAvatar name={lead.name} />
                      <div>
                        <p className="font-medium text-sm">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {lead.mobile}
                        </p>
                        {lead.city && (
                          <p className="text-xs text-muted-foreground">
                            {lead.city}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground/70">
                          {new Date(lead.createdAt).toLocaleDateString([], {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><SourceBadge source={lead.source} /></TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLORS[lead.status]}`}
                    >
                      {lead.status.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    {lead.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-semibold text-xs shrink-0">
                          {lead.assignedTo.name[0].toUpperCase()}
                        </div>
                        <span className="text-sm">{lead.assignedTo.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {followUp ? (
                      <div>
                        <p className="text-xs font-medium">
                          {new Date(lead.nextFollowUpAt!).toLocaleDateString(
                            [],
                            { day: "numeric", month: "short" },
                          )}
                        </p>
                        <p
                          className={`text-xs ${followUp.urgent ? "text-red-500" : "text-muted-foreground"}`}
                        >
                          {followUp.label}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <LeadActions lead={lead} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          {data ? `Showing ${data.items.length} of ${data.total} leads` : ""}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!data || page * 20 >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <LeadDetailDrawer
        lead={selectedLead}
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
      />
    </div>
  );
}
