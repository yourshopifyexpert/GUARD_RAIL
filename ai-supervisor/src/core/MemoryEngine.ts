/**
 * Memory Engine - Core memory management for AI Supervisor
 * @module core/MemoryEngine
 *
 * Provides centralized memory management for:
 * - Conversation logging with compression
 * - Code change tracking with diffs
 * - Cross-session context preservation
 * - Memory summarization for model switching
 */

import { SupervisorDatabase, DatabaseConfig } from '../storage/Database';
import { ConversationStore, Message, Conversation, MessageRole, ID } from '../storage/ConversationStore';
import { ChangeLog, CodeChange, ChangeType } from '../storage/ChangeLog';
import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';

/**
 * Memory engine configuration
 */
export interface MemoryEngineConfig {
  /** Database configuration */
  database?: DatabaseConfig;

  /** Maximum age of messages to keep in memory (days) */
  retentionDays?: number;

  /** Auto-cleanup interval (milliseconds), 0 to disable */
  autoCleanupIntervalMs?: number;

  /** Enable event emission for memory operations */
  enableEvents?: boolean;
}

/**
 * Memory statistics
 */
export interface MemoryStats {
  /** Total conversations */
  totalConversations: number;

  /** Total messages */
  totalMessages: number;

  /** Total code changes */
  totalCodeChanges: number;

  /** Database statistics */
  databaseStats: ReturnType<SupervisorDatabase['getStats']>;
}

/**
 * Memory Engine - Main memory management system
 *
 * Orchestrates conversation logging and code change tracking with:
 * - Automatic compression for large content
 * - Efficient querying with pagination
 * - Event-driven architecture for integrations
 * - Memory cleanup based on retention policies
 *
 * @example
 * ```typescript
 * const engine = new MemoryEngine({
 *   database: { dbPath: './data/memory.db' },
 *   retentionDays: 90,
 * });
 *
 * // Start a conversation
 * const conversation = engine.startConversation('Implement auth feature');
 *
 * // Log user message
 * engine.logMessage(conversation.id, {
 *   role: 'user',
 *   content: 'I need to add user authentication',
 * });
 * ```
 */
