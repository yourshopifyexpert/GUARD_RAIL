import { EventEmitter } from 'events';
import { Deviation, Intervention, InterventionType } from '../types';
import { SupervisorDatabase } from '../storage/Database';

/**
 * Alert channels for sending notifications
 */
export enum AlertChannel {
  CONSOLE = 'console',
  LOG = 'log',
  EVENT = 'event',
  NOTIFICATION = 'notification'
}

/**
 * Configuration for intervention manager
 */
export interface InterventionManagerConfig {
  /** Intervention threshold level */
  threshold?: 'low' | 'medium' | 'high';
  /** Enabled alert channels */
  channels?: AlertChannel[];
  /** Maximum alerts before auto-halt */
  maxAlertsBeforeHalt?: number;
  /** Whether to auto-generate corrective prompts */
  autoCorrect?: boolean;
}

/**
 * Manages interventions and alerts for detected deviations
 *
 * Features:
 * - Event-based alert system
 * - Multiple notification channels
 * - Pause/halt mechanisms
 * - Corrective prompt generation for AI agents
 * - Alert severity management
 */
export class InterventionManager extends EventEmitter {
  private db: SupervisorDatabase;
  private interventionThreshold: string;
  private channels: AlertChannel[];
  private maxAlertsBeforeHalt: number;
  private autoCorrect: boolean;
  private isPaused: boolean;
  private isHalted: boolean;
  private alertCount: number;

  constructor(db: SupervisorDatabase, config: InterventionManagerConfig = {}) {
    super();
    this.db = db;
    this.interventionThreshold = config.threshold || 'medium';
    this.channels = config.channels || [AlertChannel.CONSOLE, AlertChannel.EVENT];
    this.maxAlertsBeforeHalt = config.maxAlertsBeforeHalt || 10;
    this.autoCorrect = config.autoCorrect !== false;
    this.isPaused = false;
    this.isHalted = false;
    this.alertCount = 0;
  }

  /**
   * Process a deviation and create appropriate intervention
   *
   * @param deviation - The detected deviation
   * @returns Created intervention or null if threshold not met
   */
  processDeviation(deviation: Deviation): Intervention | null {
    if (!this.shouldIntervene(deviation)) {
      return null;
    }

    const interventionType = this.determineInterventionType(deviation);
    const intervention = this.createIntervention(deviation, interventionType);

    this.db.insertIntervention(intervention);
    this.alertCount++;

    // Notify through configured channels
    this.notifyChannels(intervention, deviation);

    // Emit intervention event
    this.emit('intervention', intervention);

    // Check if we should auto-halt
    if (this.alertCount >= this.maxAlertsBeforeHalt) {
      this.halt('Maximum alert threshold reached');
    }

    // Auto-pause for critical deviations
    if (deviation.severity === 'critical' && interventionType === 'block') {
      this.pause(`Critical deviation detected: ${deviation.message}`);
    }

    return intervention;
  }

  /**
   * Determine if an intervention is needed based on severity
   */
  private shouldIntervene(deviation: Deviation): boolean {
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    const thresholdLevels = { low: 1, medium: 2, high: 3 };

    const deviationLevel = severityLevels[deviation.severity];
    const thresholdLevel = thresholdLevels[this.interventionThreshold as keyof typeof thresholdLevels] || 2;

    return deviationLevel >= thresholdLevel;
  }

  /**
   * Determine the type of intervention based on deviation severity
   */
  private determineInterventionType(deviation: Deviation): InterventionType {
    switch (deviation.severity) {
      case 'critical':
        return 'block';
      case 'high':
        return 'alert';
      case 'medium':
        return 'warning';
      default:
        return 'warning';
    }
  }

  /**
   * Create an intervention for a deviation
   */
  private createIntervention(
    deviation: Deviation,
    type: InterventionType
  ): Intervention {
    const message = this.generateUserMessage(deviation);
    const aiMessage = this.generateAIMessage(deviation);

    return {
      id: this.generateId(),
      deviationId: deviation.id,
      timestamp: new Date(),
      type,
      message,
      userNotified: false,
      aiMessageGenerated: aiMessage
    };
  }

