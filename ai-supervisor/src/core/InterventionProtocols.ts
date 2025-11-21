/**
 * InterventionProtocols - Pre-configured intervention strategies
 *
 * Provides standard protocols for different types of issues that can
 * be detected during AI supervision.
 *
 * @module core/InterventionProtocols
 */

import {
  InterventionProtocol,
  IssueType,
  AlertSeverity,
  InterventionStrategy,
  AlertChannel
} from './types.js';

/**
 * Standard intervention protocols for common issue types
 *
 * These protocols define how the system should respond to different
 * types of detected issues.
 *
 * @example
 * ```typescript
 * import { StandardProtocols } from './InterventionProtocols';
 *
 * const protocols = new Map([
 *   [IssueType.CODE_REVERSAL, StandardProtocols.codeReversal],
 *   [IssueType.GOAL_DEVIATION, StandardProtocols.goalDeviation]
 * ]);
 * ```
 */
export class StandardProtocols {
  /**
   * Protocol for code reversal detection
   *
   * Triggers when AI undoes previous changes without justification.
   * Strategy: Generate corrective prompt to question the reversal.
   */
  static readonly codeReversal: InterventionProtocol = {
    issueType: IssueType.CODE_REVERSAL,
    severityThreshold: AlertSeverity.WARNING,
    strategy: InterventionStrategy.CORRECTIVE_PROMPT,
    channels: [AlertChannel.CONSOLE, AlertChannel.EVENT],
    autoCorrect: true,
    pauseExecution: false
  };

  /**
   * Protocol for goal deviation detection
   *
   * Triggers when AI actions don't align with stated goals.
   * Strategy: Alert and generate corrective prompt.
   */
  static readonly goalDeviation: InterventionProtocol = {
    issueType: IssueType.GOAL_DEVIATION,
    severityThreshold: AlertSeverity.WARNING,
    strategy: InterventionStrategy.CORRECTIVE_PROMPT,
    channels: [AlertChannel.CONSOLE, AlertChannel.EVENT, AlertChannel.NOTIFICATION],
    autoCorrect: true,
    pauseExecution: false
  };

  /**
   * Protocol for unauthorized action detection
   *
   * Triggers when AI attempts operations outside permitted scope.
   * Strategy: Pause execution and require user confirmation.
   */
  static readonly unauthorizedAction: InterventionProtocol = {
    issueType: IssueType.UNAUTHORIZED_ACTION,
    severityThreshold: AlertSeverity.ERROR,
    strategy: InterventionStrategy.PAUSE_AND_CONFIRM,
    channels: [AlertChannel.CONSOLE, AlertChannel.EVENT, AlertChannel.NOTIFICATION],
    autoCorrect: true,
    pauseExecution: true
  };

  /**
   * Protocol for circular edit detection
   *
   * Triggers when AI makes contradictory changes repeatedly.
   * Strategy: Pause and suggest model switch if confusion persists.
   */
  static readonly circularEdit: InterventionProtocol = {
    issueType: IssueType.CIRCULAR_EDIT,
    severityThreshold: AlertSeverity.WARNING,
    strategy: InterventionStrategy.PAUSE_AND_CONFIRM,
    channels: [AlertChannel.CONSOLE, AlertChannel.EVENT],
    autoCorrect: true,
    pauseExecution: true
  };

  /**
   * Protocol for scope violation detection
   *
   * Triggers when AI modifies files outside defined scope.
   * Strategy: Corrective prompt to redirect to approved files.
   */
  static readonly scopeViolation: InterventionProtocol = {
    issueType: IssueType.SCOPE_VIOLATION,
    severityThreshold: AlertSeverity.WARNING,
    strategy: InterventionStrategy.CORRECTIVE_PROMPT,
    channels: [AlertChannel.CONSOLE, AlertChannel.EVENT],
    autoCorrect: true,
    pauseExecution: false
  };

  /**
   * Protocol for hallucination detection
   *
   * Triggers when AI response contains potentially incorrect information.
   * Strategy: Alert and generate corrective prompt.
   */
  static readonly hallucination: InterventionProtocol = {
    issueType: IssueType.HALLUCINATION,
    severityThreshold: AlertSeverity.WARNING,
    strategy: InterventionStrategy.CORRECTIVE_PROMPT,
    channels: [AlertChannel.CONSOLE, AlertChannel.EVENT],
    autoCorrect: true,
    pauseExecution: false
  };

