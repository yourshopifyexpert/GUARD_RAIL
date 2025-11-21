# VS Code AI Supervisor - Integration Layer Documentation

## Overview

The VS Code AI Supervisor extension integrates with AI coding assistants through a multi-layered approach that combines file watching, AI tool detection, and direct API interception where available.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     VS Code Extension                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ FileWatcher  │  │ AIDetector   │  │InterceptLayer│          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┴──────────────────┘                   │
│                            │                                      │
│                   ┌────────▼────────┐                            │
│                   │ SupervisorBridge│                            │
│                   └────────┬────────┘                            │
│                            │                                      │
│                   ┌────────▼────────┐                            │
│                   │  AlertManager   │                            │
│                   └─────────────────┘                            │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         InterventionController                            │  │
│  │  • Pause/Resume    • Rollback    • Corrective Prompts   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Core Supervisor   │
                    │      Engine        │
                    └────────────────────┘
```

## Integration Components

### 1. FileWatcher (`src/integration/FileWatcher.ts`)

**Purpose**: Monitor workspace file changes using VS Code's FileSystemWatcher API.

**Features**:
- Real-time monitoring of file create/change/delete events
- Detection of rapid changes (likely AI-generated)
- Configurable exclude patterns
- Debouncing to avoid excessive notifications
- Change buffer for temporal analysis

**Usage**:
```typescript
const fileWatcher = new FileWatcher(context);
fileWatcher.onDidChangeFiles((changes) => {
  // Handle file changes
});
```

**Configuration**:
- `aiSupervisor.fileWatcher.excludePatterns` - File patterns to exclude
- `aiSupervisor.fileWatcher.rapidChangeThreshold` - Milliseconds for "rapid" detection

### 2. AIDetector (`src/integration/AIDetector.ts`)

**Purpose**: Detect which AI coding tools are installed and active in VS Code.

**Supported AI Tools**:
- ✅ GitHub Copilot (`github.copilot`, `github.copilot-chat`)
- ✅ Cursor (`cursor.cursor-vscode`)
- ✅ Continue (`continue.continue`)
- ✅ Cody (`sourcegraph.cody-ai`)
- ✅ Tabnine (`tabnine.tabnine-vscode`)
- ✅ Amazon CodeWhisperer (`amazonwebservices.aws-toolkit-vscode`)
- ✅ Anthropic Claude (via extension detection)

**Features**:
- Automatic detection of installed AI extensions
- Monitoring of extension activation status
- Heuristic detection for unknown AI tools
- Capability detection (completion, chat, inline, refactoring)

**Usage**:
```typescript
const detector = new AIDetector();
const tools = await detector.scan();
const primaryTool = detector.getPrimaryTool();
```

### 3. InterceptLayer (`src/integration/InterceptLayer.ts`)

**Purpose**: Hook into AI interactions via extension APIs where available.

**Integration Methods**:

#### GitHub Copilot
- ⚠️ No public API available
- Fallback: Text document change detection
- Detection: Multi-line insertions, code patterns

#### Continue
- ✅ API available via exports
- Hook: `onAcceptRejectDiff` event
- Captures: Prompt, diff, conversation ID

#### Cody
- ⚠️ Limited API
- Fallback: Text document change detection
- Detection: Rapid code insertions

**AI-Generated Change Detection**:
- Multi-line changes (> 2 lines)
- Complete code blocks (functions, classes)
- Proper indentation patterns
- Large single-line insertions (> 30 chars)

**Usage**:
```typescript
const interceptLayer = new InterceptLayer();
await interceptLayer.initialize(aiToolInfo);
interceptLayer.onDidInterceptInteraction((interaction) => {
  // Handle AI interaction
});
```

### 4. SupervisorBridge (`src/integration/SupervisorBridge.ts`)

**Purpose**: Bridge VS Code components with the core AI Supervisor engine.

**Responsibilities**:
- Route file changes to supervisor engine
- Connect AI interactions to deviation detector
- Synchronize goals and context
- Emit alerts based on supervisor events
- Coordinate component lifecycle

**Event Flow**:
```
FileWatcher → SupervisorBridge → Core Engine → Deviation Detected
                                                        ↓
                                                   AlertManager
                                                        ↓
                                                  Toast Notification
