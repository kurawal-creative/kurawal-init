import { Elysia } from "elysia";
import { prisma } from "@/lib/prisma";
import { AppError } from "./error-handler";

/**
 * Middleware untuk validasi API Key dari header X-API-Key
 *
 * Usage:
 * .use(validateApiKey)
 */

export const validateApiKey = new Elysia()
    .derive(async ({ request }) => {
        const apiKey = request.headers.get("X-API-Key") || request.headers.get("x-api-key");

        if (!apiKey) {
            throw new AppError(401, "API Key is required. Please provide X-API-Key header.");
        }

        // Validasi API key di database
        const existingKey = await prisma.apiKey.findFirst({
            where: {
                key: apiKey,
            },
        });

        if (!existingKey) {
            throw new AppError(401, "Invalid API Key");
        }

        return {
            apiKey: existingKey,
        };
    });
