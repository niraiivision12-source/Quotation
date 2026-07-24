import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

import { useUsers } from "../user/user.query";
import { useCreateTask } from "./task.query";
import { useLeads } from "../lead/lead.query";
import { useCustomers } from "../customer/customer.query";
import { useProjects } from "../project/project.query";
import { usePayments } from "../payment/payment.query";

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  dueAt: z.string().optional(),
  assignedToId: z.string().min(1, "Assign to someone"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSuccess?: () => void;
  leadId?: string;
  customerId?: string;
  projectId?: string;
}

export default function TaskForm({ onSuccess, leadId, customerId, projectId }: Props) {
  const mutation = useCreateTask();
  const { data: usersData } = useUsers(1);

  const [linkType, setLinkType] = useState<"none" | "lead" | "customer" | "project" | "payment">("none");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");

  const { data: leadsData } = useLeads(1, "");
  const { data: customersData } = useCustomers(1, "");
  const { data: projectsData } = useProjects(1, "");
  const { data: paymentsData } = usePayments({ page: 1, limit: 100 });

  const showSelectors = !leadId && !customerId && !projectId;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "MEDIUM" },
  });

  const submit = async (data: FormData) => {
    await mutation.mutateAsync({
      ...data,
      dueAt: data.dueAt || undefined,
      leadId: leadId || (linkType === "lead" ? selectedEntityId : undefined),
      customerId: customerId || (linkType === "customer" ? selectedEntityId : undefined),
      projectId: projectId || (linkType === "project" ? selectedEntityId : undefined),
      paymentId: linkType === "payment" ? selectedEntityId : undefined,
    });
    form.reset({ priority: "MEDIUM" });
    onSuccess?.();
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <div>
        <Input placeholder="Task title *" {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-xs text-red-500 mt-1">{form.formState.errors.title.message}</p>
        )}
      </div>

      <Input placeholder="Description (optional)" {...form.register("description")} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Priority</label>
          <Select
            defaultValue="MEDIUM"
            onValueChange={(v) => form.setValue("priority", v as FormData["priority"])}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Due Date</label>
          <Input type="datetime-local" className="mt-1" {...form.register("dueAt")} />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Assign To *</label>
        <Select onValueChange={(v) => form.setValue("assignedToId", v)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select user" />
          </SelectTrigger>
          <SelectContent>
            {usersData?.items.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.assignedToId && (
          <p className="text-xs text-red-500 mt-1">{form.formState.errors.assignedToId.message}</p>
        )}
      </div>

      {showSelectors && (
        <div className="grid grid-cols-2 gap-3 border-t pt-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Link To Entity</label>
            <Select
              value={linkType}
              onValueChange={(v) => {
                setLinkType(v as any);
                setSelectedEntityId("");
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {linkType !== "none" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Select {linkType}</label>
              <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={`Select ${linkType}`} />
                </SelectTrigger>
                <SelectContent>
                  {linkType === "lead" &&
                    leadsData?.items.map((l: any) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  {linkType === "customer" &&
                    customersData?.items.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  {linkType === "project" &&
                    projectsData?.items.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.projectName}
                      </SelectItem>
                    ))}
                  {linkType === "payment" &&
                    (paymentsData?.data?.items || paymentsData?.items || []).map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.billNumber} / {p.project?.projectName || "—"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? "Creating..." : "Create Task"}
      </Button>
    </form>
  );
}
