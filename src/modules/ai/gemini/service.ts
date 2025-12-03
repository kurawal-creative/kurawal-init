import { Page } from "puppeteer-core";
import { getBrowser } from "@/lib/browser";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { decrypt } from "@/lib/encryption";

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

    static async generateImage(image: File | undefined, prompt: string): Promise<Buffer> {
        let tempPath: string | null = null;

        try {
            if (image) {
                tempPath = await this.saveTempFile(image);
            }
            const imageBuffer = await this.generateImageFromPath({
                imagePath: tempPath || undefined,
                prompt,
            });
            return imageBuffer;
        } finally {
            if (tempPath) {
                this.cleanupTempFile(tempPath);
            }
        }
    }

    private static async generateImageFromPath(options: ImageGenerationOptions): Promise<Buffer> {
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

        const browser = await getBrowser();
        const page = await browser.newPage();
        try {
            // Load cookie dari database

            await page.setUserAgent({ userAgent: this.USER_AGENT });

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

            const imageBuffer = await GeminiService.extractImage(page);

            if (!imageBuffer) {
                throw new Error("Failed to generate image - no result found");
            }

            // Ambil cookie terbaru setelah generate
            // const newCookies = await page.cookies();
            // const cookieJson = serializeCookies(newCookies);

            // Increment count dan update cookie setelah berhasil generate
            await prisma.googleAccount.update({
                where: { id: account.id },
                data: {
                    count: { increment: 1 },
                    // cookie: cookieJson,
                    updatedAt: new Date(),
                },
            });
            console.log(`📊 Updated count for ${account.email}: ${account.count} → ${account.count + 1}`);
            // console.log(`🍪 Cookie updated for ${account.email}`);

            return imageBuffer;
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
        let uploadVisible = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!uploadVisible && attempts < maxAttempts) {
            try {
                await page.waitForSelector('button[aria-label="Upload File"]', {
                    visible: true,
                    timeout: 1000,
                });
                uploadVisible = true;
            } catch {
                try {
                    await page.waitForSelector('button[iconname="add_circle"]');
                    await page.click('button[iconname="add_circle"]');
                    await new Promise((resolve) => setTimeout(resolve, 500));
                } catch (error) {
                    console.error("Error clicking add button:", error);
                }
                attempts++;
            }
        }

        if (!uploadVisible) {
            throw new Error("Upload button not found after multiple attempts");
        }

        const [fileChooser] = await Promise.all([page.waitForFileChooser(), page.click('button[aria-label="Upload File"]')]);

        await fileChooser.accept([imagePath]);
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    private static async submitPrompt(page: Page, prompt: string): Promise<void> {
        const textareaSelector = ".textarea";
        await page.waitForSelector(textareaSelector);
        await page.type(textareaSelector, prompt);

        await page.waitForSelector('button[aria-label="Run"]');
        await page.click('button[aria-label="Run"]');
    }

    private static async waitForGeneration(page: Page): Promise<void> {
        try {
            await page.waitForSelector('button[aria-label="Run"][aria-disabled="true"]', {
                visible: true,
                timeout: 10000,
            });

            await page.waitForSelector('button[aria-label="Run"][aria-disabled="false"]', {
                visible: true,
                timeout: GeminiService.TIMEOUT,
            });
        } catch (error) {
            console.warn("Timeout waiting for generation button state, checking for result...");
        }
    }

    private static async extractImage(page: Page): Promise<Buffer | null> {
        const startTime = Date.now();

        while (Date.now() - startTime < GeminiService.TIMEOUT) {
            const imgSrc = await page.evaluate(() => {
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

            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        return null;
    }
}
