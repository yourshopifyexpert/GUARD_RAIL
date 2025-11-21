# AI Supervisor VS Code Extension - Structure & Architecture

## 📁 Directory Structure

```
vscode-ai-supervisor/
├── .vscode/
│   ├── launch.json              # F5 debugging configuration
│   └── tasks.json               # Build tasks
├── assets/
│   └── README.md                # Asset requirements and guidelines
├── src/
│   ├── commands/
│   │   └── Commands.ts          # Command handler implementations
│   ├── integration/
│   │   ├── AIDetector.ts        # Detect installed AI tools
│   │   ├── FileWatcher.ts       # Monitor workspace file changes
│   │   └── InterceptLayer.ts    # Future: API-based AI interception
│   ├── notifications/
│   │   └── AlertManager.ts      # Alert and notification system
│   ├── panels/
│   │   ├── ActivityMonitor.ts   # Real-time activity panel
│   │   ├── ChangeInspector.ts   # Code change diff viewer
│   │   └── GoalManager.ts       # Project goal management UI
│   ├── webview/
│   │   └── components/
│   │       └── ActivityView.tsx # Future: React components
│   └── extension.ts             # Extension entry point
├── dist/                        # Compiled output (webpack)
├── .eslintrc.json              # ESLint configuration
├── .gitignore                  # Git ignore rules
├── .vscodeignore               # Files to exclude from package
├── CHANGELOG.md                # Version history
├── CONTRIBUTING.md             # Contribution guidelines
├── LICENSE                     # Commercial license
├── package.json                # Extension manifest
├── README.md                   # Marketplace documentation
├── tsconfig.json               # TypeScript configuration
└── webpack.config.js           # Webpack bundler config
```

## 🚀 Activation Flow

### 1. Extension Activation (`extension.ts`)

```
onStartupFinished (VS Code event)
  ↓
activate(context)
  ↓
  ├─→ Initialize ExtensionContext (singleton)
  ├─→ Load configuration settings
  ├─→ Initialize core services:
  │   ├─→ FileWatcher (monitor workspace changes)
  │   ├─→ AIDetector (detect installed AI tools)
  │   └─→ AlertManager (handle notifications)
  ├─→ Register all commands
  ├─→ Register webview providers
  ├─→ Set context keys for UI
  ├─→ Check premium license
  └─→ Show welcome message (first time only)
```

### 2. Command Registration

```typescript
Commands registered in package.json → Handlers in Commands.ts

User triggers command
  ↓
VS Code executes registered handler
  ↓
Commands.ts method executes
  ↓
  ├─→ Shows webview panel, OR
  ├─→ Modifies monitoring state, OR
  ├─→ Displays QuickPick/InputBox, OR
  └─→ Executes utility function
```

### 3. File Watching Flow

```
File change in workspace
  ↓
VS Code FileSystemWatcher event
  ↓
FileWatcher.handleFileChange()
  ↓
  ├─→ Track change timing (detect rapid changes)
  ├─→ Determine if likely AI-generated
  ├─→ Process change (send to supervisor engine)
  └─→ Update activity panel
```

### 4. Alert Flow

```
Deviation detected
  ↓
AlertManager.showAlert()
  ↓
  ├─→ Add to alert history
  ├─→ Check user preferences
  ├─→ Filter by severity
  └─→ Show VS Code notification
      ↓
      User clicks action button
        ↓
        Execute corresponding command
```

## 🔧 Key Components

### ExtensionContext (Singleton)
- **Purpose**: Central state management
- **Holds**: 
  - FileWatcher instance
  - AIDetector instance
  - AlertManager instance
  - Monitoring state
- **Access**: `ExtensionContext.getInstance()`

### Commands
- **File**: `src/commands/Commands.ts`
- **Methods**:
  - `showActivityMonitor()` - Open activity panel
  - `showGoalManager()` - Open goal management
  - `showChangeInspector()` - Open change diff viewer
  - `pauseMonitoring()` - Stop file watching
  - `resumeMonitoring()` - Start file watching
  - `generateHandoff()` - Create model switch summary
  - `clearHistory()` - Reset activity log
  - `exportReport()` - Export report (Premium)
  - `openSettings()` - Open extension settings
  - `activatePremium()` - License activation

### FileWatcher
- **File**: `src/integration/FileWatcher.ts`
- **Watches**: All code files (ts, js, py, etc.)
- **Detects**: Rapid changes indicating AI activity
- **Buffers**: Changes for analysis
- **Integrates**: With supervisor engine (future)

### AIDetector
- **File**: `src/integration/AIDetector.ts`
- **Detects**:
  - GitHub Copilot
  - Continue
  - Cody
  - Tabnine
  - Claude VS Code
  - Cursor
- **Methods**: `getDetectedTools()`, `hasCopilot()`, etc.

### AlertManager
- **File**: `src/notifications/AlertManager.ts`
- **Severities**: Info, Warning, Error
- **Features**:
  - Toast notifications
  - Action buttons
  - Alert history
  - User preference filtering

### Webview Panels
- **ActivityMonitor**: Real-time activity display
- **GoalManager**: CRUD for project goals
- **ChangeInspector**: Diff viewer with approve/reject

## 📦 Package.json Key Sections

