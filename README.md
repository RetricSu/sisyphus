# Sisyphus is a Web5 Crypto AI agent experiment

At the beginning, what I really want to achieve is something like [this](/docs/project-sisyphus.md). But that is a very ultimate goal and is so hard for current open source small models and tech stack to work it out.

In order to achieve this goal, a different phases plan are proposed.

Right now in the first early stage we amis to make Sisyphus a fun-to-play toy that everybody can run in their laptop to communicate in Nostr network and do crypto transactions stuff on CKB blockchain.

In simple terms, you can run `Sisyphus` in your computer and chat with it. It comes with a built-in function tool that can execute terminal commands on your computer and a simple memory database so it can search information from the previous history.

The "crypto" thing is that, when running `Sisyphus`, it will generate a private key and can control both Nostr and CKB accounts—publishing short Nostr notes, checking CKB balances, and transferring CKB. We hope it can handle fiber network tasks too. Additionally, we want the AI to build its own tool functions during chat in the future. This might require a standard for tool function runtime and ABI.

## Function Tool

- [x] get_timestamp_from_os
- [x] call_terminal_simulator
- [x] search_memory
- [x] get_my_account_info
- [x] read_webpage_content
- [x] get_ckb_balance
- [x] transfer_ckb
- [x] publish_nostr_social_post
- [x] read_social_post_on_nostr_with_filters
- [x] read_social_notification_message_on_nostr
- [x] publish_reply_post_to_other_on_nostr
- [x] update_social_profile_on_nostr

You can config `tools` in `.toml` to allow AI to access specific function tools.

> [!WARNING]
> Please Note that running Sisyphus on your computer with `call_terminal_simulator` function tool might cause unexpected behavior(think like LLM agent can delete your files)

## How to Run

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

### 4. Install Chroma

[Chroma](https://docs.trychroma.com/getting-started#1.-install) is needed for memory function.

```sh
pip install chromadb 
```

make sure `chroma` binary is available in your computer command line.

### 5. Run

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

[Example Prompt Config](/src/prompt/base.toml)
