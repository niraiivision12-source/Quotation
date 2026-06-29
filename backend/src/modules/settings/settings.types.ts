import { UserRole } from "@prisma/client";

export interface CompanySettings {
  companyName: string;
  companyLogo?: string | null;
  companyGst: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  bankName: string;
  bankAccountNo: string;
  bankIfsc: string;
  bankBranch: string;
  upiId: string;
  termsAndConditions: string;
  authorizedSignature?: string | null;
  footerText: string;
}

export interface LeadAssignmentSettings {
  leadAssignmentMethod: "MANUAL" | "PERCENTAGE" | "ROUND_ROBIN";
  leadSalesmanPercentages: Record<string, number>;
  lastLeadAssignedUserId?: string | null;
}

export interface ProjectAssignmentSettings {
  projectAssignmentMethod: "MANUAL" | "PERCENTAGE" | "PHASE_BASED";
  projectSalesmanPercentages: Record<string, number>;
  projectPhaseAssignment: Record<string, string>; // maps phase name to salesman user ID
}

export interface QuotationSettings {
  quoteValidityDays: number;
  quoteDefaultNotes: string;
  quoteDefaultDiscount: number;
  quoteCurrencySymbol: string;
  quoteNumberFormat: string;
  quoteTaxDisplay: string;
  quotePdfHeaderFooter: Record<string, unknown>;
}

export interface NotificationSettings {
  notificationReminderTime: string;
  notificationReminderPriority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  notificationBrowserEnabled: boolean;
  notificationEmailEnabled: boolean;
}

export interface GeneralSettings {
  generalTimezone: string;
  generalDateFormat: string;
  generalTheme: "light" | "dark" | "system";
  generalDefaultDashboard: string;
}

export interface RolePermissionSettings {
  rolePermissions: Record<string, UserRole[]>;
}

export interface ProductPricingSettings {
  pricingDefaultMargin: number;
  pricingAllowMarginOverride: boolean;
  pricingMinMargin: number;
  pricingMaxDiscount: number;
}

export interface PaymentSettings {
  paymentAssignmentMethod: "MANUAL" | "PERCENTAGE";
  paymentAssignmentPercentages: Record<string, number>;
  paymentDefaultCreditDays: number;
  paymentDefaultReminderSchedule: number[];
  paymentReminderFrequency: "DAILY" | "WEEKLY";
  paymentOverdueGracePeriod: number;
  paymentDefaultMethods: string[];
}

export interface SystemSettingsDTO
  extends CompanySettings,
    LeadAssignmentSettings,
    ProjectAssignmentSettings,
    QuotationSettings,
    NotificationSettings,
    GeneralSettings,
    RolePermissionSettings,
    ProductPricingSettings,
    PaymentSettings {}
