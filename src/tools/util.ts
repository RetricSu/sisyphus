import { logger } from '../logger';
import type { ToolCallRequest } from './type';

export function checkIfToolCall(content: string) {
  if (content.includes('name') && content.includes('parameters')) {
    // Define a regular expression to capture the JSON structure
    const regex = /{"name":\s*".+?",\s*"parameters":\s*{.*?}}/g;

    // Find the JSON string in the input
    const match = content.match(regex);
    if (match && match[0]) {
      try {
        JSON.parse(match[0]);
        return true;
      } catch (_error) {
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
      logger.error('Failed to parse JSON:', error);
    }
  }

  return null;
}
