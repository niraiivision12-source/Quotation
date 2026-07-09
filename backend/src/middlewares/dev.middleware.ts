import { NextFunction, Request, Response } from "express";
import { devLocalStorage, DevRequestStore } from "../utils/async-storage";
import { DevStoreService } from "../modules/dev/dev-store.service";
import { prisma } from "../lib/prisma";

export const devRequestTracer = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Only trace /api/ routes, skip the /api/dev/ calls to avoid logging history of developer tools queries
  if (!req.path.startsWith("/api") && !req.baseUrl.startsWith("/api")) {
    return next();
  }
  if (
    req.path.startsWith("/api/dev") ||
    req.baseUrl.startsWith("/api/dev") ||
    req.path.includes("/dev/") ||
    req.baseUrl.includes("/dev/")
  ) {
    return next();
  }

  const requestId = crypto.randomUUID();
  const store: DevRequestStore = {
    requestId,
    sqlQueries: [],
  };

  devLocalStorage.run(store, () => {
    const startTime = process.hrtime();

    // Intercept response
    const originalSend = res.send;
    let responseBody: any = null;

    res.send = function (body: any): Response {
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
        } catch {
          // ignore
        }
      }

      // Find user details if authenticated
      let userDetails: any = null;
      if (req.user) {
        try {
          const u = await prisma.user.findUnique({
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
        } catch (err) {
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

      const endpoint = `${req.baseUrl || ""}${req.path || ""}`.replace(
        /\/+/g,
        "/",
      );

      // Log history
      DevStoreService.addHistoryEntry({
        endpoint,
        method: req.method,
        status: res.statusCode,
        duration: durationMs,
        requestHeaders: req.headers as Record<string, string>,
        requestPayload: req.body,
        responseHeaders: res.getHeaders() as Record<string, string>,
        responsePayload: parsedResponse,
        sqlQueries,
        error: store.error
          ? {
              message: store.error.message,
              name: store.error.name,
              stack:
                process.env.NODE_ENV !== "production"
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
