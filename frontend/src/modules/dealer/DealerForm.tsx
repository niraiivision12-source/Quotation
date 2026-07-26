import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useCreateDealer, useUpdateDealer } from "./dealer.query";
import { toast } from "sonner";
import type { Dealer } from "./dealer.types";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contactPerson: z.string().optional(),
  mobile: z.string().min(10, "Mobile must be at least 10 digits"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  gst: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  dealer?: Dealer;
  onSuccess?: () => void;
  onDealerCreated?: (dealer: Dealer) => void;
}

export default function DealerForm({ dealer, onSuccess, onDealerCreated }: Props) {
  const createMutation = useCreateDealer();
  const updateMutation = useUpdateDealer();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: dealer?.name || "",
      contactPerson: dealer?.contactPerson || "",
      mobile: dealer?.mobile || "",
      email: dealer?.email || "",
      address: dealer?.address || "",
      city: dealer?.city || "",
      state: dealer?.state || "",
      gst: dealer?.gst || "",
    },
  });

  const submit = async (data: FormData) => {
    try {
      const payload = {
        name: data.name,
        contactPerson: data.contactPerson || undefined,
        mobile: data.mobile,
        email: data.email || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        gst: data.gst || undefined,
      };

      if (dealer) {
        await updateMutation.mutateAsync({ id: dealer.id, data: payload });
        toast.success("Dealer updated successfully");
      } else {
        const result = await createMutation.mutateAsync(payload);
        toast.success("Dealer created successfully");
        onDealerCreated?.(result);
      }
      form.reset();
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Something went wrong");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700">Dealer Name *</label>
        <Input placeholder="E.g., Legrand Supplier" className="mt-1" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-xs text-rose-500 mt-1">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Contact Person</label>
        <Input placeholder="E.g., John Doe" className="mt-1" {...form.register("contactPerson")} />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Mobile / Phone Number *</label>
        <Input placeholder="Mobile (10+ digits)" className="mt-1" {...form.register("mobile")} />
        {form.formState.errors.mobile && (
          <p className="text-xs text-rose-500 mt-1">{form.formState.errors.mobile.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Email Address</label>
        <Input placeholder="dealer@example.com" type="email" className="mt-1" {...form.register("email")} />
        {form.formState.errors.email && (
          <p className="text-xs text-rose-500 mt-1">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">GST Number</label>
        <Input placeholder="GSTIN (optional)" className="mt-1" {...form.register("gst")} />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Office / Warehouse Address</label>
        <Input placeholder="Full business address" className="mt-1" {...form.register("address")} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700">City / District</label>
          <Input placeholder="Kottayam" className="mt-1" {...form.register("city")} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">State / Region</label>
          <Input placeholder="Kerala" className="mt-1" {...form.register("state")} />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving..." : dealer ? "Update Dealer" : "Create Dealer"}
      </Button>
    </form>
  );
}
