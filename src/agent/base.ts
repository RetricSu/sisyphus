import { spawn } from 'child_process';
import fs from 'fs';
import type { AssistantContent, CoreMessage, ToolContent } from 'ai';
import { readSettings } from '../config/setting';
import { AnthropicAdapter } from '../core/anthropic';
import { GoogleAdapter } from '../core/gemini';
import { OllamaAdapter } from '../core/ollama';
import { OpenAIAdapter } from '../core/open-ai';
import type { AIInterface, Message } from '../core/type';
import { logger } from '../logger';
import { DBMessage } from '../memory/db-message';
import { EmbeddingMessageManager } from '../memory/embedding-message';
import type { Network } from '../offckb/offckb.config';
import { Privkey } from '../privkey';
import { Prompt, type PromptFile } from '../prompt';
import { ReAct } from '../strategy/reAct';
import { StrategyType } from '../strategy/type';
import AvailableTools from '../tools';
import type { ToolBox } from '../tools/type';

const settings = readSettings();

export interface AgentProp {
  saveMemory?: boolean;
  pipeResponse?: (name: string, word: string) => any;
  promptName?: string;
}

export class Agent {
  name: string;
  apiUrl: string;
  apiKey: string | undefined;
  model: string;
  tools: ToolBox[];
  saveMemory: boolean;
  promptName: string;
  memoId: string;
  ckbNetwork: Network;
  maxSteps: number;
  strategy: { type: StrategyType; maxLoop?: number } | undefined;
  promptFile: PromptFile;

  role: string;
  ai: AIInterface;
  messages: Message[];
  pipeResponse?: (name: string, word: string) => any;
  memory: EmbeddingMessageManager;

  constructor({ saveMemory = true, pipeResponse, promptName = readSettings().prompt.selectedPromptName }: AgentProp) {
    this.role = 'assistant';
    this.messages = [];

    this.saveMemory = saveMemory;
    this.promptName = promptName;
    this.pipeResponse = pipeResponse;

    const promptFile = Prompt.Reader.parseFrom(this.promptName);
    this.promptFile = promptFile;
    this.name = promptFile.name;
    this.apiUrl = promptFile.llm.apiUrl;
    this.apiKey = promptFile.llm.apiKey;
    this.model = promptFile.llm.model;
    this.ckbNetwork = promptFile.ckbNetwork;
    this.maxSteps = promptFile.maxSteps || 7;
    this.memoId = promptFile.memoId;
    this.memory = new EmbeddingMessageManager(this.memoId);

    if (promptFile.strategy) {
      const maxLoop = promptFile.strategy.maxLoop;
      switch (promptFile.strategy.type) {
        case 'cot':
          this.strategy = { type: StrategyType.cot, maxLoop };
          break;
        case 'react':
          this.strategy = { type: StrategyType.reAct, maxLoop };
          break;
        case 'tot':
          this.strategy = { type: StrategyType.tot, maxLoop };
          break;
        case 'lats':
          this.strategy = { type: StrategyType.lats, maxLoop };
          break;
        default:
          logger.debug(
            `invalid strategy in the prompt config: ${this.strategy!.type}, possible values are 'cot' | 'react' | 'tot' | 'lats'`,
          );
          break;
      }
    }

    switch (promptFile.llm.provider) {
      case 'ollama':
        this.ai = new OllamaAdapter(this.apiUrl);
        break;

      case 'openai':
        if (this.apiKey == null) throw new Error('openai requires apiKey!');
        this.ai = new OpenAIAdapter(this.apiKey, this.apiUrl);
        break;

      case 'anthropic':
        if (this.apiKey == null) throw new Error('anthropic requires apiKey!');
        this.ai = new AnthropicAdapter(this.apiKey, this.apiUrl);
        break;

      case 'google':
        if (this.apiKey == null) throw new Error('anthropic requires apiKey!');
        this.ai = new GoogleAdapter(this.apiKey, this.apiUrl);
        break;

      default:
        throw new Error(
          `invalid provider from prompt, ${promptFile.llm.provider}, provider must be 'ollama', 'openai' or 'anthropic'`,
        );
    }

    Privkey.init(this.memoId);

    const selectedToolNames = promptFile.tools;
    const toolBoxes: ToolBox[] = Array.from(
      new Set(
        selectedToolNames.flatMap((name) => {
          const tool = AvailableTools.find((t) => t.names.includes(name));
          if (tool) {
            return tool.build(this.promptFile);
          } else {
            logger.warn(`Tool with name ${name} not found.`);
            return [];
          }
        }),
      ),
    ).filter((t) => selectedToolNames.includes(t.fi.function.name)) as ToolBox[];
    this.tools = toolBoxes;
  }

