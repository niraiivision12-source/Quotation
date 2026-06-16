import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useCreateLead } from "./lead.query";
import { useUsers } from "../user/user.query";

const schema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(10),
  email: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  contactOwnerId: z.string().optional(),
  city: z.string().optional(),
  referralDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function LeadForm({ onSuccess }: { onSuccess?: () => void }) {
  const mutation = useCreateLead();
  const { data: usersData } = useUsers(1);

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      referralDate: today,
    },
  });

  const submit = async (data: FormData) => {
    await mutation.mutateAsync({
      name: data.name,
      mobile: data.mobile,
      email: data.email || undefined,
      city: data.city || undefined,
      source: data.source || undefined,
      notes: data.notes || undefined,
      contactOwnerId: data.contactOwnerId || undefined,
      referralDate: data.referralDate || undefined,
    });
    form.reset({ referralDate: today });
    onSuccess?.();
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <Input placeholder="Name *" {...form.register("name")} />
      <Input placeholder="Mobile *" {...form.register("mobile")} />
      <Input placeholder="Email" {...form.register("email")} />
      <Input placeholder="City" {...form.register("city")} />
      <Input placeholder="Source (e.g. Facebook)" {...form.register("source")} />
      <Select onValueChange={(value) => form.setValue("contactOwnerId", value)}>
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
      <Input placeholder="Notes" {...form.register("notes")} />
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Referral Date</label>
        <Input
          type="date"
          {...form.register("referralDate")}
          defaultValue={today}
        />
      </div>
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Creating..." : "Create Lead"}
      </Button>
    </form>
  );
}
