import { useState, useEffect } from "react";
import {
  useEnquiries,
  useCreateEnquiry,
  useTriageEnquiry,
  useIgnoreEnquiry,
  useDeleteEnquiry,
  useUpdateEnquiry,
  useRestoreEnquiry,
  useBulkDeleteEnquiries,
  useBulkIgnoreEnquiries,
} from "./enquiry.query";
import { checkEnquiryMobile, exportEnquiriesCSV } from "./enquiry.api";
import { useOpportunities, useOpportunity } from "../opportunity/opportunity.query";
import { useUsers } from "../user/user.query";
import { api } from "../../lib/axios";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { toast } from "sonner";
import {
  Phone,
  Mail,
  MessageSquare,
  MessageCircle,
  Globe,
  Footprints,
  PenSquare,
  Sparkles,
  Search,
  CheckCircle,
  XCircle,
  Inbox,
  Plus,
  MapPin,
  Clock,
  Copy,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  User as UserIcon,
  Trash2,
  Pencil,
  RotateCcw,
  CheckSquare,
  Square,
  Download,
  X,
} from "lucide-react";

function formatRelativeTime(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function isStale(dateString: string) {
  return Date.now() - new Date(dateString).getTime() > 24 * 60 * 60 * 1000;
}

function whatsappLink(mobile: string) {
  const digits = mobile.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

function copyToClipboard(text: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success("Mobile number copied"))
    .catch(() => toast.error("Failed to copy"));
}

export default function EnquiryInbox() {
  const [activeTab, setActiveTab] = useState<"PENDING" | "TRIAGED" | "IGNORED">("PENDING");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(null);
  const [isTriageOpen, setIsTriageOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("PIPES");
  const [triageNotes, setTriageNotes] = useState("");
  const [settings, setSettings] = useState<any>(null);

  // Manual create enquiry state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newSource, setNewSource] = useState("MANUAL");
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [isCheckingMobile, setIsCheckingMobile] = useState(false);

  // Duplicate detection popup state
  const [duplicateEnquiry, setDuplicateEnquiry] = useState<{
    id: string;
    name: string;
    status: string;
    message: string;
  } | null>(null);

  // ─── Delete confirmation dialog ──────────────────────────────────────────
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // ─── Ignore confirmation dialog ──────────────────────────────────────────
  const [isIgnoreOpen, setIsIgnoreOpen] = useState(false);
  const [ignoreTargetId, setIgnoreTargetId] = useState<string | null>(null);

  // ─── Edit dialog ─────────────────────────────────────────────────────────
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editSource, setEditSource] = useState("MANUAL");

  // ─── Bulk selection ──────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // ─── Export state ────────────────────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Clear bulk selection when tab changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab, page, debouncedSearch]);

  // Fetch enquiries list
  const { data: enquiriesData, isLoading, isError } = useEnquiries(page, debouncedSearch, activeTab, limit);
  const { data: usersData } = useUsers(1);

  // For a triaged enquiry, look up the resulting opportunity to show who it's assigned to
  const { data: triagedOpportunityData } = useOpportunities(
    1,
    activeTab === "TRIAGED" && selectedEnquiryId ? enquiriesData?.items.find((e) => e.id === selectedEnquiryId)?.mobile || "" : "",
    undefined,
    5
  );

  // Tab counts
  const { data: pendingCountData } = useEnquiries(1, "", "PENDING", 1);
  const { data: triagedCountData } = useEnquiries(1, "", "TRIAGED", 1);
  const { data: ignoredCountData } = useEnquiries(1, "", "IGNORED", 1);
  const tabCounts: Record<"PENDING" | "TRIAGED" | "IGNORED", number | undefined> = {
    PENDING: pendingCountData?.total,
    TRIAGED: triagedCountData?.total,
    IGNORED: ignoredCountData?.total,
  };

  // Auto-select the first enquiry when the list changes
  useEffect(() => {
    if (!enquiriesData?.items.length) return;
    const stillVisible = enquiriesData.items.some((e) => e.id === selectedEnquiryId);
    if (!stillVisible) {
      setSelectedEnquiryId(enquiriesData.items[0].id);
    }
  }, [enquiriesData]);

  // Mutations
  const triageMutation = useTriageEnquiry();
  const ignoreMutation = useIgnoreEnquiry();
  const createMutation = useCreateEnquiry();
  const deleteMutation = useDeleteEnquiry();
  const updateMutation = useUpdateEnquiry();
  const restoreMutation = useRestoreEnquiry();
  const bulkDeleteMutation = useBulkDeleteEnquiries();
  const bulkIgnoreMutation = useBulkIgnoreEnquiries();

  // Load settings once
  useEffect(() => {
    api
      .get("/settings")
      .then((res) => setSettings(res.data.data))
      .catch((err) => console.error("Failed to load settings in inbox", err));

    const params = new URLSearchParams(window.location.search);
    if (params.get("create") === "true") {
      setIsCreateOpen(true);
    }
  }, []);

  const resetCreateForm = () => {
    setNewName("");
    setNewMobile("");
    setNewEmail("");
    setNewCity("");
    setNewMessage("");
    setNewSource("MANUAL");
    setMobileError(null);
    setDuplicateEnquiry(null);
  };

  const handleMobileBlur = async () => {
    const mobile = newMobile.trim();
    setMobileError(null);
    setDuplicateEnquiry(null);
    if (mobile.length < 10) return;

    setIsCheckingMobile(true);
    try {
      const result = await checkEnquiryMobile(mobile);
      if (result.exists) {
        if (result.existingId) {
          setDuplicateEnquiry({
            id: result.existingId,
            name: result.existingName || "Unknown",
            status: result.existingStatus || "PENDING",
            message: result.message || "An enquiry with this mobile number already exists",
          });
        } else {
          setMobileError(result.message || "This mobile number already exists");
        }
      }
    } catch {
      // If the check fails, don't block the user
    } finally {
      setIsCheckingMobile(false);
    }
  };

  const handleViewExistingEnquiry = (enquiryId: string, enquiryStatus: string) => {
    const tab = enquiryStatus === "TRIAGED" ? "TRIAGED" : enquiryStatus === "IGNORED" ? "IGNORED" : "PENDING";
    setActiveTab(tab as "PENDING" | "TRIAGED" | "IGNORED");
    setPage(1);
    setSelectedEnquiryId(enquiryId);
    setDuplicateEnquiry(null);
    setIsCreateOpen(false);
    resetCreateForm();
  };

  const handleCreateEnquiry = async () => {
    if (!newName.trim() || !newMobile.trim()) {
      toast.error("Name and mobile number are required");
      return;
    }

    if (duplicateEnquiry) {
      return;
    }

    if (mobileError) {
      toast.error(mobileError);
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: newName,
        mobile: newMobile,
        email: newEmail || null,
        message: newMessage || null,
        city: newCity || null,
        source: newSource,
      });
      toast.success("Enquiry created successfully!");
      setIsCreateOpen(false);
      resetCreateForm();
      setActiveTab("PENDING");
      setPage(1);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Failed to create manual enquiry";
      if (err.response?.status === 409) {
        try {
          const checkResult = await checkEnquiryMobile(newMobile.trim());
          if (checkResult.exists && checkResult.existingId) {
            setDuplicateEnquiry({
              id: checkResult.existingId,
              name: checkResult.existingName || newName,
              status: checkResult.existingStatus || "PENDING",
              message: checkResult.message || errMsg,
            });
            return;
          }
        } catch {
          // fall through to show toast
        }
      }
      toast.error(errMsg);
    }
  };

  const selectedEnquiry = enquiriesData?.items.find((e) => e.id === selectedEnquiryId);

  // Match the opportunity for this triaged enquiry
  const matchedOpportunity =
    selectedEnquiry?.status === "TRIAGED"
      ? triagedOpportunityData?.items.find((o) => o.customer?.mobile === selectedEnquiry.mobile)
      : undefined;
  const { data: matchedOpportunityDetail } = useOpportunity(matchedOpportunity?.id || null);
  const triageNoteFromActivity = (matchedOpportunityDetail as any)?.activities
    ?.find((a: any) => a.type === "CREATED" && a.message?.includes("Notes:"))
    ?.message?.split("Notes:")[1]
    ?.trim();

  const handleTriageConfirm = async () => {
    if (!selectedEnquiryId) return;

    try {
      await triageMutation.mutateAsync({
        id: selectedEnquiryId,
        category: selectedCategory,
        notes: triageNotes.trim() || undefined,
      });
      toast.success("Enquiry assigned and moved to pipeline successfully!");
      setIsTriageOpen(false);
      setSelectedEnquiryId(null);
      setTriageNotes("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to assign enquiry");
    }
  };

  // Opens the ignore confirmation modal
  const handleIgnoreConfirm = (id?: string) => {
    const targetId = id || selectedEnquiryId;
    if (!targetId) return;
    setIgnoreTargetId(targetId);
    setIsIgnoreOpen(true);
  };

  // Called when user confirms the ignore action inside the modal
  const handleIgnoreConfirmed = async () => {
    if (!ignoreTargetId) return;
    try {
      await ignoreMutation.mutateAsync(ignoreTargetId);
      toast.success("Enquiry marked as ignored.");
      if (ignoreTargetId === selectedEnquiryId) setSelectedEnquiryId(null);
      setIsIgnoreOpen(false);
      setIgnoreTargetId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to ignore enquiry");
    }
  };

  const handleOpenTriage = (id: string) => {
    setSelectedEnquiryId(id);
    setSelectedCategory("PIPES");
    setTriageNotes("");
    setIsTriageOpen(true);
  };

  // ─── Delete handlers ──────────────────────────────────────────────────────
  const handleOpenDelete = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteMutation.mutateAsync(deleteTargetId);
      toast.success("Enquiry permanently deleted.");
      if (deleteTargetId === selectedEnquiryId) setSelectedEnquiryId(null);
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete enquiry");
    }
  };

  // ─── Edit handlers ────────────────────────────────────────────────────────
  const handleOpenEdit = (enquiry: typeof selectedEnquiry) => {
    if (!enquiry) return;
    setEditName(enquiry.name);
    setEditEmail(enquiry.email || "");
    setEditCity(enquiry.city || "");
    setEditMessage(enquiry.message || "");
    setEditSource(enquiry.source || "MANUAL");
    setIsEditOpen(true);
  };

  const handleEditConfirm = async () => {
    if (!selectedEnquiryId) return;
    try {
      await updateMutation.mutateAsync({
        id: selectedEnquiryId,
        data: {
          name: editName.trim() || undefined,
          email: editEmail.trim() || null,
          city: editCity.trim() || null,
          message: editMessage.trim() || null,
          source: editSource,
        },
      });
      toast.success("Enquiry updated successfully.");
      setIsEditOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update enquiry");
    }
  };

  // ─── Restore handler ──────────────────────────────────────────────────────
  const handleRestore = async (id: string) => {
    try {
      await restoreMutation.mutateAsync(id);
      toast.success("Enquiry restored to Pending.");
      setActiveTab("PENDING");
      setPage(1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to restore enquiry");
    }
  };

  // ─── Bulk selection helpers ───────────────────────────────────────────────
  const allPageIds = enquiriesData?.items.map((e) => e.id) || [];
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allPageIds));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkIgnore = async () => {
    if (selectedIds.size === 0) return;
    try {
      const result = await bulkIgnoreMutation.mutateAsync(Array.from(selectedIds));
      toast.success(`${result.ignored} enquiry/enquiries marked as ignored.`);
      setSelectedIds(new Set());
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to ignore selected enquiries");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      const result = await bulkDeleteMutation.mutateAsync(Array.from(selectedIds));
      toast.success(`${result.deleted} enquiry/enquiries permanently deleted.`);
      setSelectedIds(new Set());
      setIsBulkDeleteOpen(false);
      if (selectedIds.has(selectedEnquiryId || "")) setSelectedEnquiryId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete selected enquiries");
    }
  };

  // ─── Export CSV handler ───────────────────────────────────────────────────
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await exportEnquiriesCSV({
        search: debouncedSearch || undefined,
        status: activeTab,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `enquiries-${activeTab.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV export downloaded.");
    } catch {
      toast.error("Failed to export enquiries");
    } finally {
      setIsExporting(false);
    }
  };

  const getAssignedSalesmanName = (category: string) => {
    if (!settings || !usersData) return "Resolving...";
    const mappings = settings.categorySalesmanAssignment || {};
    const assignedId = mappings[category];

    if (!assignedId) {
      const owner = usersData.items.find((u: any) => u.role === "OWNER" && u.isActive);
      return owner ? `${owner.name} (Owner fallback)` : "Owner (Fallback)";
    }

    const salesman = usersData.items.find((u: any) => u.id === assignedId);
    return salesman ? salesman.name : "Owner (Fallback)";
  };

  const getSourceMeta = (source: string) => {
    switch (source.toUpperCase()) {
      case "WHATSAPP":
        return { label: "WhatsApp", icon: MessageCircle, classes: "bg-green-100 text-green-700" };
      case "WEBSITE":
        return { label: "Website", icon: Globe, classes: "bg-blue-100 text-blue-700" };
      case "WALK_IN":
        return { label: "Walk-In", icon: Footprints, classes: "bg-purple-100 text-purple-700" };
      case "MANUAL":
        return { label: "Manual", icon: PenSquare, classes: "bg-amber-100 text-amber-700" };
      default:
        return { label: source, icon: MessageSquare, classes: "bg-slate-100 text-slate-600" };
    }
  };

  const SourceBadge = ({ source, size = "sm" }: { source: string; size?: "sm" | "md" }) => {
    const { label, icon: Icon, classes } = getSourceMeta(source);
    const sizeClasses = size === "md" ? "text-sm px-3 py-1 gap-1.5" : "text-xs px-2 py-0.5 gap-1";
    return (
      <span className={`flex items-center font-bold rounded-full ${sizeClasses} ${classes}`}>
        <Icon size={size === "md" ? 15 : 12} /> {label}
      </span>
    );
  };

  return (
    <div className="flex h-[calc(100vh-112px)] overflow-hidden bg-slate-55/30 border border-slate-200/50 rounded-2xl shadow-xl">
      {/* Left panel - Enquiries List */}
      <div className="w-[62%] border-r border-slate-200/60 bg-white/70 backdrop-blur-md flex flex-col h-full">
        {/* Header and Search */}
        <div className="p-4 border-b border-slate-200/60 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Inbox size={22} className="text-blue-600" /> Enquiry Inbox
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-bold px-2.5 py-1 text-sm">
                {enquiriesData?.total || 0} Total
              </Badge>
              {/* Export CSV Button */}
              <button
                onClick={handleExport}
                disabled={isExporting}
                title="Export current view as CSV"
                className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download size={13} />
                {isExporting ? "Exporting..." : "Export CSV"}
              </button>
              <Button size="sm" onClick={() => setIsCreateOpen(true)} className="h-8 px-3 text-sm bg-blue-600 text-white hover:bg-blue-700">
                <Plus size={15} className="mr-1" /> New
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <Input
              placeholder="Search by name, mobile..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-slate-50/50 border-slate-200 focus:bg-white"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex bg-slate-100/80 p-1 rounded-lg text-sm font-bold text-slate-600 gap-1">
            {(["PENDING", "TRIAGED", "IGNORED"] as const).map((tab) => {
              const activeClasses = {
                PENDING: "bg-amber-500 text-white shadow-sm",
                TRIAGED: "bg-green-600 text-white shadow-sm",
                IGNORED: "bg-slate-600 text-white shadow-sm",
              }[tab];
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setPage(1);
                    setSelectedEnquiryId(null);
                    setSelectedIds(new Set());
                  }}
                  className={`flex-1 py-2 rounded-md transition-all ${
                    activeTab === tab ? activeClasses : "hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  {tab === "TRIAGED" ? "ASSIGNED" : tab}
                  {typeof tabCounts[tab] === "number" && (
                    <span
                      className={`ml-1 ${activeTab === tab ? "text-white/80" : "text-slate-400"}`}
                    >
                      ({tabCounts[tab]})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Bulk Action Toolbar ────────────────────────────────────────────── */}
        {someSelected && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-b border-blue-100 text-sm">
            <span className="font-bold text-blue-700 mr-1">{selectedIds.size} selected</span>
            {activeTab === "PENDING" && (
              <button
                onClick={handleBulkIgnore}
                disabled={bulkIgnoreMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-600 text-white text-xs font-semibold hover:bg-slate-700 disabled:opacity-50"
              >
                <XCircle size={12} /> Bulk Ignore
              </button>
            )}
            <button
              onClick={() => setIsBulkDeleteOpen(true)}
              disabled={bulkDeleteMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 size={12} /> Bulk Delete
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto text-slate-500 hover:text-slate-700"
              title="Clear selection"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* List items */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading enquiries...</div>
          ) : isError ? (
            <div className="p-12 text-center text-sm text-red-500 flex flex-col items-center gap-2">
              <AlertTriangle size={40} className="text-red-300" />
              Failed to load enquiries. Please try again.
            </div>
          ) : enquiriesData?.items.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
              <Inbox size={40} className="text-slate-300" />
              No enquiries found
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {/* Checkbox column */}
                  <th className="px-2 py-2 border-b border-r border-slate-200 w-8">
                    <button
                      onClick={toggleSelectAll}
                      title={allSelected ? "Deselect all" : "Select all on this page"}
                      className="text-slate-400 hover:text-blue-600"
                    >
                      {allSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                    </button>
                  </th>
                  <th className="text-left px-3 py-2 border-b border-r border-slate-200">Name</th>
                  <th className="text-left px-3 py-2 border-b border-r border-slate-200">Phone</th>
                  <th className="text-left px-3 py-2 border-b border-r border-slate-200 hidden sm:table-cell">City</th>
                  <th className="text-left px-3 py-2 border-b border-r border-slate-200">Source</th>
                  <th className="text-left px-3 py-2 border-b border-r border-slate-200 hidden xl:table-cell">Message</th>
                  <th className="text-left px-3 py-2 border-b border-r border-slate-200">Date</th>
                  <th className="text-left px-3 py-2 border-b border-slate-200 w-px"></th>
                </tr>
              </thead>
              <tbody>
                {enquiriesData?.items.map((enquiry) => (
                  <tr
                    key={enquiry.id}
                    onClick={() => setSelectedEnquiryId(enquiry.id)}
                    className={`group cursor-pointer transition-colors ${
                      selectedEnquiryId === enquiry.id
                        ? "bg-blue-50/70"
                        : selectedIds.has(enquiry.id)
                        ? "bg-blue-50/40"
                        : "odd:bg-slate-50/40 hover:bg-slate-100/70"
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-2 py-2 border-b border-r border-slate-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectOne(enquiry.id);
                        }}
                        className="text-slate-400 hover:text-blue-600"
                      >
                        {selectedIds.has(enquiry.id) ? (
                          <CheckSquare size={14} className="text-blue-600" />
                        ) : (
                          <Square size={14} />
                        )}
                      </button>
                    </td>
                    <td
                      className={`px-3 py-2 border-b border-r border-slate-100 font-bold text-slate-900 max-w-[130px] truncate ${
                        selectedEnquiryId === enquiry.id ? "border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent"
                      }`}
                      title={enquiry.name}
                    >
                      {enquiry.name}
                    </td>
                    <td className="px-3 py-2 border-b border-r border-slate-100 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <a
                          href={`tel:${enquiry.mobile}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 font-semibold text-blue-700 hover:underline"
                        >
                          <Phone size={12} className="text-blue-500 shrink-0" />
                          {enquiry.mobile}
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(enquiry.mobile);
                          }}
                          title="Copy number"
                          className="text-slate-500 hover:text-blue-700"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2 border-b border-r border-slate-100 hidden sm:table-cell max-w-[110px] truncate">
                      {enquiry.city && (
                        <span className="flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 w-fit max-w-full truncate">
                          <MapPin size={10} className="shrink-0" /> <span className="truncate">{enquiry.city}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 border-b border-r border-slate-100 whitespace-nowrap">
                      <SourceBadge source={enquiry.source} />
                    </td>
                    <td
                      className="px-3 py-2 border-b border-r border-slate-100 hidden xl:table-cell text-slate-600 italic max-w-[220px] truncate"
                      title={enquiry.message || undefined}
                    >
                      {enquiry.message && `"${enquiry.message}"`}
                    </td>
                    <td className="px-3 py-2 border-b border-r border-slate-100 whitespace-nowrap text-xs">
                      {enquiry.status === "PENDING" ? (
                        <span
                          className={`flex items-center gap-1 font-bold ${
                            isStale(enquiry.createdAt) ? "text-red-500" : "text-slate-600"
                          }`}
                        >
                          <Clock size={12} /> {formatRelativeTime(enquiry.createdAt)}
                        </span>
                      ) : (
                        <span className="text-slate-600">
                          {new Date(enquiry.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 border-b border-slate-100 whitespace-nowrap">
                      {enquiry.status === "PENDING" && (
                        <div className="flex items-center gap-1">
                          <a
                            href={whatsappLink(enquiry.mobile)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="WhatsApp"
                            className="flex items-center justify-center h-7 w-7 rounded-md border border-green-200 text-green-700 hover:bg-green-50 transition-colors"
                          >
                            <MessageSquare size={13} />
                          </a>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleIgnoreConfirm(enquiry.id);
                            }}
                            disabled={ignoreMutation.isPending && ignoreMutation.variables === enquiry.id}
                            title="Move to Ignore"
                            className="flex items-center justify-center h-7 w-7 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <XCircle size={13} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDelete(enquiry.id);
                            }}
                            title="Delete permanently"
                            className="flex items-center justify-center h-7 w-7 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenTriage(enquiry.id);
                            }}
                            className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700"
                          >
                            <Sparkles size={12} className="mr-1" /> Assign
                          </Button>
                        </div>
                      )}
                      {enquiry.status === "IGNORED" && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestore(enquiry.id);
                            }}
                            disabled={restoreMutation.isPending && restoreMutation.variables === enquiry.id}
                            title="Restore to Pending"
                            className="flex items-center justify-center h-7 w-7 rounded-md border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50 transition-colors"
                          >
                            <RotateCcw size={13} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDelete(enquiry.id);
                            }}
                            title="Delete permanently"
                            className="flex items-center justify-center h-7 w-7 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                      {enquiry.status === "TRIAGED" && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDelete(enquiry.id);
                            }}
                            title="Delete permanently"
                            className="flex items-center justify-center h-7 w-7 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && !isError && (enquiriesData?.total || 0) > limit && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200/60 bg-white/70 text-xs font-semibold text-slate-500">
            <span>
              Page {page} of {Math.max(1, Math.ceil((enquiriesData?.total || 0) / limit))} · {enquiriesData?.total} total
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center justify-center h-7 w-7 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() =>
                  setPage((p) =>
                    p * limit < (enquiriesData?.total || 0) ? p + 1 : p
                  )
                }
                disabled={page * limit >= (enquiriesData?.total || 0)}
                className="flex items-center justify-center h-7 w-7 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right panel - Details View */}
      <div className="flex-1 bg-slate-50/30 flex flex-col h-full">
        {selectedEnquiry ? (
          <div className="flex-1 flex flex-col h-full bg-white/40 backdrop-blur-md">
            {/* Header info */}
            <div className="p-6 border-b border-slate-200/50 flex items-start justify-between bg-white">
              <div className="flex flex-col gap-2.5">
                <h3 className="text-2xl font-extrabold text-slate-900">{selectedEnquiry.name}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`tel:${selectedEnquiry.mobile}`}
                    className="flex items-center gap-1.5 text-base font-bold text-blue-700 hover:underline"
                  >
                    <Phone size={16} className="text-blue-500" />
                    {selectedEnquiry.mobile}
                  </a>
                  <button
                    onClick={() => copyToClipboard(selectedEnquiry.mobile)}
                    title="Copy number"
                    className="text-slate-600 hover:text-blue-700"
                  >
                    <Copy size={16} />
                  </button>
                  {selectedEnquiry.email && (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                      <Mail size={14} className="text-slate-400" />
                      {selectedEnquiry.email}
                    </span>
                  )}
                  {selectedEnquiry.city && (
                    <span className="flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full bg-teal-100 text-teal-700">
                      <MapPin size={13} /> {selectedEnquiry.city}
                    </span>
                  )}
                  <SourceBadge source={selectedEnquiry.source} size="md" />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                {selectedEnquiry.status === "PENDING" && (
                  <>
                    {/* Edit button (PENDING only) */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(selectedEnquiry)}
                      className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                    >
                      <Pencil size={14} className="mr-1.5" /> Edit
                    </Button>
                    <a
                      href={whatsappLink(selectedEnquiry.mobile)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center h-9 px-4 rounded-md text-sm font-medium border border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <MessageSquare size={15} className="mr-1.5" /> WhatsApp
                    </a>
                    <Button
                      variant="outline"
                      onClick={() => handleIgnoreConfirm()}
                      disabled={ignoreMutation.isPending && ignoreMutation.variables === selectedEnquiry.id}
                      className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                    >
                      <XCircle size={15} className="mr-1.5" />
                      {ignoreMutation.isPending && ignoreMutation.variables === selectedEnquiry.id ? "Ignoring..." : "Ignore"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDelete(selectedEnquiry.id)}
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 size={14} className="mr-1.5" /> Delete
                    </Button>
                    <Button onClick={() => handleOpenTriage(selectedEnquiry.id)} className="bg-blue-600 hover:bg-blue-700">
                      <Sparkles size={15} className="mr-1.5" /> Assign Category
                    </Button>
                  </>
                )}
                {selectedEnquiry.status === "TRIAGED" && (
                  <>
                    <Badge className="bg-green-50 text-green-700 border border-green-200 font-semibold px-2.5 py-1">
                      <CheckCircle size={13} className="mr-1 inline-block" /> Assigned to {selectedEnquiry.category}
                    </Badge>
                    {/* Delete button for triaged */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDelete(selectedEnquiry.id)}
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 size={14} className="mr-1.5" /> Delete
                    </Button>
                  </>
                )}
                {selectedEnquiry.status === "IGNORED" && (
                  <>
                    <Badge className="bg-slate-100 text-slate-600 border border-slate-200 font-semibold px-2.5 py-1">
                      <XCircle size={13} className="mr-1 inline-block" /> Ignored
                    </Badge>
                    {/* Restore button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(selectedEnquiry.id)}
                      disabled={restoreMutation.isPending}
                      className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                    >
                      <RotateCcw size={14} className="mr-1.5" />
                      {restoreMutation.isPending ? "Restoring..." : "Restore to Pending"}
                    </Button>
                    {/* Delete button for ignored */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDelete(selectedEnquiry.id)}
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 size={14} className="mr-1.5" /> Delete
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Message transcript */}
            <div className="flex-1 p-6 overflow-y-auto">
              {selectedEnquiry.status === "TRIAGED" && matchedOpportunity && (
                <div className="max-w-xl bg-green-50/60 border border-green-100 rounded-xl p-5 shadow-sm flex flex-col gap-1 mb-4 text-sm">
                  <span className="flex items-center gap-1.5 font-bold text-green-800 uppercase tracking-wider text-[10px]">
                    <UserIcon size={12} /> Assigned To
                  </span>
                  <p className="text-green-900 font-semibold">
                    {matchedOpportunity.assignedTo?.name || "Unassigned"}
                  </p>
                  {triageNoteFromActivity && (
                    <>
                      <span className="font-bold text-green-800 uppercase tracking-wider text-[10px] mt-2">
                        Assignment Notes
                      </span>
                      <p className="text-green-900">{triageNoteFromActivity}</p>
                    </>
                  )}
                </div>
              )}
              <div className="max-w-xl bg-white border border-slate-200/50 rounded-xl p-5 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1"><MessageSquare size={13} /> Original Message</span>
                  <span>Received {new Date(selectedEnquiry.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed italic bg-slate-50/50 p-4 rounded-lg border border-slate-100 break-words whitespace-pre-wrap">
                  "{selectedEnquiry.message?.trim() || "No text description provided."}"
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Inbox size={48} className="text-slate-300 animate-pulse" />
            <p className="text-sm font-medium">Select an enquiry from the inbox list to assign</p>
          </div>
        )}
      </div>

      {/* ─── Triage Dialog Modal ─────────────────────────────────────────────── */}
      <Dialog open={isTriageOpen} onOpenChange={setIsTriageOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <Sparkles className="text-blue-600" size={18} /> Assign Product Category
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white shadow-sm focus:border-blue-600"
              >
                <option value="PIPES">Pipes</option>
                <option value="WIRES">Wires</option>
                <option value="SWITCHES">Switches</option>
                <option value="LIGHTS">Lights</option>
                <option value="FANS">Fans</option>
                <option value="OTHERS">Others</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes (optional)</label>
              <textarea
                value={triageNotes}
                onChange={(e) => setTriageNotes(e.target.value)}
                placeholder="Add any context for the salesperson..."
                rows={3}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white shadow-sm focus:border-blue-600 resize-none"
              />
            </div>

            {/* Assignment preview */}
            <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-lg flex flex-col gap-1 text-xs">
              <span className="font-bold text-blue-800 uppercase tracking-wider text-[10px]">Auto-Assignment Preview</span>
              <p className="text-blue-900 mt-1">
                Category <strong>{selectedCategory}</strong> is currently mapped to salesman:{" "}
                <span className="underline font-bold">{getAssignedSalesmanName(selectedCategory)}</span>.
              </p>
              <span className="text-[10px] text-blue-600/70 mt-1">
                * Mappings can be altered in Owner Settings.
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTriageOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTriageConfirm} disabled={triageMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
              {triageMutation.isPending ? "Assigning..." : "Confirm Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Create Manual Enquiry Dialog ───────────────────────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <Inbox className="text-blue-600" size={18} /> Create Manual Enquiry
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-600">Customer Name *</label>
              <Input
                placeholder="e.g. John Doe"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-600">Mobile Number *</label>
              <Input
                placeholder="e.g. 9876543210"
                value={newMobile}
                onChange={(e) => {
                  setNewMobile(e.target.value);
                  setMobileError(null);
                  setDuplicateEnquiry(null);
                }}
                onBlur={handleMobileBlur}
                className={`h-9 ${mobileError || duplicateEnquiry ? "border-amber-400 focus-visible:ring-amber-400" : ""}`}
              />
              {isCheckingMobile && <span className="text-slate-400">Checking mobile number...</span>}
              {mobileError && <span className="text-red-600 font-semibold">{mobileError}</span>}
              {duplicateEnquiry && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <span className="text-amber-800 font-bold text-[11px]">Existing Enquiry Detected</span>
                    <span className="text-amber-700 text-[11px]">
                      {duplicateEnquiry.message} for <strong>{duplicateEnquiry.name}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-600">Email Address (Optional)</label>
              <Input
                type="email"
                placeholder="e.g. john@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-600">City (Optional)</label>
              <Input
                placeholder="e.g. Mumbai"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-600">Lead Source</label>
              <select
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white shadow-sm focus:border-blue-600"
              >
                <option value="MANUAL">Manual</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="WEBSITE">Website</option>
                <option value="WALK_IN">Walk-In</option>
                <option value="PHONE">Phone</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-600">Requirement Message (Optional)</label>
              <textarea
                rows={3}
                placeholder="Describe details (e.g. wants pricing for 3BHK flat pipes & wiring)..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="border border-slate-200 rounded-lg p-2 text-sm bg-white shadow-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                resetCreateForm();
              }}
            >
              Cancel
            </Button>
            {duplicateEnquiry ? (
              <Button
                onClick={() => handleViewExistingEnquiry(duplicateEnquiry.id, duplicateEnquiry.status)}
                className="bg-amber-600 hover:bg-amber-700"
              >
                View Existing Enquiry
              </Button>
            ) : (
              <Button
                onClick={handleCreateEnquiry}
                disabled={createMutation.isPending || !!mobileError || isCheckingMobile}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createMutation.isPending ? "Creating..." : "Create Enquiry"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Duplicate Enquiry Detected Modal ───────────────────────────────── */}
      <Dialog open={!!duplicateEnquiry && !isCreateOpen} onOpenChange={(open) => { if (!open) setDuplicateEnquiry(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="text-amber-600" size={20} /> Duplicate Enquiry Detected
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 text-sm text-slate-700 space-y-3">
            <p>
              An enquiry with this mobile number already exists for{" "}
              <strong className="text-slate-900">{duplicateEnquiry?.name}</strong>.
            </p>
            <p>Would you like to view the existing enquiry record instead of creating a duplicate?</p>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800">
              <strong>Status:</strong> {duplicateEnquiry?.status}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateEnquiry(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => duplicateEnquiry && handleViewExistingEnquiry(duplicateEnquiry.id, duplicateEnquiry.status)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              View Existing Enquiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ──────────────────────────────────────── */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { if (!open) { setIsDeleteOpen(false); setDeleteTargetId(null); } }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <Trash2 className="text-red-600" size={18} /> Delete Enquiry Permanently
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 text-sm text-slate-700 space-y-3">
            <p>
              Are you sure you want to <strong>permanently delete</strong> this enquiry? This action cannot be undone.
            </p>
            {deleteTargetId && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-800">
                <strong>Note:</strong> If this enquiry was already assigned and converted to an opportunity, the corresponding opportunity (and its quotations/tasks/reminders) will also be permanently deleted.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setDeleteTargetId(null); }}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Enquiry Dialog ──────────────────────────────────────────────── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <Pencil className="text-blue-600" size={18} /> Edit Enquiry
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-600">Customer Name *</label>
              <Input
                placeholder="e.g. John Doe"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-600">Email Address (Optional)</label>
              <Input
                type="email"
                placeholder="e.g. john@example.com"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-600">City (Optional)</label>
              <Input
                placeholder="e.g. Mumbai"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-600">Lead Source</label>
              <select
                value={editSource}
                onChange={(e) => setEditSource(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white shadow-sm focus:border-blue-600"
              >
                <option value="MANUAL">Manual</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="WEBSITE">Website</option>
                <option value="WALK_IN">Walk-In</option>
                <option value="PHONE">Phone</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-600">Requirement Message (Optional)</label>
              <textarea
                rows={3}
                placeholder="Describe details..."
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                className="border border-slate-200 rounded-lg p-2 text-sm bg-white shadow-sm focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700">
              <strong>Note:</strong> Mobile number cannot be changed after creation to prevent data conflicts.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditConfirm}
              disabled={updateMutation.isPending || !editName.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Bulk Delete Confirmation Dialog ────────────────────────────────── */}
      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <Trash2 className="text-red-600" size={18} /> Bulk Delete Enquiries
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 text-sm text-slate-700 space-y-3">
            <p>
              You are about to <strong>permanently delete {selectedIds.size} enquiry/enquiries</strong>. This action cannot be undone.
            </p>
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-800">
              <strong>Note:</strong> Any opportunities that were created from assigned enquiries will also be permanently deleted.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : `Delete ${selectedIds.size} Enquiry/Enquiries`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Ignore Confirmation Dialog ───────────────────────────────────────── */}
      <Dialog
        open={isIgnoreOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsIgnoreOpen(false);
            setIgnoreTargetId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <XCircle className="text-slate-600" size={18} /> Move Enquiry to Ignored
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 text-sm text-slate-700 space-y-3">
            <p>Are you sure you want to move this enquiry to the <strong>Ignored</strong> list?</p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
              You can restore ignored enquiries back to Pending at any time from the Ignored tab.
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsIgnoreOpen(false);
                setIgnoreTargetId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleIgnoreConfirmed}
              disabled={ignoreMutation.isPending}
              className="bg-slate-700 hover:bg-slate-800 text-white"
            >
              {ignoreMutation.isPending ? "Moving..." : "Move to Ignored"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
