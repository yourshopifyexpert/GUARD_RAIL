import { EventEmitter } from 'events';
import { SupervisorConfig, Goal, CodeChange, Deviation, Intervention } from '../types';
import { SupervisorDatabase } from '../storage/Database';
import { MemoryEngine } from '../core/MemoryEngine';
import { GoalTracker } from '../core/GoalTracker';
import { DeviationDetector } from '../core/DeviationDetector';
import { InterventionManager } from '../core/InterventionManager';
import { ModelSwitchHandler } from '../core/ModelSwitchHandler';

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
  private config: SupervisorConfig;

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

    this.db = new SupervisorDatabase(this.config.databasePath);
    this.memory = new MemoryEngine(this.db);
    this.goals = new GoalTracker(this.db);
    this.detector = new DeviationDetector(this.db);
    this.intervention = new InterventionManager(this.db, this.config.interventionThreshold);
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
  logUserMessage(content: string, metadata?: Record<string, any>) {
    return this.memory.logConversation('user', content, metadata);
  }

  logAssistantMessage(content: string, metadata?: Record<string, any>) {
    return this.memory.logConversation('assistant', content, metadata);
  }

  logCodeChange(
    filePath: string,
    beforeContent: string,
    afterContent: string,
    reason?: string,
    conversationId?: string
  ): CodeChange {
    const change = this.memory.logCodeChange(filePath, beforeContent, afterContent, reason, conversationId);
    
    // Analyze the change for deviations
    if (this.config.enableCodeReversalDetection || this.config.enableScopeValidation) {
      const activeGoals = this.goals.getActiveGoals();
      this.detector.analyzeChange(change, activeGoals);
    }

    return change;
  }

  getConversationHistory(limit?: number) {
    return this.memory.getConversationHistory(limit);
  }

  getCodeChangeHistory(filePath?: string, limit?: number) {
    return this.memory.getCodeChangeHistory(filePath, limit);
  }

  // Goal Tracker APIs
  createGoal(title: string, description: string, constraints: string[] = [], scope: string[] = []): Goal {
    return this.goals.createGoal(title, description, constraints, scope);
  }

  updateGoal(id: string, updates: Partial<Goal>): Goal | null {
    return this.goals.updateGoal(id, updates);
  }

  getGoal(id: string): Goal | null {
    return this.goals.getGoal(id);
  }

  getActiveGoals(): Goal[] {
    return this.goals.getActiveGoals();
  }

  completeGoal(id: string): Goal | null {
    return this.goals.completeGoal(id);
  }

  deleteGoal(id: string): void {
    this.goals.deleteGoal(id);
  }

  // Deviation Detector APIs
  getDeviations(type?: string, limit?: number): Deviation[] {
    return this.detector.getDeviations(type, limit);
  }

  getCriticalDeviations(): Deviation[] {
    return this.detector.getCriticalDeviations();
  }

  // Intervention Manager APIs
  getInterventions(deviationId?: string): Intervention[] {
    return this.intervention.getInterventions(deviationId);
  }

  // Model Switch Handler APIs
  generateModelSwitchSummary() {
    const activeGoals = this.goals.getActiveGoals();
    return this.modelSwitch.generateSummary(activeGoals);
  }

  exportSummaryJSON() {
    const summary = this.generateModelSwitchSummary();
    return this.modelSwitch.exportSummaryJSON(summary);
  }

  exportSummaryMarkdown() {
    const summary = this.generateModelSwitchSummary();
    return this.modelSwitch.exportSummaryMarkdown(summary);
  }

  // Cleanup
  cleanup(): void {
    this.memory.cleanup(this.config.retentionDays);
  }

  close(): void {
    this.db.close();
  }
}
