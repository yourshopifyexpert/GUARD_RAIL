import * as vscode from 'vscode';

/**
 * Activity item interface
 */
export interface ActivityItem {
    id: string;
    timestamp: number;
    file: string;
    changeType: 'create' | 'change' | 'delete';
    aiTool: string;
    status: 'success' | 'warning' | 'error';
    description: string;
    details?: string;
}

/**
 * Filter criteria interface
 */
interface FilterCriteria {
    status?: string;
    file?: string;
    startTime?: number;
    endTime?: number;
    searchQuery?: string;
}

/**
 * Panel for displaying real-time AI activity monitoring
 */
export class ActivityMonitorPanel {
    public static currentPanel: ActivityMonitorPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private _activities: ActivityItem[] = [];
    private _currentFilter: FilterCriteria = {};

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;

        // Load persisted activities
        this.loadActivities();

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
                    case 'ready':
                        this.sendActivitiesToWebview();
                        break;
                    case 'exportActivities':
                        this.handleExportActivities();
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
     * Add a new activity item
     */
    public addActivity(item: Omit<ActivityItem, 'id' | 'timestamp'>): void {
        const activity: ActivityItem = {
            id: this.generateId(),
            timestamp: Date.now(),
            ...item
        };

        this._activities.unshift(activity); // Add to beginning for newest-first

        // Limit to 1000 items to prevent memory issues
        if (this._activities.length > 1000) {
            this._activities = this._activities.slice(0, 1000);
        }

        // Persist to workspace state
        this.saveActivities();

        // Send update to webview
        this.sendActivitiesToWebview();
    }

    /**
     * Clear all activities
     */
    public clearActivity(): void {
        this._activities = [];
        this._currentFilter = {};
        this.saveActivities();
        this.sendActivitiesToWebview();
    }

    /**
     * Get all activities
     */
    public getActivities(): ActivityItem[] {
        return [...this._activities];
    }

    /**
     * Get filtered activities
     */
    public getFilteredActivities(filter?: FilterCriteria): ActivityItem[] {
        let filtered = [...this._activities];

        const activeFilter = filter || this._currentFilter;

        if (activeFilter.status && activeFilter.status !== 'all') {
            filtered = filtered.filter(a => a.status === activeFilter.status);
        }

        if (activeFilter.file) {
            filtered = filtered.filter(a =>
                a.file.toLowerCase().includes(activeFilter.file!.toLowerCase())
            );
        }

        if (activeFilter.searchQuery) {
            const query = activeFilter.searchQuery.toLowerCase();
            filtered = filtered.filter(a =>
                a.description.toLowerCase().includes(query) ||
                a.file.toLowerCase().includes(query) ||
                a.aiTool.toLowerCase().includes(query)
            );
        }

        if (activeFilter.startTime) {
            filtered = filtered.filter(a => a.timestamp >= activeFilter.startTime!);
        }

        if (activeFilter.endTime) {
            filtered = filtered.filter(a => a.timestamp <= activeFilter.endTime!);
        }

        return filtered;
    }

    /**
     * Handle filter activity request
     */
    private handleFilterActivity(filter: FilterCriteria): void {
        this._currentFilter = filter;
        this.sendActivitiesToWebview();
    }

    /**
     * Handle clear activity request
     */
    private handleClearActivity(): void {
        this.clearActivity();
        vscode.window.showInformationMessage('Activity history cleared');
    }

