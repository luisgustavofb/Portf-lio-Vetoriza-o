import sharp from "sharp";
import fs from "fs";
import path from "path";

const PORTFOLIO_DIR = "c:/Users/Start/Desktop/Projeto Portfolio Vetorização/assets/portfolio";
const COMPRESSED_DIR = "c:/Users/Start/Desktop/Projeto Portfolio Vetorização/assets/portfolio-compressed";

// Create compressed dir
fs.mkdirSync(COMPRESSED_DIR, { recursive: true });

const files = fs.readdirSync(PORTFOLIO_DIR).filter(f => /\.(jpg|jpeg|png)$/i.test(f));

let totalOriginal = 0;
let totalCompressed = 0;

for (const file of files) {
  const inputPath = path.join(PORTFOLIO_DIR, file);
  const outputFile = file.replace(/\.(png|jpeg)$/i, '.jpg');
  const outputPath = path.join(COMPRESSED_DIR, outputFile);
  
  const originalSize = fs.statSync(inputPath).size;
  totalOriginal += originalSize;
  
  const meta = await sharp(inputPath).metadata();
  
  // Resize large images to max 1600px on longest side, and compress JPEG to quality 65
  let img = sharp(inputPath);
  const maxDim = 1600;
  if (meta.width > maxDim || meta.height > maxDim) {
    img = img.resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true });
  }
  
  await img.jpeg({ quality: 65, mozjpeg: true }).toFile(outputPath);
  
  const compressedSize = fs.statSync(outputPath).size;
  totalCompressed += compressedSize;
  
  const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
  console.log(`${file}: ${(originalSize/1024).toFixed(0)}KB -> ${(compressedSize/1024).toFixed(0)}KB (-${ratio}%)`);
}

console.log(`\nTotal: ${(totalOriginal/1024/1024).toFixed(1)}MB -> ${(totalCompressed/1024/1024).toFixed(1)}MB`);
console.log("Done!");
