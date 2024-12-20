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
]);

export function isPathSafe(staticPath: string): boolean {
  try {
    fs.accessSync(staticPath, fs.constants.R_OK);
    const stats = fs.statSync(staticPath);
    return stats.isDirectory();
  } catch (err) {
    return false;
  }
}
