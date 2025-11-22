# 🚀 Quick Install Guide - AI Supervisor Extension

## FASTEST WAY (Development Mode):

```bash
cd /home/user/GUARD_RAIL/vscode-ai-supervisor
code .
# Press F5 when VS Code opens
```

That's it! The extension launches in a new window.

---

## OR Use the Install Script:

```bash
cd /home/user/GUARD_RAIL/vscode-ai-supervisor
./install.sh
```

The script will guide you through:
1. Development mode (F5)
2. Package as VSIX
3. Install to VS Code extensions folder

---

## After Installation:

### 1. Test It Works:
```
Ctrl+Shift+P → "AI Supervisor: Show Activity Monitor"
```

### 2. Set Up Guardian AI (Optional but Recommended):

**FREE Option (runs locally):**
```bash
# Install Ollama: https://ollama.ai
ollama pull llama3.1
```

Then in VS Code settings:
```json
{
  "aiSupervisor.guardian.provider": "ollama",
  "aiSupervisor.guardian.model": "llama3.1"
}
```

**Paid Options (better accuracy):**
- OpenAI GPT-4: Set `"aiSupervisor.guardian.apiKey": "sk-..."`
- Anthropic Claude: Set `"aiSupervisor.guardian.apiKey": "sk-ant-..."`
- Google Gemini: Set `"aiSupervisor.guardian.apiKey": "AIza..."`

### 3. Try These Commands:

| Command | Shortcut |
|---------|----------|
| Show Activity Monitor | - |
| Emergency Stop | `Ctrl+Shift+Alt+S` |
| Manage Goals | - |
| Lock Current File | - |
| Admin Control Panel | - |

---

## Test Blocking Feature:

1. Create file: `test.js`
2. Add dangerous code: `eval(userInput);`
3. Try to save (`Ctrl+S`)
4. **Extension BLOCKS the save!** ✅

---

## Full Documentation:

- **INSTALL.md** - Detailed installation guide
- **README.md** - Feature overview  
- **ADMIN_CONTROL_SYSTEM.md** - Admin capabilities
- **REAL_BLOCKING_EXAMPLES.md** - Blocking proof

Need help? Check the docs above!
