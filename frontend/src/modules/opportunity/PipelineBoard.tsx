import { useState } from "react";
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
import { useNavigate } from "react-router-dom";
import PipelineColumn from "./PipelineColumn";

const COLUMNS: { status: OpportunityStatus; title: string; colorClass: string }[] = [
  { status: "NEW", title: "New", colorClass: "border-t-4 border-t-blue-500 bg-blue-50/10" },
  { status: "QUOTATION_SENT", title: "Quote Sent", colorClass: "border-t-4 border-t-purple-500 bg-purple-50/10" },
  { status: "NEGOTIATION", title: "Negotiation", colorClass: "border-t-4 border-t-pink-500 bg-pink-50/10" },
  { status: "WON", title: "Won 🎉", colorClass: "border-t-4 border-t-green-500 bg-green-50/10" },
  { status: "LOST", title: "Lost ❌", colorClass: "border-t-4 border-t-red-500 bg-red-50/10" },
];

export default function PipelineBoard() {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>("PIPES");
  const [search, setSearch] = useState("");
  const [draggedOpp, setDraggedOpp] = useState<any>(null);
  const [isLostReasonOpen, setIsLostReasonOpen] = useState(false);
  const [lostReasonInput, setLostReasonInput] = useState("");
  const [targetLostOppId, setTargetLostOppId] = useState<string | null>(null);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [followUpDateInput, setFollowUpDateInput] = useState("");
  const [targetNegotiationOppId, setTargetNegotiationOppId] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);

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

    if (targetStatus === "LOST") {
      setTargetLostOppId(id);
      setIsLostReasonOpen(true);
      return;
    }

    if (targetStatus === "NEGOTIATION") {
      setTargetNegotiationOppId(id);
      setFollowUpDateInput(currentOpp.nextFollowUpAt ? currentOpp.nextFollowUpAt.slice(0, 10) : "");
      setIsFollowUpOpen(true);
      return;
    }

    try {
      await updateOppMutation.mutateAsync({
        id,
        data: { status: targetStatus },
      });
      toast.success(`Opportunity status updated to ${targetStatus}`);

      if (targetStatus === "QUOTATION_SENT") {
        navigate(`/quotations?customerId=${currentOpp.customerId}`);
      }
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

  const handleLostConfirm = async () => {
    if (!targetLostOppId) return;

    try {
      await updateOppMutation.mutateAsync({
        id: targetLostOppId,
        data: {
          status: "LOST",
          lostReason: lostReasonInput,
        },
      });
      toast.success("Opportunity marked as LOST");
      setIsLostReasonOpen(false);
      setLostReasonInput("");
      setTargetLostOppId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update opportunity");
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
              onChange={(e) => setSelectedCategory(e.target.value as ProductCategory)}
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

      {/* Lost Reason Dialog Modal */}
      <Dialog open={isLostReasonOpen} onOpenChange={setIsLostReasonOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={18} /> Specify Lost Reason
            </DialogTitle>
          </DialogHeader>

          <div className="py-2.5">
            <p className="text-sm text-slate-500 mb-3">
              Please enter the reason why this opportunity was lost (e.g. price too high, competitor selected, etc.).
            </p>
            <Input
              placeholder="Lost Reason..."
              value={lostReasonInput}
              onChange={(e) => setLostReasonInput(e.target.value)}
              className="w-full"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsLostReasonOpen(false);
                setLostReasonInput("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLostConfirm}
              disabled={!lostReasonInput.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Mark Lost
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
