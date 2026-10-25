import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const availableIcons = ['journal', 'photos', 'contact', 'ideas', 'career'];
const canvasSize = 192;
const subjectLimit = 152;
const alphaThreshold = 8;

const inputDirectory = process.argv[2];
if (!inputDirectory) {
  console.error('Usage: node scripts/prepare-icon-refinements.mjs <input-directory> [icon ...]');
  process.exit(1);
}

const requestedIcons = process.argv.slice(3);
const iconNames = requestedIcons.length ? requestedIcons : availableIcons;
const unknownIcons = iconNames.filter((name) => !availableIcons.includes(name));
if (unknownIcons.length) {
  console.error(`Unknown icon name(s): ${unknownIcons.join(', ')}. Choose from: ${availableIcons.join(', ')}.`);
  process.exit(1);
}

const inputRoot = path.resolve(inputDirectory);
const outputRoot = path.resolve('public/os-icons');

function findAlphaBounds(data, width, height, channels) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  let hasTransparency = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * channels + 3];
      if (alpha < 255) hasTransparency = true;
      if (alpha <= alphaThreshold) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < left || bottom < top) return { bounds: null, hasTransparency };
  return {
    bounds: { x: left, y: top, width: right - left + 1, height: bottom - top + 1 },
    hasTransparency,
  };
}

async function prepareIcon(name) {
  const inputPath = path.join(inputRoot, `${name}.png`);
  const outputPath = path.join(outputRoot, `${name}.webp`);
  const source = sharp(inputPath);
  const metadata = await source.metadata();

  if (!metadata.hasAlpha) throw new Error(`${name}.png must have an alpha channel`);
  if (!metadata.width || !metadata.height) throw new Error(`${name}.png has invalid dimensions`);

  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { bounds, hasTransparency } = findAlphaBounds(data, info.width, info.height, info.channels);
  if (!hasTransparency) throw new Error(`${name}.png must contain transparent pixels`);
  if (!bounds) throw new Error(`${name}.png has no visible subject above alpha ${alphaThreshold}`);

  const subject = await sharp(inputPath)
    .extract({ left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height })
    .resize({ width: subjectLimit, height: subjectLimit, fit: 'inside', kernel: sharp.kernel.nearest })
    .ensureAlpha()
    .png()
    .toBuffer({ resolveWithObject: true });

  const x = Math.floor((canvasSize - subject.info.width) / 2);
  const y = Math.floor((canvasSize - subject.info.height) / 2);
  await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: subject.data, left: x, top: y }])
    .webp({ lossless: true, alphaQuality: 100 })
    .toFile(outputPath);

  return {
    name,
    input: { width: metadata.width, height: metadata.height },
    output: { width: canvasSize, height: canvasSize },
    bytes: (await stat(outputPath)).size,
    alphaBounds: bounds,
  };
}

try {
  await mkdir(outputRoot, { recursive: true });
  const report = [];
  for (const name of iconNames) report.push(await prepareIcon(name));
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
