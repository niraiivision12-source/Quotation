import { useForm } from "react-hook-form";

import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../components/ui/input";

import { Button } from "../../components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useCustomerOptions } from "../customer/customer.query";
import { useCreateProject } from "./project.query";

export interface CustomerOption {
  id: string;
  name: string;
}

const schema = z.object({
  customerId: z.string().min(1),

  projectName: z.string().min(2),

  location: z.string().optional(),
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

  const customers = useCustomerOptions();

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <Select onValueChange={(value) => form.setValue("customerId", value)}>
        <SelectTrigger>
          <SelectValue placeholder="Select Customer" />
        </SelectTrigger>

        <SelectContent>
          {customers.data?.map((customer) => (
            <SelectItem key={customer.id} value={customer.id}>
              {customer.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input placeholder="Project Name" {...form.register("projectName")} />

      <Input placeholder="Location" {...form.register("location")} />

      <Button type="submit">Create Project</Button>
    </form>
  );
}
