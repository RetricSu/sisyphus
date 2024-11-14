import { Message, Ollama } from 'ollama';
import { readSettings } from '../config/setting';
import { spawn } from 'child_process';
import { Prompt } from '../prompt';
import { AMessage } from '../memory/a-message';
import { checkIfToolCall } from '../tools/util';
import { Tools } from '../tools/tools';
import { Memory } from '../memory/long-term';
import { Network } from '../offckb/offckb.config';
import { buildNosCKBToolBox } from '../tools/nosCKB';
import { readWebPageToolBox } from '../tools/readWebPage';
import { terminalToolBox } from '../tools/terminal';
import { timeToolBox } from '../tools/time';
import { Privkey } from '../privkey';
import { buildMemoryToolBox } from '../tools/memory';
import fs from 'fs';

const settings = readSettings();

export interface AgentProp {
  saveMemory?: boolean;
  pipeResponse?: (name: string, word: string) => any;
  promptName?: string;
}

export class Agent {
  name: string;
  role: string;
  ollama: Ollama;
  apiUrl: string;
  model: string;
  tools: Tools;
  saveMemory: boolean;
  promptName: string;
  memoId: string;
  ckbNetwork: Network;
  messages: Message[];
  pipeResponse?: (name: string, word: string) => any;
  memory: Memory;

  constructor({ saveMemory = true, pipeResponse, promptName = readSettings().prompt.selectedPromptName }: AgentProp) {
    this.role = 'assistant';
    this.messages = [];

    this.saveMemory = saveMemory;
    this.promptName = promptName;
    this.pipeResponse = pipeResponse;

    const promptFile = Prompt.Reader.parseFrom(this.promptName);
    this.name = promptFile.name;
    this.apiUrl = promptFile.llm.apiUrl;
    this.model = promptFile.llm.model;
    this.ollama = new Ollama({ host: this.apiUrl });
    this.ckbNetwork = promptFile.ckbNetwork;
    this.memoId = promptFile.memoId;
    this.memory = new Memory(this.memoId);
    const toolNames = promptFile.tools;

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
    } = buildNosCKBToolBox(this.ckbNetwork, privkey);

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

    this.tools = new Tools(toolBoxes);
  }

  isLLMServerRunning(): Promise<boolean> {
    // make a http get request to this.apiUrl to check if it response with "Ollama is running"
    return fetch(`${this.apiUrl}`)
      .then((response) => response.text())
      .then((data) => data === 'Ollama is running')
      .catch(() => {
        return false;
      });
  }

  startLLMServer() {
    return new Promise((resolve: (val: string) => void, reject: (error: string) => void) => {
      const child = spawn('ollama', ['serve'], {
        env: { ...process.env, OLLAMA_HOST: this.apiUrl },
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

    return messages;
  }

  LoadInitialMessages() {
    this.messages = this.loadPromptMessage();
  }

  async saveMessageIntoMemoryIfEnable(message: AMessage) {
    if (this.saveMemory) {
      message.save();
      await this.memory.save(message);
    }
  }

  async call(m: Message, isSTream: boolean | undefined = undefined): Promise<AMessage> {
    const message = new AMessage(this.memoId, m.role, m.content);
    await this.saveMessageIntoMemoryIfEnable(message);
    this.messages.push(message.msg);

    if (isSTream) {
      const response = await this.ollama.chat({
        model: this.model,
        messages: this.messages,
        stream: isSTream as any,
        tools: this.tools.toolBox.map((tool) => tool.fi),
      });

      let answer: string = '';
      for await (const part of response) {
        const words = part.message.content;
        if (this.pipeResponse) {
          await this.pipeResponse(this.name, words);
        }
        answer += words;
      }

      if (checkIfToolCall(answer)) {
        // Add function response to the conversation
        const toolCmsg = await this.tools.buildToolCallResponseCMessage(answer);
        const message = new AMessage(this.memoId, toolCmsg.role, toolCmsg.content);
        console.debug(message);
        await this.saveMessageIntoMemoryIfEnable(message);
        return await this.call(message.msg, isSTream);
      }

      const resMessage = new AMessage(this.memoId, this.role, answer);
      await this.saveMessageIntoMemoryIfEnable(resMessage);
      this.messages.push(resMessage.msg);
      return resMessage;
    } else {
      const response = await this.ollama.chat({
        model: this.model,
        messages: this.messages,
        tools: this.tools.toolBox.map((tool) => tool.fi),
      });
      // Process function calls made by the model
      if (response.message.tool_calls) {
        for (const tool of response.message.tool_calls) {
          const toolCmsg = await this.tools.executeToolCall(tool);

          const message = new AMessage(this.memoId, toolCmsg.role, toolCmsg.content);
          console.debug(message);
          await this.saveMessageIntoMemoryIfEnable(message);
          // Add function response to the conversation
          this.messages.push(message.msg);
        }

        const finalResp = await this.ollama.chat({
          model: this.model,
          messages: this.messages,
          tools: this.tools.toolBox.map((tool) => tool.fi),
        });
        const answer = finalResp.message.content;
        if (this.pipeResponse) {
          await this.pipeResponse(this.name, answer);
        }
        const resMessage = new AMessage(this.memoId, this.role, answer);
        await this.saveMessageIntoMemoryIfEnable(resMessage);
        this.messages.push(resMessage.msg);
        return resMessage;
      }

      const answer = response.message.content;
      if (this.pipeResponse) {
        await this.pipeResponse(this.name, answer);
      }
      const resMessage = new AMessage(this.memoId, this.role, answer);
      await this.saveMessageIntoMemoryIfEnable(resMessage);
      this.messages.push(resMessage.msg);
      return resMessage;
    }
  }
}