    /**
     * Handle export activities request
     */
    private async handleExportActivities(): Promise<void> {
        const activities = this.getFilteredActivities();

        if (activities.length === 0) {
            vscode.window.showWarningMessage('No activities to export');
            return;
        }

        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('ai-activity-export.json'),
            filters: {
                'JSON': ['json']
            }
        });

        if (uri) {
            const content = JSON.stringify(activities, null, 2);
            await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
            vscode.window.showInformationMessage(`Exported ${activities.length} activities to ${uri.fsPath}`);
        }
    }

    /**
     * Send activities to webview
     */
    private sendActivitiesToWebview(): void {
        const filtered = this.getFilteredActivities();
        this._panel.webview.postMessage({
            command: 'updateActivities',
            data: filtered
        });
    }

    /**
     * Load activities from workspace state
     */
    private loadActivities(): void {
        const context = this._panel.webview as any;
        // In a real implementation, you'd get this from the extension context
        // For now, we'll start with empty array
        this._activities = [];
    }

    /**
     * Save activities to workspace state
     */
    private saveActivities(): void {
        // In a real implementation, you'd save to extension context
        // For now, we keep them in memory
    }

    /**
     * Generate unique ID
     */
    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
     * Get the HTML content for the webview
     */
    private _getHtmlContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
        const nonce = this.getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>AI Activity Monitor</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            padding: 20px;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            background-color: var(--vscode-editor-background);
        }

        .header {
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .header h1 {
            font-size: 1.5em;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .status-success { background-color: #4caf50; }
        .status-warning { background-color: #ff9800; }
        .status-error { background-color: #f44336; }

        .header-actions {
            display: flex;
            gap: 8px;
        }

        .controls {
            margin-bottom: 20px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .filter-row {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            align-items: center;
        }

        .search-box {
            flex: 1;
            min-width: 200px;
            padding: 6px 12px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
        }

        .search-box:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }

        .filter-buttons {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 14px;
            cursor: pointer;
            border-radius: 2px;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            transition: background-color 0.2s;
        }

        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        button.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        button.active {
            background-color: var(--vscode-button-hoverBackground);
            border: 1px solid var(--vscode-focusBorder);
        }

        .stats {
            display: flex;
            gap: 20px;
            margin-bottom: 16px;
            padding: 12px;
            background-color: var(--vscode-editor-background);
            border-radius: 4px;
            border: 1px solid var(--vscode-panel-border);
        }

        .stat-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .stat-label {
            font-size: 0.85em;
            color: var(--vscode-descriptionForeground);
        }

        .stat-value {
            font-size: 1.2em;
            font-weight: 600;
        }

        .activity-list {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: calc(100vh - 350px);
            overflow-y: auto;
            padding: 4px;
        }

        .activity-list::-webkit-scrollbar {
            width: 10px;
        }

        .activity-list::-webkit-scrollbar-track {
            background: var(--vscode-scrollbarSlider-background);
        }

        .activity-list::-webkit-scrollbar-thumb {
            background: var(--vscode-scrollbarSlider-hoverBackground);
            border-radius: 5px;
        }

        .activity-item {
            padding: 12px;
            background-color: var(--vscode-editor-background);
            border-left: 4px solid var(--vscode-textLink-foreground);
            border-radius: 4px;
            transition: transform 0.2s, box-shadow 0.2s;
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .activity-item:hover {
            transform: translateX(4px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .activity-item.success {
            border-left-color: #4caf50;
        }

        .activity-item.warning {
            border-left-color: #ff9800;
        }

        .activity-item.error {
            border-left-color: #f44336;
        }

        .activity-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
        }

        .activity-title {
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .activity-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.75em;
            font-weight: 600;
            text-transform: uppercase;
        }

        .badge-create {
            background-color: rgba(76, 175, 80, 0.2);
            color: #4caf50;
        }

        .badge-change {
            background-color: rgba(33, 150, 243, 0.2);
            color: #2196f3;
        }

        .badge-delete {
            background-color: rgba(244, 67, 54, 0.2);
            color: #f44336;
        }

        .activity-time {
            color: var(--vscode-descriptionForeground);
            font-size: 0.85em;
        }

        .activity-description {
            margin-bottom: 8px;
            line-height: 1.4;
        }

        .activity-meta {
            display: flex;
            gap: 16px;
            font-size: 0.85em;
            color: var(--vscode-descriptionForeground);
        }

        .activity-meta-item {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .file-path {
            font-family: var(--vscode-editor-font-family);
            background-color: var(--vscode-textCodeBlock-background);
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.9em;
        }

        .ai-tool {
            font-weight: 500;
            color: var(--vscode-textLink-foreground);
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--vscode-descriptionForeground);
        }

        .empty-state-icon {
            font-size: 3em;
            margin-bottom: 16px;
            opacity: 0.5;
        }

        .empty-state-text {
            font-size: 1.1em;
            margin-bottom: 8px;
        }

        .empty-state-hint {
            font-size: 0.9em;
            opacity: 0.7;
        }

        .details-section {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid var(--vscode-panel-border);
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>
            <span class="status-indicator status-success"></span>
            AI Activity Monitor
        </h1>
        <div class="header-actions">
            <button class="secondary" onclick="exportActivities()">Export</button>
            <button class="secondary" onclick="clearAll()">Clear All</button>
        </div>
    </div>

    <div class="stats" id="stats">
        <div class="stat-item">
            <span class="stat-label">Total Activities</span>
            <span class="stat-value" id="totalCount">0</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Success</span>
            <span class="stat-value" style="color: #4caf50;" id="successCount">0</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Warnings</span>
            <span class="stat-value" style="color: #ff9800;" id="warningCount">0</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Errors</span>
            <span class="stat-value" style="color: #f44336;" id="errorCount">0</span>
        </div>
    </div>

    <div class="controls">
        <div class="filter-row">
            <input
                type="text"
                class="search-box"
                id="searchBox"
                placeholder="Search activities (file, tool, description)..."
                onkeyup="handleSearch()"
            />
        </div>
        <div class="filter-buttons">
            <button class="active" onclick="filterByStatus('all')">All</button>
            <button onclick="filterByStatus('success')">Success</button>
            <button onclick="filterByStatus('warning')">Warnings</button>
            <button onclick="filterByStatus('error')">Errors</button>
            <button class="secondary" onclick="filterByTime('1h')">Last Hour</button>
            <button class="secondary" onclick="filterByTime('24h')">Last 24h</button>
            <button class="secondary" onclick="filterByTime('all')">All Time</button>
        </div>
    </div>

    <ul class="activity-list" id="activityList">
        <li class="empty-state">
            <div class="empty-state-icon">📊</div>
            <div class="empty-state-text">No AI activity detected yet</div>
            <div class="empty-state-hint">Make some changes to see them here</div>
        </li>
    </ul>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        let currentFilter = { status: 'all' };
        let allActivities = [];

        // Notify extension that webview is ready
        vscode.postMessage({ command: 'ready' });

        function filterByStatus(status) {
            currentFilter.status = status;
            applyFilter();
            updateActiveButton();
        }

        function filterByTime(period) {
            const now = Date.now();
            if (period === '1h') {
                currentFilter.startTime = now - (60 * 60 * 1000);
            } else if (period === '24h') {
                currentFilter.startTime = now - (24 * 60 * 60 * 1000);
            } else {
                delete currentFilter.startTime;
            }
            applyFilter();
        }

        function handleSearch() {
            const query = document.getElementById('searchBox').value;
            currentFilter.searchQuery = query;
            applyFilter();
        }

        function applyFilter() {
            vscode.postMessage({
                command: 'filterActivity',
                filter: currentFilter
            });
        }

        function updateActiveButton() {
            document.querySelectorAll('.filter-buttons button').forEach(btn => {
                btn.classList.remove('active');
            });

            const activeBtn = Array.from(document.querySelectorAll('.filter-buttons button'))
                .find(btn => btn.textContent.toLowerCase().includes(currentFilter.status));

            if (activeBtn) {
                activeBtn.classList.add('active');
            }
        }

        function clearAll() {
            if (confirm('Are you sure you want to clear all activity history?')) {
                vscode.postMessage({ command: 'clearActivity' });
            }
        }

        function exportActivities() {
            vscode.postMessage({ command: 'exportActivities' });
        }

        function formatTime(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now - date;

            if (diff < 60000) {
                return 'Just now';
            } else if (diff < 3600000) {
                return Math.floor(diff / 60000) + ' minutes ago';
            } else if (diff < 86400000) {
                return Math.floor(diff / 3600000) + ' hours ago';
            } else {
                return date.toLocaleString();
            }
        }

        function getFileName(filePath) {
            const parts = filePath.split(/[\\/]/);
            return parts[parts.length - 1];
        }

        function updateStats(activities) {
            const total = activities.length;
            const success = activities.filter(a => a.status === 'success').length;
            const warning = activities.filter(a => a.status === 'warning').length;
            const error = activities.filter(a => a.status === 'error').length;

            document.getElementById('totalCount').textContent = total;
            document.getElementById('successCount').textContent = success;
            document.getElementById('warningCount').textContent = warning;
            document.getElementById('errorCount').textContent = error;
        }

        function updateActivityList(activities) {
            allActivities = activities;
            const list = document.getElementById('activityList');

            if (!activities || activities.length === 0) {
                list.innerHTML = \`
                    <li class="empty-state">
                        <div class="empty-state-icon">📊</div>
                        <div class="empty-state-text">No activities found</div>
                        <div class="empty-state-hint">Try adjusting your filters</div>
                    </li>
                \`;
                updateStats([]);
                return;
            }

            updateStats(activities);

            list.innerHTML = activities.map(activity => \`
                <li class="activity-item \${activity.status}">
                    <div class="activity-header">
                        <div class="activity-title">
                            <span class="activity-badge badge-\${activity.changeType}">\${activity.changeType}</span>
                            <span>\${activity.description}</span>
                        </div>
                        <span class="activity-time">\${formatTime(activity.timestamp)}</span>
                    </div>
                    <div class="activity-meta">
                        <div class="activity-meta-item">
                            <span>📁</span>
                            <span class="file-path" title="\${activity.file}">\${getFileName(activity.file)}</span>
                        </div>
                        <div class="activity-meta-item">
                            <span>🤖</span>
                            <span class="ai-tool">\${activity.aiTool}</span>
                        </div>
                        <div class="activity-meta-item">
                            <span>\${activity.status === 'success' ? '✅' : activity.status === 'warning' ? '⚠️' : '❌'}</span>
                            <span>\${activity.status}</span>
                        </div>
                    </div>
                    \${activity.details ? \`
                        <div class="details-section">
                            \${activity.details}
                        </div>
                    \` : ''}
                </li>
            \`).join('');

            // Auto-scroll to top for newest items
            list.scrollTop = 0;
        }

        // Handle messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateActivities':
                    updateActivityList(message.data);
                    break;
            }
        });
    </script>
</body>
</html>`;
    }

    /**
     * Generate a nonce for CSP
     */
    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
