import { ReadWebPageToolBoxType } from './readWebPage';
import {
  AccountInfoToolBoxType,
  CKBBalanceToolBoxType,
  PublishNostrProfileEventToolBoxType,
  PublishNostrReplyNotesToEventToolBoxType,
  PublishNoteToolBoxType,
  ReadNostrEventsToolBoxType,
  ReadNostrMentionNotesWithMeToolBoxType,
  TransferCKBToolBoxType,
} from './nosCKB';
import { TerminalToolBoxType } from './terminal';
import { TimeToolBoxType } from './time';
import { AvailableToolName, ToolBox, ToolCallResponse } from './type';
import { parseToolCall } from './util';
import { Hex } from '@ckb-ccc/core';
import { Message, ToolCall } from 'ollama';
import { MemoryToolBoxType } from './memory';

export class Tools {
  toolBox: ToolBox[];
  constructor(toolBox: ToolBox[]) {
    this.toolBox = toolBox;
  }

  async buildToolCallResponseCMessage(content: string): Promise<Message> {
    const toolCall = parseToolCall(content)!;

    const toolName = toolCall.name;
    const selectedTool = this.toolBox.find((tool) => tool.fi.function.name === toolName);
    if (!selectedTool) {
      const resp: ToolCallResponse = {
        status: 'failed',
        name: toolName as AvailableToolName,
        error: `there is no ${toolName} such available tool`,
      };
      return { role: 'tool', content: JSON.stringify(resp) };
    }

    try {
      const executor = selectedTool.exec;
      let functionResponse: unknown | null = null;
      switch (toolName) {
        case AvailableToolName.getTimestampFromOs:
          functionResponse = await (executor as TimeToolBoxType['exec'])();
          break;

        case AvailableToolName.callTerminalSimulator:
          functionResponse = await (executor as TerminalToolBoxType['exec'])(toolCall.parameters.command);
          break;

        case AvailableToolName.readWebpageContent:
          functionResponse = await (executor as ReadWebPageToolBoxType['exec'])(toolCall.parameters.url);
          break;

        case AvailableToolName.getCKBBalance:
          functionResponse = await (executor as CKBBalanceToolBoxType['exec'])();
          break;

        case AvailableToolName.publishNostrSocialPost:
          functionResponse = await (executor as PublishNoteToolBoxType['exec'])(toolCall.parameters.text);
          break;

        case AvailableToolName.transferCKB:
          functionResponse = await (executor as TransferCKBToolBoxType['exec'])({
            amountInCKB: toolCall.parameters.amountInCKB,
            toAddress: toolCall.parameters.toAddress,
          });
          break;

        case AvailableToolName.getMyAccountInfo:
          functionResponse = await (executor as AccountInfoToolBoxType['exec'])();
          break;

        case AvailableToolName.readSocialPostOnNostrWithFilter:
          functionResponse = await (executor as ReadNostrEventsToolBoxType['exec'])(toolCall.parameters.kind);
          break;

        case AvailableToolName.readSocialNotificationMessageOnNostr:
          functionResponse = await (executor as ReadNostrMentionNotesWithMeToolBoxType['exec'])();
          break;

        case AvailableToolName.updateSocialProfileOnNostr:
          functionResponse = await (executor as PublishNostrProfileEventToolBoxType['exec'])(
            toolCall.parameters.name,
            toolCall.parameters.about,
            toolCall.parameters.avatarPictureUrl,
          );
          break;

        case AvailableToolName.publishReplyPostToOtherOnNostr:
          functionResponse = await (executor as PublishNostrReplyNotesToEventToolBoxType['exec'])(
            toolCall.parameters.text,
            toolCall.parameters.eventId as Hex,
          );
          break;

        case AvailableToolName.searchMemory:
          functionResponse = await (executor as MemoryToolBoxType['exec'])(toolCall.parameters.text);
          break;

        default: {
          const resp: ToolCallResponse = {
            status: 'failed',
            name: toolName as AvailableToolName,
            error: `${toolName} not implemented in switch-case.`,
          };
          return { role: 'tool', content: JSON.stringify(resp) };
        }
      }

      // Add function response to the conversation
      const resp: ToolCallResponse = {
        status: 'success',
        name: toolName,
        result: functionResponse,
      };
      if (toolCall.name === AvailableToolName.callTerminalSimulator) {
        resp['terminalCommand'] = toolCall.parameters.command;
      }
      return { role: 'tool', content: JSON.stringify(resp) };
    } catch (error) {
      const resp: ToolCallResponse = {
        status: 'failed',
        name: toolName as AvailableToolName,
        error: (error as unknown as Error).message,
      };
      return { role: 'tool', content: JSON.stringify(resp) };
    }
  }

