# Quick Start Guide - AI Supervisor Extension

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
cd /home/user/GUARD_RAIL/vscode-ai-supervisor
npm install
```

### 2. Open in VS Code
```bash
code .
```

### 3. Start Development
Press **F5** to launch Extension Development Host

A new VS Code window opens with the extension loaded!

### 4. Test the Extension

In the Extension Development Host window:

1. **Open the Activity Monitor**
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type: `AI Supervisor: Show Activity Monitor`
   - Hit Enter

2. **Set Project Goals**
   - Press `Cmd+Shift+P`
   - Type: `AI Supervisor: Manage Goals`
   - Add a goal using one of the templates

3. **Make File Changes**
   - Edit any code file in your workspace
   - Watch the Activity Monitor update in real-time

4. **Check the Sidebar**
   - Look for the AI Supervisor icon in the activity bar
   - Click to see the sidebar views

## 📝 Key Files to Know

| File | Purpose |
|------|---------|
| `package.json` | Extension manifest - defines commands, views, settings |
| `src/extension.ts` | Entry point - activate/deactivate |
| `src/commands/Commands.ts` | Command implementations |
| `src/panels/*.ts` | Webview panel UIs |
| `.vscode/launch.json` | F5 debug configuration |
| `webpack.config.js` | Build configuration |

## 🔧 Common Development Tasks

### Watch for Changes
```bash
npm run watch
```
Then press F5 to debug. Changes auto-compile!

### Build for Production
```bash
npm run package
```

### Create VSIX Package
```bash
npm run build:vsix
```

### Run Linter
```bash
npm run lint
```

### Fix Linting Issues
```bash
npm run lint -- --fix
```

## 🐛 Debugging Tips

### View Console Output
1. In Extension Development Host, press `Cmd+Shift+P`
2. Run: `Developer: Toggle Developer Tools`
3. Check Console tab for logs

### Set Breakpoints
1. Open any `.ts` file in your main VS Code window
2. Click left of line number to set breakpoint
3. F5 to debug - execution pauses at breakpoint

### Reload Extension
In Extension Development Host:
- Press `Cmd+R` (Mac) or `Ctrl+R` (Windows/Linux)
- Or press reload button in VS Code

## 📦 Directory Overview

```
vscode-ai-supervisor/
├── src/               # TypeScript source code
│   ├── extension.ts   # Main entry point
│   ├── commands/      # Command handlers
│   ├── panels/        # Webview panels
│   ├── integration/   # File watching, AI detection
│   └── notifications/ # Alert system
├── .vscode/           # Debug configuration
├── assets/            # Icons and images
├── package.json       # Extension manifest
├── tsconfig.json      # TypeScript config
└── webpack.config.js  # Bundler config
```

## ⚙️ Configuration

### Activation Event
```json
"activationEvents": ["onStartupFinished"]
```
Extension activates after VS Code loads (non-blocking)

### Commands
All commands in `aiSupervisor.*` namespace:
- `aiSupervisor.showActivityMonitor`
- `aiSupervisor.showGoalManager`
- `aiSupervisor.showChangeInspector`
- And more...

### Settings
Access via VS Code Settings:
```
AI Supervisor > Monitoring > Enabled
AI Supervisor > Alerts > Show Notifications
etc.
```

## 🎯 Testing Checklist

- [ ] Extension activates without errors
- [ ] Activity Monitor panel opens
- [ ] Goal Manager panel opens
- [ ] Change Inspector panel opens
- [ ] File changes are detected
- [ ] Commands appear in palette
- [ ] Sidebar views are visible
- [ ] Settings are accessible
- [ ] No console errors

## 🔍 Troubleshooting

### Extension doesn't activate
- Check Debug Console for errors
- Verify `package.json` syntax
- Ensure dependencies installed: `npm install`

### Commands not found
- Check `package.json` contributions
- Verify command IDs match
- Reload Extension Development Host

### TypeScript errors
- Run: `npm run compile`
- Check `tsconfig.json`
- Ensure `@types/vscode` installed

### Webview not loading
- Check console for errors
- Verify HTML syntax in panel files
- Enable script errors in webview

## 📚 Next Steps

1. **Read the docs**
   - `README.md` - User documentation
   - `EXTENSION_STRUCTURE.md` - Architecture details
   - `CONTRIBUTING.md` - Development guidelines

2. **Customize the extension**
   - Add new commands in `Commands.ts`
   - Create new panels in `panels/`
   - Modify UI in webview HTML

3. **Integrate core library**
   - When `ai-supervisor` core is ready
   - Uncomment imports in `extension.ts`
   - Wire up to FileWatcher and panels

4. **Add assets**
   - Create icon.png (128x128)
   - Create sidebar-icon.svg
   - Add screenshots for marketplace

5. **Test thoroughly**
   - Test all commands
   - Test with different AI tools
   - Test premium feature gating

6. **Prepare for release**
   - Update version in `package.json`
   - Update `CHANGELOG.md`
   - Build VSIX
   - Publish to marketplace

## 💡 Pro Tips

- **Hot reload**: Use `npm run watch` + F5 for fast iteration
- **Console logging**: Use `console.log()` - visible in Debug Console
- **VS Code API**: Check [docs](https://code.visualstudio.com/api) for examples
- **Webview debugging**: Right-click webview → Inspect Element
- **State management**: Use `context.globalState` or `workspaceState`

## 🎓 Learning Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Extension Guides](https://code.visualstudio.com/api/extension-guides/overview)
- [Publishing Guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Example Extensions](https://github.com/microsoft/vscode-extension-samples)

---

**Happy coding! 🚀**
