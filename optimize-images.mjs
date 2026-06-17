import sharp from "sharp";
import fs from "fs";
import path from "path";

const DIR = "./assets/portfolio";
const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".png"));

for (const file of files) {
  const inPath = path.join(DIR, file);
  const outPath = path.join(DIR, file.replace(/\.png$/, ".jpg"));
  const before = fs.statSync(inPath).size;

  await sharp(inPath)
    .resize({ width: 1600, withoutEnlargement: true })
    .flatten({ background: "#0a0e14" })
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(outPath);

  const after = fs.statSync(outPath).size;
  console.log(file, "->", path.basename(outPath), `${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`);
}