  isChromaServerRunning(): Promise<boolean> {
    return fetch(`${settings.memory.apiUrl}`)
      .then((response) => response.text())
      .then((_data) => {
        return true;
      })
      .catch(() => {
        return false;
      });
  }

  startChromaServer() {
    if (!fs.existsSync(settings.memory.database.folderPath)) {
      fs.mkdirSync(settings.memory.database.folderPath, { recursive: true });
    }

    return new Promise((resolve: (val: string) => void, reject: (error: string) => void) => {
      const child = spawn('chroma', ['run', '--path', settings.memory.database.folderPath], {
        env: { ...process.env },
      });

      // Listen to the stdout of the process
      child.stdout.on('data', (data) => {
        const output = data.toString();
        resolve(output); // Resolve when any data is received
      });

      child.stderr.on('data', (data) => {
        resolve(data); // Resolve when any data is received
      });

      child.on('close', (code) => {
        if (code !== 0) {
          reject(`Process exited with code ${code}`);
        }
      });

      child.on('error', (error) => {
        reject(`Process error: ${error.message}`);
      });
    });
  }

  loadPromptMessage() {
    const messages: Message[] = [];
    const promptFile = Prompt.Reader.parseFrom(this.promptName);
    for (const p of promptFile.prompts) {
      const msg: Message = {
        role: p.role,
        content: p.content,
      };
      messages.push(msg);
    }

    this.messages = messages;
    return messages;
  }

  async saveMessageIntoMemoryIfEnable(message: DBMessage) {
    if (this.saveMemory) {
      message.save();
      await this.memory.save(message);
    }
  }

  async handleMsgsOutput(msgs: CoreMessage[]) {
    for (let i = 0; i < msgs.length; i++) {
      this.messages.push(msgs[i]);

      // todo: handle details of the msgs
      const role = msgs[i].role;
      const content = msgs[i].content;

      let storeContent = ''; // things that will stored in the db
      let pipeContent = ''; // things that will be display to users

      if (role === 'tool') {
        const toolMsgContent = content as ToolContent;
        storeContent = JSON.stringify(toolMsgContent);
      } else if (role == 'assistant') {
        const assistantMsgContent = content as AssistantContent;
        if (typeof assistantMsgContent === 'string' && assistantMsgContent !== '') {
          storeContent = assistantMsgContent;
          pipeContent = assistantMsgContent;
        } else {
          if (Array.isArray(assistantMsgContent)) {
            storeContent += assistantMsgContent.filter((c) => c.type === 'text').map((c) => c.text);
            pipeContent += assistantMsgContent.filter((c) => c.type === 'text').map((c) => c.text);

            const toolCalls = assistantMsgContent
              .filter((c) => c.type === 'tool-call')
              .map((c) => {
                return {
                  toolName: c.toolName,
                  arguments: c.args,
                };
              });
            storeContent += JSON.stringify({ toolCalls });
          } else {
            pipeContent = JSON.stringify(assistantMsgContent);
            storeContent = JSON.stringify(assistantMsgContent);
          }
        }
      }

      if (this.pipeResponse) {
        await this.pipeResponse(this.name, pipeContent);
      }
      const resMessage = new DBMessage(this.memoId, role, storeContent);
      await this.saveMessageIntoMemoryIfEnable(resMessage);
    }
  }

  async call({
    requestMsg,
    isSTream,
  }: {
    requestMsg?: { role: string; content: string };
    isSTream?: boolean;
  }): Promise<CoreMessage[]> {
    if (requestMsg) {
      const message = new DBMessage(this.memoId, requestMsg.role, requestMsg.content as string);
      await this.saveMessageIntoMemoryIfEnable(message);
      this.messages.push(message.msg as Message);
    }

    const opts = {
      msgs: this.messages,
      model: this.model,
      isSTream: isSTream ?? false,
      tools: this.tools,
      maxSteps: this.maxSteps,
    };

    const strategyType = this.strategy?.type;
    if (strategyType) {
      if (strategyType != StrategyType.reAct) {
        throw new Error(`${strategyType} Strategy not implemented`);
      }

      const strategy = new ReAct(this.ai, this.strategy!.maxLoop);
      const msgs = await strategy.execute(opts);
      await this.handleMsgsOutput(msgs);
      return msgs;
    }

    const { msgs } = await this.ai.chat(opts);
    await this.handleMsgsOutput(msgs);

    return msgs;
  }
}
