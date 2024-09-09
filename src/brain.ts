import { Message, Ollama } from "ollama";
import process from "process";
import Readline from "readline/promises";
import { stdOutWriteSync } from "./util";
import { initialPrompt } from "./prompt";

export class Brain {
  public ollama: Ollama;

  constructor(llmApiUrl = "http://127.0.0.1:11434") {
    this.ollama = new Ollama({ host: llmApiUrl });
  }

  initFirstMessage() {
    const message: Message = {
      role: "system",
      content: initialPrompt,
    };
    return message;
  }

  async chat(msgs: Message[]) {
    const messages = msgs.length === 0 ? [this.initFirstMessage()] : msgs;
    const readline = Readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const input = await readline.question(">>> You: ");
    readline.close();
    console.log("----");

    const userMessage: Message = { role: "user", content: input };
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
    const answerMessage: Message = { role: "system", content: answer };
    messages.push(answerMessage);

    await this.chat(messages);
  }

}
