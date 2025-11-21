# AI Supervisor Core Engine

A cross-platform Node.js library that monitors AI agent behavior, tracks conversation context, detects goal deviations, prevents code reversals, and enables active intervention to keep AI agents on track.

## Overview

The AI Supervisor acts as an intelligent guardrail for AI coding assistants. It provides:

- **Comprehensive Memory** - Stores all AI interactions, code changes, and decisions
- **Goal Tracking** - Monitors project goals and scope to detect when AI strays
- **Deviation Detection** - Catches harmful patterns like code reversals and unauthorized operations
- **Active Intervention** - Alerts users and communicates with AI agents to stop/correct behavior
- **Context Preservation** - Enables seamless model switching and conversation resumption

## Architecture

```
ai-supervisor/
├── src/
│   ├── core/              # Core engine modules
│   │   ├── MemoryEngine.ts        # Conversation & code change logging
│   │   ├── GoalTracker.ts         # Goal/scope management
│   │   ├── DeviationDetector.ts   # Pattern matching & analysis
│   │   ├── InterventionManager.ts # Alert & correction system
│   │   └── ModelSwitchHandler.ts  # Context preservation
│   ├── storage/           # Persistent storage layer
│   │   ├── Database.ts            # SQLite wrapper
│   │   ├── ChangeLog.ts           # Code diff storage
│   │   └── ConversationStore.ts   # Dialogue history
│   ├── analysis/          # Code analysis tools
│   │   ├── CodeDiffer.ts          # Before/after comparison
│   │   ├── ReversalDetector.ts    # Undo pattern detection
│   │   └── ScopeValidator.ts      # Goal alignment checking
│   ├── api/
│   │   └── SupervisorAPI.ts       # Public interface
│   └── index.ts           # Main exports
├── tests/                 # Unit tests
├── examples/              # Usage examples
└── package.json
```

### Key Design Patterns

- **Event-driven architecture** - All detected issues emit events
- **SQLite storage** - Fast, embedded database for conversation and change history
- **Type-safe** - Full TypeScript with Zod validation
- **Cross-platform** - Pure Node.js, no platform-specific dependencies

## Installation

```bash
npm install @guard-rail/ai-supervisor
```

## Quick Start

```typescript
import { SupervisorAPI, createDefaultConfig } from '@guard-rail/ai-supervisor';

// Create supervisor with default configuration
const supervisor = new SupervisorAPI(
  createDefaultConfig('./supervisor.db')
);

// Start a conversation
supervisor.startConversation();

// Log messages
supervisor.logMessage('user', 'Create a new login component');
supervisor.logMessage('assistant', 'I will create a login component with email/password fields...');

// Record code changes
supervisor.recordCodeChange(
  '/path/to/Login.tsx',
  null,  // null = new file
  newFileContent,
  'Creating login component per user request'
);

// Listen for deviations
supervisor.on('deviation:detected', (event) => {
  const deviation = event.data;
  console.log(`⚠️  ${deviation.type}: ${deviation.description}`);
  console.log(`   Suggested action: ${deviation.suggestedAction}`);
});

// Get statistics
const stats = supervisor.getStats();
console.log(`Messages: ${stats.messages}, Changes: ${stats.changes}`);

// Clean up
supervisor.close();
```

## Configuration

### Full Configuration Example

```typescript
import { SupervisorAPI, SupervisorConfig } from '@guard-rail/ai-supervisor';

const config: SupervisorConfig = {
  storage: {
    databasePath: './supervisor.db',
    enableCompression: true,
    retentionDays: 30,      // 0 = forever
    maxDatabaseSizeMB: 100
  },
  detection: {
    enableReversalDetection: true,
    enableScopeValidation: true,
    enableGoalTracking: true,
    circularEditThreshold: 3600000,  // 1 hour in ms
    useLLMAnalysis: false,
    customRules: []
  },
  scope: {
    allowedFiles: ['src/**/*.ts', 'src/**/*.tsx'],
    blockedFiles: ['node_modules/**', '.env'],
    allowedOperations: ['create', 'modify'],
    blockedOperations: ['delete'],
    maxFilesPerAction: 5
  },
  debug: false
};

const supervisor = new SupervisorAPI(config);
```

