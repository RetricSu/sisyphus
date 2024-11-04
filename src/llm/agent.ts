import { Message, Ollama } from 'ollama';
import { ToolBox } from '../tools/type';
import { readSettings } from '../config/setting';
import { spawn } from 'child_process';
import { Prompt } from '../prompt';
import { MessageView } from '../memory/message-view';
import { MemoId } from '../memory/type';
import { AMessage } from '../memory/a-message';
import { checkIfToolCall } from '../tools/util';
import { Tools } from '../tools/tools';

const settings = readSettings();

export interface AgentProp {
  name: string;
  memoId: string;
  role?: string;
  toolBoxes?: ToolBox[];
  llmApiUrl?: string;
  model?: string;
  saveMemory?: boolean;
  pipeResponse?: (name: string, word: string) => any;
  promptNames?: string[];
}

export class Agent {
  name: string;
  role: string;
  ollama: Ollama;
  apiUrl: string;
  model: string;
  tools: Tools;
  saveMemory: boolean;
  promptNames: string[];
  memoId: string;
  messages: Message[];
  pipeResponse?: (name: string, word: string) => any;

  constructor({
    name,
    memoId,
    role = 'assistant',
    llmApiUrl = settings.llm.apiUrl,
    model = settings.llm.model,
    toolBoxes = [],
    saveMemory = true,
    pipeResponse,
    promptNames: promptName = readSettings().prompt.chatPromptNames,
  }: AgentProp) {
    this.name = name;
    this.role = role;
    this.apiUrl = llmApiUrl;
    this.model = model;
    this.memoId = memoId;
    this.saveMemory = saveMemory;
    this.promptNames = promptName;
    this.pipeResponse = pipeResponse;
    this.ollama = new Ollama({ host: this.apiUrl });
    this.tools = new Tools(toolBoxes);
    this.messages = [];
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

  loadPromptMessage() {
    const messages: Message[] = [];
    for (const promptName of this.promptNames) {
      const promptFile = Prompt.Reader.parseFrom(promptName);
      const msg: Message = {
        role: promptFile.role,
        content: promptFile.content,
      };
      messages.push(msg);
    }

    return messages;
  }

  LoadInitialMessages() {
    const msgs = this.saveMemory ? MessageView.listAllMessages(this.memoId as MemoId) : [];
    this.messages = [...this.loadPromptMessage(), ...msgs];
  }

  async call(m: Message, isSTream: boolean | undefined = undefined): Promise<AMessage> {
    const message = new AMessage(this.memoId, m.role, m.content);
    if (this.saveMemory) {
      message.save();
    }
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
        if (this.saveMemory) {
          message.save();
        }
        return await this.call(message.msg, isSTream);
      }

      const resMessage = new AMessage(this.memoId, this.role, answer);
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
          if (this.saveMemory) {
            message.save();
          }
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
        this.messages.push(resMessage.msg);
        return resMessage;
      }

      const answer = response.message.content;
      if (this.pipeResponse) {
        await this.pipeResponse(this.name, answer);
      }
      const resMessage = new AMessage(this.memoId, this.role, answer);
      this.messages.push(resMessage.msg);
      return resMessage;
    }
  }
}
