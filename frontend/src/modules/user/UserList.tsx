import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import PageHeader from "@/components/ui/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDeleteUser, useUpdateUser, useUsers } from "./user.query";
import type { User } from "./user.types";
import UserForm from "./UserForm";

const editSchema = z.object({
  name: z.string().min(2),

  role: z.enum(["OWNER", "SALESMAN", "ATTENDANT", "ACCOUNTANT"]),

  isActive: z.boolean(),
});

function EditUserDialog({ user }: { user: User }) {
  const [open, setOpen] = useState(false);

  const mutation = useUpdateUser();

  const form = useForm({
    resolver: zodResolver(editSchema),

    defaultValues: {
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    },
  });

  const submit = async (data: z.infer<typeof editSchema>) => {
    await mutation.mutateAsync({
      id: user.id,
      data,
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
          <Input placeholder="Name" {...form.register("name")} />

          <Select
            defaultValue={user.role}
            onValueChange={(value) =>
              form.setValue(
                "role",
                value as z.infer<typeof editSchema>["role"],
                { shouldValidate: true },
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="OWNER">Owner</SelectItem>
              <SelectItem value="SALESMAN">Salesman</SelectItem>
              <SelectItem value="ATTENDANT">Attendant</SelectItem>
              <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2">
            <input type="checkbox" {...form.register("isActive")} />
            Active User
          </label>

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserButton({ user }: { user: { id: string; name: string } }) {
  const [open, setOpen] = useState(false);
  const deleteMutation = useDeleteUser();

  const confirm = async () => {
    await deleteMutation.mutateAsync(user.id);
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
          <DialogTitle>Delete User</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to deactivate
          <strong>{user.name}</strong>?
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

export default function UserList() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useUsers(page);

  return (
    <div>
      <PageHeader title="Users" />

      <div className="mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
            </DialogHeader>
            <UserForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={6}>Loading...</TableCell>
            </TableRow>
          )}

          {!isLoading && data?.items.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>No users found.</TableCell>
            </TableRow>
          )}

          {data?.items.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>

              <TableCell>{user.isActive ? "Active" : "Inactive"}</TableCell>

              <TableCell>
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <EditUserDialog user={user} />

                  <DeleteUserButton user={user} />
                </div>
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
