import { EventEmitter } from 'events';
import { SupervisorConfig, CodeChange, Deviation, Intervention } from '../types';
import { SupervisorDatabase } from '../storage/Database';
import { MemoryEngine } from '../core/MemoryEngine';
import { GoalTracker, Goal } from '../core/GoalTracker';
import { DeviationDetector } from '../core/DeviationDetector';
import { InterventionManager } from '../core/InterventionManager';
import { ModelSwitchHandler } from '../core/ModelSwitchHandler';
import { ChangeType } from '../storage/ChangeLog';

/**
 * Main API for the AI Supervisor system
 * This is the primary interface for external integrations (VS Code extension, etc.)
 */
export class SupervisorAPI extends EventEmitter {
  private db: SupervisorDatabase;
  private memory: MemoryEngine;
  private goals: GoalTracker;
  private detector: DeviationDetector;
  private intervention: InterventionManager;
  private modelSwitch: ModelSwitchHandler;
  private config: Required<SupervisorConfig>;
  private currentConversationId?: string;

  constructor(config: Partial<SupervisorConfig> = {}) {
    super();

    this.config = {
      databasePath: config.databasePath || ':memory:',
      enableCodeReversalDetection: config.enableCodeReversalDetection !== false,
      enableScopeValidation: config.enableScopeValidation !== false,
      enableUnauthorizedActionPrevention: config.enableUnauthorizedActionPrevention !== false,
      maxConversationHistory: config.maxConversationHistory || 1000,
      retentionDays: config.retentionDays || 30,
      interventionThreshold: config.interventionThreshold || 'medium'
    };

    this.db = new SupervisorDatabase({ dbPath: this.config.databasePath });
    this.memory = new MemoryEngine({
      database: { dbPath: this.config.databasePath },
      retentionDays: this.config.retentionDays
    });
    this.goals = new GoalTracker(this.db);
    this.detector = new DeviationDetector(this.db);
    this.intervention = new InterventionManager(this.db, { threshold: this.config.interventionThreshold });
    this.modelSwitch = new ModelSwitchHandler(this.db);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Forward deviation events
    this.detector.on('deviation', (deviation: Deviation) => {
      this.emit('deviation', deviation);

      // Automatically create intervention
      const inter = this.intervention.processDeviation(deviation);
      if (inter) {
        this.emit('intervention', inter);
      }
    });

    // Forward intervention events
    this.intervention.on('intervention', (intervention: Intervention) => {
      this.emit('intervention', intervention);
    });
  }

  // Memory Engine APIs

  /**
   * Start a new conversation
   */
  startConversation(title?: string, metadata?: Record<string, any>) {
    const conversation = this.memory.startConversation(title, metadata);
    this.currentConversationId = conversation.id;
    return conversation;
  }

  /**
   * Log a user message
   */
  logUserMessage(content: string, metadata?: Record<string, any>) {
    if (!this.currentConversationId) {
      this.startConversation();
    }
    return this.memory.logMessage(this.currentConversationId!, {
      role: 'user',
      content,
      metadata
    });
  }

  /**
   * Log an assistant message
   */
  logAssistantMessage(content: string, metadata?: Record<string, any>) {
    if (!this.currentConversationId) {
      this.startConversation();
    }
    return this.memory.logMessage(this.currentConversationId!, {
      role: 'assistant',
      content,
      metadata
    });
  }

  /**
   * Log a code change and analyze it for deviations
   */
  async logCodeChange(
    filePath: string,
    beforeContent: string,
    afterContent: string,
    reason?: string,
    conversationId?: string
  ): Promise<CodeChange> {
    // Generate diff
    const diff = this.generateSimpleDiff(beforeContent, afterContent);

    // Determine change type
    const type: ChangeType = !beforeContent ? 'create' : !afterContent ? 'delete' : 'modify';

    // Log the change
    this.memory.logCodeChange({
      filePath,
      type,
      before: beforeContent,
      after: afterContent,
      diff,
      reason,
      conversationId: conversationId || this.currentConversationId
    });

    // Analyze the change for deviations
    if (this.config.enableCodeReversalDetection || this.config.enableScopeValidation) {
      const activeGoals = this.goals.getActiveGoals();
      const history = this.memory.getFileHistory(filePath, 10);

      const deviations = await this.detector.analyzeChange(
        {
          filePath,
          before: beforeContent,
          after: afterContent,
          timestamp: new Date(),
          reason,
          conversationId: conversationId || this.currentConversationId
        },
        {
          history: history.map(h => ({
            filePath: h.filePath,
            before: h.before || '',
            after: h.after || '',
            timestamp: new Date(h.timestamp),
            reason: h.reason,
            conversationId: h.conversationId
          })),
          scope: activeGoals.length > 0 ? {
            goals: activeGoals.map(g => g.title),
            allowedPaths: activeGoals.flatMap(g => g.scope),
            constraints: activeGoals.flatMap(g => g.constraints)
          } : undefined
        }
      );

      // Emit deviations
      deviations.forEach(deviation => {
        this.emit('deviation', deviation);
      });
    }

    return {
      filePath,
      before: beforeContent,
      after: afterContent,
      timestamp: new Date(),
      reason,
      conversationId: conversationId || this.currentConversationId
    };
  }

