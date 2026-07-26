import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import DealerForm from "./DealerForm";
import type { Dealer } from "./dealer.types";

interface Props {
  trigger?: React.ReactNode;
  onDealerCreated?: (dealer: Dealer) => void;
}

export default function CreateDealerDialog({ trigger, onDealerCreated }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-1.5">
            <Plus size={16} /> Create Dealer
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Dealer / Supplier</DialogTitle>
        </DialogHeader>

        <DealerForm
          onSuccess={() => setOpen(false)}
          onDealerCreated={onDealerCreated}
        />
      </DialogContent>
    </Dialog>
  );
}
