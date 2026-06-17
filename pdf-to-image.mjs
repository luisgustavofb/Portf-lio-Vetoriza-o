import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const SRC_DIR = "./2.0-renamed";
const OUT_DIR = "./assets/trechos";
fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await puppeteer.launch();
const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith(".pdf"));

const renderHtmlUrl = "http://localhost:3000/pdf-render.html";

for (const file of files) {
  const slug = file.replace(/\.pdf$/, "");
  const fileUrl = "http://localhost:3000/2.0-renamed/" + file;

  const page = await browser.newPage();
  page.on("console", msg => console.log("  console:", msg.text()));
  page.on("pageerror", err => console.log("  pageerror:", err.message));
  await page.goto(renderHtmlUrl, { waitUntil: "load" });
  await page.waitForFunction(() => typeof window.renderPdf === "function", { timeout: 15000 });

  const scale = (slug === "total" || slug === "camadas-e-descrio") ? 2.5 : 6.0;
  await page.evaluate(async (url, s) => {
    await window.renderPdf(url, s);
  }, fileUrl, scale);

  await page.waitForFunction(() => window.__renderDone === true, { timeout: 30000 });

  const canvasEl = await page.$("#c");
  const outPath = path.join(OUT_DIR, `${slug}.png`);
  await canvasEl.screenshot({ path: outPath });
  console.log("saved", outPath);
  await page.close();
}

await browser.close();
