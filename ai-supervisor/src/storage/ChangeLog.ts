/**
 * Storage layer for code change history
 * @module storage/ChangeLog
 *
 * Provides:
 * - Code change tracking with before/after diffs
 * - Automatic compression for large diffs (>1KB)
 * - Reversal detection capabilities
 * - Change history by file, conversation, or time range
 */

import { SupervisorDatabase } from './Database';
import { gzipSync, gunzipSync } from 'zlib';

/**
 * Unique identifier type
 */
export type ID = string;

/**
 * Change type enumeration
 */
export type ChangeType = 'create' | 'modify' | 'delete' | 'rename';

/**
 * Code change structure
 */
export interface CodeChange {
  id: ID;
  timestamp: string;
  type: ChangeType;
  filePath: string;
  before: string | null;
  after: string | null;
  diff: string;
  reason?: string;
  messageId?: ID;
  conversationId?: ID;
}

/**
 * Manages code change history storage with compression
 */
export class ChangeLog {
  /** Compression threshold in bytes - diffs larger than this will be compressed */
  private static readonly COMPRESSION_THRESHOLD = 1024;

  constructor(private db: SupervisorDatabase) {}

  /**
   * Record a code change
   * Automatically compresses diff if it exceeds the threshold
   * @param change - Code change to record
   */
  recordChange(change: CodeChange): void {
    // Compress diff if it's large
    let diffToStore = change.diff;
    let isCompressed = 0;

    if (Buffer.byteLength(change.diff, 'utf8') > ChangeLog.COMPRESSION_THRESHOLD) {
      const compressed = gzipSync(Buffer.from(change.diff, 'utf8'));
      diffToStore = compressed.toString('base64');
      isCompressed = 1;
    }

    this.db.execute(
      `INSERT INTO code_changes (
        id, timestamp, type, file_path, before, after, diff, diff_compressed, reason, message_id, conversation_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        change.id,
        change.timestamp,
        change.type,
        change.filePath,
        change.before,
        change.after,
        diffToStore,
        isCompressed,
        change.reason ?? null,
        change.messageId ?? null,
        change.conversationId ?? null,
      ]
    );
  }

  /**
   * Get a change by ID
   * Automatically decompresses if compressed
   * @param id - Change ID
   * @returns The change or undefined if not found
   */
  getChange(id: ID): CodeChange | undefined {
    const row = this.db.queryOne<{
      id: string;
      timestamp: string;
      type: string;
      file_path: string;
      before: string | null;
      after: string | null;
      diff: string;
      diff_compressed: number;
      reason: string | null;
      message_id: string | null;
      conversation_id: string | null;
    }>('SELECT * FROM code_changes WHERE id = ?', [id]);

    if (!row) return undefined;

    return this.mapRowToChange(row);
  }

  /**
   * Get all changes for a specific file
   * Automatically decompresses compressed diffs
   * @param filePath - File path
   * @param limit - Maximum number of changes to return
   * @returns Array of changes
   */
  getFileHistory(filePath: string, limit = 100): CodeChange[] {
    const rows = this.db.query<{
      id: string;
      timestamp: string;
      type: string;
      file_path: string;
      before: string | null;
      after: string | null;
      diff: string;
      diff_compressed: number;
      reason: string | null;
      message_id: string | null;
      conversation_id: string | null;
    }>('SELECT * FROM code_changes WHERE file_path = ? ORDER BY timestamp DESC LIMIT ?', [filePath, limit]);

    return rows.map(row => this.mapRowToChange(row));
  }

  /**
   * Get recent changes across all files
   * Automatically decompresses compressed diffs
   * @param limit - Maximum number of changes to return
   * @returns Array of changes
   */
  getRecentChanges(limit = 50): CodeChange[] {
    const rows = this.db.query<{
      id: string;
      timestamp: string;
      type: string;
      file_path: string;
      before: string | null;
      after: string | null;
      diff: string;
      diff_compressed: number;
      reason: string | null;
      message_id: string | null;
      conversation_id: string | null;
    }>('SELECT * FROM code_changes ORDER BY timestamp DESC LIMIT ?', [limit]);

    return rows.map(row => this.mapRowToChange(row));
  }

  /**
   * Get changes within a time range
   * @param startTime - Start timestamp
   * @param endTime - End timestamp
   * @returns Array of changes
   */
  getChangesByTimeRange(startTime: string, endTime: string): CodeChange[] {
    const rows = this.db.query<{
      id: string;
      timestamp: string;
      type: string;
      file_path: string;
      before: string | null;
      after: string | null;
      diff: string;
      diff_compressed: number;
      reason: string | null;
      message_id: string | null;
      conversation_id: string | null;
    }>('SELECT * FROM code_changes WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp ASC', [startTime, endTime]);

    return rows.map(row => this.mapRowToChange(row));
  }

  /**
   * Get changes linked to a specific conversation
   * @param conversationId - Conversation ID
   * @returns Array of changes
   */
  getChangesByConversation(conversationId: ID): CodeChange[] {
    const rows = this.db.query<{
      id: string;
      timestamp: string;
      type: string;
      file_path: string;
      before: string | null;
      after: string | null;
      diff: string;
      diff_compressed: number;
      reason: string | null;
      message_id: string | null;
      conversation_id: string | null;
    }>('SELECT * FROM code_changes WHERE conversation_id = ? ORDER BY timestamp ASC', [conversationId]);

    return rows.map(row => this.mapRowToChange(row));
  }

  /**
   * Get changes linked to a specific message
   * @param messageId - Message ID
   * @returns Array of changes
   */
  getChangesByMessage(messageId: ID): CodeChange[] {
    const rows = this.db.query<{
      id: string;
      timestamp: string;
      type: string;
      file_path: string;
      before: string | null;
      after: string | null;
      diff: string;
      diff_compressed: number;
      reason: string | null;
      message_id: string | null;
      conversation_id: string | null;
    }>('SELECT * FROM code_changes WHERE message_id = ? ORDER BY timestamp ASC', [messageId]);

    return rows.map(row => this.mapRowToChange(row));
  }

  /**
   * Find potential code reversals for a file
   * @param filePath - File path
   * @param withinHours - Look for reversals within this time window
   * @returns Array of potential reversals
   */
  findPotentialReversals(filePath: string, withinHours = 24): Array<{ original: CodeChange; reversal: CodeChange }> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - withinHours);
    const cutoff = cutoffTime.toISOString();

    const changes = this.db.query<{
      id: string;
      timestamp: string;
      type: string;
      file_path: string;
      before: string | null;
      after: string | null;
      diff: string;
      diff_compressed: number;
      reason: string | null;
      message_id: string | null;
      conversation_id: string | null;
    }>('SELECT * FROM code_changes WHERE file_path = ? AND timestamp >= ? ORDER BY timestamp ASC', [filePath, cutoff]);

    const reversals: Array<{ original: CodeChange; reversal: CodeChange }> = [];

    for (let i = 0; i < changes.length - 1; i++) {
      for (let j = i + 1; j < changes.length; j++) {
        const original = this.mapRowToChange(changes[i]!);
        const later = this.mapRowToChange(changes[j]!);

        // Check if later change reverses the original
        if (original.after === later.before && original.before === later.after) {
          reversals.push({ original, reversal: later });
        }
      }
    }

    return reversals;
  }

  /**
   * Map database row to CodeChange object with decompression
   */
  private mapRowToChange(row: {
    id: string;
    timestamp: string;
    type: string;
    file_path: string;
    before: string | null;
    after: string | null;
    diff: string;
    diff_compressed: number;
    reason: string | null;
    message_id: string | null;
    conversation_id: string | null;
  }): CodeChange {
    let diff = row.diff;

    // Decompress if needed
    if (row.diff_compressed === 1) {
      const buffer = Buffer.from(row.diff, 'base64');
      diff = gunzipSync(buffer).toString('utf8');
    }

    return {
      id: row.id,
      timestamp: row.timestamp,
      type: row.type as ChangeType,
      filePath: row.file_path,
      before: row.before,
      after: row.after,
      diff,
      reason: row.reason ?? undefined,
      messageId: row.message_id ?? undefined,
      conversationId: row.conversation_id ?? undefined,
    };
  }
}