```

**Usage**:
```typescript
const bridge = new SupervisorBridge(context);
await bridge.initialize();
bridge.onDidChangeState((state) => {
  // Handle state changes
});
```

### 5. AlertManager (`src/notifications/AlertManager.ts`)

**Purpose**: Display toast notifications with action buttons for user intervention.

**Alert Types**:
- 🔴 **Goal Deviation**: AI strayed from defined goals
- 🔴 **Code Reversal**: AI undid previous work
- 🔴 **Unauthorized Action**: Dangerous operations
- 🔵 **Rapid Changes**: High-frequency edits detected
- ⚠️ **Scope Violation**: Outside defined boundaries

**Alert Actions**:
- **Stop AI**: Pause monitoring immediately
- **Allow Once**: Mark deviation as acceptable
- **Update Goals**: Open goal manager
- **View Changes**: Open change inspector
- **Rollback**: Undo recent changes

**Usage**:
```typescript
const alertManager = new AlertManager();
await alertManager.showGoalDeviationAlert(
  "AI modified files outside project scope",
  detailsText,
  metadata
);
```

**Configuration**:
- `aiSupervisor.alerts.showNotifications` - Enable/disable toasts
- `aiSupervisor.alerts.severity` - Minimum severity level
- `aiSupervisor.alerts.playSound` - Audio alerts

### 6. InterventionController (`src/commands/InterventionController.ts`)

**Purpose**: Handle user intervention commands and controls.

**Commands**:

#### Monitoring Control
- `aiSupervisor.pauseMonitoring` - Pause AI monitoring
- `aiSupervisor.resumeMonitoring` - Resume monitoring
- `aiSupervisor.toggleMonitoring` - Toggle state
- `aiSupervisor.emergencyStop` - Immediate pause + rollback option

#### Change Management
- `aiSupervisor.rollbackChanges` - Rollback files to snapshots
- `aiSupervisor.rollbackFile` - Rollback specific file
- `aiSupervisor.sendCorrectivePrompt` - Send prompt to AI

#### Deviation Handling
- `aiSupervisor.allowDeviation` - Mark false positive
- Snapshots are automatically created before AI modifications

**Usage**:
```typescript
const controller = new InterventionController(context);
const commands = controller.registerCommands();
context.subscriptions.push(...commands);
```

## Integration Approach

### Strategy 1: Direct API Integration (Preferred)

When AI tools expose public APIs:
1. Activate the AI extension
2. Access exported API via `extension.exports`
3. Subscribe to events (completions, diffs, chat)
4. Extract context and code changes

**Example: Continue**
```typescript
const continueExt = vscode.extensions.getExtension('Continue.continue');
const api = continueExt.exports;
api.onAcceptRejectDiff((event) => {
  // Direct access to prompt, diff, conversation ID
});
```

### Strategy 2: File Watching Fallback (Universal)

When no API is available:
1. Monitor workspace with FileSystemWatcher
2. Detect rapid, structured changes
3. Apply heuristics to identify AI-generated code
4. Correlate with editor activity

**Detection Heuristics**:
- Timing: Changes < 2 seconds apart
- Pattern: Multi-line, properly indented code
- Structure: Complete functions, classes, imports
- Size: Large insertions (> 30 characters)

### Strategy 3: Hybrid Approach (Best Coverage)

Combine both methods:
1. Use API when available for rich context
2. Fall back to file watching for coverage
3. Cross-validate between sources
4. Maintain consistent event model

## Supported AI Tools

| Tool | Detection | API Integration | Fallback | Confidence |
|------|-----------|----------------|----------|------------|
| **GitHub Copilot** | ✅ Extension ID | ❌ No public API | ✅ File watching | Medium |
| **Cursor** | ✅ Extension ID | ❌ Proprietary | ✅ File watching | Medium |
| **Continue** | ✅ Extension ID | ✅ Public API | ✅ File watching | High |
| **Cody** | ✅ Extension ID | ⚠️ Limited API | ✅ File watching | High |
| **Tabnine** | ✅ Extension ID | ❌ No public API | ✅ File watching | Medium |
| **CodeWhisperer** | ✅ Extension ID | ❌ No public API | ✅ File watching | Medium |
| **Unknown AI** | ✅ Heuristic | ❌ N/A | ✅ File watching | Low |

**Confidence Levels**:
- **High**: API available with full context
- **Medium**: Extension detected, heuristic-based
- **Low**: Unknown tool, pattern matching only

## Performance Considerations

### Non-Blocking Design
- File watching uses VS Code's native FileSystemWatcher (efficient)
- Debouncing (100ms) to batch rapid changes
- Change buffer limited to recent activity (5 minutes)
- Maximum snapshots per file (10) to limit memory

### Memory Footprint
- Change history: ~1KB per file change
- Snapshots: Configurable, auto-pruned
- Alert history: Limited to 100 recent alerts
- No persistent in-memory storage

### CPU Usage
- Event-driven architecture (no polling)
- Heuristic detection is O(n) on change text
- No background threads
- Graceful degradation under load

## Error Handling

### Graceful Degradation
- If AI tool detection fails → Use file watching only
- If file watching fails → Disable monitoring gracefully
- If core engine unavailable → Queue events locally
- If snapshot fails → Log error, continue monitoring

### User Feedback
- Toast notifications for critical errors
- Console logging for debugging
- Status bar indicator for monitoring state
- Clear error messages in alerts

## Configuration

### Extension Settings

```json
{
  "aiSupervisor.monitoring.enabled": true,
  "aiSupervisor.monitoring.sensitivity": "medium",
  "aiSupervisor.alerts.showNotifications": true,
  "aiSupervisor.alerts.severity": "all",
  "aiSupervisor.fileWatcher.rapidChangeThreshold": 2000,
  "aiSupervisor.fileWatcher.excludePatterns": [
    "**/node_modules/**",
    "**/.git/**",
    "**/dist/**"
  ]
}
```

## Event System

### File Change Events
```typescript
interface FileChange {
  uri: vscode.Uri;
  timestamp: number;
  type: 'create' | 'change' | 'delete';
  content?: string;
  size?: number;
}
```

### AI Interaction Events
```typescript
interface AIInteraction {
  toolId: string;
  timestamp: number;
  type: 'completion' | 'chat' | 'inline-edit' | 'refactor';
  prompt?: string;
  response?: string;
  code?: CodeSuggestion;
}
```

### Deviation Events
```typescript
interface DeviationEvent {
  type: 'goal-deviation' | 'code-reversal' | 'unauthorized-action';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: string;
  file?: string;
  timestamp: number;
}
```

## Future Enhancements

### Planned Integrations
- [ ] GitHub Copilot Chat API (when available)
- [ ] Cursor API (if exposed)
- [ ] OpenAI-based assistants
- [ ] JetBrains IDEs (IntelliJ, PyCharm)

### Enhanced Detection
- [ ] Machine learning for AI pattern detection
- [ ] Conversation context extraction from chat panels
- [ ] Multi-file change correlation
- [ ] Semantic diff analysis

### Advanced Features
- [ ] Real-time streaming interception
- [ ] Pre-emptive deviation warnings
- [ ] Automatic goal inference from codebase
- [ ] Team-shared supervision rules

## Testing

### Unit Tests
- FileWatcher: Change detection, debouncing
- AIDetector: Extension discovery, heuristics
- InterceptLayer: Change pattern matching
- AlertManager: Notification routing, preferences

### Integration Tests
- End-to-end file change → alert flow
- Multi-tool detection scenarios
- Error recovery and degradation
- Performance under load

### Manual Testing
1. Install extension in VS Code
2. Install AI coding assistant (Copilot, Continue, etc.)
3. Make code changes via AI
4. Verify alerts appear
5. Test intervention commands
6. Validate rollback functionality

## Troubleshooting

### No AI Tool Detected
- Check: `aiSupervisor.refreshAITools` command
- Verify: AI extension is installed and activated
- Fallback: File watching still monitors changes

### Alerts Not Showing
- Check: `aiSupervisor.alerts.showNotifications` setting
- Verify: Alert severity threshold
- Check: VS Code notification settings

### High CPU Usage
- Increase: `rapidChangeThreshold` to reduce sensitivity
- Add: More patterns to `excludePatterns`
- Disable: Background analysis if on slow machine

## Contributing

See main repository for contribution guidelines.

## License

MIT - See LICENSE file for details.
