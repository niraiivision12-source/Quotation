import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateReminder } from "./reminder.query";

const schema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  type: z.enum(["LEAD", "PROJECT", "CUSTOMER", "QUOTATION", "TASK"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  dueAt: z.string().min(1, "Due date is required"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onSuccess: () => void;
}

export default function ReminderForm({ onSuccess }: Props) {
  const mutation = useCreateReminder();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "TASK", priority: "MEDIUM" },
  });

  const submit = async (values: FormValues) => {
    await mutation.mutateAsync({
      ...values,
      dueAt: new Date(values.dueAt).toISOString(),
    });
    form.reset();
    onSuccess();
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <Input placeholder="Title *" {...form.register("title")} />
      {form.formState.errors.title && (
        <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
      )}

      <Input placeholder="Description (optional)" {...form.register("description")} />

      <Select defaultValue="TASK" onValueChange={(v) => form.setValue("type", v as FormValues["type"])}>
        <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent>
          {(["LEAD", "PROJECT", "CUSTOMER", "QUOTATION", "TASK"] as const).map((t) => (
            <SelectItem key={t} value={t}>{t}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select defaultValue="MEDIUM" onValueChange={(v) => form.setValue("priority", v as FormValues["priority"])}>
        <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
        <SelectContent>
          {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((p) => (
            <SelectItem key={p} value={p}>{p}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Due Date & Time *</label>
        <Input type="datetime-local" {...form.register("dueAt")} min={new Date().toISOString().slice(0, 16)} />
        {form.formState.errors.dueAt && (
          <p className="text-xs text-red-500">{form.formState.errors.dueAt.message}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating..." : "Create Reminder"}
        </Button>
      </div>
    </form>
  );
}
