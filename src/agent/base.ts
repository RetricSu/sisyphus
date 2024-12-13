import { readSettings } from '../config/setting';
import { spawn } from 'child_process';
import { Prompt, PromptFile } from '../prompt';
import { AMessage } from '../memory/a-message';
import { Memory } from '../memory/long-term';
import { Network } from '../offckb/offckb.config';
import { buildNosCKBToolBox } from '../tools/nosCKB';
import { readWebPageToolBox } from '../tools/readWebPage';
import { terminalToolBox } from '../tools/terminal';
import { timeToolBox } from '../tools/time';
import { Privkey } from '../privkey';
import { buildMemoryToolBox } from '../tools/memory';
import fs from 'fs';
import { AIInterface, Message } from '../core/type';
import { OllamaAdapter } from '../core/ollama';
import { ToolBox } from '../tools/type';
import { OpenAIAdapter } from '../core/open-ai';
import { AnthropicAdapter } from '../core/anthropic';
import { CoreMessage } from 'ai';
import { ReAct } from '../strategy/reAct';
import { buildTwitterTools } from '../tools/twitter';

const settings = readSettings();

export interface AgentProp {
  saveMemory?: boolean;
  pipeResponse?: (name: string, word: string) => any;
  promptName?: string;
}

export class Agent {
  name: string;
  role: string;
  ai: AIInterface;
  apiUrl: string;
  apiKey: string | undefined;
  model: string;
  tools: ToolBox[];
  saveMemory: boolean;
  promptName: string;
  memoId: string;
  ckbNetwork: Network;
  maxSteps: number;
  messages: Message[];
  pipeResponse?: (name: string, word: string) => any;
  memory: Memory;
  promptFile: PromptFile;

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
    this.memory = new Memory(this.memoId);
    const toolNames = promptFile.tools;

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

      default:
        throw new Error(
          `invalid provider from prompt, ${promptFile.llm.provider}, provider must be 'ollama', 'openai' or 'anthropic'`,
        );
    }

    Privkey.init(this.memoId);
    const privkey = Privkey.load(this.memoId);

    const {
      ckbBalanceToolBox,
      accountInfoToolBox,
      transferCKBToolBox,
      publishNoteToolBox,
      readNostrEvents,
      readMentionNotesWithMe,
      publishProfileEvent,
      publishReplyNotesToEvent,
    } = buildNosCKBToolBox(this.ckbNetwork, privkey, promptFile.nostr?.relays);

    const memoryToolBox = buildMemoryToolBox(this.memoId);

    const toolBoxes = [
      timeToolBox,
      terminalToolBox,
      readWebPageToolBox,
      ckbBalanceToolBox,
      accountInfoToolBox,
      transferCKBToolBox,
      publishNoteToolBox,
      readNostrEvents,
      readMentionNotesWithMe,
      publishProfileEvent,
      publishReplyNotesToEvent,
      memoryToolBox,
    ].filter((t) => toolNames.includes(t.fi.function.name));

    if (toolNames.includes('send_tweet')) {
      const twitterTools = buildTwitterTools(this.promptFile);
      toolBoxes.push(twitterTools[0] as any);
    }

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

  async saveMessageIntoMemoryIfEnable(message: AMessage) {
    if (this.saveMemory) {
      message.save();
      await this.memory.save(message);
    }
  }

  async handleMsgsOutput(msgs: CoreMessage[]) {
    for (let i = 0; i < msgs.length; i++) {
      this.messages.push(msgs[i]);

      // todo: handle details of the msgs
      const msg = msgs[i].content;
      let answer: string = '';
      if (typeof msg === 'string') {
        answer = msg;
      } else {
        if (Array.isArray(msg)) {
          answer += msg.filter((c) => c.type === 'text').map((c) => c.text);
        } else {
          answer = JSON.stringify(msg);
        }
      }
      if (this.pipeResponse) {
        await this.pipeResponse(this.name, answer);
      }
      const resMessage = new AMessage(this.memoId, msgs[i].role, answer);
      await this.saveMessageIntoMemoryIfEnable(resMessage);
    }
  }

  async callMessage(
    m?: { role: string; content: string },
    isSTream: boolean | undefined = undefined,
  ): Promise<CoreMessage[]> {
    if (m) {
      const message = new AMessage(this.memoId, m.role, m.content as string);
      await this.saveMessageIntoMemoryIfEnable(message);
      this.messages.push(message.msg as Message);
    }

    const { msgs } = await this.ai.chat({
      model: this.model,
      msgs: this.messages,
      isSTream: isSTream ?? false,
      tools: this.tools,
      maxSteps: this.maxSteps,
    });

    await this.handleMsgsOutput(msgs);

    return msgs;
  }

  async callMessageWithStrategy(
    m?: { role: string; content: string },
    isSTream: boolean | undefined = undefined,
  ): Promise<CoreMessage[]> {
    if (m) {
      const message = new AMessage(this.memoId, m.role, m.content as string);
      await this.saveMessageIntoMemoryIfEnable(message);
      this.messages.push(message.msg as Message);
    }

    const strategy = new ReAct(this.ai);
    const msgs = await strategy.execute(this.messages, {
      model: this.model,
      isSTream: isSTream ?? false,
      tools: this.tools,
      maxSteps: this.maxSteps,
    });
    await this.handleMsgsOutput(msgs);
    return msgs;
  }
}
