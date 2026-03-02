import express from "express";
import { chromium } from "playwright";

const app = express();
const PORT = process.env.PORT || 3000;

let browser;

async function getBrowser() {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
  }
  return browser;
}

/* =========================
   KICK
========================= */

app.get("/kick/:channel", async (req, res) => {
  const channel = req.params.channel;

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();

    await page.goto(`https://kick.com/${channel}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(4000);

    const data = await page.evaluate(() => {
      const scriptTag = document.querySelector(
        'script[id="__NEXT_DATA__"]'
      );
      if (!scriptTag) return null;

      const json = JSON.parse(scriptTag.innerText);
      return json.props?.pageProps?.channel?.livestream || null;
    });

    await page.close();

    if (!data) {
      return res.json({ status: "OFF", viewers: 0, likes: 0 });
    }

    res.json({
      status: "ON",
      viewers: data.viewer_count || 0,
      likes: data.likes || 0
    });

  } catch (err) {
    res.json({ status: "OFF", viewers: 0, likes: 0 });
  }
});

/* =========================
   TIKTOK (PREPARADO)
========================= */

app.get("/tiktok/:username", async (req, res) => {
  const username = req.params.username;

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();

    await page.goto(`https://www.tiktok.com/@${username}/live`, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(5000);

    const viewers = await page.evaluate(() => {
      const el = document.querySelector(
        '[data-e2e="live-people-count"]'
      );
      if (!el) return 0;
      return parseInt(el.innerText.replace(/\D/g, "")) || 0;
    });

    await page.close();

    res.json({
      status: viewers > 0 ? "ON" : "OFF",
      viewers: viewers,
      likes: 0
    });

  } catch (err) {
    res.json({ status: "OFF", viewers: 0, likes: 0 });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});