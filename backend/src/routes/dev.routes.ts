import { Router, Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { DevStoreService } from "../modules/dev/dev-store.service";
import { ENDPOINT_METADATA } from "./dev-metadata";

import { LeadController } from "../modules/lead/lead.controller";
import { UserController } from "../modules/user/user.controller";
import { CustomerController } from "../modules/customer/customer.controller";
import { ProductController } from "../modules/product/product.controller";
import { ProjectController } from "../modules/project/project.controller";
import { QuotationController } from "../modules/quotation/quotation.controller";
import { PaymentController } from "../modules/payment/payment.controller";
import { ReminderController } from "../modules/reminder/reminder.controller";
import { TaskController } from "../modules/task/task.controller";
import { SettingsController } from "../modules/settings/settings.controller";
import { DashboardController } from "../modules/dashboard/dashboard.controller";
import { AuthController } from "../modules/auth/auth.controller";
import { LifecycleController } from "../modules/lifecycle/lifecycle.controller";
import { LeadNoteController } from "../modules/lead-notes/lead-note.controller";

import * as authVal from "../modules/auth/auth.validation";
import * as userVal from "../modules/user/user.validation";
import * as productVal from "../modules/product/product.validation";
import * as customerVal from "../modules/customer/customer.validation";
import * as projectVal from "../modules/project/project.validation";
import * as leadVal from "../modules/lead/lead.validation";
import * as reminderVal from "../modules/reminder/reminder.validation";
import * as taskVal from "../modules/task/task.validation";
import * as quotationVal from "../modules/quotation/quotation.validation";
import * as lifecycleVal from "../modules/lifecycle/lifecycle.validation";
import * as settingsVal from "../modules/settings/settings.validation";
import * as paymentVal from "../modules/payment/payment.validation";
import * as leadNoteVal from "../modules/lead-notes/lead-note.validation";

const router = Router();

const CONTROLLERS = [
  LeadController,
  UserController,
  CustomerController,
  ProductController,
  ProjectController,
  QuotationController,
  PaymentController,
  ReminderController,
  TaskController,
  SettingsController,
  DashboardController,
  AuthController,
  LifecycleController,
  LeadNoteController
];

// Helper to recursively walk the Express router stack and collect endpoints with handlers
function walkExpressRouter(
  routerObj: any,
  prefix = "",
  inheritedMiddlewares: any[] = []
): Array<{ method: string; path: string; handlers: any[] }> {
  const routes: Array<{ method: string; path: string; handlers: any[] }> = [];
  const stack = routerObj.stack || 
                (routerObj.router && routerObj.router.stack) || 
                (routerObj._router && routerObj._router.stack);
  if (!stack) return routes;

  const currentRouterMiddlewares = [...inheritedMiddlewares];

  stack.forEach((layer: any) => {
    if (layer.route) {
      // Leaf route
      const fullPath = (prefix + layer.route.path).replace(/\/+/g, "/");
      const methods = Object.keys(layer.route.methods).map((m) => m.toUpperCase());
      const routeHandlers = (layer.route.stack || []).map((s: any) => s.handle).filter(Boolean);
      const allHandlers = [...currentRouterMiddlewares, ...routeHandlers];

      methods.forEach((method) => {
        routes.push({
          method,
          path: fullPath,
          handlers: allHandlers,
        });
      });
    } else if (
      layer.name === "router" &&
      layer.handle &&
      (layer.handle.stack || (layer.handle.router && layer.handle.router.stack) || (layer.handle._router && layer.handle._router.stack))
    ) {
      // Sub-router
      let subPrefix = "";
      if (layer.regexp) {
        const match = layer.regexp.toString().match(/^\/\^\\\/([a-zA-Z0-9_:\-]+)/);
        if (match && match[1]) {
          subPrefix = "/" + match[1].replace(/\\/g, "");
        } else {
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
    } else if (
      layer.handle &&
      typeof layer.handle === "function" &&
      layer.name !== "errorHandler" &&
      layer.name !== "corsMiddleware" &&
      layer.name !== "devRequestTracer"
    ) {
      // Router-level middleware
      currentRouterMiddlewares.push(layer.handle);
    }
  });

  return routes;
}

// Zod schemas converter utilities
function zodToJSONSchema(zodSchema: any): any {
  if (!zodSchema) return null;

  if (zodSchema._def && zodSchema._def.typeName === "ZodObject") {
    const properties: Record<string, any> = {};
    const required: string[] = [];
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

function parseZodField(field: any): any {
  let type = "string";
  let required = true;
  let enumValues: string[] | undefined = undefined;
  let description = "";

  let current = field;
  while (current && current._def) {
    const typeName = current._def.typeName;
    if (typeName === "ZodOptional" || typeName === "ZodNullable") {
      required = false;
      current = current._def.innerType;
    } else if (typeName === "ZodEffects") {
      current = current._def.schema;
    } else {
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
    const emailCheck = checks.find((c: any) => c.kind === "email");
    if (emailCheck) {
      description = "Must be a valid email format";
    }
  } else if (typeName === "ZodNumber") {
    type = "number";
  } else if (typeName === "ZodBoolean") {
    type = "boolean";
  } else if (typeName === "ZodEnum") {
    type = "string";
    enumValues = current._def.values;
  } else if (typeName === "ZodNativeEnum") {
    type = "string";
    enumValues = Object.values(current._def.values);
  } else if (typeName === "ZodArray") {
    type = "array";
    const items = parseZodField(current._def.type);
    return {
      type: "array",
      items,
      required,
    };
  } else if (typeName === "ZodObject") {
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

function generateExampleFromZodSchema(zodSchema: any): any {
  if (!zodSchema || !zodSchema.shape) return null;
  const shape = zodSchema.shape;
  const example: Record<string, any> = {};

  Object.keys(shape).forEach((key) => {
    let field = shape[key];
    
    let current = field;
    while (current && current._def) {
      const typeName = current._def.typeName;
      if (typeName === "ZodOptional" || typeName === "ZodNullable") {
        current = current._def.innerType;
      } else if (typeName === "ZodEffects") {
        current = current._def.schema;
      } else {
        break;
      }
    }

    if (!current) return;
    const typeName = current._def.typeName;

    const lowerKey = key.toLowerCase();
    if (lowerKey === "email") {
      example[key] = "owner@system.com";
    } else if (lowerKey === "mobile" || lowerKey === "phone") {
      example[key] = "9876543210";
    } else if (lowerKey === "name") {
      example[key] = "Raj Kumar";
    } else if (lowerKey === "city") {
      example[key] = "Coimbatore";
    } else if (lowerKey === "address") {
      example[key] = "Flat 405, MG Road, Pune - 411014";
    } else if (lowerKey === "status") {
      if (current._def.values) {
        example[key] = current._def.values[0];
      } else {
        example[key] = "NEW";
      }
    } else if (typeName === "ZodString") {
      example[key] = "Sample text";
    } else if (typeName === "ZodNumber") {
      example[key] = 100;
    } else if (typeName === "ZodBoolean") {
      example[key] = true;
    } else if (typeName === "ZodEnum" && current._def.values) {
      example[key] = current._def.values[0];
    } else if (typeName === "ZodNativeEnum" && current._def.values) {
      example[key] = Object.values(current._def.values)[0];
    } else if (typeName === "ZodArray") {
      example[key] = [];
    } else if (typeName === "ZodObject") {
      example[key] = generateExampleFromZodSchema(current);
    } else {
      example[key] = "";
    }
  });

  return example;
}

function getValidationRulesFromZod(zodSchema: any): string[] {
  if (!zodSchema || !zodSchema.shape) return [];
  const shape = zodSchema.shape;
  const rules: string[] = [];

  Object.keys(shape).forEach((key) => {
    let field = shape[key];
    let current = field;
    let isOptional = false;
    while (current && current._def) {
      const typeName = current._def.typeName;
      if (typeName === "ZodOptional" || typeName === "ZodNullable") {
        isOptional = true;
        current = current._def.innerType;
      } else if (typeName === "ZodEffects") {
        current = current._def.schema;
      } else {
        break;
      }
    }

    if (!current) return;
    const typeName = current._def.typeName;
    const statusStr = isOptional ? "optional" : "required";
    
    if (typeName === "ZodString") {
      let rule = `'${key}' must be a string (${statusStr})`;
      const checks = current._def.checks || [];
      const minCheck = checks.find((c: any) => c.kind === "min");
      if (minCheck) {
        rule += `, minimum length: ${minCheck.value}`;
      }
      const emailCheck = checks.find((c: any) => c.kind === "email");
      if (emailCheck) {
        rule += `, valid email format`;
      }
      rules.push(rule);
    } else if (typeName === "ZodNumber") {
      rules.push(`'${key}' must be a number (${statusStr})`);
    } else if (typeName === "ZodBoolean") {
      rules.push(`'${key}' must be a boolean (${statusStr})`);
    } else if ((typeName === "ZodEnum" || typeName === "ZodNativeEnum") && current._def.values) {
      const values = typeName === "ZodEnum" ? current._def.values : Object.values(current._def.values);
      rules.push(`'${key}' must be one of: ${values.join(", ")} (${statusStr})`);
    }
  });

  return rules;
}

function resolveSchema(controllerName: string, handlerName: string): any {
  if (controllerName === "AuthController") {
    if (handlerName === "login") return authVal.loginSchema;
  }
  if (controllerName === "UserController") {
    if (handlerName === "create") return userVal.createUserSchema;
    if (handlerName === "update") return userVal.updateUserSchema;
  }
  if (controllerName === "ProductController") {
    if (handlerName === "create") return productVal.createProductSchema;
    if (handlerName === "update") return productVal.updateProductSchema;
  }
  if (controllerName === "CustomerController") {
    if (handlerName === "create") return customerVal.createCustomerSchema;
    if (handlerName === "update") return customerVal.updateCustomerSchema;
  }
  if (controllerName === "ProjectController") {
    if (handlerName === "create") return projectVal.createProjectSchema;
    if (handlerName === "update") return projectVal.updateProjectSchema;
  }
  if (controllerName === "LeadController") {
    if (handlerName === "create") return leadVal.createLeadSchema;
    if (handlerName === "update") return leadVal.updateLeadSchema;
    if (handlerName === "convert") return leadVal.convertLeadSchema;
  }
  if (controllerName === "ReminderController") {
    if (handlerName === "create") return reminderVal.createReminderSchema;
    if (handlerName === "update") return reminderVal.createReminderSchema;
  }
  if (controllerName === "TaskController") {
    if (handlerName === "create") return taskVal.createTaskSchema;
  }
  if (controllerName === "QuotationController") {
    if (handlerName === "create") return quotationVal.createQuotationSchema;
  }
  if (controllerName === "PaymentController") {
    if (handlerName === "linkBill") return paymentVal.createPaymentSchema;
    if (handlerName === "recordTransaction") return paymentVal.createTransactionSchema;
  }
  if (controllerName === "SettingsController") {
    if (handlerName === "update") return settingsVal.updateSettingsSchema;
  }
  if (controllerName === "LifecycleController") {
    if (handlerName === "updatePhase") return lifecycleVal.updatePhaseSchema;
  }
  if (controllerName === "LeadNoteController") {
    if (handlerName === "addNote") return leadNoteVal.addLeadNoteSchema;
  }
  return null;
}

function getModuleFromPath(path: string): string {
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
router.get("/endpoints", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawEndpoints = walkExpressRouter(req.app);

    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
    });
    
    const rolePermissions = (settings?.rolePermissions as Record<string, string[]> | null) || {
      createQuotations: [UserRole.OWNER, UserRole.SALESMAN],
      editQuotations: [UserRole.OWNER, UserRole.SALESMAN],
      deleteQuotations: [UserRole.OWNER],
      approveQuotations: [UserRole.OWNER],
      createLeads: [UserRole.OWNER, UserRole.SALESMAN, UserRole.ATTENDANT],
      editProjects: [UserRole.OWNER, UserRole.SALESMAN],
      manageProducts: [UserRole.OWNER],
      accessReports: [UserRole.OWNER, UserRole.ACCOUNTANT],
      accessSettings: [UserRole.OWNER],
      managePayments: [UserRole.OWNER, UserRole.ACCOUNTANT],
      viewPayments: [UserRole.OWNER, UserRole.ACCOUNTANT, UserRole.SALESMAN, UserRole.ATTENDANT],
    };

    const endpoints = rawEndpoints
      .filter((r) => !r.path.startsWith("/api/dev") && !r.path.includes("/dev/"))
      .map((item) => {
        const id = `${item.method} ${item.path}`;
        const metadata = (ENDPOINT_METADATA[id] || {}) as any;

        const moduleName = getModuleFromPath(item.path);

        let authRequired = false;
        let requiredRoles: string[] = [];
        let controller = "DynamicController";
        let handlerName = "unknown";
        let actualFn: any = null;

        item.handlers.forEach((h: any) => {
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
              if ((ctrl as any)[prop] === actualFn) {
                controller = ctrl.name;
                break;
              }
            }
            if (controller !== "DynamicController") break;
          }
        }

        // Deduplicate requiredRoles
        requiredRoles = Array.from(new Set(requiredRoles));

        if (authRequired && requiredRoles.length === 0) {
          requiredRoles = [UserRole.OWNER, UserRole.SALESMAN, UserRole.ACCOUNTANT, UserRole.ATTENDANT];
        }

        const schemaObj = resolveSchema(controller, handlerName);
        const requestSchema = metadata.requestSchema || zodToJSONSchema(schemaObj);
        const exampleRequest = metadata.exampleRequest || generateExampleFromZodSchema(schemaObj);
        const validationRules = metadata.validationRules || getValidationRulesFromZod(schemaObj);

        const pathParamsList: string[] = [];
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
        if (authRequired && !headers.some((h: any) => h.name === "Authorization")) {
          headers.push({
            name: "Authorization",
            type: "string",
            required: true,
            description: "Bearer <token>",
          });
        }
        if (item.method !== "GET" && !headers.some((h: any) => h.name === "Content-Type")) {
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
  } catch (error) {
    next(error);
  }
});

// 2. Demo Account tokens list and switching helper
router.get("/demo-users", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

router.post("/auth/token-as", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, email } = req.body;

    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    } else if (role) {
      user = await prisma.user.findFirst({ where: { role: role as UserRole } });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Demo user not found for role/email.`,
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: "7d" },
    );

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
  } catch (error) {
    next(error);
  }
});

// 3. Request History routes
router.get("/history", (req: Request, res: Response) => {
  const history = DevStoreService.getHistory();
  res.status(200).json({ success: true, data: history });
});

router.post("/history/clear", (req: Request, res: Response) => {
  DevStoreService.clearHistory();
  res.status(200).json({ success: true, message: "History cleared successfully" });
});

// 4. Collections routes
router.get("/collections", (req: Request, res: Response) => {
  const collections = DevStoreService.getCollections();
  res.status(200).json({ success: true, data: collections });
});

router.post("/collections", (req: Request, res: Response) => {
  const { id, name, description, testCaseIds } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: "Collection name is required" });
  }
  const collection = DevStoreService.saveCollection({
    id: id || crypto.randomUUID(),
    name,
    description: description || "",
    testCaseIds: testCaseIds || [],
  });
  res.status(200).json({ success: true, data: collection });
});

router.delete("/collections/:id", (req: Request, res: Response) => {
  DevStoreService.deleteCollection(req.params.id as string);
  res.status(200).json({ success: true, message: "Collection deleted successfully" });
});

// 5. Test Cases routes
router.get("/test-cases", (req: Request, res: Response) => {
  const testCases = DevStoreService.getTestCases();
  res.status(200).json({ success: true, data: testCases });
});

router.post("/test-cases", (req: Request, res: Response) => {
  const { id, endpointId, name, description, request, expectedStatus, expectedResponse } = req.body;
  if (!endpointId || !name || expectedStatus === undefined) {
    return res.status(400).json({
      success: false,
      message: "endpointId, name, and expectedStatus are required fields.",
    });
  }

  const testCase = DevStoreService.saveTestCase({
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

router.delete("/test-cases/:id", (req: Request, res: Response) => {
  DevStoreService.deleteTestCase(req.params.id as string);
  res.status(200).json({ success: true, message: "Test case deleted successfully" });
});

router.post("/test-cases/:id/duplicate", (req: Request, res: Response) => {
  const duplicated = DevStoreService.duplicateTestCase(req.params.id as string);
  if (!duplicated) {
    return res.status(404).json({ success: false, message: "Test case not found" });
  }
  res.status(200).json({ success: true, data: duplicated });
});

// 6. Import / Export Config
router.get("/export", (req: Request, res: Response) => {
  const data = DevStoreService.getExportData();
  res.status(200).json({ success: true, data });
});

router.post("/import", (req: Request, res: Response) => {
  try {
    const data = req.body;
    DevStoreService.importData(data);
    res.status(200).json({ success: true, message: "Data imported successfully" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
