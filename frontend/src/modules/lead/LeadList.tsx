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
} from "@/components/ui/dialog";
import {
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useLeads, useUpdateLead, useConvertLead, useDeleteLead } from "./lead.query";
import { useUsers } from "../user/user.query";
import LeadForm from "./LeadForm";
import type { Lead, LeadStatus } from "./lead.types";

const LEAD_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "QUOTATION_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
];

const convertSchema = z.object({
  projectName: z.string().min(2),
  location: z.string().optional(),
  estimatedBudget: z.number().optional(),
});

type ConvertForm = z.infer<typeof convertSchema>;

function StatusSelect({ lead }: { lead: Lead }) {
  const [convertOpen, setConvertOpen] = useState(false);
  const updateMutation = useUpdateLead();
  const convertMutation = useConvertLead();

  const form = useForm<ConvertForm>({
    resolver: zodResolver(convertSchema),
  });

  const onChange = (status: string) => {
    if (status === "WON") {
      setConvertOpen(true);
    } else {
      updateMutation.mutate({ id: lead.id, data: { status } });
    }
  };

  const submitConvert = async (data: ConvertForm) => {
    await convertMutation.mutateAsync({ id: lead.id, data });
    form.reset();
    setConvertOpen(false);
  };

  const cancelConvert = () => {
    setConvertOpen(false);
  };

  return (
    <>
      <Select
        defaultValue={lead.status}
        onValueChange={onChange}
        disabled={lead.status === "WON" || lead.status === "LOST"}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LEAD_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={convertOpen} onOpenChange={(o) => { if (!o) cancelConvert(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert {lead.name} to Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(submitConvert)} className="space-y-4">
            <Input placeholder="Project Name *" {...form.register("projectName")} />
            <Input placeholder="Location" {...form.register("location")} />
            <Input
              placeholder="Estimated Budget"
              type="number"
              {...form.register("estimatedBudget", { valueAsNumber: true })}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={convertMutation.isPending}>
                {convertMutation.isPending ? "Converting..." : "Confirm WON & Convert"}
              </Button>
              <Button type="button" variant="outline" onClick={cancelConvert}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

const editLeadSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(10),
  email: z.string().optional(),
  city: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  referralDate: z.string().optional(),
  contactOwnerId: z.string().optional(),
});

type EditLeadForm = z.infer<typeof editLeadSchema>;

function EditLeadDialog({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);
  const mutation = useUpdateLead();
  const { data: usersData } = useUsers(1);

  const form = useForm<EditLeadForm>({
    resolver: zodResolver(editLeadSchema),
    defaultValues: {
      name: lead.name,
      mobile: lead.mobile,
      email: lead.email ?? "",
      city: lead.city ?? "",
      source: lead.source ?? "",
      notes: lead.notes ?? "",
      referralDate: lead.referralDate ? new Date(lead.referralDate).toISOString().split("T")[0] : "",
      contactOwnerId: lead.contactOwnerId ?? "",
    },
  });

  const submit = async (data: EditLeadForm) => {
    await mutation.mutateAsync({
      id: lead.id,
      data: { ...data, contactOwnerId: data.contactOwnerId || null },
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Edit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Lead — {lead.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
          <Input placeholder="Name *" {...form.register("name")} />
          <Input placeholder="Mobile *" {...form.register("mobile")} />
          <Input placeholder="Email" {...form.register("email")} />
          <Input placeholder="City" {...form.register("city")} />
          <Input placeholder="Source" {...form.register("source")} />
          <Input placeholder="Notes" {...form.register("notes")} />
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Referral Date</label>
            <Input type="date" {...form.register("referralDate")} />
          </div>
          <Select
            defaultValue={lead.contactOwnerId ?? ""}
            onValueChange={(v) => form.setValue("contactOwnerId", v)}
          >
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
          <div className="flex gap-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteLeadButton({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);
  const deleteMutation = useDeleteLead();

  const confirm = async () => {
    await deleteMutation.mutateAsync(lead.id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">Delete</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Lead</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <strong>{lead.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-2 mt-4">
          <Button variant="destructive" onClick={confirm} disabled={deleteMutation.isPending}>
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
              <TableCell>
                <StatusSelect lead={lead} />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <EditLeadDialog lead={lead} />
                  <DeleteLeadButton lead={lead} />
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
