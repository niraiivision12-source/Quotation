import { Pencil, Plus, Save, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createCustomer,
  getCustomerById,
  updateCustomer,
} from "@/modules/customer/customer.api";
import { createLead, getLeadById, updateLead } from "@/modules/lead/lead.api";

import { getCustomers, getLeads, getProjects } from "../quotation.api";

interface Props {
  quotationType: "LEAD" | "CUSTOMER" | "WALK_IN_CUSTOMER";
  onQuotationTypeChange: (
    value: "LEAD" | "CUSTOMER" | "WALK_IN_CUSTOMER",
  ) => void;
  leadId?: string;
  customerId?: string;
  projectId?: string;
  phase?: string;
  validUntil?: string;
  notes?: string;
  walkInName?: string;
  walkInMobile?: string;
  walkInEmail?: string;
  walkInAddress?: string;
  onLeadChange: (id: string) => void;
  onCustomerChange: (id: string) => void;
  onProjectChange: (id: string) => void;
  onPhaseChange: (phase: string) => void;
  onValidUntilChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onWalkInNameChange: (value: string) => void;
  onWalkInMobileChange: (value: string) => void;
  onWalkInEmailChange: (value: string) => void;
  onWalkInAddressChange: (value: string) => void;
  onPreviewDetailsChange?: (details: {
    targetName?: string;
    projectName?: string;
  }) => void;
}

type LeadOption = {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  city?: string | null;
  source?: string | null;
  notes?: string | null;
};

type CustomerOption = {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  address?: string | null;
};

type DetailForm = {
  name: string;
  mobile: string;
  email: string;
  city: string;
  source: string;
  address: string;
  notes: string;
};

const emptyDetailForm: DetailForm = {
  name: "",
  mobile: "",
  email: "",
  city: "",
  source: "",
  address: "",
  notes: "",
};

