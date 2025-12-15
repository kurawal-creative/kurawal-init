import puppeteer, { Browser, Page } from "puppeteer-core";
import path from "path";
import { config } from "@/config";
import { ProxyData } from "@/lib/proxy";
import chromium from "@sparticuz/chromium";

let _browser: Browser | null = null;

export async function getBrowser(userDataDir?: string, proxy?: ProxyData): Promise<Browser> {
    if (_browser) return _browser;

    const executablePath =
        config.puppeteer.executablePath || //
        (process.platform === "linux" //
            ? await chromium.executablePath()
            : "C:/Program Files/Google/chrome/Application/chrome.exe");

    const args = [
        "--disable-blink-features=AutomationControlled", //
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
    ];

    if (proxy) {
        args.push(`--proxy-server=${proxy.proxy_address}:${proxy.port}`);
    }

    _browser = await puppeteer.launch({
        executablePath,
        headless: config.puppeteer.headless,
        args,
        userDataDir: userDataDir || path.join(process.cwd(), "user_data"),
    });

    return _browser;
}

export async function closeAllBrowser(): Promise<void> {
    if (_browser) {
        await _browser.close();
        console.log(`✅ Browser closed`);
        _browser = null;
    }
}

process.on("SIGINT", async () => {
    await closeAllBrowser();
    process.exit(0);
});
