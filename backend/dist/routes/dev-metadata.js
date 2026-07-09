"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENDPOINT_METADATA = void 0;
exports.ENDPOINT_METADATA = {
    "POST /api/auth/login": {
        module: "Authentication",
        description: "Authenticate a user and return a JWT token.",
        authRequired: false,
        controller: "AuthController.login",
        serviceMethod: "AuthService.login",
        headers: [
            { name: "Content-Type", type: "string", required: true, description: "application/json" }
        ],
        requestSchema: {
            type: "object",
            properties: {
                email: { type: "string", format: "email", description: "User's email address" },
                password: { type: "string", description: "User's password" }
            },
            required: ["email", "password"]
        },
        validationRules: [
            "Email must be a valid format",
            "Password must be non-empty"
        ],
        exampleRequest: {
            email: "owner@system.com",
            password: "Admin@123"
        },
        exampleResponse: {
            success: true,
            message: "Login successful",
            data: {
                token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                user: {
                    id: "5d8edef1-4bd6-4ffc-a0f6-71b04d669cbb",
                    name: "Rajesh Sharma",
                    email: "owner@system.com",
                    role: "OWNER"
                }
            }
        },
        errorResponses: [
            { status: 400, message: "Validation failed", description: "Zod verification error" },
            { status: 401, message: "Invalid credentials", description: "Incorrect email or password" }
        ]
    },
    "GET /api/auth/me": {
        module: "Authentication",
        description: "Get details of the currently authenticated user session.",
        authRequired: true,
        requiredRoles: ["OWNER", "SALESMAN", "ATTENDANT", "ACCOUNTANT"],
        controller: "AuthController.me",
        serviceMethod: "N/A",
        headers: [
            { name: "Authorization", type: "string", required: true, description: "Bearer <token>" }
        ],
        exampleResponse: {
            success: true,
            user: {
                id: "5d8edef1-4bd6-4ffc-a0f6-71b04d669cbb",
                role: "OWNER"
            }
        }
    },
    "GET /api/dashboard/summary": {
        module: "Dashboard",
        description: "Fetch high-level financial and operations summary statistics for the dashboard view.",
        authRequired: true,
        controller: "DashboardController.getSummary",
        serviceMethod: "DashboardService.getSummary",
        exampleResponse: {
            success: true,
            data: {
                leadsCount: 80,
                activeProjectsCount: 15,
                totalQuotedAmount: 850000.00,
                totalPaymentsReceived: 320000.00
            }
        }
    },
    "GET /api/leads": {
        module: "Leads",
        description: "Query and list sales leads with filtering, searching, and pagination support.",
        authRequired: true,
        controller: "LeadController.getAll",
        serviceMethod: "LeadService.getAll",
        queryParams: [
            { name: "page", type: "number", required: false, description: "Page number (defaults to 1)" },
            { name: "limit", type: "number", required: false, description: "Records per page (defaults to 20)" },
            { name: "search", type: "string", required: false, description: "Search by lead name, email, or mobile" },
            { name: "status", type: "string", required: false, description: "Filter by status: NEW, CONTACTED, etc." },
            { name: "city", type: "string", required: false, description: "Filter by city location" }
        ],
        exampleResponse: {
            success: true,
            message: "Leads fetched",
            data: {
                leads: [
                    { id: "lead-uuid", name: "Vikram Gupta", mobile: "+91 9876543210", status: "CONTACTED", city: "Mumbai" }
                ],
                total: 1,
                page: 1,
                pages: 1
            }
        }
    },
    "GET /api/leads/stats": {
        module: "Leads",
        description: "Fetch statistical metrics of leads grouped by their status and conversion pipeline.",
        authRequired: true,
        controller: "LeadController.getStats",
        serviceMethod: "LeadService.getStats",
        exampleResponse: {
            success: true,
            data: {
                totalLeads: 80,
                byStatus: {
                    NEW: 10,
                    CONTACTED: 15,
                    WON: 12
                }
            }
        }
    },
    "POST /api/leads": {
        module: "Leads",
        description: "Create a new sales lead entry in the system.",
        authRequired: true,
        requiredRoles: ["OWNER", "SALESMAN"],
        controller: "LeadController.create",
        serviceMethod: "LeadService.create",
        requestSchema: {
            type: "object",
            properties: {
                name: { type: "string" },
                mobile: { type: "string" },
                email: { type: "string", format: "email" },
                source: { type: "string" },
                city: { type: "string" },
                notes: { type: "string" }
            },
            required: ["name", "mobile"]
        },
        exampleRequest: {
            name: "Amit Patel",
            mobile: "+91 9988776655",
            email: "amit.patel@gmail.com",
            source: "Google",
            city: "Pune",
            notes: "Residential wiring installation inquiry"
        },
        exampleResponse: {
            success: true,
            message: "Lead created",
            data: {
                id: "lead-uuid-123",
                name: "Amit Patel",
                mobile: "+91 9988776655",
                status: "NEW"
            }
        }
    },
    "GET /api/leads/:id": {
        module: "Leads",
        description: "Get detailed information about a single lead by its unique identifier.",
        authRequired: true,
        controller: "LeadController.getById",
        serviceMethod: "LeadService.getById",
        pathParams: [
            { name: "id", type: "string", required: true, description: "Lead ID" }
        ],
        exampleResponse: {
            success: true,
            message: "Lead fetched",
            data: {
                id: "lead-uuid-123",
                name: "Amit Patel",
                mobile: "+91 9988776655",
                status: "NEW",
                notesHistory: [],
                activities: []
            }
        }
    },
    "PATCH /api/leads/:id": {
        module: "Leads",
        description: "Update details of an existing sales lead.",
        authRequired: true,
        controller: "LeadController.update",
        serviceMethod: "LeadService.update",
        pathParams: [
            { name: "id", type: "string", required: true, description: "Lead ID" }
        ],
        requestSchema: {
            type: "object",
            properties: {
                name: { type: "string" },
                email: { type: "string" },
                status: { type: "string" },
                estimatedValue: { type: "number" }
            }
        },
        exampleRequest: {
            status: "CONTACTED",
            estimatedValue: 150000.00
        },
        exampleResponse: {
            success: true,
            message: "Lead updated"
        }
    },
    "POST /api/leads/:id/convert": {
        module: "Leads",
        description: "Convert a WON lead into a formal Customer record.",
        authRequired: true,
        controller: "LeadController.convert",
        serviceMethod: "LeadService.convert",
        pathParams: [
            { name: "id", type: "string", required: true, description: "Lead ID" }
        ],
        requestSchema: {
            type: "object",
            properties: {
                address: { type: "string" },
                creditAllowed: { type: "boolean" },
                maxCreditAmount: { type: "number" },
                defaultCreditDays: { type: "number" }
            }
        },
        exampleRequest: {
            address: "Flat 405, Pride Icon, Kharadi, Pune - 411014",
            creditAllowed: true,
            maxCreditAmount: 200000,
            defaultCreditDays: 30
        },
        exampleResponse: {
            success: true,
            message: "Lead converted successfully",
            data: {
                customer: { id: "customer-uuid-123", name: "Amit Patel" }
            }
        }
    },
    "GET /api/customers": {
        module: "Customers",
        description: "Retrieve list of registered customers.",
        authRequired: true,
        controller: "CustomerController.getAll",
        serviceMethod: "CustomerService.getAll",
        exampleResponse: {
            success: true,
            data: [
                { id: "cust-1", name: "Rajesh Sharma Enterprises", city: "Pune" }
            ]
        }
    },
    "POST /api/customers": {
        module: "Customers",
        description: "Directly create a new customer record.",
        authRequired: true,
        controller: "CustomerController.create",
        serviceMethod: "CustomerService.create",
        requestSchema: {
            type: "object",
            properties: {
                name: { type: "string" },
                mobile: { type: "string" },
                email: { type: "string" },
                city: { type: "string" },
                address: { type: "string" }
            },
            required: ["name", "mobile"]
        },
        exampleResponse: {
            success: true,
            data: { id: "cust-2", name: "Sunil Gupta" }
        }
    },
    "GET /api/projects": {
        module: "Projects",
        description: "Fetch list of client installation projects.",
        authRequired: true,
        controller: "ProjectController.getAll",
        serviceMethod: "ProjectService.getAll",
        exampleResponse: {
            success: true,
            data: [
                { id: "proj-1", projectName: "Site electrical layout", currentPhase: "PIPES" }
            ]
        }
    },
    "POST /api/projects": {
        module: "Projects",
        description: "Initialize a new project layout for a customer.",
        authRequired: true,
        controller: "ProjectController.create",
        serviceMethod: "ProjectService.create",
        requestSchema: {
            type: "object",
            properties: {
                customerId: { type: "string" },
                projectName: { type: "string" },
                estimatedBudget: { type: "number" },
                startDate: { type: "string", format: "date-time" }
            },
            required: ["customerId", "projectName"]
        },
        exampleResponse: {
            success: true,
            data: { id: "proj-1", projectName: "Site electrical layout" }
        }
    },
    "GET /api/products": {
        module: "Products",
        description: "Retrieve product list (pipes, wiring, switches, fans, etc.) with category filters.",
        authRequired: true,
        controller: "ProductController.getAll",
        serviceMethod: "ProductService.getAll",
        queryParams: [
            { name: "category", type: "string", required: false, description: "PIPES, WIRING, etc." },
            { name: "search", type: "string", required: false, description: "Search by SKU or name" }
        ],
        exampleResponse: {
            success: true,
            data: [
                { id: "prod-1", sku: "PIPE-PVC-1IN", name: "Supreme PVC Pipe 1 Inch", costPrice: 120 }
            ]
        }
    },
    "GET /api/quotations": {
        module: "Quotations",
        description: "List all sales quotations draft, sent, or approved.",
        authRequired: true,
        controller: "QuotationController.getAll",
        serviceMethod: "QuotationService.getAll",
        exampleResponse: {
            success: true,
            data: [
                { id: "qtn-1", quotationNumber: "QTN-2026-0001", totalAmount: 45000.00, status: "DRAFT" }
            ]
        }
    },
    "POST /api/quotations": {
        module: "Quotations",
        description: "Create a draft quotation with selected products and optional discount structure.",
        authRequired: true,
        controller: "QuotationController.create",
        serviceMethod: "QuotationService.create",
        requestSchema: {
            type: "object",
            properties: {
                type: { type: "string", enum: ["LEAD", "CUSTOMER"] },
                leadId: { type: "string" },
                customerId: { type: "string" },
                notes: { type: "string" },
                items: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            productId: { type: "string" },
                            quantity: { type: "number" },
                            marginPercent: { type: "number" }
                        },
                        required: ["productId", "quantity"]
                    }
                }
            },
            required: ["type", "items"]
        },
        exampleRequest: {
            type: "LEAD",
            leadId: "lead-uuid-123",
            items: [
                { productId: "prod-uuid-1", quantity: 10, marginPercent: 15 }
            ]
        },
        exampleResponse: {
            success: true,
            data: { id: "qtn-1", totalAmount: 1380 }
        }
    },
    "GET /api/payments": {
        module: "Payments",
        description: "List recorded client bill links and payments status.",
        authRequired: true,
        controller: "PaymentController.getAll",
        serviceMethod: "PaymentService.getAll",
        exampleResponse: {
            success: true,
            data: [
                { id: "pay-1", billNumber: "QTN-2026-0001", status: "PENDING", pendingAmount: 45000 }
            ]
        }
    },
    "POST /api/payments/link-bill": {
        module: "Payments",
        description: "Link a formal approved Quotation bill and issue a Payment tracking record.",
        authRequired: true,
        controller: "PaymentController.linkBill",
        serviceMethod: "PaymentService.linkBill",
        requestSchema: {
            type: "object",
            properties: {
                quotationId: { type: "string" },
                creditPeriod: { type: "number" },
                dueDate: { type: "string", format: "date-time" }
            },
            required: ["quotationId", "dueDate"]
        },
        exampleResponse: {
            success: true,
            message: "Bill linked and payment tracking initialized"
        }
    },
    "GET /api/reminders/my": {
        module: "Reminders",
        description: "Retrieve current user's reminders list.",
        authRequired: true,
        controller: "ReminderController.myReminders",
        serviceMethod: "ReminderService.myReminders",
        exampleResponse: {
            success: true,
            data: [
                { id: "rem-1", title: "Call client for quotation status", dueAt: "2026-07-15T09:00:00Z" }
            ]
        }
    },
    "POST /api/reminders": {
        module: "Reminders",
        description: "Set a reminder notification for leads, projects, or tasks.",
        authRequired: true,
        controller: "ReminderController.create",
        serviceMethod: "ReminderService.create",
        requestSchema: {
            type: "object",
            properties: {
                title: { type: "string" },
                description: { type: "string" },
                type: { type: "string", enum: ["LEAD", "PROJECT", "CUSTOMER"] },
                dueAt: { type: "string", format: "date-time" },
                leadId: { type: "string" }
            },
            required: ["title", "type", "dueAt"]
        },
        exampleResponse: {
            success: true,
            data: { id: "rem-2", title: "Check-in on site work" }
        }
    },
    "GET /api/tasks": {
        module: "Tasks",
        description: "List tasks assigned to or created by the user.",
        authRequired: true,
        controller: "TaskController.getAll",
        serviceMethod: "TaskService.getAll",
        exampleResponse: {
            success: true,
            data: [
                { id: "tsk-1", title: "Deliver wires to site B", status: "PENDING" }
            ]
        }
    },
    "POST /api/tasks": {
        module: "Tasks",
        description: "Assign a new task to a salesman or accountant.",
        authRequired: true,
        controller: "TaskController.create",
        serviceMethod: "TaskService.create",
        requestSchema: {
            type: "object",
            properties: {
                title: { type: "string" },
                description: { type: "string" },
                assignedToId: { type: "string" },
                priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] }
            },
            required: ["title", "assignedToId"]
        },
        exampleResponse: {
            success: true,
            data: { id: "tsk-2", title: "Deliver items" }
        }
    },
    "GET /api/settings": {
        module: "Settings",
        description: "Get the application settings (GST, company snapshots, assignment percentages).",
        authRequired: true,
        controller: "SettingsController.get",
        serviceMethod: "SettingsService.get",
        exampleResponse: {
            success: true,
            data: { companyName: "Antigravity Electrical Systems Pvt Ltd" }
        }
    },
    "GET /api/users": {
        module: "Users",
        description: "Retrieve list of all system users (Owner only).",
        authRequired: true,
        requiredRoles: ["OWNER"],
        controller: "UserController.getAll",
        serviceMethod: "UserService.getAll",
        exampleResponse: {
            success: true,
            data: [
                { id: "user-1", name: "Suresh Patel", role: "SALESMAN" }
            ]
        }
    }
};
//# sourceMappingURL=dev-metadata.js.map