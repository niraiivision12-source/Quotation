import { useState } from "react";
import { toast } from "sonner";

import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { useUpdateLead } from "../lead.query";
import type { Lead, LeadStatus } from "../lead.types";

const ALLOWED_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ["CONTACTED", "NOT_RESPONDING"],
  CONTACTED: ["NOT_RESPONDING", "QUOTATION_SENT"],
  NOT_RESPONDING: ["CONTACTED", "QUOTATION_SENT", "LOST"],
  QUOTATION_SENT: ["NEGOTIATION", "WON", "LOST"],
  NEGOTIATION: ["WON", "LOST"],
  WON: [],
  LOST: ["NOT_RESPONDING"],
};

const LOST_REASONS = ["price", "competitor", "cancelled", "budget", "no response", "other"];

interface Props {
  lead: Lead;
  open: boolean;
  onClose: () => void;
}

export default function LeadStatusDialog({ lead, open, onClose }: Props) {
  const [targetStatus, setTargetStatus] = useState<LeadStatus | "">("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [reason, setReason] = useState("");

  const updateMutation = useUpdateLead();

  const options = ALLOWED_TRANSITIONS[lead.status] || [];

  const needsNotes = ["CONTACTED", "QUOTATION_SENT", "NEGOTIATION", "LOST"].includes(targetStatus);
  const needsFollowUp = ["CONTACTED", "NOT_RESPONDING", "NEGOTIATION"].includes(targetStatus);
  const needsReason = ["NEGOTIATION", "LOST"].includes(targetStatus);
  const reasonIsRestricted = targetStatus === "LOST";

  const reset = () => {
    setTargetStatus("");
    setNotes("");
    setFollowUpDate("");
    setReason("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!targetStatus) return;
    if (needsNotes && !notes.trim()) {
      toast.error("Notes are required for this status change");
      return;
    }
    if (needsFollowUp && !followUpDate) {
      toast.error("A follow-up date & time is required for this status change");
      return;
    }
    if (needsReason && !reason.trim()) {
      toast.error("A reason is required for this status change");
      return;
    }
    if (reasonIsRestricted && !LOST_REASONS.includes(reason.toLowerCase())) {
      toast.error("Please choose a valid lost reason");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: lead.id,
        data: {
          status: targetStatus,
          notes: notes.trim() || undefined,
          followUpDate: followUpDate ? new Date(followUpDate).toISOString() : undefined,
          reason: reason.trim() || undefined,
        },
      });
      toast.success(`Lead status changed to ${targetStatus.replace(/_/g, " ")}`);
      handleClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update lead status");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Change Lead Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Status</label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as LeadStatus)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white shadow-sm focus:border-blue-600"
            >
              <option value="" disabled>
                Select a status...
              </option>
              {options.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            {options.length === 0 && (
              <p className="text-xs text-slate-400">This lead is in a final state and cannot be moved further.</p>
            )}
          </div>

          {targetStatus && needsReason && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Reason {reasonIsRestricted ? "*" : "(required)"}
              </label>
              {reasonIsRestricted ? (
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white shadow-sm focus:border-blue-600"
                >
                  <option value="" disabled>
                    Select a reason...
                  </option>
                  {LOST_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r.replace(/^\w/, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  placeholder="e.g. Negotiating on price"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              )}
            </div>
          )}

          {targetStatus && needsNotes && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes *</label>
              <Textarea
                rows={3}
                placeholder="What happened / what was discussed..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}

          {targetStatus && needsFollowUp && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Follow-up Date & Time *</label>
              <Input
                type="datetime-local"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!targetStatus || updateMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {updateMutation.isPending ? "Saving..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
