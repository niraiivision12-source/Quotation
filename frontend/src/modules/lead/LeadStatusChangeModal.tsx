import React, { useState, useEffect, startTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { toast } from "sonner";
import { useUpdateLead } from "./lead.query";
import type { Lead, LeadStatus } from "./lead.types";

interface LeadStatusChangeModalProps {
  lead: Lead | null;
  targetStatus: LeadStatus | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LeadStatusChangeModal({
  lead,
  targetStatus,
  onClose,
  onSuccess,
}: LeadStatusChangeModalProps) {
  const updateMutation = useUpdateLead();
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  useEffect(() => {
    if (lead) {
      startTransition(() => {
        setNotes("");
        setFollowUpDate("");
        setReason("");
        setCustomReason("");
      });
    }
  }, [lead, targetStatus]);

  if (!lead || !targetStatus) return null;

  // Block direct status changes to QUOTATION_SENT
  if (targetStatus === "QUOTATION_SENT") {
    return (
      <Dialog open={true} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Action Blocked</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">
              Cannot change status to <strong>Quotation Sent</strong> directly. Please create a quotation for this lead using the <strong>Quotation</strong> tab/page instead.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const isNotesRequired = ["CONTACTED", "NEGOTIATION", "LOST"].includes(targetStatus);
  const isNotesOptional = ["NOT_RESPONDING", "WON"].includes(targetStatus);
  const isNotesVisible = isNotesRequired || isNotesOptional;

  const isFollowUpRequired = ["CONTACTED", "NOT_RESPONDING", "NEGOTIATION", "LOST"].includes(targetStatus);

  const isNegotiationReasonVisible = targetStatus === "NEGOTIATION";
  const isLostReasonVisible = targetStatus === "LOST";

  const negotiationReasons = [
    "Price",
    "Approval Pending",
    "Technical",
    "Budget",
    "Decision Pending",
    "Other",
  ];

  const lostReasons = [
    "Price",
    "Competitor",
    "Cancelled",
    "Budget",
    "No Response",
    "Other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isNotesRequired && !notes.trim()) {
      toast.error("Notes are required for this status change");
      return;
    }

    if (isFollowUpRequired && !followUpDate) {
      toast.error("Follow-up Date & Time are required for this status change");
      return;
    }

    let finalReason = reason;
    if (isNegotiationReasonVisible) {
      if (!reason) {
        toast.error("Negotiation reason is required");
        return;
      }
      if (reason === "Other") {
        if (!customReason.trim()) {
          toast.error("Please enter a custom reason");
          return;
        }
        finalReason = customReason;
      }
    }

    if (isLostReasonVisible) {
      if (!reason) {
        toast.error("Lost reason is required");
        return;
      }
      finalReason = reason;
    }

    try {
      await updateMutation.mutateAsync({
        id: lead.id,
        data: {
          status: targetStatus,
          notes: notes.trim() || null,
          followUpDate: followUpDate ? new Date(followUpDate).toISOString() : null,
          reason: finalReason || undefined,
        },
      });
      toast.success(`Lead status updated to ${targetStatus.replace(/_/g, " ")}`);
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  return (
    <Dialog open={true} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Update Status to {targetStatus.replace(/_/g, " ")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Notes */}
            {isNotesVisible && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Notes {isNotesRequired && <span className="text-red-500">*</span>}
                </label>
                <Textarea
                  placeholder="Enter notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            )}

            {/* Follow-up Date & Time */}
            {isFollowUpRequired && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Follow-up Date & Time <span className="text-red-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={followUpDate}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>
            )}

            {/* Negotiation Reason */}
            {isNegotiationReasonVisible && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Negotiation Reason <span className="text-red-500">*</span>
                  </label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {negotiationReasons.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {reason === "Other" && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Custom Reason <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Enter custom negotiation reason..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Lost Reason */}
            {isLostReasonVisible && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Lost Reason <span className="text-red-500">*</span>
                </label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {lostReasons.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
