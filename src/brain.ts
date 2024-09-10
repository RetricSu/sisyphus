import { Message, Ollama } from "ollama";
import process from "process";
import Readline from "readline/promises";
import { stdOutWriteSync } from "./util";
import { initialPrompt } from "./prompt";
import { exec } from "child_process";
import { CMessage } from "./memory/c-message";
import { MessageView } from "./memory/message-view";

export class Brain {
  public apiUrl: string;
  public ollama: Ollama;

  constructor(llmApiUrl = "http://127.0.0.1:11434") {
    this.apiUrl = llmApiUrl;
    this.ollama = new Ollama({ host: this.apiUrl });
  }

  startLLMServer() {
    exec(`OLLAMA_HOST=${this.apiUrl} ollama serve`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
    });
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

    const response = await this.ollama.chat({
      model: "llama3.1",
      messages: messages,
      stream: true,
    });

    await stdOutWriteSync(">>> Sisyphus: ");
    let answer: string = "";
    for await (const part of response) {
      const words = part.message.content;
      await stdOutWriteSync(words);
      answer += words;
    }
    console.log("\n----");
    const answerCMsg = new CMessage("assistant", answer);
    answerCMsg.save();
    const answerMessage: Message = answerCMsg.msg;
    messages.push(answerMessage);

    await this.chat(messages);
  }
}
