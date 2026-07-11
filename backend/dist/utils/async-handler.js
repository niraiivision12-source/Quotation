"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = void 0;
const asyncHandler = (fn) => {
    const wrapped = (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
    wrapped.originalFn = fn;
    return wrapped;
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=async-handler.js.map