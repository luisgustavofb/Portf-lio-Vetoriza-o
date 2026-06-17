import puppeteer from "puppeteer";

const url = process.argv[2] || "http://localhost:3000";
const outPath = process.argv[3] || "./portfolio-leonan-moura.pdf";

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: "networkidle0" });

// Trigger scroll-reveal animations for every section before printing
await page.evaluate(async () => {
  const distance = 400;
  const delay = 50;
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

// Strip navigation and all clickable CTA buttons/links for the PDF export
await page.addStyleTag({
  content: `
    header { display: none !important; }
    a, button { pointer-events: none !important; }
    a.btn-primary, .btn-primary { display: none !important; }
    body { padding-top: 0 !important; }
  `,
});

await page.pdf({
  path: outPath,
  format: "A4",
  printBackground: true,
  margin: { top: "0", bottom: "0", left: "0", right: "0" },
});

await browser.close();
console.log("Saved", outPath);
