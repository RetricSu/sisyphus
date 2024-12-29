import fs from 'fs';
import path from 'path';
import { Scraper, Tweet } from 'agent-twitter-client';
import z from 'zod';
import { getDefaultTwitterFilePath } from '../config/setting';
import { logger } from '../logger';
import type { PromptFile } from '../prompt';
import type { Tool, ToolBox } from './type';

export interface SendTweetToolExecParameter {
  content: string;
}
export type SendTweetToolBoxType = ToolBox<[SendTweetToolExecParameter], ReturnType<typeof sendTweets>>;

export interface ReplyTweetToolExecParameter {
  content: string;
  replyToTweetId: string;
}
export type ReplyTweetToolBoxType = ToolBox<[ReplyTweetToolExecParameter], ReturnType<typeof replyTweet>>;

export interface GetMentionsToolExecParameter {
  count?: number;
}
export type GetMentionsToolBoxType = ToolBox<[GetMentionsToolExecParameter], ReturnType<typeof getMentions>>;

export interface GetMyTweetsToolExecParameter {
  count?: number;
}
export type GetMyTweetsToolBoxType = ToolBox<[GetMyTweetsToolExecParameter], ReturnType<typeof getMyTweets>>;

export interface GetHomeTimelineToolExecParameter {
  count?: number;
}

export type GetHomeTimelineToolBox = ToolBox<[GetHomeTimelineToolExecParameter], ReturnType<typeof getHomeTimeline>>;

export function buildTwitterTools(promptFile: PromptFile) {
  const twitter = promptFile.twitter;
  if (twitter?.username == null || twitter.password == null)
    throw new Error('Twitter tool required username and password in the prompt config file.');

  const sendTweetToolBox: SendTweetToolBoxType = {
    fi: {
      type: 'function',
      function: {
        name: 'send_tweet',
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
    params: z.object({
      content: z.string().describe('post a new tweet to Twitter'),
    }),
    exec: async ({ content }: SendTweetToolExecParameter) => {
      return await sendTweets(twitter.username, twitter.password, content);
    },
  };

  const replyTweetToolBox: ReplyTweetToolBoxType = {
    fi: {
      type: 'function',
      function: {
        name: 'reply_tweet',
        description: 'post a reply tweet to a tweet on Twitter',
        parameters: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'the reply text content',
            },
            replyToTweetId: {
              type: 'string',
              description: 'the tweet id to reply to',
            },
          },
          required: ['content', 'replyToTweetId'],
        },
      },
    },
    params: z.object({
      content: z.string().describe('post a new tweet to Twitter'),
      replyToTweetId: z.string().describe('post a reply tweet to a tweet on Twitter'),
    }),
    exec: async ({ content, replyToTweetId }: ReplyTweetToolExecParameter) => {
      return await replyTweet(twitter.username, twitter.password, content, replyToTweetId);
    },
  };

  const getMentionsToolBox: GetMentionsToolBoxType = {
    fi: {
      type: 'function',
      function: {
        name: 'get_tweet_mentions',
        description: 'fetch tweets that mention the user',
        parameters: {
          type: 'object',
          properties: {
            count: {
              type: 'number',
              description: 'the number of mentions to fetch',
            },
          },
          required: ['count'],
        },
      },
    },
    params: z.object({
      count: z.number().optional().describe('the number of mentions to fetch'),
    }),
    exec: async ({ count }: GetMentionsToolExecParameter) => {
      return await getMentions(twitter.username, twitter.password, count);
    },
  };

  const getMyTweetsToolBox: GetMyTweetsToolBoxType = {
    fi: {
      type: 'function',
      function: {
        name: 'get_my_tweets',
        description: "fetch the user's timeline tweets",
        parameters: {
          type: 'object',
          properties: {
            count: {
              type: 'number',
              description: 'the number of tweets to fetch',
            },
          },
          required: ['count'],
        },
      },
    },
    params: z.object({
      count: z.number().optional().describe('the number of tweets to fetch'),
    }),
    exec: async ({ count }: GetMyTweetsToolExecParameter) => {
      return await getMyTweets(twitter.username, twitter.password, count);
    },
  };

  const getHomeTimelineToolBox: GetHomeTimelineToolBox = {
    fi: {
      type: 'function',
      function: {
        name: 'get_twitter_home_timeline',
        description: "fetch tweets from user's home timeline",
        parameters: {
          type: 'object',
          properties: {
            count: {
              type: 'number',
              description: 'the number of tweets to fetch',
            },
          },
          required: ['count'],
        },
      },
    },
    params: z.object({
      count: z.number().optional().describe('the number of tweets to fetch'),
    }),
    exec: async ({ count }: GetHomeTimelineToolExecParameter) => {
      return await getHomeTimeline(twitter.username, twitter.password, count);
    },
  };

  return [sendTweetToolBox, replyTweetToolBox, getMentionsToolBox, getMyTweetsToolBox, getHomeTimelineToolBox];
}

export async function sendTweets(username: string, password: string, text: string) {
  const scraper = await buildScraper(username, password);
  const sendTweetResults = await scraper.sendTweet(text);
  const responseJson = await sendTweetResults.json();
  const headers = await sendTweetResults.headers;
  return {
    status: sendTweetResults.status,
    headers,
    responseJson: responseJson,
  };
}

export async function replyTweet(username: string, password: string, text: string, replyToTweetId: string) {
  const scraper = await buildScraper(username, password);
  const result = await scraper.sendTweet(text, replyToTweetId);
  const responseJson = await result.json();
  const headers = await result.headers;
  return { status: result.status, headers, responseJson: responseJson };
}

export async function getMentions(username: string, password: string, count: number = 20) {
  const scraper = await buildScraper(username, password);
  const mentions = await scraper.searchTweets(`@${username}`, count);
  const results: Tweet[] = [];
  for await (const men of mentions) {
    results.push(men);
  }
  return {
    status: 200,
    responseJson: results,
  };
}

export async function getMyTweets(username: string, password: string, count: number = 20) {
  const scraper = await buildScraper(username, password);
  const timeline = await scraper.getTweets(username, count);
  const results: Tweet[] = [];
  for await (const t of timeline) {
    results.push(t);
  }
  return {
    status: 200,
    responseJson: results,
  };
}

export async function getHomeTimeline(username: string, password: string, count: number = 20) {
  const scraper = await buildScraper(username, password);
  const timeline = await scraper.fetchHomeTimeline(count, []);
  return {
    status: 200,
    responseJson: timeline,
  };
}
export async function buildScraper(username: string, password: string) {
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
  return scraper;
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

const tool: Tool = {
  names: ['send_tweet', 'reply_tweet', 'get_tweet_mentions', 'get_my_tweets', 'get_twitter_home_timeline'],
  build: (p: PromptFile) => {
    return buildTwitterTools(p);
  },
};

export default tool;
