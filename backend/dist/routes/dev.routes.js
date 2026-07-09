"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../config/prisma");
const env_1 = require("../config/env");
const dev_store_service_1 = require("../modules/dev/dev-store.service");
const dev_metadata_1 = require("./dev-metadata");
const router = (0, express_1.Router)();
// Helper to recursively walk the Express router stack and collect endpoints
function discoverExpressEndpoints(app) {
    const routes = [];
    function walk(layer, prefix = "") {
        if (layer.route) {
            const path = (prefix + layer.route.path).replace(/\/+/g, "/");
            const methods = Object.keys(layer.route.methods).map((m) => m.toUpperCase());
            methods.forEach((method) => {
                routes.push({ method, path });
            });
        }
        else if (layer.name === "router" && layer.handle && layer.handle.stack) {
            let subPrefix = "";
            if (layer.regexp) {
                // Try to parse prefix from regex
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
            layer.handle.stack.forEach((subLayer) => {
                walk(subLayer, prefix + subPrefix);
            });
        }
    }
    const routerObj = app._router || app;
    if (routerObj && routerObj.stack) {
        routerObj.stack.forEach((layer) => {
            walk(layer);
        });
    }
    // Deduplicate
    const seen = new Set();
    return routes.filter((r) => {
        const key = `${r.method} ${r.path}`;
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
}
// 1. Endpoint Discovery API
router.get("/endpoints", async (req, res, next) => {
    try {
        const rawEndpoints = discoverExpressEndpoints(req.app);
        const endpoints = rawEndpoints.map((item) => {
            const id = `${item.method} ${item.path}`;
            const metadata = dev_metadata_1.ENDPOINT_METADATA[id] || {
                module: item.path.split("/")[2] || "Other",
                description: `Discovered endpoint ${item.method} ${item.path}`,
                authRequired: item.path.startsWith("/api/auth/login") ? false : true,
                controller: "DynamicController",
                serviceMethod: "DynamicService",
            };
            // Ensure proper capitalization for dynamic modules
            let moduleName = metadata.module;
            if (moduleName.length > 0) {
                moduleName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
            }
            // Extract path variables
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
            return {
                id,
                method: item.method,
                route: item.path,
                module: moduleName,
                description: metadata.description,
                authRequired: metadata.authRequired,
                requiredRoles: metadata.requiredRoles || [],
                controller: metadata.controller,
                serviceMethod: metadata.serviceMethod,
                pathParams,
                queryParams: metadata.queryParams || [],
                headers: metadata.headers || [],
                requestSchema: metadata.requestSchema || null,
                validationRules: metadata.validationRules || [],
                exampleRequest: metadata.exampleRequest || null,
                exampleResponse: metadata.exampleResponse || null,
                errorResponses: metadata.errorResponses || [],
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