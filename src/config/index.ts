import { z } from "zod";

const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
    PORT: z.string().default("3000"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PUPPETEER_EXECUTABLE_PATH: z.string().optional(),
    HEADLESS: z.string().default("true"),
});

const parseEnv = () => {
    const result = envSchema.safeParse(process.env);
    
    if (!result.success) {
        console.error("❌ Invalid environment variables:");
        console.error(result.error.flatten().fieldErrors);
        throw new Error("Invalid environment variables");
    }
    
    return result.data;
};

export const config = {
    database: {
        url: process.env.DATABASE_URL!,
    },
    jwt: {
        secret: process.env.JWT_SECRET!,
    },
    server: {
        port: parseInt(process.env.PORT || "3000"),
        env: process.env.NODE_ENV || "development",
    },
    puppeteer: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        headless: process.env.HEADLESS === "true",
    },
    browser: {
        poolSize: 3, // Max concurrent browser instances
        timeout: 40000, // Default timeout for operations
    },
    sse: {
        heartbeatInterval: 30000, // 30 seconds
        maxDuration: 300000, // 5 minutes max
    },
} as const;

// Validate on import
try {
    parseEnv();
} catch (error) {
    // Config validation will throw, handled above
}
