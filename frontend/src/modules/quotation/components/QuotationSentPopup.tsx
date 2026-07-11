import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { toast } from "sonner";
import { useUpdateLead } from "../../lead/lead.query";

interface QuotationSentPopupProps {
  leadId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuotationSentPopup({ leadId, isOpen, onClose, onSuccess }: QuotationSentPopupProps) {
  const updateMutation = useUpdateLead();
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!notes.trim()) {
      toast.error("Notes are required when sending a quotation.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: leadId,
        data: {
          status: "QUOTATION_SENT",
          notes: notes.trim(),
          followUpDate: followUpDate ? new Date(followUpDate).toISOString() : null,
        }
      });
      toast.success("Lead status updated to Quotation Sent.");
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to update lead status.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Quotation Created Successfully</DialogTitle>
            <DialogDescription>
              Please provide notes and an optional follow-up to update the lead's status to <strong>Quotation Sent</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Notes <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Enter notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Follow-up Date & Time (Optional)
              </label>
              <Input
                type="datetime-local"
                value={followUpDate}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateMutation.isPending}
            >
              Skip / Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending || !notes.trim()}>
              {updateMutation.isPending ? "Saving..." : "Update Status"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
