import { prisma } from "@/lib/prisma";
import { ApiKeyCreateBody } from "./model";
import { AppError } from "@/middlewares/error-handler";

/**
 * API Keys Service (Prisma-backed)
 */

export type ApiKeyDTO = {
    id: string;
    name: string;
    key: string;
    createdAt: string;
    updatedAt: string;
};

export type ApiKeyListPaginated = {
    data: ApiKeyDTO[];
    total: number;
    page: number;
    pageSize: number;
};

export abstract class ApiKeysService {
    /**
     * List stored API keys with pagination.
     */
    static async list(page: number = 1, pageSize: number = 10): Promise<ApiKeyListPaginated> {
        const skip = (page - 1) * pageSize;
        const [apiKeys, total] = await Promise.all([
            prisma.apiKey.findMany({
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    key: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            prisma.apiKey.count(),
        ]);

        return {
            data: apiKeys.map((a) => ({
                id: a.id,
                name: a.name,
                key: a.key,
                createdAt: a.createdAt.toISOString(),
                updatedAt: a.updatedAt.toISOString(),
            })),
            total,
            page,
            pageSize,
        };
    }

    /**
     * Create and store a new API key.
     */
    static async create(data: ApiKeyCreateBody): Promise<ApiKeyDTO> {
        const created = await prisma.apiKey.create({
            data: {
                name: data.name,
                key: data.key,
            },
        });

        return {
            id: created.id,
            name: created.name,
            key: created.key,
            createdAt: created.createdAt.toISOString(),
            updatedAt: created.updatedAt.toISOString(),
        };
    }

    /**
     * Find API key by id.
     */
    static async findById(id: string): Promise<ApiKeyDTO | null> {
        const apiKey = await prisma.apiKey.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                key: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!apiKey) return null;

        return {
            id: apiKey.id,
            name: apiKey.name,
            key: apiKey.key,
            createdAt: apiKey.createdAt.toISOString(),
            updatedAt: apiKey.updatedAt.toISOString(),
        };
    }

    /**
     * Remove an API key by id.
     */
    static async remove(id: string): Promise<void> {
        try {
            await prisma.apiKey.delete({
                where: { id },
            });
        } catch (err) {
            // Handle Prisma errors properly
            if (err && typeof err === "object" && "code" in err && err.code === "P2025") {
                return;
            }
            throw err;
        }
    }
}
