import * as vscode from 'vscode';

/**
 * Admin Control Panel - Main dashboard for AI Supervisor admin functions
 * Provides centralized control over AI execution, file locks, approvals, and emergency controls
 */
export class AdminControlPanel {
    public static currentPanel: AdminControlPanel | undefined;
    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this.panel = panel;
        this.extensionUri = extensionUri;

        // Set the webview's initial html content
        this.update();

        // Listen for when the panel is disposed
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(
            message => {
                switch (message.type) {
                    case 'pauseAI':
                        this.handlePauseAI();
                        break;
                    case 'stopAI':
                        this.handleStopAI();
                        break;
                    case 'setEditMode':
                        this.handleSetEditMode(message.mode);
                        break;
                    case 'lockFile':
                        this.handleLockFile();
                        break;
                    case 'unlockFile':
                        this.handleUnlockFile(message.file);
                        break;
                    case 'approveChange':
                        this.handleApproveChange(message.changeId);
                        break;
                    case 'rejectChange':
                        this.handleRejectChange(message.changeId);
                        break;
                    case 'viewDiff':
                        this.handleViewDiff(message.changeId);
                        break;
                    case 'viewBlockDetails':
                        this.handleViewBlockDetails(message.blockId);
                        break;
                    case 'emergencyStop':
                        this.handleEmergencyStop();
                        break;
                    case 'rollbackLast':
                        this.handleRollbackLast();
                        break;
                    case 'resetAll':
                        this.handleResetAll();
                        break;
                    case 'refresh':
                        this.update();
                        break;
                }
            },
            null,
            this.disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri): void {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (AdminControlPanel.currentPanel) {
            AdminControlPanel.currentPanel.panel.reveal(column);
            AdminControlPanel.currentPanel.update();
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            'aiSupervisorAdminPanel',
            '🛡️ AI Supervisor - Admin Control Panel',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
            }
        );

