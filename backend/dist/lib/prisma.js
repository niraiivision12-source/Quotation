"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const async_storage_1 = require("../utils/async-storage");
const globalForPrisma = global;
exports.prisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        log: [
            { emit: "event", level: "query" },
            { emit: "stdout", level: "error" },
            { emit: "stdout", level: "info" },
            { emit: "stdout", level: "warn" },
        ],
    });
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
if (typeof exports.prisma.$on === "function") {
    exports.prisma.$on("query", (e) => {
        const store = async_storage_1.devLocalStorage.getStore();
        if (store) {
            store.sqlQueries.push({
                query: e.query,
                params: e.params,
                duration: e.duration,
                timestamp: new Date(),
            });
        }
    });
}
//# sourceMappingURL=prisma.js.map