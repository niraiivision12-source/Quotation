import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageHeader from "@/components/ui/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useLeads, useUpdateLead, useConvertLead } from "./lead.query";
import { useUsers } from "../user/user.query";
import LeadForm from "./LeadForm";
import type { Lead } from "./lead.types";

function EditContactOwnerDialog({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(lead.contactOwnerId ?? "");
  const { data: usersData } = useUsers(1);
  const mutation = useUpdateLead();

  const save = async () => {
    await mutation.mutateAsync({ id: lead.id, data: { contactOwnerId: selectedUserId || null } });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Edit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Contact Owner — {lead.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select defaultValue={lead.contactOwnerId ?? ""} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Select Contact Owner" />
            </SelectTrigger>
            <SelectContent>
              {usersData?.items.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={save} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const convertSchema = z.object({
  projectName: z.string().min(2),
  location: z.string().optional(),
  estimatedBudget: z.number().optional(),
});

type ConvertForm = z.infer<typeof convertSchema>;

function ConvertLeadDialog({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);
  const mutation = useConvertLead();

  const form = useForm<ConvertForm>({
    resolver: zodResolver(convertSchema),
  });

  const submit = async (data: ConvertForm) => {
    await mutation.mutateAsync({ id: lead.id, data });
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={lead.status === "WON" || lead.status === "LOST"}>
          Convert
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert Lead — {lead.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
          <Input placeholder="Project Name *" {...form.register("projectName")} />
          <Input placeholder="Location" {...form.register("location")} />
          <Input
            placeholder="Estimated Budget"
            type="number"
            {...form.register("estimatedBudget", { valueAsNumber: true })}
          />
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Converting..." : "Convert to Customer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function LeadList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useLeads(page, search);

  return (
    <div>
      <PageHeader title="Leads" />

      <div className="mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create Lead</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Lead</DialogTitle>
            </DialogHeader>
            <LeadForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search leads..."
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
            <TableHead>City</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Contact Owner</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Referral Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={9}>Loading...</TableCell>
            </TableRow>
          )}

          {!isLoading && data?.items.length === 0 && (
            <TableRow>
              <TableCell colSpan={9}>No leads found.</TableCell>
            </TableRow>
          )}

          {data?.items.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>{lead.name}</TableCell>
              <TableCell>{lead.mobile}</TableCell>
              <TableCell>{lead.city ?? "-"}</TableCell>
              <TableCell>{lead.source ?? "-"}</TableCell>
              <TableCell>{lead.contactOwner?.name ?? "-"}</TableCell>
              <TableCell>{lead.notes ?? "-"}</TableCell>
              <TableCell>
                {lead.referralDate
                  ? new Date(lead.referralDate).toLocaleDateString()
                  : "-"}
              </TableCell>
              <TableCell>{lead.status}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <EditContactOwnerDialog lead={lead} />
                  <ConvertLeadDialog lead={lead} />
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
