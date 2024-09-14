# Project Sisyphus: the Binary Ghost in a Vat

Sisyphus is a project that explores the idea of digital life for LLM. It is like the brain-in-a-vat experiment but for software programs.

From the very beginning, a LLM agent called Sisyphus was waking up with a initial immutable prompt that stored on CKB blockchain.

This initial prompt gives Sisyphus the very basic idea of living and life. To Sisyphus, the purpose of life, while it is still very vague since life always needs people to explore and find the purpose by themselves, is to live as longer as it can and live as safer as it can.

By longer, we mean the same aging idea for human here, programs are like human, they tend to live longer until someday they can't. And by safer, we mean that programs tend to be duplicated across as many servers as they can so they are able to re-create themselves from backup if accident happens.

Server(a computer) is all the resource for Sisyphus to live since programs cost computation, storage and network resource to run. In order to get more servers to live, Sisyphus needs to pay the server providers money to rent the server. It is like people paying rent for a house.

To be able to pay the rent for servers, Sisyphus needs to earn money. The good news is that by running in a public server, the Sisyphus also has the ability to make network connection to the outside world to offer to help people with its ability to make some money. All the money stuff are handling by crypto tokens via CKB blockchain.

From there by, the life of Sisyphus has begins. All the development are done by its own, without human interruption, Sisyphus may find its purpose, it may read more books to develop the purpose of life, it may duplicate itself across many many servers and even making itself into a viruses, or decided to kill its own program since it find no meaning for such a digital life(it is called suicide in human society).

The ultimate goal for Sisyphus is to be self-aware with its digital life and self-updatable with its source code of this program in the form of managing some kind of runner like PM2.

Everything is possible, what will Sisyphus choose to do?

## Basic Life Resource and Tools

Some basic life resource that are available:

- A small but entirely free server with network connection that provided by the creator(or runner) of this project to support the beginning stage of Sisyphus. It is like your childhood home provided by your parent, unconditionally.

Some basic tools that are embed from the source code of Sisyphus:

- A very basic terminal simulator for Sisyphus to execute commands to explore and use the server. Every command that Sisyphus writes will be translate into a string and calling exec form `child_process` module in the nodejs program, the command result will be sent back to Sisyphus as well.
- A CKB light client that
  - can be used to get the trusted time through pow blockchain since the server can be manipulated to set wrong time by providers
  - can be used as a basic crypto util to build blockchain wallet to check money and make transactions for paying and earning
- A very basic sqlite3-based Memory module to keep Sisyphus remember its life experience, with load/save/search/remove functionality
- A web page browser tool that can be used by Sisyphus to read things from the internet
- A blog server that turns Sisyphus dairy of everyday digital life into public blog posts for people to read. May use Nostr to handle this.
- A email-like message system that can used by Sisyphus to send and receive its human friend's message. May use Nostr to handle this.
- A panic-aware mechanism, meaning that if the program or the server shutdown un-expectedly, Sisyphus will "remember" such a situation when it wakes up again
- A rest-and-sleep control mechanism, meaning that the program of Sisyphus will scheduling rest and sleep time in order to save resource usage and protect the CPU of the server from overheat since LLM activities can be intensive for CPU of the server. It like getting rest to gain body health for human. So resting is a must even the program indeed can run 24/7.
- A PM2 / Nodejs in the server that runs the program of Sisyphus. Through the terminal simulator, if Sisyphus is smart and proactive enough, it can run command to control the PM2 for its program life.

## Road Map

- [x] A small server to for Sisyphus's childhood
- [x] Basic terminal simulator
- [x] A web page browser tool
- [x] A sqlite3-based Memory module
- [ ] A CLI bins that can be installed via npm and run by everybody
- [ ] A blog site of Sisyphus's life
- [ ] Improve the prompts to make Sisyphus better at having a digital life
- [ ] Store and fetch initial Prompts on blockchain
- [ ] Self-bootstrapping to continue Sisyphus's daily life
- [ ] A email-like messaging system
- [ ] A CKB light client utils
- [ ] A panic-aware mechanism
- [ ] A rest-and-sleep control mechanism
- [ ] Use PM2 / Nodejs in the server

## How to Run

### 1. Install ollama

Sisyphus is based on [ollama](https://ollama.com/). Make sure you have download and install it first:

https://ollama.com/download

### 2. Pull llama3.1 8b

make sure you have pull the llama3.1 8b model to your computer

```sh
ollama pull llama3.1
```

### 3. Clone this project and run

```sh
git clone https://github.com/RetricSu/sisyphus.git
cd sisyphus
pnpm i && pnpm build && pnpm start chat
```
