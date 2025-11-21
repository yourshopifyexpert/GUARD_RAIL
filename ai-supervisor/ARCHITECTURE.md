# AI Supervisor - Architecture Overview

## System Architecture

The AI Supervisor is built as a layered, event-driven system with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     SupervisorAPI                           │
│                  (Public Interface)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬──────────────┐
        │            │            │              │
┌───────▼──────┐ ┌──▼──────┐ ┌──▼──────────┐ ┌─▼──────────┐
│MemoryEngine  │ │GoalTrack│ │Deviation    │ │Intervention│
│              │ │er       │ │Detector     │ │Manager     │
└──────┬───────┘ └────┬────┘ └──────┬──────┘ └─────┬──────┘
       │              │              │              │
       │         ┌────▼──────────────▼──────┐       │
       │         │  ModelSwitchHandler      │       │
       │         └──────────────────────────┘       │
       │                                            │
┌──────▼────────────────────────────────────────────▼──────┐
│              Storage Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Database     │  │ ChangeLog    │  │Conversation  │   │
│  │ (SQLite)     │  │              │  │Store         │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└───────────────────────────────────────────────────────────┘
       │
┌──────▼────────────────────────────────────────────────────┐
│              Analysis Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ CodeDiffer   │  │ Reversal     │  │Scope         │   │
│  │              │  │ Detector     │  │Validator     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└───────────────────────────────────────────────────────────┘
```

## Core Modules

### 1. Memory Engine (`src/core/MemoryEngine.ts`)

**Purpose**: Tracks all AI interactions and code changes

**Key Responsibilities**:
- Log conversation messages (user, assistant, system)
- Record code changes with diffs
- Link changes to conversations
- Query conversation and change history
- Emit events for logged data

**Key Methods**:
```typescript
startConversation(metadata?: object): Conversation
logMessage(role: MessageRole, content: string): Message
recordCodeChange(filePath: string, before: string | null, after: string | null, reason?: string): CodeChange
getFileHistory(filePath: string): CodeChange[]
getRecentChanges(limit: number): CodeChange[]
```

**Events Emitted**:
- `message:logged` - When a message is logged
- `code:changed` - When code changes are recorded

### 2. Goal Tracker (`src/core/GoalTracker.ts`)

**Purpose**: Manages project goals and scope

**Key Responsibilities**:
- Add, update, complete, and delete goals
- Track goal priority and status
- Define project scope (allowed/blocked files, operations)
- Support goal criteria and tags
- Emit goal-related events

**Key Methods**:
```typescript
addGoal(title: string, description: string, priority: GoalPriority): Goal
getActiveGoals(): Goal[]
completeGoal(goalId: ID): Goal
setScope(scope: Scope): void
getScope(): Scope | null
```

**Events Emitted**:
- `goal:added` - When a goal is created
- `goal:updated` - When a goal is modified
- `goal:completed` - When a goal is marked complete

### 3. Deviation Detector (`src/core/DeviationDetector.ts`)

**Purpose**: Detects when AI behavior deviates from expected patterns

**Key Responsibilities**:
- Analyze code changes for deviations
- Check for code reversals
- Validate against scope constraints
- Detect circular edits
- Check goal alignment
- Emit deviation events

**Detection Types**:
- **CODE_REVERSAL** - AI undoes previous work
- **SCOPE_VIOLATION** - AI modifies files outside allowed scope
- **GOAL_DEVIATION** - AI's actions don't align with goals
- **UNAUTHORIZED_ACTION** - AI performs blocked operations
- **CIRCULAR_EDIT** - AI repeatedly edits same file
- **SEMANTIC_DRIFT** - AI drifts from requirements

**Key Methods**:
```typescript
analyzeChange(change: CodeChange): void
getAllDeviations(limit: number): Deviation[]
```

**Events Emitted**:
- `deviation:detected` - When a deviation is found

### 4. Intervention Manager (`src/core/InterventionManager.ts`)

**Purpose**: Responds to detected deviations

**Key Responsibilities**:
- Create interventions for deviations
- Track intervention history
- Generate user alerts
- Generate AI correction messages
- Store intervention outcomes

**Intervention Actions**:
- `ALERT_USER` - Notify the user
- `NOTIFY_AI` - Send message to AI agent
- `BLOCK_ACTION` - Prevent the action
- `REQUEST_APPROVAL` - Ask for user confirmation
- `AUTO_CORRECT` - Automatically fix the issue

**Key Methods**:
```typescript
intervene(deviationId: ID): Promise<Intervention>
getAllInterventions(limit: number): Intervention[]
```

**Events Emitted**:
- `intervention:started` - When intervention begins
- `intervention:completed` - When intervention finishes

### 5. Model Switch Handler (`src/core/ModelSwitchHandler.ts`)

**Purpose**: Preserves context when switching AI models

**Key Responsibilities**:
- Generate handoff summaries
- Export active goals
- Summarize recent changes
- Extract key decisions
- Format for different AI models

**Key Methods**:
```typescript
generateSummary(options?: object): ModelSwitchSummary
exportAsText(options?: object): string
```

## Storage Layer

### Database (`src/storage/Database.ts`)

**Purpose**: SQLite wrapper with schema management

**Key Features**:
- Automatic schema initialization
- Transaction support
- Type-safe queries
- Database statistics
- Cleanup/retention policies

**Tables**:
- `conversations` - Conversation metadata
- `messages` - All messages with compression support
- `code_changes` - Code change history with diffs
- `goals` - Project goals and criteria
- `deviations` - Detected deviations
- `interventions` - Intervention records

### ConversationStore (`src/storage/ConversationStore.ts`)

**Purpose**: Manages conversation and message persistence

**Key Features**:
- Message compression for large content (>1KB)
- Pagination support
- Conversation statistics
- Message search

### ChangeLog (`src/storage/ChangeLog.ts`)

**Purpose**: Stores code change history

**Key Features**:
- Diff compression for large changes (>1KB)
- File history tracking
- Reversal detection queries
- Time-range queries
- Conversation-linked changes

## Analysis Layer

### CodeDiffer (`src/analysis/CodeDiffer.ts`)

**Purpose**: Code comparison and diff generation

**Key Features**:
- Generate unified diffs
- Calculate similarity scores
- Parse diffs into added/removed lines
- Detect change types (create, modify, delete)
- Check for reversals

### ReversalDetector (`src/analysis/ReversalDetector.ts`)

**Purpose**: Detect code reversals and circular edits

**Key Features**:
- Exact reversal detection
- Partial reversal detection (>90% similarity)
- Circular edit detection (A→B→A patterns)
- Configurable thresholds
- Time window filtering

### ScopeValidator (`src/analysis/ScopeValidator.ts`)

**Purpose**: Validate changes against project scope

**Key Features**:
- File path validation (glob patterns)
- Operation validation
- Batch change validation
- Goal alignment checking
- Custom constraint checking

## Public API

### SupervisorAPI (`src/api/SupervisorAPI.ts`)

**Purpose**: Main interface for external integrations

**Key Features**:
- Unified API for all modules
- Event forwarding
- Configuration validation
- Automatic deviation detection on code changes
- Clean resource management

**Example Usage**:
```typescript
import { SupervisorAPI, createDefaultConfig } from '@guard-rail/ai-supervisor';

