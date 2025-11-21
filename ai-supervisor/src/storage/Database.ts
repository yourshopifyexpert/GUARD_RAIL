import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

/**
 * Database configuration options
 */
export interface DatabaseConfig {
  /** Path to the database file. If not provided, uses in-memory database. */
  dbPath?: string;
  /** Enable verbose mode for debugging SQL statements */
  verbose?: boolean;
  /** Enable WAL mode for better concurrent access */
  wal?: boolean;
  /** Enable foreign key constraints */
  foreignKeys?: boolean;
}

/**
 * SQLite database wrapper for AI Supervisor storage
 *
 * Provides core storage layer with:
 * - Conversation history with compression support
 * - Code change tracking with diffs
 * - Goal and scope management
 * - Efficient querying with indexes
 * - Transaction support
 */
export class SupervisorDatabase {
  private db: Database.Database;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig = {}) {
    this.config = {
      verbose: false,
      wal: true,
      foreignKeys: true,
      ...config,
    };

    // Create directory if needed
    if (this.config.dbPath) {
      const dir = dirname(this.config.dbPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }

    this.db = new Database(this.config.dbPath || ':memory:', {
      verbose: this.config.verbose ? console.log : undefined,
    });

    // Configure database
    if (this.config.wal) {
      this.db.pragma('journal_mode = WAL');
    }
    if (this.config.foreignKeys) {
      this.db.pragma('foreign_keys = ON');
    }

    this.initializeSchema();
  }

  /**
   * Initialize database schema with all required tables and indexes
   */
  private initializeSchema(): void {
    this.db.exec(`
      -- Conversations table stores conversation metadata
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        started_at TEXT NOT NULL,
        last_message_at TEXT NOT NULL,
        metadata TEXT
      );

      -- Messages table stores individual messages within conversations
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        content_compressed INTEGER DEFAULT 0,
        metadata TEXT,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );

      -- Code changes table stores file modifications with diffs
      CREATE TABLE IF NOT EXISTS code_changes (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        type TEXT NOT NULL,
        file_path TEXT NOT NULL,
        before TEXT,
        after TEXT,
        diff TEXT NOT NULL,
        diff_compressed INTEGER DEFAULT 0,
        reason TEXT,
        message_id TEXT,
        conversation_id TEXT,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE SET NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
      );

      -- Goals table stores project goals and scope
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        constraints TEXT NOT NULL,
        scope TEXT NOT NULL,
        priority INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        status TEXT NOT NULL
      );

      -- Deviations table stores detected deviations
      CREATE TABLE IF NOT EXISTS deviations (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        description TEXT NOT NULL,
        affected_files TEXT,
        related_goal_id TEXT,
        suggested_action TEXT,
        FOREIGN KEY (related_goal_id) REFERENCES goals(id) ON DELETE SET NULL
      );

      -- Interventions table stores intervention actions
      CREATE TABLE IF NOT EXISTS interventions (
        id TEXT PRIMARY KEY,
        deviation_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        user_notified INTEGER NOT NULL,
        ai_message_generated TEXT,
        FOREIGN KEY (deviation_id) REFERENCES deviations(id) ON DELETE CASCADE
      );

      -- Indexes for efficient querying
      CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_code_changes_file ON code_changes(file_path, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_code_changes_conversation ON code_changes(conversation_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_code_changes_timestamp ON code_changes(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status, priority DESC);
      CREATE INDEX IF NOT EXISTS idx_deviations_timestamp ON deviations(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_deviations_type ON deviations(type, timestamp DESC);
    `);
  }

  /**
   * Execute a SQL statement with parameters
   * @param sql SQL statement
   * @param params Parameters for the statement
   * @returns Result of the execution
   */
  execute(sql: string, params: any[] = []): Database.RunResult {
    const stmt = this.db.prepare(sql);
    return stmt.run(...params);
  }

  /**
   * Query multiple rows from the database
   * @param sql SQL query
   * @param params Parameters for the query
   * @returns Array of rows
   */
  query<T = any>(sql: string, params: any[] = []): T[] {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as T[];
  }

  /**
   * Query a single row from the database
   * @param sql SQL query
   * @param params Parameters for the query
   * @returns Single row or undefined
   */
  queryOne<T = any>(sql: string, params: any[] = []): T | undefined {
    const stmt = this.db.prepare(sql);
    return stmt.get(...params) as T | undefined;
  }

  /**
   * Execute a function within a transaction
   * @param fn Function to execute
   * @returns Result of the function
   */
  transaction<T>(fn: () => T): T {
    const txn = this.db.transaction(fn);
    return txn();
  }

  /**
   * Get the raw better-sqlite3 database instance
   * Use with caution - prefer using execute/query methods
   */
  getDb(): Database.Database {
    return this.db;
  }

  /**
   * Get database statistics
   */
  getStats(): {
    conversations: number;
    messages: number;
    codeChanges: number;
    goals: number;
    deviations: number;
  } {
    const counts = {
      conversations: this.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM conversations')?.count || 0,
      messages: this.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM messages')?.count || 0,
      codeChanges: this.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM code_changes')?.count || 0,
      goals: this.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM goals')?.count || 0,
      deviations: this.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM deviations')?.count || 0,
    };
    return counts;
  }

  /**
   * Optimize database performance
   */
  optimize(): void {
    this.db.exec('VACUUM');
    this.db.exec('ANALYZE');
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db && this.db.open) {
      this.db.close();
    }
  }

  /**
   * Cleanup old records based on retention policy
   * @param retentionDays Number of days to retain
   */
  cleanupOldRecords(retentionDays: number): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoff = cutoffDate.toISOString();

    this.transaction(() => {
      this.execute('DELETE FROM messages WHERE timestamp < ?', [cutoff]);
      this.execute('DELETE FROM code_changes WHERE timestamp < ?', [cutoff]);
      this.execute('DELETE FROM deviations WHERE timestamp < ?', [cutoff]);
      // Conversations will be deleted via CASCADE when all messages are gone
    });
  }
}
