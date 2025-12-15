import { Page } from "puppeteer-core";
import { getBrowser } from "@/lib/browser";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { decrypt } from "@/lib/encryption";
import { getRandomProxy } from "@/lib/proxy";

/**
 * Helper functions for cookie serialization
 */

interface CookieData {
    name: string;
    value: string;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
}

function serializeCookies(cookies: CookieData[]): string {
    return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

function parseCookies(cookieString: string): CookieData[] {
    return cookieString.split(";").map((c) => {
        const [name, value] = c.trim().split("=");
        return {
            name: name.trim(),
            value: value ? value.trim() : "",
            domain: ".google.com",
            path: "/",
            secure: true,
            httpOnly: false,
        };
    });
}

export interface ImageGenerationOptions {
    imagePath?: string;
    prompt: string;
}

export class GeminiService {
    private static readonly GEMINI_URL = Buffer.from("aHR0cHM6Ly9haXN0dWRpby5nb29nbGUuY29tL3Byb21wdHMvbmV3X2NoYXQ/bW9kZWw9Z2VtaW5pLTIuNS1mbGFzaC1pbWFnZQ==", "base64").toString("utf8");

    private static readonly TIMEOUT = 60000;
    private static readonly USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 OPR/124.0.0.0";

    private static readonly TEMP_DIR = path.join(process.cwd(), "temp");

    private static ensureTempDir(): void {
        if (!fs.existsSync(this.TEMP_DIR)) {
            fs.mkdirSync(this.TEMP_DIR, { recursive: true });
        }
    }

    private static async saveTempFile(file: File): Promise<string> {
        this.ensureTempDir();

        const filename = `upload_${Date.now()}_${file.name}`;
        const filePath = path.join(this.TEMP_DIR, filename);
        const buffer = Buffer.from(await file.arrayBuffer());

        fs.writeFileSync(filePath, buffer);

        return filePath;
    }

    private static cleanupTempFile(filePath: string): void {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error("Error cleaning up temp file:", error);
        }
    }

    static async generateImage(image: File | undefined, prompt: string): Promise<Buffer | string> {
        let tempPath: string | null = null;

        try {
            if (image) {
                tempPath = await this.saveTempFile(image);
            }
            const response = await this.generateImageFromPath({
                imagePath: tempPath || undefined,
                prompt,
            });
            return response;
        } finally {
            if (tempPath) {
                this.cleanupTempFile(tempPath);
            }
        }
    }

    private static async generateImageFromPath(options: ImageGenerationOptions): Promise<Buffer | string> {
        // Get Google Account dengan count terendah dan updatedAt terlama
        const account = await prisma.googleAccount.findFirst({
            where: {
                cookie: {
                    not: "",
                },
            },
            orderBy: [{ count: "asc" }, { updatedAt: "asc" }],
        });

        if (!account) {
            throw new Error("No Google Account available. Please add a Google Account first.");
        }

        console.log(`🔑 Using Google Account: ${account.email} (count: ${account.count})`);

        // Ambil proxy random dari Webshare
        const proxy = await getRandomProxy();
        console.log(`[PROXY] Menggunakan proxy: ${proxy.proxy_address}:${proxy.port} (user: ${proxy.username})`);

        const browser = await getBrowser(undefined, proxy);

        const context = await browser.createBrowserContext();

        const page = await context.newPage();

        // Set proxy authentication jika perlu
        if (proxy.username && proxy.password) {
            await page.authenticate({
                username: proxy.username,
                password: proxy.password,
            });
        }

        try {
            // Load cookie dari database

            await page.setUserAgent(this.USER_AGENT);

            try {
                const cookies = JSON.parse(account.cookie);
                await page.setCookie(...cookies);
                console.log(`✅ Cookie loaded for ${account.email}`);
            } catch (error) {
                console.error("Error loading cookie:", error);
                throw new Error("Failed to load Google Account cookie");
            }

            await page.goto(GeminiService.GEMINI_URL);

            await GeminiService.dismissWelcome(page);
            if (options.imagePath) {
                await GeminiService.uploadImage(page, options.imagePath);
            }
            await GeminiService.submitPrompt(page, options.prompt);
            await GeminiService.waitForGeneration(page);

            const response = await GeminiService.extractImage(page);

            if (!response) {
                throw new Error("Failed to generate response - no result found");
            }

            // Ambil cookie terbaru setelah generate
            const newCookies = await page.cookies();
            const cookieJson = JSON.stringify(newCookies);

            // Increment count dan update cookie setelah berhasil generate
            await prisma.googleAccount.update({
                where: { id: account.id },
                data: {
                    count: { increment: 1 },
                    cookie: cookieJson,
                    updatedAt: new Date(),
                },
            });
            console.log(`📊 Updated count for ${account.email}: ${account.count} → ${account.count + 1}`);
            console.log(`🍪 Cookie updated for ${account.email}`);

            return response;
        } finally {
            await page.close();
        }
    }

    private static async dismissWelcome(page: Page): Promise<void> {
        try {
            await page.waitForSelector("button.ms-button-primary", { timeout: 5000 });
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll("button.ms-button-primary"));
                const gotItButton = buttons.find((btn) => btn.textContent?.trim() === "Got it");
                if (gotItButton) {
                    (gotItButton as HTMLElement).click();
                }
            });
            await new Promise((resolve) => setTimeout(resolve, 500));
        } catch {
            // Welcome dialog not present
        }
    }

    private static async uploadImage(page: Page, imagePath: string): Promise<void> {
        do {
            const button = await page.waitForSelector('button[aria-label*="Insert "]');
            if (button) {
                await button.click({ delay: 100 });
            }

            try {
                await (
                    await page.waitForSelector('button[aria-label*="Agree "]', {
                        timeout: 2000,
                    })
                )?.click();
            } catch (e) {}
        } while (
            await page.evaluate(() => {
                const btn = document.querySelector('button[aria-label*="Insert "]');
                return btn && btn.getAttribute("aria-expanded") === "false";
            })
        );

        const fileElement = await page.waitForSelector('input[type="file"]');
        if (fileElement) {
            await fileElement.uploadFile(imagePath);
        } else {
            throw new Error("File input element not found");
        }
    }

    private static async submitPrompt(page: Page, prompt: string): Promise<void> {
        const textareaSelector = ".textarea";
        await page.waitForSelector(textareaSelector);
        await page.type(textareaSelector, prompt);

        await page.waitForSelector(".mat-icon");

        do {
            await page.click(".mat-icon", { delay: 700 }).catch(() => {});
        } while (
            await page
                .evaluate(() => document.querySelector(".mat-icon")) //
                .then((el) => !!el)
        );
    }

    private static async waitForGeneration(page: Page): Promise<void> {
        try {
            await page.waitForSelector(".mat-icon", {
                hidden: true,
                timeout: 10000,
            });

            await page.waitForSelector(".mat-icon", {
                visible: true,
                timeout: GeminiService.TIMEOUT,
            });
        } catch (error) {
            console.warn("Timeout waiting for generation button state, checking for result...");
        }
    }

    private static async extractImage(page: Page): Promise<Buffer | string | null> {
        const maxAttempts = 5;
        let imgSrc: string | null = null;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            imgSrc = await page.evaluate(() => {
                const div = document.querySelector("div.chat-session-content");
                if (div && div.children.length > 1) {
                    const secondLast = div.children[div.children.length - 2] as HTMLElement;
                    const img = secondLast.querySelector("img");
                    return img ? img.src : null;
                }
                return null;
            });

            if (imgSrc && typeof imgSrc === "string" && imgSrc.startsWith("data:image/")) {
                const parts = imgSrc.split(",");
                if (parts.length > 1) {
                    return Buffer.from(parts[1], "base64");
                }
            }

            // Jika sudah dapat img, break
            if (imgSrc) break;

            // Tunggu 1 detik sebelum mencoba lagi
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Jika tidak ada image, baru extract text
        if (!imgSrc) {
            const text = await page.evaluate(() => {
                const div = document.querySelector("div.chat-session-content");
                if (div && div.children.length > 1) {
                    const secondLast = div.children[div.children.length - 2] as HTMLElement;
                    const span = secondLast.querySelector(".model-prompt-container span");
                    return span ? span.textContent?.trim() : secondLast.textContent?.trim();
                }
                return null;
            });

            if (text) {
                return text;
            }
        }

        return null;
    }
}
