import axios from "axios";

const WEBSHARE_API_KEY = process.env.WEBSHARE_API_KEY;

export type ProxyData = {
    proxy_address: string;
    port: number;
    username: string;
    password: string;
};

export async function getRandomProxy(): Promise<ProxyData | null> {
    if (!WEBSHARE_API_KEY) return null;

    const res = await axios.get("https://proxy.webshare.io/api/v2/proxy/list/?mode=direct&page=1&page_size=25", {
        headers: {
            Authorization: `Token ${WEBSHARE_API_KEY}`,
        },
    });
    const proxies = res.data.results;
    if (!proxies || proxies.length === 0) return null;
    const idx = Math.floor(Math.random() * proxies.length);
    return proxies[idx];
}
