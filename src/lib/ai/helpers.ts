import { Page } from "puppeteer-core";

/**
 * Click element with optional delay
 * @param page - Puppeteer page instance
 * @param selector - CSS selector
 * @param options - Click options including delay
 */
export async function clickElement(page: Page, selector: string, options: { delay?: number } = {}) {
    await page.waitForSelector(selector);
    await page.click(selector, options);
}

/**
 * Wait for element to be visible with retry logic
 * @param page - Puppeteer page instance
 * @param selector - CSS selector
 * @param maxRetries - Maximum number of retries
 * @param retryDelay - Delay between retries in ms
 */
export async function waitForElementWithRetry(page: Page, selector: string, maxRetries: number = 3, retryDelay: number = 1000): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await page.waitForSelector(selector, { visible: true, timeout: retryDelay });
            return true;
        } catch (error) {
            if (i === maxRetries - 1) {
                return false;
            }
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
    }
    return false;
}

/**
 * Type text with delay to simulate human typing
 * @param page - Puppeteer page instance
 * @param selector - CSS selector
 * @param text - Text to type
 * @param delay - Delay between keystrokes in ms
 */
export async function typeWithDelay(page: Page, selector: string, text: string, delay: number = 50) {
    await page.waitForSelector(selector);
    await page.type(selector, text, { delay });
}

/**
 * Wait for element to disappear
 * @param page - Puppeteer page instance
 * @param selector - CSS selector
 * @param timeout - Timeout in ms
 */
export async function waitForElementToDisappear(page: Page, selector: string, timeout: number = 30000): Promise<void> {
    await page.waitForSelector(selector, { hidden: true, timeout });
}

/**
 * Evaluate and extract text content from selector
 * @param page - Puppeteer page instance
 * @param selector - CSS selector
 * @param defaultValue - Default value if element not found
 */
export async function getTextContent(page: Page, selector: string, defaultValue: string = ""): Promise<string> {
    return await page.evaluate(
        (sel: string, def: string) => {
            const el = document.querySelector(sel);
            return el ? el.textContent?.trim() || def : def;
        },
        selector,
        defaultValue,
    );
}

/**
 * Check if element is visible
 * @param page - Puppeteer page instance
 * @param selector - CSS selector
 */
export async function isElementVisible(page: Page, selector: string): Promise<boolean> {
    return await page.evaluate((sel: string) => {
        const el = document.querySelector(sel) as HTMLElement;
        return el ? el.offsetParent !== null : false;
    }, selector);
}
