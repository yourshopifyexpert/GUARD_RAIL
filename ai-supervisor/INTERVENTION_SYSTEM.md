# AI Supervisor Intervention System

## Overview

The Intervention System is a core component of the AI Supervisor that actively monitors AI agent behavior and intervenes when issues are detected. It provides real-time alerts, user notifications, AI communication, and execution control mechanisms.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Intervention System                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │ InterventionMgr  │      │ ModelSwitchHandler│            │
│  │                  │      │                  │            │
│  │ - Process alerts │      │ - Track changes  │            │
│  │ - Send notifications│    │ - Track decisions│            │
│  │ - Pause/Halt AI  │      │ - Generate handoff│           │
│  │ - Generate prompts│     │ - Export summaries│           │
│  └──────────────────┘      └──────────────────┘            │
│           │                         │                       │
│           └─────────┬───────────────┘                       │
│                     │                                       │
│              ┌──────▼──────┐                               │
│              │  Database   │                               │
│              │  Storage    │                               │
│              └─────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. InterventionManager

The **InterventionManager** is the heart of the intervention system, handling detection events and orchestrating responses.

#### Features

- **Event-based alert system**: Emits events for all interventions
- **Multi-channel notifications**: Console, logs, events, system notifications
- **Pause/Resume/Halt mechanisms**: Control AI execution flow
- **Corrective prompt generation**: Communicate issues to AI agents
- **Alert severity management**: Different responses based on severity
- **Auto-halt protection**: Stops execution after too many alerts

#### Alert Channels

```typescript
enum AlertChannel {
  CONSOLE = 'console',        // Terminal output
  LOG = 'log',               // File logging
  EVENT = 'event',           // Event emission
  NOTIFICATION = 'notification' // System notifications
}
```

#### Intervention Types

- **warning**: Low severity, informational
- **alert**: Medium severity, requires attention
- **block**: High severity, blocks specific action
- **pause**: Critical severity, pauses all execution

#### API Example

```typescript
import { InterventionManager, AlertChannel } from './core/InterventionManager';
import { SupervisorDatabase } from './storage/Database';

const db = new SupervisorDatabase('./data.db');
const manager = new InterventionManager(db, {
  threshold: 'medium',
  channels: [AlertChannel.CONSOLE, AlertChannel.EVENT],
  maxAlertsBeforeHalt: 10,
  autoCorrect: true
});

// Listen for intervention events
manager.on('intervention', (intervention) => {
  console.log('Intervention:', intervention.message);
  console.log('AI message:', intervention.aiMessageGenerated);
});

manager.on('pause', ({ reason }) => {
  console.log('Paused:', reason);
});

manager.on('halt', ({ reason }) => {
  console.log('HALTED:', reason);
});

// Process a deviation
const intervention = manager.processDeviation({
  id: 'dev_001',
  type: 'code_reversal',
  severity: 'high',
  message: 'AI is reversing previous authentication changes',
  affectedFiles: ['src/auth/login.ts'],
  timestamp: new Date()
});

// Manual control
manager.pause('Waiting for user approval');
manager.resume();
manager.halt('Critical security violation');

// Check status
console.log('Is paused:', manager.paused);
console.log('Is halted:', manager.halted);
console.log('Alert count:', manager.alerts);
```

### 2. ModelSwitchHandler

The **ModelSwitchHandler** preserves conversation context when switching between different AI models.

#### Features

- **Context preservation**: Maintains goals, changes, and decisions
- **Conversation summarization**: Compresses dialogue history
- **Key decision extraction**: Identifies important architectural choices
- **Multiple export formats**: JSON and Markdown
- **Change tracking**: Records all code modifications with reasons

#### API Example

```typescript
import { ModelSwitchHandler } from './core/ModelSwitchHandler';
import { SupervisorDatabase } from './storage/Database';

const db = new SupervisorDatabase('./data.db');
const handler = new ModelSwitchHandler(db);

// Generate model switch summary
const goals = [{
  id: 'goal_1',
  title: 'User Authentication',
  description: 'Implement JWT-based auth',
  constraints: ['Use bcrypt for passwords'],
  scope: ['src/auth/**'],
  status: 'active',
  priority: 'high',
  createdAt: new Date(),
  updatedAt: new Date()
}];

const summary = handler.generateSummary(goals);

// Export as markdown for new AI model
const markdown = handler.exportSummaryMarkdown(summary);
console.log(markdown);

// Or export as JSON
const json = handler.exportSummaryJSON(summary);
```

