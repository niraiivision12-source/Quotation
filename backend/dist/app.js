"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const error_middleware_1 = require("./middlewares/error.middleware");
const dev_middleware_1 = require("./middlewares/dev.middleware");
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json({
    limit: '10mb'
}));
app.use(express_1.default.urlencoded({
    extended: true,
    limit: '10mb'
}));
app.use(dev_middleware_1.devRequestTracer);
app.use("/api", routes_1.default);
app.use(error_middleware_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map