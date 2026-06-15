import { useForm } from "react-hook-form";

import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/Button";

import { Input } from "@/components/ui/Input";

import { useCreateCustomer } from "./customer.query";

const schema = z.object({
  name: z.string().min(2),

  mobile: z.string().min(10),

  email: z.string().optional(),

  address: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CustomerForm() {
  const mutation = useCreateCustomer();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const submit = async (data: FormData) => {
    await mutation.mutateAsync(data);

    form.reset();
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <Input placeholder="Name" {...form.register("name")} />

      <Input placeholder="Mobile" {...form.register("mobile")} />

      <Input placeholder="Email" {...form.register("email")} />

      <Input placeholder="Address" {...form.register("address")} />

      <Button type="submit">Create Customer</Button>
    </form>
  );
}
