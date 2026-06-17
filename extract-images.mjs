import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { PNG } from "pngjs";
import fs from "fs";
import path from "path";

const PDF_PATH = "./portifolio-vetorizacao-leonan.pdf";
const OUT_DIR = "./assets/portfolio";

fs.mkdirSync(OUT_DIR, { recursive: true });

function saveImage(imgData, name) {
  const { width, height, data, kind } = imgData;
  const png = new PNG({ width, height });

  // kind 1 = grayscale, 2 = RGB (24bpc), 3 = RGBA (32bpc) per pdf.js ImageKind
  if (kind === 3) {
    data.copy ? data.copy(png.data) : png.data.set(data);
  } else if (kind === 2) {
    for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
      png.data[j] = data[i];
      png.data[j + 1] = data[i + 1];
      png.data[j + 2] = data[i + 2];
      png.data[j + 3] = 255;
    }
  } else {
    for (let i = 0, j = 0; i < data.length; i += 1, j += 4) {
      png.data[j] = data[i];
      png.data[j + 1] = data[i];
      png.data[j + 2] = data[i];
      png.data[j + 3] = 255;
    }
  }

  const buffer = PNG.sync.write(png);
  fs.writeFileSync(path.join(OUT_DIR, name), buffer);
  console.log("saved", name, width, height);
}

const data = new Uint8Array(fs.readFileSync(PDF_PATH));
const doc = await getDocument({ data, isEvalSupported: false }).promise;

let counter = 0;
for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
  const page = await doc.getPage(pageNum);
  const ops = await page.getOperatorList();
  const objs = page.objs;

  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    if (fn === 85 /* OPS.paintImageXObject */) {
      const objId = ops.argsArray[i][0];
      try {
        let img;
        if (objs.has(objId)) {
          img = objs.get(objId);
        } else {
          img = await Promise.race([
            new Promise((resolve) => objs.get(objId, resolve)),
            new Promise((resolve) => setTimeout(() => resolve(null), 3000)),
          ]);
        }
        if (img && img.data && img.width > 50 && img.height > 50) {
          counter++;
          saveImage(img, `page${pageNum}-img${counter}.png`);
        } else if (!img) {
          console.warn("could not resolve", objId, "on page", pageNum);
        }
      } catch (e) {
        console.error("failed", objId, e.message);
      }
    }
  }
}

console.log("Total images extracted:", counter);
