import { readFileSync } from 'node:fs';
import path from 'node:path';

const BARREL_NAMES = [
  'index.ts',
  'index.tsx',
  'index.js',
  'index.jsx',
  '__init__.py',
  'mod.rs',
  'index.go',
  'lib.rs',
];

const extractAnnotation = (content: string): string => {
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip shebang or standard pragmas if needed, check for comments
    const m =
      trimmed.match(/^\/\*\*?\s*(.+?)\s*\*\/?$/) || // /** ... */ or /* ... */
      trimmed.match(/^\/\/\/\s*(.+)$/) || // /// (Rust)
      trimmed.match(/^\/\/\s*(.+)$/) || // // (JS, Go, Rust)
      trimmed.match(/^#\s*(.+)$/); // # (Python, Ruby)

    if (m) {
      return m[1];
    }

    // If the first non-empty line is not a comment, don't keep scanning blindly
    break;
  }
  return '';
};

export const getFolderAnnotation = (dirPath: string): string => {
  for (const name of BARREL_NAMES) {
    try {
      const filePath = path.join(dirPath, name);
      const content = readFileSync(filePath, 'utf-8');
      const annotation = extractAnnotation(content);
      if (annotation) {
        return annotation;
      }
    } catch {
      // file doesn't exist, try next
    }
  }
  return '';
};