  /**
   * Generate a user-friendly message for the deviation
   */
  private generateUserMessage(deviation: Deviation): string {
    let message = 'ALERT: ' + deviation.description;

    if (deviation.affectedFiles && deviation.affectedFiles.length > 0) {
      message += '\nAffected files: ' + deviation.affectedFiles.join(', ');
    }

    if (deviation.suggestedAction) {
      message += '\nSuggested action: ' + deviation.suggestedAction;
    }

    return message;
  }

  /**
   * Generate a message to communicate with the AI agent
   */
  private generateAIMessage(deviation: Deviation): string {
    let message = 'I detected an issue with your recent changes:\n\n';
    message += deviation.description + '\n\n';

    if (deviation.type === 'code_reversal') {
      message += 'You appear to be reversing previous changes. Please clarify:\n';
      message += '1. Why is the reversal necessary?\n';
      message += '2. Was the original change incorrect?\n';
      message += '3. Should we update our approach?\n';
    } else if (deviation.type === 'scope_violation') {
      message += 'This change appears to be outside the defined project scope.\n';
      message += 'Please confirm if this is intentional and necessary.\n';
    } else if (deviation.type === 'unauthorized_action') {
      message += 'This action may not be allowed based on project constraints.\n';
      message += 'Please explain the necessity of this action.\n';
    }

    if (deviation.suggestedAction) {
      message += '\nSuggested action: ' + deviation.suggestedAction;
    }

    return message;
  }

  /**
   * Mark an intervention as notified
   */
  markAsNotified(interventionId: string): void {
    // In a real implementation, this would update the database
    this.emit('notified', interventionId);
  }

  /**
   * Get all interventions
   */
  getInterventions(deviationId?: string): Intervention[] {
    return this.db.getInterventions(deviationId);
  }

  /**
   * Pause AI execution
   *
   * @param reason - Reason for pausing
   */
  pause(reason: string): void {
    if (this.isPaused) {
      return;
    }

    this.isPaused = true;
    this.emit('pause', { reason, timestamp: new Date() });
    this.notifyConsole('WARNING', `AI execution paused: ${reason}`);
  }

  /**
   * Resume AI execution
   */
  resume(): void {
    if (!this.isPaused || this.isHalted) {
      return;
    }

    this.isPaused = false;
    this.emit('resume', { timestamp: new Date() });
    this.notifyConsole('INFO', 'AI execution resumed');
  }

  /**
   * Halt AI execution completely
   *
   * @param reason - Reason for halting
   */
  halt(reason: string): void {
    if (this.isHalted) {
      return;
    }

    this.isHalted = true;
    this.isPaused = true;
    this.emit('halt', { reason, timestamp: new Date() });
    this.notifyConsole('CRITICAL', `AI execution HALTED: ${reason}`);
  }

  /**
   * Check if execution is currently paused
   */
  get paused(): boolean {
    return this.isPaused;
  }

  /**
   * Check if execution is halted
   */
  get halted(): boolean {
    return this.isHalted;
  }

  /**
   * Get alert count
   */
  get alerts(): number {
    return this.alertCount;
  }

  /**
   * Reset alert count
   */
  resetAlertCount(): void {
    this.alertCount = 0;
  }

  /**
   * Notify through configured channels
   */
  private notifyChannels(intervention: Intervention, deviation: Deviation): void {
    for (const channel of this.channels) {
      try {
        switch (channel) {
          case AlertChannel.CONSOLE:
            this.notifyConsole(intervention.type.toUpperCase(), intervention.message);
            break;

          case AlertChannel.LOG:
            // Would integrate with logging system
            break;

          case AlertChannel.EVENT:
            // Already emitted via this.emit
            break;

          case AlertChannel.NOTIFICATION:
            // Would integrate with system notifications
            this.emit('notification', { intervention, deviation });
            break;
        }
      } catch (error) {
        console.error(`Failed to notify channel ${channel}:`, error);
      }
    }
  }

  /**
   * Send notification to console
   */
  private notifyConsole(level: string, message: string): void {
    const prefix = `[${level}]`;
    console.log(`\n${prefix} ${message}`);
  }

  private generateId(): string {
    return 'int_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}
