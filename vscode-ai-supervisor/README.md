# AI Supervisor - Monitor & Control AI Code Changes

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://marketplace.visualstudio.com/items?itemName=your-publisher-name.ai-supervisor)
[![License](https://img.shields.io/badge/license-Commercial-green.svg)](LICENSE)

> **Monitor AI coding assistants in real-time, detect deviations, and maintain control over AI-generated code changes**

AI Supervisor provides a comprehensive monitoring and supervision layer for AI coding assistants like GitHub Copilot, Claude, Cursor, and more. Never lose track of what your AI is doing - get real-time alerts when AI deviates from your goals or reverses previous changes.

## Features

### 🔍 Real-Time Activity Monitoring
- Track all AI-generated code changes in real-time
- Color-coded status indicators (green, yellow, red)
- Timeline view of conversations and modifications
- Filter by file, time range, or issue type

![Activity Monitor](assets/screenshots/activity-monitor.png)

### 🎯 Project Goal Management
- Define clear project goals and scope
- Quick-add templates for common tasks
- Visual alignment indicators
- Goal-based deviation detection

### 🔄 Change Inspector
- Side-by-side diff viewer for AI changes
- Link changes to conversation context
- Highlight code reversals and contradictions
- Approve/reject/modify workflow

### ⚠️ Smart Alert System
- Toast notifications for critical deviations
- Severity levels (info, warning, error)
- Actionable alerts with quick responses
- Complete alert history

### 🛡️ Intervention Controls
- Pause/resume AI monitoring
- Send corrective prompts
- Rollback changes to previous state
- Manual override for false positives

### 🔀 Model Switch Assistant
- Automatic handoff summary generation
- Context preservation when switching models
- Copy to clipboard or preview
- Seamless transitions between AI tools

### 🛡️ Multi-Model Guardian System
- **Cross-model verification**: Code with Claude, guard with GPT-4o (and vice versa)
- **Independent oversight**: Different AI models catch different issues
- **Automatic detection**: Identifies which model is coding, selects appropriate guardian
- **No shared blind spots**: Different training = different perspectives
- **Local or cloud**: Use free local models (Ollama) or cloud APIs for max accuracy
- **Detailed reasoning**: Guardians explain WHY they flag issues

> **Why different models?** When you code with Claude and Claude checks its own work = blind spots! When you code with Claude and GPT-4 guards = independent review!

[Learn more about the Multi-Model Guardian System](MULTI_MODEL_GUARDIAN.md)

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "AI Supervisor"
4. Click Install

### From VSIX File
1. Download the `.vsix` file from releases
2. Open VS Code
3. Run command: `Extensions: Install from VSIX...`
4. Select the downloaded file

## Quick Start

1. **Install the extension** from the marketplace
2. **Open your project** in VS Code
3. **Set your goals** - Click the AI Supervisor icon in the sidebar and define your project goals
4. **Start coding with AI** - Use your favorite AI assistant (Copilot, Claude, etc.)
5. **Monitor changes** - Watch the Activity Monitor for real-time updates
6. **Respond to alerts** - Get notified when AI deviates from your goals

## Usage

### Setting Up Your Guardian

Configure which AI model acts as your guardian to provide independent oversight:

1. **Open Command Palette**: `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. **Run**: `AI Supervisor: Configure Guardian`
3. **Choose Provider**:
   - **Cloud Models** (best accuracy): OpenAI (GPT-4o), Anthropic (Claude 3.5), Google (Gemini)
   - **Local Models** (free, private): Ollama with Llama 3.1, DeepSeek Coder, etc.
4. **Enter API Key** (for cloud providers) or set up Ollama endpoint (for local)
5. **Test Connection** and you're ready!

**Automatic Pairing**: AI Supervisor automatically pairs your coding model with a different guardian:
- Code with **Claude** → **GPT-4o** guards
- Code with **GPT-4** → **Claude 3.5** guards
- Code with **Copilot** → **Claude 3.5** guards

See [SETUP_GUARDIAN.md](SETUP_GUARDIAN.md) for detailed setup instructions.

### Setting Up Goals

1. Click the AI Supervisor icon in the sidebar
2. Navigate to "Project Goals"
3. Click "Add New Goal" or use a template
4. Define your objective and scope

Example goals:
- "Build a REST API with authentication"
- "Refactor code for better performance"
- "Add comprehensive test coverage"

### Monitoring Activity

The Activity Monitor shows:
- File changes in real-time
- AI tool detection
- Change timestamps
- Severity indicators

### Responding to Alerts

When AI Supervisor detects a deviation:

1. **Review the alert** - Understand what changed and why
2. **Choose an action**:
   - **Allow This Time** - Accept the change
   - **Stop AI** - Pause monitoring to review
   - **Update Goals** - Adjust your project goals
   - **View Details** - Inspect the change in detail

### Switching AI Models

When switching between AI tools or models:

1. Run command: `AI Supervisor: Generate Model Switch Handoff`
2. Review the generated summary
3. Copy to clipboard or preview
4. Paste into new AI conversation

## Commands

- `AI Supervisor: Configure Guardian` - Set up guardian model for independent review
- `AI Supervisor: Show Activity Monitor` - View real-time activity
- `AI Supervisor: Manage Goals` - Define project goals
- `AI Supervisor: Inspect Changes` - Review AI code changes
- `AI Supervisor: Pause Monitoring` - Temporarily pause supervision
- `AI Supervisor: Resume Monitoring` - Resume supervision
- `AI Supervisor: Generate Model Switch Handoff` - Create context handoff
- `AI Supervisor: Test Guardian` - Test guardian connection and analysis
- `AI Supervisor: View Usage Report` - View guardian API usage and costs
- `AI Supervisor: Clear Activity History` - Reset activity log
- `AI Supervisor: Export Report` - Export supervision report (Premium)
- `AI Supervisor: Activate Premium License` - Unlock premium features

## Configuration

Configure AI Supervisor in VS Code settings:

```json
{
  // Guardian settings
  "aiSupervisor.guardian.provider": "openai",
  "aiSupervisor.guardian.model": "gpt-4o",
  "aiSupervisor.guardian.autoSelect": true,
  "aiSupervisor.guardian.analysisDepth": "standard",
  "aiSupervisor.guardian.costLimit.daily": 5.00,
  "aiSupervisor.guardian.costLimit.monthly": 50.00,

  // Monitoring settings
  "aiSupervisor.monitoring.enabled": true,
  "aiSupervisor.monitoring.sensitivity": "medium",

  // Alert settings
  "aiSupervisor.alerts.showNotifications": true,
  "aiSupervisor.alerts.severity": "all",

  // Storage settings
  "aiSupervisor.storage.retentionDays": 30,
  "aiSupervisor.storage.location": "workspace"
}
```

See [SETUP_GUARDIAN.md](SETUP_GUARDIAN.md) for complete configuration guide and [TOML_STORAGE.md](TOML_STORAGE.md) for data storage format.

## Premium Features

Upgrade to Premium for advanced capabilities:

- ✨ AI-powered deviation analysis
- 📊 Multi-project supervision
- ☁️ Cloud backup of conversation history
- 👥 Team collaboration features
- 🔧 Custom supervision rules and plugins
- 🎫 Priority support

[Get Premium License](https://your-site.com/pricing)

## Development

### Prerequisites

- Node.js 18+
- VS Code 1.85.0+
- npm or yarn

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/ai-supervisor.git
cd vscode-ai-supervisor

# Install dependencies
npm install

# Compile the extension
npm run compile

# Watch for changes
npm run watch
```

### Debug the Extension

1. Open the project in VS Code
2. Press `F5` to launch Extension Development Host
3. Test your changes in the new VS Code window
4. Check the Debug Console for logs

### Build VSIX Package

```bash
# Build production package
npm run package

# Create VSIX
npm run build:vsix
```

This creates a `.vsix` file you can share or publish.

### Testing

```bash
# Run tests
npm test

# Run linter
npm run lint
```

## Architecture

The extension follows VS Code best practices:

```
vscode-ai-supervisor/
├── src/
│   ├── extension.ts          # Entry point
│   ├── commands/             # Command handlers
│   ├── panels/               # Webview panels
│   ├── integration/          # AI tool detection
│   └── notifications/        # Alert system
├── dist/                     # Compiled output
└── package.json              # Extension manifest
```

### Activation Flow

1. Extension activates on `onStartupFinished`
2. Initialize core services (FileWatcher, AIDetector, AlertManager)
3. Register commands and webview providers
4. Set up context keys for conditional UI
5. Check for premium license
6. Show welcome message (first time only)

## Supported AI Tools

AI Supervisor works with any AI coding assistant, with enhanced support for:

- GitHub Copilot
- GitHub Copilot Chat
- Continue
- Sourcegraph Cody
- Tabnine
- Claude (VS Code extension)
- Cursor

Detection is automatic - no configuration needed!

## Privacy & Security

- All data stored locally by default
- No telemetry without consent
- Premium cloud features are optional
- Encrypted storage for sensitive data
- Open source core (MIT license)

## Troubleshooting

### Extension not detecting AI changes

1. Ensure monitoring is enabled in settings
2. Check that file types are supported
3. Try resuming monitoring: `AI Supervisor: Resume Monitoring`

### Alerts not showing

1. Check notification settings: `aiSupervisor.alerts.showNotifications`
2. Verify severity filter: `aiSupervisor.alerts.severity`
3. Review VS Code notification permissions

### Performance issues

1. Reduce retention days in settings
2. Clear activity history periodically
3. Disable background analysis for large projects

## Documentation

Complete documentation for the Multi-Model Guardian System:

- **[MULTI_MODEL_GUARDIAN.md](MULTI_MODEL_GUARDIAN.md)** - Understand the concept of cross-model verification
- **[SETUP_GUARDIAN.md](SETUP_GUARDIAN.md)** - Step-by-step setup guide for cloud and local models
- **[TOML_STORAGE.md](TOML_STORAGE.md)** - Learn about TOML data storage format
- **[examples/guardian-usage.ts](examples/guardian-usage.ts)** - Code examples showing how guardian works
- **[examples/toml-examples/](examples/toml-examples/)** - Sample TOML files with detailed annotations

### Quick Links

- **Getting Started**: [SETUP_GUARDIAN.md](SETUP_GUARDIAN.md)
- **Understanding Guardians**: [MULTI_MODEL_GUARDIAN.md](MULTI_MODEL_GUARDIAN.md)
- **Data Format**: [TOML_STORAGE.md](TOML_STORAGE.md)
- **Code Examples**: [examples/guardian-usage.ts](examples/guardian-usage.ts)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

## Support

- **Documentation**: [docs.your-site.com](https://docs.your-site.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/ai-supervisor/issues)
- **Premium Support**: support@your-site.com

## License

See [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

**Made with ❤️ for developers who want to keep AI in check**
