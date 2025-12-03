import { Elysia } from "elysia";
import { config } from "@/config";

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public isOperational: boolean = true,
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export const errorHandler = new Elysia({ name: "error-handler" })
    .error({
        APP_ERROR: AppError,
    })
    .onError({ as: "global" }, ({ code, error, set }) => {
        console.error(`[Error] ${code}:`, error);

        if (error instanceof AppError) {
            set.status = error.statusCode;
            return {
                success: false,
                error: error.message,
            };
        }

        // Handle validation errors from Elysia
        if (code === "VALIDATION") {
            set.status = 400;
            return {
                success: false,
                error: "Validation failed",
                details: config.server.env === "development" ? error.message : undefined,
            };
        }

        // Handle not found
        if (code === "NOT_FOUND") {
            set.status = 404;
            return {
                success: false,
                error: "Resource not found",
            };
        }

        // Generic error handler
        set.status = 500;
        return {
            success: false,
            error: config.server.env === "development" ? (error as Error).message : "Internal server error",
        };
    });
