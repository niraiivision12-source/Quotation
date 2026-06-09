import { useForm } from "react-hook-form";

import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { useCreateProject } from "./project.query";

const schema = z.object({
  customerId: z.string().min(1),

  projectName: z.string().min(2),

  location: z.string().optional(),

  estimatedBudget: z.number().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProjectForm() {
  const mutation = useCreateProject();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const submit = async (data: FormData) => {
    await mutation.mutateAsync(data);

    form.reset();
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <Input placeholder="Customer ID" {...form.register("customerId")} />

      <Input placeholder="Project Name" {...form.register("projectName")} />

      <Input placeholder="Location" {...form.register("location")} />

      <Input
        placeholder="Estimated Budget"
        type="number"
        {...form.register("estimatedBudget", {
          valueAsNumber: true,
        })}
      />

      <Button type="submit">Create Project</Button>
    </form>
  );
}
