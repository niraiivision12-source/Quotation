import { useState, useEffect } from "react";
import { useOpportunityCounts, useUpdateOpportunity } from "./opportunity.query";
import { useUsers } from "../user/user.query";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  LayoutGrid,
  Filter,
  Lock,
} from "lucide-react";
import type { OpportunityStatus, ProductCategory } from "./opportunity.types";
import { useAuthStore } from "../../store/auth.store";
import { api } from "../../lib/axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import PipelineColumn from "./PipelineColumn";

const COLUMNS: { status: OpportunityStatus; title: string; colorClass: string }[] = [
  { status: "NEW", title: "New", colorClass: "border-t-4 border-t-blue-500 bg-blue-50/10" },
  { status: "QUOTATION_SENT", title: "Quote Sent", colorClass: "border-t-4 border-t-purple-500 bg-purple-50/10" },
  { status: "NEGOTIATION", title: "Negotiation", colorClass: "border-t-4 border-t-pink-500 bg-pink-50/10" },
  { status: "WON", title: "Won 🎉", colorClass: "border-t-4 border-t-green-500 bg-green-50/10" },
  { status: "LOST", title: "Lost ❌", colorClass: "border-t-4 border-t-red-500 bg-red-50/10" },
];

export default function PipelineBoard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") as ProductCategory | null;

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>(() => {
    if (categoryParam) return categoryParam;
    const saved = localStorage.getItem("lastViewedPipelineStage");
    return (saved as ProductCategory) || "PIPES";
  });

  const [search, setSearch] = useState("");
  const [draggedOpp, setDraggedOpp] = useState<any>(null);
  const [isLostReasonOpen, setIsLostReasonOpen] = useState(false);
  const [lostReasonInput, setLostReasonInput] = useState("");
  const [targetLostOppId, setTargetLostOppId] = useState<string | null>(null);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [followUpDateInput, setFollowUpDateInput] = useState("");
  const [targetNegotiationOppId, setTargetNegotiationOppId] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);

  // Won/Lost follow-up states
  const [isWonLostFollowUpOpen, setIsWonLostFollowUpOpen] = useState(false);
  const [targetWonLostOppId, setTargetWonLostOppId] = useState<string | null>(null);
  const [targetWonLostStatus, setTargetWonLostStatus] = useState<"WON" | "LOST" | null>(null);
  const [wonLostDateInput, setWonLostDateInput] = useState("");
  const [wonLostTitleInput, setWonLostTitleInput] = useState("");
  const [wonLostDescInput, setWonLostDescInput] = useState("");
  const [wonLostPriorityInput, setWonLostPriorityInput] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [wonLostReasonInput, setWonLostReasonInput] = useState("");
  const [wonLostNextPhaseInput, setWonLostNextPhaseInput] = useState<string>("");

  useEffect(() => {
    if (categoryParam && categoryParam !== selectedCategory) {
      setSelectedCategory(categoryParam);
      localStorage.setItem("lastViewedPipelineStage", categoryParam);
    }
  }, [categoryParam]);

  // Fetch settings on mount
  useState(() => {
    api.get("/settings")
      .then((res) => setSettings(res.data.data))
      .catch((err) => console.error("Failed to load settings in board", err));
  });

  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isOwner = user?.role === "OWNER";

  const hasEditPermission = () => {
    if (isOwner) return true;
    if (!settings || !user) return false;
    const mappings = settings.categorySalesmanAssignment || {};
    const config = mappings[selectedCategory];
    if (!config) return false;
    if (typeof config === "string") {
      return config === user.id;
    }
    const isPrimary = config.primarySalespersonId === user.id;
    const isBackup = config.backupSalespersonId === user.id;
    const isAdditional = Array.isArray(config.additionalEditors) && config.additionalEditors.includes(user.id);
    return isPrimary || isBackup || isAdditional;
  };

  const isEditable = hasEditPermission();

  // Per-stage counts for column headers (accurate even before a column's cards are loaded)
  const { data: counts } = useOpportunityCounts(selectedCategory, search);

  const { data: usersData } = useUsers(1);
  const updateOppMutation = useUpdateOpportunity();

  const handleDragStart = (e: React.DragEvent, opp: any) => {
    if (!isEditable) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", JSON.stringify(opp));
    setDraggedOpp(opp);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isEditable) return;
    e.preventDefault();
  };

