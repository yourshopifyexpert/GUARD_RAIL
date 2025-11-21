/**
 * Storage layer for conversation and message history
 * @module storage/ConversationStore
 *
 * Provides:
 * - Conversation and message storage with timestamps
 * - Automatic compression for large messages (>1KB)
 * - Efficient pagination for large conversations
 * - Message search and filtering capabilities
 */

import { SupervisorDatabase } from './Database';
import { gzipSync, gunzipSync } from 'zlib';

/**
 * Message role types
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Unique identifier type
 */
export type ID = string;

/**
 * Message structure
 */
export interface Message {
  id: ID;
  timestamp: string;
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown>;
}

/**
 * Conversation structure
 */
export interface Conversation {
  id: ID;
  startedAt: string;
  lastMessageAt: string;
  messages: Message[];
  metadata?: Record<string, unknown>;
}

/**
 * Manages conversation and message storage with compression support
 */
export class ConversationStore {
  /** Compression threshold in bytes - content larger than this will be compressed */
  private static readonly COMPRESSION_THRESHOLD = 1024;

  constructor(private db: SupervisorDatabase) {}

  /**
   * Create a new conversation
   * @param id - Conversation ID
   * @param metadata - Optional metadata
   * @returns The created conversation
   */
  createConversation(id: ID, metadata?: Record<string, unknown>): Conversation {
    const now = new Date().toISOString();

    this.db.execute(
      `INSERT INTO conversations (id, started_at, last_message_at, metadata) VALUES (?, ?, ?, ?)`,
      [id, now, now, metadata ? JSON.stringify(metadata) : null]
    );

    return {
      id,
      startedAt: now,
      lastMessageAt: now,
      messages: [],
      metadata,
    };
  }

