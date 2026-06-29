import { z } from "zod";
import { UserRole } from "@prisma/client";

export const updateSettingsSchema = z.object({
  // Company Settings
  companyName: z.string().min(1, "Company Name is required"),
  companyLogo: z.string().nullable().optional(),
  companyGst: z.string().min(1, "GST Number is required"),
  companyAddress: z.string().min(1, "Address is required"),
  companyPhone: z.string().min(1, "Phone is required"),
  companyEmail: z.string().email("Invalid email").or(z.string().length(0)),
  companyWebsite: z.string().optional(),
  bankName: z.string().min(1, "Bank Name is required"),
  bankAccountNo: z.string().min(1, "Account Number is required"),
  bankIfsc: z.string().min(1, "IFSC is required"),
  bankBranch: z.string().min(1, "Branch is required"),
  upiId: z.string().optional(),
  termsAndConditions: z.string().optional(),
  authorizedSignature: z.string().nullable().optional(),
  footerText: z.string().optional(),

  // Lead Assignment
  leadAssignmentMethod: z.enum(["MANUAL", "PERCENTAGE", "ROUND_ROBIN"]),
  leadSalesmanPercentages: z.record(z.string(), z.coerce.number()).default({}),
  lastLeadAssignedUserId: z.string().nullable().optional(),

  // Project Assignment
  projectAssignmentMethod: z.enum(["MANUAL", "PERCENTAGE", "PHASE_BASED"]),
  projectSalesmanPercentages: z.record(z.string(), z.coerce.number()).default({}),
  projectPhaseAssignment: z.record(z.string(), z.string()).default({}),

  // Quotation Settings
  quoteValidityDays: z.coerce.number().min(1, "Validity must be at least 1 day"),
  quoteDefaultNotes: z.string().optional(),
  quoteDefaultDiscount: z.coerce.number().min(0, "Discount cannot be negative"),
  quoteCurrencySymbol: z.string().min(1, "Currency symbol is required"),
  quoteNumberFormat: z.string().min(1, "Number format is required"),
  quoteTaxDisplay: z.string().min(1, "Tax display is required"),
  quotePdfHeaderFooter: z.any().optional(),

  // Notification Settings
  notificationReminderTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  notificationReminderPriority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  notificationBrowserEnabled: z.boolean().default(true),
  notificationEmailEnabled: z.boolean().default(true),

  // General Settings
  generalTimezone: z.string().min(1, "Timezone is required"),
  generalDateFormat: z.string().min(1, "Date format is required"),
  generalTheme: z.enum(["light", "dark", "system"]),
  generalDefaultDashboard: z.string().min(1, "Default dashboard is required"),

  // Role Permissions
  rolePermissions: z.record(z.string(), z.array(z.nativeEnum(UserRole))).default({}),

  // Product Pricing
  pricingDefaultMargin: z.coerce.number().min(0, "Default margin must be positive"),
  pricingAllowMarginOverride: z.boolean().default(true),
  pricingMinMargin: z.coerce.number().min(0, "Minimum margin must be positive"),
  pricingMaxDiscount: z.coerce.number().min(0, "Maximum discount must be positive").max(100, "Maximum discount cannot exceed 100%"),

  // Payment Settings
  paymentAssignmentMethod: z.enum(["MANUAL", "PERCENTAGE"]).default("PERCENTAGE"),
  paymentAssignmentPercentages: z.record(z.string(), z.coerce.number()).default({}),
  paymentDefaultCreditDays: z.coerce.number().min(0, "Default credit days cannot be negative").default(30),
  paymentDefaultReminderSchedule: z.array(z.coerce.number()).default([0]),
  paymentReminderFrequency: z.enum(["DAILY", "WEEKLY"]).default("DAILY"),
  paymentOverdueGracePeriod: z.coerce.number().min(0, "Overdue grace period cannot be negative").default(0),
  paymentDefaultMethods: z.array(z.string()).default(["CASH", "BANK_TRANSFER", "UPI", "CHEQUE"]),
}).superRefine((data, ctx) => {
  // Validate Lead Assignment Percentages if method is PERCENTAGE
  if (data.leadAssignmentMethod === "PERCENTAGE") {
    const percentages = Object.values(data.leadSalesmanPercentages) as number[];
    if (percentages.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one salesman percentage must be configured for Percentage Based assignment.",
        path: ["leadSalesmanPercentages"],
      });
    } else {
      const sum = percentages.reduce((acc: number, curr: number) => acc + curr, 0);
      if (Math.abs(sum - 100) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Total percentage must equal 100%. Current sum: ${sum}%`,
          path: ["leadSalesmanPercentages"],
        });
      }
    }
  }

  // Validate Project Assignment Percentages if method is PERCENTAGE
  if (data.projectAssignmentMethod === "PERCENTAGE") {
    const percentages = Object.values(data.projectSalesmanPercentages) as number[];
    if (percentages.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one salesman percentage must be configured for Percentage Based assignment.",
        path: ["projectSalesmanPercentages"],
      });
    } else {
      const sum = percentages.reduce((acc: number, curr: number) => acc + curr, 0);
      if (Math.abs(sum - 100) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Total percentage must equal 100%. Current sum: ${sum}%`,
          path: ["projectSalesmanPercentages"],
        });
      }
    }
  }

  // Validate Payment Assignment Percentages if method is PERCENTAGE
  if (data.paymentAssignmentMethod === "PERCENTAGE") {
    const percentages = Object.values(data.paymentAssignmentPercentages) as number[];
    if (percentages.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one collector percentage must be configured for Percentage Based assignment.",
        path: ["paymentAssignmentPercentages"],
      });
    } else {
      const sum = percentages.reduce((acc: number, curr: number) => acc + curr, 0);
      if (Math.abs(sum - 100) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Total percentage must equal 100%. Current sum: ${sum}%`,
          path: ["paymentAssignmentPercentages"],
        });
      }
    }
  }
});