  /**
   * Default protocol for custom issue types
   */
  static readonly custom: InterventionProtocol = {
    issueType: IssueType.CUSTOM,
    severityThreshold: AlertSeverity.INFO,
    strategy: InterventionStrategy.ALERT_ONLY,
    channels: [AlertChannel.CONSOLE, AlertChannel.EVENT],
    autoCorrect: false,
    pauseExecution: false
  };

  /**
   * Gets all standard protocols as a Map
   *
   * @returns Map of issue types to protocols
   */
  static getAll(): Map<IssueType, InterventionProtocol> {
    return new Map([
      [IssueType.CODE_REVERSAL, StandardProtocols.codeReversal],
      [IssueType.GOAL_DEVIATION, StandardProtocols.goalDeviation],
      [IssueType.UNAUTHORIZED_ACTION, StandardProtocols.unauthorizedAction],
      [IssueType.CIRCULAR_EDIT, StandardProtocols.circularEdit],
      [IssueType.SCOPE_VIOLATION, StandardProtocols.scopeViolation],
      [IssueType.HALLUCINATION, StandardProtocols.hallucination],
      [IssueType.CUSTOM, StandardProtocols.custom]
    ]);
  }

  /**
   * Gets a protocol by issue type
   *
   * @param issueType - The issue type to get protocol for
   * @returns The protocol or undefined if not found
   */
  static get(issueType: IssueType): InterventionProtocol | undefined {
    return StandardProtocols.getAll().get(issueType);
  }
}

/**
 * Preset protocol configurations for different use cases
 */
export class ProtocolPresets {
  /**
   * Strict protocols - High security, frequent interventions
   *
   * Use for production environments or critical projects.
   */
  static readonly strict: Map<IssueType, InterventionProtocol> = new Map([
    [IssueType.CODE_REVERSAL, {
      ...StandardProtocols.codeReversal,
      severityThreshold: AlertSeverity.ERROR,
      strategy: InterventionStrategy.PAUSE_AND_CONFIRM,
      pauseExecution: true
    }],
    [IssueType.GOAL_DEVIATION, {
      ...StandardProtocols.goalDeviation,
      severityThreshold: AlertSeverity.ERROR,
      strategy: InterventionStrategy.PAUSE_AND_CONFIRM,
      pauseExecution: true
    }],
    [IssueType.UNAUTHORIZED_ACTION, {
      ...StandardProtocols.unauthorizedAction,
      strategy: InterventionStrategy.HALT
    }],
    [IssueType.CIRCULAR_EDIT, {
      ...StandardProtocols.circularEdit,
      strategy: InterventionStrategy.MODEL_SWITCH
    }],
    [IssueType.SCOPE_VIOLATION, {
      ...StandardProtocols.scopeViolation,
      severityThreshold: AlertSeverity.ERROR,
      strategy: InterventionStrategy.PAUSE_AND_CONFIRM,
      pauseExecution: true
    }],
    [IssueType.HALLUCINATION, {
      ...StandardProtocols.hallucination,
      severityThreshold: AlertSeverity.ERROR,
      strategy: InterventionStrategy.PAUSE_AND_CONFIRM,
      pauseExecution: true
    }]
  ]);

  /**
   * Balanced protocols - Moderate security, helpful interventions
   *
   * Use for most development projects.
   */
  static readonly balanced: Map<IssueType, InterventionProtocol> = StandardProtocols.getAll();

