import { useForm } from "react-hook-form";

import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { useCreateLead } from "./lead.query";

const schema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(10),
  email: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  contactOwner: z.string().optional(),
  city: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function LeadForm({ onSuccess }: { onSuccess?: () => void }) {
  const mutation = useCreateLead();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const submit = async (data: FormData) => {
    await mutation.mutateAsync(data);
    form.reset();
    onSuccess?.();
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <Input placeholder="Name *" {...form.register("name")} />
      <Input placeholder="Mobile *" {...form.register("mobile")} />
      <Input placeholder="Email" {...form.register("email")} />
      <Input placeholder="City" {...form.register("city")} />
      <Input placeholder="Source (e.g. Facebook)" {...form.register("source")} />
      <Input placeholder="Contact Owner" {...form.register("contactOwner")} />
      <Input placeholder="Notes" {...form.register("notes")} />
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Creating..." : "Create Lead"}
      </Button>
    </form>
  );
}
