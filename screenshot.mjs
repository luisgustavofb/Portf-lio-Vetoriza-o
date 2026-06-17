import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const url = process.argv[2] || "http://localhost:3000";
const label = process.argv[3] || "";

const dir = "./temporary screenshots";
fs.mkdirSync(dir, { recursive: true });

let n = 1;
while (fs.existsSync(path.join(dir, `screenshot-${n}${label ? "-" + label : ""}.png`))) n++;
const outPath = path.join(dir, `screenshot-${n}${label ? "-" + label : ""}.png`);

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: "networkidle0" });

// Scroll through the full page so IntersectionObserver-based reveal animations trigger
await page.evaluate(async () => {
  const distance = 400;
  const delay = 60;
  let total = 0;
  const scrollHeight = document.body.scrollHeight;
  while (total < scrollHeight) {
    window.scrollBy(0, distance);
    total += distance;
    await new Promise((r) => setTimeout(r, delay));
  }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 300));
});

await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log("Saved", outPath);
