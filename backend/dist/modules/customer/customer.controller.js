"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const customer_service_1 = require("./customer.service");
const customer_validation_1 = require("./customer.validation");
class CustomerController {
    static async create(req, res) {
        const data = customer_validation_1.createCustomerSchema.parse(req.body);
        const customer = await customer_service_1.CustomerService.create(data);
        return res.status(201).json({
            success: true,
            message: "Customer created",
            data: customer,
        });
    }
    static async getAll(req, res) {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 20);
        const search = req.query.search?.toString();
        const customers = await customer_service_1.CustomerService.getAll(page, limit, search);
        return res.status(200).json({
            success: true,
            message: "Customers fetched",
            data: customers,
        });
    }
    static async getById(req, res) {
        const customer = await customer_service_1.CustomerService.getById(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Customer fetched",
            data: customer,
        });
    }
    static async update(req, res) {
        const data = customer_validation_1.updateCustomerSchema.parse(req.body);
        const customer = await customer_service_1.CustomerService.update(req.params.id, data);
        return res.status(200).json({
            success: true,
            message: "Customer updated",
            data: customer,
        });
    }
    static async deactivate(req, res) {
        const customer = await customer_service_1.CustomerService.deactivate(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Customer deactivated",
            data: customer,
        });
    }
}
exports.CustomerController = CustomerController;
//# sourceMappingURL=customer.controller.js.map