import { useState, useRef, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import PageHeader from "../../components/ui/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import CreateDealerDialog from "./CreateDealerDialog";
import DealerForm from "./DealerForm";
import { useDealers, useDeactivateDealer } from "./dealer.query";
import type { Dealer } from "./dealer.types";
import { useFuzzySearch } from "../../hooks/useFuzzySearch";
import { highlightText } from "../../utils/highlight.utils";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { toast } from "sonner";

function DeleteDealerButton({ dealer }: { dealer: Dealer }) {
  const [open, setOpen] = useState(false);
  const deleteMutation = useDeactivateDealer();

  const confirm = async () => {
    try {
      await deleteMutation.mutateAsync(dealer.id);
      toast.success("Dealer deactivated successfully");
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to deactivate dealer");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50" title="Delete/Deactivate">
          <Trash2 size={15} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deactivate Dealer</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to deactivate <strong>{dealer.name}</strong>? They will no longer appear in search results when generating new Purchase Orders.
        </p>
        <div className="flex gap-2 mt-4 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={confirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deactivating..." : "Deactivate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditDealerDialog({ dealer }: { dealer: Dealer }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100" title="Edit Dealer">
          <Edit2 size={15} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Dealer Information</DialogTitle>
        </DialogHeader>
        <DealerForm dealer={dealer} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export default function DealerList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null);

  const { data, isLoading } = useDealers();
  const dealers = data?.items ?? [];

  const { results: visibleDealers, totalPages } = useFuzzySearch({
    items: dealers,
    keys: ["name", "mobile", "email", "address", "gst"],
    searchQuery: search,
    page,
    limit: 20,
  });

  useEffect(() => {
    setFocusedRowIndex(null);
  }, [search, page]);

  useKeyboardShortcuts(
    [
      {
        id: "dealer-focus-search",
        keys: "/",
        description: "Focus search bar",
        category: "Dealer Management",
        action: (e) => {
          e.preventDefault();
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        },
      },
      {
        id: "dealer-prev-page",
        keys: "alt+arrowleft",
        description: "Previous page",
        category: "Dealer Management",
        action: () => {
          if (page > 1) setPage((p) => p - 1);
        },
      },
      {
        id: "dealer-next-page",
        keys: "alt+arrowright",
        description: "Next page",
        category: "Dealer Management",
        action: () => {
          if (page < totalPages) setPage((p) => p + 1);
        },
      },
      {
        id: "dealer-row-down",
        keys: "arrowdown",
        description: "Select next row",
        category: "Dealer Management",
        allowInInputs: true,
        action: (e) => {
          if (visibleDealers.length === 0) return;
          e.preventDefault();
          setFocusedRowIndex((prev) => {
            if (prev === null) return 0;
            return Math.min(prev + 1, visibleDealers.length - 1);
          });
        },
      },
      {
        id: "dealer-row-up",
        keys: "arrowup",
        description: "Select previous row",
        category: "Dealer Management",
        allowInInputs: true,
        action: (e) => {
          if (visibleDealers.length === 0) return;
          e.preventDefault();
          setFocusedRowIndex((prev) => {
            if (prev === null || prev === 0) return null;
            return prev - 1;
          });
        },
      },
    ],
    [visibleDealers, page, totalPages, focusedRowIndex]
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <PageHeader title="Dealers & Suppliers" description="Manage database of vendor entities for purchasing stock." />
        <CreateDealerDialog />
      </div>

      <div className="relative">
        <Input
          ref={searchInputRef}
          placeholder="Search dealers by name, mobile, email, GST..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="h-10 text-sm pl-4"
        />
      </div>

      <div className="rounded-xl border bg-white overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-800">Name</TableHead>
              <TableHead className="font-semibold text-slate-800">Mobile</TableHead>
              <TableHead className="font-semibold text-slate-800">Email</TableHead>
              <TableHead className="font-semibold text-slate-800">GSTIN</TableHead>
              <TableHead className="font-semibold text-slate-800">Address</TableHead>
              <TableHead className="w-[120px] text-right font-semibold text-slate-800">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                  Loading Dealers...
                </TableCell>
              </TableRow>
            ) : visibleDealers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                  No dealers found.
                </TableCell>
              </TableRow>
            ) : (
              visibleDealers.map((dealer, index) => (
                <TableRow
                  key={dealer.id}
                  className={`hover:bg-slate-50/50 transition-colors ${
                    index === focusedRowIndex
                      ? "bg-slate-100/80 hover:bg-slate-100/80 ring-2 ring-indigo-500/10"
                      : ""
                  }`}
                >
                  <TableCell className="font-medium text-slate-900">
                    {highlightText(dealer.name, search)}
                  </TableCell>
                  <TableCell className="text-slate-600 font-mono text-xs">
                    {highlightText(dealer.mobile, search)}
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {dealer.email ? highlightText(dealer.email, search) : "—"}
                  </TableCell>
                  <TableCell className="text-slate-600 font-mono text-xs">
                    {dealer.gst ? highlightText(dealer.gst, search) : "—"}
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm max-w-xs truncate">
                    {dealer.address ? highlightText(dealer.address, search) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <EditDealerDialog dealer={dealer} />
                      <DeleteDealerButton dealer={dealer} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t bg-slate-50/50 px-4 py-3 sm:px-6">
            <div className="text-sm text-muted-foreground">
              Showing page {page} of {totalPages} ({dealers.length} entries)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
