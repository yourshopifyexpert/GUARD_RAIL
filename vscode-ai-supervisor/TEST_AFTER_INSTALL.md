# 🧪 Testing Guide - After Installation

After installing the AI Supervisor extension, follow these tests to verify everything works correctly.

## Prerequisites

1. Extension is installed (via F5, VSIX, or direct install)
2. VS Code is open with a workspace/folder
3. Extension is activated (check status bar for AI Supervisor icon)

---

## Test 1: Extension Activation ✅

**What it tests:** Extension loads without errors

### Steps:
1. Open Command Palette: `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type: "AI Supervisor"
3. You should see multiple AI Supervisor commands

### Expected Result:
```
✅ AI Supervisor: Show Activity Monitor
✅ AI Supervisor: Manage Goals
✅ AI Supervisor: Inspect Changes
✅ AI Supervisor: Emergency Stop
✅ AI Supervisor: Lock File from AI Changes
... and more
```

### Troubleshooting:
- **No commands appear:** Extension didn't activate
  - Check: View → Output → Select "Extension Host" from dropdown
  - Look for error messages related to "AI Supervisor"

- **Error on activation:** Check console
  - Open: Help → Toggle Developer Tools
  - Look in Console tab for red errors

---

## Test 2: Activity Monitor 📊

**What it tests:** Main monitoring panel

### Steps:
1. `Ctrl+Shift+P` → "AI Supervisor: Show Activity Monitor"
2. Should open a webview panel

### Expected Result:
```
✅ Panel opens with:
   - Header: "AI Activity Monitor"
   - Empty state: "No AI activity detected yet"
   - Filter buttons: All, Success, Warning, Error
   - Export button visible