  /**
   * Get a conversation by ID
   * @param id - Conversation ID
   * @returns The conversation or undefined if not found
   */
  getConversation(id: ID): Conversation | undefined {
    const row = this.db.queryOne<{
      id: string;
      started_at: string;
      last_message_at: string;
      metadata: string | null;
    }>('SELECT * FROM conversations WHERE id = ?', [id]);

    if (!row) return undefined;

    const messages = this.getMessages(id);

    return {
      id: row.id,
      startedAt: row.started_at,
      lastMessageAt: row.last_message_at,
      messages,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }

  /**
   * Get all conversations
   * @param limit - Maximum number of conversations to return
   * @param offset - Number of conversations to skip
   * @returns Array of conversations
   */
  getAllConversations(limit = 100, offset = 0): Conversation[] {
    const rows = this.db.query<{
      id: string;
      started_at: string;
      last_message_at: string;
      metadata: string | null;
    }>('SELECT * FROM conversations ORDER BY last_message_at DESC LIMIT ? OFFSET ?', [limit, offset]);

    return rows.map(row => ({
      id: row.id,
      startedAt: row.started_at,
      lastMessageAt: row.last_message_at,
      messages: this.getMessages(row.id),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    }));
  }

  /**
   * Add a message to a conversation
   * Automatically compresses content if it exceeds the threshold
   * @param conversationId - Conversation ID
   * @param message - Message to add
   */
  addMessage(conversationId: ID, message: Message): void {
    // Compress content if it's large
    let contentToStore = message.content;
    let isCompressed = 0;

    if (Buffer.byteLength(message.content, 'utf8') > ConversationStore.COMPRESSION_THRESHOLD) {
      const compressed = gzipSync(Buffer.from(message.content, 'utf8'));
      contentToStore = compressed.toString('base64');
      isCompressed = 1;
    }

    this.db.transaction(() => {
      this.db.execute(
        `INSERT INTO messages (id, conversation_id, timestamp, role, content, content_compressed, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          message.id,
          conversationId,
          message.timestamp,
          message.role,
          contentToStore,
          isCompressed,
          message.metadata ? JSON.stringify(message.metadata) : null,
        ]
      );

      // Update conversation last_message_at
      this.db.execute(
        'UPDATE conversations SET last_message_at = ? WHERE id = ?',
        [message.timestamp, conversationId]
      );
    });
  }

  /**
   * Get all messages in a conversation
   * Automatically decompresses compressed messages
   * @param conversationId - Conversation ID
   * @param limit - Maximum number of messages to return
   * @param offset - Number of messages to skip for pagination
   * @returns Array of messages
   */
  getMessages(conversationId: ID, limit = 1000, offset = 0): Message[] {
    const rows = this.db.query<{
      id: string;
      timestamp: string;
      role: string;
      content: string;
      content_compressed: number;
      metadata: string | null;
    }>(
      'SELECT id, timestamp, role, content, content_compressed, metadata FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC LIMIT ? OFFSET ?',
      [conversationId, limit, offset]
    );

    return rows.map(row => this.mapRowToMessage(row));
  }

  /**
   * Map database row to Message object with decompression
   */
  private mapRowToMessage(row: {
    id: string;
    timestamp: string;
    role: string;
    content: string;
    content_compressed: number;
    metadata: string | null;
  }): Message {
    let content = row.content;

    // Decompress if needed
    if (row.content_compressed === 1) {
      const buffer = Buffer.from(row.content, 'base64');
      content = gunzipSync(buffer).toString('utf8');
    }

    return {
      id: row.id,
      timestamp: row.timestamp,
      role: row.role as MessageRole,
      content,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }

  /**
   * Get recent messages across all conversations
   * Automatically decompresses compressed messages
   * @param limit - Maximum number of messages to return
   * @returns Array of messages
   */
  getRecentMessages(limit = 50): Message[] {
    const rows = this.db.query<{
      id: string;
      timestamp: string;
      role: string;
      content: string;
      content_compressed: number;
      metadata: string | null;
    }>('SELECT id, timestamp, role, content, content_compressed, metadata FROM messages ORDER BY timestamp DESC LIMIT ?', [limit]);

    return rows.map(row => this.mapRowToMessage(row));
  }

  /**
   * Delete a conversation and all its messages
   * @param id - Conversation ID
   */
  deleteConversation(id: ID): void {
    this.db.execute('DELETE FROM conversations WHERE id = ?', [id]);
  }

  /**
   * Get message by ID
   * Automatically decompresses if compressed
   * @param id - Message ID
   * @returns The message or undefined if not found
   */
  getMessage(id: ID): Message | undefined {
    const row = this.db.queryOne<{
      id: string;
      timestamp: string;
      role: string;
      content: string;
      content_compressed: number;
      metadata: string | null;
    }>('SELECT id, timestamp, role, content, content_compressed, metadata FROM messages WHERE id = ?', [id]);

    if (!row) return undefined;

    return this.mapRowToMessage(row);
  }

  /**
   * Get conversation statistics
   * @param conversationId - Conversation ID
   * @returns Statistics about the conversation
   */
  getConversationStats(conversationId: ID): {
    messageCount: number;
    userMessages: number;
    assistantMessages: number;
    systemMessages: number;
    compressedMessages: number;
  } {
    const stats = this.db.queryOne<{
      total: number;
      user_count: number;
      assistant_count: number;
      system_count: number;
      compressed_count: number;
    }>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user_count,
        SUM(CASE WHEN role = 'assistant' THEN 1 ELSE 0 END) as assistant_count,
        SUM(CASE WHEN role = 'system' THEN 1 ELSE 0 END) as system_count,
        SUM(CASE WHEN content_compressed = 1 THEN 1 ELSE 0 END) as compressed_count
      FROM messages
      WHERE conversation_id = ?
    `, [conversationId]);

    return {
      messageCount: stats?.total || 0,
      userMessages: stats?.user_count || 0,
      assistantMessages: stats?.assistant_count || 0,
      systemMessages: stats?.system_count || 0,
      compressedMessages: stats?.compressed_count || 0,
    };
  }
}