## Core Features

### 1. Memory System

Track all conversations and code changes:

```typescript
// Start a new conversation
const conversation = supervisor.startConversation({
  modelName: 'claude-3-opus',
  sessionId: 'abc123'
});

// Log messages
supervisor.logMessage('user', 'Add error handling to the API client');
supervisor.logMessage('assistant', 'I will add try-catch blocks...');

// Record code changes
supervisor.recordCodeChange(
  '/src/api/client.ts',
  oldContent,
  newContent,
  'Added error handling with try-catch'
);

// Query history
const fileHistory = supervisor.getFileHistory('/src/api/client.ts');
const recentChanges = supervisor.getRecentChanges(10);
```

### 2. Goal & Scope Management

Define what the AI should accomplish:

```typescript
// Add project goals
const goal = supervisor.addGoal(
  'Implement user authentication',
  'Create login, signup, and password reset flows',
  'high',
  ['auth', 'security'],
  ['Login component works', 'Tests pass', 'Security review complete']
);

// Set project scope
supervisor.setScope({
  allowedFiles: ['src/auth/**/*.ts'],
  blockedFiles: ['src/auth/legacy/**'],
  maxFilesPerAction: 3
});

// Get active goals
const activeGoals = supervisor.getGoals(true);

// Complete a goal
supervisor.completeGoal(goal.id);
```

### 3. Deviation Detection

Automatically detect problematic AI behavior:

```typescript
// Listen for different deviation types
supervisor.on('deviation:detected', (event) => {
  const deviation = event.data;

  switch (deviation.type) {
    case 'code_reversal':
      console.log('AI reversed a previous change!');
      break;
    case 'scope_violation':
      console.log('AI modified a file outside scope!');
      break;
    case 'goal_deviation':
      console.log('AI is working on something off-topic!');
      break;
    case 'circular_edit':
      console.log('AI is editing the same file repeatedly!');
      break;
  }
});
```

#### Deviation Types

- **code_reversal** - AI undoes previous work without justification
- **scope_violation** - AI modifies files outside allowed scope
- **goal_deviation** - AI's actions don't align with stated goals
- **unauthorized_action** - AI performs blocked operations
- **circular_edit** - AI repeatedly edits the same file (indicates confusion)
- **semantic_drift** - AI's changes drift from original requirements

### 4. Intervention System

Respond to detected issues:

```typescript
// Listen for interventions
supervisor.on('intervention:started', (event) => {
  console.log('Intervention triggered for deviation:', event.data.deviationId);
});

supervisor.on('intervention:completed', (event) => {
  const intervention = event.data;
  console.log(`Intervention ${intervention.successful ? 'succeeded' : 'failed'}`);
});

// Manually trigger intervention
await supervisor.triggerIntervention(deviationId);
```

### 5. Model Switching

Preserve context when switching AI models:

```typescript
// Generate handoff summary
const summary = supervisor.generateModelSwitchSummary({
  maxRecentChanges: 10,
  maxKeyDecisions: 5
});

console.log(summary.contextSummary);
console.log('Active goals:', summary.activeGoals);
console.log('Recent changes:', summary.recentChanges);
console.log('Warnings:', summary.warnings);

// Export as formatted text
const handoffText = supervisor.exportModelSwitchSummary();
console.log(handoffText);
```

## Events

The supervisor emits the following events:

| Event | Description | Payload |
|-------|-------------|---------|
| `deviation:detected` | Deviation detected | `{ timestamp, data: Deviation }` |
| `intervention:started` | Intervention started | `{ timestamp, data: Intervention }` |
| `intervention:completed` | Intervention completed | `{ timestamp, data: Intervention }` |
| `goal:added` | Goal added | `{ timestamp, data: Goal }` |
| `goal:updated` | Goal updated | `{ timestamp, data: Goal }` |
| `goal:completed` | Goal completed | `{ timestamp, data: Goal }` |
| `code:changed` | Code change recorded | `{ timestamp, data: CodeChange }` |
| `message:logged` | Message logged | `{ timestamp, data: Message }` |

