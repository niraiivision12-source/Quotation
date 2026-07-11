"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../config/prisma");
const env_1 = require("../config/env");
const dev_store_service_1 = require("../modules/dev/dev-store.service");
const dev_metadata_1 = require("./dev-metadata");
const lead_controller_1 = require("../modules/lead/lead.controller");
const user_controller_1 = require("../modules/user/user.controller");
const customer_controller_1 = require("../modules/customer/customer.controller");
const product_controller_1 = require("../modules/product/product.controller");
const project_controller_1 = require("../modules/project/project.controller");
const quotation_controller_1 = require("../modules/quotation/quotation.controller");
const payment_controller_1 = require("../modules/payment/payment.controller");
const reminder_controller_1 = require("../modules/reminder/reminder.controller");
const task_controller_1 = require("../modules/task/task.controller");
const settings_controller_1 = require("../modules/settings/settings.controller");
const dashboard_controller_1 = require("../modules/dashboard/dashboard.controller");
const auth_controller_1 = require("../modules/auth/auth.controller");
const lifecycle_controller_1 = require("../modules/lifecycle/lifecycle.controller");
const lead_note_controller_1 = require("../modules/lead-notes/lead-note.controller");
const authVal = __importStar(require("../modules/auth/auth.validation"));
const userVal = __importStar(require("../modules/user/user.validation"));
const productVal = __importStar(require("../modules/product/product.validation"));
const customerVal = __importStar(require("../modules/customer/customer.validation"));
const projectVal = __importStar(require("../modules/project/project.validation"));
const leadVal = __importStar(require("../modules/lead/lead.validation"));
const reminderVal = __importStar(require("../modules/reminder/reminder.validation"));
const taskVal = __importStar(require("../modules/task/task.validation"));
const quotationVal = __importStar(require("../modules/quotation/quotation.validation"));
const lifecycleVal = __importStar(require("../modules/lifecycle/lifecycle.validation"));
const settingsVal = __importStar(require("../modules/settings/settings.validation"));
const paymentVal = __importStar(require("../modules/payment/payment.validation"));
const leadNoteVal = __importStar(require("../modules/lead-notes/lead-note.validation"));
const router = (0, express_1.Router)();
const CONTROLLERS = [
    lead_controller_1.LeadController,
    user_controller_1.UserController,
    customer_controller_1.CustomerController,
    product_controller_1.ProductController,
    project_controller_1.ProjectController,
    quotation_controller_1.QuotationController,
    payment_controller_1.PaymentController,
    reminder_controller_1.ReminderController,
    task_controller_1.TaskController,
    settings_controller_1.SettingsController,
    dashboard_controller_1.DashboardController,
    auth_controller_1.AuthController,
    lifecycle_controller_1.LifecycleController,
    lead_note_controller_1.LeadNoteController
];
// Helper to recursively walk the Express router stack and collect endpoints with handlers
function walkExpressRouter(routerObj, prefix = "", inheritedMiddlewares = []) {
    const routes = [];
    const stack = routerObj.stack ||
        (routerObj.router && routerObj.router.stack) ||
        (routerObj._router && routerObj._router.stack);
    if (!stack)
        return routes;
    const currentRouterMiddlewares = [...inheritedMiddlewares];
    stack.forEach((layer) => {
        if (layer.route) {
            // Leaf route
            const fullPath = (prefix + layer.route.path).replace(/\/+/g, "/");
            const methods = Object.keys(layer.route.methods).map((m) => m.toUpperCase());
            const routeHandlers = (layer.route.stack || []).map((s) => s.handle).filter(Boolean);
            const allHandlers = [...currentRouterMiddlewares, ...routeHandlers];
            methods.forEach((method) => {
                routes.push({
                    method,
                    path: fullPath,
                    handlers: allHandlers,
                });
            });
        }
        else if (layer.name === "router" &&
            layer.handle &&
            (layer.handle.stack || (layer.handle.router && layer.handle.router.stack) || (layer.handle._router && layer.handle._router.stack))) {
            // Sub-router
            let subPrefix = "";
            if (layer.regexp) {
                const match = layer.regexp.toString().match(/^\/\^\\\/([a-zA-Z0-9_:\-]+)/);
                if (match && match[1]) {
                    subPrefix = "/" + match[1].replace(/\\/g, "");
                }
                else {
                    const routePath = layer.regexp.source
                        .replace(/^\^\\\/|\\\/\?(?=\\\/\|\$)/g, "")
                        .replace(/\\\?/g, "?")
                        .replace(/\\\//g, "/")
                        .replace(/\(\?=\\\/\|\$\)/g, "")
                        .replace(/\$/g, "");
                    if (routePath && !routePath.startsWith("^")) {
                        subPrefix = "/" + routePath.split("/")[0];
                    }
                }
            }
            const subRoutes = walkExpressRouter(layer.handle, prefix + subPrefix, currentRouterMiddlewares);
            routes.push(...subRoutes);
        }
        else if (layer.handle &&
            typeof layer.handle === "function" &&
            layer.name !== "errorHandler" &&
            layer.name !== "corsMiddleware" &&
            layer.name !== "devRequestTracer") {
            // Router-level middleware
            currentRouterMiddlewares.push(layer.handle);
        }
    });
    return routes;
}
// Zod schemas converter utilities
function zodToJSONSchema(zodSchema) {
    if (!zodSchema)
        return null;
    if (zodSchema._def && zodSchema._def.typeName === "ZodObject") {
        const properties = {};
        const required = [];
        const shape = zodSchema.shape || {};
        Object.keys(shape).forEach((key) => {
            const field = shape[key];
            const parsedField = parseZodField(field);
            properties[key] = parsedField;
            if (parsedField.required) {
                required.push(key);
            }
        });
        return {
            type: "object",
            properties,
            required: required.length > 0 ? required : undefined,
        };
    }
    return null;
}
function parseZodField(field) {
    let type = "string";
    let required = true;
    let enumValues = undefined;
    let description = "";
    let current = field;
    while (current && current._def) {
        const typeName = current._def.typeName;
        if (typeName === "ZodOptional" || typeName === "ZodNullable") {
            required = false;
            current = current._def.innerType;
        }
        else if (typeName === "ZodEffects") {
            current = current._def.schema;
        }
        else {
            break;
        }
    }
    if (!current || !current._def) {
        return { type, required };
    }
    const typeName = current._def.typeName;
    if (typeName === "ZodString") {
        type = "string";
        const checks = current._def.checks || [];
        const emailCheck = checks.find((c) => c.kind === "email");
        if (emailCheck) {
            description = "Must be a valid email format";
        }
    }
    else if (typeName === "ZodNumber") {
        type = "number";
    }
    else if (typeName === "ZodBoolean") {
        type = "boolean";
    }
    else if (typeName === "ZodEnum") {
        type = "string";
        enumValues = current._def.values;
    }
    else if (typeName === "ZodNativeEnum") {
        type = "string";
        enumValues = Object.values(current._def.values);
    }
    else if (typeName === "ZodArray") {
        type = "array";
        const items = parseZodField(current._def.type);
        return {
            type: "array",
            items,
            required,
        };
    }
    else if (typeName === "ZodObject") {
        return {
            ...zodToJSONSchema(current),
            required,
        };
    }
    return {
        type,
        required,
        enum: enumValues,
        description: description || undefined,
    };
}
function generateExampleFromZodSchema(zodSchema) {
    if (!zodSchema || !zodSchema.shape)
        return null;
    const shape = zodSchema.shape;
    const example = {};
    Object.keys(shape).forEach((key) => {
        let field = shape[key];
        let current = field;
        while (current && current._def) {
            const typeName = current._def.typeName;
            if (typeName === "ZodOptional" || typeName === "ZodNullable") {
                current = current._def.innerType;
            }
            else if (typeName === "ZodEffects") {
                current = current._def.schema;
            }
            else {
                break;
            }
        }
        if (!current)
            return;
        const typeName = current._def.typeName;
        const lowerKey = key.toLowerCase();
        if (lowerKey === "email") {
            example[key] = "owner@system.com";
        }
        else if (lowerKey === "mobile" || lowerKey === "phone") {
            example[key] = "9876543210";
        }
        else if (lowerKey === "name") {
            example[key] = "Raj Kumar";
        }
        else if (lowerKey === "city") {
            example[key] = "Coimbatore";
        }
        else if (lowerKey === "address") {
            example[key] = "Flat 405, MG Road, Pune - 411014";
        }
        else if (lowerKey === "status") {
            if (current._def.values) {
                example[key] = current._def.values[0];
            }
            else {
                example[key] = "NEW";
            }
        }
        else if (typeName === "ZodString") {
            example[key] = "Sample text";
        }
        else if (typeName === "ZodNumber") {
            example[key] = 100;
        }
        else if (typeName === "ZodBoolean") {
            example[key] = true;
        }
        else if (typeName === "ZodEnum" && current._def.values) {
            example[key] = current._def.values[0];
        }
        else if (typeName === "ZodNativeEnum" && current._def.values) {
            example[key] = Object.values(current._def.values)[0];
        }
        else if (typeName === "ZodArray") {
            example[key] = [];
        }
        else if (typeName === "ZodObject") {
            example[key] = generateExampleFromZodSchema(current);
        }
        else {
            example[key] = "";
        }
    });
    return example;
}
function getValidationRulesFromZod(zodSchema) {
    if (!zodSchema || !zodSchema.shape)
        return [];
    const shape = zodSchema.shape;
    const rules = [];
    Object.keys(shape).forEach((key) => {
        let field = shape[key];
        let current = field;
        let isOptional = false;
        while (current && current._def) {
            const typeName = current._def.typeName;
            if (typeName === "ZodOptional" || typeName === "ZodNullable") {
                isOptional = true;
                current = current._def.innerType;
            }
            else if (typeName === "ZodEffects") {
                current = current._def.schema;
            }
            else {
                break;
            }
        }
        if (!current)
            return;
        const typeName = current._def.typeName;
        const statusStr = isOptional ? "optional" : "required";
        if (typeName === "ZodString") {
            let rule = `'${key}' must be a string (${statusStr})`;
            const checks = current._def.checks || [];
            const minCheck = checks.find((c) => c.kind === "min");
            if (minCheck) {
                rule += `, minimum length: ${minCheck.value}`;
            }
            const emailCheck = checks.find((c) => c.kind === "email");
            if (emailCheck) {
                rule += `, valid email format`;
            }
            rules.push(rule);
        }
        else if (typeName === "ZodNumber") {
            rules.push(`'${key}' must be a number (${statusStr})`);
        }
        else if (typeName === "ZodBoolean") {
            rules.push(`'${key}' must be a boolean (${statusStr})`);
        }
        else if ((typeName === "ZodEnum" || typeName === "ZodNativeEnum") && current._def.values) {
            const values = typeName === "ZodEnum" ? current._def.values : Object.values(current._def.values);
            rules.push(`'${key}' must be one of: ${values.join(", ")} (${statusStr})`);
        }
    });
    return rules;
}
function resolveSchema(controllerName, handlerName) {
    if (controllerName === "AuthController") {
        if (handlerName === "login")
            return authVal.loginSchema;
    }
    if (controllerName === "UserController") {
        if (handlerName === "create")
            return userVal.createUserSchema;
        if (handlerName === "update")
            return userVal.updateUserSchema;
    }
    if (controllerName === "ProductController") {
        if (handlerName === "create")
            return productVal.createProductSchema;
        if (handlerName === "update")
            return productVal.updateProductSchema;
    }
    if (controllerName === "CustomerController") {
        if (handlerName === "create")
            return customerVal.createCustomerSchema;
        if (handlerName === "update")
            return customerVal.updateCustomerSchema;
    }
    if (controllerName === "ProjectController") {
        if (handlerName === "create")
            return projectVal.createProjectSchema;
        if (handlerName === "update")
            return projectVal.updateProjectSchema;
    }
    if (controllerName === "LeadController") {
        if (handlerName === "create")
            return leadVal.createLeadSchema;
        if (handlerName === "update")
            return leadVal.updateLeadSchema;
        if (handlerName === "convert")
            return leadVal.convertLeadSchema;
    }
    if (controllerName === "ReminderController") {
        if (handlerName === "create")
            return reminderVal.createReminderSchema;
        if (handlerName === "update")
            return reminderVal.createReminderSchema;
    }
    if (controllerName === "TaskController") {
        if (handlerName === "create")
            return taskVal.createTaskSchema;
    }
    if (controllerName === "QuotationController") {
        if (handlerName === "create")
            return quotationVal.createQuotationSchema;
    }
    if (controllerName === "PaymentController") {
        if (handlerName === "linkBill")
            return paymentVal.createPaymentSchema;
        if (handlerName === "recordTransaction")
            return paymentVal.createTransactionSchema;
    }
    if (controllerName === "SettingsController") {
        if (handlerName === "update")
            return settingsVal.updateSettingsSchema;
    }
    if (controllerName === "LifecycleController") {
        if (handlerName === "updatePhase")
            return lifecycleVal.updatePhaseSchema;
    }
    if (controllerName === "LeadNoteController") {
        if (handlerName === "addNote")
            return leadNoteVal.addLeadNoteSchema;
    }
    return null;
}
function getModuleFromPath(path) {
    const parts = path.split("/");
    const segment = parts[2] || "";
    switch (segment.toLowerCase()) {
        case "auth": return "Authentication";
        case "dashboard": return "Dashboard";
        case "users": return "Users";
        case "products": return "Products";
        case "leads": return "Leads";
        case "customers": return "Customers";
        case "projects": return "Projects";
        case "lifecycle": return "Pipeline";
        case "reminders": return "Reminders";
        case "tasks": return "Tasks";
        case "quotations": return "Quotations";
        case "payments": return "Payments";
        case "settings": return "Settings";
        default: return "Unknown";
    }
}
// 1. Endpoint Discovery API
router.get("/endpoints", async (req, res, next) => {
    try {
        const rawEndpoints = walkExpressRouter(req.app);
        const settings = await prisma_1.prisma.systemSettings.findUnique({
            where: { id: "default" },
        });
        const rolePermissions = settings?.rolePermissions || {
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
        };
        const endpoints = rawEndpoints
            .filter((r) => !r.path.startsWith("/api/dev") && !r.path.includes("/dev/"))
            .map((item) => {
            const id = `${item.method} ${item.path}`;
            const metadata = (dev_metadata_1.ENDPOINT_METADATA[id] || {});
            const moduleName = getModuleFromPath(item.path);
            let authRequired = false;
            let requiredRoles = [];
            let controller = "DynamicController";
            let handlerName = "unknown";
            let actualFn = null;
            item.handlers.forEach((h) => {
                if (h.name === "authenticate") {
                    authRequired = true;
                }
                if (h.requiredRoles) {
                    requiredRoles = [...requiredRoles, ...h.requiredRoles];
                }
                if (h.permissionAction) {
                    const action = h.permissionAction;
                    const allowed = rolePermissions[action] || [];
                    requiredRoles = [...requiredRoles, ...allowed];
                }
                const fn = h.originalFn || h;
                if (fn && fn !== h && fn.name) {
                    actualFn = fn;
                    handlerName = fn.name;
                }
            });
            // Resolve Controller Class Name
            if (actualFn) {
                for (const ctrl of CONTROLLERS) {
                    const propNames = Object.getOwnPropertyNames(ctrl);
                    for (const prop of propNames) {
                        if (ctrl[prop] === actualFn) {
                            controller = ctrl.name;
                            break;
                        }
                    }
                    if (controller !== "DynamicController")
                        break;
                }
            }
            // Deduplicate requiredRoles
            requiredRoles = Array.from(new Set(requiredRoles));
            if (authRequired && requiredRoles.length === 0) {
                requiredRoles = [client_1.UserRole.OWNER, client_1.UserRole.SALESMAN, client_1.UserRole.ACCOUNTANT, client_1.UserRole.ATTENDANT];
            }
            const schemaObj = resolveSchema(controller, handlerName);
            const requestSchema = metadata.requestSchema || zodToJSONSchema(schemaObj);
            const exampleRequest = metadata.exampleRequest || generateExampleFromZodSchema(schemaObj);
            const validationRules = metadata.validationRules || getValidationRulesFromZod(schemaObj);
            const pathParamsList = [];
            const parts = item.path.split("/");
            parts.forEach((part) => {
                if (part.startsWith(":")) {
                    pathParamsList.push(part.replace(":", ""));
                }
            });
            const pathParams = metadata.pathParams || pathParamsList.map((p) => ({
                name: p,
                type: "string",
                required: true,
                description: `URL path parameter '${p}'`,
            }));
            const headers = metadata.headers || [];
            if (authRequired && !headers.some((h) => h.name === "Authorization")) {
                headers.push({
                    name: "Authorization",
                    type: "string",
                    required: true,
                    description: "Bearer <token>",
                });
            }
            if (item.method !== "GET" && !headers.some((h) => h.name === "Content-Type")) {
                headers.push({
                    name: "Content-Type",
                    type: "string",
                    required: true,
                    description: "application/json",
                });
            }
            return {
                id,
                method: item.method,
                route: item.path,
                module: moduleName,
                description: metadata.description || `Perform ${item.method} operation on ${item.path}`,
                authRequired,
                requiredRoles,
                controller: `${controller}.${handlerName}`,
                serviceMethod: metadata.serviceMethod || `${controller.replace("Controller", "Service")}.${handlerName}`,
                pathParams,
                queryParams: metadata.queryParams || (item.method === "GET" ? [
                    { name: "page", type: "number", required: false, description: "Page number" },
                    { name: "limit", type: "number", required: false, description: "Records per page" },
                    { name: "search", type: "string", required: false, description: "Search query" }
                ] : []),
                headers,
                requestSchema,
                validationRules,
                exampleRequest,
                exampleResponse: metadata.exampleResponse || { success: true, message: "Success", data: {} },
                errorResponses: metadata.errorResponses || [
                    { status: 400, message: "Bad Request", description: "Validation error" },
                    { status: 401, message: "Unauthorized", description: "Authentication failed" },
                ],
            };
        });
        res.status(200).json({ success: true, data: endpoints });
    }
    catch (error) {
        next(error);
    }
});
// 2. Demo Account tokens list and switching helper
router.get("/demo-users", async (req, res, next) => {
    try {
        const users = await prisma_1.prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });
        res.status(200).json({ success: true, data: users });
    }
    catch (error) {
        next(error);
    }
});
router.post("/auth/token-as", async (req, res, next) => {
    try {
        const { role, email } = req.body;
        let user;
        if (email) {
            user = await prisma_1.prisma.user.findUnique({ where: { email } });
        }
        else if (role) {
            user = await prisma_1.prisma.user.findFirst({ where: { role: role } });
        }
        if (!user) {
            return res.status(404).json({
                success: false,
                message: `Demo user not found for role/email.`,
            });
        }
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            role: user.role,
        }, env_1.env.JWT_SECRET, { expiresIn: "7d" });
        res.status(200).json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// 3. Request History routes
router.get("/history", (req, res) => {
    const history = dev_store_service_1.DevStoreService.getHistory();
    res.status(200).json({ success: true, data: history });
});
router.post("/history/clear", (req, res) => {
    dev_store_service_1.DevStoreService.clearHistory();
    res.status(200).json({ success: true, message: "History cleared successfully" });
});
// 4. Collections routes
router.get("/collections", (req, res) => {
    const collections = dev_store_service_1.DevStoreService.getCollections();
    res.status(200).json({ success: true, data: collections });
});
router.post("/collections", (req, res) => {
    const { id, name, description, testCaseIds } = req.body;
    if (!name) {
        return res.status(400).json({ success: false, message: "Collection name is required" });
    }
    const collection = dev_store_service_1.DevStoreService.saveCollection({
        id: id || crypto.randomUUID(),
        name,
        description: description || "",
        testCaseIds: testCaseIds || [],
    });
    res.status(200).json({ success: true, data: collection });
});
router.delete("/collections/:id", (req, res) => {
    dev_store_service_1.DevStoreService.deleteCollection(req.params.id);
    res.status(200).json({ success: true, message: "Collection deleted successfully" });
});
// 5. Test Cases routes
router.get("/test-cases", (req, res) => {
    const testCases = dev_store_service_1.DevStoreService.getTestCases();
    res.status(200).json({ success: true, data: testCases });
});
router.post("/test-cases", (req, res) => {
    const { id, endpointId, name, description, request, expectedStatus, expectedResponse } = req.body;
    if (!endpointId || !name || expectedStatus === undefined) {
        return res.status(400).json({
            success: false,
            message: "endpointId, name, and expectedStatus are required fields.",
        });
    }
    const testCase = dev_store_service_1.DevStoreService.saveTestCase({
        id: id || crypto.randomUUID(),
        endpointId,
        name,
        description: description || "",
        request: request || {},
        expectedStatus,
        expectedResponse: expectedResponse || "",
    });
    res.status(200).json({ success: true, data: testCase });
});
router.delete("/test-cases/:id", (req, res) => {
    dev_store_service_1.DevStoreService.deleteTestCase(req.params.id);
    res.status(200).json({ success: true, message: "Test case deleted successfully" });
});
router.post("/test-cases/:id/duplicate", (req, res) => {
    const duplicated = dev_store_service_1.DevStoreService.duplicateTestCase(req.params.id);
    if (!duplicated) {
        return res.status(404).json({ success: false, message: "Test case not found" });
    }
    res.status(200).json({ success: true, data: duplicated });
});
// 6. Import / Export Config
router.get("/export", (req, res) => {
    const data = dev_store_service_1.DevStoreService.getExportData();
    res.status(200).json({ success: true, data });
});
router.post("/import", (req, res) => {
    try {
        const data = req.body;
        dev_store_service_1.DevStoreService.importData(data);
        res.status(200).json({ success: true, message: "Data imported successfully" });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=dev.routes.js.map