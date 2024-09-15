import DatabaseConstructor, { type Database } from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export const db: Database = new DatabaseConstructor('my-database.db');

// 创建表结构
export const createTables = () => {
  // Check if the table exists before executing the SQL
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='messages';").get();
  if (!tableExists) {
    const currentFileFolder = path.dirname(__filename);
    const sql = fs.readFileSync(path.resolve(currentFileFolder, './create-table.sql'), 'utf8');
    db.exec(sql);
  }
};
