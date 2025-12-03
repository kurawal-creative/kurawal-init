import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "@/config";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const adapter = new PrismaNeon({ connectionString: config.database.url });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ 
    adapter,
    log: config.server.env === "development" 
        ? ["query", "error", "warn"] 
        : ["error"],
});

if (config.server.env !== "production") {
    globalForPrisma.prisma = prisma;
}
