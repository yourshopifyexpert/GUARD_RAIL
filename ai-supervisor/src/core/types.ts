/**
 * Core type definitions for the AI Supervisor intervention system
 * @module core/types
 */

/**
 * Alert severity levels for intervention system
 */
export enum AlertSeverity {
  /** Informational alerts - low priority */
  INFO = 'info',
  /** Warning alerts - medium priority, requires attention */
  WARNING = 'warning',
  /** Error alerts - high priority, requires immediate action */
  ERROR = 'error',
  /** Critical alerts - system halt required */
  CRITICAL = 'critical'
}

/**
 * Types of issues that can trigger interventions
 */
export enum IssueType {
  /** AI is deviating from stated goals */
  GOAL_DEVIATION = 'goal_deviation',
  /** AI is reversing previous code changes */
  CODE_REVERSAL = 'code_reversal',
  /** AI is attempting unauthorized operations */
  UNAUTHORIZED_ACTION = 'unauthorized_action',
  /** AI is performing circular edits indicating confusion */
  CIRCULAR_EDIT = 'circular_edit',
  /** AI is suggesting changes outside defined scope */
  SCOPE_VIOLATION = 'scope_violation',
  /** AI response indicates hallucination */
  HALLUCINATION = 'hallucination',
  /** Custom user-defined issue type */
  CUSTOM = 'custom'
}

/**
 * Intervention strategies for different issue types
 */
export enum InterventionStrategy {
  /** Alert user only, don't communicate with AI */
  ALERT_ONLY = 'alert_only',
  /** Send corrective message to AI */
  CORRECTIVE_PROMPT = 'corrective_prompt',
  /** Pause AI execution and wait for user approval */
  PAUSE_AND_CONFIRM = 'pause_and_confirm',
  /** Immediately halt AI execution */
  HALT = 'halt',
  /** Switch to different model with context handoff */
  MODEL_SWITCH = 'model_switch'
}

/**
 * Alert channels for notifications
 */
export enum AlertChannel {
  /** Console/terminal output */
  CONSOLE = 'console',
  /** File system log */
  LOG_FILE = 'log_file',
  /** Event emission for UI integration */
  EVENT = 'event',
  /** System notification */
  NOTIFICATION = 'notification',
  /** Custom channel */
  CUSTOM = 'custom'
}

/**
 * Intervention alert data structure
 */
export interface InterventionAlert {
  /** Unique identifier for this alert */
  id: string;
  /** Timestamp when alert was created */
  timestamp: Date;
  /** Severity level */
  severity: AlertSeverity;
  /** Type of issue detected */
  issueType: IssueType;
  /** Human-readable alert message */
  message: string;
  /** Detailed context about the issue */
  context: {
    /** Related file paths */
    files?: string[];
    /** Code snippets involved */
    codeSnippets?: string[];
    /** Conversation context */
    conversationContext?: string;
    /** Additional metadata */
    metadata?: Record<string, any>;
  };
  /** Suggested intervention strategy */
  suggestedStrategy: InterventionStrategy;
  /** Whether this alert requires user action */
  requiresUserAction: boolean;
  /** Whether AI execution should be paused */
  shouldPause: boolean;
}

/**
 * Corrective prompt for AI communication
 */
export interface CorrectivePrompt {
  /** Unique identifier */
  id: string;
  /** Related alert ID */
  alertId: string;
  /** Issue type being addressed */
  issueType: IssueType;
  /** Message to send to AI agent */
  message: string;
  /** Context to include with the message */
  context: {
    /** What went wrong */
    problem: string;
    /** What should be done instead */
    expectedBehavior: string;
    /** Relevant code or conversation history */
    relevantHistory?: string;
  };
  /** Timestamp when prompt was generated */
  timestamp: Date;
}

/**
 * Intervention protocol configuration
 */
export interface InterventionProtocol {
  /** Issue type this protocol handles */
  issueType: IssueType;
  /** Severity threshold to trigger intervention */
  severityThreshold: AlertSeverity;
  /** Default intervention strategy */
  strategy: InterventionStrategy;
  /** Alert channels to use */
  channels: AlertChannel[];
  /** Whether to auto-generate corrective prompts */
  autoCorrect: boolean;
  /** Whether to pause AI execution */
  pauseExecution: boolean;
  /** Custom handler function (optional) */
  customHandler?: (alert: InterventionAlert) => Promise<void>;
}

/**
 * Model switch context for handoff
 */
export interface ModelSwitchContext {
  /** Unique handoff document ID */
  id: string;
  /** Timestamp of switch */
  timestamp: Date;
  /** Source model identifier */
  sourceModel?: string;
  /** Target model identifier */
  targetModel?: string;
  /** Current project goals */
  goals: string[];
  /** Recent code changes summary */
  recentChanges: {
    /** File path */
    file: string;
    /** Change summary */
    summary: string;
    /** Reason for change */
    reason: string;
    /** Timestamp */
    timestamp: Date;
  }[];
  /** Key decisions made */
  keyDecisions: {
    /** Decision description */
    decision: string;
    /** Rationale */
    rationale: string;
    /** Timestamp */
    timestamp: Date;
  }[];
  /** Active conversation context */
  conversationSummary: string;
  /** Current scope and constraints */
  scope: {
    /** Allowed operations */
    allowed: string[];
    /** Prohibited operations */
    prohibited: string[];
    /** File patterns in scope */
    filePatterns: string[];
  };
  /** Pending tasks */
  pendingTasks: string[];
  /** Important context that must be preserved */
  criticalContext: string;
}

/**
 * Intervention event data
 */
export interface InterventionEvent {
  /** Event type */
  type: 'alert' | 'intervention' | 'pause' | 'resume' | 'halt' | 'model_switch';
  /** Related alert */
  alert?: InterventionAlert;
  /** Related corrective prompt */
  prompt?: CorrectivePrompt;
  /** Model switch context */
  switchContext?: ModelSwitchContext;
  /** Additional event data */
  data?: Record<string, any>;
  /** Timestamp */
  timestamp: Date;
}

/**
 * Configuration for InterventionManager
 */
export interface InterventionConfig {
  /** Enabled alert channels */
  channels: AlertChannel[];
  /** Default intervention protocols by issue type */
  protocols: Map<IssueType, InterventionProtocol>;
  /** Whether to enable auto-correction */
  enableAutoCorrection: boolean;
  /** Whether to enable model switching */
  enableModelSwitch: boolean;
  /** Maximum alerts before auto-halt */
  maxAlertsBeforeHalt?: number;
  /** Alert retention period in days */
  alertRetentionDays?: number;
}
