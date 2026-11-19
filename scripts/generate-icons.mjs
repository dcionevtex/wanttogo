import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";
await mkdir("public/icons", { recursive: true });
const source = await readFile("public/icons/icon.svg");
for (const [name, size] of [
  ["icon-192", 192],
  ["icon-512", 512],
  ["apple-touch-icon", 180],
]) {
  await sharp(source)
    .resize(size, size)
    .png()
    .toFile(`public/icons/${name}.png`);
}
const maskable = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="#b34b37"/><path d="M256 130c-57 0-102 45-102 102 0 73 102 152 102 152s102-79 102-152c0-57-45-102-102-102Z" fill="#fff8e9"/><circle cx="256" cy="232" r="37" fill="#b34b37"/></svg>',
);
await sharp(maskable).png().toFile("public/icons/maskable-512.png");
