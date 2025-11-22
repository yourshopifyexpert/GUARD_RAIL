# Admin Control Testing Guide

This guide provides step-by-step instructions for manually testing all AI Supervisor admin control features.

## Prerequisites

1. Install the AI Supervisor extension
2. Open a workspace in VS Code
3. Ensure Guardian AI is configured (Settings → AI Supervisor → Guardian)
4. Have some sample code files ready for testing

## Test Suite

### Test 1: Block Dangerous Save ⛔

**Purpose:** Verify that dangerous code changes are blocked before saving.

**Steps:**
1. Create a new JavaScript file: `test-sql.js`
2. Add the following code with SQL injection:
   ```javascript
   async function getUser(userId) {
       const query = 'SELECT * FROM users WHERE id=' + userId;
       return await db.query(query);
   }
   ```
3. Press `Ctrl+S` (or `Cmd+S` on Mac) to save

**Expected Results:**
- ✅ Modal dialog appears with error message
- ✅ Dialog indicates SQL injection vulnerability
- ✅ File is NOT saved
- ✅ Status bar shows block count incremented
- ✅ Block appears in Admin Control Panel under "Recent Blocks"

**Verification:**
- Check status bar: Should show "🚫 1 blocks today"
- Open Admin Panel: Should list the block with timestamp and reason

---

### Test 2: Lock File 🔒

**Purpose:** Verify that files can be locked from AI modifications.

**Steps:**
1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Run command: `AI Supervisor: Open Admin Control Panel`
3. In the "Locked Files" section, click `+ Lock File`
4. Select `package.json` from the file picker
5. Enter reason: "Critical dependency file"
6. Try to open and edit `package.json`

**Expected Results:**
- ✅ File appears in "Locked Files" list in Admin Panel
- ✅ File appears in sidebar tree view (if enabled)
- ✅ Warning shown when trying to edit locked file
- ✅ AI cannot make changes to locked file

**Verification:**
- Check Admin Panel → Locked Files section
- Check VS Code sidebar → AI Supervisor → Locked Files view
- Try editing the file and verify warning appears

---

### Test 3: Approval Mode ⏳

**Purpose:** Verify that approval mode requires user consent for changes.

**Steps:**
1. Open Admin Control Panel
2. Change "Edit Mode" dropdown to "Approval"
3. Create a new file: `test-approval.js`
4. Add code:
   ```javascript
   function calculateTotal(items) {
       return items.reduce((sum, item) => sum + item.price, 0);
   }
   ```
5. Press `Ctrl+S` to save

**Expected Results:**
- ✅ Status bar shows "🔒 Approval" mode
- ✅ For AI-generated changes, approval dialog appears
- ✅ Dialog shows risk level and confidence
- ✅ Options: Approve, Reject, View Diff
- ✅ Change appears in "Pending Approvals" section

**Verification:**
- Check status bar for mode indicator
- Verify approval dialog appears for large changes
- Check Admin Panel → Pending Approvals

---

### Test 4: Emergency Stop 🛑

**Purpose:** Verify that emergency stop immediately halts all AI operations.

**Steps:**
1. Open Admin Control Panel
2. Scroll to "Emergency Controls" section (red background)
3. Click "🛑 EMERGENCY STOP" button
4. Confirm the action in the dialog
5. Try to make AI-assisted edits

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ After confirmation, modal message: "EMERGENCY STOP ACTIVATED"
- ✅ Status bar shows "⏸️ AI: Paused"
- ✅ Edit mode changes to "🔒 LOCKED"
- ✅ No AI operations are allowed
- ✅ All pending changes are cleared

**Verification:**
- Check status bar: Should show paused and locked
- Try running AI commands: Should be blocked
- Check Admin Panel: All sections should reflect stopped state

---

### Test 5: Unlock File 🔓

**Purpose:** Verify that locked files can be unlocked.

**Steps:**
1. Open Admin Control Panel
2. Find a locked file in the "Locked Files" section
3. Click "🔓 Unlock" button next to the file
4. Try to edit the file

**Expected Results:**
- ✅ File is removed from "Locked Files" list
- ✅ File disappears from sidebar tree view
- ✅ No warning when editing the file
- ✅ AI can now modify the file

**Verification:**
- Check Admin Panel: File should not appear in locked list
- Edit the file: No warnings should appear
- Check sidebar: File should not be in locked files tree

---

### Test 6: View Block Details 📊

**Purpose:** Verify that block history can be reviewed.

**Steps:**
1. Trigger a block (see Test 1)
2. Open Admin Control Panel
3. Find the block in "Recent Blocks" section
4. Click "View Details" button

**Expected Results:**
- ✅ Details dialog or panel opens
- ✅ Shows: timestamp, file, reason, risk level
- ✅ Shows the code that was blocked
- ✅ Shows Guardian AI analysis if available

**Verification:**
- Verify all details are displayed correctly
- Check that timestamp is accurate
- Verify reason clearly explains why it was blocked

---

### Test 7: Edit Mode Switching 🔄

**Purpose:** Verify that edit mode can be changed and affects behavior.

**Steps:**
1. Open Admin Control Panel
2. Test each edit mode:
   - **Permissive:** Allow all changes (no approval needed)
   - **Approval:** Require approval for changes
   - **Locked:** Block all AI changes
3. Make a code change in each mode

**Expected Results:**

