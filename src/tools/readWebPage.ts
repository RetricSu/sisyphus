import { launch, Page } from 'puppeteer';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';
import { AvailableToolName, ToolBox } from './type';

export type ReadWebPageToolBoxType = ToolBox<[string], Promise<string>>;

export const readWebPageToolBox: ReadWebPageToolBoxType = {
  fi: {
    type: 'function',
    function: {
      name: AvailableToolName.readWebpageContent,
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
  exec: async (url: string) => {
    const browser = await launch();
    const page = await browser.newPage();
    await page.goto(url);
    await waitTillHTMLRendered(page);
    const content = await page.content();
    await browser.close();
    return cleanWebPageToText(content);
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
      //console.log("Page rendered fully..");
      break;
    }

    lastHTMLSize = currentHTMLSize;
    await sleep(checkDurationMsecs);
  }
}

function cleanWebPageToText(input: string): string {
  const window = new JSDOM('').window;
  const DOMPurify = createDOMPurify(window);
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
