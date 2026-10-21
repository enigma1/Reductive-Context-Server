/* File files.ts
  Scan files path resolution and generation of folder list.
*/
import path from 'node:path';
import type { Dirent } from 'node:fs';
import fs from 'node:fs/promises';
import ignore, { type Ignore } from 'ignore';
import { envConfig } from '>/config';

export const rootPath = await fs.realpath(
  path.resolve(process.cwd(), envConfig.rootPath ?? './'),
);

export const safeResolve = (userInput: string): string | null => {
  const decoded = decodeURIComponent(userInput);
  if (path.isAbsolute(decoded) || decoded.includes('\0')) return null;
  const resolved = path.resolve(rootPath, decoded);
  if (resolved !== rootPath && !resolved.startsWith(rootPath + path.sep))
    return null;
  return resolved;
};

// Helper to load and compile gitignore files from absPath up to rootPath
const getIgnoreForDir = async (absPath: string): Promise<Ignore> => {
  const ig = ignore();
  ig.add(['.git', 'node_modules']); // common defaults

  let currentPath = absPath;
  const gitignorePaths: string[] = [];

  while (currentPath.startsWith(rootPath)) {
    const gitignorePath = path.join(currentPath, '.gitignore');
    try {
      const stats = await fs.stat(gitignorePath);
      if (stats.isFile()) {
        gitignorePaths.unshift(gitignorePath);
      }
    } catch {
      // console.log('no .gitignore in this directory');
    }

    if (currentPath === rootPath) break;
    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) break;
    currentPath = parentPath;
  }

  for (const gp of gitignorePaths) {
    try {
      const content = await fs.readFile(gp, 'utf8');
      const dirRel = path
        .relative(rootPath, path.dirname(gp))
        .split(path.sep)
        .join('/');

      const lines = content.split(/\r?\n/);
      const scopedLines: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        let pattern = trimmed;
        if (dirRel !== '') {
          if (pattern.startsWith('/')) {
            pattern = `/${dirRel}${pattern}`;
          } else if (pattern.startsWith('!/')) {
            pattern = `!/${dirRel}${pattern.slice(1)}`;
          } else if (pattern.startsWith('!')) {
            pattern = `!${dirRel}/${pattern.slice(1)}`;
          } else {
            pattern = `${dirRel}/${pattern}`;
          }
        }
        scopedLines.push(pattern);
      }
      ig.add(scopedLines);
    } catch {
      console.log(`Cannot read ${gp} skipping`);
      // ignore read errors
    }
  }
  return ig;
};

type ScanDirResult = {
  scanResult: Record<string, string[]>;
  unresolved: string[];
  folders: string[];
};

// Lists files in a directory, recursing into subdirectories up to `depth`.
// Returns entries keyed by relative path (e.g. "src/components", "src/components/forms").
// Folders with no files are omitted.
export const scanDir = async (
  absPath: string,
  depth?: number,
  parentIgnore?: Ignore,
): Promise<ScanDirResult> => {
  const relPath = path.relative(rootPath, absPath).split(path.sep).join('/');

  const scanResult: Record<string, string[]> = {};
  const folders: string[] = [];
  const unresolved: string[] = [];

  let entries: Dirent[] = [];

  try {
    entries = await fs.readdir(absPath, { withFileTypes: true });
  } catch (err) {
    console.log('Invalid path------------->', err);
    return {
      scanResult,
      folders,
      unresolved: [relPath || path.basename(absPath)],
    };
  }

  const ignoreManager = parentIgnore ?? (await getIgnoreForDir(absPath));
  const rawFiles = entries.filter((e) => e.isFile()).map((e) => e.name);
  const files: string[] = [];

  for (const file of rawFiles) {
    const fileRel = relPath ? `${relPath}/${file}` : file;
    if (!ignoreManager.ignores(fileRel)) {
      files.push(file);
    }
  }

  const dirs = entries.filter((e) => e.isDirectory());

  if (depth === undefined || depth > 0) {
    for (const dir of dirs) {
      const dirRel = relPath ? `${relPath}/${dir.name}` : dir.name;
      if (ignoreManager.ignores(`${dirRel}/`)) {
        continue;
      }

      // Record the folder even if it is empty.
      folders.push(dirRel);
      const childResult = await scanDir(
        path.join(absPath, dir.name),
        depth !== undefined ? depth - 1 : undefined,
        ignoreManager,
      );

      Object.assign(scanResult, childResult.scanResult);
      folders.push(...childResult.folders);
      unresolved.push(...childResult.unresolved);
    }
  }

  if (files.length > 0) {
    scanResult[relPath] = files;
  }

  return {
    scanResult,
    folders,
    unresolved,
  };
};