const supervisor = new SupervisorAPI(
  createDefaultConfig('./supervisor.db')
);

// Start tracking
supervisor.startConversation();
supervisor.logMessage('user', 'Create a login component');

// Record changes
supervisor.recordCodeChange(
  '/src/Login.tsx',
  null,
  newContent,
  'Creating login component'
);

// Listen for issues
supervisor.on('deviation:detected', (event) => {
  console.log('Issue detected:', event.data);
});

// Clean up
supervisor.close();
```

## Data Flow

### Recording a Code Change

```
1. Extension calls SupervisorAPI.recordCodeChange()
2. SupervisorAPI forwards to MemoryEngine
3. MemoryEngine:
   - Generates diff using CodeDiffer
   - Stores in ChangeLog
   - Emits 'code:changed' event
4. SupervisorAPI triggers DeviationDetector
5. DeviationDetector:
   - Checks ReversalDetector for reversals
   - Validates with ScopeValidator
   - Checks goal alignment
   - Emits 'deviation:detected' if issues found
6. InterventionManager automatically responds
7. Events bubble up to extension
```

### Detecting a Deviation

```
1. DeviationDetector.analyzeChange(change)
2. Get relevant history from ChangeLog
3. Get active goals from GoalTracker
4. Run analysis:
   - ReversalDetector.detectReversals()
   - ScopeValidator.validateScope()
   - ScopeValidator.validateAgainstGoals()
