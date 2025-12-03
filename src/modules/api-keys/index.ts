import { Elysia } from "elysia";
import { ApiKeysService } from "./service";
import { ApiKeysModel } from "./model";
import { AppError } from "@/middlewares/error-handler";
import { jwtPlugin } from "@/modules/auth/service";

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
    .use(jwtPlugin)
    // List API keys
    .get(
        "/",
        async ({ query, jwt, headers }) => {
            try {
                // Verify JWT
                const authHeader = headers.authorization;
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    throw new AppError(401, "Unauthorized");
                }
                const token = authHeader.replace("Bearer ", "");
                const payload = await jwt.verify(token);
                if (!payload) {
                    throw new AppError(401, "Invalid token");
                }

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
        async ({ body, jwt, headers }) => {
            try {
                // Verify JWT
                const authHeader = headers.authorization;
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    throw new AppError(401, "Unauthorized");
                }
                const token = authHeader.replace("Bearer ", "");
                const payload = await jwt.verify(token);
                if (!payload) {
                    throw new AppError(401, "Invalid token");
                }

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
        async ({ params, jwt, headers }) => {
            try {
                // Verify JWT
                const authHeader = headers.authorization;
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    throw new AppError(401, "Unauthorized");
                }
                const token = authHeader.replace("Bearer ", "");
                const payload = await jwt.verify(token);
                if (!payload) {
                    throw new AppError(401, "Invalid token");
                }

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
        async ({ params, jwt, headers }) => {
            try {
                // Verify JWT
                const authHeader = headers.authorization;
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    throw new AppError(401, "Unauthorized");
                }
                const token = authHeader.replace("Bearer ", "");
                const payload = await jwt.verify(token);
                if (!payload) {
                    throw new AppError(401, "Invalid token");
                }

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
