import {
  Calendar,
  CheckCircle,
  Download,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  FaFacebook,
  FaInstagram,
  FaPhone,
  FaUserFriends,
  FaWhatsapp,
} from "react-icons/fa";

import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useAuthStore } from "@/store/auth.store";

import { CopyPhone } from "@/components/ui/CopyPhone";
import { useUsers } from "../user/user.query";
import LeadDetailDrawer from "./LeadDetailDrawer";
import LeadForm from "./LeadForm";
import { getLeads } from "./lead.api";
import {
  useDeleteLead,
  useLeadStats,
  useLeads,
  useUpdateLead,
} from "./lead.query";
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

const STATUSES = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "QUOTATION_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
];

const SOURCE_MAP: Record<string, { icon: React.ReactNode; color: string }> = {
  "Walk-in": {
    icon: <FaUserFriends size={13} />,
    color: "bg-orange-100 text-orange-600",
  },
  WhatsApp: {
    icon: <FaWhatsapp size={13} />,
    color: "bg-green-100 text-green-600",
  },
  Instagram: {
    icon: <FaInstagram size={13} />,
    color: "bg-pink-100 text-pink-600",
  },
  Facebook: {
    icon: <FaFacebook size={13} />,
    color: "bg-blue-100 text-blue-600",
  },
  "Phone Call": {
    icon: <FaPhone size={13} />,
    color: "bg-gray-100 text-gray-600",
  },
  Referral: {
    icon: <FaUserFriends size={13} />,
    color: "bg-violet-100 text-violet-600",
  },
};

type StatCardKey = "total" | "followUp" | "todayFollowUp" | "won" | "lost";

type StatCardDef = {
  key: StatCardKey;
  label: string;
  icon: React.ReactNode;
  bg: string;
  activeBg: string;
  statusFilter?: string;
  applyToday?: boolean;
};

const STAT_CARDS: StatCardDef[] = [
  {
    key: "total",
    label: "All Leads",
    icon: <Users size={20} className="text-blue-500" />,
    bg: "bg-blue-50",
    activeBg: "ring-2 ring-blue-400 bg-blue-100",
  },
  {
    key: "followUp",
    label: "Follow Up",
    icon: <Calendar size={20} className="text-orange-500" />,
    bg: "bg-orange-50",
    activeBg: "ring-2 ring-orange-400 bg-orange-100",
    statusFilter: "FOLLOW_UP",
  },
  {
    key: "todayFollowUp",
    label: "Today Follow-up",
    icon: <Calendar size={20} className="text-violet-500" />,
    bg: "bg-violet-50",
    activeBg: "ring-2 ring-violet-400 bg-violet-100",
    statusFilter: "FOLLOW_UP",
    applyToday: true,
  },
  {
    key: "won",
    label: "Converted",
    icon: <CheckCircle size={20} className="text-green-500" />,
    bg: "bg-green-50",
    activeBg: "ring-2 ring-green-400 bg-green-100",
    statusFilter: "WON",
  },
  {
    key: "lost",
    label: "Lost",
    icon: <XCircle size={20} className="text-red-500" />,
    bg: "bg-red-50",
    activeBg: "ring-2 ring-red-400 bg-red-100",
    statusFilter: "LOST",
  },
];

function getDateRange(preset: string): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (preset === "today") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (preset === "yesterday") {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
  } else if (preset === "last7") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (preset === "last30") {
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }
  return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
}

const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 Days" },
  { value: "last30", label: "Last 30 Days" },
];

function relativeFollowUp(dateStr: string): { label: string; urgent: boolean } {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  if (diffMs < 0) {
    const d = Math.floor(-diffMs / (1000 * 60 * 60 * 24));
    return { label: d === 0 ? "Overdue today" : `Overdue ${d}d`, urgent: true };
  }
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return { label: "Today", urgent: true };
  if (diffDays === 1) return { label: "Tomorrow", urgent: false };
  return { label: `In ${diffDays}d`, urgent: false };
}

