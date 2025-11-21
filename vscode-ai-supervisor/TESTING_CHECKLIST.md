# AI Supervisor Extension - Testing Checklist

## Pre-Testing Setup

- [ ] Node.js and npm installed
- [ ] VS Code version 1.85.0 or higher installed
- [ ] Extension directory opened in VS Code: `/home/user/GUARD_RAIL/vscode-ai-supervisor/`

## Build Verification

- [ ] `npm install` completed successfully (0 vulnerabilities)
- [ ] `npm run compile` completed successfully
- [ ] `dist/extension.js` exists and is ~200KB+
- [ ] `dist/extension.js.map` exists (source map)
- [ ] No compilation errors in terminal
- [ ] Webpack compiled successfully message shown

## Extension Activation

- [ ] Press F5 to launch Extension Development Host
- [ ] Extension Development Host window opens
- [ ] "AI Supervisor extension is now active" appears in Output panel
- [ ] "Core services initialized successfully" logged
- [ ] "Commands registered successfully" logged
- [ ] "Extension activation complete" logged
- [ ] No errors in Output > Extension Host
- [ ] Welcome message appears on first activation
- [ ] AI Supervisor icon appears in Activity Bar

## Panel Testing

### Activity Monitor Panel

- [ ] Opens via Command Palette: "AI Supervisor: Show Activity Monitor"
- [ ] Opens via welcome message "View Activity" button
- [ ] Opens via sidebar Activity Monitor view
- [ ] Panel title shows "AI Activity Monitor"
- [ ] Webview content loads (not blank)
- [ ] Activity list/timeline visible
- [ ] Filter controls rendered
- [ ] "Clear Activity" button works
- [ ] "Export" button appears
- [ ] Clicking panel again focuses existing panel (doesn't create duplicate)
- [ ] Panel can be moved to different editor groups
- [ ] Panel retains state when hidden and shown again

### Goal Manager Panel

- [ ] Opens via Command Palette: "AI Supervisor: Manage Goals"
- [ ] Opens via welcome message "Set Goals" button
- [ ] Opens via sidebar Project Goals view
- [ ] Panel title shows "Goal Manager"
- [ ] Webview content loads correctly
- [ ] "Add Goal" button visible
- [ ] Can create new goal with title and description
- [ ] Goals appear in list after creation
- [ ] Can edit existing goal
- [ ] Can mark goal as complete
- [ ] Can delete goal
- [ ] Goals persist after closing and reopening panel
- [ ] Empty state shows helpful message

### Change Inspector Panel

- [ ] Opens via Command Palette: "AI Supervisor: Inspect Changes"
- [ ] Panel title shows "Change Inspector"
- [ ] Webview content loads correctly
- [ ] Change list displays recent file changes
- [ ] Diff viewer shows file changes
- [ ] AI likelihood indicator visible
- [ ] Change metadata shown (lines added/removed, timestamp)
- [ ] Can navigate between different changes
- [ ] Empty state shows when no changes detected

## File Monitoring

### Basic File Operations

- [ ] Create new file - detected and logged
- [ ] Modify existing file - change detected
- [ ] Save file - change event triggered
- [ ] Delete file - deletion detected
- [ ] Console logs show file change events
- [ ] Activity Monitor updates with new changes
- [ ] Change Inspector shows diff for modifications

### AI Detection Heuristics

- [ ] Large paste (100+ lines) detected as high AI likelihood
- [ ] Rapid changes across files flagged as AI-likely
- [ ] Formatting-only changes detected correctly
- [ ] Manual small edits show lower AI likelihood
- [ ] AI likelihood reasons provided in metadata
- [ ] Confidence score calculated (0.0 to 1.0)

### Exclusions Working

- [ ] Changes in `node_modules/` ignored
- [ ] Changes in `.git/` ignored
- [ ] Changes in `dist/` or `out/` ignored
- [ ] Changes in `.vscode/` ignored (if configured)
- [ ] Only workspace files monitored

## Command Execution

### Core Commands

- [ ] `aiSupervisor.showActivityMonitor` - Opens panel
- [ ] `aiSupervisor.showGoalManager` - Opens panel
- [ ] `aiSupervisor.showChangeInspector` - Opens panel

### Monitoring Control

- [ ] `aiSupervisor.pauseMonitoring` - Shows "Monitoring paused" message
- [ ] File changes not detected while paused
- [ ] Context updates when paused
- [ ] `aiSupervisor.resumeMonitoring` - Shows "Monitoring resumed" message
- [ ] File changes detected again after resume
- [ ] Context updates when resumed

### Utility Commands

- [ ] `aiSupervisor.generateHandoff` - Generates handoff summary
- [ ] Handoff includes project context, goals, recent changes
- [ ] "Copy to Clipboard" button works
- [ ] "Show Preview" opens markdown preview
- [ ] `aiSupervisor.clearHistory` - Shows confirmation dialog
- [ ] Confirming clear removes all activity data
- [ ] Canceling clear leaves data intact
- [ ] `aiSupervisor.exportReport` - Shows premium prompt (free version)
- [ ] `aiSupervisor.exportReport` - Works with license (premium version)
- [ ] `aiSupervisor.openSettings` - Opens settings filtered to AI Supervisor
- [ ] `aiSupervisor.activatePremium` - Shows license input dialog
- [ ] DEV license key accepted: `DEV-0000-0000-0000`
- [ ] Invalid format rejected with error message
- [ ] Valid license shows success message

## Sidebar Views

### Activity View (Tree View)

- [ ] Appears in AI Supervisor sidebar container
- [ ] Shows "Activity Monitor" title with pulse icon
- [ ] Empty state: "No AI activity detected yet" message
- [ ] Empty state: "Start Monitoring" link works
- [ ] With activity: Shows activity items in tree
- [ ] Activity items clickable
- [ ] Refreshes when new changes detected

### Goals View (Tree View)

- [ ] Shows "Project Goals" title with target icon
- [ ] Empty state: "Define your project goals" message
- [ ] Empty state: "Add First Goal" link works
- [ ] With goals: Shows goal items in tree
- [ ] Completed goals shown differently
- [ ] Goal click opens details or editor

### Alerts View (Tree View)

- [ ] Shows "Alerts & Issues" title with warning icon
- [ ] Empty state: No alerts message
- [ ] With alerts: Shows alert items by severity
- [ ] Info alerts shown with info icon
- [ ] Warning alerts shown with warning icon
- [ ] Error alerts shown with error icon
- [ ] Alert click shows details or jumps to file

## Configuration Testing

### Monitoring Settings

- [ ] `aiSupervisor.monitoring.enabled` toggles monitoring on/off
- [ ] Setting to false pauses file watcher
- [ ] Setting to true resumes file watcher
- [ ] `aiSupervisor.monitoring.sensitivity` accepts: low, medium, high
- [ ] Changing sensitivity affects detection thresholds

### Alert Settings

- [ ] `aiSupervisor.alerts.showNotifications` toggles toast notifications
- [ ] Setting to false suppresses notification popups
- [ ] Setting to true shows notifications
- [ ] `aiSupervisor.alerts.severity` filters alerts: all, warning, error
- [ ] Changing severity filters which alerts appear

### Storage Settings

- [ ] `aiSupervisor.storage.retentionDays` accepts 1-365
- [ ] Default is 30 days
- [ ] Changes retention period for activity data
- [ ] `aiSupervisor.storage.location` switches: workspace vs global
- [ ] Workspace storage is project-specific
- [ ] Global storage is user-wide

### Premium Settings

- [ ] `aiSupervisor.premium.licenseKey` accepts string
- [ ] Entering key activates premium features
- [ ] Invalid key shows error
- [ ] Valid key persists across sessions

## State Persistence

- [ ] Goals saved to workspace state
- [ ] Goals persist after closing VS Code
- [ ] Activity history saved to global state
- [ ] Activity persists across sessions
- [ ] Panel state retained when hidden
- [ ] Settings changes saved immediately
- [ ] First activation flag works (welcome shown once)

## Error Handling

- [ ] Invalid license key format shows error message
- [ ] Export report without premium shows upgrade prompt
- [ ] Clear history shows confirmation (prevents accidental deletion)
- [ ] Missing workspace folder handled gracefully
- [ ] Corrupt state data doesn't crash extension
- [ ] File read errors logged but don't stop extension
- [ ] Network errors handled (if license validation added)
- [ ] Webview errors don't crash extension host

## Performance

- [ ] Extension activation completes in < 1 second
- [ ] File watcher responds to changes in < 500ms
- [ ] Large file changes don't freeze UI
- [ ] Creating 100 files doesn't cause lag
- [ ] Webview rendering is smooth
- [ ] Memory usage stays under 50MB baseline
- [ ] No memory leaks after extended use
- [ ] CPU usage stays reasonable during file monitoring

## Console Output Verification

### Expected Logs (No Errors)

- [ ] Output > Extension Host shows activation logs
- [ ] No error messages during activation
- [ ] File change events logged correctly
- [ ] Panel creation logged
- [ ] Command execution logged
- [ ] No webpack warnings
- [ ] No TypeScript errors

### Developer Tools (Extension Development Host)

- [ ] Help > Toggle Developer Tools opens
- [ ] Console tab shows no critical errors
- [ ] Network tab shows no failed requests (if applicable)
- [ ] No CSP (Content Security Policy) violations
- [ ] Webview Developer Tools accessible (right-click panel)

## Edge Cases

- [ ] Opening panel when already open focuses existing
- [ ] Disposing panel cleans up resources
- [ ] Reopening extension after deactivation works
- [ ] Multiple workspace folders handled
- [ ] Workspace with no folders shows appropriate message
- [ ] Very large files (1MB+) don't cause hangs
- [ ] Binary files ignored by change detection
- [ ] Symbolic links handled correctly
- [ ] Hidden files (starting with .) handled appropriately

## UI/UX Verification

- [ ] All panels have appropriate titles
- [ ] Icons display correctly (or fallback icons shown)
- [ ] Buttons have clear labels
- [ ] Input fields have placeholders
- [ ] Form validation provides clear error messages
- [ ] Success messages shown for completed actions
- [ ] Loading states shown for async operations
- [ ] Webview styling is readable and consistent
- [ ] Dark theme support works
- [ ] Light theme support works
- [ ] High contrast themes work

## Cleanup & Disposal

- [ ] Closing panel disposes webview correctly
- [ ] Deactivating extension cleans up file watchers
- [ ] No lingering timers or intervals
- [ ] Event listeners properly removed
- [ ] Temporary files cleaned up
- [ ] Memory released on disposal
- [ ] No zombie processes after extension stop

## Known Issues (Document These)

### Non-Critical Issues

- [ ] Missing icon files (functionality works, icons are default)
- [ ] Placeholder documentation links (404)
- [ ] License validation simplified (accepts DEV- keys)
- [ ] Core supervisor engine commented out (UI works)

### Critical Issues (Must Fix)

- [ ] List any crashes or showstopper bugs here
- [ ] List any data loss issues
- [ ] List any security vulnerabilities

## Integration Testing

- [ ] Works with other extensions installed
- [ ] Doesn't conflict with VS Code Git integration
- [ ] Doesn't interfere with debugging
- [ ] Doesn't slow down editor typing
- [ ] Works with multiple editor windows open

## Final Verification

- [ ] All critical features working
- [ ] No console errors during normal use
- [ ] Extension can be reloaded (Developer: Reload Window)
- [ ] Extension can be stopped and restarted
- [ ] Ready for packaging with `vsce package`
- [ ] Ready for marketplace submission (after fixes)

## Test Environment

**Details:**
- Extension Path: `/home/user/GUARD_RAIL/vscode-ai-supervisor/`
- Build Output: `dist/extension.js` (exists: ✅)
- Package Version: 0.1.0
- Node Modules: ✅ Installed (872 packages)
- Compilation: ✅ Successful (webpack)
- VS Code Engine: ^1.85.0

## Testing Sign-Off

**Tested By:** _________________
**Date:** _________________
**VS Code Version:** _________________
**Build Status:** ✅ Success / ⚠️ Issues Found / ❌ Failed

**Overall Assessment:**
- [ ] Ready for alpha testing
- [ ] Ready for beta testing
- [ ] Ready for production release
- [ ] Needs additional work

**Critical Blockers:** (List any issues preventing release)

**Notes:**
