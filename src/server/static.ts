import fs from 'fs';

// Allowed file extensions
export const ALLOWED_EXTENSIONS = new Set([
  '.txt',
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.html',
  '.css',
  '.js',
  '.json',
  '.svg',
  '.ico',
  '.md',
]);

export function isPathSafe(staticPath: string): boolean {
  try {
    fs.accessSync(staticPath, fs.constants.R_OK);
    const stats = fs.statSync(staticPath);
    return stats.isDirectory();
  } catch (_err) {
    return false;
  }
}