export class MemoryEngine extends EventEmitter {
  private db: SupervisorDatabase;
  private conversationStore: ConversationStore;
  private changeLog: ChangeLog;
  private config: Required<MemoryEngineConfig>;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: MemoryEngineConfig = {}) {
    super();

    this.config = {
      database: config.database || {},
      retentionDays: config.retentionDays ?? 90,
      autoCleanupIntervalMs: config.autoCleanupIntervalMs ?? 0,
      enableEvents: config.enableEvents ?? true,
    };

    // Initialize database and stores
    this.db = new SupervisorDatabase(this.config.database);
    this.conversationStore = new ConversationStore(this.db);
    this.changeLog = new ChangeLog(this.db);

    // Start auto-cleanup if enabled
    if (this.config.autoCleanupIntervalMs > 0) {
      this.startAutoCleanup();
    }
  }

  // ============================================================================
  // Conversation Management
  // ============================================================================

  /**
   * Start a new conversation
   *
   * @param title - Optional conversation title
   * @param metadata - Optional metadata
   * @returns The created conversation
   */
  startConversation(title?: string, metadata?: Record<string, unknown>): Conversation {
    const conversation = this.conversationStore.createConversation(
      randomUUID(),
      metadata ? { title, ...metadata } : title ? { title } : undefined
    );

    if (this.config.enableEvents) {
      this.emit('conversationStarted', conversation);
    }

    return conversation;
  }

  /**
   * Get a conversation by ID
   */
  getConversation(conversationId: ID): Conversation | undefined {
    return this.conversationStore.getConversation(conversationId);
  }

  /**
   * List recent conversations
   */
  listConversations(limit = 50, offset = 0): Conversation[] {
    return this.conversationStore.getAllConversations(limit, offset);
  }

  /**
   * Delete a conversation
   */
  deleteConversation(conversationId: ID): void {
    this.conversationStore.deleteConversation(conversationId);

    if (this.config.enableEvents) {
      this.emit('conversationDeleted', conversationId);
    }
  }

  // ============================================================================
  // Message Logging
  // ============================================================================

  /**
   * Log a message in a conversation
   * Automatically compresses large messages (>1KB)
   */
  logMessage(
    conversationId: ID,
    message: {
      role: MessageRole;
      content: string;
      metadata?: Record<string, unknown>;
    }
  ): Message {
    const msg: Message = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      role: message.role,
      content: message.content,
      metadata: message.metadata,
    };

    this.conversationStore.addMessage(conversationId, msg);

    if (this.config.enableEvents) {
      this.emit('messageLogged', { conversationId, message: msg });
    }

    return msg;
  }

  /**
   * Get messages from a conversation
   */
  getMessages(conversationId: ID, limit = 1000, offset = 0): Message[] {
    return this.conversationStore.getMessages(conversationId, limit, offset);
  }

  /**
   * Get recent messages across all conversations
   */
  getRecentMessages(limit = 50): Message[] {
    return this.conversationStore.getRecentMessages(limit);
  }

  /**
   * Get conversation statistics
   */
  getConversationStats(conversationId: ID) {
    return this.conversationStore.getConversationStats(conversationId);
  }

  // ============================================================================
  // Code Change Tracking
  // ============================================================================

  /**
   * Log a code change
   * Automatically compresses large diffs (>1KB)
   */
  logCodeChange(change: {
    filePath: string;
    type: ChangeType;
    before: string | null;
    after: string | null;
    diff: string;
    reason?: string;
    messageId?: ID;
    conversationId?: ID;
  }): CodeChange {
    const codeChange: CodeChange = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      type: change.type,
      filePath: change.filePath,
      before: change.before,
      after: change.after,
      diff: change.diff,
      reason: change.reason,
      messageId: change.messageId,
      conversationId: change.conversationId,
    };

    this.changeLog.recordChange(codeChange);

    if (this.config.enableEvents) {
      this.emit('codeChangeLogged', codeChange);
    }

    return codeChange;
  }

  /**
   * Get file history
   */
  getFileHistory(filePath: string, limit = 100): CodeChange[] {
    return this.changeLog.getFileHistory(filePath, limit);
  }

  /**
   * Get recent code changes
   */
  getRecentChanges(limit = 50): CodeChange[] {
    return this.changeLog.getRecentChanges(limit);
  }

  /**
   * Get changes for a conversation
   */
  getConversationChanges(conversationId: ID): CodeChange[] {
    return this.changeLog.getChangesByConversation(conversationId);
  }

  /**
   * Find potential code reversals
   */
  findReversals(filePath: string, withinHours = 24): Array<{ original: CodeChange; reversal: CodeChange }> {
    return this.changeLog.findPotentialReversals(filePath, withinHours);
  }

  // ============================================================================
  // Memory Management
  // ============================================================================

  /**
   * Get memory statistics
   */
  getStats(): MemoryStats {
    const dbStats = this.db.getStats();

    return {
      totalConversations: dbStats.conversations,
      totalMessages: dbStats.messages,
      totalCodeChanges: dbStats.codeChanges,
      databaseStats: dbStats,
    };
  }

  /**
   * Cleanup old records based on retention policy
   */
  cleanup(): void {
    this.db.cleanupOldRecords(this.config.retentionDays);

    if (this.config.enableEvents) {
      this.emit('cleanupCompleted', { retentionDays: this.config.retentionDays });
    }
  }

  /**
   * Optimize database performance
   */
  optimize(): void {
    this.db.optimize();

    if (this.config.enableEvents) {
      this.emit('optimizeCompleted');
    }
  }

  /**
   * Export conversation context for model switching
   */
  exportConversationContext(
    conversationId: ID,
    options: {
      includeFullHistory?: boolean;
      maxMessages?: number;
    } = {}
  ): {
    conversationId: ID;
    summary: string;
    recentMessages: Message[];
    codeChanges: CodeChange[];
    metadata: Record<string, unknown>;
  } {
    const conversation = this.getConversation(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const messages = options.includeFullHistory
      ? conversation.messages
      : this.getMessages(conversationId, options.maxMessages || 50);

    const changes = this.getConversationChanges(conversationId);

    // Generate summary
    let summary = `Conversation: ${conversation.metadata?.title || conversationId}\n`;
    summary += `Started: ${conversation.startedAt}\n`;
    summary += `Messages: ${messages.length}\n`;
    summary += `Code changes: ${changes.length}\n`;

    return {
      conversationId,
      summary,
      recentMessages: messages,
      codeChanges: changes,
      metadata: conversation.metadata || {},
    };
  }

  /**
   * Start automatic cleanup timer
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.autoCleanupIntervalMs);
  }

  /**
   * Stop automatic cleanup timer
   */
  private stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Close the memory engine and cleanup resources
   */
  close(): void {
    this.stopAutoCleanup();
    this.db.close();

    if (this.config.enableEvents) {
      this.emit('closed');
    }
  }
}