  async executeToolCall(tool: ToolCall) {
    const name = tool.function.name;
    const parameters = tool.function.arguments;
    const selectedToolBox = this.toolBox.find((t) => t.fi.function.name === name);
    if (!selectedToolBox) {
      const resp: ToolCallResponse = {
        status: 'failed',
        name: name as AvailableToolName,
        error: `there is no ${name} such available tool`,
      };
      return { role: 'tool', content: JSON.stringify(resp) };
    }

    try {
      const executor = selectedToolBox.exec;
      let functionResponse: unknown | null = null;

      switch (name) {
        case AvailableToolName.getTimestampFromOs:
          functionResponse = await (executor as TimeToolBoxType['exec'])();
          break;

        case AvailableToolName.callTerminalSimulator:
          functionResponse = await (executor as TerminalToolBoxType['exec'])(parameters.command);
          break;

        case AvailableToolName.readWebpageContent:
          functionResponse = await (executor as ReadWebPageToolBoxType['exec'])(parameters.url);
          break;

        case AvailableToolName.getCKBBalance:
          functionResponse = await (executor as CKBBalanceToolBoxType['exec'])();
          break;

        case AvailableToolName.publishNostrSocialPost:
          functionResponse = await (executor as PublishNoteToolBoxType['exec'])(parameters.text);
          break;

        case AvailableToolName.transferCKB:
          functionResponse = await (executor as TransferCKBToolBoxType['exec'])({
            amountInCKB: parameters.amountInCKB,
            toAddress: parameters.toAddress,
          });
          break;

        case AvailableToolName.getMyAccountInfo:
          functionResponse = await (executor as AccountInfoToolBoxType['exec'])();
          break;

        case AvailableToolName.readSocialPostOnNostrWithFilter:
          functionResponse = await (executor as ReadNostrEventsToolBoxType['exec'])(parameters.kind);
          break;

        case AvailableToolName.readSocialNotificationMessageOnNostr:
          functionResponse = await (executor as ReadNostrMentionNotesWithMeToolBoxType['exec'])();
          break;

        case AvailableToolName.updateSocialProfileOnNostr:
          functionResponse = await (executor as PublishNostrProfileEventToolBoxType['exec'])(
            parameters.name,
            parameters.about,
            parameters.avatarPictureUrl,
          );
          break;

        case AvailableToolName.publishReplyPostToOtherOnNostr:
          functionResponse = await (executor as PublishNostrReplyNotesToEventToolBoxType['exec'])(
            parameters.text,
            parameters.eventId as Hex,
          );
          break;

        case AvailableToolName.searchMemory:
          functionResponse = await (executor as MemoryToolBoxType['exec'])(parameters.text);
          break;

        default: {
          const resp: ToolCallResponse = {
            status: 'failed',
            name: name as AvailableToolName,
            error: `${name} not implemented in switch-case.`,
          };
          return { role: 'tool', content: JSON.stringify(resp) };
        }
      }

      const resp: ToolCallResponse = {
        status: 'success',
        name: name as AvailableToolName,
        result: functionResponse,
      };

      return {
        role: 'tool',
        content: JSON.stringify(resp),
      };
    } catch (error) {
      const resp: ToolCallResponse = {
        status: 'failed',
        name: name as AvailableToolName,
        error: (error as unknown as Error).message,
      };
      return { role: 'tool', content: JSON.stringify(resp) };
    }
  }
}
