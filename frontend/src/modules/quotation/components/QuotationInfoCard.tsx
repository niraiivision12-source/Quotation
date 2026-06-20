import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

import { getCustomers, getLeads, getProjects } from "../quotation.api";

interface Props {
  quotationType: "LEAD" | "CUSTOMER";

  onQuotationTypeChange: (value: "LEAD" | "CUSTOMER") => void;

  leadId?: string;

  customerId?: string;

  projectId?: string;

  phase?: string;

  validUntil?: string;

  notes?: string;

  onLeadChange: (id: string) => void;

  onCustomerChange: (id: string) => void;

  onProjectChange: (id: string) => void;

  onPhaseChange: (phase: string) => void;

  onValidUntilChange: (value: string) => void;

  onNotesChange: (value: string) => void;
}

export default function QuotationInfoCard({
  quotationType,
  onQuotationTypeChange,

  leadId,
  customerId,
  projectId,

  phase,
  validUntil,
  notes,

  onLeadChange,
  onCustomerChange,
  onProjectChange,

  onPhaseChange,
  onValidUntilChange,
  onNotesChange,
}: Props) {
  const [leadSearch, setLeadSearch] = useState("");

  const [customerSearch, setCustomerSearch] = useState("");

  const [leads, setLeads] = useState<
    { id: string; name: string; mobile: string }[]
  >([]);

  const [customers, setCustomers] = useState<{ id: string; name: string }[]>(
    [],
  );

  const [projects, setProjects] = useState<
    { id: string; projectName: string }[]
  >([]);

  useEffect(() => {
    if (quotationType !== "LEAD") return;

    const timeout = setTimeout(async () => {
      const result = await getLeads(leadSearch);

      setLeads(result.items ?? []);
    }, 300);

    return () => clearTimeout(timeout);
  }, [leadSearch, quotationType]);

  useEffect(() => {
    if (quotationType !== "CUSTOMER") return;

    const timeout = setTimeout(async () => {
      const result = await getCustomers(customerSearch);

      setCustomers(result.items ?? []);
    }, 300);

    return () => clearTimeout(timeout);
  }, [customerSearch, quotationType]);

  useEffect(() => {
    async function loadProjects() {
      if (!customerId) {
        setProjects([]);

        return;
      }

      const result = await getProjects(customerId);

      setProjects(result.items ?? []);
    }

    loadProjects();
  }, [customerId]);

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Quotation Information</h2>

        <p className="text-sm text-muted-foreground">Select lead or customer</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* TYPE */}
        <div>
          <label className="text-sm">Quotation Type</label>

          <select
            value={quotationType}
            className="mt-1 w-full rounded-xl border p-3"
            onChange={(e) =>
              onQuotationTypeChange(e.target.value as "LEAD" | "CUSTOMER")
            }
          >
            <option value="LEAD">Lead Quotation</option>

            <option value="CUSTOMER">Customer Quotation</option>
          </select>
        </div>

        {/* PHASE */}
        <div>
          <label className="text-sm">Phase</label>

          <select
            value={phase ?? ""}
            className="mt-1 w-full rounded-xl border p-3"
            onChange={(e) => onPhaseChange(e.target.value)}
          >
            <option value="">Select Phase</option>

            <option value="PIPES">Pipes</option>

            <option value="WIRING">Wiring</option>

            <option value="SWITCHES">Switches</option>

            <option value="LIGHTS">Lights</option>

            <option value="FANS">Fans</option>
          </select>
        </div>

        {/* LEAD MODE */}
        {quotationType === "LEAD" && (
          <div className="lg:col-span-2">
            <label className="text-sm">Search Lead</label>

            <Input
              value={leadSearch}
              placeholder="Search lead..."
              onChange={(e) => setLeadSearch(e.target.value)}
            />

            {leads.length > 0 && (
              <div className="mt-2 border rounded-xl">
                {leads.map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => onLeadChange(lead.id)}
                    className={`block w-full p-3 text-left hover:bg-muted ${
                      leadId === lead.id ? "bg-muted" : ""
                    }`}
                  >
                    {lead.name}
                    {" - "}
                    {lead.mobile}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CUSTOMER MODE */}
        {quotationType === "CUSTOMER" && (
          <>
            <div>
              <label className="text-sm">Search Customer</label>

              <Input
                value={customerSearch}
                placeholder="Search customer..."
                onChange={(e) => setCustomerSearch(e.target.value)}
              />

              {customers.length > 0 && (
                <div className="mt-2 border rounded-xl">
                  {customers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => onCustomerChange(customer.id)}
                      className={`block w-full p-3 text-left hover:bg-muted ${
                        customerId === customer.id ? "bg-muted" : ""
                      }`}
                    >
                      {customer.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm">Project</label>

              <select
                value={projectId ?? ""}
                className="mt-1 w-full rounded-xl border p-3"
                onChange={(e) => onProjectChange(e.target.value)}
              >
                <option value="">Select Project</option>

                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.projectName}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* VALID UNTIL */}
        <div>
          <label className="text-sm">Valid Until</label>

          <Input
            type="date"
            value={validUntil ?? ""}
            onChange={(e) => onValidUntilChange(e.target.value)}
          />
        </div>

        {/* NOTES */}
        <div>
          <label className="text-sm">Notes</label>

          <textarea
            value={notes ?? ""}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
