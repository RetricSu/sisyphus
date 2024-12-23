# Sisyphus

one-line command to run Crypto AI Agent.

- [Sisyphus](#sisyphus)
  - [Install](#install)
    - [Install Sisyphus CLI tool](#install-sisyphus-cli-tool)
    - [Install Chroma db](#install-chroma-db)
  - [Overview](#overview)
  - [Getting Started](#getting-started)
  - [How to Run](#how-to-run)
    - [OpenAI, Anthropic and Google](#openai-anthropic-and-google)
    - [Self-host With ollama](#self-host-with-ollama)
      - [1. Install ollama](#1-install-ollama)
      - [2. Pull llama3.1 8b](#2-pull-llama31-8b)
      - [3. Config](#3-config)
      - [3. Run](#3-run)
  - [Mange Prompts](#mange-prompts)
    - [Run Predefined Agents](#run-predefined-agents)
    - [List All available Prompts on local](#list-all-available-prompts-on-local)
    - [Update Prompts](#update-prompts)
  - [Run IPC Bot](#run-ipc-bot)
  - [Function Tool](#function-tool)
  - [Privkey](#privkey)
  - [Config Setting](#config-setting)
    - [List All Settings](#list-all-settings)
    - [Set Network Proxy](#set-network-proxy)
  - [Set Logger Level](#set-logger-level)
  - [Fun Facts](#fun-facts)

You can run `Sisyphus` in your computer and chat with it. It comes with useful built-in function tools like executing terminal commands on your computer and searching from memory database about the previous history. It also comes with some Nostr/CKB blockchain tools.

## Install

### Install Sisyphus CLI tool

```sh
pnpm install -g @sisyphus-ai/cli
```

or

```sh
npm install -g @sisyphus-ai/cli
```

### Install Chroma db

[Chroma](https://docs.trychroma.com/getting-started#1.-install) is needed for built-in memory function.

```sh
pip install chromadb 
```

make sure `chroma` binary is available in your computer command line.

## Overview

```sh
Usage: sisyphus [options] [command]

Sisyphus is a project that explores the idea of Web5 Crypto AI Agent. It is ported as a CLI tool that can be run in the terminal.

Options:
  -V, --version                   output the version number
  -h, --help                      display help for command

Commands:
  chat [options]                  chat with AI Agent through the command line
  run [options]                   run AI Agent at interval
  ipc                             make two AI Agents talk to each other in the same computer
  prompt                          Manger prompt files
  config <action> [item] [value]  do a configuration action
  server [options]                Run a http server to host Agent chatting history
  list-tool                       List all available function tools
  help [command]                  display help for command
```

## Getting Started

After installed, run following commands to get a feeling of how easily sisyphus can be to run a Agent:

```sh
sisyphus prompt download simple-translator
```

Update the OpenAI API Key in the `simple-translator.toml` and run:

```sh
sisyphus chat --prompt simple-translator
```

## How to Run

### OpenAI, Anthropic and Google

First, config the API key and url in the `base.toml`:

OpenAI:

```toml title="base.toml"
[llm]
apiUrl = 'https://api.openai.com/v1'
model = 'gpt-4o'
provider = 'openai'
apiKey = '<sk-your-openai-api-key-here>'
```

Anthropic:

```toml title="base.toml"
[llm]
apiUrl = 'https://api.anthropic.com/v1'
model = 'claude-3-5-sonnet-20241022'
provider = 'anthropic'
apiKey = '<your-anthropic-api-key-here>'
```

Google:

```toml title="base.toml"
[llm]
apiUrl = 'https://generativelanguage.googleapis.com/v1beta'
model = 'gemini-2.0-flash-exp'
provider = 'google'
apiKey = '<your-google-api-key-here>'
```

Run:

```sh
sisyphus chat --prompt base
```

### Self-host With ollama

#### 1. Install ollama

Make sure you have download and install it first:

https://ollama.com/download

#### 2. Pull llama3.1 8b

Make sure you have pull the llama3.1 8b model to your computer

```sh
ollama pull llama3.1
```

#### 3. Config

config the API url in the `base.toml`:

```toml title="base.toml"
[llm]
apiUrl = 'http://127.0.0.1:11434/api'
model = 'llama3.1'
provider = 'ollama'
```

#### 3. Run

Start chatting:

```sh
sisyphus chat --prompt base
```

## Mange Prompts

### Run Predefined Agents

There are some predefined prompt config files at [Github Repo](https://github.com/RetricSu/sisyphus/tree/master/prompts)

You can download them and start running the agent without writing the prompt by yourself. 

For example, using the predefined config `article-recommender.toml` to start a article recommendation Agent:

```sh
sisyphus prompt download article-recommender
```

After downloading the prompt, you need to update the file with your own apiKey.

Then you can start the agent:

```sh
sisyphus chat --prompt article-recommender
```

### List All available Prompts on local

```sh
sisyphus prompt list
```

### Update Prompts

Sisyphus defines a unique AI Agent with a unique `memoId` in a prompt config file. The default prompt config file is `base.toml` under the prompt root folder.

You can get the prompt root folder by running:

```sh
sisyphus config list

# result
{
  ...
  prompt: {
    rootFolder: '/Users/Library/Application Support/sisyphus-nodejs/prompt',
    selectedPromptName: 'base'
  },
  ....
}
```

A basic prompt config file looks like this:

```toml
name = "Sisyphus"
description = "You are a LLM agent that has a digital life"
memoId = "base" # MemoId is a global unique id for a agent, used to distinct memory/privkey/data of this agent.
ckbNetwork = 'testnet'
maxSteps = 20
tools = [
	'get_current_time_from_os',
	'call_terminal_simulator',
	'search_memory',
	'get_my_account_info',
	'read_webpage_content',
	'get_ckb_balance',
	'transfer_ckb',
	'publish_nostr_social_post',
	'read_social_post_on_nostr_with_filters',
	'read_social_notification_message_on_nostr',
	'publish_reply_post_to_other_on_nostr',
	'update_social_profile_on_nostr',
]
```

You can create multiple prompt files for different AI Agent with different `memoId`. When running the command, you can pass the prompt config file with `--prompt <prompt config file name without .toml>`, eg:

```sh
sisyphus chat --prompt my-custom-prompt
```

Where there is a prompt config file named `my-custom-prompt.toml` in the prompt root folder:

```toml name="my-custom-prompt.toml"
name = "my-agent"
description = "This is a custom agent"
memoId = "my-custom-prompt" # MemoId is a global unique id for a agent, used to distinct memory/privkey/data of this agent.
....
```

You can edit the `[[prompts]]` section in the `.toml` file to set the prompts for the AI Agent:

```toml
[[prompts]]
role = "system"
content = "You are the supper mario"

[[prompts]]
role = "user"
content = "who are you?"

[[prompts]]
role = "assistant"
content = "I am supper mario!"
```

[Example Prompt Config](/src/prompt/base.toml)

## Run IPC Bot

Make two AI Agent talking to each other in the same computer by running IPC bots:

Assuming that you have create two files in the prompt folder: `bot1.toml` and `bot2.toml`

```sh
sisyphus ipc listen --prompt bot1
```

```sh
sisyphus ipc send --prompt bot2 --memo-id <the-memo-id-of-bot1> "<a first message to trigger the starting of the conversation from bot2, something like: hello, I am bot2!>"
```

Boom! They will talk to each other on and on without any interruption.

## Function Tool

- [x] get_current_time_from_os
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
- [x] send_tweet

You can config `tools` in `.toml` to allow AI to access specific function tools.

> [!WARNING]
> Please Note that running Sisyphus on your computer with `call_terminal_simulator` function tool might cause unexpected behavior(think like LLM agent can delete your files)

## Privkey

Each prompt file with a unique MemoId has its own privkey to their Nostr and CKB account.

> [!WARNING]
> The privkey is stored in a plain text file without any encryption for convenient now.
> Please USE AT YOUR OWN RISK

```sh
sisyphus config list
```

the key file name is `.[your-agent-memo-id]` under `privkey.rootFolder`.

## Config Setting

### List All Settings

```sh
sisyphus config list
```

### Set Network Proxy

```sh
sisyphus config set proxy http://127.0.0.1:1086
> save new settings
sisyphus config get proxy
> http://127.0.0.1:1086
sisyphus config rm proxy
> save new settings
offckb config get proxy
> No Proxy.
```

## Set Logger Level

```sh
LOG_LEVEL=info sisyphus chat
```

## Fun Facts

At the beginning, what I really want to achieve is something like [this](/docs/project-sisyphus.md). But that is a very ultimate goal and is so hard for current open source small models and tech stack to work it out.

In order to achieve this goal, a different phases plan are proposed. Right now in the first early stage we amis to make Sisyphus a fun-to-play toy that everybody can run in their laptop to communicate in Nostr network and do crypto transactions stuff on CKB blockchain. Sisyphus will generate a private key for each Agent and can control both Nostr and CKB accounts—publishing short Nostr notes, checking CKB balances, and transferring CKB. We hope it can handle fiber network tasks too. Additionally, we want the AI to build its own function tool during chat in the future. This might require a standard for function tool runtime and ABI.
