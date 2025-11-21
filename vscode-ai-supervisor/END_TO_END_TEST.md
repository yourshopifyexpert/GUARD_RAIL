# AI Supervisor Extension - End-to-End Testing Guide

## Overview
This document provides comprehensive testing instructions for the AI Supervisor VSCode extension, including expected behavior, known limitations, and verification steps.

## Prerequisites
- VSCode version 1.85.0 or higher
- Node.js 16.0.0 or higher
- TypeScript 5.3.2 or higher

## Build and Installation

### 1. Build the Extension

```bash
cd /home/user/GUARD_RAIL/vscode-ai-supervisor
npm install
npm run compile
```

**Expected Output:**
- Extension builds successfully with `extension.js` in the `dist/` directory
- Build size: ~220KB
- Some TypeScript warnings may appear (non-blocking)

### 2. Run Extension in Development Mode

#### Method A: Using F5 (Launch and Debug)
1. Open the vscode-ai-supervisor folder in VSCode
2. Press `F5` or select "Run > Start Debugging"
3. A new VSCode window (Extension Development Host) will open
4. The AI Supervisor extension is now active in the new window

#### Method B: Using Command Line
```bash
code --extensionDevelopmentPath=/home/user/GUARD_RAIL/vscode-ai-supervisor
```

## Core Feature Testing

### Test 1: Extension Activation

**Steps:**
1. Launch extension in development mode (F5)
2. Check the Output panel (View > Output, select "AI Supervisor" channel)
3. Check for the AI Supervisor icon in the Activity Bar (left sidebar)

**Expected Behavior:**
- ✅ Extension activates without errors
- ✅ Welcome message appears (first time only): "Welcome to AI Supervisor! Monitor and control AI code changes in real-time."
- ✅ AI Supervisor icon appears in Activity Bar
- ✅ Console logs show: "AI Supervisor extension is now active"
- ✅ Three views appear in sidebar:
  - Activity Monitor
  - Project Goals
  - Alerts & Issues

**Verification:**
```javascript
// Check console output
"AI Supervisor extension is now active"
"Core services initialized successfully"
"Commands registered successfully"
"File watcher initialized"
```

---

### Test 2: Activity Monitor Panel

**Steps:**
1. Open Command Palette (`Cmd/Ctrl + Shift + P`)
2. Type and select: "AI Supervisor: Show Activity Monitor"
3. A new webview panel should open

**Expected Behavior:**
- ✅ Activity Monitor panel opens in editor area
- ✅ UI displays with 4 statistics boxes:
  - Total Activities: 0
  - Success: 0
  - Warnings: 0
  - Errors: 0
- ✅ Search box and filter buttons are visible
- ✅ Empty state message: "No AI activity detected yet"
- ✅ Export and Clear All buttons are present

**UI Elements:**
- Header with pulsing status indicator (green)
- Search input box
- Filter buttons: All, Success, Warnings, Errors
- Time filter buttons: Last Hour, Last 24h, All Time
- Statistics dashboard
- Activity list area

**Interactive Testing:**
```javascript
// Test Filter Buttons
1. Click "Success" - button should become highlighted
2. Click "Warnings" - previous highlight should move
3. Search box should accept text input
4. Export button should be clickable
5. Clear All should prompt for confirmation
```

---

### Test 3: File Change Detection

**Steps:**
1. Ensure extension is running
2. Open or create a test workspace folder
3. Create a new file: `test.js`
4. Add some code:
```javascript
function hello() {
    console.log("Hello, World!");
}
```
5. Save the file
6. Make additional changes (add/modify/delete lines)
7. Check the Output panel and Activity Monitor

**Expected Behavior:**
- ✅ File watcher detects file creation
- ✅ File watcher detects file changes
- ✅ Console logs show: "File create: /path/to/test.js"
- ✅ Console logs show: "File change: /path/to/test.js"
- ✅ AI likelihood assessment is calculated
- ✅ Changes are tracked in memory

