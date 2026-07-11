import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { useUpdateCustomer } from "../customer.query";
import { toast } from "sonner";
import { Phone, Mail, ShieldAlert, Save, Edit2 } from "lucide-react";

interface Props {
  customer: any;
}

export default function CustomerOverview({ customer }: Props) {
  const updateMutation = useUpdateCustomer();
  const [isEditing, setIsEditing] = useState(false);

  const [creditAllowed, setCreditAllowed] = useState(customer.creditAllowed);
  const [defaultCreditDays, setDefaultCreditDays] = useState(customer.defaultCreditDays || 0);
  const [maxCreditAmount, setMaxCreditAmount] = useState(Number(customer.maxCreditAmount || 0));

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: customer.id,
        data: {
          creditAllowed,
          defaultCreditDays: Number(defaultCreditDays),
          maxCreditAmount: Number(maxCreditAmount),
        },
      });
      toast.success("Customer credit controls updated");
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update credit controls");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* Contact Details Card */}
      <Card className="border border-gray-100 shadow-none bg-white rounded-2xl md:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-gray-900">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground leading-none mb-0.5">Mobile</p>
              <p className="font-semibold text-gray-900">{customer.mobile}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground leading-none mb-0.5">Email</p>
              <p className="font-semibold text-gray-900">{customer.email || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Control Settings Card */}
      <Card className="border border-gray-100 shadow-none bg-white rounded-2xl md:col-span-2">
        <CardHeader className="pb-3 border-b flex flex-row justify-between items-center">
          <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <ShieldAlert size={16} className="text-violet-600" />
            Credit & Balance Controls
          </CardTitle>
          <Button
            size="sm"
            type="button"
            variant="ghost"
            className="h-7 text-xs font-semibold text-violet-600 hover:bg-violet-50"
            onClick={() => {
              if (isEditing) handleSave();
              else setIsEditing(true);
            }}
            disabled={updateMutation.isPending}
          >
            {isEditing ? (
              <span className="flex items-center gap-1"><Save size={12} /> Save</span>
            ) : (
              <span className="flex items-center gap-1"><Edit2 size={12} /> Edit Settings</span>
            )}
          </Button>
        </CardHeader>
        <CardContent className="pt-4 text-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            {/* Credit Allowed */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="creditAllowed"
                disabled={!isEditing}
                checked={creditAllowed}
                onChange={(e) => {
                  setCreditAllowed(e.target.checked);
                  if (!e.target.checked) {
                    setDefaultCreditDays(0);
                    setMaxCreditAmount(0);
                  }
                }}
                className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              <label htmlFor="creditAllowed" className="font-semibold text-gray-800 cursor-pointer">
                Allow Customer Credit
              </label>
            </div>

            {/* Default Credit Days */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-600 uppercase">Default Credit Days</label>
              <Input
                type="number"
                disabled={!isEditing || !creditAllowed}
                value={defaultCreditDays}
                onChange={(e) => setDefaultCreditDays(Number(e.target.value))}
                className="h-8 text-xs font-semibold"
                placeholder="e.g. 30"
              />
            </div>

            {/* Maximum Credit Amount */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-600 uppercase">Max Credit Amount (₹)</label>
              <Input
                type="number"
                disabled={!isEditing || !creditAllowed}
                value={maxCreditAmount}
                onChange={(e) => setMaxCreditAmount(Number(e.target.value))}
                className="h-8 text-xs font-semibold"
                placeholder="e.g. 50000"
              />
            </div>
          </div>

          {!creditAllowed && (
            <div className="text-[11px] text-muted-foreground bg-slate-50 border p-2.5 rounded-xl">
              Credit is currently <strong className="text-gray-900">disabled</strong> for this customer profile. Pending payments and credit collections cannot be registered.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
