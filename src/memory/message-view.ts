import { Message, ToolCall } from 'ollama';
import { db } from './database';
import { DBImage, DBMessage } from './model';

export class MessageView {
  static loadMsgById(messageId: number, memoId = 'chat'): Message | null {
    const messageStmt = db.prepare('SELECT id, role, content FROM messages WHERE id = ? AND memo_id = ?');
    const messageRow = messageStmt.get(messageId, memoId) as DBMessage | null | undefined;

    if (!messageRow) {
      return null; // 如果找不到 message，返回 null
    }

    // 加载关联的 images 和 tool_calls
    const images = this.loadImagesByMessageId(messageId) as (Uint8Array[] | string[]) | undefined;
    const toolCalls = this.loadToolCallsByMessageId(messageId);

    const message: Message = {
      role: messageRow.role,
      content: messageRow.content,
      images,
      tool_calls: toolCalls,
    };
    return message;
  }

  // 加载 Images
  private static loadImagesByMessageId(messageId: number): Uint8Array[] | string[] | undefined {
    const imageStmt = db.prepare('SELECT image, image_url FROM images WHERE message_id = ?');
    const imageRows = imageStmt.all(messageId) as Pick<DBImage, 'image' | 'image_url'>[];

    const value = imageRows.map((row: unknown) => {
      const data = row as DBImage;
      if (data.image) {
        return data.image; // 返回 Uint8Array (BLOB)
      }
      return data.image_url; // 返回 string (URL)
    }) as Uint8Array[] | string[] | undefined;
    return value;
  }

  // 加载 ToolCalls 和 Arguments
  private static loadToolCallsByMessageId(messageId: number): ToolCall[] {
    const toolCallStmt = db.prepare('SELECT id, function_name FROM tool_calls WHERE message_id = ?');
    const toolCallRows = toolCallStmt.all(messageId);

    return toolCallRows.map((row: unknown) => {
      const data = row as { id: number; function_name: string };
      const argumentsObj = this.loadToolCallArgumentsByToolCallId(data.id);
      return {
        function: {
          name: data.function_name,
          arguments: argumentsObj,
        },
      };
    });
  }

  // 加载 ToolCall 的 Arguments
  private static loadToolCallArgumentsByToolCallId(toolCallId: number): {
    [key: string]: string;
  } {
    const argStmt = db.prepare('SELECT argument_key, argument_value FROM tool_call_arguments WHERE tool_call_id = ?');
    const argRows = argStmt.all(toolCallId);

    const argumentsObj: { [key: string]: string } = {};
    argRows.forEach((row) => {
      const data = row as {
        id: number;
        argument_key: string;
        argument_value: string;
      };
      argumentsObj[data.argument_key] = JSON.parse(data.argument_value); // 解析 JSON 字符串
    });

    return argumentsObj;
  }

  static listAllMessages(memoId = 'chat'): Message[] {
    const stmt = db.prepare('SELECT id FROM messages WHERE memo_id = ?');
    const rows = stmt.all(memoId) as Pick<DBMessage, 'id'>[];

    const messages: Message[] = [];
    rows.forEach((row) => {
      const message = this.loadMsgById(row.id);
      if (message) {
        messages.push(message);
      }
    });

    return messages;
  }
}