5. Create Deviation records
6. Store in Database
7. Emit 'deviation:detected' events
8. InterventionManager.intervene() automatically called
```

## Event System

The supervisor uses EventEmitter3 for high-performance event handling:

```typescript
// All events follow this pattern
{
  timestamp: string;  // ISO 8601
  data: T;           // Event-specific payload
}
```

**Event Types**:
- `deviation:detected`
- `intervention:started`
- `intervention:completed`
- `goal:added`
- `goal:updated`
- `goal:completed`
- `code:changed`
- `message:logged`

## Type System

All types are defined in `src/types.ts` with Zod schemas for runtime validation:

**Core Types**:
- `Message`, `MessageRole`, `Conversation`
- `CodeChange`, `ChangeType`
- `Goal`, `GoalPriority`, `GoalStatus`, `Scope`
- `Deviation`, `DeviationType`, `DeviationSeverity`
- `Intervention`, `InterventionAction`
- `ModelSwitchSummary`
- `SupervisorConfig`

## Configuration

### Default Configuration

```typescript
{
  storage: {
    databasePath: './supervisor.db',
    enableCompression: true,
    retentionDays: 30,
    maxDatabaseSizeMB: 100
  },
  detection: {
    enableReversalDetection: true,
    enableScopeValidation: true,
    enableGoalTracking: true,
    circularEditThreshold: 3600000,  // 1 hour
    useLLMAnalysis: false
  },
  debug: false
}
```

### Customization Points

1. **Custom Detection Rules**: Add pattern-based rules
2. **Event Handlers**: Subscribe to all events
3. **Scope Patterns**: Define custom file/operation restrictions
4. **Retention Policies**: Configure data cleanup
5. **Intervention Thresholds**: Control when to alert

## Performance Characteristics

- **Database**: SQLite with WAL mode for concurrency
- **Compression**: Automatic for content >1KB
- **Indexing**: Strategic indexes on frequently queried fields
- **Memory**: <50MB baseline, scales with conversation size
- **Latency**: <100ms for deviation detection
- **Scalability**: Handles 1000+ files, 100k+ tokens

## Extension Points

For advanced use cases:

1. **Custom Deviation Detectors**: Implement `DetectionStrategy`
2. **Custom Intervention Actions**: Extend `InterventionAction`
3. **Plugin System**: Direct access to individual modules
4. **LLM Integration**: Optional semantic analysis (future)

## Testing Strategy

### Unit Tests (`tests/unit/`)

- Individual module testing
- Mock database for isolation
- Edge case coverage
- Performance benchmarks

### Integration Tests (`tests/integration/`)

- End-to-end workflows
- Multi-module interactions
- Real database operations
- Event flow validation

### Fixtures (`tests/fixtures/`)

- Sample code for testing
- Mock conversations
- Test data generators

## Development Workflow

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Watch mode
npm run build:watch
npm run test:watch

# Coverage report
npm run test:coverage
```

## Next Steps

1. **VS Code Extension** - Integrate with VS Code API
2. **LLM Analysis** - Add semantic deviation detection
3. **Plugin System** - Allow custom detectors
4. **Cloud Sync** - Optional backup/sync (premium)
5. **Analytics Dashboard** - Visualize patterns over time
