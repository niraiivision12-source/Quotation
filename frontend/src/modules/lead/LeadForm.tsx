import { useState } from "react";

import { useForm } from "react-hook-form";

import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "../../components/ui/button";

import { Input } from "../../components/ui/input";

import { useCreateLead } from "./lead.query";

import { checkLeadMobile } from "./lead.api";

const schema = z.object({
  name: z.string().min(2),

  mobile: z.string().min(10),

  email: z.email().optional(),

  city: z.string().optional(),

  source: z.string().optional(),

  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function LeadForm({ onSuccess }: { onSuccess?: () => void }) {
  const mutation = useCreateLead();

  const [mobileError, setMobileError] = useState<string | null>(null);

  const [isCheckingMobile, setIsCheckingMobile] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleMobileBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const mobile = e.target.value.trim();

    setMobileError(null);

    if (mobile.length < 10) return;

    setIsCheckingMobile(true);

    try {
      const result = await checkLeadMobile(mobile);

      if (result.exists) {
        setMobileError(result.message || "This mobile number already exists");
      }
    } catch {
      // If the check itself fails, don't block the user — the create call will still validate.
    } finally {
      setIsCheckingMobile(false);
    }
  };

  const submit = async (data: FormData) => {
    if (mobileError) return;

    await mutation.mutateAsync(data);

    form.reset();
    onSuccess?.();
  };

  const { onBlur: mobileFieldOnBlur, ...mobileField } = form.register("mobile");

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <Input placeholder="Name" {...form.register("name")} />

      <div>
        <Input
          placeholder="Mobile"
          {...mobileField}
          onBlur={(e) => {
            mobileFieldOnBlur(e);
            handleMobileBlur(e);
          }}
          onChange={(e) => {
            mobileField.onChange(e);
            setMobileError(null);
          }}
        />
        {isCheckingMobile && <p className="text-xs text-slate-400 mt-1">Checking mobile number...</p>}
        {mobileError && <p className="text-xs text-red-600 mt-1">{mobileError}</p>}
      </div>

      <Input placeholder="Email" {...form.register("email")} />

      <Input placeholder="City" {...form.register("city")} />

      <Input placeholder="Source" {...form.register("source")} />

      <Input placeholder="Notes" {...form.register("notes")} />

      <Button type="submit" disabled={mutation.isPending || !!mobileError}>
        {mutation.isPending ? "Creating..." : "Create Lead"}
      </Button>
    </form>
  );
}