**Verification:**
```
// Console Output Example
File create: /workspace/test.js (AI likely: false)
Processing change: { type: 'create', timestamp: 1234567890 }
File change: /workspace/test.js (AI likely: true)
Processing change: { type: 'change', timestamp: 1234567900 }
```

**Known Limitation:** Activity items are not yet automatically displayed in the Activity Monitor panel due to integration layer issues. Manual refresh will be needed once integrated.

---

### Test 4: Goal Manager Panel

**Steps:**
1. Open Command Palette
2. Select: "AI Supervisor: Manage Goals"
3. Goal Manager panel opens

**Expected Behavior:**
- ✅ Panel opens with "Add New Goal" section
- ✅ Input fields visible:
  - Goal Title (text input)
  - Description (textarea)
  - Scope/Files (text input)
  - Priority (dropdown: Low, Medium, High, Critical)
- ✅ "Add Goal" button is present
- ✅ Empty state shows: "No goals defined yet"

**Interactive Testing:**
1. Fill in goal details:
   - Title: "Implement user authentication"
   - Description: "Add login/logout functionality"
   - Scope: "src/auth/**"
   - Priority: "High"
2. Click "Add Goal"
3. Goal should appear in the goals list
4. Goal should have edit/delete action buttons

**Expected Goal Card:**
```
┌─────────────────────────────────────┐
│ 🎯 Implement user authentication   │
│                              [HIGH] │
├─────────────────────────────────────┤
│ Add login/logout functionality      │
│                                     │
│ 📁 Scope: src/auth/**              │
│ 📅 Created: [timestamp]            │
│                                     │
│ [Edit] [Complete] [Delete]         │
└─────────────────────────────────────┘
```

---

### Test 5: Change Inspector Panel

**Steps:**
1. Open Command Palette
2. Select: "AI Supervisor: Inspect Changes"
3. Panel opens showing recent code changes

**Expected Behavior:**
- ✅ Panel displays with change history
- ✅ Each change shows:
  - File path
  - Timestamp
  - Change type (create/modify/delete)
  - Line counts (+/- indicators)
- ✅ Click on a change to see diff viewer
- ✅ Syntax-highlighted diff display
- ✅ Filter options (by file, date, type)

**Visual Layout:**
```
Recent Changes (Last 24h)
┌─────────────────────────────────────┐
│ 📄 test.js                    10:23 │
│ +15 lines | -3 lines        [VIEW]  │
├─────────────────────────────────────┤
│ 📄 config.json                09:45 │
│ +2 lines | -0 lines         [VIEW]  │
└─────────────────────────────────────┘
```

---

### Test 6: Command Functionality

**Test all commands via Command Palette:**

#### 6.1 Pause/Resume Monitoring
```
Command: "AI Supervisor: Pause Monitoring"
Expected: Notification "AI Supervisor: Monitoring paused"
         File watcher stops detecting changes

Command: "AI Supervisor: Resume Monitoring"
Expected: Notification "AI Supervisor: Monitoring resumed"
         File watcher starts detecting changes again
```

#### 6.2 Generate Model Switch Handoff
```
Command: "AI Supervisor: Generate Model Switch Handoff"
Expected: Dialog with options:
         - Copy to Clipboard
         - Show Preview
         - Cancel

Selecting "Show Preview" opens a Markdown document with:
- Project Context
- Current Goals
- Recent Changes
- Active Issues/Alerts
- Deviations Detected
- Next Steps
- Statistics
```

#### 6.3 Clear History
```
Command: "AI Supervisor: Clear Activity History"
Expected: Confirmation modal
         "Are you sure you want to clear all activity history?"
         [Clear History] [Cancel]

After confirmation: "Activity history cleared successfully"
```

#### 6.4 Export Report
```
Command: "AI Supervisor: Export Supervision Report"
Expected: Premium feature prompt (free version)
         OR file save dialog (premium version)

Premium users see: Save dialog for .md or .json
Report includes full statistics and history
```

