import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Briefcase,
  ScrollText,
  Bell,
  Sliders,
  ShieldCheck,
  DollarSign,
  Download,
  Info,
  Lock,
  CreditCard,
} from "lucide-react";
import { api } from "../../lib/axios";
import { useAuthStore } from "../../store/auth.store";
import { Button } from "../../components/ui/button";

interface User {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
}

export default function SettingsPageMain() {
  const currentUser = useAuthStore((state) => state.user);
  const isOwner = currentUser?.role === "OWNER";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("company");
  const [salesmen, setSalesmen] = useState<User[]>([]);

  // Settings State
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyGst, setCompanyGst] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [upiId, setUpiId] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [authorizedSignature, setAuthorizedSignature] = useState<string | null>(null);
  const [footerText, setFooterText] = useState("");

  const [leadAssignmentMethod, setLeadAssignmentMethod] = useState<"MANUAL" | "PERCENTAGE" | "ROUND_ROBIN">("MANUAL");
  const [leadSalesmanPercentages, setLeadSalesmanPercentages] = useState<Record<string, number>>({});

  const [projectAssignmentMethod, setProjectAssignmentMethod] = useState<"MANUAL" | "PERCENTAGE" | "PHASE_BASED">("MANUAL");
  const [projectSalesmanPercentages, setProjectSalesmanPercentages] = useState<Record<string, number>>({});
  const [projectPhaseAssignment, setProjectPhaseAssignment] = useState<Record<string, string>>({
    PIPES: "",
    WIRING: "",
    SWITCHES: "",
    LIGHTS: "",
    FANS: "",
    OTHERS: "",
  });

  const [quoteValidityDays, setQuoteValidityDays] = useState(30);
  const [quoteDefaultNotes, setQuoteDefaultNotes] = useState("");
  const [quoteDefaultDiscount, setQuoteDefaultDiscount] = useState(0);
  const [quoteCurrencySymbol, setQuoteCurrencySymbol] = useState("₹");
  const [quoteNumberFormat, setQuoteNumberFormat] = useState("QTN-{YYYY}-{NNN}");
  const [quoteTaxDisplay, setQuoteTaxDisplay] = useState("GST_BREAKUP");
  const [quotePdfHeaderFooter, setQuotePdfHeaderFooter] = useState<Record<string, any>>({});

  const [notificationReminderTime, setNotificationReminderTime] = useState("09:00");
  const [notificationReminderPriority, setNotificationReminderPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [notificationBrowserEnabled, setNotificationBrowserEnabled] = useState(true);
  const [notificationEmailEnabled, setNotificationEmailEnabled] = useState(true);

  const [generalTimezone, setGeneralTimezone] = useState("Asia/Kolkata");
  const [generalDateFormat, setGeneralDateFormat] = useState("DD/MM/YYYY");
  const [generalTheme, setGeneralTheme] = useState<"light" | "dark" | "system">("light");
  const [generalDefaultDashboard, setGeneralDefaultDashboard] = useState("dashboard");

  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});

  const [pricingDefaultMargin, setPricingDefaultMargin] = useState(10);
  const [pricingAllowMarginOverride, setPricingAllowMarginOverride] = useState(true);
  const [pricingMinMargin, setPricingMinMargin] = useState(5);
  const [pricingMaxDiscount, setPricingMaxDiscount] = useState(20);

  // Payment Settings states
  const [paymentAssignmentMethod, setPaymentAssignmentMethod] = useState<"MANUAL" | "PERCENTAGE">("PERCENTAGE");
  const [paymentAssignmentPercentages, setPaymentAssignmentPercentages] = useState<Record<string, number>>({});
  const [paymentDefaultCreditDays, setPaymentDefaultCreditDays] = useState(30);
  const [paymentDefaultReminderSchedule, setPaymentDefaultReminderSchedule] = useState<number[]>([0]);
  const [paymentReminderFrequency, setPaymentReminderFrequency] = useState("DAILY");
  const [paymentOverdueGracePeriod, setPaymentOverdueGracePeriod] = useState(0);
  const [paymentDefaultMethods, setPaymentDefaultMethods] = useState<string[]>(["CASH", "BANK_TRANSFER", "UPI", "CHEQUE"]);
  const [accountants, setAccountants] = useState<User[]>([]);

  // File Upload Helper
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image file size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load settings
        const settingsRes = await api.get("/settings");
        const settings = settingsRes.data.data;

        setCompanyName(settings.companyName || "");
        setCompanyLogo(settings.companyLogo || null);
        setCompanyGst(settings.companyGst || "");
        setCompanyAddress(settings.companyAddress || "");
        setCompanyPhone(settings.companyPhone || "");
        setCompanyEmail(settings.companyEmail || "");
        setCompanyWebsite(settings.companyWebsite || "");
        setBankName(settings.bankName || "");
        setBankAccountNo(settings.bankAccountNo || "");
        setBankIfsc(settings.bankIfsc || "");
        setBankBranch(settings.bankBranch || "");
        setUpiId(settings.upiId || "");
        setTermsAndConditions(settings.termsAndConditions || "");
        setAuthorizedSignature(settings.authorizedSignature || null);
        setFooterText(settings.footerText || "");

        setLeadAssignmentMethod(settings.leadAssignmentMethod || "MANUAL");
        setLeadSalesmanPercentages(settings.leadSalesmanPercentages || {});

        setProjectAssignmentMethod(settings.projectAssignmentMethod || "MANUAL");
        setProjectSalesmanPercentages(settings.projectSalesmanPercentages || {});
        setProjectPhaseAssignment(settings.projectPhaseAssignment || {
          PIPES: "",
          WIRING: "",
          SWITCHES: "",
          LIGHTS: "",
          FANS: "",
          OTHERS: "",
        });

        setQuoteValidityDays(settings.quoteValidityDays ?? 30);
        setQuoteDefaultNotes(settings.quoteDefaultNotes || "");
        setQuoteDefaultDiscount(settings.quoteDefaultDiscount ?? 0);
        setQuoteCurrencySymbol(settings.quoteCurrencySymbol || "₹");
        setQuoteNumberFormat(settings.quoteNumberFormat || "QTN-{YYYY}-{NNN}");
        setQuoteTaxDisplay(settings.quoteTaxDisplay || "GST_BREAKUP");
        setQuotePdfHeaderFooter(settings.quotePdfHeaderFooter || {});

        setNotificationReminderTime(settings.notificationReminderTime || "09:00");
        setNotificationReminderPriority(settings.notificationReminderPriority || "MEDIUM");
        setNotificationBrowserEnabled(settings.notificationBrowserEnabled ?? true);
        setNotificationEmailEnabled(settings.notificationEmailEnabled ?? true);

        setGeneralTimezone(settings.generalTimezone || "Asia/Kolkata");
        setGeneralDateFormat(settings.generalDateFormat || "DD/MM/YYYY");
        setGeneralTheme(settings.generalTheme || "light");
        setGeneralDefaultDashboard(settings.generalDefaultDashboard || "dashboard");

        setRolePermissions(settings.rolePermissions || {});

        setPricingDefaultMargin(settings.pricingDefaultMargin ?? 10);
        setPricingAllowMarginOverride(settings.pricingAllowMarginOverride ?? true);
        setPricingMinMargin(settings.pricingMinMargin ?? 5);
        setPricingMaxDiscount(settings.pricingMaxDiscount ?? 20);

        setPaymentAssignmentMethod(settings.paymentAssignmentMethod || "PERCENTAGE");
        setPaymentAssignmentPercentages(settings.paymentAssignmentPercentages || {});
        setPaymentDefaultCreditDays(settings.paymentDefaultCreditDays ?? 30);
        setPaymentDefaultReminderSchedule(settings.paymentDefaultReminderSchedule || [0]);
        setPaymentReminderFrequency(settings.paymentReminderFrequency || "DAILY");
        setPaymentOverdueGracePeriod(settings.paymentOverdueGracePeriod ?? 0);
        setPaymentDefaultMethods(settings.paymentDefaultMethods || ["CASH", "BANK_TRANSFER", "UPI", "CHEQUE"]);

        // Load active salesmen & accountants
        const usersRes = await api.get("/users");
        const allUsers = usersRes.data.data.items || [];
        const activeSalesmen = allUsers.filter((u: User) => u.role === "SALESMAN" && u.isActive);
        setSalesmen(activeSalesmen);
        const activeAccountants = allUsers.filter((u: User) => u.role === "ACCOUNTANT" && u.isActive);
        setAccountants(activeAccountants);

      } catch (err: any) {
        console.error(err);
        toast.error("Failed to load settings data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async () => {
    if (!isOwner) {
      toast.error("Only the OWNER can modify settings");
      return;
    }

    // Front-end percentage validation
    if (leadAssignmentMethod === "PERCENTAGE") {
      const activeIds = salesmen.map((s) => s.id);
      const activeWeights = activeIds.map((id) => Number(leadSalesmanPercentages[id] || 0));
      const sum = activeWeights.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 100) > 0.01) {
        toast.error(`Lead assignment percentages must equal 100%. Current sum: ${sum}%`);
        return;
      }
    }

    if (projectAssignmentMethod === "PERCENTAGE") {
      const activeIds = salesmen.map((s) => s.id);
      const activeWeights = activeIds.map((id) => Number(projectSalesmanPercentages[id] || 0));
      const sum = activeWeights.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 100) > 0.01) {
        toast.error(`Project assignment percentages must equal 100%. Current sum: ${sum}%`);
        return;
      }
    }

    if (projectAssignmentMethod === "PHASE_BASED") {
      const phases = ["PIPES", "WIRING", "SWITCHES", "LIGHTS", "FANS", "OTHERS"];
      for (const p of phases) {
        if (!projectPhaseAssignment[p]) {
          toast.error(`Please assign a salesman to the project phase: ${p}`);
          return;
        }
      }
    }

    if (paymentAssignmentMethod === "PERCENTAGE") {
      const activeIds = [...salesmen.map((s) => s.id), ...accountants.map((a) => a.id)];
      const activeWeights = activeIds.map((id) => Number(paymentAssignmentPercentages[id] || 0));
      const sum = activeWeights.reduce((a, b) => a + b, 0);
      if (activeWeights.length > 0 && Math.abs(sum - 100) > 0.01) {
        toast.error(`Payment collection assignment percentages must equal 100%. Current sum: ${sum}%`);
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        companyName,
        companyLogo,
        companyGst,
        companyAddress,
        companyPhone,
        companyEmail,
        companyWebsite,
        bankName,
        bankAccountNo,
        bankIfsc,
        bankBranch,
        upiId,
        termsAndConditions,
        authorizedSignature,
        footerText,

        leadAssignmentMethod,
        leadSalesmanPercentages,

        projectAssignmentMethod,
        projectSalesmanPercentages,
        projectPhaseAssignment,

        paymentAssignmentMethod,
        paymentAssignmentPercentages,
        paymentDefaultCreditDays,
        paymentDefaultReminderSchedule,
        paymentReminderFrequency,
        paymentOverdueGracePeriod,
        paymentDefaultMethods,

        quoteValidityDays,
        quoteDefaultNotes,
        quoteDefaultDiscount,
        quoteCurrencySymbol,
        quoteNumberFormat,
        quoteTaxDisplay,
        quotePdfHeaderFooter,

        notificationReminderTime,
        notificationReminderPriority,
        notificationBrowserEnabled,
        notificationEmailEnabled,

        generalTimezone,
        generalDateFormat,
        generalTheme,
        generalDefaultDashboard,

        rolePermissions,

        pricingDefaultMargin,
        pricingAllowMarginOverride,
        pricingMinMargin,
        pricingMaxDiscount,
      };

      await api.put("/settings", payload);
      toast.success("Settings updated successfully");
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || "Failed to update settings";
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get("/settings/export");
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data.data, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "quotation_settings_backup.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Settings exported successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export settings");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await api.post("/settings/import", json);
        toast.success("Settings imported successfully. Please reload the page.");
        window.location.reload();
      } catch (err: any) {
        console.error(err);
        toast.error("Failed to import settings. Ensure file is valid JSON.");
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground animate-pulse">Loading settings...</div>;
  }

  const tabs = [
    { id: "company", label: "Company Settings", icon: <Building2 size={16} /> },
    { id: "lead", label: "Lead Assignment", icon: <Users size={16} /> },
    { id: "project", label: "Project Assignment", icon: <Briefcase size={16} /> },
    { id: "quotation", label: "Quotation Settings", icon: <ScrollText size={16} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
    { id: "general", label: "General", icon: <Sliders size={16} /> },
    { id: "permissions", label: "Permissions", icon: <ShieldCheck size={16} /> },
    { id: "pricing", label: "Pricing & Margins", icon: <DollarSign size={16} /> },
    { id: "payments", label: "Payment Settings", icon: <CreditCard size={16} /> },
    { id: "backup", label: "Backup & Export", icon: <Download size={16} /> },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
      {/* Title */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
          <p className="text-sm text-muted-foreground">Configure company details, assignment workflows, quotation parameters, margins, and roles.</p>
        </div>
        {isOwner && (
          <Button onClick={handleSave} disabled={saving} className="bg-black text-white hover:bg-zinc-800">
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        )}
      </div>

      {/* Warn Non-owners */}
      {!isOwner && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 mb-6">
          <Info size={18} className="shrink-0 text-amber-600" />
          <p className="font-medium">
            You are viewing settings in <strong>Read-Only</strong> mode. Only users with the <strong>OWNER</strong> role can modify system settings.
          </p>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 items-start">
        {/* Navigation Sidebar */}
        <nav className="flex flex-col gap-1 rounded-xl border bg-white p-2 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-zinc-100 text-zinc-950 font-semibold"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Form panel */}
        <div className="rounded-xl border bg-white p-6 shadow-sm min-h-[400px]">
          {/* Tab 1: Company Profile */}
          {activeTab === "company" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold border-b pb-2">Company Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Company Name *</label>
                  <input
                    disabled={!isOwner}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-10 rounded-lg border px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">GST Number *</label>
                  <input
                    disabled={!isOwner}
                    value={companyGst}
                    onChange={(e) => setCompanyGst(e.target.value)}
                    className="h-10 rounded-lg border px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-sm font-medium">Company Address *</label>
                  <textarea
                    disabled={!isOwner}
                    rows={2}
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="rounded-lg border p-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Phone *</label>
                  <input
                    disabled={!isOwner}
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="h-10 rounded-lg border px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Email *</label>
                  <input
                    disabled={!isOwner}
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    className="h-10 rounded-lg border px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Website</label>
                  <input
                    disabled={!isOwner}
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    className="h-10 rounded-lg border px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">UPI ID</label>
                  <input
                    disabled={!isOwner}
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="h-10 rounded-lg border px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                </div>
              </div>

              <h3 className="text-md font-semibold pt-4 border-t">Bank Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Bank Name *</label>
                  <input
                    disabled={!isOwner}
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="h-10 rounded-lg border px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Account Number *</label>
                  <input
                    disabled={!isOwner}
                    value={bankAccountNo}
                    onChange={(e) => setBankAccountNo(e.target.value)}
                    className="h-10 rounded-lg border px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">IFSC Code *</label>
                  <input
                    disabled={!isOwner}
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value)}
                    className="h-10 rounded-lg border px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Branch Name *</label>
                  <input
                    disabled={!isOwner}
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    className="h-10 rounded-lg border px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                </div>
              </div>

              <h3 className="text-md font-semibold pt-4 border-t">Documents & Signatures</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo file */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Company Logo</label>
                  {companyLogo && (
                    <div className="h-28 w-28 border rounded-lg overflow-hidden flex items-center justify-center p-2 bg-zinc-50">
                      <img src={companyLogo} alt="Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                  {isOwner && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setCompanyLogo)}
                      className="text-xs"
                    />
                  )}
                </div>

                {/* Signature file */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Authorized Signature</label>
                  {authorizedSignature && (
                    <div className="h-28 w-28 border rounded-lg overflow-hidden flex items-center justify-center p-2 bg-zinc-50">
                      <img src={authorizedSignature} alt="Signature" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                  {isOwner && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setAuthorizedSignature)}
                      className="text-xs"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Terms & Conditions</label>
                  <textarea
                    disabled={!isOwner}
                    rows={4}
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    className="rounded-lg border p-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Footer Declaration / Text</label>
                  <input
                    disabled={!isOwner}
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    className="h-10 rounded-lg border px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Lead Assignment */}
          {activeTab === "lead" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold border-b pb-2">Lead Assignment Settings</h2>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Assignment Method</label>
                <div className="flex flex-wrap gap-4 mt-1">
                  {["MANUAL", "PERCENTAGE", "ROUND_ROBIN"].map((m) => (
                    <label key={m} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="leadMethod"
                        disabled={!isOwner}
                        checked={leadAssignmentMethod === m}
                        onChange={() => setLeadAssignmentMethod(m as any)}
                        className="h-4 w-4 text-black focus:ring-black border-zinc-300"
                      />
                      <span>
                        {m === "MANUAL" ? "Manual Assignment" : m === "PERCENTAGE" ? "Percentage-Based" : "Round Robin"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {leadAssignmentMethod === "PERCENTAGE" && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <h3 className="text-sm font-semibold">Salesman Percentages</h3>
                    <p className="text-xs text-muted-foreground">Specify what percentage of new leads should be assigned to each active salesman. Must total 100%.</p>
                  </div>
                  {salesmen.length === 0 ? (
                    <p className="text-xs text-rose-500 font-medium">No active salesmen available in the system. Add/Activate users under the Users page.</p>
                  ) : (
                    <div className="space-y-3 max-w-md">
                      {salesmen.map((user) => (
                        <div key={user.id} className="flex items-center gap-3">
                          <span className="text-sm font-medium flex-1 truncate">{user.name}</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              disabled={!isOwner}
                              min={0}
                              max={100}
                              value={leadSalesmanPercentages[user.id] ?? 0}
                              onChange={(e) =>
                                setLeadSalesmanPercentages((prev) => ({
                                  ...prev,
                                  [user.id]: Number(e.target.value),
                                }))
                              }
                              className="w-20 h-9 rounded-lg border px-3 text-right text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                            />
                            <span className="text-sm font-medium text-zinc-500">%</span>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between border-t pt-2 max-w-md font-semibold text-sm">
                        <span>Total Sum</span>
                        <span
                          className={
                            Math.abs(
                              salesmen.map((s) => Number(leadSalesmanPercentages[s.id] || 0)).reduce((a, b) => a + b, 0) - 100
                            ) < 0.01
                              ? "text-green-600"
                              : "text-rose-600"
                          }
                        >
                          {salesmen.map((s) => Number(leadSalesmanPercentages[s.id] || 0)).reduce((a, b) => a + b, 0)}% (Required: 100%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {leadAssignmentMethod === "ROUND_ROBIN" && (
                <div className="border-t pt-4 space-y-2">
                  <h3 className="text-sm font-semibold">Round Robin Order</h3>
                  <p className="text-xs text-muted-foreground">Leads will be assigned sequentially to the following active salesmen:</p>
                  <div className="flex flex-col gap-1.5 rounded-lg border p-3 bg-zinc-50 max-w-md">
                    {salesmen.map((s, index) => (
                      <div key={s.id} className="text-sm flex items-center gap-2">
                        <span className="text-zinc-400 font-mono text-xs">{index + 1}.</span>
                        <span className="font-medium text-zinc-700">{s.name}</span>
                      </div>
                    ))}
                    {salesmen.length === 0 && (
                      <p className="text-xs text-rose-500 font-medium">No active salesmen available in the system.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Project Assignment */}
          {activeTab === "project" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold border-b pb-2">Project Assignment Settings</h2>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Assignment Method</label>
                <div className="flex flex-wrap gap-4 mt-1">
                  {["MANUAL", "PERCENTAGE", "PHASE_BASED"].map((m) => (
                    <label key={m} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="projectMethod"
                        disabled={!isOwner}
                        checked={projectAssignmentMethod === m}
                        onChange={() => setProjectAssignmentMethod(m as any)}
                        className="h-4 w-4 text-black focus:ring-black border-zinc-300"
                      />
                      <span>
                        {m === "MANUAL" ? "Manual Assignment" : m === "PERCENTAGE" ? "Percentage-Based" : "Phase-Based (Specific Salesmen)"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {projectAssignmentMethod === "PERCENTAGE" && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <h3 className="text-sm font-semibold">Salesman Percentages</h3>
                    <p className="text-xs text-muted-foreground">Specify what percentage of new projects should be assigned to each active salesman. Must total 100%.</p>
                  </div>
                  {salesmen.length === 0 ? (
                    <p className="text-xs text-rose-500 font-medium">No active salesmen available. Add/Activate users under the Users page.</p>
                  ) : (
                    <div className="space-y-3 max-w-md">
                      {salesmen.map((user) => (
                        <div key={user.id} className="flex items-center gap-3">
                          <span className="text-sm font-medium flex-1 truncate">{user.name}</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              disabled={!isOwner}
                              min={0}
                              max={100}
                              value={projectSalesmanPercentages[user.id] ?? 0}
                              onChange={(e) =>
                                setProjectSalesmanPercentages((prev) => ({
                                  ...prev,
                                  [user.id]: Number(e.target.value),
                                }))
                              }
                              className="w-20 h-9 rounded-lg border px-3 text-right text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                            />
                            <span className="text-sm font-medium text-zinc-500">%</span>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between border-t pt-2 max-w-md font-semibold text-sm">
                        <span>Total Sum</span>
                        <span
                          className={
                            Math.abs(
                              salesmen.map((s) => Number(projectSalesmanPercentages[s.id] || 0)).reduce((a, b) => a + b, 0) - 100
                            ) < 0.01
                              ? "text-green-600"
                              : "text-rose-600"
                          }
                        >
                          {salesmen.map((s) => Number(projectSalesmanPercentages[s.id] || 0)).reduce((a, b) => a + b, 0)}% (Required: 100%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {projectAssignmentMethod === "PHASE_BASED" && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <h3 className="text-sm font-semibold">Phase Assignments</h3>
                    <p className="text-xs text-muted-foreground">Assign each project phase to a specific salesman. Project trackings are populated using these rules.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                    {["PIPES", "WIRING", "SWITCHES", "LIGHTS", "FANS", "OTHERS"].map((phase) => (
                      <div key={phase} className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">
                          {phase.charAt(0) + phase.slice(1).toLowerCase()} Phase *
                        </label>
                        <select
                          disabled={!isOwner}
                          value={projectPhaseAssignment[phase] || ""}
                          onChange={(e) =>
                            setProjectPhaseAssignment((prev) => ({
                              ...prev,
                              [phase]: e.target.value,
                            }))
                          }
                          className="h-10 rounded-lg border bg-white px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                        >
                          <option value="">Select Salesman</option>
                          {salesmen.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Quotation Settings */}
          {activeTab === "quotation" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold border-b pb-2">Quotation Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Default Validity (Days)</label>
                  <input
                    type="number"
                    disabled={!isOwner}
                    value={quoteValidityDays}
                    onChange={(e) => setQuoteValidityDays(Number(e.target.value))}
                    className="h-10 rounded-lg border px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Default Discount (Amt)</label>
                  <input
                    type="number"
                    disabled={!isOwner}
                    value={quoteDefaultDiscount}
                    onChange={(e) => setQuoteDefaultDiscount(Number(e.target.value))}
                    className="h-10 rounded-lg border px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Currency Symbol</label>
                  <input
                    disabled={!isOwner}
                    value={quoteCurrencySymbol}
                    onChange={(e) => setQuoteCurrencySymbol(e.target.value)}
                    className="h-10 rounded-lg border px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Tax Display Option</label>
                  <select
                    disabled={!isOwner}
                    value={quoteTaxDisplay}
                    onChange={(e) => setQuoteTaxDisplay(e.target.value)}
                    className="h-10 rounded-lg border bg-white px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  >
                    <option value="GST_BREAKUP">GST Breakup (SGST/CGST)</option>
                    <option value="VAT">VAT</option>
                    <option value="NO_TAX">No Tax display (Inclusive)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-sm font-medium">Auto Quotation Numbering Format *</label>
                  <input
                    disabled={!isOwner}
                    value={quoteNumberFormat}
                    onChange={(e) => setQuoteNumberFormat(e.target.value)}
                    className="h-10 rounded-lg border px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    Tokens: <strong>{"{YYYY}"}</strong> (4-digit year), <strong>{"{YY}"}</strong> (2-digit year), <strong>{"{MM}"}</strong> (Month), <strong>{"{DD}"}</strong> (Day), <strong>{"{NNN}"}</strong> (3-digit sequence), <strong>{"{NNNN}"}</strong> (4-digit sequence).
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-sm font-medium">Default Quotation Notes</label>
                  <textarea
                    disabled={!isOwner}
                    rows={3}
                    value={quoteDefaultNotes}
                    onChange={(e) => setQuoteDefaultNotes(e.target.value)}
                    className="rounded-lg border p-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Notification Settings */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold border-b pb-2">Notification Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Default Reminder Time</label>
                  <input
                    type="time"
                    disabled={!isOwner}
                    value={notificationReminderTime}
                    onChange={(e) => setNotificationReminderTime(e.target.value)}
                    className="h-10 rounded-lg border px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Default Reminder Priority</label>
                  <select
                    disabled={!isOwner}
                    value={notificationReminderPriority}
                    onChange={(e) => setNotificationReminderPriority(e.target.value as any)}
                    className="h-10 rounded-lg border bg-white px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <label className="flex items-center gap-3 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isOwner}
                    checked={notificationBrowserEnabled}
                    onChange={(e) => setNotificationBrowserEnabled(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-zinc-300 text-black focus:ring-black"
                  />
                  <span>Enable Browser Push Notifications</span>
                </label>
                <label className="flex items-center gap-3 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isOwner}
                    checked={notificationEmailEnabled}
                    onChange={(e) => setNotificationEmailEnabled(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-zinc-300 text-black focus:ring-black"
                  />
                  <span>Enable Email Reminder Alerts</span>
                </label>
              </div>
            </div>
          )}

          {/* Tab 6: General Settings */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold border-b pb-2">General Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Timezone</label>
                  <select
                    disabled={!isOwner}
                    value={generalTimezone}
                    onChange={(e) => setGeneralTimezone(e.target.value)}
                    className="h-10 rounded-lg border bg-white px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  >
                    <option value="Asia/Kolkata">India (IST) - Asia/Kolkata</option>
                    <option value="UTC">UTC / GMT</option>
                    <option value="America/New_York">US Eastern - America/New_York</option>
                    <option value="Europe/London">London - Europe/London</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Date Format</label>
                  <select
                    disabled={!isOwner}
                    value={generalDateFormat}
                    onChange={(e) => setGeneralDateFormat(e.target.value)}
                    className="h-10 rounded-lg border bg-white px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 28/06/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 06/28/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-06-28)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Theme</label>
                  <select
                    disabled={!isOwner}
                    value={generalTheme}
                    onChange={(e) => setGeneralTheme(e.target.value as any)}
                    className="h-10 rounded-lg border bg-white px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  >
                    <option value="light">Light Theme</option>
                    <option value="dark">Dark Theme</option>
                    <option value="system">Follow System</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Default Dashboard Page</label>
                  <select
                    disabled={!isOwner}
                    value={generalDefaultDashboard}
                    onChange={(e) => setGeneralDefaultDashboard(e.target.value)}
                    className="h-10 rounded-lg border bg-white px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  >
                    <option value="dashboard">Analytical Overview</option>
                    <option value="leads">Leads Pipeline</option>
                    <option value="projects">Pipelines List</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tab 7: Roles & Permissions */}
          {activeTab === "permissions" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold border-b pb-2">Role & Permission Settings</h2>
              
              <p className="text-xs text-muted-foreground">OWNER always has full permission to perform any operation. Grant permissions below to restrict other roles.</p>
              
              <div className="overflow-x-auto border rounded-xl shadow-sm bg-zinc-50/50">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-zinc-100 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                      <th className="p-3">Permission Action</th>
                      <th className="p-3 text-center">Salesman</th>
                      <th className="p-3 text-center">Attendant</th>
                      <th className="p-3 text-center">Accountant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: "createQuotations", label: "Create Quotations" },
                      { id: "editQuotations", label: "Edit/Revise Quotations" },
                      { id: "deleteQuotations", label: "Delete Quotations" },
                      { id: "approveQuotations", label: "Approve Quotations" },
                      { id: "createLeads", label: "Create Leads" },
                      { id: "editProjects", label: "Edit Pipelines" },
                      { id: "manageProducts", label: "Manage Products" },
                      { id: "accessReports", label: "Access Reports" },
                      { id: "accessSettings", label: "Access Settings" },
                      { id: "managePayments", label: "Manage Payments (Link Bill/Record Payment)" },
                      { id: "viewPayments", label: "View Payments & Reminders" },
                    ].map((act) => (
                      <tr key={act.id} className="border-b bg-white hover:bg-zinc-50">
                        <td className="p-3 font-medium text-zinc-900">{act.label}</td>
                        {["SALESMAN", "ATTENDANT", "ACCOUNTANT"].map((role) => {
                          const isChecked = (rolePermissions[act.id] || []).includes(role);
                          return (
                            <td key={role} className="p-3 text-center">
                              <input
                                type="checkbox"
                                disabled={!isOwner}
                                checked={isChecked}
                                onChange={(e) => {
                                  const currentArr = rolePermissions[act.id] || [];
                                  let newArr;
                                  if (e.target.checked) {
                                    newArr = [...currentArr, role];
                                  } else {
                                    newArr = currentArr.filter((r) => r !== role);
                                  }
                                  setRolePermissions((prev) => ({
                                    ...prev,
                                    [act.id]: newArr,
                                  }));
                                }}
                                className="h-4.5 w-4.5 rounded border-zinc-300 text-black focus:ring-black"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 8: Product Pricing Settings */}
          {activeTab === "pricing" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold border-b pb-2">Product Pricing Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Default Margin (%)</label>
                  <input
                    type="number"
                    disabled={!isOwner}
                    value={pricingDefaultMargin}
                    onChange={(e) => setPricingDefaultMargin(Number(e.target.value))}
                    className="h-10 rounded-lg border px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Minimum Allowed Margin (%)</label>
                  <input
                    type="number"
                    disabled={!isOwner}
                    value={pricingMinMargin}
                    onChange={(e) => setPricingMinMargin(Number(e.target.value))}
                    className="h-10 rounded-lg border px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Maximum Allowed Discount (%)</label>
                  <input
                    type="number"
                    disabled={!isOwner}
                    value={pricingMaxDiscount}
                    onChange={(e) => setPricingMaxDiscount(Number(e.target.value))}
                    className="h-10 rounded-lg border px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <label className="flex items-center gap-3 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isOwner}
                    checked={pricingAllowMarginOverride}
                    onChange={(e) => setPricingAllowMarginOverride(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-zinc-300 text-black focus:ring-black"
                  />
                  <span>Allow Salesmen to override default product margins</span>
                </label>
              </div>
            </div>
          )}

          {/* Tab 10: Payment Settings */}
          {activeTab === "payments" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold border-b pb-2">Payment Settings</h2>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Collection Assignment Method</label>
                <div className="flex flex-wrap gap-4 mt-1">
                  {["MANUAL", "PERCENTAGE"].map((m) => (
                    <label key={m} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        disabled={!isOwner}
                        checked={paymentAssignmentMethod === m}
                        onChange={() => setPaymentAssignmentMethod(m as any)}
                        className="h-4 w-4 text-black focus:ring-black border-zinc-300"
                      />
                      <span>
                        {m === "MANUAL" ? "Manual Assignment" : "Percentage-Based"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Default Credit Days</label>
                  <input
                    type="number"
                    disabled={!isOwner}
                    value={paymentDefaultCreditDays}
                    onChange={(e) => setPaymentDefaultCreditDays(Number(e.target.value))}
                    className="w-full h-9 rounded-lg border px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Overdue Grace Period (Days)</label>
                  <input
                    type="number"
                    disabled={!isOwner}
                    value={paymentOverdueGracePeriod}
                    onChange={(e) => setPaymentOverdueGracePeriod(Number(e.target.value))}
                    className="w-full h-9 rounded-lg border px-3 text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Reminder Frequency</label>
                  <select
                    disabled={!isOwner}
                    value={paymentReminderFrequency}
                    onChange={(e) => setPaymentReminderFrequency(e.target.value)}
                    className="w-full h-9 rounded-lg border px-3 text-sm bg-white focus:outline-zinc-800 disabled:bg-zinc-50"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                  </select>
                </div>
              </div>

              {paymentAssignmentMethod === "PERCENTAGE" && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <h3 className="text-sm font-semibold">Collector Percentages</h3>
                    <p className="text-xs text-muted-foreground">Specify what percentage of pending collections should be assigned to each active salesman/accountant. Must total 100%.</p>
                  </div>
                  {[...salesmen, ...accountants].length === 0 ? (
                    <p className="text-xs text-rose-500 font-medium">No active collectors available in the system.</p>
                  ) : (
                    <div className="space-y-3 max-w-md">
                      {[...salesmen, ...accountants].map((user) => (
                        <div key={user.id} className="flex items-center gap-3">
                          <span className="text-sm font-medium flex-1 truncate">{user.name} ({user.role})</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              disabled={!isOwner}
                              min={0}
                              max={100}
                              value={paymentAssignmentPercentages[user.id] ?? 0}
                              onChange={(e) =>
                                setPaymentAssignmentPercentages((prev) => ({
                                  ...prev,
                                  [user.id]: Number(e.target.value),
                                }))
                              }
                              className="w-20 h-9 rounded-lg border px-3 text-right text-sm focus:outline-zinc-800 disabled:bg-zinc-50"
                            />
                            <span className="text-sm font-medium text-zinc-500">%</span>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between border-t pt-2 max-w-md font-semibold text-sm">
                        <span>Total Sum</span>
                        <span
                          className={
                            Math.abs(
                              [...salesmen, ...accountants].map((c) => Number(paymentAssignmentPercentages[c.id] || 0)).reduce((a, b) => a + b, 0) - 100
                            ) < 0.01
                              ? "text-green-600"
                              : "text-rose-600"
                          }
                        >
                          {[...salesmen, ...accountants].map((c) => Number(paymentAssignmentPercentages[c.id] || 0)).reduce((a, b) => a + b, 0)}% (Required: 100%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold">Default Payment Methods</h3>
                <div className="flex flex-wrap gap-4">
                  {["CASH", "BANK_TRANSFER", "UPI", "CHEQUE"].map((m) => {
                    const isChecked = paymentDefaultMethods.includes(m);
                    return (
                      <label key={m} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={!isOwner}
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPaymentDefaultMethods([...paymentDefaultMethods, m]);
                            } else {
                              setPaymentDefaultMethods(paymentDefaultMethods.filter((x) => x !== m));
                            }
                          }}
                          className="h-4 w-4 text-black focus:ring-black border-zinc-300 rounded"
                        />
                        <span>{m.replace(/_/g, " ")}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 9: Backup & Export */}
          {activeTab === "backup" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold border-b pb-2">Backup & Export Settings</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Export Card */}
                <div className="rounded-xl border p-4 space-y-3 flex flex-col justify-between bg-zinc-50">
                  <div>
                    <h3 className="text-sm font-bold">Export Configuration</h3>
                    <p className="text-xs text-muted-foreground mt-1">Download a backup file containing all of your system settings in JSON format.</p>
                  </div>
                  {isOwner ? (
                    <Button onClick={handleExport} variant="outline" className="w-full flex items-center gap-2">
                      <Download size={14} /> Export Settings JSON
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-zinc-500"><Lock size={12}/> OWNER role required</div>
                  )}
                </div>

                {/* Import Card */}
                <div className="rounded-xl border p-4 space-y-3 flex flex-col justify-between bg-zinc-50">
                  <div>
                    <h3 className="text-sm font-bold">Import Configuration</h3>
                    <p className="text-xs text-muted-foreground mt-1">Restore settings from a previously exported JSON backup file.</p>
                  </div>
                  {isOwner ? (
                    <label className="w-full inline-flex items-center justify-center h-10 border border-input rounded-md text-sm font-medium bg-background cursor-pointer hover:bg-accent hover:text-accent-foreground">
                      <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                      Upload & Import Settings
                    </label>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-zinc-500"><Lock size={12}/> OWNER role required</div>
                  )}
                </div>

                {/* Database Backup (Future) */}
                <div className="rounded-xl border p-4 space-y-3 flex flex-col justify-between opacity-60 bg-zinc-50 border-dashed">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold">Database Backup</h3>
                      <span className="text-[10px] bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded-full font-semibold uppercase">Soon</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Download a full backup of the system database including all projects, leads, and quotations.</p>
                  </div>
                  <Button disabled variant="outline" className="w-full">
                    Backup Database
                  </Button>
                </div>

                {/* Database Restore (Future) */}
                <div className="rounded-xl border p-4 space-y-3 flex flex-col justify-between opacity-60 bg-zinc-50 border-dashed">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold">Restore Database</h3>
                      <span className="text-[10px] bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded-full font-semibold uppercase">Soon</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Upload a database backup file to restore leads, projects, and products to a previous state.</p>
                  </div>
                  <Button disabled variant="outline" className="w-full">
                    Restore Database
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
