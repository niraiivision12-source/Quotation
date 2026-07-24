"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettingsSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.updateSettingsSchema = zod_1.z.object({
    // Company Settings
    companyName: zod_1.z.string().min(1, "Company Name is required"),
    companyLogo: zod_1.z.string().nullable().optional(),
    companyGst: zod_1.z.string().min(1, "GST Number is required"),
    companyAddress: zod_1.z.string().min(1, "Address is required"),
    companyPhone: zod_1.z.string().min(1, "Phone is required"),
    companyEmail: zod_1.z.string().email("Invalid email").or(zod_1.z.string().length(0)),
    companyWebsite: zod_1.z.string().optional(),
    bankName: zod_1.z.string().min(1, "Bank Name is required"),
    bankAccountNo: zod_1.z.string().min(1, "Account Number is required"),
    bankIfsc: zod_1.z.string().min(1, "IFSC is required"),
    bankBranch: zod_1.z.string().min(1, "Branch is required"),
    upiId: zod_1.z.string().optional(),
    termsAndConditions: zod_1.z.string().optional(),
    authorizedSignature: zod_1.z.string().nullable().optional(),
    footerText: zod_1.z.string().optional(),
    // Lead Assignment
    leadAssignmentMethod: zod_1.z.enum(["MANUAL", "PERCENTAGE", "ROUND_ROBIN"]),
    leadSalesmanPercentages: zod_1.z.record(zod_1.z.string(), zod_1.z.coerce.number()).default({}),
    lastLeadAssignedUserId: zod_1.z.string().nullable().optional(),
    // Project Assignment
    projectAssignmentMethod: zod_1.z.enum(["MANUAL", "PERCENTAGE", "PHASE_BASED"]),
    projectSalesmanPercentages: zod_1.z.record(zod_1.z.string(), zod_1.z.coerce.number()).default({}),
    projectPhaseAssignment: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).default({}),
    categorySalesmanAssignment: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional().default({}),
    // Quotation Settings
    quoteValidityDays: zod_1.z.coerce.number().min(1, "Validity must be at least 1 day"),
    quoteDefaultNotes: zod_1.z.string().optional(),
    quoteDefaultDiscount: zod_1.z.coerce.number().min(0, "Discount cannot be negative"),
    quoteCurrencySymbol: zod_1.z.string().min(1, "Currency symbol is required"),
    quoteNumberFormat: zod_1.z.string().min(1, "Number format is required"),
    quoteTaxDisplay: zod_1.z.string().min(1, "Tax display is required"),
    quotePdfHeaderFooter: zod_1.z.any().optional(),
    // Notification Settings
    notificationReminderTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
    notificationReminderPriority: zod_1.z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    notificationBrowserEnabled: zod_1.z.boolean().default(true),
    notificationEmailEnabled: zod_1.z.boolean().default(true),
    // General Settings
    generalTimezone: zod_1.z.string().min(1, "Timezone is required"),
    generalDateFormat: zod_1.z.string().min(1, "Date format is required"),
    generalTheme: zod_1.z.enum(["light", "dark", "system"]),
    generalDefaultDashboard: zod_1.z.string().min(1, "Default dashboard is required"),
    // Role Permissions
    rolePermissions: zod_1.z.record(zod_1.z.string(), zod_1.z.array(zod_1.z.nativeEnum(client_1.UserRole))).default({}),
    // Product Pricing
    pricingDefaultMargin: zod_1.z.coerce.number().min(0, "Default margin must be positive"),
    pricingAllowMarginOverride: zod_1.z.boolean().default(true),
    pricingMinMargin: zod_1.z.coerce.number().min(0, "Minimum margin must be positive"),
    pricingMaxDiscount: zod_1.z.coerce.number().min(0, "Maximum discount must be positive").max(100, "Maximum discount cannot exceed 100%"),
    // Payment Settings
    paymentAssignmentMethod: zod_1.z.enum(["MANUAL", "PERCENTAGE"]).default("PERCENTAGE"),
    paymentAssignmentPercentages: zod_1.z.record(zod_1.z.string(), zod_1.z.coerce.number()).default({}),
    paymentDefaultCreditDays: zod_1.z.coerce.number().min(0, "Default credit days cannot be negative").default(30),
    paymentDefaultReminderSchedule: zod_1.z.array(zod_1.z.coerce.number()).default([0]),
    paymentReminderFrequency: zod_1.z.enum(["DAILY", "WEEKLY"]).default("DAILY"),
    paymentOverdueGracePeriod: zod_1.z.coerce.number().min(0, "Overdue grace period cannot be negative").default(0),
    paymentDefaultMethods: zod_1.z.array(zod_1.z.string()).default(["CASH", "BANK_TRANSFER", "UPI", "CHEQUE"]),
}).superRefine((data, ctx) => {
    // Validate Lead Assignment Percentages if method is PERCENTAGE
    if (data.leadAssignmentMethod === "PERCENTAGE") {
        const percentages = Object.values(data.leadSalesmanPercentages);
        if (percentages.length === 0) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: "At least one salesman percentage must be configured for Percentage Based assignment.",
                path: ["leadSalesmanPercentages"],
            });
        }
        else {
            const sum = percentages.reduce((acc, curr) => acc + curr, 0);
            if (Math.abs(sum - 100) > 0.01) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: `Total percentage must equal 100%. Current sum: ${sum}%`,
                    path: ["leadSalesmanPercentages"],
                });
            }
        }
    }
    // Validate Project Assignment Percentages if method is PERCENTAGE
    if (data.projectAssignmentMethod === "PERCENTAGE") {
        const percentages = Object.values(data.projectSalesmanPercentages);
        if (percentages.length === 0) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: "At least one salesman percentage must be configured for Percentage Based assignment.",
                path: ["projectSalesmanPercentages"],
            });
        }
        else {
            const sum = percentages.reduce((acc, curr) => acc + curr, 0);
            if (Math.abs(sum - 100) > 0.01) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: `Total percentage must equal 100%. Current sum: ${sum}%`,
                    path: ["projectSalesmanPercentages"],
                });
            }
        }
    }
    // Validate Payment Assignment Percentages if method is PERCENTAGE
    if (data.paymentAssignmentMethod === "PERCENTAGE") {
        const percentages = Object.values(data.paymentAssignmentPercentages);
        if (percentages.length === 0) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: "At least one collector percentage must be configured for Percentage Based assignment.",
                path: ["paymentAssignmentPercentages"],
            });
        }
        else {
            const sum = percentages.reduce((acc, curr) => acc + curr, 0);
            if (Math.abs(sum - 100) > 0.01) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: `Total percentage must equal 100%. Current sum: ${sum}%`,
                    path: ["paymentAssignmentPercentages"],
                });
            }
        }
    }
});
//# sourceMappingURL=settings.validation.js.map