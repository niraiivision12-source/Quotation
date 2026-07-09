import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { AppError } from "@/utils/app-error";
import { devLocalStorage } from "@/utils/async-storage";

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const store = devLocalStorage.getStore();
  if (store) {
    store.error = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      raw: error,
    };
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues,
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  console.error(error);

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};