**Permissive Mode:**
- ✅ Status bar shows "$(unlock) Permissive"
- ✅ Changes are applied immediately
- ✅ No approval dialogs

**Approval Mode:**
- ✅ Status bar shows "🔒 Approval"
- ✅ Changes require approval
- ✅ Approval dialog appears for each change

**Locked Mode:**
- ✅ Status bar shows "🔒 Locked" with red background
- ✅ All AI changes are blocked
- ✅ Error message appears on attempted change

**Verification:**
- Check status bar after each mode change
- Make test edits in each mode
- Verify behavior matches expected mode

---

### Test 8: Status Bar Indicators 📊

**Purpose:** Verify that status bar shows correct information.

**Steps:**
1. Look at the VS Code status bar (bottom of window)
2. Verify all indicators are present and correct:
   - AI execution status
   - Edit mode
   - Guardian status
   - Block count
3. Click each indicator

**Expected Results:**
- ✅ All four indicators are visible
- ✅ Shows: "AI: Running | Approval | Guardian: GPT-4o | 0 blocks"
- ✅ Clicking "AI: Running" opens Admin Panel
- ✅ Clicking "Approval" opens edit mode picker
- ✅ Clicking "Guardian" opens guardian configuration
- ✅ Clicking block count opens block history

**Verification:**
- All indicators visible and readable
- Click behavior works correctly
- Status updates in real-time

---

### Test 9: Rollback Last Change ↩️

**Purpose:** Verify that the last change can be rolled back.

**Steps:**
1. Make a change to a file and save
2. Open Admin Control Panel
3. Click "↩️ ROLLBACK LAST" in Emergency Controls
4. Confirm the action

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Last change is reverted
- ✅ File returns to previous state
- ✅ Notification confirms rollback

**Verification:**
- Open the file: Should show previous content
- Check git history if version controlled
- Verify notification appeared

---

### Test 10: Reset All 🔄

**Purpose:** Verify that all admin state can be reset.

**Steps:**
1. Create some locked files, blocks, and pending approvals
2. Open Admin Control Panel
3. Click "🔄 RESET ALL" in Emergency Controls
4. Confirm the action

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ All locked files are unlocked
- ✅ All blocks are cleared
- ✅ All pending approvals are cleared
- ✅ Edit mode returns to "Approval"
- ✅ Block count resets to 0

**Verification:**
- Check Admin Panel: All lists should be empty
- Check status bar: Should show default values
- Check sidebar: Locked files tree should be empty

---

## Automated Tests

Run automated test suite:

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run: `AI Supervisor: Run Admin Tests`
3. Check Output panel for results

Expected output:
```
🧪 Starting Admin Control Tests...

✅ SQL Injection Block
✅ Locked File Edit Prevention
✅ Emergency Stop
✅ Approval Mode
✅ File Unlock
✅ Block History Tracking
✅ Edit Mode Switching
✅ Status Bar Updates

Total: 8 | Passed: 8 | Failed: 0
Success Rate: 100%
```

---

## Demo Mode

To see all features in action:

1. Open Command Palette
2. Run: `AI Supervisor: Run Admin Control Demo`
3. Watch as the demo:
   - Shows normal operation
   - Triggers a security block
   - Demonstrates approval flow
   - Locks a file
   - Executes emergency stop
   - Runs Guardian analysis

---

## Troubleshooting

### Status Bar Not Showing

**Solution:**
1. Check Settings → AI Supervisor → Enable monitoring
2. Restart VS Code
3. Check View → Appearance → Show Status Bar

### Locks Not Working

**Solution:**
1. Verify file path is correct (relative to workspace)
2. Check Settings → AI Supervisor → Admin → Locked Files
3. Refresh the locked files tree view

### Guardian Not Analyzing

**Solution:**
1. Check API key is configured
2. Verify internet connection
3. Check Settings → AI Supervisor → Guardian → Enable Analysis
4. Test connection: Command Palette → "Test Guardian Connection"

### Blocks Not Being Recorded

**Solution:**
1. Check monitoring is enabled
2. Verify Guardian is active
3. Check auto-analyze setting
4. Review Output panel for errors

---

## Test Checklist

Use this checklist to track testing progress:

- [ ] Test 1: Block Dangerous Save
- [ ] Test 2: Lock File
- [ ] Test 3: Approval Mode
- [ ] Test 4: Emergency Stop
- [ ] Test 5: Unlock File
- [ ] Test 6: View Block Details
- [ ] Test 7: Edit Mode Switching
- [ ] Test 8: Status Bar Indicators
- [ ] Test 9: Rollback Last Change
- [ ] Test 10: Reset All
- [ ] Automated Tests
- [ ] Demo Mode

---

## Reporting Issues

If you encounter any issues during testing:

1. Note which test failed
2. Record the exact error message
3. Check the Output panel (View → Output → AI Supervisor)
4. Check the Developer Console (Help → Toggle Developer Tools)
5. Report with:
   - VS Code version
   - AI Supervisor version
   - Test that failed
   - Error message
   - Steps to reproduce

---

## Success Criteria

All tests pass when:
- ✅ No errors in Output panel
- ✅ All status indicators work correctly
- ✅ Dangerous code is blocked
- ✅ File locks prevent modifications
- ✅ Emergency stop halts all operations
- ✅ Approval mode works as expected
- ✅ All UI elements are responsive
- ✅ Automated tests show 100% pass rate

---

**Happy Testing! 🎉**
