import { StateGraph, START, END } from '@langchain/langgraph';
import { checkpointer } from './init';
import { promptState } from './state';
import { generateCodeNode, classifyScopeNode } from './decisionNodes';

const workflow = new StateGraph(promptState)
  .addNode('classifyScope', classifyScopeNode)
  .addNode('generateCode', generateCodeNode)
  .addEdge(START, 'classifyScope')
  .addEdge('classifyScope', 'generateCode')
  .addEdge('generateCode', END);

export const promptGraph = workflow.compile({
  checkpointer,
});