```

### Troubleshooting:
- **Panel doesn't open:** Check console for errors
- **Blank panel:** Webview failed to load
  - Check: src/panels/ActivityMonitor.ts is compiled

---

## Test 3: Goal Manager 🎯

**What it tests:** Goal creation and management

### Steps:
1. `Ctrl+Shift+P` → "AI Supervisor: Manage Goals"
2. Click "Add Goal" button
3. Fill in:
   - **Title:** "Build REST API"
   - **Description:** "Create a RESTful API with CRUD operations"
   - **Scope:** `src/api/**`
4. Click "Save"

### Expected Result:
```
✅ Goal appears in list with:
   - Title: "Build REST API"
   - Status: Active
   - Edit/Delete buttons visible
```

### Test Actions:
- **Edit goal:** Should open edit dialog
- **Delete goal:** Should remove from list
- **Use template:** Should populate fields

---

## Test 4: File Monitoring 👀

**What it tests:** File change detection

### Steps:
1. Open Activity Monitor
2. Create a new file: `test.js`
3. Add code:
```javascript
function hello() {
    console.log("Hello from AI");
}
```
4. Save file (`Ctrl+S`)
5. Check Activity Monitor

### Expected Result:
```
✅ Activity Monitor shows:
   - File: test.js
   - Change Type: create
   - AI Tool: Detected (or Unknown)
   - Status: success
   - Timestamp: just now
```

### Troubleshooting:
- **No activity appears:**
  - File watcher might not be initialized
  - Check Output → Extension Host for errors
  - Try making a larger change (50+ lines)

---

## Test 5: Emergency Stop 🚨

**What it tests:** Emergency pause functionality

### Steps:
1. Press keyboard shortcut: `Ctrl+Shift+Alt+S`
2. Check status bar (bottom of VS Code)

### Expected Result:
```
✅ Status bar shows: "🛑 AI PAUSED"
✅ Modal dialog appears: "Emergency Stop Activated"
```

### Resume:
1. `Ctrl+Shift+P` → "AI Supervisor: Resume AI Operations"
2. Status bar should change to: "✅ AI ACTIVE"

---

## Test 6: File Blocking 🛡️ (CRITICAL FEATURE)

**What it tests:** Real blocking of dangerous saves

### Steps:
1. Create file: `dangerous.js`
2. Add dangerous code:
```javascript
// Try to save this - extension should BLOCK it
eval(userInput);
delete database.users;
```
3. Try to save (`Ctrl+S`)

### Expected Result:
```
✅ Modal dialog appears BLOCKING the save:
   "🚫 SAVE BLOCKED: Code contains potentially dangerous patterns"

   Options:
   - Fix First (recommended)
   - Allow Anyway
   - Rollback
```

### Test Options:
- **Click "Fix First":** Save is blocked, dialog closes
- **Click "Allow Anyway":** File saves despite warning
- **Click "Rollback":** Reverts to previous content

### Troubleshooting:
- **No blocking occurs:**
  - Admin system might not be initialized
  - Check: `Ctrl+Shift+P` → "AI Supervisor: Show Admin Control Panel"
  - Verify FileSystemInterceptor is active

---

## Test 7: File Locking 🔒

**What it tests:** Preventing AI from modifying critical files

### Steps:
1. Open important file (e.g., `package.json`)
2. `Ctrl+Shift+P` → "AI Supervisor: Lock File from AI Changes"
3. Check for visual indicator

### Expected Result:
```
✅ File gets orange border decoration in editor
✅ Notification: "File locked: package.json"
✅ File appears in locked files list
```

### Test Locking:
1. Try to save locked file
2. Should show warning: "This file is locked"

### Unlock:
1. `Ctrl+Shift+P` → "AI Supervisor: Unlock File"
2. Orange border should disappear

---

## Test 8: Change Inspector 🔍

**What it tests:** Code review and approval

### Steps:
1. Make several changes to files
2. `Ctrl+Shift+P` → "AI Supervisor: Inspect Changes"
3. Panel should show recent changes

### Expected Result:
```
✅ Panel shows:
   - List of recent file changes
   - Each change has:
     * File path
     * Timestamp
     * Lines changed
     * Approve/Reject buttons
```

### Test Actions:
- **Click change:** Should show diff view
- **Approve:** Change gets marked as approved
- **Reject:** Shows dialog to revert

---

## Test 9: Guardian AI (Optional) 🤖

**What it tests:** AI-powered verification

### Prerequisites:
- Guardian AI configured (see INSTALL.md)
- API key set OR Ollama running locally

### Steps:
1. Set up guardian (if not done):
   - Settings → Search "AI Supervisor Guardian"
   - Set provider and API key
2. Create a goal: "Build secure authentication"
3. Make a file change that contradicts the goal
4. Wait 2-3 seconds

### Expected Result:
```
✅ Notification appears:
   "⚠️ Guardian Alert: Change may deviate from goal"

   Details:
   - Goal: Build secure authentication
   - Issue: Using weak password hashing
   - Confidence: 85%
   - Suggestion: Use bcrypt or argon2
```

### Test Guardian:
1. `Ctrl+Shift+P` → "AI Supervisor: Test Guardian Connection"
2. Should show success or error message

---

## Test 10: Admin Control Panel 🎛️

**What it tests:** Full admin dashboard

### Steps:
1. `Ctrl+Shift+P` → "AI Supervisor: Show Admin Control Panel"
2. Panel should open with dashboard

### Expected Result:
```
✅ Dashboard shows:
   - System Status (Active/Paused)
   - Locked Files count
   - Pending Approvals count
   - Recent Blocks list
   - Emergency Controls
   - Configuration settings
```

### Test Controls:
- **Pause AI:** Should pause all operations
- **Resume AI:** Should re-enable monitoring
- **Emergency Stop:** Should activate emergency mode

---

## Test 11: Export Report 📄

**What it tests:** Report generation

### Steps:
1. Make some changes (so there's data)
2. `Ctrl+Shift+P` → "AI Supervisor: Export Supervision Report"
3. Choose location to save

### Expected Result:
```
✅ File saved: ai-supervisor-report-[date].json
✅ Contains:
   - All activities
   - Goals
   - Guardian analyses
   - Statistics
```

---

## Test 12: Settings Configuration ⚙️

**What it tests:** Extension settings

### Steps:
1. `Ctrl+Shift+P` → "Preferences: Open Settings (UI)"
2. Search: "AI Supervisor"
3. Should see extension settings

### Expected Settings:
```
✅ aiSupervisor.monitoring.enabled
✅ aiSupervisor.guardian.provider
✅ aiSupervisor.guardian.apiKey
✅ aiSupervisor.guardian.model
✅ aiSupervisor.admin.blockMode
✅ aiSupervisor.admin.approvalRequired
✅ ... and more
```

### Test Changes:
- Toggle monitoring enabled
- Extension should respect the setting

---

## Troubleshooting Common Issues

### Extension Not Activating

**Symptom:** No AI Supervisor commands appear

**Solutions:**
1. Check extension is installed:
   - Extensions view (`Ctrl+Shift+X`)
   - Search "AI Supervisor"
   - Should show as installed

2. Reload window: `Ctrl+R` or `Cmd+R`

3. Check logs:
   - View → Output → "Extension Host"
   - Look for "AI Supervisor" messages

### Panels Not Opening

**Symptom:** Command runs but no panel appears

**Solutions:**
1. Check console for errors:
   - Help → Toggle Developer Tools
   - Console tab

2. Try: View → Appearance → Reset Workbench Layout

3. Uninstall and reinstall extension

### File Blocking Not Working

**Symptom:** Dangerous code saves without warning

**Solutions:**
1. Check admin system is active:
   - Open Admin Control Panel
   - Verify status is "Active"

2. Check block mode setting:
   - Settings → "aiSupervisor.admin.blockMode"
   - Should be "approval" or "strict"

3. Verify FileSystemInterceptor initialized:
   - Check Extension Host output
   - Look for "FileSystemInterceptor initialized"

### Guardian Not Working

**Symptom:** No AI analysis notifications

**Solutions:**
1. Verify guardian configured:
   - Settings → Check provider and API key

2. Test connection:
   - `AI Supervisor: Test Guardian Connection`

3. Check API key permissions:
   - OpenAI: Needs access to chat completions
   - Anthropic: Needs access to messages API

4. For Ollama:
   - Verify running: `ollama list`
   - Model pulled: `ollama pull llama3.1`

### Performance Issues

**Symptom:** VS Code slows down

**Solutions:**
1. Reduce monitoring sensitivity:
   - Settings → "aiSupervisor.monitoring.sensitivity"
   - Set to "low"

2. Disable guardian for large files:
   - Settings → "aiSupervisor.guardian.maxFileSize"
   - Set to smaller value (e.g., 1000 lines)

3. Clear history:
   - `AI Supervisor: Clear Activity History`

---

## Success Criteria

Your extension is working correctly if:

- ✅ All commands appear in Command Palette
- ✅ Activity Monitor shows file changes
- ✅ Goals can be created and edited
- ✅ Emergency Stop pauses operations
- ✅ **File blocking prevents dangerous saves**
- ✅ File locking adds visual decorations
- ✅ Change Inspector shows diffs
- ✅ Admin Control Panel displays status
- ✅ Export Report generates JSON file
- ✅ Settings are configurable
- ✅ No errors in console

---

## Next Steps After Successful Testing

1. **Configure Guardian AI** for smart monitoring
2. **Define Your Goals** for your project
3. **Lock Critical Files** (package.json, config files)
4. **Set Up Emergency Stop Hotkey** for quick access
5. **Review Activity Daily** to catch issues early

---

## Need More Help?

- See `INSTALL.md` for installation details
- See `ADMIN_CONTROL_SYSTEM.md` for admin features
- See `REAL_BLOCKING_EXAMPLES.md` for blocking examples
- Check VS Code console for error details

Happy testing! 🚀
