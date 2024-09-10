CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  image BLOB,         -- 如果是 Uint8Array，可以用 BLOB 类型
  image_url TEXT,     -- 如果是 string（URL），用 TEXT 类型
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE TABLE tool_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  function_name TEXT NOT NULL,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE TABLE tool_call_arguments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_call_id INTEGER NOT NULL,
  argument_key TEXT NOT NULL,
  argument_value TEXT NOT NULL,  -- 可以用 TEXT 类型存储 JSON 字符串
  FOREIGN KEY (tool_call_id) REFERENCES tool_calls(id) ON DELETE CASCADE
);
