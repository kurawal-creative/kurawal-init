import puppeteer, { Browser } from "puppeteer-core";
import path from "path";
import os from "os";

export let browserInstance: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
    if (!browserInstance) {
        const executablePath =
            process.env.PUPPETEER_EXECUTABLE_PATH ||
            (os.platform() === //
            "win32"
                ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
                : "/usr/bin/chromium");
        browserInstance = await puppeteer.launch({
            executablePath,
            headless: process.env.HEADLESS === "true",
            args: [
                "--disable-blink-features=AutomationControlled", //
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
            ],
            userDataDir: path.join(process.cwd(), "tmp"),
        });
    }
    return browserInstance;
}

// Optional: Function to close the browser
export async function closeBrowser(): Promise<void> {
    if (browserInstance) {
        await browserInstance.close();
        browserInstance = null;
    }
}
