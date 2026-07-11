import { useState } from "react";

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
import { Link } from "react-router-dom";
import CreateCustomerDialog from "./CreateCustomerDialog";
import { useCustomers, useDeleteCustomer } from "./customer.query";
import type { Customer } from "./customer.types";

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

  const { data, isLoading } = useCustomers(page, search);

  return (
    <div>
      <PageHeader title="Customers" />

      <div className="mb-4">
        <CreateCustomerDialog />
      </div>

      <div className="mb-4">
        <Input
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

          {!isLoading && data?.items.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>No customers found.</TableCell>
            </TableRow>
          )}

          {data?.items.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>
                <Link to={`/customers/${customer.id}`}>{customer.name}</Link>
              </TableCell>

              <TableCell>{customer.mobile}</TableCell>

              <TableCell>{customer.email ?? "-"}</TableCell>

              <TableCell>{customer.address ?? "-"}</TableCell>
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
          disabled={!data || page * 20 >= data.total}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
