<objective>
Build a Visual Studio Code extension that integrates the AI Supervisor core engine, providing a seamless UI for monitoring AI behavior, managing goals, reviewing changes, and receiving real-time alerts when AI deviates from expected behavior.

This extension is the primary product that will be published to the VS Code Marketplace with a freemium model.
</objective>

<context>
This builds on the core AI Supervisor engine (from prompt 005). The extension provides:

- **Real-time monitoring panel** showing AI activity, changes, and alerts
- **Goal management UI** for defining and tracking project objectives
- **Change history viewer** with diff visualization
- **Alert notifications** when AI deviates or reverses code
- **Intervention controls** to approve/reject AI suggestions
- **Model switch assistant** for seamless context preservation

The extension must integrate with popular AI coding assistants (GitHub Copilot, Claude, Cursor, etc.) by monitoring file changes and intercepting AI interactions where possible.

Dependency: Requires `ai-supervisor` core library from prompt 005.
</context>

<requirements>

## Extension Features

1. **Activity Monitor Panel**
   - Real-time view of AI actions (file edits, suggestions)
   - Color-coded status: green (on-track), yellow (minor deviation), red (critical alert)
   - Timeline view of conversation and code changes
   - Filter by file, time range, or issue type

2. **Goal Manager**
   - UI to define project goals and scope
   - Quick-add templates (e.g., "Build REST API", "Refactor for performance")
   - Edit/update goals as project evolves
   - Visual indicator of current goal alignment

3. **Change Inspector**
   - Side-by-side diff viewer for AI code changes
   - Link changes to conversation context (why was this done?)
   - Highlight reversals and contradictory edits
   - Approve/reject/modify workflow

4. **Alert System**
   - Toast notifications for critical deviations
   - Alert severity levels (info, warning, error)
   - Action buttons: "Stop AI", "Allow this time", "Update goals"
   - Alert history log

5. **Intervention Controls**
   - Pause/resume AI operations
   - Send corrective prompts directly to AI
   - Rollback changes to previous state
   - Manual override for false positives

6. **Model Switch Assistant**
   - Detect when user wants to switch AI provider/model
   - Generate handoff summary automatically
   - Copy to clipboard or insert into new chat
   - Preview summary before sending

7. **Settings & Configuration**
   - Sensitivity levels for deviation detection
   - Customize alert preferences
   - Free vs Premium feature gating
   - Storage location and retention settings

## Premium Features (for Monetization)

- Advanced deviation detection with AI-powered analysis
- Multi-project supervision (track multiple codebases)
- Cloud backup of conversation history
- Team collaboration (share goals and history)
- Custom supervision rules and plugins
- Priority support

</requirements>

<implementation>

## Technology Stack

- **VS Code Extension API** for editor integration
- **React + Webview** for complex UI panels
- **VS Code native UI** for simple views (TreeView, QuickPick)
- Import `ai-supervisor` core library from prompt 005

## Extension Structure

```
vscode-ai-supervisor/
├── src/
│   ├── extension.ts              # Extension entry point
│   ├── panels/
│   │   ├── ActivityMonitor.ts    # Main monitoring panel
│   │   ├── GoalManager.ts        # Goal definition UI
│   │   └── ChangeInspector.ts    # Diff viewer
│   ├── integration/
│   │   ├── FileWatcher.ts        # Monitor workspace changes
│   │   ├── AIDetector.ts         # Detect which AI tool is active
│   │   └── InterceptLayer.ts     # Hook into AI interactions
│   ├── notifications/
│   │   └── AlertManager.ts       # Toast notifications & actions
│   ├── commands/
│   │   └── Commands.ts           # VS Code commands
│   └── webview/                  # React UI components
│       ├── components/
│       ├── ActivityView.tsx
│       ├── GoalEditor.tsx
│       └── index.tsx
├── package.json                  # Extension manifest
├── README.md
└── CHANGELOG.md
```

## Integration Strategy

**File Watching Approach** (works with any AI tool):
- Monitor workspace file changes via VS Code FileSystemWatcher
- Detect rapid edits (likely AI-generated)
- Feed changes to core supervisor engine
- Display results in extension UI

**AI Tool Detection**:
- Detect GitHub Copilot, Cursor, Continue, Cody via installed extensions
- If possible, hook into their APIs for richer integration
- Fallback to file watching if direct integration unavailable

## Critical Guidelines

1. **Performance**: Use virtualized lists for large change histories
2. **UX**: Non-intrusive monitoring - don't block developer workflow
3. **Accessibility**: Follow VS Code accessibility guidelines
4. **Licensing**: Implement license key validation for premium features
5. **Updates**: Use VS Code's update mechanism, check license on startup

## What to Avoid

- **Don't** modify AI tool behavior directly - observe only (to avoid conflicts)
- **Don't** require specific AI tools - work with any assistant
- **Don't** block the editor with heavy computations - use worker threads
- **Don't** store sensitive data unencrypted

Why? The extension should be a helpful observer and advisor, not a gatekeeper that breaks existing workflows. It enhances rather than replaces AI tools.

</implementation>

<output>

Create the following:

- `./vscode-ai-supervisor/package.json` - Extension manifest with proper activation events
- `./vscode-ai-supervisor/src/` - All TypeScript source code
- `./vscode-ai-supervisor/webview/` - React UI components
- `./vscode-ai-supervisor/README.md` - Marketplace description, features, screenshots
- `./vscode-ai-supervisor/CHANGELOG.md` - Version history
- `./vscode-ai-supervisor/.vscodeignore` - Files to exclude from package
- `./vscode-ai-supervisor/LICENSE` - MIT or commercial license
- `./vscode-ai-supervisor/assets/` - Icon, screenshots for marketplace

Include setup instructions for:
- Local development (`npm install`, `F5` to debug)
- Building VSIX package
- Publishing to marketplace
- Testing premium features locally

</output>

<verification>

Before declaring complete:

1. **Test in VS Code**: Press F5 to launch extension development host
2. **Verify monitoring**: Make file changes, confirm they appear in activity panel
3. **Test alerts**: Trigger a deviation (e.g., reverse a change), verify notification appears
4. **Check goal manager**: Add/edit/delete goals through UI
5. **Premium gating**: Verify premium features are locked without license
6. **Build package**: Run `vsce package` to create VSIX file
7. **Install locally**: Install VSIX in clean VS Code instance

Document testing steps in README.

</verification>

<success_criteria>

- Extension activates successfully in VS Code
- Activity monitor displays real-time file changes
- Goal manager UI allows CRUD operations on goals
- Alert system shows notifications for deviations
- Change inspector displays diffs correctly
- Premium features are properly gated behind license check
- Extension package builds without errors
- README includes screenshots and clear feature descriptions
- All VS Code extension best practices followed (icon, categories, keywords)

</success_criteria>

<notes>

## Marketplace Optimization

- **Name**: "AI Supervisor - Monitor & Control AI Code Changes"
- **Categories**: Machine Learning, Other
- **Keywords**: AI, assistant, monitoring, safety, supervision, copilot
- **Description**: Emphasize reliability, control, and preventing AI hallucinations
- **Screenshots**: Show activity panel, alert notifications, change inspector

## Future Integrations

After initial launch, consider:
- JetBrains IDEs plugin (IntelliJ, PyCharm)
- Sublime Text plugin
- Vim/Neovim plugin
- Web-based dashboard

The core engine from prompt 005 makes these integrations straightforward.

</notes>