const mapCategoryToPhase = (category: string): string => {
  switch (category) {
    case "PIPES":
      return "PIPES";
    case "WIRES":
      return "WIRING";
    case "SWITCHES":
      return "SWITCHES";
    case "LIGHTS":
      return "LIGHTS";
    case "FANS":
      return "FANS";
    case "OTHERS":
      return "OTHERS";
    default:
      return "OTHERS";
  }
};

  const handleDrop = async (e: React.DragEvent, targetStatus: OpportunityStatus) => {
    e.preventDefault();
    if (!isEditable) {
      toast.error("You do not have permission to manage this pipeline category.");
      return;
    }
    const raw = e.dataTransfer.getData("text/plain");
    const currentOpp = raw ? JSON.parse(raw) : draggedOpp;
    setDraggedOpp(null);
    if (!currentOpp) return;

    const id = currentOpp.id;

    if (currentOpp.status === targetStatus) return;

    if (targetStatus === "WON" || targetStatus === "LOST") {
      setTargetWonLostOppId(id);
      setTargetWonLostStatus(targetStatus);
      setWonLostDateInput("");
      setWonLostTitleInput(targetStatus === "WON" ? "Won Project Follow-up" : "Lost Project Follow-up");
      setWonLostDescInput("");
      setWonLostPriorityInput("MEDIUM");
      setWonLostReasonInput("");
      setWonLostNextPhaseInput("");
      setIsWonLostFollowUpOpen(true);
      return;
    }

    if (targetStatus === "NEGOTIATION") {
      setTargetNegotiationOppId(id);
      setFollowUpDateInput(currentOpp.nextFollowUpAt ? currentOpp.nextFollowUpAt.slice(0, 10) : "");
      setIsFollowUpOpen(true);
      return;
    }

    if (targetStatus === "QUOTATION_SENT") {
      let resolvedProjectId = currentOpp.projectId || "";
      if (!resolvedProjectId) {
        try {
          const res = await api.get(`/projects?customerId=${currentOpp.customerId}`);
          const projects = res.data.data.items || [];
          if (projects.length > 0) {
            resolvedProjectId = projects[0].id;
          }
        } catch (err) {
          console.error("Failed to load customer projects", err);
        }
      }
      navigate(`/quotations?customerId=${currentOpp.customerId}&projectId=${resolvedProjectId}&opportunityId=${currentOpp.id}`);
      return;
    }

    let resolvedProjectId = currentOpp.projectId || "";
    try {
      await updateOppMutation.mutateAsync({
        id,
        data: { 
          status: targetStatus,
          projectId: resolvedProjectId || undefined
        },
      });
      toast.success(`Opportunity status updated to ${targetStatus}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update opportunity status");
    }
  };

  const handleFollowUpConfirm = async () => {
    if (!targetNegotiationOppId) return;

    try {
      await updateOppMutation.mutateAsync({
        id: targetNegotiationOppId,
        data: {
          status: "NEGOTIATION",
          nextFollowUpAt: new Date(followUpDateInput).toISOString(),
        },
      });
      toast.success("Opportunity moved to Negotiation");
      setIsFollowUpOpen(false);
      setFollowUpDateInput("");
      setTargetNegotiationOppId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update opportunity");
    }
  };

  const handleWonLostFollowUpConfirm = async () => {
    if (!targetWonLostOppId || !targetWonLostStatus) return;

    if (!wonLostDateInput) {
      toast.error("Follow-up date is required");
      return;
    }

    if (targetWonLostStatus === "LOST" && !wonLostReasonInput.trim()) {
      toast.error("Lost reason is required");
      return;
    }

    if (!wonLostNextPhaseInput) {
      toast.error("Next phase is required");
      return;
    }

    try {
      await updateOppMutation.mutateAsync({
        id: targetWonLostOppId,
        data: {
          status: targetWonLostStatus,
          lostReason: targetWonLostStatus === "LOST" ? wonLostReasonInput : undefined,
          nextPhase: wonLostNextPhaseInput,
          followUp: {
            title: wonLostTitleInput || (targetWonLostStatus === "WON" ? "Won Project Follow-up" : "Lost Project Follow-up"),
            description: wonLostDescInput || undefined,
            priority: wonLostPriorityInput,
            dueAt: new Date(wonLostDateInput),
          }
        },
      });
      toast.success(`Opportunity status updated to ${targetWonLostStatus}`);
      setIsWonLostFollowUpOpen(false);
      setTargetWonLostOppId(null);
      setTargetWonLostStatus(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update opportunity status");
    }
  };

  // Helper to format date
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "No follow-up set";
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  // Check if nextFollowUpAt is overdue
  const isOverdue = (dateStr?: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const getSalesmanName = (id?: string | null) => {
    if (!id || !usersData) return "Unassigned";
    const salesman = usersData.items.find((u: any) => u.id === id);
    return salesman ? salesman.name : "Unassigned";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] overflow-hidden gap-4">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
            <LayoutGrid size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800">Product Pipeline</h2>
              {!isEditable && (
                <Badge className="bg-red-50 text-red-700 border border-red-100 font-bold text-[10px] uppercase flex items-center gap-1">
                  <Lock size={10} /> View Only Mode
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500">Track Opportunities from lead to closed won/lost</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Category Dropdown Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <Filter size={14} className="text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                const cat = e.target.value as ProductCategory;
                setSelectedCategory(cat);
                localStorage.setItem("lastViewedPipelineStage", cat);
                setSearchParams({ category: cat });
              }}
              className="text-sm font-semibold text-slate-700 bg-transparent border-none outline-none pr-6 cursor-pointer"
            >
              <option value="PIPES">Pipes Pipeline</option>
              <option value="WIRES">Wires Pipeline</option>
              <option value="SWITCHES">Switches Pipeline</option>
              <option value="LIGHTS">Lights Pipeline</option>
              <option value="FANS">Fans Pipeline</option>
              <option value="OTHERS">Others Pipeline</option>
            </select>
          </div>

          <Input
            placeholder="Search customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 bg-slate-50 border-slate-200 focus:bg-white text-sm"
          />
        </div>
      </div>

      {/* Board Columns container */}
      <div className="flex-1 overflow-x-auto flex gap-4 pb-4">
        {COLUMNS.map((col) => (
          <PipelineColumn
            key={col.status}
            category={selectedCategory}
            status={col.status}
            title={col.title}
            colorClass={col.colorClass}
            count={counts?.[col.status]}
            search={search}
            isEditable={isEditable}
            onDragStartOpp={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            formatDate={formatDate}
            isOverdue={isOverdue}
            getSalesmanName={getSalesmanName}
          />
        ))}
      </div>

      {/* Won/Lost Follow-up Dialog Modal */}
      <Dialog open={isWonLostFollowUpOpen} onOpenChange={setIsWonLostFollowUpOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${targetWonLostStatus === "WON" ? "text-green-600" : "text-red-600"}`}>
              {targetWonLostStatus === "WON" ? "🎉 Project Won! Set Follow-up" : "❌ Project Lost! Set Follow-up"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2.5 flex flex-col gap-4">
            <p className="text-sm text-slate-500">
              {targetWonLostStatus === "WON" 
                ? "Congratulations on winning! Please schedule a mandatory follow-up action to proceed."
                : "Please specify why this project was lost and schedule a mandatory follow-up action."}
            </p>

            {targetWonLostStatus === "LOST" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Lost Reason *</label>
                <Input
                  placeholder="Lost Reason (e.g. Price too high)..."
                  value={wonLostReasonInput}
                  onChange={(e) => setWonLostReasonInput(e.target.value)}
                  className="w-full"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Follow-up Date *</label>
              <Input
                type="date"
                value={wonLostDateInput}
                onChange={(e) => setWonLostDateInput(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Follow-up Title</label>
              <Input
                placeholder="Follow-up Title..."
                value={wonLostTitleInput}
                onChange={(e) => setWonLostTitleInput(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Description</label>
              <textarea
                placeholder="Add notes for this follow-up..."
                value={wonLostDescInput}
                onChange={(e) => setWonLostDescInput(e.target.value)}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[80px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Priority</label>
              <select
                value={wonLostPriorityInput}
                onChange={(e) => setWonLostPriorityInput(e.target.value as any)}
                className="w-full text-sm rounded-md border border-input bg-transparent px-3 py-2 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Next Phase *</label>
              <select
                value={wonLostNextPhaseInput}
                onChange={(e) => setWonLostNextPhaseInput(e.target.value)}
                className="w-full text-sm rounded-md border border-input bg-transparent px-3 py-2 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select Next Phase...</option>
                <option value="PIPES">Pipes</option>
                <option value="WIRING">Wiring</option>
                <option value="SWITCHES">Switches</option>
                <option value="LIGHTS">Lights</option>
                <option value="FANS">Fans</option>
                <option value="OTHERS">Others</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsWonLostFollowUpOpen(false);
                setTargetWonLostOppId(null);
                setTargetWonLostStatus(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleWonLostFollowUpConfirm}
              disabled={!wonLostDateInput || !wonLostNextPhaseInput || (targetWonLostStatus === "LOST" && !wonLostReasonInput.trim())}
              className={targetWonLostStatus === "WON" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
            >
              Save & Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Follow-up Date Dialog Modal */}
      <Dialog open={isFollowUpOpen} onOpenChange={setIsFollowUpOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-pink-600">
              <Calendar size={18} /> Set Follow-up Date
            </DialogTitle>
          </DialogHeader>

          <div className="py-2.5">
            <p className="text-sm text-slate-500 mb-3">
              Set the next follow-up date for this opportunity as it moves into negotiation.
            </p>
            <Input
              type="date"
              value={followUpDateInput}
              onChange={(e) => setFollowUpDateInput(e.target.value)}
              className="w-full"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsFollowUpOpen(false);
                setFollowUpDateInput("");
                setTargetNegotiationOppId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFollowUpConfirm}
              disabled={!followUpDateInput}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
