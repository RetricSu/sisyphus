// control the daily timeline activity
// so make sure the brain in the vat have some rest instead of
// doing stuff all-day to save the server costing. the living resource
// are quite valuable.

import { Brain } from "./brain";
import { createTables } from "./memory/database";

createTables();

const brain = new Brain();
brain.startLLMServer();
brain.chat([]);
