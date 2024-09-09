export interface DBMessage {
  id: number; // 数据库自增 ID
  role: string;
  content: string;
}

export interface DBToolCall {
  id: number; // 数据库自增 ID
  message_id: number; // 外键，关联 Message 表
  function_name: string;
}

export interface DBImage {
  id: number; // 数据库自增 ID
  message_id: number; // 外键，关联 Message 表
  image?: Uint8Array; // 如果是 Uint8Array 类型的图片，使用 BLOB
  image_url?: string; // 如果是 URL 类型的图片，使用 TEXT
}

export interface DBToolCallArgument {
  id: number; // 数据库自增 ID
  tool_call_id: number; // 外键，关联 ToolCall 表
  argument_key: string; // 参数的 key
  argument_value: string; // 参数的值，存储为 JSON 字符串
}
