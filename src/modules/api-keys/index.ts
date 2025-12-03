import { Elysia } from "elysia";
import { ApiKeysService } from "./service";
import { ApiKeysModel } from "./model";
import { AppError } from "@/middlewares/error-handler";
import { authenticate } from "@/modules/auth/service";

/**
 * API Keys module
 *
 * Endpoints:
 *  - GET    /                 -> list all API keys
 *  - POST   /                 -> create a new API key
 *  - GET    /:id              -> get single API key
 *  - DELETE /:id              -> remove an API key
 */

export const apiKeys = new Elysia({ prefix: "/api/api-keys" })
    .use(authenticate)
    // List API keys
    .get(
        "/",
        async ({ query }) => {
            try {
                const page = parseInt(query.page || "1");
                const pageSize = parseInt(query.pageSize || "10");
                const apiKeys = await ApiKeysService.list(page, pageSize);
                return {
                    success: true,
                    data: apiKeys,
                };
            } catch (error) {
                if (error instanceof AppError) throw error;
                throw new AppError(500, error instanceof Error ? error.message : "Failed to list API keys");
            }
        },
        {
            response: [ApiKeysModel.listResponse],
            detail: {
                summary: "List API Keys",
                description: "Retrieve stored API keys with pagination",
                tags: ["Admin", "API Keys"],
            },
        },
    )

    // Create API key
    .post(
        "/",
        async ({ body }) => {
            try {
                const created = await ApiKeysService.create(body);
                return {
                    success: true,
                    data: created,
                };
            } catch (error) {
                if (error instanceof AppError) throw error;
                throw new AppError(500, error instanceof Error ? error.message : "Failed to create API key");
            }
        },
        {
            body: ApiKeysModel.createBody,
            response: ApiKeysModel.singleResponse,
            detail: {
                summary: "Create API Key",
                description: "Store a new API key",
                tags: ["Admin", "API Keys"],
            },
        },
    )

    // Get single API key by id
    .get(
        "/:id",
        async ({ params }) => {
            try {
                const apiKey = await ApiKeysService.findById(params.id);
                if (!apiKey) {
                    throw new AppError(404, "API key not found");
                }
                return {
                    success: true,
                    data: apiKey,
                };
            } catch (error) {
                if (error instanceof AppError) throw error;
                throw new AppError(500, error instanceof Error ? error.message : "Failed to get API key");
            }
        },
        {
            params: ApiKeysModel.params,
            response: ApiKeysModel.singleResponse,
            detail: {
                summary: "Get API Key",
                description: "Get a single stored API key",
                tags: ["Admin", "API Keys"],
            },
        },
    )

    // Delete API key
    .delete(
        "/:id",
        async ({ params }) => {
            try {
                await ApiKeysService.remove(params.id);
                return {
                    success: true,
                    message: "Deleted",
                };
            } catch (error) {
                if (error instanceof AppError) throw error;
                throw new AppError(500, error instanceof Error ? error.message : "Failed to delete API key");
            }
        },
        {
            params: ApiKeysModel.params,
            response: ApiKeysModel.deleteResponse,
            detail: {
                summary: "Delete API Key",
                description: "Remove a stored API key",
                tags: ["Admin", "API Keys"],
            },
        },
    );
