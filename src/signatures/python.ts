import Parser, { SyntaxNode, Tree } from 'tree-sitter';
import Python from 'tree-sitter-python';

const parser = new Parser();
parser.setLanguage(Python);

export const getPythonSignatures = (content: string): string => {
  const tree: Tree = parser.parse(content);
  const results: string[] = [];

  const walk = (node: SyntaxNode) => {
    if (node.type === 'function_definition') {
      const nameNode = node.childForFieldName('name');
      const paramsNode = node.childForFieldName('parameters');
      const returnNode = node.childForFieldName('return_type');

      const name = nameNode?.text ?? '';
      const params = paramsNode?.text ?? '';
      const returnType = returnNode ? ` -> ${returnNode.text}` : '';

      results.push(`def ${name}${params}${returnType}:`);
    }

    for (const child of node.namedChildren) {
      walk(child);
    }
  };

  walk(tree.rootNode);
  return results.join('\n\n');
};
