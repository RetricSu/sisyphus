import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { type Page, launch } from 'puppeteer';
import z from 'zod';
import { logger } from '../logger';
import type { ToolBox } from './type';

export interface ReadWebPageToolExecParameter {
  url: string;
}

export type ReadWebPageToolBoxType = ToolBox<[ReadWebPageToolExecParameter], Promise<string>>;

export const readWebPageToolBox: ReadWebPageToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: 'read_webpage_content',
      description: 'use puppeteer to get the content of a web page from a url',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'the url of the web page requesting to read',
          },
        },
        required: ['url'],
      },
    },
  },
  params: z.object({
    url: z.string().describe('the url of the web page requesting to read'),
  }),
  exec: async ({ url }: ReadWebPageToolExecParameter) => {
    logger.debug(`Get WebPage ${url} ...`);
    const browser = await launch();
    const page = await browser.newPage();
    await page.goto(url);
    await waitTillHTMLRendered(page);
    const textContent = await page.evaluate(() => document.body.innerText); // 提取文本内容
    await browser.close();
    return textContent;
  },
};

async function waitTillHTMLRendered(page: Page, timeout = 30000) {
  const checkDurationMsecs = 1000;
  const maxChecks = timeout / checkDurationMsecs;
  let lastHTMLSize = 0;
  let checkCounts = 1;
  let countStableSizeIterations = 0;
  const minStableSizeIterations = 3;

  while (checkCounts++ <= maxChecks) {
    const html = await page.content();
    const currentHTMLSize = html.length;

    await page.evaluate(() => document.body.innerHTML.length);

    if (lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize) countStableSizeIterations++;
    else countStableSizeIterations = 0; //reset the counter

    if (countStableSizeIterations >= minStableSizeIterations) {
      break;
    }

    lastHTMLSize = currentHTMLSize;
    await sleep(checkDurationMsecs);
  }
}

function _cleanWebPageToText(input: string): string {
  const window = new JSDOM('').window;
  const DOMPurify = createDOMPurify(window);
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
