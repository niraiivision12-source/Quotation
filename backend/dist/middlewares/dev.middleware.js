"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.devRequestTracer = void 0;
const async_storage_1 = require("../utils/async-storage");
const dev_store_service_1 = require("../modules/dev/dev-store.service");
const prisma_1 = require("../lib/prisma");
const devRequestTracer = (req, res, next) => {
    // Only trace /api/ routes, skip the /api/dev/ calls to avoid logging history of developer tools queries
    if (!req.path.startsWith("/api") && !req.baseUrl.startsWith("/api")) {
        return next();
    }
    if (req.path.startsWith("/api/dev") ||
        req.baseUrl.startsWith("/api/dev") ||
        req.path.includes("/dev/") ||
        req.baseUrl.includes("/dev/")) {
        return next();
    }
    const requestId = crypto.randomUUID();
    const store = {
        requestId,
        sqlQueries: [],
    };
    async_storage_1.devLocalStorage.run(store, () => {
        const startTime = process.hrtime();
        // Intercept response
        const originalSend = res.send;
        let responseBody = null;
        res.send = function (body) {
            responseBody = body;
            return originalSend.call(this, body);
        };
        res.on("finish", async () => {
            const diff = process.hrtime(startTime);
            const durationMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);
            // Try to parse response body if it's JSON
            let parsedResponse = responseBody;
            if (typeof responseBody === "string") {
                try {
                    parsedResponse = JSON.parse(responseBody);
                }
                catch {
                    // ignore
                }
            }
            // Find user details if authenticated
            let userDetails = null;
            if (req.user) {
                try {
                    const u = await prisma_1.prisma.user.findUnique({
                        where: { id: req.user.id },
                        select: { id: true, name: true, email: true, role: true },
                    });
                    if (u) {
                        userDetails = {
                            id: u.id,
                            name: u.name,
                            email: u.email,
                            role: u.role,
                        };
                    }
                }
                catch (err) {
                    console.error("Error fetching user for dev logger:", err);
                }
            }
            // SQL queries log
            const sqlQueries = store.sqlQueries.map((q) => ({
                query: q.query,
                params: q.params,
                duration: q.duration,
                timestamp: q.timestamp.toISOString(),
            }));
            const endpoint = `${req.baseUrl || ""}${req.path || ""}`.replace(/\/+/g, "/");
            // Log history
            dev_store_service_1.DevStoreService.addHistoryEntry({
                endpoint,
                method: req.method,
                status: res.statusCode,
                duration: durationMs,
                requestHeaders: req.headers,
                requestPayload: req.body,
                responseHeaders: res.getHeaders(),
                responsePayload: parsedResponse,
                sqlQueries,
                error: store.error
                    ? {
                        message: store.error.message,
                        name: store.error.name,
                        stack: process.env.NODE_ENV !== "production"
                            ? store.error.stack
                            : undefined,
                    }
                    : null,
                user: userDetails,
            });
        });
        next();
    });
};
exports.devRequestTracer = devRequestTracer;
//# sourceMappingURL=dev.middleware.js.map