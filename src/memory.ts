import sqlite3 from 'sqlite3';

class Memory {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(':memory:', (err) => {
      if (err) {
        console.error(err.message);
      } else {
        console.log('Connected to the in-memory SQlite database.');
        this.createTable();
      }
    });
  }

  private createTable() {
    this.db.run('CREATE TABLE conversations (id INTEGER PRIMARY KEY, conversation TEXT)', (err) => {
      if (err) {
        console.error(err.message);
      } else {
        console.log('Table created successfully.');
        this.insertConversations();
      }
    });
  }

  private insertConversations() {
    let stmt = this.db.prepare('INSERT INTO conversations (conversation) VALUES (?)');
    for (let i = 0; i < 10; i++) {
      stmt.run(`Ipsum ${i}`);
    }
    stmt.finalize();
  }

  public getConversations() {
    this.db.each('SELECT id, conversation FROM conversations', (err, row: any) => {
      if (err) {
        console.error(err.message);
      } else {
        console.log(`${row.id} ${row.conversation}`);
      }
    });
  }

  public close() {
    this.db.close((err) => {
      if (err) {
        console.error(err.message);
      } else {
        console.log('Close the database connection.');
      }
    });
  }
}

const memory = new Memory();
memory.getConversations();
memory.close();
