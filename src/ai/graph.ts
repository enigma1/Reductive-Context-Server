import { StateGraph, START, END } from '@langchain/langgraph';
import { checkpointer } from './init';
import { promptState } from './state';
import {
  generateContentNode,
  classifyScopeNode,
  askUserNode,
} from './decisionNodes';

const workflow = new StateGraph(promptState)
  .addNode('classifyScope', classifyScopeNode)
  .addNode('generateContent', generateContentNode)
  .addNode('askUser', askUserNode)
  .addEdge(START, 'classifyScope')
  .addEdge('classifyScope', 'generateContent')
  .addConditionalEdges('generateContent', (state) => {
    if (state.frontRequest?.clarification) return 'askUser';
    return END;
  })
  .addEdge('askUser', 'generateContent');

export const promptGraph = workflow.compile({ checkpointer });
