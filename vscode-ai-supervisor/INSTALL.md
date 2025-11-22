# AI Supervisor Extension - Installation Guide

## Method 1: Quick Test (Development Mode) ⚡

**Best for:** Immediate testing and development

### Steps:
1. Open VS Code
2. Open this folder: `/home/user/GUARD_RAIL/vscode-ai-supervisor`
3. Press `F5` (or Run → Start Debugging)
4. A new VS Code window opens with "[Extension Development Host]" in the title
5. The extension is now active in that window

### Test it:
- Open Command Palette: `Ctrl+Shift+P`
- Type: "AI Supervisor"
- Try commands like:
  - `AI Supervisor: Show Activity Monitor`
  - `AI Supervisor: Manage Goals`
  - `AI Supervisor: Emergency Stop`

---

## Method 2: Install VSIX Package (Production-like) 📦

**Best for:** Testing like a real user would

### Steps:

1. **Package the extension:**
```bash
cd /home/user/GUARD_RAIL/vscode-ai-supervisor
npm install -g @vscode/vsce
vsce package
```

This creates: `ai-supervisor-0.1.0.vsix`

2. **Install the VSIX:**
- Open VS Code
- Go to Extensions view (`Ctrl+Shift+X`)
- Click `...` (More Actions) at top
- Select "Install from VSIX..."
- Choose `ai-supervisor-0.1.0.vsix`

3. **Reload VS Code**
- Click "Reload" when prompted

---

## Method 3: Direct Install (Development) 🔧

**Best for:** Continuous development

### Steps:

1. **Link the extension:**
```bash
cd /home/user/GUARD_RAIL/vscode-ai-supervisor
npm run compile
```

2. **Manually copy to VS Code extensions folder:**

**Linux:**
```bash
mkdir -p ~/.vscode/extensions/ai-supervisor-0.1.0
cp -r /home/user/GUARD_RAIL/vscode-ai-supervisor/* ~/.vscode/extensions/ai-supervisor-0.1.0/
```

**Windows:**
```cmd
xcopy /E /I "C:\path\to\vscode-ai-supervisor" "%USERPROFILE%\.vscode\extensions\ai-supervisor-0.1.0"
```

**macOS:**
```bash
mkdir -p ~/.vscode/extensions/ai-supervisor-0.1.0
cp -r /path/to/vscode-ai-supervisor/* ~/.vscode/extensions/ai-supervisor-0.1.0/
```

3. **Reload VS Code:** `Ctrl+R` or `Cmd+R`

---

## ⚙️ Configuration (After Installation)

### 1. Set up a Guardian AI Provider

The extension needs an AI model to verify code changes. Choose one:

#### Option A: OpenAI (GPT-4)
```json
// settings.json
{
  "aiSupervisor.guardian.provider": "openai",
  "aiSupervisor.guardian.apiKey": "sk-..." // Your OpenAI API key
}
```

#### Option B: Anthropic (Claude)
```json
{
  "aiSupervisor.guardian.provider": "anthropic",
  "aiSupervisor.guardian.apiKey": "sk-ant-..." // Your Anthropic API key
}
```

#### Option C: Ollama (FREE - runs locally)
```bash
# Install Ollama first: https://ollama.ai
ollama pull llama3.1
```
```json
{
  "aiSupervisor.guardian.provider": "ollama",
  "aiSupervisor.guardian.model": "llama3.1"
}
```

#### Option D: Google Gemini
```json
{
  "aiSupervisor.guardian.provider": "google",
  "aiSupervisor.guardian.apiKey": "AIza..." // Your Google API key
}
```

### 2. Define Your First Goal

- Open Command Palette: `Ctrl+Shift+P`
- Run: `AI Supervisor: Manage Goals`
- Click "Add Goal"
- Example:
  ```
  Title: Build REST API
  Description: Create a RESTful API with authentication and CRUD endpoints
  Scope: src/api/**
  ```

---

## 🧪 Testing the Extension

### Test 1: Activity Monitoring
1. Open Activity Monitor: `Ctrl+Shift+P` → `AI Supervisor: Show Activity Monitor`
2. Make a file change (add/edit code)
3. Save the file
4. Check Activity Monitor - should show the change

### Test 2: Real Blocking (Admin Controls)
1. Create a test file: `test.js`
2. Add suspicious code:
```javascript
eval(userInput);  // Dangerous!
```
3. Try to save (`Ctrl+S`)
4. **The extension should BLOCK the save** with a warning dialog!

### Test 3: Emergency Stop
1. Press `Ctrl+Shift+Alt+S` (emergency stop shortcut)
2. Status bar should show "🛑 AI PAUSED"
3. Try making changes - they should be blocked
4. Resume with: `AI Supervisor: Resume AI Operations`

### Test 4: File Locking
1. Open a critical file (e.g., `package.json`)
2. Run: `AI Supervisor: Lock File from AI Changes`
3. File gets orange border decoration
4. AI cannot modify locked files

---

## 🔍 Verify Installation

Run this checklist:

- [ ] Extension appears in Extensions list
- [ ] Activity Monitor opens without errors
- [ ] Goal Manager opens and allows adding goals
- [ ] Status bar shows AI Supervisor status
- [ ] Commands appear in Command Palette
- [ ] File save blocking works for dangerous code
- [ ] Emergency stop pauses AI operations

---

## 📊 View Logs (Troubleshooting)

If something doesn't work:

1. **View Extension Logs:**
   - `Ctrl+Shift+P` → "Developer: Show Logs"
   - Select "Extension Host"

2. **Check Console:**
   - `Ctrl+Shift+P` → "Developer: Toggle Developer Tools"
   - Look for errors in Console tab

3. **Common Issues:**

   **Extension not activating?**
   - Check `package.json` has correct `activationEvents`
   - Verify compilation succeeded: `npm run compile`

   **Guardian not working?**
   - Verify API key is set in settings
   - Check API key has correct permissions
   - For Ollama: verify it's running (`ollama list`)

   **Commands not appearing?**
   - Reload window: `Ctrl+R`
   - Check extension is enabled in Extensions view

---

## 🚀 Quick Start Commands

Once installed, try these:

| Command | Shortcut | Description |
|---------|----------|-------------|
| **Show Activity Monitor** | - | View all AI changes |
| **Manage Goals** | - | Define project objectives |
| **Emergency Stop** | `Ctrl+Shift+Alt+S` | Pause all AI operations |
| **Lock File** | - | Prevent AI from modifying file |
| **Admin Control Panel** | - | Full monitoring dashboard |
| **Approve Pending Changes** | - | Review and approve AI edits |

---

## 📖 Next Steps

1. ✅ **Configure Guardian AI** - Set up your AI provider
2. ✅ **Define Goals** - Tell the extension what you're building
3. ✅ **Make Changes** - Work normally, extension monitors in background
4. ✅ **Review Alerts** - Get notified when AI deviates from goals
5. ✅ **Use Admin Controls** - Block/approve changes as needed

---

## 💡 Pro Tips

- **Use Ollama for privacy** - All processing happens locally, no API costs
- **Lock critical files** - Prevent AI from touching `package.json`, config files
- **Set up emergency stop hotkey** - Quick access when AI goes rogue
- **Review Activity Monitor daily** - Catch issues early
- **Export activity logs** - Keep records of all AI changes

---

## 🆘 Need Help?

Check the documentation:
- `README.md` - Feature overview
- `ADMIN_CONTROL_SYSTEM.md` - Admin features
- `REAL_BLOCKING_EXAMPLES.md` - Blocking capabilities
- `ADMIN_TESTING.md` - Manual testing guide

Happy supervising! 🎯