  /**
   * Generate a simple diff between before and after
   */
  private generateSimpleDiff(before: string, after: string): string {
    const beforeLines = before.split('\n');
    const afterLines = after.split('\n');

    let diff = '';
    const maxLen = Math.max(beforeLines.length, afterLines.length);

    for (let i = 0; i < maxLen; i++) {
      if (beforeLines[i] !== afterLines[i]) {
        if (beforeLines[i]) {
          diff += `- ${beforeLines[i]}\n`;
        }
        if (afterLines[i]) {
          diff += `+ ${afterLines[i]}\n`;
        }
      }
    }

    return diff || 'No changes';
  }

  /**
   * Get recent messages
   */
  getConversationHistory(limit?: number) {
    return this.memory.getRecentMessages(limit || 50);
  }

  /**
   * Get file history
   */
  getCodeChangeHistory(filePath?: string, limit?: number) {
    if (filePath) {
      return this.memory.getFileHistory(filePath, limit || 100);
    }
    return this.memory.getRecentChanges(limit || 50);
  }

  // Goal Tracker APIs

  /**
   * Create a new goal
   */
  createGoal(options: {
    title: string;
    description: string;
    constraints?: string[];
    scope?: string[];
    priority?: number;
  }): Goal {
    return this.goals.createGoal(options);
  }

  /**
   * Update a goal
   */
  updateGoal(id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>, reason?: string): Goal | null {
    return this.goals.updateGoal(id, updates, reason);
  }

  /**
   * Get a goal by ID
   */
  getGoal(id: string): Goal | null {
    return this.goals.getGoal(id);
  }

  /**
   * Get all active goals
   */
  getActiveGoals(): Goal[] {
    return this.goals.getActiveGoals();
  }

  /**
   * Mark a goal as completed
   */
  completeGoal(id: string, reason?: string): Goal | null {
    return this.goals.completeGoal(id, reason);
  }

  /**
   * Delete a goal
   */
  deleteGoal(id: string): void {
    this.goals.deleteGoal(id);
  }

  // Deviation Detector APIs

  /**
   * Get detected deviations
   */
  getDeviations(type?: string, limit?: number): Deviation[] {
    return this.detector.getDeviations(type, limit);
  }

  /**
   * Get critical deviations
   */
  getCriticalDeviations(): Deviation[] {
    return this.detector.getCriticalDeviations();
  }

  // Intervention Manager APIs

  /**
   * Get interventions
   */
  getInterventions(deviationId?: string): Intervention[] {
    return this.intervention.getInterventions(deviationId);
  }

  // Model Switch Handler APIs

  /**
   * Generate model switch summary
   */
  generateModelSwitchSummary() {
    const activeGoals = this.goals.getActiveGoals();
    return this.modelSwitch.generateSummary(activeGoals);
  }

  /**
   * Export summary as JSON
   */
  exportSummaryJSON() {
    const summary = this.generateModelSwitchSummary();
    return this.modelSwitch.exportSummaryJSON(summary);
  }

  /**
   * Export summary as Markdown
   */
  exportSummaryMarkdown() {
    const summary = this.generateModelSwitchSummary();
    return this.modelSwitch.exportSummaryMarkdown(summary);
  }

  /**
   * Get memory statistics
   */
  getStats() {
    return this.memory.getStats();
  }

  // Cleanup

  /**
   * Cleanup old records
   */
  cleanup(): void {
    this.memory.cleanup();
  }

  /**
   * Close database connections
   */
  close(): void {
    this.memory.close();
  }
}
