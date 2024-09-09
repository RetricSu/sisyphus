import { Message, ToolCall } from "ollama";
import { db } from "./database";

export class CMessage {
  public dbId: number | undefined;
  public msg: Message;

  constructor(
    role: string,
    content: string,
    images: Uint8Array[] | string[] | undefined = [],
    toolCalls: ToolCall[] = []
  ) {
    this.msg = {
      role,
      content,
      images,
      tool_calls: toolCalls,
    };
  }

  // 保存 Message 到数据库
  save(): number {
    const stmt = db.prepare(
      "INSERT INTO messages (role, content) VALUES (?, ?)"
    );
    const result = stmt.run(this.msg.role, this.msg.content);
    this.dbId = result.lastInsertRowid as number;

    // 保存关联的 images 和 tool_calls
    this.saveImages(this.msg.images);
    this.saveToolCalls(this.msg.tool_calls);

    return this.dbId;
  }

  // 保存 Images
  private saveImages(images: typeof this.msg.images): void {
    if (!this.dbId) throw new Error("Message must be saved first.");
    if (!images || images.length === 0) return;

    const stmt = db.prepare(
      "INSERT INTO images (message_id, image, image_url) VALUES (?, ?, ?)"
    );
    images.forEach((image) => {
      if (image instanceof Uint8Array) {
        stmt.run(this.dbId, image, null); // 存储 BLOB
      } else {
        stmt.run(this.dbId, null, image); // 存储 URL
      }
    });
  }

  // 保存 ToolCalls 和 Arguments
  private saveToolCalls(toolCalls: typeof this.msg.tool_calls): void {
    if (!this.dbId) throw new Error("Message must be saved first.");
    if (!toolCalls || toolCalls.length === 0) return;

    const toolCallStmt = db.prepare(
      "INSERT INTO tool_calls (message_id, function_name) VALUES (?, ?)"
    );
    const argStmt = db.prepare(
      "INSERT INTO tool_call_arguments (tool_call_id, argument_key, argument_value) VALUES (?, ?, ?)"
    );

    toolCalls.forEach((toolCall) => {
      const result = toolCallStmt.run(this.dbId, toolCall.function.name);
      const toolCallId = result.lastInsertRowid as number;

      Object.entries(toolCall.function.arguments).forEach(([key, value]) => {
        argStmt.run(toolCallId, key, JSON.stringify(value)); // 保存参数，存储为 JSON 字符串
      });
    });
  }
}
