import type { AIInterface } from '../core/type';

export class Strategy {
  ai: AIInterface;
  constructor(ai: AIInterface) {
    this.ai = ai;
  }
}
