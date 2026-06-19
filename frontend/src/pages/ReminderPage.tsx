import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ReminderList from "@/modules/reminder/ReminderList";
import ReminderForm from "@/modules/reminder/ReminderForm";

export default function ReminderPage() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader title="Reminders" />

      <div className="mb-6">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create Reminder</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Reminder</DialogTitle>
            </DialogHeader>
            <ReminderForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <ReminderList />
    </div>
  );
}