function unwrapData<T>(response: T | { data: T }): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as { data: T }).data;
  }

  return response as T;
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
  walkInName = "",
  walkInMobile = "",
  walkInEmail = "",
  walkInAddress = "",
  onLeadChange,
  onCustomerChange,
  onProjectChange,
  onPhaseChange,
  onValidUntilChange,
  onNotesChange,
  onWalkInNameChange,
  onWalkInMobileChange,
  onWalkInEmailChange,
  onWalkInAddressChange,
  onPreviewDetailsChange,
}: Props) {
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  const [search, setSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [projects, setProjects] = useState<
    { id: string; projectName: string; currentPhase: string }[]
  >([]);

  const [selectedLead, setSelectedLead] = useState<LeadOption | null>(null);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerOption | null>(null);
  const [detailForm, setDetailForm] = useState<DetailForm>(emptyDetailForm);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isEditingPhase, setIsEditingPhase] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<DetailForm>(emptyDetailForm);
  const [isCreating, setIsCreating] = useState(false);

  const activeOptions = useMemo(() => {
    return quotationType === "LEAD" ? leads : customers;
  }, [customers, leads, quotationType]);

  const selectedTarget =
    quotationType === "LEAD" ? selectedLead : selectedCustomer;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!searchWrapRef.current?.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isDropdownOpen) return;

    const timeout = setTimeout(async () => {
      try {
        if (quotationType === "LEAD") {
          const result = await getLeads(search);
          setLeads(result.items ?? []);
          return;
        }

        const result = await getCustomers(search);
        setCustomers(result.items ?? []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load search results");
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [isDropdownOpen, quotationType, search]);

  useEffect(() => {
    async function loadLeadDetails() {
      if (!leadId) {
        setSearch("");
        setSelectedLead(null);
        setDetailForm(emptyDetailForm);
        return;
      }

      try {
        const lead = await getLeadById(leadId);

        setSelectedLead(lead);

        if (quotationType === "LEAD") {
          setSearch(lead.name);
          onPreviewDetailsChange?.({
            targetName: lead.name,
          });
          setDetailForm({
            ...emptyDetailForm,
            name: lead.name ?? "",
            mobile: lead.mobile ?? "",
            email: lead.email ?? "",
            city: lead.city ?? "",
            source: lead.source ?? "",
            notes: lead.notes ?? "",
          });
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load lead details");
      }
    }

    loadLeadDetails();
  }, [leadId, onPreviewDetailsChange, quotationType]);

  useEffect(() => {
    async function loadCustomerDetails() {
      if (!customerId) {
        setSearch("");
        setSelectedCustomer(null);
        setProjects([]);
        setDetailForm(emptyDetailForm);
        return;
      }

      try {
        const customer = await getCustomerById(customerId);

        setSelectedCustomer(customer);

        if (quotationType === "CUSTOMER") {
          setSearch(customer.name);
          onPreviewDetailsChange?.({
            targetName: customer.name,
          });
          setDetailForm({
            ...emptyDetailForm,
            name: customer.name ?? "",
            mobile: customer.mobile ?? "",
            email: customer.email ?? "",
            address: customer.address ?? "",
          });
        }

        const result = await getProjects(customerId);
        setProjects(result.items ?? []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load customer details");
      }
    }

    loadCustomerDetails();
  }, [customerId, onPreviewDetailsChange, quotationType]);

  useEffect(() => {
    if (quotationType !== "CUSTOMER") return;

    const project = projects.find((item) => item.id === projectId);

    if (!project && !projectId) {
      onPreviewDetailsChange?.({
        targetName: selectedCustomer?.name,
        projectName: undefined,
      });
      return;
    }

    if (project) {
      onPreviewDetailsChange?.({
        targetName: selectedCustomer?.name,
        projectName: project.projectName,
      });
    }
  }, [
    onPreviewDetailsChange,
    projectId,
    projects,
    quotationType,
    selectedCustomer?.name,
  ]);

  function updateDetailField(field: keyof DetailForm, value: string) {
    setDetailForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateCreateField(field: keyof DetailForm, value: string) {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleTargetSelect(target: LeadOption | CustomerOption) {
    setIsDropdownOpen(false);
    setSearch(target.name);
    setIsEditingDetails(false);

    if (quotationType === "LEAD") {
      onLeadChange(target.id);
      onPreviewDetailsChange?.({
        targetName: target.name,
        projectName: undefined,
      });
      return;
    }

    onCustomerChange(target.id);
    onPreviewDetailsChange?.({
      targetName: target.name,
      projectName: undefined,
    });
  }

  async function handleSaveDetails() {
    if (!selectedTarget) return;

    setIsSavingDetails(true);

    try {
      if (quotationType === "LEAD") {
        const updated = unwrapData<LeadOption>(
          await updateLead(selectedTarget.id, {
            name: detailForm.name,
            mobile: detailForm.mobile,
            email: detailForm.email || null,
            city: detailForm.city || null,
            source: detailForm.source || null,
            notes: detailForm.notes || null,
          }),
        );

        setSelectedLead((prev) => ({ ...prev, ...updated }));
        setSearch(updated.name ?? detailForm.name);
      } else {
        const updated = unwrapData<CustomerOption>(
          await updateCustomer(selectedTarget.id, {
            name: detailForm.name,
            mobile: detailForm.mobile,
            email: detailForm.email || null,
            address: detailForm.address || null,
          }),
        );

        setSelectedCustomer((prev) => ({ ...prev, ...updated }));
        setSearch(updated.name ?? detailForm.name);
      }

      setIsEditingDetails(false);
      toast.success(`${quotationType === "LEAD" ? "Lead" : "Customer"} saved`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save details");
    } finally {
      setIsSavingDetails(false);
    }
  }

  async function handleCreateTarget() {
    setIsCreating(true);

    try {
      if (quotationType === "LEAD") {
        const created = unwrapData<LeadOption>(
          await createLead({
            name: createForm.name,
            mobile: createForm.mobile,
            email: createForm.email || undefined,
            city: createForm.city || undefined,
            source: createForm.source || undefined,
            notes: createForm.notes || undefined,
          }),
        );

        onLeadChange(created.id);
        setSelectedLead(created);
        setSearch(created.name);
        onPreviewDetailsChange?.({
          targetName: created.name,
          projectName: undefined,
        });
      } else {
        const created = unwrapData<CustomerOption>(
          await createCustomer({
            name: createForm.name,
            mobile: createForm.mobile,
            email: createForm.email || undefined,
            address: createForm.address || undefined,
          }),
        );

        onCustomerChange(created.id);
        setSelectedCustomer(created);
        setSearch(created.name);
        onPreviewDetailsChange?.({
          targetName: created.name,
          projectName: undefined,
        });
      }

      setCreateForm(emptyDetailForm);
      setIsCreateOpen(false);
      toast.success(`${quotationType === "LEAD" ? "Lead" : "Customer"} added`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to add record");
    } finally {
      setIsCreating(false);
    }
  }

  function handleTypeChange(value: "LEAD" | "CUSTOMER" | "WALK_IN_CUSTOMER") {
    setSearch("");
    setIsDropdownOpen(false);
    setIsEditingDetails(false);
    setIsEditingPhase(false);
    setCreateForm(emptyDetailForm);
    onPreviewDetailsChange?.({});
    onQuotationTypeChange(value);
  }

  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Quotation Information</h2>
          <p className="text-sm text-muted-foreground">
            Select and manage the quotation contact
          </p>
        </div>

        {quotationType !== "WALK_IN_CUSTOMER" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus size={14} className="mr-1" />
            Add {quotationType === "LEAD" ? "Lead" : "Customer"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <div>
          <label className="text-sm font-medium">Quotation Type</label>
          <Select value={quotationType} onValueChange={(v) => handleTypeChange(v as "LEAD" | "CUSTOMER" | "WALK_IN_CUSTOMER")}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LEAD">Lead Quotation</SelectItem>
              <SelectItem value="CUSTOMER">Customer Quotation</SelectItem>
              <SelectItem value="WALK_IN_CUSTOMER">Walk-in Customer Quotation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Phase</label>
          <Select value={phase ?? ""} onValueChange={(v) => onPhaseChange(v)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select Phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PIPES">Pipes</SelectItem>
              <SelectItem value="WIRING">Wiring</SelectItem>
              <SelectItem value="SWITCHES">Switches</SelectItem>
              <SelectItem value="LIGHTS">Lights</SelectItem>
              <SelectItem value="FANS">Fans</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {quotationType !== "WALK_IN_CUSTOMER" && (
          <div
            ref={searchWrapRef}
            className="relative lg:col-span-2 2xl:col-span-1"
          >
            <label className="text-sm font-medium">
              Search {quotationType === "LEAD" ? "Lead" : "Customer"}
            </label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                className="pl-9"
                placeholder={`Search ${quotationType === "LEAD" ? "lead" : "customer"}...`}
                onClick={() => setIsDropdownOpen(true)}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setIsDropdownOpen(true);
                }}
              />
            </div>

            {isDropdownOpen && (
              <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
                {activeOptions.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    No {quotationType === "LEAD" ? "leads" : "customers"} found
                  </div>
                ) : (
                  activeOptions.map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      className={`block w-full px-4 py-3 text-left hover:bg-muted ${
                        selectedTarget?.id === target.id ? "bg-muted" : ""
                      }`}
                      onClick={() => handleTargetSelect(target)}
                    >
                      <span className="block text-sm font-medium">
                        {target.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {target.mobile}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}


        {quotationType === "WALK_IN_CUSTOMER" && (
          <>
            <div>
              <label className="text-sm font-medium">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={walkInName}
                className="mt-1"
                placeholder="Enter customer name"
                onChange={(e) => {
                  onWalkInNameChange(e.target.value);
                  onPreviewDetailsChange?.({
                    targetName: e.target.value,
                  });
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <Input
                value={walkInMobile}
                className="mt-1"
                placeholder="Enter mobile number"
                onChange={(e) => onWalkInMobileChange(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                value={walkInEmail}
                className="mt-1"
                placeholder="Enter email address"
                onChange={(e) => onWalkInEmailChange(e.target.value)}
              />
            </div>

            <div className="lg:col-span-2 2xl:col-span-3">
              <label className="text-sm font-medium">Address</label>
              <Textarea
                value={walkInAddress}
                className="mt-1 min-h-14 bg-white"
                placeholder="Enter address"
                onChange={(e) => onWalkInAddressChange(e.target.value)}
              />
            </div>
          </>
        )}

        {selectedTarget && (
          <div className="rounded-xl border bg-slate-50 p-4 lg:col-span-2 2xl:col-span-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">
                  {quotationType === "LEAD" ? "Lead" : "Customer"} Details
                </h3>
                <p className="text-xs text-muted-foreground">
                  Updates here are saved to the database
                </p>
              </div>

              {isEditingDetails ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveDetails}
                  disabled={isSavingDetails}
                >
                  <Save />
                  {isSavingDetails ? "Saving" : "Save"}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingDetails(true)}
                >
                  <Pencil />
                  Edit
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <DetailField
                label="Name"
                value={detailForm.name}
                disabled={!isEditingDetails}
                onChange={(value) => updateDetailField("name", value)}
              />
              <DetailField
                label="Mobile"
                value={detailForm.mobile}
                disabled={!isEditingDetails}
                onChange={(value) => updateDetailField("mobile", value)}
              />
              <DetailField
                label="Email"
                type="email"
                value={detailForm.email}
                disabled={!isEditingDetails}
                onChange={(value) => updateDetailField("email", value)}
              />
              {quotationType === "LEAD" ? (
                <>
                  <DetailField
                    label="City"
                    value={detailForm.city}
                    disabled={!isEditingDetails}
                    onChange={(value) => updateDetailField("city", value)}
                  />
                  <DetailField
                    label="Source"
                    value={detailForm.source}
                    disabled={!isEditingDetails}
                    onChange={(value) => updateDetailField("source", value)}
                  />
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Notes
                    </label>
                    <Textarea
                      value={detailForm.notes}
                      disabled={!isEditingDetails}
                      className="mt-1 min-h-14 bg-white disabled:opacity-100"
                      onChange={(e) =>
                        updateDetailField("notes", e.target.value)
                      }
                    />
                  </div>
                </>
              ) : (
                <div className="md:col-span-3">
                  <label className="text-xs font-medium text-muted-foreground">
                    Address
                  </label>
                  <Textarea
                    value={detailForm.address}
                    disabled={!isEditingDetails}
                    className="mt-1 min-h-14 bg-white disabled:opacity-100"
                    onChange={(e) =>
                      updateDetailField("address", e.target.value)
                    }
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {quotationType === "CUSTOMER" && (
          <div>
            <label className="text-sm font-medium">Project</label>
            <Select
              value={projectId ?? ""}
              onValueChange={(v) => {
                const selectedProject = projects.find((p) => p.id === v);
                onProjectChange(v);
                if (selectedProject) {
                  onPhaseChange(selectedProject.currentPhase);
                } else {
                  onPhaseChange("");
                }
                setIsEditingPhase(false);
                onPreviewDetailsChange?.({
                  targetName: selectedCustomer?.name,
                  projectName: selectedProject?.projectName,
                });
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.projectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {quotationType === "CUSTOMER" && projectId && (
          <div className="rounded-lg border bg-slate-50 p-3 lg:col-span-2 2xl:col-span-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Project Phase</h3>
                <p className="text-xs text-muted-foreground">
                  The phase of the selected project for this quotation
                </p>
              </div>

              {isEditingPhase ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsEditingPhase(false)}
                >
                  Save
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingPhase(true)}
                >
                  <Pencil size={13} className="mr-1" />
                  Edit
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <div className="md:col-span-1">
                <label className="text-xs font-medium text-muted-foreground">Phase</label>
                {isEditingPhase ? (
                  <select
                    value={phase ?? ""}
                    className="mt-1 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black"
                    onChange={(e) => onPhaseChange(e.target.value)}
                  >
                    <option value="">Select Phase</option>
                    <option value="PIPES">Pipes</option>
                    <option value="WIRING">Wiring</option>
                    <option value="SWITCHES">Switches</option>
                    <option value="LIGHTS">Lights</option>
                    <option value="FANS">Fans</option>
                  </select>
                ) : (
                  <Input
                    value={phase ? phase.charAt(0) + phase.slice(1).toLowerCase() : "Not Selected"}
                    disabled
                    className="mt-1 bg-white disabled:opacity-100 font-medium"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium">Valid Until</label>
          <Input
            type="date"
            className="mt-1"
            value={validUntil ?? ""}
            onChange={(e) => onValidUntilChange(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Quotation Notes {quotationType === "LEAD" && <span className="text-red-500">*</span>}</label>
          <Textarea
            value={notes ?? ""}
            className="mt-1 min-h-14"
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Add {quotationType === "LEAD" ? "Lead" : "Customer"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <DetailField
              label="Name"
              value={createForm.name}
              onChange={(value) => updateCreateField("name", value)}
            />
            <DetailField
              label="Mobile"
              value={createForm.mobile}
              onChange={(value) => updateCreateField("mobile", value)}
            />
            <DetailField
              label="Email"
              type="email"
              value={createForm.email}
              onChange={(value) => updateCreateField("email", value)}
            />
            {quotationType === "LEAD" ? (
              <>
                <DetailField
                  label="City"
                  value={createForm.city}
                  onChange={(value) => updateCreateField("city", value)}
                />
                <DetailField
                  label="Source"
                  value={createForm.source}
                  onChange={(value) => updateCreateField("source", value)}
                />
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Notes
                  </label>
                  <Textarea
                    value={createForm.notes}
                    className="mt-1 min-h-20"
                    onChange={(e) => updateCreateField("notes", e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Address
                </label>
                <Textarea
                  value={createForm.address}
                  className="mt-1 min-h-20"
                  onChange={(e) => updateCreateField("address", e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateTarget}
              disabled={isCreating || !createForm.name || !createForm.mobile}
            >
              <Plus />
              {isCreating ? "Adding" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailField({
  label,
  value,
  type = "text",
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Input
        type={type}
        value={value}
        disabled={disabled}
        className="mt-1 bg-white disabled:opacity-100"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
