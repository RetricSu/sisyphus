import { CoreMessage } from 'ai';
import { ToolBox } from '../tools/type';

export enum StrategyType {
  cot = 'chain-of-thought',
  reAct = 'reasoning-and-acting',
  tot = 'tree-of-thought',
  lats = 'tree-search',
}

export interface StrategyInterface {
  execute: (
    history: CoreMessage[],
    opt: { model: string; isSTream: boolean; tools: ToolBox[]; maxSteps?: number },
  ) => Promise<CoreMessage[]>;
}
