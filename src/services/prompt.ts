import os from 'node:os';

export const systemContext = `
  Operating system: ${os.platform()} ${os.release()}
  Architecture: ${os.arch()}
  Shell: ${process.env.SHELL || process.env.ComSpec || 'unknown'}
  Working directory: ${process.cwd()}
`;
