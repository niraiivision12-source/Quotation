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

import { useCreateUser } from "./user.query";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["OWNER", "SALESMAN", "ATTENDANT", "ACCOUNTANT"]),
});

type FormData = z.infer<typeof schema>;

export default function UserForm({ onSuccess }: { onSuccess?: () => void }) {
  const mutation = useCreateUser();

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
      <Input placeholder="Email *" {...form.register("email")} />
      <Input placeholder="Password *" type="password" {...form.register("password")} />
      <Select onValueChange={(value) => form.setValue("role", value as FormData["role"])}>
        <SelectTrigger>
          <SelectValue placeholder="Select Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="OWNER">Owner</SelectItem>
          <SelectItem value="SALESMAN">Salesman</SelectItem>
          <SelectItem value="ATTENDANT">Attendant</SelectItem>
          <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Creating..." : "Create User"}
      </Button>
    </form>
  );
}
