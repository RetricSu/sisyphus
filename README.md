# Sisyphus is a Nostr Crypto AI agent experiment

At the beginning, what I really want to achieve is something like [this](/docs/project-sisyphus.md). But that is a very ultimate goal and is so hard for current open source small models and tech stack to work it out.

In order to achieve this goal, a different phases plan are proposed.

Right now the Phase 1 called Toy-Story amis to make Sisyphus a fun-to-play toy that everybody can run in their laptop to communicate in Nostr network and do crypto transactions stuff on CKB blockchain.

In simple terms, you can run Sisyphus in your computer and chat with it, it has a private key and the ability to control a Nostr account and a CKB account, like publishing nostr short notes, checking CKB balance and transfer CKB.

## How to Run

> [!WARNING]
> Please Note that running Sisyphus on your computer might cause unexpected behavior(think like LLM agent can delete your files)

### 1. Install ollama

Sisyphus is based on [ollama](https://ollama.com/). Make sure you have download and install it first:

https://ollama.com/download

### 2. Pull llama3.1 8b

Make sure you have pull the llama3.1 8b model to your computer

```sh
ollama pull llama3.1
```

### 3. Install Sisyphus CLI tool

```sh
npm install -g @sisyphus-ai/cli
```

### 4. Run

Before chatting with Sisyphus, set CKB blockchain network:

```sh
export NETWORK=testnet # or devnet, mainnet
```

Start chatting:

```sh
sisyphus --version
sisyphus chat
```

### Update Prompts

```sh
sisyphus config list
```

Locate the prompt store position from the config and edit the `.toml` file to update prompts.
