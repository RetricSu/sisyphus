import fs from "fs";
import path from "path";
import { Scraper } from "agent-twitter-client";
import z from "zod";
import { getDefaultTwitterFilePath } from "../config/setting";
import { logger } from "../logger";
import type { PromptFile } from "../prompt";
import type { ToolBox } from "./type";

export interface SendTweetToolExecParameter {
  content: string;
}
export type SendTweetToolBoxType = ToolBox<
  [SendTweetToolExecParameter],
  ReturnType<typeof sendTweets>
>;

export interface ReplyTweetToolExecParameter {
  content: string;
  replyToTweetId: string;
}
export type ReplyTweetToolBoxType = ToolBox<
  [ReplyTweetToolExecParameter],
  ReturnType<typeof replyTweet>
>;

export function buildTwitterTools(promptFile: PromptFile) {
  const twitter = promptFile.twitter;
  if (twitter?.username == null || twitter.password == null)
    throw new Error(
      "Twitter tool required username and password in the prompt config file.",
    );

  const sendTweetToolBox: SendTweetToolBoxType = {
    fi: {
      type: "function",
      function: {
        name: "send_tweet",
        description: "post a new tweet to Twitter",
        parameters: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "the text content to tweet on twitter",
            },
          },
          required: ["content"],
        },
      },
    },
    params: z.object({
      content: z.string().describe("post a new tweet to Twitter"),
    }),
    exec: async ({ content }: SendTweetToolExecParameter) => {
      return await sendTweets(twitter.username, twitter.password, content);
    },
  };

  const replyTweetToolBox: ReplyTweetToolBoxType = {
    fi: {
      type: "function",
      function: {
        name: "reply_tweet",
        description: "post a reply tweet to a tweet on Twitter",
        parameters: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "the reply text content",
            },
            replyToTweetId: {
              type: "string",
              description: "the tweet id to reply to",
            },
          },
          required: ["content", "replyToTweetId"],
        },
      },
    },
    params: z.object({
      content: z.string().describe("post a new tweet to Twitter"),
      replyToTweetId: z
        .string()
        .describe("post a reply tweet to a tweet on Twitter"),
    }),
    exec: async ({ content, replyToTweetId }: ReplyTweetToolExecParameter) => {
      return await replyTweet(
        twitter.username,
        twitter.password,
        content,
        replyToTweetId,
      );
    },
  };

  return [sendTweetToolBox, replyTweetToolBox];
}

export async function sendTweets(
  username: string,
  password: string,
  text: string,
) {
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

export async function replyTweet(
  username: string,
  password: string,
  text: string,
  replyToTweetId: string,
) {
  const scraper = await buildScraper(username, password);
  const result = await scraper.sendTweet(text, replyToTweetId);
  const responseJson = await result.json();
  const headers = await result.headers;
  return { status: result.status, headers, responseJson: responseJson };
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
  fs.writeFileSync(cookieFilePath, cookieStrings.join("\n"));
}

export function readCookies(username: string) {
  const cookieFilePath = getDefaultTwitterFilePath(username);
  const cookieStrings = fs.readFileSync(cookieFilePath, "utf8").split("\n");
  return cookieStrings;
}

export function isCookiesExits(username: string) {
  const cookieFilePath = getDefaultTwitterFilePath(username);
  return fs.existsSync(cookieFilePath);
}
