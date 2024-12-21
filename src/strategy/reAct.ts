import type { CoreMessage } from "ai";
import type { AIInterface } from "../core/type";
import { logger } from "../logger";
import type { ToolBox } from "../tools/type";
import { Strategy } from "./base";
import type { StrategyInterface } from "./type";

export class ReAct extends Strategy implements StrategyInterface {
  maxLoopSteps: number;
  constructor(ai: AIInterface, maxLoopSteps = 10) {
    super(ai);
    this.maxLoopSteps = maxLoopSteps;
  }

  async execute(opt: {
    msgs: CoreMessage[];
    model: string;
    isSTream: boolean;
    tools: ToolBox[];
    maxSteps?: number;
  }): Promise<CoreMessage[]> {
    const history = opt.msgs;
    const strategyHistoryMsgs: CoreMessage[] = [...history];
    const newMsgs: CoreMessage[] = [];
    let i = 0;

    while (true) {
      const msgs = await this.execOneStep(strategyHistoryMsgs, opt);
      i++;

      if (msgs == null) {
        logger.debug("done.");
        break;
      } else {
        strategyHistoryMsgs.push(...msgs);
        newMsgs.push(...msgs);
      }

      if (i >= this.maxLoopSteps) {
        logger.debug(`max loop step exceed: ${i}, terminated now.`);
        break;
      }
    }

    return newMsgs.filter((m) => {
      // we filter all the tool related msgs to save context in the main thread
      if (m.role === "tool") {
        // filter toolResult msg
        return false;
      }
      if (m.role === "assistant") {
        if (Array.isArray(m.content)) {
          for (const c of m.content) {
            if (c.type === "tool-call") return false;
          }
        }
      }

      return true;
    });
  }

  async execOneStep(
    history: CoreMessage[],
    {
      model,
      isSTream = false,
      tools,
      maxSteps = 7,
    }: {
      model: string;
      isSTream: boolean;
      tools: ToolBox[];
      maxSteps?: number;
    },
  ): Promise<CoreMessage[] | null> {
    const prompt: CoreMessage = { role: "user", content: this.createPrompts() };
    const { msgs } = await this.ai.chat({
      model,
      msgs: [...history, prompt],
      isSTream,
      tools,
      maxSteps,
    });

    const lastReply = msgs[msgs.length - 1];
    console.log("current step: ", lastReply.content);
    if (typeof lastReply.content === "string" && lastReply.content === "-1") {
      return null;
    }
    if (Array.isArray(lastReply.content)) {
      for (const c of lastReply.content) {
        if (c.type === "text" && c.text === "-1") return null;
      }
    }
    return msgs;
  }

  createPrompts(): string {
    return `
According the chat history, generate a new <Step> to help.

A <Step> means a new thought with reasoning and acting. You should do it in the following order:

1. First, Do function tool calls when necessary to help with the message.
2. Second, Output the One <Step> with One <Thought> and One <Observation> in the following format:
  - Thought: <Your reasoning thought description output to the user>
  - Observation: <Check the result of your action and give your thought a reflex>

Note:
1. If you think problem is solved and there is no further new <Step> needed, just output the text of -1.
2. You should output at most One <Step> per message.
`;
  }
}
