import {
  isVariableStatement,
  isArrowFunction,
  isFunctionExpression,
  canHaveModifiers,
  getModifiers,
  createSourceFile,
  ScriptKind,
  ScriptTarget,
  SyntaxKind,
  NodeFlags,
  type Node,
  type SourceFile,
  type VariableStatement,
} from 'typescript';
import path from 'node:path';
import { SignatureOptions } from './extractor';

const isExported = (node: import('typescript').Node): boolean =>
  canHaveModifiers(node) &&
  (getModifiers(node)?.some(
    (modifier) => modifier.kind === SyntaxKind.ExportKeyword,
  ) ??
    false);

const getScriptKind = (filePath: string): ScriptKind => {
  switch (path.extname(filePath).toLowerCase()) {
    case '.tsx':
      return ScriptKind.TSX;
    case '.jsx':
      return ScriptKind.JSX;
    case '.js':
    case '.mjs':
    case '.cjs':
      return ScriptKind.JS;
    default:
      return ScriptKind.TS;
  }
};

const getVariableSignature = (
  node: VariableStatement,
  sourceFile: SourceFile,
): string | null => {
  if (!isExported(node)) return null;

  const content = sourceFile.text;
  const declarations = node.declarationList.declarations.map((decl) => {
    const initializer = decl.initializer;

    if (
      initializer &&
      (isArrowFunction(initializer) || isFunctionExpression(initializer)) &&
      initializer.body.kind === SyntaxKind.Block
    ) {
      const body = initializer.body;

      return (
        content.slice(decl.getStart(sourceFile), body.getStart(sourceFile)) +
        '{ /* implementation omitted */ }'
      );
    }

    return decl.getText(sourceFile);
  });

  const declarationKind =
    node.declarationList.flags & NodeFlags.Const
      ? 'const'
      : node.declarationList.flags & NodeFlags.Let
        ? 'let'
        : 'var';

  const modifiers = getModifiers(node) ?? [];
  const prefix = modifiers
    .map((modifier) => modifier.getText(sourceFile))
    .join(' ');

  return `${prefix} ${declarationKind} ${declarations.join(', ')};`;
};

export const getTypescriptSignatures = (
  content: string,
  options?: SignatureOptions,
): string => {
  const { filePath } = options ?? {};
  if (!filePath) return content;

  const sourceFile = createSourceFile(
    filePath,
    content,
    ScriptTarget.Latest,
    true,
    getScriptKind(filePath),
  );

  const printer = (node: Node): string => node.getText(sourceFile);

  const results: string[] = [];

  const visit = (node: Node): void => {
    switch (node.kind) {
      case SyntaxKind.ImportDeclaration:
      case SyntaxKind.ExportDeclaration:
      case SyntaxKind.InterfaceDeclaration:
      case SyntaxKind.TypeAliasDeclaration:
      case SyntaxKind.EnumDeclaration:
      case SyntaxKind.FunctionDeclaration:
      case SyntaxKind.ClassDeclaration:
      case SyntaxKind.ModuleDeclaration:
        results.push(printer(node));
        return;
      case SyntaxKind.VariableStatement: {
        if (isVariableStatement(node) && isExported(node)) {
          const signature = getVariableSignature(node, sourceFile);
          if (signature) results.push(signature);
        }
        return;
      }
    }

    // Include exported declarations nested in a namespace/module.
    node.forEachChild(visit);
  };

  sourceFile.forEachChild(visit);

  return results.join('\n\n').trim();
};
