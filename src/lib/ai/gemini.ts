import { getBrowser } from "@/lib/browser";
import { clickElement, isElementVisible } from "@/lib/ai/helpers";

const GEMINI_TIMEOUT = 40000;

export async function generateImage(imagePath: string, prompt: string): Promise<Buffer | null> {
    const browser = await getBrowser();
    const page = await browser.newPage();

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; WOW64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 OPR/123.0.0.0");

    const url = Buffer.from("aHR0cHM6Ly9haXN0dWRpby5nb29nbGUuY29tL3Byb21wdHMvbmV3X2NoYXQ/bW9kZWw9Z2VtaW5pLTIuNS1mbGFzaC1pbWFnZQ==", "base64").toString("utf8");

    await page.goto(url);

    try {
        try {
            await page.waitForSelector("button.ms-button-primary", { timeout: 5000 });
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll("button.ms-button-primary"));
                const gotItButton = buttons.find((btn) => btn.textContent?.trim() === "Got it");
                if (gotItButton) {
                    (gotItButton as HTMLElement).click();
                }
            });
        } catch (error) {
            // Got it button not found, continue
        }

        let uploadVisible = false;
        do {
            try {
                await page.waitForSelector('button[aria-label="Upload File"]', { visible: true, timeout: 1000 });
                uploadVisible = true;
            } catch {
                await clickElement(page, 'button[iconname="add_circle"]', { delay: 500 });
            }
        } while (!uploadVisible);

        const [fileChooser] = await Promise.all([page.waitForFileChooser(), clickElement(page, 'button[aria-label="Upload File"]', { delay: 300 })]);
        await fileChooser.accept([imagePath]);

        await page.type('textarea[aria-label="Type something or tab to choose an example prompt"]', prompt);

        await clickElement(page, 'button[aria-label="Run"]');

        try {
            await page.waitForSelector('button[aria-label="Run"][aria-disabled="false"]', { visible: true, timeout: GEMINI_TIMEOUT });
            await page.waitForSelector('button[aria-label="Run"][aria-disabled="true"]', { visible: true, timeout: GEMINI_TIMEOUT });
        } catch (error) {
            // Timeout waiting for generation, proceeding anyway
        }

        const startTime = Date.now();
        while (Date.now() - startTime < GEMINI_TIMEOUT) {
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
                const parts = (imgSrc as string).split(",");
                if (parts.length > 1) {
                    const base64Data = parts[1];
                    return Buffer.from(base64Data!, "base64");
                }
            }

            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        return null;
    } finally {
        await page.close();
    }
}
