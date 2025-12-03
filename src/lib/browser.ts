import puppeteer, { Browser, Page } from "puppeteer-core";
import path from "path";
import os from "os";
import { config } from "@/config";

const browsers = new Map<string, Browser>();

export async function getBrowser(userDataDir?: string): Promise<Browser> {
    const finalUserDataDir = userDataDir || path.join(process.cwd(), "user_data2");

    if (!browsers.has(finalUserDataDir)) {
        console.log(`🚀 Launching browser for ${finalUserDataDir}...`);

        const executablePath =
            config.puppeteer.executablePath || //
            (os.platform() === "win32" //
                ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
                : "/usr/bin/chromium");

        const browser = await puppeteer.launch({
            executablePath,
            headless: config.puppeteer.headless,
            args: [
                "--disable-blink-features=AutomationControlled", //
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--cookie",
            ],
            userDataDir: finalUserDataDir,
        });

        browsers.set(finalUserDataDir, browser);
        console.log(`✅ Browser launched for ${finalUserDataDir}`);
    }

    return browsers.get(finalUserDataDir)!;
}

export async function closeAllBrowser(): Promise<void> {
    for (const [userDataDir, browser] of browsers) {
        await browser.close();
        console.log(`✅ Browser closed for ${userDataDir}`);
    }
    browsers.clear();
}

// Graceful shutdown
process.on("SIGINT", async () => {
    await closeAllBrowser();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    await closeAllBrowser();
    process.exit(0);
});
