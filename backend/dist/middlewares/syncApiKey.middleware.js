"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncApiKeyMiddleware = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const syncApiKeyMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({
            success: false,
            message: 'Missing Authorization header',
        });
        return;
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        res.status(401).json({
            success: false,
            message: 'Invalid Authorization format',
        });
        return;
    }
    const token = parts[1];
    const expectedKey = env_1.env.SYNC_API_KEY;
    if (!expectedKey) {
        console.error('SYNC_API_KEY is not configured');
        res.status(500).json({ success: false, message: 'Internal server error' });
        return;
    }
    const tokenBuffer = Buffer.from(token);
    const expectedBuffer = Buffer.from(expectedKey);
    let match = false;
    if (tokenBuffer.length === expectedBuffer.length) {
        match = crypto_1.default.timingSafeEqual(tokenBuffer, expectedBuffer);
    }
    else {
        // Perform timing-safe comparison on equal length buffers to avoid early return timing attack
        crypto_1.default.timingSafeEqual(expectedBuffer, expectedBuffer);
        match = false;
    }
    if (!match) {
        console.warn('Invalid Sync API authentication');
        res.status(401).json({
            success: false,
            message: 'Invalid API key',
        });
        return;
    }
    next();
};
exports.syncApiKeyMiddleware = syncApiKeyMiddleware;
//# sourceMappingURL=syncApiKey.middleware.js.map