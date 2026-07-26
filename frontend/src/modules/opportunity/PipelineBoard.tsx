import { useState } from "react";
import { useOpportunities, useUpdateOpportunity } from "./opportunity.query";
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
  DollarSign,
  User,
  LayoutGrid,
  Filter,
  Clock,
  Lock,
} from "lucide-react";
import type { OpportunityStatus, ProductCategory } from "./opportunity.types";
import { useAuthStore } from "../../store/auth.store";
import { api } from "../../lib/axios";

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
  const [draggedOppId, setDraggedOppId] = useState<string | null>(null);
  const [isLostReasonOpen, setIsLostReasonOpen] = useState(false);
  const [lostReasonInput, setLostReasonInput] = useState("");
  const [targetLostOppId, setTargetLostOppId] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);

  // Fetch settings on mount
  useState(() => {
    api.get("/settings")
      .then((res) => setSettings(res.data.data))
      .catch((err) => console.error("Failed to load settings in board", err));
  });

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

  // Fetch opportunities
  const { data: oppsData, isLoading } = useOpportunities(1, search, {
    category: selectedCategory,
  });

  const { data: usersData } = useUsers(1);
  const updateOppMutation = useUpdateOpportunity();

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!isEditable) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", id);
    setDraggedOppId(id);
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
    const id = e.dataTransfer.getData("text/plain") || draggedOppId;
    setDraggedOppId(null);
    if (!id) return;

    const currentOpp = oppsData?.items.find((o) => o.id === id);
    if (!currentOpp) return;

    if (currentOpp.status === targetStatus) return;

    if (targetStatus === "LOST") {
      setTargetLostOppId(id);
      setIsLostReasonOpen(true);
      return;
    }

    try {
      await updateOppMutation.mutateAsync({
        id,
        data: { status: targetStatus },
      });
      toast.success(`Opportunity status updated to ${targetStatus}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update opportunity status");
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
        {COLUMNS.map((col) => {
          const colItems = oppsData?.items.filter((item) => item.status === col.status) || [];

          return (
            <div
              key={col.status}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`flex-1 min-w-[250px] max-w-[320px] rounded-xl flex flex-col h-full border border-slate-200/50 bg-slate-50/50 p-3 ${col.colorClass}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="font-bold text-slate-800 text-sm">{col.title}</span>
                <Badge variant="secondary" className="bg-slate-200/60 text-slate-700 font-semibold px-2 py-0.5 text-xs">
                  {colItems.length}
                </Badge>
              </div>

              {/* Column Cards content */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1">
                {isLoading ? (
                  <div className="text-center text-xs text-slate-400 py-6">Loading...</div>
                ) : colItems.length === 0 ? (
                  <div className="text-center text-[11px] text-slate-400 py-8 border border-dashed border-slate-200 rounded-lg bg-white/20">
                    Drag items here
                  </div>
                ) : (
                  colItems.map((opp) => (
                    <div
                      key={opp.id}
                      draggable={isEditable}
                      onDragStart={(e) => handleDragStart(e, opp.id)}
                      className={`bg-white border border-slate-200/60 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col gap-2 relative ${
                        isEditable ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed opacity-90"
                      }`}
                    >
                      {/* Overdue Alert banner */}
                      {isOverdue(opp.nextFollowUpAt) && col.status !== "WON" && col.status !== "LOST" && (
                        <div className="absolute top-2 right-2 text-red-500" title="Overdue Follow-up!">
                          <Clock size={14} className="animate-pulse" />
                        </div>
                      )}

                      <div className="flex flex-col gap-0.5 pr-4">
                        <h4 className="font-bold text-slate-800 text-sm line-clamp-1">
                          {opp.customer?.name || "Unknown Customer"}
                        </h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {opp.category} Opportunity
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <DollarSign size={13} className="text-slate-400" />
                          <span className="font-semibold text-slate-700">
                            {opp.estimatedValue ? `₹${Number(opp.estimatedValue).toLocaleString()}` : "₹0"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Calendar size={13} className="text-slate-400" />
                          <span
                            className={
                              isOverdue(opp.nextFollowUpAt) && col.status !== "WON" && col.status !== "LOST"
                                ? "text-red-500 font-bold"
                                : "text-slate-500"
                            }
                          >
                            {formatDate(opp.nextFollowUpAt)}
                          </span>
                        </div>
                      </div>

                      {/* Salesperson display */}
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                        <User size={11} />
                        <span>Salesman: {getSalesmanName(opp.assignedToId)}</span>
                      </div>

                      {/* Lost Reason if present */}
                      {opp.status === "LOST" && opp.lostReason && (
                        <div className="mt-1 bg-red-50 text-red-700 text-[10px] rounded p-1.5 border border-red-100 italic">
                          Reason: {opp.lostReason}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
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
    </div>
  );
}
