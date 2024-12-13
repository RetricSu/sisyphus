import { readSettings } from '../config/setting';
import { logger } from '../logger';
import { sanitizeFullFilePath } from '../util/fs';
import { Request } from '../util/request';
import fs from 'fs';
import path from 'path';

export async function listLocalAvailablePrompts() {
  const settings = readSettings();
  const files = fs.readdirSync(settings.prompt.rootFolder);
  console.log('Available Prompts: ');
  files.forEach((f) => {
    console.log('  - ', f);
  });
  console.log('');
  console.log('store at', settings.prompt.rootFolder);
}

export async function createPrompt(memoId: string, folderPath?: string) {
  const settings = readSettings();
  const filePath = folderPath
    ? path.resolve(sanitizeFullFilePath(folderPath), `${memoId}.toml`)
    : path.resolve(settings.prompt.rootFolder, `${memoId}.toml`);

  const exampleContent = `
### A example Prompt that Builds a Agent.
### This prompt is suitable for claude sonnet, gpt-4o and LLama3 Model
###
### Fill you API-KEY in [llm] config to get started
### Usage: 
###	sisyphus chat --prompt ${memoId}

name = "Name of the Agent"
description = "A example Agent."
memoId = "${memoId}" # MemoId is a global unique id for a agent, used to distinct memory/privkey/data of this agent.
version = "0.1.0"
ckbNetwork = 'testnet'
maxSteps = 100
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

[llm]
apiUrl = 'https://api.openai.com/v1'
model = 'gpt-4o'
provider = 'openai'
apiKey = '<YOUR-API-KEY>'

[[prompts]]
role = "system"
content = """
<COMPLETE-YOUR-SYSTEM-PROMPT-HERE>
"""

author = "retric" # optional
tags = []         # optional

[nostr] # optional
relays = ['wss://nostr-pub.wellorder.net', 'wss://nos.lol', 'wss://relay.snort.social', 'wss://relay.nostr.bg', 'wss://relay.damus.io', 'wss://relay.nostr.band']  
`;
  fs.writeFileSync(filePath, exampleContent);
  logger.info(`${filePath} created.`);
}

export async function downloadPrompt(fileName: string) {
  const url = buildPromptFileDownloadUrl(fileName);
  const response = await Request.send(url);
  const content = await response.text();
  return storePromptConfigFile(fileName, content);
}

export function storePromptConfigFile(fileName: string, content: string) {
  const settings = readSettings();
  const filePath = path.resolve(settings.prompt.rootFolder, `${fileName}.toml`);
  fs.writeFileSync(filePath, content);
  logger.info(`Save successfully, ${filePath}`);
  logger.info(`Please edit the file for ApiKey or any other required content before running the Agent.`);
  logger.info(`You can list all the local available Prompt Config Files by running: `);
  logger.info(`  sisyphus prompt list`);
}

export function buildPromptFileDownloadUrl(fileName: string) {
  return `https://raw.githubusercontent.com/RetricSu/sisyphus/refs/heads/master/prompts/${fileName}.toml`;
}
