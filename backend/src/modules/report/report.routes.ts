import { Router } from "express";
import { ReportController } from "./report.controller";

const router = Router();

router.get("/summary", ReportController.getSummary);

export default router;
