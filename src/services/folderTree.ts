/* File folderTree.ts
  Builds a folder tree out of a root path
*/
import path from 'node:path';
import fs from 'node:fs/promises';
import { safeResolve, scanDir, rootPath as globalRootPath } from './files';
import { getFolderAnnotation } from './annotations';

type FolderTreeOptions = {
  /** Maximum directory levels below the requested root. */
  depth?: number;
  /** Include filenames as well as directories. Defaults to true. */
  includeFiles?: boolean;
  /** Include the requested root directory name. Defaults to true. */
  includeRoot?: boolean;
};

type TreeNode = {
  dirs: Map<string, TreeNode>;
  files: Set<string>;
};

const createTreeNode = (): TreeNode => ({
  dirs: new Map(),
  files: new Set(),
});

/**
 * Returns a directory tree as plain text, suitable for LLM context.
 *
 * `folder` is relative to rootPath and defaults to the project root.
 * Uses scanDir(), so existing ignore rules are respected.
 */
export const getFolderTree = async (
  folder = '.',
  options: FolderTreeOptions = {},
): Promise<string> => {
  const { depth, includeFiles = true, includeRoot = true } = options;

  if (depth !== undefined && (!Number.isInteger(depth) || depth < 0)) {
    throw new RangeError('depth must be a non-negative integer');
  }

  const absPath = safeResolve(folder);
  if (!absPath) {
    throw new Error(`Invalid folder path: ${folder}`);
  }

  const stats = await fs.stat(absPath);
  if (!stats.isDirectory()) {
    throw new Error(`Not a directory: ${folder}`);
  }

  const { scanResult, folders } = await scanDir(absPath, depth);
  const rootRel = path
    .relative(globalRootPath, absPath)
    .split(path.sep)
    .join('/');
  const root = createTreeNode();

  // Build directory hierarchy from folders, including empty directories.
  for (const folder of folders) {
    const relativePath = rootRel
      ? folder === rootRel
        ? ''
        : folder.startsWith(`${rootRel}/`)
          ? folder.slice(rootRel.length + 1)
          : null
      : folder;

    if (relativePath === null || relativePath === '') continue;

    let node = root;

    for (const segment of relativePath.split('/')) {
      if (!node.dirs.has(segment)) {
        node.dirs.set(segment, createTreeNode());
      }

      node = node.dirs.get(segment)!;
    }
  }

  // Populate files from scanResult.
  if (includeFiles) {
    for (const [scanPath, files] of Object.entries(scanResult)) {
      const relativePath = rootRel
        ? scanPath === rootRel
          ? ''
          : scanPath.startsWith(`${rootRel}/`)
            ? scanPath.slice(rootRel.length + 1)
            : null
        : scanPath;

      if (relativePath === null) continue;

      let node = root;

      if (relativePath) {
        for (const segment of relativePath.split('/')) {
          if (!node.dirs.has(segment)) {
            node.dirs.set(segment, createTreeNode());
          }

          node = node.dirs.get(segment)!;
        }
      }

      for (const file of files) {
        node.files.add(file);
      }
    }
  }

  const lines: string[] = [];
  const rootName = path.basename(absPath) || absPath;

  if (includeRoot) {
    lines.push(`${rootName}/`);
  }

  const render = (node: TreeNode, prefix: string, relPath: string): void => {
    const dirs = [...node.dirs.keys()].sort((a, b) => a.localeCompare(b));
    const files = includeFiles
      ? [...node.files].sort((a, b) => a.localeCompare(b))
      : [];

    const entries = [
      ...dirs.map((name) => ({ name, isDir: true })),
      ...files.map((name) => ({ name, isDir: false })),
    ];

    entries.forEach((entry, index) => {
      const isLast = index === entries.length - 1;
      const branch = isLast ? '└── ' : '├── ';

      if (entry.isDir) {
        const childRel = relPath ? `${relPath}/${entry.name}` : entry.name;
        const annotation = getFolderAnnotation(path.join(absPath, childRel));
        lines.push(
          `${prefix}${branch}${entry.name}/` +
            (annotation ? `  // ${annotation}` : ''),
        );
        const child = node.dirs.get(entry.name)!;
        render(child, `${prefix}${isLast ? '    ' : '│   '}`, childRel);
      } else {
        lines.push(`${prefix}${branch}${entry.name}`);
      }
    });
  };

  render(root, '', '');
  return lines.join('\n');
};

export const convertFolderTreeToText = (
  folders: string[],
  targetPath = '',
): string => {
  const root: { children: Map<string, typeof root> } = {
    children: new Map(),
  };

  const absAbsPath = safeResolve(targetPath) || globalRootPath;
  const normalizedRoot = targetPath.replace(/\/+$/, '');

  for (const folder of folders) {
    const relativePath = normalizedRoot
      ? folder.startsWith(`${normalizedRoot}/`)
        ? folder.slice(normalizedRoot.length + 1)
        : ''
      : folder;

    if (!relativePath) continue;

    let current = root;

    for (const segment of relativePath.split('/').filter(Boolean)) {
      if (!current.children.has(segment)) {
        current.children.set(segment, { children: new Map() });
      }
      current = current.children.get(segment)!;
    }
  }

  const lines: string[] = [];

  const render = (node: typeof root, prefix = '', relPath = ''): void => {
    const entries = [...node.children.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    );

    entries.forEach(([name, child], index) => {
      const isLast = index === entries.length - 1;
      const childRel = relPath ? `${relPath}/${name}` : name;
      const annotation = getFolderAnnotation(path.join(absAbsPath, childRel));

      lines.push(
        `${prefix}${isLast ? '└── ' : '├── '}${name}/` +
          (annotation ? `  // ${annotation}` : ''),
      );
      render(child, `${prefix}${isLast ? '    ' : '│   '}`, childRel);
    });
  };

  render(root);
  return lines.join('\n');
};

export const getTree = async (path: string, depth?: number) => {
  const result = await getFolderTree(path, {
    depth: depth || undefined,
    includeFiles: false,
  });
  return result;
};
