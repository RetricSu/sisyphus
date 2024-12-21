import path from "path";

export function sanitizeFullFilePath(filePath: string) {
  return isAbsolutePath(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);
}

export function isAbsolutePath(filePath: string): boolean {
  return path.isAbsolute(filePath);
}