#### 6.5 Open Settings
```
Command: "AI Supervisor: Open Settings"
Expected: Settings UI opens filtered to AI Supervisor settings
Shows:
- Monitoring enabled/disabled
- Sensitivity level (low/medium/high)
- Alert preferences
- Storage options
- Premium license key
```

---

## Configuration Testing

### Test 7: Settings Validation

**Open Settings (UI or JSON):**
```json
{
  "aiSupervisor.monitoring.enabled": true,
  "aiSupervisor.monitoring.sensitivity": "medium",
  "aiSupervisor.alerts.showNotifications": true,
  "aiSupervisor.alerts.severity": "all",
  "aiSupervisor.storage.retentionDays": 30,
  "aiSupervisor.storage.location": "workspace",
  "aiSupervisor.detection.aiTools": [
    "github.copilot",
    "continue.continue",
    "sourcegraph.cody"
  ]
}
```

**Test each setting:**
1. Toggle `monitoring.enabled` → Extension pauses/resumes
2. Change `sensitivity` → Affects deviation detection threshold
3. Toggle `alerts.showNotifications` → Enables/disables toast notifications
4. Change `retentionDays` → Affects data cleanup
5. Add/remove AI tools from detection list

---

## Integration Testing

### Test 8: Multi-Panel Workflow

**Complete User Journey:**
1. **Setup Phase**
   - Extension activates successfully
   - Open Goal Manager
   - Create goal: "Add dark mode support"
   - Set scope: "src/theme/**"

2. **Development Phase**
   - Create files in `src/theme/` folder
   - Make changes outside scope (e.g., `src/auth/login.js`)
   - Expected: Deviation detection (once fully integrated)

3. **Monitoring Phase**
   - Open Activity Monitor
   - Verify file changes are listed
   - Filter by status and time
   - Export activity log

4. **Review Phase**
   - Open Change Inspector
   - Review all changes
   - Identify which changes align with goals
   - Generate handoff summary

5. **Model Switch**
   - Run "Generate Model Switch Handoff"
   - Copy summary to clipboard
   - Paste in new AI chat session
   - Continue development with context

---

## Performance Testing

### Test 9: Load Testing

**Large File Changes:**
1. Create 50+ files rapidly
2. Make bulk changes using find/replace
3. Monitor extension performance

**Expected:**
- ✅ No significant VSCode slowdown
- ✅ File watcher handles burst of events
- ✅ Activity buffer limits to 1000 items
- ✅ Older entries cleaned up automatically

**Memory Check:**
```bash
# Monitor extension host process
ps aux | grep "extensionHost"
# Should not exceed 200MB for normal usage
```

---

## Known Issues and Limitations

### Working Features ✅
1. ✅ Extension activation and initialization
2. ✅ All three webview panels (Activity Monitor, Goal Manager, Change Inspector)
3. ✅ File system watcher for code changes
4. ✅ Command registration and execution
5. ✅ Settings management
6. ✅ Pause/Resume monitoring
7. ✅ Model switch handoff generation
8. ✅ Activity export
9. ✅ Goal creation and management UI
10. ✅ Change diff viewing UI

### Partial/In-Progress Features ⚠️
1. ⚠️ **Core Engine Integration**: The ai-supervisor-core has type mismatches and needs fixes
2. ⚠️ **Deviation Detection**: Algorithm implemented but not fully integrated
3. ⚠️ **Alert System**: AlertManager has compilation errors
4. ⚠️ **AI Tool Detection**: Framework present but needs refinement
5. ⚠️ **Database Persistence**: Schema defined but storage layer needs work
6. ⚠️ **Real-time Panel Updates**: Panels display correctly but don't auto-update on file changes

### Not Yet Implemented ❌
1. ❌ Automatic deviation alerts
2. ❌ Premium license validation (stub implementation)
3. ❌ Background analysis
4. ❌ Advanced diff algorithms
5. ❌ Multi-workspace support
6. ❌ Remote collaboration features

---

## Error Scenarios

### Test 10: Error Handling

**Test graceful degradation:**

