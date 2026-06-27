import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
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
import { useUpdateTask } from "./task.query";
import type { Task } from "./task.types";

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  dueAt: z.string().optional(),
  assignedToId: z.string().min(1, "Assign to someone"),
});

type FormData = z.infer<typeof schema>;

export default function EditTaskForm({ task, onSuccess }: { task: Task; onSuccess?: () => void }) {
  const mutation = useUpdateTask();
  const { data: usersData } = useUsers(1);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task.title,
      description: task.description ?? "",
      priority: task.priority,
      status: task.status,
      dueAt: task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : "",
      assignedToId: task.assignedTo.id,
    },
  });

  useEffect(() => {
    form.reset({
      title: task.title,
      description: task.description ?? "",
      priority: task.priority,
      status: task.status,
      dueAt: task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : "",
      assignedToId: task.assignedTo.id,
    });
  }, [task]);

  const submit = async (data: FormData) => {
    await mutation.mutateAsync({
      id: task.id,
      data: {
        ...data,
        description: data.description || undefined,
        dueAt: data.dueAt || undefined,
      },
    });
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
            defaultValue={task.priority}
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
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select
            defaultValue={task.status}
            onValueChange={(v) => form.setValue("status", v as FormData["status"])}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Due Date</label>
        <Input type="datetime-local" className="mt-1" {...form.register("dueAt")} />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Assigned To *</label>
        <Select
          defaultValue={task.assignedTo.id}
          onValueChange={(v) => form.setValue("assignedToId", v)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {usersData?.items.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={mutation.isPending} className="flex-1">
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
