import { prisma } from "@/lib/prisma";
import { GoogleAccountCreateBody } from "./model";
import { AppError } from "@/middlewares/error-handler";
import { getBrowser } from "@/lib/browser";
import { challengeStore } from "@/lib/challenge-store";
import path from "path";

/**
 * Helper functions for cookie serialization
 */

/**
 * Google Accounts Service (Prisma-backed)
 *
 * This implementation uses the application's Prisma client to persist GoogleAccount
 * records. It returns metadata only (password is stored but never returned).
 *
 * IMPORTANT:
 * - Ensure the Prisma model `GoogleAccount` exists and has fields:
 *   `id` (String @id @default(uuid())), `email` (String @unique), `password` (String),
 *   `createdAt` (DateTime), `updatedAt` (DateTime)
 *

 */

/* ---------------------------
 * DTO / internal types
 * --------------------------- */
export type GoogleAccountDTO = {
    id: string;
    email: string;
    cookie: string;
    createdAt: string;
    updatedAt: string;
};

export type GoogleAccountListPaginated = {
    data: GoogleAccountDTO[];
    total: number;
    page: number;
    pageSize: number;
};

/* ---------------------------
 * Service implementation
 * --------------------------- */
export abstract class GoogleAccountsService {
    /**
     * List stored accounts (metadata only) with pagination.
     * @param page - Page number (default: 1)
     * @param pageSize - Items per page (default: 10)
     */
    static async list(page: number = 1, pageSize: number = 10): Promise<GoogleAccountListPaginated> {
        const skip = (page - 1) * pageSize;
        const [accounts, total] = await Promise.all([
            prisma.googleAccount.findMany({
                where: {
                    cookie: {
                        not: "",
                    },
                },
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    email: true,
                    cookie: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            prisma.googleAccount.count({
                where: {
                    cookie: {
                        not: "",
                    },
                },
            }),
        ]);

        return {
            data: accounts.map((a) => ({
                id: a.id,
                email: a.email,
                cookie: a.cookie,
                createdAt: a.createdAt.toISOString(),
                updatedAt: a.updatedAt.toISOString(),
            })),
            total,
            page,
            pageSize,
        };
    }

    /**
     * Create and store a new Google account.
     * Returns the created account metadata.
     */
    static async create(data: GoogleAccountCreateBody): Promise<GoogleAccountDTO> {
        // Check for existing account by email
        const existing = await prisma.googleAccount.findUnique({
            where: { email: data.email },
            select: { id: true },
        });

        if (existing) {
            throw new AppError(409, "Email already registered");
        }

        // Otomatis login Google dan ambil cookie via browser pool
        const { email } = data;

        const browser = await getBrowser(path.join(process.cwd(), "user-data1"));
        const page = await browser.newPage();
        try {
            const client = await page.target().createCDPSession();
            await client.send("Network.clearBrowserCookies");
            await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 OPR/124.0.0.0");
            await page.goto("https://aistudio.google.com/prompts/new_chat?model=gemini-2.5-flash-image", { waitUntil: "domcontentloaded" });

            await (await page.waitForSelector('input[type="email"]', { visible: true }))?.type(email);
            await page.keyboard.press("Enter");

            await (await page.waitForSelector(".textarea", { visible: true, timeout: 0 }))?.type("coba kamu bilang 'ya'");
            await page.click(".run-button");
            await page.waitForSelector(".mat-icon", { hidden: true });
            await page.waitForSelector(".mat-icon", { visible: true });

            const cookies = await page.cookies();
            const cookie = JSON.stringify(cookies);

            // Simpan ke database dengan password kosong (karena login otomatis via browser)
            const created = await prisma.googleAccount.create({
                data: {
                    email,
                    password: "",
                    cookie,
                },
            });

            return {
                id: created.id,
                email: created.email,
                cookie: created.cookie,
                createdAt: created.createdAt.toISOString(),
                updatedAt: created.updatedAt.toISOString(),
            };
        } finally {
            await browser.close();
        }
    }

    /**
     * Find account by id (metadata only).
     */
    static async findById(id: string): Promise<GoogleAccountDTO | null> {
        const account = await prisma.googleAccount.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                cookie: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!account) return null;

        return {
            id: account.id,
            email: account.email,
            cookie: account.cookie,
            createdAt: account.createdAt.toISOString(),
            updatedAt: account.updatedAt.toISOString(),
        };
    }

    /**
     * Remove an account by id.
     */
    static async remove(id: string): Promise<void> {
        try {
            await prisma.googleAccount.delete({
                where: { id },
            });
        } catch (err: any) {
            // If not found, prisma throws an error; normalize to no-op or rethrow as not found
            if (err?.code === "P2025") {
                // Record not found, treat as no-op
                return;
            }
            throw err;
        }
    }

    /**
     * Check Google account cookie validity.
     * Jika cookie masih valid, update cookie. Jika expired, throw error.
     * @param id - Account ID
     * @returns Updated cookie
     */
    static async relogin(id: string): Promise<GoogleAccountDTO> {
        // Get account
        const account = await prisma.googleAccount.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                cookie: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!account) {
            throw new AppError(404, "Account not found");
        }

        const { email, cookie: oldCookie } = account;
        let cookieJson = oldCookie;

        const browser = await getBrowser();
        const page = await browser.newPage();
        try {
            await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 OPR/124.0.0.0");

            // Try menggunakan cookie yang tersimpan dulu
            try {
                const cookies = JSON.parse(oldCookie);
                for (const cookie of cookies) {
                    await page.setCookie(cookie);
                }
                await page.goto("https://myaccount.google.com", { waitUntil: "networkidle2" });

                // Cek apakah cookie masih valid (tidak redirect ke login)
                const currentUrl = page.url();
                if (currentUrl.includes("myaccount.google.com")) {
                    console.log(`✅ Cookie masih valid untuk ${email}`);
                    // Update cookie yang mungkin berubah
                    const newCookies = await page.cookies();
                    cookieJson = JSON.stringify(newCookies);
                } else {
                    throw new AppError(401, "Cookie expired, perlu login manual");
                }
            } catch (error) {
                throw new AppError(401, "Cookie invalid, perlu login manual");
            }
        } finally {
            await page.close();
        }

        // Update cookie di database
        const updated = await prisma.googleAccount.update({
            where: { id },
            data: { cookie: cookieJson },
        });

        return {
            id: updated.id,
            email: updated.email,
            cookie: updated.cookie,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
        };
    }

    /**
     * Internal util: clear store (useful for tests).
     * WARNING: this will delete all GoogleAccount rows in the database.
     */
    static async _clearForTests(): Promise<void> {
        await prisma.googleAccount.deleteMany({});
    }
}
