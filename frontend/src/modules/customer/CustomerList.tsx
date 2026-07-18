import { useState, useRef, useEffect } from "react";

import { Button } from "../../components/ui/button";
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
import { Link, useNavigate } from "react-router-dom";
import CreateCustomerDialog from "./CreateCustomerDialog";
import { useAllCustomers, useDeleteCustomer } from "./customer.query";
import type { Customer } from "./customer.types";
import { useFuzzySearch } from "../../hooks/useFuzzySearch";
import { highlightText } from "../../utils/highlight.utils";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

function DeleteCustomerButton({ customer }: { customer: Customer }) {
  const [open, setOpen] = useState(false);
  const deleteMutation = useDeleteCustomer();

  const confirm = async () => {
    await deleteMutation.mutateAsync(customer.id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Customer</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <strong>{customer.name}</strong>? This
          will also deactivate all their projects.
        </p>
        <div className="flex gap-2 mt-4">
          <Button
            variant="destructive"
            onClick={confirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CustomerList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null);

  const { data, isLoading } = useAllCustomers();
  const customers = data?.items ?? [];

  const { results: visibleCustomers, totalPages } = useFuzzySearch({
    items: customers,
    keys: ["name", "mobile", "email", "address"],
    searchQuery: search,
    page,
    limit: 20,
    customRankFn: (customer, q) => {
      const qLower = q.toLowerCase();
      const name = customer.name.toLowerCase();
      const mobile = (customer.mobile || "").toLowerCase();
      const email = (customer.email || "").toLowerCase();
      const address = (customer.address || "").toLowerCase();

      if (mobile === qLower) return 1;
      if (name === qLower) return 2;
      if (name.startsWith(qLower)) return 3;
      if (name.includes(qLower)) return 4;
      if (email.includes(qLower) || address.includes(qLower)) return 5;
      return 6;
    }
  });

  useEffect(() => {
    setFocusedRowIndex(null);
  }, [search, page]);

  useKeyboardShortcuts(
    [
      {
        id: "cust-focus-search",
        keys: "/",
        description: "Focus search bar",
        category: "Customer Management",
        action: (e) => {
          e.preventDefault();
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        },
      },
      {
        id: "cust-prev-page",
        keys: "alt+arrowleft",
        description: "Previous page",
        category: "Customer Management",
        action: () => {
          if (page > 1) setPage((p) => p - 1);
        },
      },
      {
        id: "cust-next-page",
        keys: "alt+arrowright",
        description: "Next page",
        category: "Customer Management",
        action: () => {
          if (page < totalPages) setPage((p) => p + 1);
        },
      },
      {
        id: "cust-row-down",
        keys: "arrowdown",
        description: "Select next row",
        category: "Customer Management",
        allowInInputs: true,
        action: (e) => {
          if (visibleCustomers.length === 0) return;
          e.preventDefault();
          setFocusedRowIndex((prev) => {
            if (prev === null) return 0;
            return Math.min(prev + 1, visibleCustomers.length - 1);
          });
        },
      },
      {
        id: "cust-row-up",
        keys: "arrowup",
        description: "Select previous row",
        category: "Customer Management",
        allowInInputs: true,
        action: (e) => {
          if (visibleCustomers.length === 0) return;
          e.preventDefault();
          setFocusedRowIndex((prev) => {
            if (prev === null || prev === 0) return null;
            return prev - 1;
          });
        },
      },
      {
        id: "cust-row-enter",
        keys: "enter",
        description: "Open customer details",
        category: "Customer Management",
        allowInInputs: true,
        action: (e) => {
          if (focusedRowIndex !== null && visibleCustomers[focusedRowIndex]) {
            e.preventDefault();
            navigate(`/customers/${visibleCustomers[focusedRowIndex].id}`);
          }
        },
      },
    ],
    [visibleCustomers, page, totalPages, focusedRowIndex, navigate]
  );

  return (
    <div>
      <PageHeader title="Customers" />

      <div className="mb-4">
        <CreateCustomerDialog />
      </div>

      <div className="mb-4">
        <Input
          ref={searchInputRef}
          placeholder="Search customer"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Mobile</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={5}>Loading...</TableCell>
            </TableRow>
          )}

          {!isLoading && visibleCustomers.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>No customers found.</TableCell>
            </TableRow>
          )}

          {visibleCustomers.map((customer, index) => (
            <TableRow 
              key={customer.id}
              className={
                index === focusedRowIndex
                  ? "bg-slate-100/80 hover:bg-slate-100/80 ring-2 ring-indigo-500/10"
                  : ""
              }
            >
              <TableCell>
                <Link to={`/customers/${customer.id}`} className="text-blue-600 hover:underline">
                  {highlightText(customer.name, search)}
                </Link>
              </TableCell>

              <TableCell>{highlightText(customer.mobile, search)}</TableCell>

              <TableCell>{customer.email ? highlightText(customer.email, search) : "-"}</TableCell>

              <TableCell>{customer.address ? highlightText(customer.address, search) : "-"}</TableCell>
              <TableCell>
                <DeleteCustomerButton customer={customer} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex gap-2 mt-4">
        <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </Button>
        <Button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