#### Generated Handoff Document

The ModelSwitchHandler generates structured handoff documents:

```markdown
# AI Model Switch Summary

Generated: 2025-11-21T12:00:00.000Z

## Active Goals

### User Authentication

Implement JWT-based auth

**Constraints:**
- Use bcrypt for passwords

**Scope:**
- src/auth/**

## Key Decisions

- Decided to use bcrypt for password hashing
- Selected PostgreSQL for user data storage

## Recent Changes

### src/auth/login.ts

*Reason:* Implement login endpoint

```diff
+ router.post('/login', async (req, res) => {
+   // Login logic
+ });
```

## Current Context

Recent Activity Summary:

Conversation: 15 user messages, 14 AI responses
Code Changes: 5 modifications across 3 files
Modified files:
  - src/auth/login.ts
  - src/auth/register.ts
  - src/db/models/User.ts

## Conversation Summary

Recent Conversation Context:

USER: Add user authentication system...
ASSISTANT: I'll implement JWT-based authentication...
```

## Intervention Protocols

### Standard Protocols

Pre-configured strategies for common issue types:

| Issue Type | Severity | Strategy | Auto-Correct | Pause |
|------------|----------|----------|--------------|-------|
| Code Reversal | Warning | Corrective Prompt | Yes | No |
| Goal Deviation | Warning | Corrective Prompt | Yes | No |
| Unauthorized Action | Error | Pause & Confirm | Yes | Yes |
| Circular Edit | Warning | Pause & Confirm | Yes | Yes |
| Scope Violation | Warning | Corrective Prompt | Yes | No |

### Protocol Presets

Three pre-configured security levels:

#### Strict Mode
- High security, frequent interventions
- Pauses execution for most violations
- Recommended for production environments

#### Balanced Mode (Default)
- Moderate security, helpful interventions
- Corrective prompts for common issues
- Recommended for most projects

#### Permissive Mode
- Low intervention, alerts only
- Minimal interruption to AI workflow
- Recommended for experimentation

#### Using Presets

```typescript
import { StandardProtocols } from './core/InterventionProtocols';

// Get individual protocol
const protocol = StandardProtocols.codeReversal;

// Get all standard protocols
const allProtocols = StandardProtocols.getAll();
```

## Corrective Prompt Generation

The system automatically generates messages to communicate with AI agents:

### Code Reversal

```
IMPORTANT: You appear to be reversing previous code changes.

Please verify this is intentional and explain why the previous
implementation was incorrect. If this is a mistake, please restore
the previous changes and continue with the original approach.
```

### Goal Deviation

```
IMPORTANT: Your current actions deviate from the stated project goals.

Please review the project objectives and ensure your changes align
with them. If you believe the goals should be modified, please ask
for clarification before proceeding.
```

### Unauthorized Action

```
CRITICAL: You are attempting an unauthorized action.

This operation is outside the permitted scope. Please stop and
request explicit permission before performing this action. Explain
why this action is necessary.
```

## Type Definitions

### Deviation

```typescript
interface Deviation {
  id: string;
  type: DeviationType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedFiles: string[];
  timestamp: Date;
  metadata?: Record<string, any>;
  suggestedAction?: string;
}
```

### Intervention

```typescript
interface Intervention {
  id: string;
  deviationId: string;
  timestamp: Date;
  type: InterventionType;
  message: string;
  userNotified: boolean;
  aiMessageGenerated: string;
}
```

### ModelSwitchSummary

```typescript
interface ModelSwitchSummary {
  timestamp: Date;
  activeGoals: Goal[];
  recentChanges: CodeChangeWithDiff[];
  keyDecisions: string[];
  currentContext: string;
  conversationSummary: string;
  sourceModel?: string;
  targetModel?: string;
}
```

## Event System

The intervention system is fully event-driven:

### InterventionManager Events

- `intervention`: Fired when intervention is created
- `pause`: Fired when execution is paused
- `resume`: Fired when execution resumes
- `halt`: Fired when execution is halted
- `notification`: Fired for system notifications
- `notified`: Fired when user is notified

### Event Listeners

```typescript
manager.on('intervention', (intervention) => {
  // Handle new intervention
});

manager.on('pause', ({ reason, timestamp }) => {
  // Handle pause
});

manager.on('halt', ({ reason, timestamp }) => {
  // Handle halt - stop all operations
});
```