1. **No Workspace Open**
   - Launch extension without workspace
   - Expected: Extension activates, shows "No workspace" message

2. **Invalid Goal Data**
   - Try creating goal without title
   - Expected: Validation error, goal not created

3. **File Permission Errors**
   - Watch read-only file
   - Expected: Error logged, extension continues

4. **Corrupted Storage**
   - Delete workspace state
   - Expected: Extension resets to defaults

---

## Troubleshooting

### Extension Not Activating
1. Check VSCode version (must be 1.85.0+)
2. Check Output panel for errors
3. Verify `dist/extension.js` exists
4. Try `Developer: Reload Window`

### Panels Not Opening
1. Check for JavaScript errors in Developer Tools (Help > Toggle Developer Tools)
2. Verify commands are registered: Check Command Palette
3. Check webview CSP settings

### File Watcher Not Detecting Changes
1. Check if monitoring is paused
2. Verify file type is in watched list
3. Check exclude patterns in settings
4. Try manual reload

### Performance Issues
1. Reduce retention days in settings
2. Limit file watcher patterns
3. Disable background analysis (premium feature)
4. Clear activity history

---

## Automated Testing (Future)

**Unit Tests (Planned):**
```bash
npm run test:unit
```

**Integration Tests (Planned):**
```bash
npm run test:integration
```

**E2E Tests (Planned):**
```bash
npm run test:e2e
```

---

## Verification Checklist

Use this checklist to verify the extension works end-to-end:

- [ ] Extension activates without errors
- [ ] Welcome message appears (first run)
- [ ] Activity Monitor panel opens
- [ ] Goal Manager panel opens
- [ ] Change Inspector panel opens
- [ ] File watcher detects new files
- [ ] File watcher detects file changes
- [ ] File watcher detects file deletions
- [ ] Pause/Resume monitoring works
- [ ] Activity statistics update
- [ ] Filter buttons work in Activity Monitor
- [ ] Search works in Activity Monitor
- [ ] Export activities works
- [ ] Clear history works (with confirmation)
- [ ] Goals can be created
- [ ] Goals can be edited
- [ ] Goals can be deleted
- [ ] Model switch handoff generates
- [ ] Handoff can be copied to clipboard
- [ ] Settings can be changed
- [ ] Settings changes affect behavior
- [ ] No console errors in normal operation
- [ ] Extension performs well with many files
- [ ] Extension cleans up on deactivation

---

## Manual Test Results Log

**Test Date:** _________________

**Tester:** _________________

**VSCode Version:** _________________

**Extension Version:** 0.1.0

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Extension Activation | ⬜ Pass ⬜ Fail | |
| 2 | Activity Monitor Panel | ⬜ Pass ⬜ Fail | |
| 3 | File Change Detection | ⬜ Pass ⬜ Fail | |
| 4 | Goal Manager Panel | ⬜ Pass ⬜ Fail | |
| 5 | Change Inspector Panel | ⬜ Pass ⬜ Fail | |
| 6 | Commands | ⬜ Pass ⬜ Fail | |
| 7 | Settings | ⬜ Pass ⬜ Fail | |
| 8 | Multi-Panel Workflow | ⬜ Pass ⬜ Fail | |
| 9 | Load Testing | ⬜ Pass ⬜ Fail | |
| 10 | Error Handling | ⬜ Pass ⬜ Fail | |

---

## Screenshots Reference

*Note: Screenshots should be added here showing:*
1. Extension activated in Activity Bar
2. Activity Monitor panel UI
3. Goal Manager panel UI
4. Change Inspector panel UI
5. Command Palette with AI Supervisor commands
6. Settings page
7. Model switch handoff preview
8. Activity statistics and filters

---

## Support and Feedback

For issues, questions, or feedback:
- GitHub Issues: https://github.com/your-org/ai-supervisor/issues
- Documentation: https://github.com/your-org/ai-supervisor#readme
- Email: support@your-domain.com

---

**Last Updated:** 2025-11-21
**Document Version:** 1.0
**Extension Version:** 0.1.0
