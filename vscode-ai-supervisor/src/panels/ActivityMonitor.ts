import * as vscode from 'vscode';

/**
 * Panel for displaying real-time AI activity monitoring
 */
export class ActivityMonitorPanel {
    public static currentPanel: ActivityMonitorPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;

        // Set the webview's initial html content
        this._panel.webview.html = this._getHtmlContent(this._panel.webview, extensionUri);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'filterActivity':
                        this.handleFilterActivity(message.filter);
                        break;
                    case 'clearActivity':
                        this.handleClearActivity();
                        break;
                }
            },
            null,
            this._disposables
        );

        // Handle panel disposal
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    /**
     * Create or show the activity monitor panel
     */
    public static createOrShow(extensionUri: vscode.Uri): void {
        const column = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.One;

        // If we already have a panel, show it
        if (ActivityMonitorPanel.currentPanel) {
            ActivityMonitorPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            'aiSupervisorActivity',
            'AI Activity Monitor',
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );

        ActivityMonitorPanel.currentPanel = new ActivityMonitorPanel(panel, extensionUri);
    }

    /**
     * Dispose the panel
     */
    public static dispose(): void {
        ActivityMonitorPanel.currentPanel?.dispose();
        ActivityMonitorPanel.currentPanel = undefined;
    }

    /**
     * Clean up resources
     */
    private dispose(): void {
        ActivityMonitorPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    /**
     * Handle filter activity request
     */
    private handleFilterActivity(filter: any): void {
        // TODO: Implement filtering logic
        console.log('Filter activity:', filter);
    }

    /**
     * Handle clear activity request
     */
    private handleClearActivity(): void {
        // TODO: Implement clear logic
        console.log('Clear activity');
    }

    /**
     * Update the panel with new activity data
     */
    public updateActivity(activity: any): void {
        this._panel.webview.postMessage({
            command: 'updateActivity',
            data: activity
        });
    }

    /**
     * Get the HTML content for the webview
     */
    private _getHtmlContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Activity Monitor</title>
    <style>
        body {
            padding: 20px;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
        }
        .header {
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-active { background-color: #4caf50; }
        .status-warning { background-color: #ff9800; }
        .status-error { background-color: #f44336; }
        .activity-list {
            list-style: none;
            padding: 0;
        }
        .activity-item {
            padding: 12px;
            margin-bottom: 8px;
            background-color: var(--vscode-editor-background);
            border-left: 3px solid var(--vscode-textLink-foreground);
            border-radius: 4px;
        }
        .activity-item.warning {
            border-left-color: #ff9800;
        }
        .activity-item.error {
            border-left-color: #f44336;
        }
        .activity-time {
            color: var(--vscode-descriptionForeground);
            font-size: 0.9em;
        }
        .filter-controls {
            margin-bottom: 16px;
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            cursor: pointer;
            border-radius: 2px;
            margin-right: 8px;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .empty-state {
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>
            <span class="status-indicator status-active"></span>
            AI Activity Monitor
        </h1>
    </div>

    <div class="filter-controls">
        <button onclick="filterByType('all')">All</button>
        <button onclick="filterByType('changes')">Changes</button>
        <button onclick="filterByType('warnings')">Warnings</button>
        <button onclick="filterByType('errors')">Errors</button>
    </div>

    <ul class="activity-list" id="activityList">
        <li class="empty-state">
            No AI activity detected yet. Make some changes to see them here.
        </li>
    </ul>

    <script>
        const vscode = acquireVsCodeApi();

        function filterByType(type) {
            vscode.postMessage({
                command: 'filterActivity',
                filter: { type }
            });
        }

        // Handle messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateActivity':
                    updateActivityList(message.data);
                    break;
            }
        });

        function updateActivityList(activities) {
            const list = document.getElementById('activityList');
            if (!activities || activities.length === 0) {
                list.innerHTML = '<li class="empty-state">No AI activity detected yet.</li>';
                return;
            }

            list.innerHTML = activities.map(activity => `
                <li class="activity-item ${activity.severity || ''}">
                    <div>${activity.description}</div>
                    <div class="activity-time">${new Date(activity.timestamp).toLocaleString()}</div>
                </li>
            `).join('');
        }
    </script>
</body>
</html>`;
    }
}