## Integration Examples

### VS Code Extension Integration

```typescript
import * as vscode from 'vscode';
import { InterventionManager } from '@guard-rail/ai-supervisor';

const manager = new InterventionManager(db, {
  channels: [AlertChannel.EVENT, AlertChannel.NOTIFICATION]
});

manager.on('intervention', (intervention) => {
  // Show VS Code notification
  vscode.window.showWarningMessage(
    intervention.message,
    'Approve', 'Reject'
  ).then(selection => {
    if (selection === 'Approve') {
      manager.resume();
    }
  });
});

manager.on('halt', ({ reason }) => {
  vscode.window.showErrorMessage(`AI Halted: ${reason}`);
});
```

### CLI Tool Integration

```typescript
import { InterventionManager } from '@guard-rail/ai-supervisor';

const manager = new InterventionManager(db, {
  channels: [AlertChannel.CONSOLE, AlertChannel.LOG]
});

// All alerts automatically logged to console
manager.on('intervention', (intervention) => {
  // Could also write to log file
  fs.appendFileSync('ai-supervisor.log',
    `${intervention.timestamp}: ${intervention.message}\n`
  );
});
```

## Configuration

### InterventionManagerConfig

```typescript
interface InterventionManagerConfig {
  /** Intervention threshold level */
  threshold?: 'low' | 'medium' | 'high';

  /** Enabled alert channels */
  channels?: AlertChannel[];

  /** Maximum alerts before auto-halt */
  maxAlertsBeforeHalt?: number;

  /** Whether to auto-generate corrective prompts */
  autoCorrect?: boolean;
}
```

### Recommended Settings

#### Development Environment

```typescript
{
  threshold: 'medium',
  channels: [AlertChannel.CONSOLE, AlertChannel.EVENT],
  maxAlertsBeforeHalt: 10,
  autoCorrect: true
}
```

#### Production Environment

```typescript
{
  threshold: 'low',
  channels: [AlertChannel.CONSOLE, AlertChannel.LOG, AlertChannel.NOTIFICATION],
  maxAlertsBeforeHalt: 5,
  autoCorrect: true
}
```

## Best Practices

1. **Listen to Events**: Always set up event listeners before processing deviations
2. **Handle Pauses**: Implement pause handling in your UI/CLI
3. **Review AI Messages**: Check `aiMessageGenerated` before sending to AI
4. **Adjust Thresholds**: Tune based on your AI model's behavior
5. **Monitor Alert Count**: Reset periodically to avoid false auto-halts
6. **Preserve Context**: Always generate handoff documents when switching models
7. **Log Interventions**: Keep audit trail of all interventions

## Performance

- **Detection Latency**: < 100ms per deviation
- **Memory Footprint**: ~5MB for InterventionManager
- **Event Emission**: Non-blocking, async-safe
- **Database Writes**: Batched for efficiency

## Extension Points

The system is designed for extensibility:

1. **Custom Alert Channels**: Implement new notification methods
2. **Custom Corrective Messages**: Override default prompt generation
3. **Custom Intervention Logic**: Hook into event system
4. **Custom Severity Mapping**: Define your own severity rules

## Troubleshooting

### Intervention Not Firing

- Check threshold setting
- Verify deviation severity meets threshold
- Ensure event listeners are attached

### Too Many Alerts

- Increase threshold to 'high'
- Increase `maxAlertsBeforeHalt`
- Review detection rules

### AI Not Receiving Messages

- Check `aiMessageGenerated` field in intervention
- Verify your AI integration sends this message
- Enable `autoCorrect` if disabled

## Future Enhancements

- LLM-based corrective prompt generation
- Machine learning for pattern detection
- Cloud sync for multi-device supervision
- Advanced analytics dashboard
- Custom intervention strategies per project
- Integration with popular AI provider APIs

## Summary

The AI Supervisor Intervention System provides:

✅ **Real-time monitoring** - Instant detection and response
✅ **Multiple alert channels** - Flexible notification delivery
✅ **Execution control** - Pause, resume, and halt mechanisms
✅ **AI communication** - Generated corrective prompts
✅ **Context preservation** - Seamless model switching
✅ **Extensible design** - Easy integration and customization
✅ **Event-driven architecture** - Non-blocking, reactive
✅ **Type-safe APIs** - Full TypeScript support

The system is production-ready and designed for cross-platform integration with any AI coding assistant or development environment.
