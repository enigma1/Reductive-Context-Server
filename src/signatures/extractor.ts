import { extToLanguage } from '>/config';
import { getTypescriptSignatures } from './typescript';
import { getPythonSignatures } from './python';
import { getFileExtension } from '>/utils';

export type SignatureOptions = {
  filePath?: string;
};
export type SignatureHandler = (
  source: string,
  options?: SignatureOptions,
) => string;

const handlers: Record<string, SignatureHandler> = {
  typescript: getTypescriptSignatures,
  javascript: getTypescriptSignatures,
  python: getPythonSignatures,
};

export const extractSignatures = (path: string, content: string): string => {
  const ext = getFileExtension(path);
  if (!ext) return content;
  const language = extToLanguage[ext]?.signature;
  if (!language) return content;

  const handler = handlers[language] ?? undefined;
  return handler ? handler(content) : content;
};
