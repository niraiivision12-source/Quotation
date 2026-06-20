interface User {
  id: string;
  name: string;
  role: string;
}

interface Props {
  billingUserId: string;

  users: User[];

  isSaving: boolean;

  onBillingUserChange: (userId: string) => void;

  onSave: () => void;

  onReset: () => void;
}

export default function QuotationActions({
  billingUserId,
  users,
  isSaving,
  onBillingUserChange,
  onSave,
  onReset,
}: Props) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      {/* HEADER */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Actions</h2>

        <p className="text-sm text-muted-foreground">
          Select quotation owner and create quotation
        </p>
      </div>

      {/* BILLING USER */}
      <div className="mb-6 space-y-2">
        <label className="text-sm font-medium">Quotation Owner</label>

        <select
          value={billingUserId}
          className="w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-black"
          onChange={(e) => onBillingUserChange(e.target.value)}
        >
          <option value="">Select User</option>

          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.role})
            </option>
          ))}
        </select>
      </div>

      {/* ACTIONS */}
      <div className="space-y-3">
        <button
          type="button"
          disabled={isSaving}
          onClick={onSave}
          className="h-12 w-full rounded-xl bg-black font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Creating..." : "Create Quotation"}
        </button>

        <button
          type="button"
          onClick={onReset}
          className="h-12 w-full rounded-xl border border-red-200 font-medium text-red-500 transition hover:bg-red-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
