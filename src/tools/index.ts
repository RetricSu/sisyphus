import { CMessage } from '../memory/c-message';
import { readWebPageToolBox, ReadWebPageToolBoxType } from './readWebPage';
import {
  AccountInfoToolBoxType,
  buildNosCKBToolBox,
  CKBBalanceToolBoxType,
  PublishNoteToolBoxType,
  ReadNostrEventsToolBoxType,
  TransferCKBToolBoxType,
} from './nosCKB';
import { terminalToolBox, TerminalToolBoxType } from './terminal';
import { timeToolBox, TimeToolBoxType } from './time';
import { AvailableToolName, ToolBoxSet, ToolCallResponse } from './type';
import { parseToolCall } from './util';

export class ToolBox {
  availableSet: ToolBoxSet;
  constructor(privkey: string) {
    const { ckbBalanceToolBox, accountInfoToolBox, transferCKBToolBox, publishNoteToolBox, readNostrEvents } =
      buildNosCKBToolBox(privkey);
    this.availableSet = {
      get_timestamp_from_os: timeToolBox,
      call_terminal_simulator: terminalToolBox,
      read_webpage_content: readWebPageToolBox,
      get_ckb_balance: ckbBalanceToolBox,
      publish_note: publishNoteToolBox,
      transfer_ckb: transferCKBToolBox,
      get_my_account_info: accountInfoToolBox,
      read_nostr_events: readNostrEvents,
    };
  }

  async buildToolCallResponseCMessage(content: string) {
    const toolCall = parseToolCall(content)!;

    const toolName = toolCall.name as AvailableToolName;

    if (!Object.values(AvailableToolName).includes(toolName)) {
      const resp: ToolCallResponse = {
        status: 'failed',
        name: toolName,
        error: `there is no ${toolName} such available tool`,
      };
      const toolCmsg = new CMessage('tool', JSON.stringify(resp));
      return toolCmsg;
    }

    try {
      const executor = this.availableSet[toolName].exec;
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

        case AvailableToolName.publishNote:
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

        case AvailableToolName.readNostrEvents:
          functionResponse = await (executor as ReadNostrEventsToolBoxType['exec'])(toolCall.parameters.kind);
          break;

        default: {
          const resp: ToolCallResponse = {
            status: 'failed',
            name: toolName,
            error: `${toolName} not implemented in switch-case.`,
          };
          const toolCmsg = new CMessage('tool', JSON.stringify(resp));
          return toolCmsg;
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
      const toolCmsg = new CMessage('tool', JSON.stringify(resp));
      return toolCmsg;
    } catch (error) {
      const resp: ToolCallResponse = {
        status: 'failed',
        name: toolName,
        error: (error as unknown as Error).message,
      };
      const toolCmsg = new CMessage('tool', JSON.stringify(resp));
      return toolCmsg;
    }
  }
}
