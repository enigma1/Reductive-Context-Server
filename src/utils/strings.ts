/* File src/services/strings.ts
  String common support functions
*/
export const isEmptyString = (s: unknown): s is string =>
  typeof s === 'string' && s.length === 0;
export const isAlphanumeric = (key: string) => /^[a-z0-9]+$/i.test(key);
export const kebabCase = (str: string) =>
  str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
export const snakeToCamel = (str: string): string =>
  str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());

export const trimString = (query: string) => query.replace(/\s+/g, ' ').trim();

export const truncateString = (value: string, max = 1000) =>
  value.length > max ? value.slice(0, max) + '...' : value;

export const isNonEmptyString = (s: unknown): s is string =>
  typeof s === 'string' && s.trim().length > 0;

type HasitProps = {
  input: string;
  parts: readonly string[];
  at?: number;
};

export const hasit = ({ input, parts, at = 0 }: HasitProps) => {
  const value = input.toLowerCase();

  return parts.some((part) => {
    const prefix = part.toLowerCase();
    return value.startsWith(prefix, at);
  });
};

export const getFileExtension = (filePath: string) => {
  const filename = filePath.split(/[\/]/).pop()?.toLowerCase() ?? '';
  const ext = filename.includes('.') ? (filename.split('.').pop() ?? '') : '';
  return ext;
};
