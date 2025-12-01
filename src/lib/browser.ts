import puppeteer, { Browser } from "puppeteer-core";
import path from "path";
import os from "os";

export let browserInstance: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
    if (!browserInstance) {
        const executablePath =
            os.platform() === //
            "win32"
                ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
                : "/usr/bin/google-chrome";
        browserInstance = await puppeteer.launch({
            executablePath,
            headless: process.env.NODE_ENV === "production",
            args: [
                "--disable-blink-features=AutomationControlled", //
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
            ],
            userDataDir: path.join(__dirname, "../../user_data"),
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
