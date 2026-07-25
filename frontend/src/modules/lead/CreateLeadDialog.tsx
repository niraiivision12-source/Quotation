import { useState } from "react";

import { Button } from "../../components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";

import LeadForm from "./LeadForm";

export default function CreateLeadDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Lead</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Lead</DialogTitle>
        </DialogHeader>

        <LeadForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
