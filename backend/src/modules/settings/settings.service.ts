import { prisma } from "@/config/prisma";
import { UserRole } from "@prisma/client";
import { SystemSettingsDTO } from "./settings.types";

const DEFAULT_SETTINGS = {
  id: "default",
  companyName: "NKP Construction",
  companyLogo: "",
  companyGst: "27AAAAA0000A1Z5",
  companyAddress: "123 Business Park, Mumbai, India",
  companyPhone: "+91 98765 43210",
  companyEmail: "info@nkpconstruction.com",
  companyWebsite: "www.nkpconstruction.com",
  bankName: "State Bank of India",
  bankAccountNo: "123456789012",
  bankIfsc: "SBIN0001234",
  bankBranch: "Mumbai Main Branch",
  upiId: "nkp@sbi",
  termsAndConditions: "1. Quotation is valid for 30 days.\n2. 50% advance payment required.\n3. Taxes extra as applicable.",
  authorizedSignature: "",
  footerText: "Thank you for doing business with us!",

  leadAssignmentMethod: "MANUAL",
  leadSalesmanPercentages: {},
  lastLeadAssignedUserId: null,

  projectAssignmentMethod: "MANUAL",
  projectSalesmanPercentages: {},
  projectPhaseAssignment: {
    PIPES: "",
    WIRING: "",
    SWITCHES: "",
    LIGHTS: "",
    FANS: "",
    OTHERS: "",
  },

  quoteValidityDays: 30,
  quoteDefaultNotes: "Standard structural design work quotation.",
  quoteDefaultDiscount: 0,
  quoteCurrencySymbol: "₹",
  quoteNumberFormat: "QTN-{YYYY}-{NNN}",
  quoteTaxDisplay: "GST_BREAKUP",
  quotePdfHeaderFooter: {},

  notificationReminderTime: "09:00",
  notificationReminderPriority: "MEDIUM",
  notificationBrowserEnabled: true,
  notificationEmailEnabled: true,

  generalTimezone: "Asia/Kolkata",
  generalDateFormat: "DD/MM/YYYY",
  generalTheme: "light",
  generalDefaultDashboard: "dashboard",

  rolePermissions: {
    createQuotations: [UserRole.OWNER, UserRole.SALESMAN],
    editQuotations: [UserRole.OWNER, UserRole.SALESMAN],
    deleteQuotations: [UserRole.OWNER],
    approveQuotations: [UserRole.OWNER],
    createLeads: [UserRole.OWNER, UserRole.SALESMAN, UserRole.ATTENDANT],
    editProjects: [UserRole.OWNER, UserRole.SALESMAN],
    manageProducts: [UserRole.OWNER],
    accessReports: [UserRole.OWNER, UserRole.ACCOUNTANT],
    accessSettings: [UserRole.OWNER],
  },

  pricingDefaultMargin: 10,
  pricingAllowMarginOverride: true,
  pricingMinMargin: 5,
  pricingMaxDiscount: 20,
};

export class SettingsService {
  static async getSettings() {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: DEFAULT_SETTINGS,
      });
    }

    return settings;
  }

  static async updateSettings(data: Partial<SystemSettingsDTO>) {
    // Ensure settings record exists
    await this.getSettings();

    return prisma.systemSettings.update({
      where: { id: "default" },
      data: {
        ...data,
        // Ensure complex json objects are kept as json
        leadSalesmanPercentages: data.leadSalesmanPercentages ?? undefined,
        projectSalesmanPercentages: data.projectSalesmanPercentages ?? undefined,
        projectPhaseAssignment: data.projectPhaseAssignment ?? undefined,
        quotePdfHeaderFooter: data.quotePdfHeaderFooter ?? undefined,
        rolePermissions: data.rolePermissions ?? undefined,
      },
    });
  }

  static async exportSettings() {
    const settings = await this.getSettings();
    // Return settings excluding system fields
    const { id, createdAt, updatedAt, lastLeadAssignedUserId, ...exportable } = settings;
    return exportable;
  }

  static async importSettings(data: any) {
    // Basic validation of import schema keys
    if (!data.companyName || !data.leadAssignmentMethod || !data.projectAssignmentMethod) {
      throw new Error("Invalid settings import format");
    }

    // Overwrite database default row
    return prisma.systemSettings.upsert({
      where: { id: "default" },
      create: {
        ...DEFAULT_SETTINGS,
        ...data,
        id: "default",
      },
      update: {
        ...data,
      },
    });
  }
}