### Activation Events
```json
"activationEvents": [
  "onStartupFinished"
]
```
- Activates after VS Code finishes loading
- Non-intrusive (doesn't slow down startup)

### Contributed Commands
10 commands in `aiSupervisor.*` namespace

### Contributed Views
3 sidebar views:
- Activity Monitor
- Project Goals
- Alerts & Issues

### Configuration
Settings namespace: `aiSupervisor.*`
- Monitoring preferences
- Alert preferences
- Storage settings
- Premium license

## 🛠️ Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start watch mode
npm run watch

# Press F5 in VS Code
# → Opens Extension Development Host
# → Test extension in isolated VS Code instance
# → See console output in Debug Console
```

### Debug Configuration
`.vscode/launch.json` provides:
- **Run Extension**: F5 to debug
- **Extension Tests**: Run test suite

Pre-launch task: Compile TypeScript

### Build for Production
```bash
# Compile and bundle
npm run package

# Create VSIX file
npm run build:vsix

# → Creates .vsix file for distribution
```

### Testing Flow
```bash
# Lint code
npm run lint

# Run tests
npm test

# Compile
npm run compile
```

## 🎯 Extension Capabilities

### What It Does
✅ Monitors workspace file changes
✅ Detects AI coding assistants
✅ Tracks AI-generated modifications
✅ Shows real-time activity
✅ Alerts on deviations
✅ Manages project goals
✅ Inspects code changes
✅ Generates model handoffs
✅ Exports reports (Premium)

### What It Doesn't Do
❌ Modify AI tool behavior directly
❌ Block or intercept AI commands
❌ Require specific AI tools
❌ Send data to external servers (by default)
❌ Heavy background computations

## 🔐 Premium Features

Gated by license key in settings:
- Advanced deviation detection
- Multi-project supervision
- Cloud backup
- Team collaboration
- Custom rules
- Priority support

License check in `extension.ts`:
```typescript
checkPremiumLicense(context)
  ↓
  Read: aiSupervisor.premium.licenseKey
  ↓
  Validate with licensing server (TODO)
  ↓
  Store: context.globalState.isPremium
```

## 📝 Configuration Schema

```typescript
aiSupervisor.monitoring.enabled: boolean
aiSupervisor.monitoring.sensitivity: 'low' | 'medium' | 'high'
aiSupervisor.alerts.showNotifications: boolean
aiSupervisor.alerts.severity: 'all' | 'warning' | 'error'
aiSupervisor.storage.retentionDays: number
aiSupervisor.storage.location: 'workspace' | 'global'
aiSupervisor.premium.licenseKey: string
aiSupervisor.detection.aiTools: string[]
aiSupervisor.performance.enableBackgroundAnalysis: boolean
```

## 🔄 Lifecycle Management

### Activation
1. Check if monitoring enabled
2. Initialize services
3. Register commands
4. Set up UI components
5. Load saved state

### Runtime
1. Watch file changes
2. Process AI activity
3. Show alerts when needed
4. Update UI panels
5. Store activity history

### Deactivation
1. Dispose FileWatcher
2. Close active panels
3. Clean up resources
4. Save state

## 🎨 UI Integration Points

### Activity Bar
Custom sidebar with icon (assets/sidebar-icon.svg)

### Sidebar Views
- Activity Monitor (TreeView)
- Project Goals (TreeView)
- Alerts & Issues (TreeView)

### Webview Panels
- Activity Monitor (full UI)
- Goal Manager (full UI)
- Change Inspector (full UI)

### Command Palette
All commands accessible via Cmd/Ctrl+Shift+P

### Menus
- View title menus (pause/resume, settings)
- Context menus (future enhancement)

## 🚦 Best Practices Followed

✅ Activation on `onStartupFinished` (non-blocking)
✅ Disposable pattern for cleanup
✅ Singleton pattern for services
✅ TypeScript strict mode
✅ Webpack bundling for performance
✅ Source maps for debugging
✅ Semantic versioning
✅ Conventional commits
✅ Comprehensive documentation
✅ ESLint + formatting rules

## 📊 Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Panels created on-demand
2. **Buffering**: File changes batched
3. **Filtering**: Process only relevant files
4. **Virtual Lists**: For large datasets (future)
5. **Worker Threads**: For heavy analysis (future)

### Resource Usage
- File watching: Minimal overhead
- Webviews: Only when opened
- Storage: Configurable retention
- Memory: Clean up disposed resources

## 🔮 Future Enhancements

### Planned Features
- [ ] React-based webview UI
- [ ] Advanced ML-based deviation detection
- [ ] API-based AI tool integration
- [ ] Multi-project workspace support
- [ ] Cloud sync
- [ ] Team collaboration
- [ ] Plugin system
- [ ] Custom rule engine

### Integration Opportunities
- GitHub Copilot API (when available)
- Continue plugin system
- Cody API
- Language Server Protocol hooks

## 📚 Documentation

- **README.md**: User-facing marketplace documentation
- **CONTRIBUTING.md**: Developer contribution guide
- **CHANGELOG.md**: Version history
- **EXTENSION_STRUCTURE.md**: This document
- **assets/README.md**: Asset requirements

## 🎓 Learning Resources

For developers new to VS Code extensions:
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

---

**Built with TypeScript + VS Code Extension API**
**Architecture: Service-oriented with event-driven monitoring**
**License: Commercial (Freemium model)**
