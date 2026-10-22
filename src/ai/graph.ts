import { StateGraph, START, END } from '@langchain/langgraph';
import { checkpointer } from './init';
import { promptState } from './state';
import {
  generateCodeNode,
  classifyScopeNode,
  askUserNode,
} from './decisionNodes';

const workflow = new StateGraph(promptState)
  .addNode('classifyScope', classifyScopeNode)
  .addNode('generateCode', generateCodeNode)
  .addNode('askUser', askUserNode)
  .addEdge(START, 'classifyScope')
  .addEdge('classifyScope', 'generateCode')
  .addConditionalEdges('generateCode', (state) => {
    if (state.frontRequest?.clarification) return 'askUser';
    return END;
  })
  .addEdge('askUser', 'generateCode');

export const promptGraph = workflow.compile({ checkpointer });
