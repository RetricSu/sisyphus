import { Message, Ollama } from "ollama";
import process from "process";
import Readline from "readline/promises";
import { stdOutWriteSync } from "./util";
import { initialPrompt } from "./prompt";
import { spawn } from "child_process";
import { CMessage } from "./memory/c-message";
import { MessageView } from "./memory/message-view";
import { buildToolCallResponseCMessage, checkIfToolCall, tools } from "./tool";

export class Brain {
  public apiUrl: string;
  public ollama: Ollama;
  public model = "llama3.1";

  constructor(llmApiUrl = "http://127.0.0.1:11434") {
    this.apiUrl = llmApiUrl;
    this.ollama = new Ollama({ host: this.apiUrl });
  }

  startLLMServer() {
    return new Promise(
      (resolve: (val: string) => any, reject: (error: string) => any) => {
        const child = spawn("ollama", ["serve"], {
          env: { ...process.env, OLLAMA_HOST: this.apiUrl },
        });

        // Listen to the stdout of the process
        child.stdout.on("data", (data) => {
          const output = data.toString();
          resolve(output); // Resolve when any data is received
        });

        child.stderr.on("data", (data) => {
	  resolve(data); // Resolve when any data is received
        });

        child.on("close", (code) => {
          if (code !== 0) {
            reject(`Process exited with code ${code}`);
          }
        });

        child.on("error", (error) => {
          reject(`Process error: ${error.message}`);
        });
      }
    );
  }

  initFirstMessage() {
    const message: Message = {
      role: "system",
      content: initialPrompt,
    };
    return message;
  }

  buildInitMessages() {
    const msgs = MessageView.listAllMessages();
    return [this.initFirstMessage(), ...msgs];
  }

  async chat(msgs: Message[]) {
    const messages = msgs.length === 0 ? this.buildInitMessages() : msgs;

    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "tool") {
      // if the last message is not a toolCall Response, let user input
      const readline = Readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      const input = await readline.question(">>> You: ");
      readline.close();
      console.log("----");

      const cmsg = new CMessage("user", input);
      cmsg.save();
      const userMessage: Message = cmsg.msg;
      messages.push(userMessage);
    }

    const response = await this.ollama.chat({
      model: this.model,
      messages: messages,
      stream: true,
      tools: Object.values(tools),
    });

    await stdOutWriteSync(">>> Sisyphus: ");
    let answer: string = "";
    for await (const part of response) {
      const words = part.message.content;
      await stdOutWriteSync(words);
      answer += words;
    }
    console.log("\n----");

    if (checkIfToolCall(answer)) {
      // Add function response to the conversation
      const toolCmsg = buildToolCallResponseCMessage(answer);
      console.debug(toolCmsg)
      toolCmsg.save();
      messages.push(toolCmsg.msg);
      await this.chat(messages);
    }

    const answerCMsg = new CMessage("assistant", answer);
    answerCMsg.save();
    const answerMessage: Message = answerCMsg.msg;
    messages.push(answerMessage);
    await this.chat(messages);
  }
}
