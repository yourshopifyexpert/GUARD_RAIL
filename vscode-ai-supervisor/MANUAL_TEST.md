# Manual Testing Guide for AI Supervisor Extension

## Prerequisites

Before testing, ensure you have:
- VS Code version 1.85.0 or higher
- Node.js and npm installed
- Extension built successfully (see Build Instructions below)

## Build Instructions

1. Open terminal in the extension directory:
   ```bash
   cd /home/user/GUARD_RAIL/vscode-ai-supervisor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile the extension:
   ```bash
   npm run compile
   ```

4. Verify build output:
   - Check that `dist/extension.js` exists
   - File size should be around 200KB+

## How to Launch Extension for Testing

### Method 1: Using F5 Debug Launch

1. **Open the extension in VS Code:**
   - File > Open Folder
   - Navigate to `/home/user/GUARD_RAIL/vscode-ai-supervisor`
   - Click "Open"

2. **Start debugging:**
   - Press **F5** (or Run > Start Debugging)
   - This will:
     - Automatically run the compile task
     - Open a new VS Code window titled "[Extension Development Host]"
     - Load the extension in the new window

3. **Verify extension activated:**
   - In the Extension Development Host window, open the Output panel (View > Output)
   - Select "Extension Host" from the dropdown
   - Look for: `AI Supervisor extension is now active`

### Method 2: Using Run and Debug View

1. Open the Run and Debug view (Ctrl+Shift+D)
2. Select "Run Extension" from the dropdown at the top
3. Click the green play button
4. Extension Development Host window opens

## What to Expect When Extension Loads

### First Launch (Welcome Message)

On first activation, you should see:
- An information message: "Welcome to AI Supervisor! Monitor and control AI code changes in real-time."
- Three action buttons:
  - "View Activity" - Opens Activity Monitor panel
  - "Set Goals" - Opens Goal Manager panel
  - "Learn More" - Opens documentation (external link)

### Activity Bar Icon

- Look for "AI Supervisor" icon in the left Activity Bar
- Icon should appear as a custom SVG (if assets exist) or default icon
- Click it to reveal the sidebar views

### Sidebar Views

When you click the AI Supervisor icon, you should see three views:

1. **Activity Monitor** - Shows real-time AI activity
2. **Project Goals** - Displays defined project goals
3. **Alerts & Issues** - Shows active alerts and warnings

## Testing Each Panel

### 1. Activity Monitor Panel

**Open the panel:**
- Method 1: Command Palette (Ctrl+Shift+P) > "AI Supervisor: Show Activity Monitor"
- Method 2: From sidebar "Activity Monitor" view, click the welcome link
- Method 3: Click on welcome message "View Activity" button

**What to expect:**
- New webview panel opens titled "AI Activity Monitor"
- Interactive dashboard with:
  - Activity timeline/list
  - Filter controls (status, file type, time range)
  - Real-time updates section
  - Export and clear buttons

**Test interactions:**
- Click filter buttons to filter activities
- Click "Clear Activity" to clear history (should show confirmation)
- Click "Export" to export activity log

### 2. Goal Manager Panel

**Open the panel:**
- Command Palette > "AI Supervisor: Manage Goals"
- From sidebar "Project Goals" view
- From welcome message "Set Goals" button

**What to expect:**
- Webview panel titled "Goal Manager"
- Interface showing:
  - List of defined goals (empty on first run)
  - "Add Goal" button
  - Goal cards with edit/delete options

**Test interactions:**
- Click "Add Goal" to create a new project goal
- Enter goal title and description
- Save and verify goal appears in list
- Edit existing goal
- Mark goal as complete
- Delete goal

### 3. Change Inspector Panel

**Open the panel:**
- Command Palette > "AI Supervisor: Inspect Changes"
- Keyboard shortcut (if configured)

**What to expect:**
- Webview panel titled "Change Inspector"
- Displays:
  - List of recent file changes
  - Diff viewer for each change
  - AI likelihood indicator
  - Change metadata (lines added/removed, timestamp)

**Test interactions:**
- Select a change from the list
- View the diff in the panel
- Review AI likelihood assessment
- Navigate between different changes

## Testing File Monitoring

### Setup Test Environment

1. In the Extension Development Host window, open a folder/workspace
2. The extension should automatically start monitoring

### Test File Changes

**Create new file:**
1. Create a new file (e.g., `test.js`)
2. Check Output panel for: "File created: test.js"
3. Activity should appear in Activity Monitor

**Modify file:**
1. Open an existing file
2. Make changes and save
3. Check for file change detection
4. Review in Change Inspector

**Delete file:**
1. Delete a file from workspace
2. Check for deletion detection
3. Verify alert appears (if configured)

### AI Detection Heuristics

The extension should detect AI-likely changes based on:
- **Rapid changes**: Multiple files changed within seconds
- **Large additions**: 50+ lines added at once
- **AI patterns**: Comments, documentation, consistent formatting
- **Formatting changes**: Large whitespace-only changes

**Test AI detection:**
1. Paste a large block of code (100+ lines) into a file
2. Save immediately
3. Check AI likelihood score in Change Inspector
4. Should show "High" likelihood with reasons listed

## Testing Commands

Open Command Palette (Ctrl+Shift+P) and test each command:

### Core Commands

1. **Show Activity Monitor** (`aiSupervisor.showActivityMonitor`)
   - Opens Activity Monitor panel
   - Panel should be reusable (click again to focus existing panel)

2. **Manage Goals** (`aiSupervisor.showGoalManager`)
   - Opens Goal Manager panel
   - Verify panel loads correctly

3. **Inspect Changes** (`aiSupervisor.showChangeInspector`)
   - Opens Change Inspector panel
   - Shows recent file changes

### Monitoring Control

4. **Pause Monitoring** (`aiSupervisor.pauseMonitoring`)
   - Shows info message: "AI Supervisor: Monitoring paused"
   - File watcher should stop detecting changes
   - Context menu should update

5. **Resume Monitoring** (`aiSupervisor.resumeMonitoring`)
   - Shows info message: "AI Supervisor: Monitoring resumed"
   - File watcher should restart
   - Changes should be detected again

### Utility Commands

6. **Generate Model Switch Handoff** (`aiSupervisor.generateHandoff`)
   - Generates handoff summary with:
     - Project context
     - Current goals
     - Recent changes
     - Active alerts
   - Options: "Copy to Clipboard", "Show Preview", "Cancel"

7. **Clear Activity History** (`aiSupervisor.clearHistory`)
   - Shows modal confirmation dialog
   - If confirmed, clears all stored activity data
   - Activity Monitor should show empty state

8. **Export Supervision Report** (`aiSupervisor.exportReport`)
   - **Free version**: Shows "Premium feature" message
   - **Premium**: Opens save dialog for .md or .json export

9. **Open Settings** (`aiSupervisor.openSettings`)
   - Opens VS Code settings filtered to AI Supervisor
   - Should show all extension settings

10. **Activate Premium License** (`aiSupervisor.activatePremium`)
    - Shows input box for license key
    - Format: XXXX-XXXX-XXXX-XXXX
    - Test with: `DEV-0000-0000-0000` (development key)
    - Should accept and show success message

## Testing Sidebar Views

### Activity View

1. Click "AI Supervisor" icon in Activity Bar
2. Expand "Activity Monitor" view
3. **Empty state**: Should show welcome message with "Start Monitoring" link
4. **With activity**: Should show recent activities in tree view

### Goals View

1. Expand "Project Goals" view
2. **Empty state**: Should show "Add First Goal" link
3. **With goals**: Should show goal items in tree view
4. Click goal to view details

### Alerts View

1. Expand "Alerts & Issues" view
2. **No alerts**: Should show "No issues detected"
3. **With alerts**: Should show warning/error items
4. Click alert to view details or jump to file

## Testing Configuration

### Access Settings

1. Command Palette > "Preferences: Open Settings (UI)"
2. Search for "AI Supervisor"
3. Verify all settings appear:

### Test Settings

**Monitoring Settings:**
- `aiSupervisor.monitoring.enabled` (boolean, default: true)
  - Toggle off: Should pause monitoring
  - Toggle on: Should resume monitoring

- `aiSupervisor.monitoring.sensitivity` (enum: low/medium/high)
  - Change value and verify it affects detection thresholds

**Alert Settings:**
- `aiSupervisor.alerts.showNotifications` (boolean, default: true)
  - Toggle to control toast notifications

- `aiSupervisor.alerts.severity` (enum: all/warning/error)
  - Change to filter which alerts appear

**Storage Settings:**
- `aiSupervisor.storage.retentionDays` (number, 1-365, default: 30)
  - Change retention period for activity data

- `aiSupervisor.storage.location` (enum: workspace/global)
  - Switch between workspace and global storage

**Premium Settings:**
- `aiSupervisor.premium.licenseKey` (string)
  - Enter license key here

## Expected Console Output

Open Developer Tools in Extension Development Host:
- **Menu**: Help > Toggle Developer Tools
- **Console tab**: Should show extension logs

### Normal Activation Logs

```
AI Supervisor extension is now active
Core services initialized successfully
Commands registered successfully
Webview providers registered successfully
AI Supervisor extension activation complete
```

### When Opening Panels

```
ActivityMonitorPanel created
Webview HTML generated
Activities loaded: 0
```

### When Files Change

```
File change detected: /path/to/file.js
AI likelihood: { isLikelyAI: true, confidence: 0.85, reasons: [...] }
Change recorded to storage
```

## Testing Error Handling

### Trigger Errors

1. **Invalid license key:**
   - Enter malformed key: "INVALID"
   - Should show error: "License key must be in format: XXXX-XXXX-XXXX-XXXX"

2. **Clear history with error:**
   - Manually corrupt workspace state
   - Try to clear history
   - Should show error message

3. **Export report without premium:**
   - Try to export report
   - Should show "Premium feature" dialog

## Performance Testing

### Check Extension Performance

1. **Activation time:**
   - Extension should activate in < 1 second
   - Check Output panel for timing logs

2. **File watching performance:**
   - Create 100 files quickly
   - Extension should handle without freezing
   - Activity Monitor should update smoothly

3. **Memory usage:**
   - Open Developer Tools > Memory profiler
   - Monitor memory during normal use
   - Should not exceed 50MB baseline

## Known Limitations

### What Won't Work (Expected)

1. **Missing assets:**
   - Extension icon and sidebar icon may show as default (assets not created)
   - Functionality is not affected

2. **Placeholder features:**
   - License validation is simplified (accepts DEV- keys)
   - AI detection is heuristic-based (not ML-powered yet)

3. **External dependencies:**
   - Core supervisor engine is commented out (not implemented yet)
   - Links to documentation may 404 (placeholder URLs)

### What Should Work

1. All UI panels open and render
2. Commands execute without errors
3. File watching detects changes
4. Settings can be modified
5. State persists between sessions
6. No console errors during normal operation

## Troubleshooting

### Extension Won't Activate

**Symptoms:**
- No "AI Supervisor" in Activity Bar
- Commands not found in Command Palette

**Solutions:**
1. Check Output > Extension Host for errors
2. Verify `dist/extension.js` exists
3. Rebuild: `npm run compile`
4. Check `package.json` has correct `main` field

### Panels Don't Open

**Symptoms:**
- Command executes but no webview appears
- Error in console

**Solutions:**
1. Check for JavaScript errors in Developer Tools
2. Verify webview HTML is being generated
3. Check file permissions on assets

### File Changes Not Detected

**Symptoms:**
- Files change but Activity Monitor stays empty
- No console logs for file changes

**Solutions:**
1. Check if monitoring is paused (Resume Monitoring)
2. Verify workspace folder is open
3. Check Output panel for FileWatcher errors
4. Confirm file is not in excluded path (node_modules, .git, etc.)

### Webview Shows Blank

**Symptoms:**
- Panel opens but content is empty
- White screen in webview

**Solutions:**
1. Open webview Developer Tools: Right-click panel > "Open Webview Developer Tools"
2. Check console for errors
3. Verify HTML content is being generated
4. Check CSP (Content Security Policy) issues

## Test Results Checklist

After completing manual tests, verify:

- [ ] Extension activates without errors
- [ ] All three panels open successfully
- [ ] File monitoring detects changes
- [ ] Commands execute correctly
- [ ] Settings can be modified
- [ ] State persists between reloads
- [ ] No critical errors in console
- [ ] Performance is acceptable
- [ ] UI is responsive and functional

## Reporting Issues

When reporting issues, include:
1. VS Code version
2. Extension version
3. Steps to reproduce
4. Expected vs actual behavior
5. Console errors (if any)
6. Screenshots (if UI issue)

## Next Steps

After manual testing is complete:
1. Document any bugs found
2. Create automated tests for critical paths
3. Prepare for packaging with `vsce package`
4. Test the packaged .vsix file
5. Submit to VS Code Marketplace (when ready)

---

**Testing Environment:**
- Extension Path: `/home/user/GUARD_RAIL/vscode-ai-supervisor/`
- Built Output: `/home/user/GUARD_RAIL/vscode-ai-supervisor/dist/extension.js`
- Package Version: 0.1.0
- VS Code Engine: ^1.85.0
