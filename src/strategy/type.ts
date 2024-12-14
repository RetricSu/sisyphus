import { CoreMessage } from 'ai';
import { ToolBox } from '../tools/type';

export enum StrategyType {
  cot = 'cot',
  reAct = 'react',
  tot = 'tot',
  lats = 'lats',
}

export interface StrategyInterface {
  execute: (opt: {
    msgs: CoreMessage[];
    model: string;
    isSTream: boolean;
    tools: ToolBox[];
    maxSteps?: number;
  }) => Promise<CoreMessage[]>;
}
