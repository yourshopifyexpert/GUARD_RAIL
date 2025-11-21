import { EventEmitter } from 'events';

/**
 * Represents a code change with before/after content
 */
export interface CodeChange {
  /** File path (absolute or relative to project root) */
  filePath: string;
  /** Original content before change */
  before: string;
  /** New content after change */
  after: string;
  /** Timestamp when change was made */
  timestamp: Date;
  /** Reason for the change (from AI context) */
  reason?: string;
  /** Associated conversation turn ID */
  conversationId?: string;
}

/**
 * Represents a detected deviation from expected behavior
 */
export interface Deviation {
  /** Unique identifier for this deviation */
  id: string;
  /** Type of deviation detected */
  type: DeviationType;
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Human-readable description */
  message: string;
  /** File(s) involved */
  affectedFiles: string[];
  /** Timestamp of detection */
  timestamp: Date;
  /** Additional context data */
  metadata?: Record<string, any>;
  /** Suggested corrective action */
  suggestedAction?: string;
}

/**
 * Types of deviations the system can detect
 */
export enum DeviationType {
  CODE_REVERSAL = 'code_reversal',
  GOAL_DEVIATION = 'goal_deviation',
  SCOPE_VIOLATION = 'scope_violation',
  UNAUTHORIZED_ACTION = 'unauthorized_action',
  CIRCULAR_EDIT = 'circular_edit',
  SEMANTIC_DRIFT = 'semantic_drift',
  PATTERN_VIOLATION = 'pattern_violation',
}

/**
 * Project goals and scope definition
 */
export interface ProjectScope {
  /** Project goals (what AI should accomplish) */
  goals: string[];
  /** Files/directories AI is allowed to modify */
  allowedPaths?: string[];
  /** Files/directories AI should not modify */
  blockedPaths?: string[];
  /** Operations AI is not allowed to perform */
  prohibitedOperations?: string[];
  /** Architectural constraints */
  constraints?: string[];
  /** Custom metadata */
  metadata?: Record<string, any>;
}

/**
 * Diff information between two code versions
 */
export interface DiffResult {
  /** Array of hunks (change sections) */
  hunks: DiffHunk[];
  /** Total lines added */
  addedLines: number;
  /** Total lines removed */
  removedLines: number;
  /** Total lines unchanged */
  unchangedLines: number;
  /** Similarity score (0-1) */
  similarity: number;
}

/**
 * A section of changes in a diff
 */
export interface DiffHunk {
  /** Starting line in old file */
  oldStart: number;
  /** Number of lines in old file */
  oldLines: number;
  /** Starting line in new file */
  newStart: number;
  /** Number of lines in new file */
  newLines: number;
  /** Lines added */
  additions: string[];
  /** Lines removed */
  deletions: string[];
  /** Context lines */
  context: string[];
}

/**
 * Configuration for reversal detection
 */
export interface ReversalDetectionConfig {
  /** Minimum similarity threshold (0-1) to consider as reversal */
  similarityThreshold: number;
  /** Time window (ms) to look back for reversals */
  timeWindowMs: number;
  /** Minimum number of lines changed to consider significant */
  minSignificantLines: number;
  /** Whether to detect partial reversals */
  detectPartialReversals: boolean;
}

/**
 * Configuration for scope validation
 */
export interface ScopeValidationConfig {
  /** Strictness level for validation */
  strictness: 'relaxed' | 'normal' | 'strict';
  /** Whether to use semantic analysis (slower but more accurate) */
  useSemanticAnalysis: boolean;
  /** Custom path matchers */
  customPathMatchers?: PathMatcher[];
}

/**
 * Custom path matching rule
 */
export interface PathMatcher {
  /** Pattern to match (glob or regex) */
  pattern: string;
  /** Whether pattern is regex */
  isRegex: boolean;
  /** Whether this path is allowed or blocked */
  allowed: boolean;
  /** Reason for this rule */
  reason?: string;
}

/**
 * Detection rule for pattern-based analysis
 */
