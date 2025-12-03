import { getBrowser } from "@/lib/browser";

async function main() {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.goto("https://aistudio.google.com/prompts/new_chat?model=gemini-2.5-flash-image", {
        waitUntil: "networkidle0",
    });
    const cookie = await page.cookies();
    console.log(cookie[0]);
    // return;
    const page1 = await browser.newPage();
    await page1.goto("https://aistudio.google.com/prompts/new_chat?model=gemini-2.5-flash-image");
    const client = await page1.target().createCDPSession();
    await client.send("Network.clearBrowserCookies");
    await page1.setCookie(...cookie);
    await page1.goto("https://aistudio.google.com/prompts/new_chat?model=gemini-2.5-flash-image");
}
main();