        AdminControlPanel.currentPanel = new AdminControlPanel(panel, extensionUri);
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri): void {
        AdminControlPanel.currentPanel = new AdminControlPanel(panel, extensionUri);
    }

    public dispose(): void {
        AdminControlPanel.currentPanel = undefined;

        // Clean up resources
        this.panel.dispose();

        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    private async update(): Promise<void> {
        const webview = this.panel.webview;

        this.panel.title = '🛡️ AI Supervisor - Admin Control Panel';
        this.panel.webview.html = this.getHtmlForWebview(webview);
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        // Get current state
        const config = vscode.workspace.getConfiguration('aiSupervisor');
        const lockedFiles = this.getLockedFiles();
        const pendingApprovals = this.getPendingApprovals();
        const recentBlocks = this.getRecentBlocks();
        const isAIRunning = this.getAIStatus();
        const editMode = this.getEditMode();
        const guardianActive = config.get('guardian.enableAnalysis', true);
        const guardianModel = config.get('guardian.model', 'gpt-4o');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Supervisor - Admin Control Panel</title>
    <style>
        body {
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
        }
        .header {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 2px solid var(--vscode-panel-border);
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 6px;
            border: 1px solid var(--vscode-panel-border);
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
        }
        .section-title .icon {
            margin-right: 10px;
            font-size: 20px;
        }
        .status-item {
            display: flex;
            align-items: center;
            margin: 10px 0;
            padding: 8px;
        }
        .status-label {
            flex: 1;
            font-weight: 500;
        }
        .status-value {
            font-weight: bold;
            margin-right: 15px;
        }
        .status-running {
            color: #4ec9b0;
        }
        .status-paused {
            color: #ce9178;
        }
        .status-stopped {
            color: #f48771;
        }
        .status-active {
            color: #4ec9b0;
        }
        .list-item {
            margin: 8px 0;
            padding: 12px;
            background-color: var(--vscode-input-background);
            border-radius: 4px;
            border-left: 3px solid var(--vscode-textLink-foreground);
        }
        .list-item-header {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .list-item-detail {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
            margin: 3px 0;
        }
        .risk-high {
            color: #f48771;
            font-weight: bold;
        }
        .risk-medium {
            color: #ce9178;
            font-weight: bold;
        }
        .risk-low {
            color: #4ec9b0;
            font-weight: bold;
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            margin: 4px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
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
        button.danger {
            background-color: #f48771;
            color: #1e1e1e;
        }
        button.danger:hover {
            background-color: #ce6f5e;
        }
        .button-group {
            display: flex;
            gap: 8px;
            margin-top: 10px;
        }
        .emergency-section {
            background-color: rgba(244, 135, 113, 0.1);
            border: 2px solid #f48771;
        }
        .empty-state {
            text-align: center;
            padding: 30px;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }
        select {
            background-color: var(--vscode-dropdown-background);
            color: var(--vscode-dropdown-foreground);
            border: 1px solid var(--vscode-dropdown-border);
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 13px;
            margin: 0 8px;
        }
        .toggle-switch {
            display: inline-block;
            position: relative;
            width: 50px;
            height: 24px;
            margin: 0 10px;
        }
        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 24px;
        }
        .slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        input:checked + .slider {
            background-color: #4ec9b0;
        }
        input:checked + .slider:before {
            transform: translateX(26px);
        }
    </style>
</head>
<body>
    <div class="header">
        🛡️ AI Supervisor - Admin Control Panel
    </div>

    <!-- System Status -->
    <div class="section">
        <div class="section-title">
            <span class="icon">⚡</span>
            System Status
        </div>
        <div class="status-item">
            <span class="status-label">AI Execution:</span>
            <span class="status-value ${isAIRunning ? 'status-running' : 'status-stopped'}">
                ${isAIRunning ? '▶️ RUNNING' : '⏸️ PAUSED'}
            </span>
            ${isAIRunning
                ? '<button onclick="pauseAI()">⏸️ Pause</button><button onclick="stopAI()">🛑 Stop</button>'
                : '<button onclick="resumeAI()">▶️ Resume</button>'
            }
        </div>
        <div class="status-item">
            <span class="status-label">Edit Mode:</span>
            <span class="status-value">🔒 ${editMode.toUpperCase()}</span>
            <select onchange="setEditMode(this.value)" value="${editMode}">
                <option value="permissive" ${editMode === 'permissive' ? 'selected' : ''}>Permissive</option>
                <option value="approval" ${editMode === 'approval' ? 'selected' : ''}>Approval</option>
                <option value="locked" ${editMode === 'locked' ? 'selected' : ''}>Locked</option>
            </select>
        </div>
        <div class="status-item">
            <span class="status-label">Guardian:</span>
            <span class="status-value ${guardianActive ? 'status-active' : 'status-stopped'}">
                ${guardianActive ? '✅ Active' : '❌ Inactive'} (${guardianModel})
            </span>
        </div>
    </div>

    <!-- Locked Files -->
    <div class="section">
        <div class="section-title">
            <span class="icon">🔒</span>
            Locked Files (${lockedFiles.length})
        </div>
        ${lockedFiles.length === 0
            ? '<div class="empty-state">No files are currently locked</div>'
            : lockedFiles.map(file => `
                <div class="list-item">
                    <div class="list-item-header">${file.path}</div>
                    <div class="list-item-detail">${file.reason}</div>
                    <div class="button-group">
                        <button class="secondary" onclick="unlockFile('${file.path}')">🔓 Unlock</button>
                    </div>
                </div>
            `).join('')
        }
        <div class="button-group" style="margin-top: 15px;">
            <button onclick="lockFile()">+ Lock File</button>
        </div>
    </div>

    <!-- Pending Approvals -->
    <div class="section">
        <div class="section-title">
            <span class="icon">⏳</span>
            Pending Approvals (${pendingApprovals.length})
        </div>
        ${pendingApprovals.length === 0
            ? '<div class="empty-state">No pending approvals</div>'
            : pendingApprovals.map(approval => `
                <div class="list-item">
                    <div class="list-item-header">${approval.file}</div>
                    <div class="list-item-detail">${approval.description}</div>
                    <div class="list-item-detail">
                        Risk: <span class="risk-${approval.risk.toLowerCase()}">${approval.risk}</span> |
                        Confidence: ${approval.confidence}%
                    </div>
                    <div class="button-group">
                        <button onclick="approveChange('${approval.id}')">✅ Approve</button>
                        <button class="secondary" onclick="rejectChange('${approval.id}')">❌ Reject</button>
                        <button class="secondary" onclick="viewDiff('${approval.id}')">👁️ View Diff</button>
                    </div>
                </div>
            `).join('')
        }
    </div>

    <!-- Recent Blocks -->
    <div class="section">
        <div class="section-title">
            <span class="icon">🚫</span>
            Recent Blocks (Last 24h)
        </div>
        ${recentBlocks.length === 0
            ? '<div class="empty-state">No blocks in the last 24 hours</div>'
            : recentBlocks.map(block => `
                <div class="list-item">
                    <div class="list-item-header">${block.time} - ${block.file}</div>
                    <div class="list-item-detail">${block.reason}</div>
                    <div class="button-group">
                        <button class="secondary" onclick="viewBlockDetails('${block.id}')">View Details</button>
                    </div>
                </div>
            `).join('')
        }
    </div>

    <!-- Settings -->
    <div class="section">
        <div class="section-title">
            <span class="icon">⚙️</span>
            Settings
        </div>
        <div class="status-item">
            <span class="status-label">Auto-block dangerous operations:</span>
            <label class="toggle-switch">
                <input type="checkbox" checked onchange="toggleAutoBlock(this.checked)">
                <span class="slider"></span>
            </label>
        </div>
        <div class="status-item">
            <span class="status-label">Block Severity Threshold:</span>
            <select onchange="setBlockSeverity(this.value)">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical Only</option>
            </select>
        </div>
    </div>

    <!-- Emergency Controls -->
    <div class="section emergency-section">
        <div class="section-title">
            <span class="icon">🔴</span>
            Emergency Controls
        </div>
        <div class="button-group">
            <button class="danger" onclick="emergencyStop()">🛑 EMERGENCY STOP</button>
            <button class="secondary" onclick="rollbackLast()">↩️ ROLLBACK LAST</button>
            <button class="secondary" onclick="resetAll()">🔄 RESET ALL</button>
        </div>
        <div class="list-item-detail" style="margin-top: 10px;">
            Emergency Stop: Immediately halts all AI operations and prevents any new changes.
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function pauseAI() {
            vscode.postMessage({ type: 'pauseAI' });
        }

        function stopAI() {
            vscode.postMessage({ type: 'stopAI' });
        }

        function resumeAI() {
            vscode.postMessage({ type: 'resumeAI' });
        }

        function setEditMode(mode) {
            vscode.postMessage({ type: 'setEditMode', mode: mode });
        }

        function lockFile() {
            vscode.postMessage({ type: 'lockFile' });
        }

        function unlockFile(file) {
            vscode.postMessage({ type: 'unlockFile', file: file });
        }

        function approveChange(changeId) {
            vscode.postMessage({ type: 'approveChange', changeId: changeId });
        }

        function rejectChange(changeId) {
            vscode.postMessage({ type: 'rejectChange', changeId: changeId });
        }

        function viewDiff(changeId) {
            vscode.postMessage({ type: 'viewDiff', changeId: changeId });
        }

        function viewBlockDetails(blockId) {
            vscode.postMessage({ type: 'viewBlockDetails', blockId: blockId });
        }

        function toggleAutoBlock(enabled) {
            vscode.postMessage({ type: 'toggleAutoBlock', enabled: enabled });
        }

        function setBlockSeverity(severity) {
            vscode.postMessage({ type: 'setBlockSeverity', severity: severity });
        }

        function emergencyStop() {
            if (confirm('Are you sure you want to EMERGENCY STOP all AI operations? This cannot be undone.')) {
                vscode.postMessage({ type: 'emergencyStop' });
            }
        }

        function rollbackLast() {
            if (confirm('Rollback the last AI change?')) {
                vscode.postMessage({ type: 'rollbackLast' });
            }
        }

        function resetAll() {
            if (confirm('Reset ALL AI Supervisor state? This will clear all locks, blocks, and approvals.')) {
                vscode.postMessage({ type: 'resetAll' });
            }
        }

        // Auto-refresh every 5 seconds
        setInterval(() => {
            vscode.postMessage({ type: 'refresh' });
        }, 5000);
    </script>
</body>
</html>`;
    }

    private getLockedFiles(): Array<{ path: string; reason: string }> {
        // Get locked files from storage
        const context = vscode.workspace.getConfiguration('aiSupervisor');
        const lockedFiles = context.get<Array<{ path: string; reason: string }>>('admin.lockedFiles', []);
        return lockedFiles;
    }

    private getPendingApprovals(): Array<{ id: string; file: string; description: string; risk: string; confidence: number }> {
        // Get pending approvals from storage
        // TODO: Implement actual approval queue
        return [];
    }

    private getRecentBlocks(): Array<{ id: string; time: string; file: string; reason: string }> {
        // Get recent blocks from storage
        // TODO: Implement actual block history
        return [];
    }

    private getAIStatus(): boolean {
        const config = vscode.workspace.getConfiguration('aiSupervisor');
        return config.get<boolean>('monitoring.enabled', true);
    }

    private getEditMode(): string {
        const config = vscode.workspace.getConfiguration('aiSupervisor');
        return config.get<string>('admin.editMode', 'approval');
    }

    private async handlePauseAI(): Promise<void> {
        await vscode.commands.executeCommand('aiSupervisor.pauseMonitoring');
        this.update();
        vscode.window.showInformationMessage('AI execution paused');
    }

    private async handleStopAI(): Promise<void> {
        await vscode.commands.executeCommand('aiSupervisor.pauseMonitoring');
        this.update();
        vscode.window.showWarningMessage('AI execution stopped');
    }

    private async handleSetEditMode(mode: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('aiSupervisor');
        await config.update('admin.editMode', mode, vscode.ConfigurationTarget.Workspace);
        this.update();
        vscode.window.showInformationMessage(`Edit mode changed to: ${mode.toUpperCase()}`);
    }

    private async handleLockFile(): Promise<void> {
        const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
        const items = files.map(file => ({
            label: vscode.workspace.asRelativePath(file),
            description: file.fsPath
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a file to lock from AI modifications'
        });

        if (selected) {
            const reason = await vscode.window.showInputBox({
                prompt: 'Why is this file being locked?',
                placeHolder: 'e.g., Critical system file, contains secrets, etc.'
            });

            if (reason) {
                const config = vscode.workspace.getConfiguration('aiSupervisor');
                const lockedFiles = config.get<Array<{ path: string; reason: string }>>('admin.lockedFiles', []);
                lockedFiles.push({ path: selected.label, reason });
                await config.update('admin.lockedFiles', lockedFiles, vscode.ConfigurationTarget.Workspace);
                this.update();
                vscode.window.showInformationMessage(`Locked: ${selected.label}`);
            }
        }
    }

    private async handleUnlockFile(file: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('aiSupervisor');
        const lockedFiles = config.get<Array<{ path: string; reason: string }>>('admin.lockedFiles', []);
        const filtered = lockedFiles.filter(f => f.path !== file);
        await config.update('admin.lockedFiles', filtered, vscode.ConfigurationTarget.Workspace);
        this.update();
        vscode.window.showInformationMessage(`Unlocked: ${file}`);
    }

    private async handleApproveChange(changeId: string): Promise<void> {
        vscode.window.showInformationMessage(`Change ${changeId} approved`);
        this.update();
    }

    private async handleRejectChange(changeId: string): Promise<void> {
        vscode.window.showWarningMessage(`Change ${changeId} rejected`);
        this.update();
    }

    private async handleViewDiff(changeId: string): Promise<void> {
        vscode.window.showInformationMessage(`Opening diff for change ${changeId}`);
        // TODO: Implement actual diff viewing
    }

    private async handleViewBlockDetails(blockId: string): Promise<void> {
        vscode.window.showInformationMessage(`Viewing block details for ${blockId}`);
        // TODO: Implement block details view
    }

    private async handleEmergencyStop(): Promise<void> {
        await vscode.commands.executeCommand('aiSupervisor.pauseMonitoring');
        const config = vscode.workspace.getConfiguration('aiSupervisor');
        await config.update('admin.editMode', 'locked', vscode.ConfigurationTarget.Workspace);
        this.update();
        vscode.window.showErrorMessage('🛑 EMERGENCY STOP ACTIVATED - All AI operations halted', { modal: true });
    }

    private async handleRollbackLast(): Promise<void> {
        vscode.window.showInformationMessage('Rolling back last change...');
        // TODO: Implement rollback functionality
        this.update();
    }

    private async handleResetAll(): Promise<void> {
        const config = vscode.workspace.getConfiguration('aiSupervisor');
        await config.update('admin.lockedFiles', [], vscode.ConfigurationTarget.Workspace);
        await config.update('admin.editMode', 'approval', vscode.ConfigurationTarget.Workspace);
        this.update();
        vscode.window.showInformationMessage('All admin state reset');
    }
}
