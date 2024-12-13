import { Scraper } from 'agent-twitter-client';
import fs from 'fs';
import { getDefaultTwitterFilePath } from '../config/setting';
import { PromptFile } from '../prompt';
import { AvailableToolName, ToolBox } from './type';
import z from 'zod';
import { logger } from '../logger';
import path from 'path';

export interface SendTweetToolExecParameter {
  content: string;
}
export type SendTweetToolBoxType = ToolBox<[SendTweetToolExecParameter], ReturnType<typeof sendTweets>>;

export function buildTwitterTools(promptFile: PromptFile) {
  const twitter = promptFile.twitter;
  if (twitter?.username == null || twitter.password == null)
    throw new Error('Twitter tool required username and password in the prompt config file.');

  const sendTweetToolBox: SendTweetToolBoxType = {
    fi: {
      type: 'function',
      function: {
        name: AvailableToolName.sendTweet,
        description: 'post a new tweet to Twitter',
        parameters: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'the text content to tweet on twitter',
            },
          },
          required: ['content'],
        },
      },
    },
    params: z.object({ content: z.string().describe('post a new tweet to Twitter') }),
    exec: async ({ content }: SendTweetToolExecParameter) => {
      return await sendTweets(twitter.username, twitter.password, content);
    },
  };

  return [sendTweetToolBox];
}

export async function sendTweets(username: string, password: string, text: string) {
  const scraper = new Scraper();

  if (!isCookiesExits(username)) {
    await scraper.login(username, password);
    const cookies = await scraper.getCookies();
    saveCookies(username, cookies);
    logger.debug(`save cookies for account: ${username}`);
  } else {
    const cookies = readCookies(username);
    await scraper.setCookies(cookies);
    logger.debug(`using cookies from storage account: ${username}`);
  }

  const sendTweetResults = await scraper.sendTweet(text);
  return { status: sendTweetResults.status };
}

export function saveCookies(username: string, cookies: any[]) {
  const cookieFilePath = getDefaultTwitterFilePath(username);

  const dir = path.dirname(cookieFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const cookieStrings = cookies.map((cookie) => cookie.toString());
  fs.writeFileSync(cookieFilePath, cookieStrings.join('\n'));
}

export function readCookies(username: string) {
  const cookieFilePath = getDefaultTwitterFilePath(username);
  const cookieStrings = fs.readFileSync(cookieFilePath, 'utf8').split('\n');
  return cookieStrings;
}

export function isCookiesExits(username: string) {
  const cookieFilePath = getDefaultTwitterFilePath(username);
  return fs.existsSync(cookieFilePath);
}
