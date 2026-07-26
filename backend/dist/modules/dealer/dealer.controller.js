"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealerController = void 0;
const dealer_service_1 = require("./dealer.service");
const dealer_validation_1 = require("./dealer.validation");
class DealerController {
    static async create(req, res) {
        const data = dealer_validation_1.createDealerSchema.parse(req.body);
        const dealer = await dealer_service_1.DealerService.create(data);
        return res.status(201).json({
            success: true,
            message: "Dealer created successfully",
            data: dealer,
        });
    }
    static async getAll(req, res) {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 20);
        const search = req.query.search?.toString();
        const result = await dealer_service_1.DealerService.getAll(page, limit, search);
        return res.status(200).json({
            success: true,
            message: "Dealers fetched successfully",
            data: result,
        });
    }
    static async getById(req, res) {
        const dealer = await dealer_service_1.DealerService.getById(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Dealer fetched successfully",
            data: dealer,
        });
    }
    static async update(req, res) {
        const data = dealer_validation_1.updateDealerSchema.parse(req.body);
        const dealer = await dealer_service_1.DealerService.update(req.params.id, data);
        return res.status(200).json({
            success: true,
            message: "Dealer updated successfully",
            data: dealer,
        });
    }
    static async deactivate(req, res) {
        const dealer = await dealer_service_1.DealerService.deactivate(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Dealer deactivated successfully",
            data: dealer,
        });
    }
}
exports.DealerController = DealerController;
//# sourceMappingURL=dealer.controller.js.map