/**
 * Type definitions for webview communication and data structures
 */

// VS Code API type that's available in webview context
export interface VSCodeAPI {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
}

// Message types for extension <-> webview communication
export enum MessageType {
  // Activity Monitor
  ACTIVITY_UPDATE = 'activityUpdate',
  REQUEST_ACTIVITY_HISTORY = 'requestActivityHistory',
  ACTIVITY_HISTORY_RESPONSE = 'activityHistoryResponse',
  FILTER_ACTIVITY = 'filterActivity',

  // Goal Manager
  GOALS_UPDATE = 'goalsUpdate',
  ADD_GOAL = 'addGoal',
  UPDATE_GOAL = 'updateGoal',
  DELETE_GOAL = 'deleteGoal',
  REQUEST_GOALS = 'requestGoals',
  GOALS_RESPONSE = 'goalsResponse',

  // Change Inspector
  CHANGES_UPDATE = 'changesUpdate',
  REQUEST_CHANGE_DETAIL = 'requestChangeDetail',
  CHANGE_DETAIL_RESPONSE = 'changeDetailResponse',
  APPROVE_CHANGE = 'approveChange',
  REJECT_CHANGE = 'rejectChange',

  // Alerts
  ALERT_TRIGGERED = 'alertTriggered',
  DISMISS_ALERT = 'dismissAlert',

  // Theme
  THEME_CHANGED = 'themeChanged',

  // Premium
  PREMIUM_STATUS_UPDATE = 'premiumStatusUpdate'
}

export interface Message {
  type: MessageType;
  payload?: any;
}

// Activity Monitor Types
export enum ActivityStatus {
  ON_TRACK = 'on_track',
  MINOR_DEVIATION = 'minor_deviation',
  CRITICAL_ALERT = 'critical_alert'
}

export interface ActivityItem {
  id: string;
  timestamp: number;
  type: 'file_change' | 'suggestion' | 'conversation' | 'alert';
  status: ActivityStatus;
  title: string;
  description: string;
  filePath?: string;
  changes?: number;
  metadata?: Record<string, any>;
}

export interface ActivityFilter {
  timeRange?: { start: number; end: number };
  status?: ActivityStatus[];
  filePattern?: string;
  type?: ActivityItem['type'][];
}

// Goal Manager Types
export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused'
}

export interface ProjectGoal {
  id: string;
  title: string;
  description: string;
  status: GoalStatus;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  updatedAt: number;
  alignment?: number; // 0-100, how well AI is aligned with this goal
  tags?: string[];
  template?: string;
}

export interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  defaultPriority: 'low' | 'medium' | 'high';
  suggestedTags: string[];
}

// Change Inspector Types
export interface CodeChange {
  id: string;
  timestamp: number;
  filePath: string;
  status: 'pending' | 'approved' | 'rejected';
  changeType: 'added' | 'modified' | 'deleted';
  linesAdded: number;
  linesRemoved: number;
  diff: DiffHunk[];
  conversationContext?: string;
  aiProvider?: string;
  isReversal?: boolean;
  contradicts?: string[]; // IDs of changes this contradicts
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  content: string;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

// Alert Types
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}

export interface Alert {
  id: string;
  timestamp: number;
  severity: AlertSeverity;
  title: string;
  message: string;
  actions?: AlertAction[];
  relatedChanges?: string[];
  dismissed?: boolean;
}

export interface AlertAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  command?: string;
}

// Theme Types
export interface ThemeColors {
  background: string;
  foreground: string;
  border: string;
  buttonBackground: string;
  buttonForeground: string;
  buttonHoverBackground: string;
  inputBackground: string;
  inputForeground: string;
  inputBorder: string;
  statusGreen: string;
  statusYellow: string;
  statusRed: string;
  listHoverBackground: string;
  listActiveBackground: string;
  editorBackground: string;
  diffAddedBackground: string;
  diffRemovedBackground: string;
}

// Premium Types
export interface PremiumStatus {
  isActive: boolean;
  features: string[];
  expiresAt?: number;
  tier?: 'free' | 'premium' | 'team';
}
