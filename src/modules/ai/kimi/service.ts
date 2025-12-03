import { Page } from "puppeteer-core";
import { getBrowser } from "@/lib/browser";
import { config } from "@/config";
import { EventEmitter } from "events";

export interface KimiStreamEvent {
    html: string;
    isComplete: boolean;
    progress: number;
}

export class KimiService extends EventEmitter {
    private static readonly KIMI_URL = "https://kimi.com";
    private static readonly TEXTBOX_SELECTOR = 'div[role="textbox"]';
    private static readonly SEND_BUTTON_SELECTOR = 'svg[name="Send"]';
    private static readonly MARKDOWN_SELECTOR = ".markdown:last-child";
    private static readonly SEGMENT_SELECTOR = ".segment-assistant";

    private page: Page | null = null;

    // Non-streaming version - return full HTML
    static async query(query: string): Promise<string> {
        const browser = await getBrowser();
        const page = await browser.newPage();
        try {
            await KimiService.navigateAndQuery(page, query);
            await KimiService.waitForCompletion(page);
            return await KimiService.extractHTML(page);
        } finally {
            await page.close();
        }
    }

    // Streaming version with EventEmitter
    async queryStream(query: string): Promise<void> {
        const browser = await getBrowser();
        this.page = await browser.newPage();
        try {
            await KimiService.navigateAndQuery(this.page, query);
            await this.streamResponse(this.page);
        } catch (error) {
            await this.cleanup();
            throw error;
        }
    }

    // Cleanup method to close page
    async cleanup(): Promise<void> {
        if (this.page && !this.page.isClosed()) {
            await this.page.close();
            this.page = null;
            console.log("✅ Page closed");
        }
    }

    private static async navigateAndQuery(page: Page, query: string): Promise<void> {
        await page.goto(this.KIMI_URL, { waitUntil: "networkidle0" });

        await page.waitForSelector(this.TEXTBOX_SELECTOR, { timeout: 10000 });
        await page.type(this.TEXTBOX_SELECTOR, query);
        await page.keyboard.press("Enter");

        // Wait for send button to disappear (query submitted)
        await page.waitForSelector(this.SEND_BUTTON_SELECTOR, {
            hidden: true,
            timeout: 5000,
        });
    }

    private async streamResponse(page: Page): Promise<void> {
        const initialCount = await page.evaluate((selector) => {
            return document.querySelectorAll(selector).length;
        }, KimiService.SEGMENT_SELECTOR);

        const targetCount = initialCount + 1;

        // Wait for new segment to appear
        await page.waitForFunction(
            ({ selector, target }) => {
                return document.querySelectorAll(selector).length === target;
            },
            { timeout: 10000 },
            { selector: KimiService.SEGMENT_SELECTOR, target: targetCount },
        );

        let lastContent = "";
        let consecutiveSameCount = 0;
        const maxSameCount = 5;
        const pollInterval = 200;
        const maxIterations = Math.floor(config.browser.timeout / pollInterval);

        for (let i = 0; i < maxIterations; i++) {
            try {
                const currentHtml = await KimiService.extractHTML(page);
                const isComplete = await KimiService.checkCompletion(page);

                // Emit update if content changed
                if (currentHtml !== lastContent && currentHtml.trim() !== "") {
                    const event: KimiStreamEvent = {
                        html: currentHtml,
                        isComplete,
                        progress: isComplete ? 100 : Math.min(95, (i / maxIterations) * 100),
                    };

                    this.emit("chunk", event);

                    lastContent = currentHtml;
                    consecutiveSameCount = 0;
                } else {
                    consecutiveSameCount++;
                }

                // Exit conditions
                if (isComplete) {
                    console.log("✅ Kimi response complete");
                    this.emit("end");
                    break;
                }

                if (consecutiveSameCount >= maxSameCount && lastContent !== "") {
                    console.log("⚠️ Content unchanged, assuming complete");
                    this.emit("end");
                    break;
                }

                await new Promise((resolve) => setTimeout(resolve, pollInterval));
            } catch (error) {
                console.error("Error during streaming:", error);
                this.emit("error", error);
                throw error;
            }
        }
    }

    private static async waitForCompletion(page: Page): Promise<void> {
        const initialCount = await page.evaluate((selector) => {
            return document.querySelectorAll(selector).length;
        }, KimiService.SEGMENT_SELECTOR);

        // Wait for new segment
        await page.waitForFunction(
            ({ selector, target }) => {
                return document.querySelectorAll(selector).length === target;
            },
            { timeout: 10000 },
            { selector: KimiService.SEGMENT_SELECTOR, target: initialCount + 1 },
        );

        // Wait for send button to reappear (response complete)
        await page.waitForSelector(KimiService.SEND_BUTTON_SELECTOR, {
            visible: true,
            timeout: config.browser.timeout,
        });
    }

    private static async checkCompletion(page: Page): Promise<boolean> {
        return page.evaluate((selector) => {
            const sendBtn = document.querySelector(selector) as HTMLElement;
            return sendBtn && sendBtn.offsetParent !== null;
        }, KimiService.SEND_BUTTON_SELECTOR);
    }

    private static async extractHTML(page: Page): Promise<string> {
        return page.evaluate((selector) => {
            const el = document.querySelector(selector);
            return el ? el.outerHTML : "";
        }, KimiService.MARKDOWN_SELECTOR);
    }
}
