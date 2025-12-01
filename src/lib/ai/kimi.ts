import { getBrowser } from "@/lib/browser";

export interface KimiResult {
    html: string;
}

// Non-stream: Return HTML langsung
export async function queryKimi(query: string = "Hello"): Promise<string> {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        await page.goto("https://kimi.com");
        await page.type('div[role="textbox"]', query);
        await page.keyboard.press("Enter");

        const i = await page.evaluate(() => document.querySelectorAll(".segment-assistant").length);
        await page.waitForSelector('svg[name="Send"]', { hidden: true });

        await page.waitForFunction(({ target }) => document.querySelectorAll(".segment-assistant").length === target, {}, { target: i + 1 });

        await page.waitForSelector('svg[name="Send"]', { visible: true, timeout: 300_000 });

        const html = await page.evaluate(() => {
            const el = document.querySelector(".markdown:last-child");
            return el ? el.outerHTML : "";
        });

        return html;
    } finally {
        await page.close();
    }
}

// Stream dengan Callback Pattern: Push data via callback
export async function queryKimiStream(query: string = "Hello", onChunk: (html: string) => void): Promise<void> {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        await page.goto("https://kimi.com");
        await page.type('div[role="textbox"]', query);
        await page.keyboard.press("Enter");

        const i = await page.evaluate(() => document.querySelectorAll(".segment-assistant").length);
        await page.waitForSelector('svg[name="Send"]', { hidden: true });

        await page.waitForFunction(({ target }) => document.querySelectorAll(".segment-assistant").length === target, {}, { target: i + 1 });

        let lastContent = "";
        let isComplete = false;

        while (!isComplete) {
            const currentHtml = await page.evaluate(() => {
                const el = document.querySelector(".markdown:last-child");
                return el ? el.outerHTML : "";
            });

            if (currentHtml !== lastContent) {
                lastContent = currentHtml;
                onChunk(currentHtml); // Push data via callback
            }

            isComplete = await page.evaluate(() => {
                const sendBtn = document.querySelector('svg[name="Send"]') as HTMLElement;
                return sendBtn && sendBtn.offsetParent !== null;
            });

            if (!isComplete) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }

        await page.waitForSelector('svg[name="Send"]', { visible: true, timeout: 300_000 });
    } finally {
        await page.close();
    }
}
