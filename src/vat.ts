// control the daily timeline activity
// so make sure the brain in the vat have some rest instead of
// doing stuff all-day to save the server costing. the living resource
// are quite valuable.

import { Brain } from './brain';
import { createTables } from './memory/database';

export class Vat {
  async start() {
    createTables();
    const brain = new Brain();
    try {
      await brain.startLLMServer();
      await brain.chat([]);
    } catch (error) {
      console.error('failed to start the server, ', error);
      process.exit(1);
    }
  }
}
