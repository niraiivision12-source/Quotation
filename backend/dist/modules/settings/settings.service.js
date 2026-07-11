"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const prisma_1 = require("../../config/prisma");
const client_1 = require("@prisma/client");
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
        createQuotations: [client_1.UserRole.OWNER, client_1.UserRole.SALESMAN],
        editQuotations: [client_1.UserRole.OWNER, client_1.UserRole.SALESMAN],
        deleteQuotations: [client_1.UserRole.OWNER],
        approveQuotations: [client_1.UserRole.OWNER],
        createLeads: [client_1.UserRole.OWNER, client_1.UserRole.SALESMAN, client_1.UserRole.ATTENDANT],
        editProjects: [client_1.UserRole.OWNER, client_1.UserRole.SALESMAN],
        manageProducts: [client_1.UserRole.OWNER],
        accessReports: [client_1.UserRole.OWNER, client_1.UserRole.ACCOUNTANT],
        accessSettings: [client_1.UserRole.OWNER],
        managePayments: [client_1.UserRole.OWNER, client_1.UserRole.ACCOUNTANT],
        viewPayments: [client_1.UserRole.OWNER, client_1.UserRole.ACCOUNTANT, client_1.UserRole.SALESMAN, client_1.UserRole.ATTENDANT],
    },
    pricingDefaultMargin: 10,
    pricingAllowMarginOverride: true,
    pricingMinMargin: 5,
    pricingMaxDiscount: 20,
    paymentAssignmentMethod: "PERCENTAGE",
    paymentAssignmentPercentages: {},
    paymentDefaultCreditDays: 30,
    paymentDefaultReminderSchedule: [0],
    paymentReminderFrequency: "DAILY",
    paymentOverdueGracePeriod: 0,
    paymentDefaultMethods: ["CASH", "BANK_TRANSFER", "UPI", "CHEQUE"],
};
class SettingsService {
    static async getSettings() {
        let settings = await prisma_1.prisma.systemSettings.findUnique({
            where: { id: "default" },
        });
        if (!settings) {
            settings = await prisma_1.prisma.systemSettings.create({
                data: DEFAULT_SETTINGS,
            });
        }
        return settings;
    }
    static async updateSettings(data) {
        // Ensure settings record exists
        await this.getSettings();
        return prisma_1.prisma.systemSettings.update({
            where: { id: "default" },
            data: {
                ...data,
                // Ensure complex json objects are kept as json
                leadSalesmanPercentages: data.leadSalesmanPercentages ?? undefined,
                projectSalesmanPercentages: data.projectSalesmanPercentages ?? undefined,
                projectPhaseAssignment: data.projectPhaseAssignment ?? undefined,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                quotePdfHeaderFooter: data.quotePdfHeaderFooter,
                rolePermissions: data.rolePermissions ?? undefined,
                paymentAssignmentPercentages: data.paymentAssignmentPercentages ?? undefined,
                paymentDefaultReminderSchedule: data.paymentDefaultReminderSchedule ?? undefined,
                paymentDefaultMethods: data.paymentDefaultMethods ?? undefined,
            },
        });
    }
    static async exportSettings() {
        const settings = await this.getSettings();
        // Return settings excluding system fields
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, createdAt, updatedAt, lastLeadAssignedUserId, ...exportable } = settings;
        return exportable;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static async importSettings(data) {
        // Basic validation of import schema keys
        if (!data.companyName || !data.leadAssignmentMethod || !data.projectAssignmentMethod) {
            throw new Error("Invalid settings import format");
        }
        // Overwrite database default row
        return prisma_1.prisma.systemSettings.upsert({
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
exports.SettingsService = SettingsService;
//# sourceMappingURL=settings.service.js.map