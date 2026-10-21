export type ViewType = 'monaco' | 'markdown';

export const extToLanguage: Record<
  string,
  { monaco: string; markdown: string; signature?: string }
> = {
  // JavaScript / TypeScript
  js: {
    monaco: 'javascript',
    markdown: 'javascript',
    signature: 'typescript',
  },
  mjs: {
    monaco: 'javascript',
    markdown: 'javascript',
    signature: 'typescript',
  },
  cjs: {
    monaco: 'javascript',
    markdown: 'javascript',
    signature: 'typescript',
  },
  jsx: {
    monaco: 'jsx',
    markdown: 'jsx',
    signature: 'typescript',
  },
  ts: {
    monaco: 'typescript',
    markdown: 'typescript',
    signature: 'typescript',
  },
  tsx: {
    monaco: 'typescript',
    markdown: 'typescript',
    signature: 'typescript',
  },
  // Web
  astro: {
    monaco: 'html',
    markdown: 'html',
  },
  html: {
    monaco: 'html',
    markdown: 'html',
  },
  htm: {
    monaco: 'html',
    markdown: 'html',
  },
  css: {
    monaco: 'css',
    markdown: 'css',
  },
  scss: {
    monaco: 'scss',
    markdown: 'scss',
  },
  less: {
    monaco: 'less',
    markdown: 'less',
  },
  vue: {
    monaco: 'html',
    markdown: 'html',
  },
  svelte: {
    monaco: 'html',
    markdown: 'html',
  },

  // Data / configuration
  json: {
    monaco: 'json',
    markdown: 'json',
  },
  jsonc: {
    monaco: 'json',
    markdown: 'json',
  },
  yaml: {
    monaco: 'yaml',
    markdown: 'yaml',
  },
  yml: {
    monaco: 'yaml',
    markdown: 'yaml',
  },
  toml: {
    monaco: 'toml',
    markdown: 'toml',
  },
  ini: {
    monaco: 'ini',
    markdown: 'ini',
  },
  xml: {
    monaco: 'xml',
    markdown: 'xml',
  },
  svg: {
    monaco: 'xml',
    markdown: 'xml',
  },

  // Documentation
  md: {
    monaco: 'markdown',
    markdown: 'markdown',
  },
  mdx: {
    monaco: 'mdx',
    markdown: 'mdx',
  },

  // Backend / general-purpose languages
  py: {
    monaco: 'python',
    markdown: 'python',
  },
  rs: {
    monaco: 'rust',
    markdown: 'rust',
  },
  go: {
    monaco: 'go',
    markdown: 'go',
  },
  java: {
    monaco: 'java',
    markdown: 'java',
  },
  sql: {
    monaco: 'sql',
    markdown: 'sql',
  },
  sh: {
    monaco: 'bash',
    markdown: 'bash',
  },
  bash: {
    monaco: 'bash',
    markdown: 'bash',
  },
  zsh: {
    monaco: 'bash',
    markdown: 'bash',
  },
  php: {
    monaco: 'php',
    markdown: 'php',
  },
  rb: {
    monaco: 'ruby',
    markdown: 'ruby',
  },
  cs: {
    monaco: 'csharp',
    markdown: 'csharp',
  },
  cpp: {
    monaco: 'cpp',
    markdown: 'cpp',
  },
  c: {
    monaco: 'c',
    markdown: 'c',
  },
  h: {
    monaco: 'c',
    markdown: 'c',
  },
  hpp: {
    monaco: 'cpp',
    markdown: 'cpp',
  },
  swift: {
    monaco: 'swift',
    markdown: 'swift',
  },
  kt: {
    monaco: 'kotlin',
    markdown: 'kotlin',
  },

  // Other
  dockerfile: {
    monaco: 'dockerfile',
    markdown: 'dockerfile',
  },
  graphql: {
    monaco: 'graphql',
    markdown: 'graphql',
  },
};

type GetLanguageFromFileProps = {
  filePath: string;
  view: ViewType;
};
export const getLanguageFromFilename = ({
  filePath,
  view,
}: GetLanguageFromFileProps) => {
  const filename = filePath.split(/[\/]/).pop()?.toLowerCase() ?? '';

  if (filename === 'dockerfile') return extToLanguage['dockerfile'][view];
  if (filename === 'makefile')
    return view === 'markdown' ? 'makefile' : 'makefile';
  if (filename === '.gitignore')
    return view === 'markdown' ? 'gitignore' : 'gitignore';
  if (filename === '.env') return view === 'markdown' ? 'bash' : 'bash';

  const ext = filename.includes('.') ? (filename.split('.').pop() ?? '') : '';
  return extToLanguage[ext]?.[view] ?? 'plaintext';
};
