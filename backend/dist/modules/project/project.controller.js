"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectController = void 0;
const project_service_1 = require("@/modules/project/project.service");
const project_validation_1 = require("@/modules/project/project.validation");
class ProjectController {
    static async create(req, res) {
        const data = project_validation_1.createProjectSchema.parse(req.body);
        const project = await project_service_1.ProjectService.create(data);
        return res.status(201).json({
            success: true,
            message: "Project created",
            data: project,
        });
    }
    static async getAll(req, res) {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 20);
        const search = req.query.search?.toString();
        const projects = await project_service_1.ProjectService.getAll(page, limit, search);
        return res.status(200).json({
            success: true,
            message: "Projects fetched",
            data: projects,
        });
    }
    static async getById(req, res) {
        const project = await project_service_1.ProjectService.getById(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Project fetched",
            data: project,
        });
    }
    static async update(req, res) {
        const data = project_validation_1.updateProjectSchema.parse(req.body);
        const project = await project_service_1.ProjectService.update(req.params.id, data);
        return res.status(200).json({
            success: true,
            message: "Project updated",
            data: project,
        });
    }
    static async deactivate(req, res) {
        const project = await project_service_1.ProjectService.deactivate(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Project deactivated",
            data: project,
        });
    }
}
exports.ProjectController = ProjectController;
//# sourceMappingURL=project.controller.js.map