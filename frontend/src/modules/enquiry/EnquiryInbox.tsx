import { useState, useEffect } from "react";
import { useEnquiries, useTriageEnquiry, useIgnoreEnquiry } from "./enquiry.query";
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

export default function EnquiryInbox() {
  const [activeTab, setActiveTab] = useState<"PENDING" | "TRIAGED" | "IGNORED">("PENDING");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(null);
  const [isTriageOpen, setIsTriageOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("PIPES");
  const [settings, setSettings] = useState<any>(null);

  // Manual create enquiry state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newSource, setNewSource] = useState("MANUAL");
  const [isCreating, setIsCreating] = useState(false);

  // Fetch enquiries list
  const { data: enquiriesData, isLoading } = useEnquiries(page, search, activeTab);
  const { data: usersData } = useUsers(1);

  // Tab counts (lightweight, count-only fetches so reps can see backlog size per tab)
  const { data: pendingCountData } = useEnquiries(1, "", "PENDING", 1);
  const { data: triagedCountData } = useEnquiries(1, "", "TRIAGED", 1);
  const { data: ignoredCountData } = useEnquiries(1, "", "IGNORED", 1);
  const tabCounts: Record<"PENDING" | "TRIAGED" | "IGNORED", number | undefined> = {
    PENDING: pendingCountData?.total,
    TRIAGED: triagedCountData?.total,
    IGNORED: ignoredCountData?.total,
  };

  // Auto-select the enquiry when there's exactly one, or when nothing is selected
  // on this list yet — saves reps a click for the common single/first-item case.
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

  // Load assignments settings once
  useEffect(() => {
    api
      .get("/settings")
      .then((res) => setSettings(res.data.data))
      .catch((err) => console.error("Failed to load settings in inbox", err));

    // Handle quick-link query param
    const params = new URLSearchParams(window.location.search);
    if (params.get("create") === "true") {
      setIsCreateOpen(true);
    }
  }, []);

  const handleCreateEnquiry = async () => {
    if (!newName.trim() || !newMobile.trim()) {
      toast.error("Name and mobile number are required");
      return;
    }

    try {
      setIsCreating(true);
      await api.post("/enquiries", {
        name: newName,
        mobile: newMobile,
        email: newEmail || null,
        message: newMessage || null,
        city: newCity || null,
        source: newSource,
      });
      toast.success("Enquiry created successfully!");
      setIsCreateOpen(false);
      setNewName("");
      setNewMobile("");
      setNewEmail("");
      setNewCity("");
      setNewMessage("");
      setNewSource("MANUAL");
      // Reload page to reflect new pending enquiry
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create manual enquiry");
    } finally {
      setIsCreating(false);
    }
  };

  const selectedEnquiry = enquiriesData?.items.find((e) => e.id === selectedEnquiryId);

  const handleTriageConfirm = async () => {
    if (!selectedEnquiryId) return;

    try {
      await triageMutation.mutateAsync({
        id: selectedEnquiryId,
        category: selectedCategory,
      });
      toast.success("Enquiry triaged and moved to pipeline successfully!");
      setIsTriageOpen(false);
      setSelectedEnquiryId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to triage enquiry");
    }
  };

  const handleIgnoreConfirm = async (id?: string) => {
    const targetId = id || selectedEnquiryId;
    if (!targetId) return;

    try {
      await ignoreMutation.mutateAsync(targetId);
      toast.success("Enquiry marked as ignored.");
      if (targetId === selectedEnquiryId) setSelectedEnquiryId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to ignore enquiry");
    }
  };

  const handleOpenTriage = (id: string) => {
    setSelectedEnquiryId(id);
    setSelectedCategory("PIPES");
    setIsTriageOpen(true);
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
      <div className="w-[38%] border-r border-slate-200/60 bg-white/70 backdrop-blur-md flex flex-col h-full">
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
                  }}
                  className={`flex-1 py-2 rounded-md transition-all ${
                    activeTab === tab ? activeClasses : "hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  {tab}
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

        {/* List items */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading enquiries...</div>
          ) : enquiriesData?.items.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
              <Inbox size={40} className="text-slate-300" />
              No enquiries found
            </div>
          ) : (
            enquiriesData?.items.map((enquiry) => (
              <div
                key={enquiry.id}
                onClick={() => setSelectedEnquiryId(enquiry.id)}
                className={`p-4 cursor-pointer transition-colors flex flex-col gap-1.5 ${
                  selectedEnquiryId === enquiry.id
                    ? "bg-blue-50/70 border-l-4 border-blue-600"
                    : "hover:bg-slate-50/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base">{enquiry.name}</h3>
                  {enquiry.status === "PENDING" ? (
                    <span
                      className={`flex items-center gap-1 text-xs font-bold ${
                        isStale(enquiry.createdAt) ? "text-red-500" : "text-slate-400"
                      }`}
                    >
                      <Clock size={12} /> {formatRelativeTime(enquiry.createdAt)}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">
                      {new Date(enquiry.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={`tel:${enquiry.mobile}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-sm font-bold text-blue-700 hover:underline"
                  >
                    <Phone size={13} className="text-blue-500" /> {enquiry.mobile}
                  </a>
                  {enquiry.city && (
                    <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                      <MapPin size={11} /> {enquiry.city}
                    </span>
                  )}
                  <SourceBadge source={enquiry.source} />
                </div>
                {enquiry.message && (
                  <p className="text-sm text-slate-700 line-clamp-2 italic bg-amber-50 border border-amber-100 px-2.5 py-1.5 rounded-lg">
                    "{enquiry.message}"
                  </p>
                )}
                {enquiry.status === "PENDING" && (
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={whatsappLink(enquiry.mobile)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center h-8 px-2.5 rounded-md text-xs font-medium border border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <MessageSquare size={13} className="mr-1" /> WhatsApp
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleIgnoreConfirm(enquiry.id);
                      }}
                      className="h-8 px-2.5 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <XCircle size={13} className="mr-1" /> Ignore
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTriage(enquiry.id);
                      }}
                      className="h-8 px-2.5 text-xs bg-blue-600 hover:bg-blue-700"
                    >
                      <Sparkles size={13} className="mr-1" /> Triage & Assign
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
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

              <div className="flex items-center gap-2">
                {selectedEnquiry.status === "PENDING" && (
                  <>
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
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <XCircle size={15} className="mr-1.5" /> Ignore
                    </Button>
                    <Button onClick={() => handleOpenTriage(selectedEnquiry.id)} className="bg-blue-600 hover:bg-blue-700">
                      <Sparkles size={15} className="mr-1.5" /> Triage & Assign
                    </Button>
                  </>
                )}
                {selectedEnquiry.status === "TRIAGED" && (
                  <Badge className="bg-green-50 text-green-700 border border-green-200 font-semibold px-2.5 py-1">
                    <CheckCircle size={13} className="mr-1 inline-block" /> Triaged to {selectedEnquiry.category}
                  </Badge>
                )}
                {selectedEnquiry.status === "IGNORED" && (
                  <Badge className="bg-slate-100 text-slate-600 border border-slate-200 font-semibold px-2.5 py-1">
                    <XCircle size={13} className="mr-1 inline-block" /> Ignored
                  </Badge>
                )}
              </div>
            </div>

            {/* Message transcript */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-xl bg-white border border-slate-200/50 rounded-xl p-5 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1"><MessageSquare size={13} /> Original Message</span>
                  <span>Received {new Date(selectedEnquiry.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed italic bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                  "{selectedEnquiry.message || "No text description provided."}"
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Inbox size={48} className="text-slate-300 animate-pulse" />
            <p className="text-sm font-medium">Select an enquiry from the inbox list to triage</p>
          </div>
        )}
      </div>

      {/* Triage Dialog Modal */}
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
            <Button onClick={handleTriageConfirm} className="bg-blue-600 hover:bg-blue-700">
              Confirm Triage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Create Manual Enquiry Dialog Modal */}
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
                onChange={(e) => setNewMobile(e.target.value)}
                className="h-9"
              />
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
                setNewName("");
                setNewMobile("");
                setNewEmail("");
                setNewCity("");
                setNewMessage("");
                setNewSource("MANUAL");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateEnquiry} disabled={isCreating} className="bg-blue-600 hover:bg-blue-700">
              {isCreating ? "Creating..." : "Create Enquiry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
