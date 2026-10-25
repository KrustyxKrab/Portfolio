import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
// Usage: node scripts/prepare-site-assets.mjs <icon-atlas.png> <desktop.png> <mobile.png>
const [atlas, desktop, mobile] = process.argv.slice(2);
if (!atlas || !desktop || !mobile) throw new Error('Supply the three generated source assets.');
await mkdir('public/os-icons', { recursive: true });
await mkdir('public/wallpapers', { recursive: true });
const meta = await sharp(atlas).metadata();
const cell = Math.floor(meta.width / 2);
const names = ['about', 'projects', 'journal', 'photos', 'contact', 'ideas'];
await Promise.all(names.map((name, index) => sharp(atlas).extract({ left: index % 2 * cell, top: Math.floor(index / 2) * cell, width: cell, height: cell }).resize(192,192,{kernel:'nearest'}).webp({lossless:true}).toFile(`public/os-icons/${name}.webp`)));
await sharp(desktop).webp({ quality: 92 }).toFile('public/wallpapers/hamburg.webp');
await sharp(mobile).resize({ width: 900, withoutEnlargement: true }).webp({ quality: 92 }).toFile('public/wallpapers/hamburg-mobile.webp');
console.log('Prepared 6 icons and 2 wallpapers.');
