/* File: src/services/tokenizer.ts
  Functions to calculate usage tokens
*/
import { get_encoding, type TiktokenEncoding } from '@dqbd/tiktoken';

const CHARS_PER_TOKEN = 4;

// Cache encoders — they're WASM instances, don't recreate per call
const encoders = new Map<string, ReturnType<typeof get_encoding>>();

function getEncoder(name: TiktokenEncoding) {
  if (!encoders.has(name)) {
    encoders.set(name, get_encoding(name));
  }
  return encoders.get(name)!;
}

// Maps AI_MODEL config string to a tiktoken encoding name.
// Returns null if no local encoding is available - falls back to rough estimate
const encodingForModel = (model: string): TiktokenEncoding | null => {
  const m = model.toLowerCase();

  // Ollama-hosted models — use the underlying model's tokenizer
  if (m.startsWith('ollama:')) {
    const name = m.slice('ollama:'.length);
    // if (name.startsWith('qwen')) return 'qwen2';
    // if (name.startsWith('llama-3')) return 'llama3';
    // Add more as needed
    return null;
  }

  // OpenAI
  if (m.startsWith('openai:')) {
    const name = m.slice('openai:'.length);
    if (
      name.startsWith('gpt-4o') ||
      name.startsWith('o1') ||
      name.startsWith('o3')
    )
      return 'o200k_base';
    return 'cl100k_base';
  }

  // OpenRouter / OpenAI-compatible — best guess based on model name
  if (m.startsWith('openai-compatible:')) {
    const name = m.slice('openai-compatible:'.length);
    if (name.startsWith('gpt-4o') || name.startsWith('o1')) return 'o200k_base';
    // if (name.startsWith('qwen')) return 'qwen2';
    // if (name.startsWith('llama-3')) return 'llama3';
    if (name.startsWith('qwen')) return null;
    if (name.startsWith('llama-3')) return null;

    return 'cl100k_base'; // reasonable default
  }

  // Anthropic, Google no tiktoken encoding available use rough estimate
  return null;
};

export const estimateTokens = (text: string) =>
  Math.ceil(text.length / CHARS_PER_TOKEN);

type CountTokensProps = {
  text: string;
  model: string;
};
export const countTokens = ({ text, model }: CountTokensProps) => {
  const encodingName = encodingForModel(model);

  if (encodingName) {
    try {
      const enc = getEncoder(encodingName);
      const tokens = enc.encode(text);
      return tokens.length;
    } catch {
      // Encoding not available in this build will use rough approximation
    }
  }

  // Otherwise use rough estimate
  return estimateTokens(text);
};
