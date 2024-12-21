import { RunnerBot } from '../agent/runner-bot';
import { logger } from '../logger';

export interface RunnerProp {
  intervalMilSecs: number;
  promptName?: string;
  saveMemory?: boolean;
}

export async function runner({ intervalMilSecs, promptName, saveMemory }: RunnerProp) {
  const exec = async () => {
    const bot = new RunnerBot({ promptName, saveMemory });
    try {
      if (!(await bot.isChromaServerRunning())) {
        await bot.startChromaServer();
      }
      await bot.start();
      logger.debug(`Finished Executing.`);
      logger.debug(`===================`);
    } catch (error) {
      logger.error('some thing went wrong...');
      console.log(error);
      logger.debug(`waiting for another execution in ${convertMilSecsToReadableTime(intervalMilSecs)}..`);
    }
  };

  // execute first
  exec();

  // then waiting for next execution
  setInterval(() => {
    exec();
  }, intervalMilSecs);
}

export function convertMilSecsToReadableTime(intervalMilSecs: number): string {
  const hours = Math.floor((intervalMilSecs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((intervalMilSecs / 1000 / 60) % 60);
  const seconds = Math.floor((intervalMilSecs / 1000) % 60);
  return `${hours} hours, ${minutes} minutes, and ${seconds} seconds`;
}

export function convertReadableTimeToMilSecs(hours: number, minutes: number, seconds: number): number {
  return hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000;
}
