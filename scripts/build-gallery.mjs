// Scans images/<folder>/ for a photo + info.txt in each subfolder and writes
// images/gallery.json, which the homepage fetches to render the gallery.
//
// Each subfolder under images/ must contain:
//   - one image file (.jpg, .jpeg, .png, .gif, .webp, or .svg) — if more than
//     one is present, the first one alphabetically is used
//   - one info.txt with exactly two lines:
//       line 1: caption text shown under the photo
//       line 2: the link to open when the photo/caption is clicked

import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const IMAGES_DIR = 'images';
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']);
const INFO_FILENAME = 'info.txt';

function isDirectory(path) {
  return statSync(path).isDirectory();
}

function getExtension(filename) {
  const idx = filename.lastIndexOf('.');
  return idx === -1 ? '' : filename.slice(idx).toLowerCase();
}

function encodePath(relativePath) {
  return relativePath.split('/').map(encodeURIComponent).join('/');
}

const folders = readdirSync(IMAGES_DIR)
  .filter((name) => isDirectory(join(IMAGES_DIR, name)))
  .sort((a, b) => a.localeCompare(b));

const gallery = [];

for (const folder of folders) {
  const folderPath = join(IMAGES_DIR, folder);
  const files = readdirSync(folderPath);

  const infoFile = files.find((f) => f.toLowerCase() === INFO_FILENAME);
  const imageFile = files
    .filter((f) => IMAGE_EXTENSIONS.has(getExtension(f)))
    .sort((a, b) => a.localeCompare(b))[0];

  if (!infoFile || !imageFile) {
    console.warn(`Skipping "${folder}": needs both ${INFO_FILENAME} and an image file.`);
    continue;
  }

  const infoText = readFileSync(join(folderPath, infoFile), 'utf-8');
  const lines = infoText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const [caption, link] = lines;

  if (!caption || !link) {
    console.warn(`Skipping "${folder}": ${INFO_FILENAME} must have a caption on line 1 and a link on line 2.`);
    continue;
  }

  gallery.push({
    image: encodePath(`${IMAGES_DIR}/${folder}/${imageFile}`),
    caption,
    link,
  });
}

writeFileSync(join(IMAGES_DIR, 'gallery.json'), JSON.stringify(gallery, null, 2) + '\n');
console.log(`Wrote ${gallery.length} gallery item(s) to images/gallery.json`);