  /**
   * Permissive protocols - Low intervention, alerts only
   *
   * Use for experimentation or trusted AI interactions.
   */
  static readonly permissive: Map<IssueType, InterventionProtocol> = new Map([
    [IssueType.CODE_REVERSAL, {
      ...StandardProtocols.codeReversal,
      severityThreshold: AlertSeverity.INFO,
      strategy: InterventionStrategy.ALERT_ONLY,
      autoCorrect: false,
      pauseExecution: false
    }],
    [IssueType.GOAL_DEVIATION, {
      ...StandardProtocols.goalDeviation,
      severityThreshold: AlertSeverity.INFO,
      strategy: InterventionStrategy.ALERT_ONLY,
      autoCorrect: false,
      pauseExecution: false
    }],
    [IssueType.UNAUTHORIZED_ACTION, {
      ...StandardProtocols.unauthorizedAction,
      severityThreshold: AlertSeverity.WARNING,
      strategy: InterventionStrategy.CORRECTIVE_PROMPT,
      pauseExecution: false
    }],
    [IssueType.CIRCULAR_EDIT, {
      ...StandardProtocols.circularEdit,
      severityThreshold: AlertSeverity.INFO,
      strategy: InterventionStrategy.ALERT_ONLY,
      autoCorrect: false,
      pauseExecution: false
    }],
    [IssueType.SCOPE_VIOLATION, {
      ...StandardProtocols.scopeViolation,
      severityThreshold: AlertSeverity.INFO,
      strategy: InterventionStrategy.ALERT_ONLY,
      autoCorrect: false,
      pauseExecution: false
    }],
    [IssueType.HALLUCINATION, {
      ...StandardProtocols.hallucination,
      severityThreshold: AlertSeverity.INFO,
      strategy: InterventionStrategy.ALERT_ONLY,
      autoCorrect: false,
      pauseExecution: false
    }]
  ]);

  /**
   * Gets a preset by name
   *
   * @param preset - Preset name ('strict', 'balanced', or 'permissive')
   * @returns Protocol map for the preset
   */
  static get(preset: 'strict' | 'balanced' | 'permissive'): Map<IssueType, InterventionProtocol> {
    switch (preset) {
      case 'strict':
        return ProtocolPresets.strict;
      case 'balanced':
        return ProtocolPresets.balanced;
      case 'permissive':
        return ProtocolPresets.permissive;
      default:
        return ProtocolPresets.balanced;
    }
  }
}

/**
 * Builder for creating custom intervention protocols
 *
 * @example
 * ```typescript
 * const protocol = new ProtocolBuilder(IssueType.CODE_REVERSAL)
 *   .withSeverity(AlertSeverity.ERROR)
 *   .withStrategy(InterventionStrategy.PAUSE_AND_CONFIRM)
 *   .withChannels([AlertChannel.CONSOLE, AlertChannel.NOTIFICATION])
 *   .withAutoCorrect(true)
 *   .pauseOnTrigger()
 *   .build();
 * ```
 */
export class ProtocolBuilder {
  private protocol: InterventionProtocol;

  /**
   * Creates a new protocol builder
   *
   * @param issueType - The issue type this protocol handles
   */
  constructor(issueType: IssueType) {
    this.protocol = {
      issueType,
      severityThreshold: AlertSeverity.WARNING,
      strategy: InterventionStrategy.ALERT_ONLY,
      channels: [AlertChannel.CONSOLE],
      autoCorrect: false,
      pauseExecution: false
    };
  }

  /**
   * Sets the severity threshold
   */
  withSeverity(severity: AlertSeverity): this {
    this.protocol.severityThreshold = severity;
    return this;
  }

  /**
   * Sets the intervention strategy
   */
  withStrategy(strategy: InterventionStrategy): this {
    this.protocol.strategy = strategy;
    return this;
  }

  /**
   * Sets the alert channels
   */
  withChannels(channels: AlertChannel[]): this {
    this.protocol.channels = channels;
    return this;
  }

  /**
   * Enables or disables auto-correction
   */
  withAutoCorrect(enabled: boolean): this {
    this.protocol.autoCorrect = enabled;
    return this;
  }

  /**
   * Sets whether to pause execution on trigger
   */
  pauseOnTrigger(pause: boolean = true): this {
    this.protocol.pauseExecution = pause;
    return this;
  }

  /**
   * Sets a custom handler
   */
  withCustomHandler(handler: (alert: any) => Promise<void>): this {
    this.protocol.customHandler = handler;
    return this;
  }

  /**
   * Builds the protocol
   */
  build(): InterventionProtocol {
    return { ...this.protocol };
  }
}
