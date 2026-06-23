import http from "http";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const ROOT = "c:/Users/Start/Desktop/Projeto Portfolio Vetorização";
const PORT = 3000;
const MIME = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".mjs": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".pdf": "application/pdf",
};
const renderPageHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;background:#fff;">
<canvas id="c"></canvas>
<script type="module">
  import * as pdfjsLib from "/node_modules/pdfjs-dist/build/pdf.mjs";
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/node_modules/pdfjs-dist/build/pdf.worker.mjs";
  window.renderPdfPage = async function(url, pageNum, scale) {
    const doc = await pdfjsLib.getDocument({ url }).promise;
    console.log("Total pages:", doc.numPages);
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = document.getElementById('c');
    canvas.width = viewport.width; canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    window.__renderDone = true;
  };
</script></body></html>`;

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/render-page.html") { res.writeHead(200, {"Content-Type":"text/html"}); res.end(renderPageHtml); return; }
  if (urlPath === "/") urlPath = "/index.html";
  const filePath = path.join(ROOT, urlPath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, {"Content-Type": MIME[path.extname(filePath)] || "application/octet-stream"});
    res.end(data);
  });
}).listen(PORT, async () => {
  try {
    const browser = await puppeteer.launch();
    for (const pn of [11, 12, 13]) {
      const page = await browser.newPage();
      await page.goto(`http://localhost:${PORT}/render-page.html`, { waitUntil: "load" });
      await page.waitForFunction(() => typeof window.renderPdfPage === "function", { timeout: 15000 });
      const pdfUrl = encodeURI(`http://localhost:${PORT}/Portfólio Final.pdf`);
      await page.evaluate(async (u, p, s) => await window.renderPdfPage(u, p, s), pdfUrl, pn, 2.5);
      await page.waitForFunction(() => window.__renderDone === true, { timeout: 60000 });
      await (await page.$("#c")).screenshot({ path: path.join(ROOT, `assets/portfolio/vfy-p${pn}.png`) });
      console.log("Saved page", pn);
      await page.close();
    }
    await browser.close();
  } catch (e) { console.error(e); }
  finally { server.close(() => console.log("Done")); }
});
