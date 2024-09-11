import { Tool } from "ollama";
import { CMessage } from "./memory/c-message";
import { execSync } from "child_process";

export enum AvailableToolName {
  getFlightTimes = "get_flight_times",
  getTimestampFromOs = "get_timestamp_from_os",
  callTerminalSimulator = "call_terminal_simulator",
}

export type Tools = Record<AvailableToolName, Tool>;
export interface ToolCallRequest {
  name: string;
  parameters: {
    [key: string]: string;
  };
}

export const tools: Tools = {
  get_flight_times: {
    type: "function",
    function: {
      name: AvailableToolName.getFlightTimes,
      description: "Get the flight times between two cities",
      parameters: {
        type: "object",
        properties: {
          departure: {
            type: "string",
            description: "The departure city (airport code)",
          },
          arrival: {
            type: "string",
            description: "The arrival city (airport code)",
          },
        },
        required: ["departure", "arrival"],
      },
    },
  },
  get_timestamp_from_os: {
    type: "function",
    function: {
      name: AvailableToolName.getTimestampFromOs,
      description: "Get the timestamp seconds number from operating system",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  call_terminal_simulator: {
    type: "function",
    function: {
      name: AvailableToolName.callTerminalSimulator,
      description:
        "Get the result of executing a command in the linux terminal of the living server",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "The command to exec in the linux terminal",
          },
        },
        required: ["command"],
      },
    },
  },
};

export const toolExecutor = {
  get_flight_times: function getFlightTimes(
    departure: string,
    arrival: string
  ) {
    const flights = {
      "NYC-LAX": {
        departure: "08:00 AM",
        arrival: "11:30 AM",
        duration: "5h 30m",
      },
      "LAX-NYC": {
        departure: "02:00 PM",
        arrival: "10:30 PM",
        duration: "5h 30m",
      },
      "LHR-JFK": {
        departure: "10:00 AM",
        arrival: "01:00 PM",
        duration: "8h 00m",
      },
      "JFK-LHR": {
        departure: "09:00 PM",
        arrival: "09:00 AM",
        duration: "7h 00m",
      },
      "CDG-DXB": {
        departure: "11:00 AM",
        arrival: "08:00 PM",
        duration: "6h 00m",
      },
      "DXB-CDG": {
        departure: "03:00 AM",
        arrival: "07:30 AM",
        duration: "7h 30m",
      },
    };
    const key = `${departure}-${arrival}`.toUpperCase();
    return JSON.stringify(
      flights[key as keyof typeof flights] || { error: "Flight not found" }
    );
  },
  get_timestamp_from_os: function (): number {
    const date = new Date();
    return Math.floor(date.getTime() / 1000);
  },
  call_terminal_simulator: function (command: string) {
    try {
      const result = execSync(command);
      return result.toString("utf-8");
    } catch (error: any) {
      return `${JSON.stringify(error.message)}`;
    }
  },
};

export function buildToolCallResponseCMessage(content: string) {
  const toolCall = parseToolCall(content)!;
  let functionResponse;
  switch (toolCall.name) {
    case AvailableToolName.getTimestampFromOs:
      functionResponse = toolExecutor.get_timestamp_from_os();
      break;

    case AvailableToolName.callTerminalSimulator:
      functionResponse = toolExecutor.call_terminal_simulator(
        toolCall.parameters.command
      );
      break;

    default:
      break;
  }
  if (functionResponse == null) {
    const resp = {
      status: "failed",
      error: `there is no ${toolCall.name} such function`,
    };
    const toolCmsg = new CMessage("tool", JSON.stringify(resp));
    return toolCmsg;
  }

  // console.log("execute function result: ", functionResponse.toString());
  // Add function response to the conversation
  const resp = {
    status: "success",
    toolCall: toolCall.name,
    terminalCommand: "null",
    result: `${functionResponse.toString()}`,
  };
  if (toolCall.name === AvailableToolName.callTerminalSimulator) {
    resp["terminalCommand"] = toolCall.parameters.command;
  }
  const toolCmsg = new CMessage("tool", JSON.stringify(resp));
  return toolCmsg;
}

export function checkIfToolCall(content: string) {
  if (content.includes("name") && content.includes("parameters")) {
    // Define a regular expression to capture the JSON structure
    const regex = /{"name":\s*".+?",\s*"parameters":\s*{.*?}}/g;

    // Find the JSON string in the input
    const match = content.match(regex);
    if (match && match[0]) {
      try {
        JSON.parse(match[0]);
        return true;
      } catch (error) {
        return false;
      }
    }
    return false;
  }
  return false;
}

export function parseToolCall(input: string) {
  // Define a regular expression to capture the JSON structure
  const regex = /{"name":\s*".+?",\s*"parameters":\s*{.*?}}/g;

  // Find the JSON string in the input
  const match = input.match(regex);

  if (match && match[0]) {
    try {
      // Parse the JSON string
      const parsedJson = JSON.parse(match[0]);
      return parsedJson as ToolCallRequest;
    } catch (error) {
      console.error("Failed to parse JSON:", error);
    }
  }

  return null;
}