function stripCountryCode(mobile: string): string {
  return mobile.replace(/^\+?91/, "");
}

function exportToCSV(leads: Lead[]) {
  const headers = [
    "Name",
    "Mobile",
    "City",
    "Source",
    "Status",
    "Assigned To",
    "Created",
    "Next Follow-up",
  ];
  const rows = leads.map((l) => [
    l.name,
    l.mobile,
    l.city ?? "",
    l.source ?? "",
    l.status.replace(/_/g, " "),
    l.assignedTo?.name ?? "",
    new Date(l.createdAt).toLocaleDateString(),
    l.nextFollowUpAt ? new Date(l.nextFollowUpAt).toLocaleDateString() : "",
  ]);
  const csv = [headers, ...rows]
    .map((row) =>
      row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function SourceBadge({ source }: { source?: string | null }) {
  if (!source) return <span className="text-sm text-muted-foreground">—</span>;
  const match = SOURCE_MAP[source];
  if (!match) return <span className="text-sm">{source}</span>;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs md:text-sm font-medium px-2 md:px-2.5 py-0.5 md:py-1 rounded-full whitespace-nowrap ${match.color}`}
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
    <div className="w-11 h-11 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-base shrink-0">
      {initials}
    </div>
  );
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
            <span className="sr-only">Actions</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
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

function MobileLeadCard({
  lead,
  selected,
  onSelect,
  onOpen,
  onStatusChange,
}: {
  lead: Lead;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onOpen: (lead: Lead) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const followUp = lead.nextFollowUpAt
    ? relativeFollowUp(lead.nextFollowUpAt)
    : null;
  const isOverdue =
    !!followUp?.urgent &&
    !!lead.nextFollowUpAt &&
    new Date(lead.nextFollowUpAt) < new Date();

  return (
    <div
      className={`bg-white border rounded-xl p-4 space-y-3 ${isOverdue ? "border-l-4 border-l-red-400" : ""} ${selected ? "ring-2 ring-violet-400" : ""}`}
      onClick={() => onOpen(lead)}
    >
      <div className="flex items-start gap-3">
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selected}
            onCheckedChange={(c) => onSelect(lead.id, !!c)}
          />
        </div>
        <LeadAvatar name={lead.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-base truncate">{lead.name}</p>
            <div onClick={(e) => e.stopPropagation()}>
              <Select
                value={lead.status}
                onValueChange={(v) => onStatusChange(lead.id, v)}
              >
                <SelectTrigger
                  className={`text-xs font-semibold border-0 shadow-none px-2 py-0.5 h-auto rounded-full w-auto ${STATUS_COLORS[lead.status]}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="text-sm">
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <CopyPhone mobile={stripCountryCode(lead.mobile)} />
          {lead.city && (
            <p className="text-sm text-foreground/60">{lead.city}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t">
        <SourceBadge source={lead.source} />
        {followUp ? (
          <span
            className={`text-xs font-medium ${followUp.urgent ? "text-red-500" : "text-muted-foreground"}`}
          >
            {followUp.label}
          </span>
        ) : null}
        {lead.assignedTo && (
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold shrink-0">
              {lead.assignedTo.name[0].toUpperCase()}
            </div>
            <span className="text-xs text-muted-foreground">
              {lead.assignedTo.name}
            </span>
          </div>
        )}
        <div onClick={(e) => e.stopPropagation()}>
          <LeadActions lead={lead} />
        </div>
      </div>
    </div>
  );
}

export default function LeadList() {
  const { user } = useAuthStore();

  const [page, _setPage] = useState(1);

  const setPage: typeof _setPage = (value) => {
    setSelectedIds(new Set());
    _setPage(value);
  };
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [datePreset, setDatePreset] = useState<string>("all");
  const [myLeads, setMyLeads] = useState(false);
  const [activeStatCard, setActiveStatCard] = useState<StatCardKey | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAssignUserId, setBulkAssignUserId] = useState<string>("");
  const [filters, setFilters] = useState<{
    source?: string;
    status?: string;
    assignedToId?: string;
    city?: string;
    dateFrom?: string;
    dateTo?: string;
  }>({});

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: usersData } = useUsers(1);
  const { data, isLoading } = useLeads(page, debouncedSearch, filters, limit);
  const { data: stats } = useLeadStats();
  const updateMutation = useUpdateLead();

  const setFilter = (key: keyof typeof filters, value?: string) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const applyDatePreset = (preset: string) => {
    setDatePreset(preset);
    setPage(1);
    if (preset === "all") {
      setFilters((prev) => ({
        ...prev,
        dateFrom: undefined,
        dateTo: undefined,
      }));
    } else {
      const { dateFrom, dateTo } = getDateRange(preset);
      setFilters((prev) => ({ ...prev, dateFrom, dateTo }));
    }
  };

  const handleStatCardClick = (card: StatCardDef) => {
    if (activeStatCard === card.key) {
      setActiveStatCard(null);
      resetFilters();
      return;
    }
    setActiveStatCard(card.key);
    if (!card.statusFilter) {
      // "All Leads" — clear filters but keep card highlighted
      resetFilters();
      return;
    }
    setPage(1);
    const dateRange = card.applyToday ? getDateRange("today") : {};
    setFilters((prev) => ({
      ...prev,
      status: card.statusFilter,
      ...dateRange,
    }));
    setDatePreset(card.applyToday ? "today" : "all");
  };

  const toggleMyLeads = () => {
    const next = !myLeads;
    setMyLeads(next);
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      assignedToId: next ? (user?.id ?? undefined) : undefined,
    }));
  };

  const hasActiveFilters =
    Object.values(filters).some(Boolean) || datePreset !== "all";

  const resetFilters = () => {
    setPage(1);
    setFilters({});
    setDatePreset("all");
    setMyLeads(false);
  };

  const clearFilters = () => {
    resetFilters();
    setActiveStatCard(null);
  };

  // Bulk select helpers
  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked && data) setSelectedIds(new Set(data.items.map((l) => l.id)));
    else setSelectedIds(new Set());
  };

  const handleBulkAssign = () => {
    if (!bulkAssignUserId || selectedIds.size === 0) return;
    selectedIds.forEach((id) =>
      updateMutation.mutate({ id, data: { assignedToId: bulkAssignUserId } }),
    );
    setSelectedIds(new Set());
    setBulkAssignUserId("");
  };

  const allSelected =
    !!data &&
    data.items.length > 0 &&
    data.items.every((l) => selectedIds.has(l.id));

  const start = (page - 1) * limit + 1;
  const end = data ? Math.min(page * limit, data.total) : 0;

  return (
    <div>
      <PageHeader title="Lead Management" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-6">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            onClick={() => handleStatCardClick(card)}
            className={`rounded-xl border p-3 flex items-center gap-2 cursor-pointer transition-all ${
              activeStatCard === card.key
                ? card.activeBg
                : card.bg + " hover:brightness-95"
            }`}
          >
            <div className="shrink-0">{card.icon}</div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {card.label}
              </p>
              <p className="text-xl font-bold">
                {stats ? stats[card.key] : "—"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar — row 1: search + action buttons */}
      <div className="flex items-center gap-2 mb-2">
        <Input
          placeholder="Search leads..."
          value={search}
          className="flex-1 min-w-0 max-w-xs"
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={toggleMyLeads}
          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
            myLeads
              ? "bg-violet-600 text-white border-violet-600"
              : "border-input hover:bg-muted text-muted-foreground"
          }`}
        >
          My Leads
        </button>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {data && data.items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const all = await getLeads(1, 1000, debouncedSearch, filters);
                exportToCSV(all.items);
              }}
            >
              <Download size={14} className="mr-1" /> Export
            </Button>
          )}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">+ Create Lead</Button>
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

      {/* Filter bar — row 2: filter selects */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Select
          value={filters.source ?? "all"}
          onValueChange={(v) =>
            setFilter("source", v === "all" ? undefined : v)
          }
        >
          <SelectTrigger className="w-28 text-xs">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {Object.keys(SOURCE_MAP).map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) => {
            setFilter("status", v === "all" ? undefined : v);
            setActiveStatCard(null);
          }}
        >
          <SelectTrigger className="w-28 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.assignedToId ?? "all"}
          onValueChange={(v) => {
            setMyLeads(false);
            setFilter("assignedToId", v === "all" ? undefined : v);
          }}
        >
          <SelectTrigger className="w-28 text-xs">
            <SelectValue placeholder="Owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {usersData?.items.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="City"
          value={filters.city ?? ""}
          className="w-24 text-xs"
          onChange={(e) => setFilter("city", e.target.value || undefined)}
        />

      </div>

      {/* Filter bar — row 3: date filters */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <div className="flex border rounded-md overflow-hidden shrink-0">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() =>
                applyDatePreset(datePreset === p.value ? "all" : p.value)
              }
              className={`px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                datePreset === p.value
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            className="w-32 text-xs"
            value={
              datePreset === "custom"
                ? filters.dateFrom
                  ? filters.dateFrom.slice(0, 10)
                  : ""
                : ""
            }
            onChange={(e) => {
              setDatePreset("custom");
              setPage(1);
              const from = e.target.value
                ? new Date(e.target.value)
                : undefined;
              if (from) from.setHours(0, 0, 0, 0);
              setFilters((prev) => ({
                ...prev,
                dateFrom: from?.toISOString(),
              }));
            }}
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            className="w-32 text-xs"
            value={
              datePreset === "custom"
                ? filters.dateTo
                  ? filters.dateTo.slice(0, 10)
                  : ""
                : ""
            }
            onChange={(e) => {
              setDatePreset("custom");
              setPage(1);
              const to = e.target.value ? new Date(e.target.value) : undefined;
              if (to) to.setHours(23, 59, 59, 999);
              setFilters((prev) => ({ ...prev, dateTo: to?.toISOString() }));
            }}
          />
        </div>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {filters.status && (
            <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
              Status: {filters.status.replace(/_/g, " ")}
              <button
                onClick={() => {
                  setFilter("status", undefined);
                  setActiveStatCard(null);
                }}
              >
                <X size={10} />
              </button>
            </span>
          )}
          {filters.source && (
            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              Source: {filters.source}
              <button onClick={() => setFilter("source", undefined)}>
                <X size={10} />
              </button>
            </span>
          )}
          {filters.assignedToId && (
            <span className="inline-flex items-center gap-1 text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full">
              Owner:{" "}
              {usersData?.items.find((u) => u.id === filters.assignedToId)
                ?.name ?? "Unknown"}
              <button
                onClick={() => {
                  setFilter("assignedToId", undefined);
                  setMyLeads(false);
                }}
              >
                <X size={10} />
              </button>
            </span>
          )}
          {filters.city && (
            <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              City: {filters.city}
              <button onClick={() => setFilter("city", undefined)}>
                <X size={10} />
              </button>
            </span>
          )}
          {datePreset !== "all" && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
              {datePreset === "custom"
                ? `${filters.dateFrom?.slice(0, 10) ?? ""} → ${filters.dateTo?.slice(0, 10) ?? ""}`
                : DATE_PRESETS.find((p) => p.value === datePreset)?.label}
              <button onClick={() => applyDatePreset("all")}>
                <X size={10} />
              </button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-violet-50 border border-violet-200 rounded-lg">
          <span className="text-sm font-medium text-violet-700">
            {selectedIds.size} selected
          </span>
          <Select value={bulkAssignUserId} onValueChange={setBulkAssignUserId}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue placeholder="Assign to…" />
            </SelectTrigger>
            <SelectContent>
              {usersData?.items.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleBulkAssign}
            disabled={!bulkAssignUserId}
          >
            Assign
          </Button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {isLoading && (
          <div className="text-center py-10 text-muted-foreground">
            Loading...
          </div>
        )}
        {!isLoading && data?.items.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16">
            <Users size={40} className="text-muted-foreground/20" />
            <p className="text-muted-foreground font-medium">No leads found</p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        )}
        {data?.items.map((lead) => (
          <MobileLeadCard
            key={lead.id}
            lead={lead}
            selected={selectedIds.has(lead.id)}
            onSelect={toggleSelect}
            onOpen={setSelectedLead}
            onStatusChange={(id, status) =>
              updateMutation.mutate({ id, data: { status } })
            }
          />
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Follow-up</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-10 text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            )}

            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Users size={40} className="text-muted-foreground/20" />
                    <p className="text-muted-foreground font-medium">
                      No leads found
                    </p>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {data?.items.map((lead) => {
              const followUp = lead.nextFollowUpAt
                ? relativeFollowUp(lead.nextFollowUpAt)
                : null;
              const isOverdue =
                !!followUp?.urgent &&
                !!lead.nextFollowUpAt &&
                new Date(lead.nextFollowUpAt) < new Date();

              return (
                <TableRow
                  key={lead.id}
                  className={`cursor-pointer hover:bg-muted/50 group ${isOverdue ? "border-l-2 border-l-red-400" : ""} ${selectedIds.has(lead.id) ? "bg-violet-50" : ""}`}
                  onClick={() => setSelectedLead(lead)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(lead.id)}
                      onCheckedChange={(c) => toggleSelect(lead.id, !!c)}
                    />
                  </TableCell>

                  {/* Customer */}
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {lead.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm md:text-base truncate">
                          {lead.name}
                        </p>
                        {lead.city && (
                          <p className="text-xs text-foreground/60 truncate">
                            {lead.city}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Phone */}
                  <TableCell className="py-2 text-sm">
                    <CopyPhone mobile={stripCountryCode(lead.mobile)} />
                  </TableCell>

                  {/* Created */}
                  <TableCell className="py-2">
                    <p className="text-xs md:text-sm text-slate-700 font-medium whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleDateString([], {
                        day: "numeric",
                        month: "short",
                        year: "2-digit",
                      })}
                    </p>
                  </TableCell>

                  {/* Source */}
                  <TableCell className="py-2">
                    <SourceBadge source={lead.source} />
                  </TableCell>

                  {/* Status */}
                  <TableCell
                    className="py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Select
                      value={lead.status}
                      onValueChange={(val) =>
                        updateMutation.mutate({
                          id: lead.id,
                          data: { status: val },
                        })
                      }
                    >
                      <SelectTrigger
                        className={`text-xs font-semibold border-0 shadow-none px-2 py-1 h-auto rounded-full w-auto ${STATUS_COLORS[lead.status]}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="text-sm">
                            {s.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Owner */}
                  <TableCell className="py-2">
                    {lead.assignedTo ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-semibold text-xs shrink-0">
                          {lead.assignedTo.name[0].toUpperCase()}
                        </div>
                        <span className="text-xs md:text-sm truncate max-w-20">
                          {lead.assignedTo.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Follow-up */}
                  <TableCell className="py-2">
                    {followUp ? (
                      <div>
                        <p className="text-xs md:text-sm font-medium whitespace-nowrap">
                          {new Date(lead.nextFollowUpAt!).toLocaleDateString(
                            [],
                            { day: "numeric", month: "short" },
                          )}
                        </p>
                        <p
                          className={`text-xs font-medium ${followUp.urgent ? "text-red-500" : "text-muted-foreground"}`}
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

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 gap-4">
        <p className="text-sm text-muted-foreground">
          {data && data.total > 0
            ? `Showing ${start}–${end} of ${data.total} leads`
            : data?.total === 0
              ? "No leads"
              : ""}
        </p>

        <div className="flex items-center gap-3">
          {/* Per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rows per page</span>
            <div className="flex border rounded-md overflow-hidden">
              {[20, 50, 100].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setLimit(n);
                    setPage(1);
                  }}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    limit === n
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

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
              disabled={!data || page * limit >= data.total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
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
