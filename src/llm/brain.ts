import { Message, Ollama } from 'ollama';
import process from 'process';
import Readline from 'readline/promises';
import { stdOutWriteSync } from './util';
import { Prompt } from '../prompt';
import { spawn } from 'child_process';
import { CMessage } from '../memory/c-message';
import { MessageView } from '../memory/message-view';
import { checkIfToolCall } from '../tools/util';
import { readSettings } from '../config/setting';
import { Privkey } from '../privkey';
import { ToolBox } from '../tools';

const settings = readSettings();

export class Brain {
  apiUrl: string;
  ollama: Ollama;
  model: string;
  toolBox: ToolBox;
  saveMemory: boolean;
  promptNames: string[];

  constructor({
    llmApiUrl = settings.llm.apiUrl,
    model = settings.llm.model,
    saveMemory = true,
    promptNames: promptName = readSettings().prompt.chatPromptNames,
  }: {
    llmApiUrl?: string;
    model?: string;
    saveMemory?: boolean;
    promptNames?: string[];
  }) {
    this.apiUrl = llmApiUrl;
    this.model = model;
    this.saveMemory = saveMemory;
    this.promptNames = promptName;
    this.ollama = new Ollama({ host: this.apiUrl });
    this.toolBox = new ToolBox(Privkey.load());
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

  initFirstMessage() {
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

  buildInitMessages() {
    const msgs = this.saveMemory ? MessageView.listAllMessages() : [];
    return [...this.initFirstMessage(), ...msgs];
  }

  async chat(msgs: Message[]) {
    const messages = msgs.length === 0 ? this.buildInitMessages() : msgs;

    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'tool') {
      // if the last message is not a toolCall Response, let user input
      const readline = Readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      const input = await readline.question('>>> You: ');
      readline.close();
      console.log('----');

      const cmsg = new CMessage('user', input);
      if (this.saveMemory) {
        cmsg.save();
      }
      const userMessage: Message = cmsg.msg;
      messages.push(userMessage);
    }

    const response = await this.ollama.chat({
      model: this.model,
      messages: messages,
      stream: true,
      tools: Object.values(this.toolBox.availableSet).map((tool) => tool.fi),
    });

    await stdOutWriteSync('>>> Sisyphus: ');
    let answer: string = '';
    for await (const part of response) {
      const words = part.message.content;
      await stdOutWriteSync(words);
      answer += words;
    }
    console.log('\n----');

    if (checkIfToolCall(answer)) {
      // Add function response to the conversation
      const toolCmsg = await this.toolBox.buildToolCallResponseCMessage(answer);
      console.debug(toolCmsg);
      if (this.saveMemory) {
        toolCmsg.save();
      }
      messages.push(toolCmsg.msg);
      await this.chat(messages);
    }

    const answerCMsg = new CMessage('assistant', answer);
    if (this.saveMemory) {
      answerCMsg.save();
    }
    const answerMessage: Message = answerCMsg.msg;
    messages.push(answerMessage);
    await this.chat(messages);
  }
}
