# Activity Monitor - Quick Start Guide

## 1. Open the Panel

```typescript
import { ActivityMonitorPanel } from './panels/ActivityMonitor';

// In your command or activation
ActivityMonitorPanel.createOrShow(context.extensionUri);
```

## 2. Add Activities

```typescript
// Success activity
ActivityMonitorPanel.currentPanel?.addActivity({
    file: '/workspace/src/app.ts',
    changeType: 'create',
    aiTool: 'GitHub Copilot',
    status: 'success',
    description: 'Created new authentication module'
});

// Warning activity
ActivityMonitorPanel.currentPanel?.addActivity({
    file: '/workspace/config.json',
    changeType: 'change',
    aiTool: 'Cursor AI',
    status: 'warning',
    description: 'Modified configuration settings',
    details: 'Review changes to ensure compatibility'
});

// Error activity
ActivityMonitorPanel.currentPanel?.addActivity({
    file: '/workspace/.env',
    changeType: 'change',
    aiTool: 'Claude Code',
    status: 'error',
    description: 'Modified environment file',
    details: 'CRITICAL: .env should not be committed'
});
```

## 3. Query Activities

```typescript
// Get all activities
const all = ActivityMonitorPanel.currentPanel?.getActivities();

// Get only errors
const errors = ActivityMonitorPanel.currentPanel?.getFilteredActivities({
    status: 'error'
});

// Get recent activities (last hour)
const recent = ActivityMonitorPanel.currentPanel?.getFilteredActivities({
    startTime: Date.now() - (60 * 60 * 1000)
});

// Search activities
const matching = ActivityMonitorPanel.currentPanel?.getFilteredActivities({
    searchQuery: 'authentication'
});
```

## 4. Clear Activities

```typescript
ActivityMonitorPanel.currentPanel?.clearActivity();
```

## 5. Register Command (in extension.ts)

```typescript
export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-supervisor.showActivityMonitor', () => {
            ActivityMonitorPanel.createOrShow(context.extensionUri);
        })
    );
}
```

## 6. Add to package.json

```json
{
  "contributes": {
    "commands": [
      {
        "command": "ai-supervisor.showActivityMonitor",
        "title": "AI Supervisor: Show Activity Monitor"
      }
    ]
  }
}
```

## ActivityItem Interface

```typescript
interface ActivityItem {
    id: string;           // Auto-generated
    timestamp: number;    // Auto-generated (Date.now())
    file: string;         // Full file path
    changeType: 'create' | 'change' | 'delete';
    aiTool: string;       // Name of AI tool
    status: 'success' | 'warning' | 'error';
    description: string;  // Human-readable description
    details?: string;     // Optional additional info
}
```

## UI Features Available

- ✅ Real-time search box
- ✅ Status filters (All/Success/Warning/Error)
- ✅ Time filters (1h/24h/All time)
- ✅ Statistics dashboard
- ✅ Export to JSON
- ✅ Clear all with confirmation
- ✅ Auto-scroll to newest
- ✅ Color-coded activities
- ✅ Relative timestamps
- ✅ VS Code theme integration

## File Locations

- **Main**: `/home/user/GUARD_RAIL/vscode-ai-supervisor/src/panels/ActivityMonitor.ts`
- **Examples**: `/home/user/GUARD_RAIL/vscode-ai-supervisor/src/examples/ActivityMonitorExample.ts`
- **Full Guide**: `/home/user/GUARD_RAIL/vscode-ai-supervisor/ACTIVITY_MONITOR_INTEGRATION.md`
- **Status**: `/home/user/GUARD_RAIL/vscode-ai-supervisor/ACTIVITY_MONITOR_COMPLETE.md`

## That's It!

The panel is production-ready with zero TODOs. Just import and use! 🚀