export interface DetectionRule {
  /** Unique rule ID */
  id: string;
  /** Rule name */
  name: string;
  /** Rule description */
  description: string;
  /** Rule type */
  type: DeviationType;
  /** Severity if rule is violated */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Matcher function */
  matcher: (change: CodeChange, context: DetectionContext) => boolean;
  /** Message generator */
  messageGenerator?: (change: CodeChange, context: DetectionContext) => string;
}

/**
 * Context passed to detection rules
 */
export interface DetectionContext {
  /** Previous code changes */
  history: CodeChange[];
  /** Current project scope */
  scope?: ProjectScope;
  /** Custom context data */
  metadata?: Record<string, any>;
}

/**
 * Configuration for the main deviation detector
 */
export interface DeviationDetectorConfig {
  /** Reversal detection config */
  reversalDetection: ReversalDetectionConfig;
  /** Scope validation config */
  scopeValidation: ScopeValidationConfig;
  /** Custom detection rules */
  customRules?: DetectionRule[];
  /** Maximum processing time per detection (ms) */
  maxProcessingTimeMs: number;
  /** Whether to emit events for all detections */
  emitEvents: boolean;
}

/**
 * Events emitted by the supervision system
 */
export interface SupervisorEvents {
  deviation: (deviation: Deviation) => void;
  codeChange: (change: CodeChange) => void;
  scopeUpdate: (scope: ProjectScope) => void;
  error: (error: Error) => void;
}

/**
 * Base interface for detection strategies
 */
export interface DetectionStrategy {
  /** Strategy name */
  readonly name: string;
  /** Detect deviations in a code change */
  detect(change: CodeChange, context: DetectionContext): Promise<Deviation[]>;
}

/**
 * Intervention types for different levels of action
 */
export type InterventionType = 'warning' | 'alert' | 'block' | 'pause';

/**
 * Represents an intervention taken in response to a deviation
 */
export interface Intervention {
  /** Unique identifier */
  id: string;
  /** Related deviation ID */
  deviationId: string;
  /** Timestamp when intervention was created */
  timestamp: Date;
  /** Type of intervention */
  type: InterventionType;
  /** User-facing message */
  message: string;
  /** Whether user has been notified */
  userNotified: boolean;
  /** AI-facing message (for communication with AI agent) */
  aiMessageGenerated: string;
}

/**
 * Conversation entry for tracking dialogue
 */
export interface ConversationEntry {
  /** Unique identifier */
  id: string;
  /** Timestamp */
  timestamp: Date;
  /** Role (user or assistant) */
  role: 'user' | 'assistant';
  /** Message content */
  content: string;
  /** Optional conversation metadata */
  metadata?: Record<string, any>;
}

/**
 * Project goal definition
 */
export interface Goal {
  /** Unique identifier */
  id: string;
  /** Goal title */
  title: string;
  /** Detailed description */
  description: string;
  /** Constraints */
  constraints: string[];
  /** Scope */
  scope: string[];
  /** Goal status */
  status: 'active' | 'completed' | 'deferred' | 'cancelled';
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** Timestamp when goal was created */
  createdAt: Date;
  /** Timestamp when goal was last updated */
  updatedAt: Date;
}

/**
 * Code change with diff information for model switching
 */
export interface CodeChangeWithDiff extends CodeChange {
  /** Diff output */
  diff: string;
}

/**
 * Model switch summary for context preservation
 */
export interface ModelSwitchSummary {
  /** Timestamp of summary generation */
  timestamp: Date;
  /** Active project goals */
  activeGoals: Goal[];
  /** Recent code changes */
  recentChanges: CodeChangeWithDiff[];
  /** Key decisions extracted from conversations */
  keyDecisions: string[];
  /** Current context summary */
  currentContext: string;
  /** Conversation summary */
  conversationSummary: string;
  /** Source model (optional) */
  sourceModel?: string;
  /** Target model (optional) */
  targetModel?: string;
}
