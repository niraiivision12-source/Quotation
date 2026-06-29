import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useUsers } from "../user/user.query";
import { useCreateTask } from "./task.query";

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
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

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "MEDIUM" },
  });

  const submit = async (data: FormData) => {
    await mutation.mutateAsync({
      ...data,
      dueAt: data.dueAt || undefined,
      leadId,
      customerId,
      projectId,
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
              <SelectItem value="CRITICAL">Critical</SelectItem>
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

      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? "Creating..." : "Create Task"}
      </Button>
    </form>
  );
}
