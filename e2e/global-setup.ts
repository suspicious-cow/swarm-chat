import { rm, mkdir, readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function globalSetup() {
  const dir = process.env.SCREENSHOTS_DIR || path.join(__dirname, '..', 'screenshots');
  await mkdir(dir, { recursive: true });
  // Clean contents without removing the directory itself (which may be a mount point)
  const entries = await readdir(dir);
  await Promise.all(entries.map(entry => rm(path.join(dir, entry), { recursive: true, force: true })));
}

export default globalSetup;