## Advanced Usage

### Custom Detection Rules

```typescript
import { DetectionRule, DeviationType, DeviationSeverity } from '@guard-rail/ai-supervisor';

const customRule: DetectionRule = {
  id: 'no-console-logs',
  name: 'No Console Logs',
  description: 'Prevent adding console.log statements',
  pattern: 'console\\.log\\(',
  severity: DeviationSeverity.WARNING,
  deviationType: DeviationType.UNAUTHORIZED_ACTION
};

const config: SupervisorConfig = {
  // ... other config
  detection: {
    enableReversalDetection: true,
    enableScopeValidation: true,
    enableGoalTracking: true,
    circularEditThreshold: 3600000,
    useLLMAnalysis: false,
    customRules: [customRule]
  }
};
```

### Direct Module Access

For advanced use cases, you can access individual modules:

```typescript
import {
  MemoryEngine,
  GoalTracker,
  DeviationDetector,
  CodeDiffer,
  ReversalDetector,
  ScopeValidator
} from '@guard-rail/ai-supervisor';

// Use modules independently
const differ = new CodeDiffer();
const similarity = differ.calculateSimilarity(code1, code2);
const diff = differ.generateDiff(before, after, 'file.ts');
```

## Performance

The AI Supervisor is designed for production use:

- **<100ms detection latency** - Real-time monitoring
- **Handles 1000+ files** - Scalable to large projects
- **100,000+ tokens** - Supports long conversations
- **<50MB baseline memory** - Minimal footprint

Database compression and retention policies keep storage efficient.

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Building

```bash
# Compile TypeScript
npm run build

# Watch mode
npm run build:watch
```

## API Reference

See [examples/basic-usage.ts](./examples/basic-usage.ts) for complete API examples.

### SupervisorAPI

Main class for interacting with the supervisor.

#### Constructor

```typescript
constructor(config: SupervisorConfig)
```

#### Methods

**Conversation Management**
- `startConversation(metadata?: Record<string, unknown>): Conversation`
- `logMessage(role: MessageRole, content: string, metadata?: Record<string, unknown>): Message`
- `getCurrentConversation(): Conversation | undefined`
- `getConversation(id: ID): Conversation | undefined`
- `getAllConversations(limit?: number, offset?: number): Conversation[]`

**Code Change Management**
- `recordCodeChange(filePath: string, before: string | null, after: string | null, reason?: string): CodeChange`
- `getFileHistory(filePath: string, limit?: number): CodeChange[]`
- `getRecentChanges(limit?: number): CodeChange[]`

**Goal Management**
- `addGoal(title: string, description: string, priority?: GoalPriority, tags?: string[], criteria?: string[]): Goal`
- `getGoals(activeOnly?: boolean): Goal[]`
- `updateGoal(id: ID, updates: Partial<Goal>): Goal | undefined`
- `completeGoal(id: ID): Goal | undefined`
- `deleteGoal(id: ID): void`

**Scope Management**
- `setScope(scope: Scope): void`
- `getScope(): Scope | null`
- `updateScope(updates: Partial<Scope>): void`

**Deviation & Intervention**
- `getDeviations(limit?: number): Deviation[]`
- `getInterventions(limit?: number): Intervention[]`
- `triggerIntervention(deviationId: ID): Promise<Intervention>`

**Model Switching**
- `generateModelSwitchSummary(options?: object): ModelSwitchSummary`
- `exportModelSwitchSummary(options?: object): string`

**Utilities**
- `getStats(): object`
- `cleanup(): void`
- `getConfig(): SupervisorConfig`
- `close(): void`

## License

MIT

## Contributing

This is a foundational library for the Guard Rail project. Contributions are welcome!

## Roadmap

- [ ] LLM-based semantic analysis for complex deviations
- [ ] Plugin system for custom detection strategies
- [ ] Cloud sync (premium tier)
- [ ] Advanced analytics and reporting
- [ ] Multi-project support
- [ ] Real-time collaboration features
