import * as vscode from 'vscode';
import { ChangeStorageService, CodeChange } from '../services/ChangeStorageService';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Panel for inspecting AI code changes with diff view
 */
export class ChangeInspectorPanel {
    public static currentPanel: ChangeInspectorPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private storageService: ChangeStorageService;

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        this._panel = panel;
        this.storageService = ChangeStorageService.getInstance(context);

        this._panel.webview.html = this._getHtmlContent(this._panel.webview, extensionUri);

        this._panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'approveChange':
                        await this.handleApproveChange(message.changeId);
                        break;
                    case 'rejectChange':
                        await this.handleRejectChange(message.changeId);
                        break;
                    case 'revertChange':
                        await this.handleRevertChange(message.changeId);
                        break;
                    case 'showDiff':
                        await this.handleShowDiff(message.changeId);
                        break;
                    case 'filterChanges':
                        this.handleFilterChanges(message.filters);
                        break;
                    case 'getChanges':
                        this.sendChangesToWebview();
                        break;
                    case 'showInlineChange':
                        this.handleShowInlineChange(message.changeId);
                        break;
                }
            },
            null,
            this._disposables
        );

        this.storageService.onChangesUpdated(() => {
            this.sendChangesToWebview();
        }, null, this._disposables);

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this.sendChangesToWebview();
    }

    public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext): void {
        const column = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.One;

        if (ChangeInspectorPanel.currentPanel) {
            ChangeInspectorPanel.currentPanel._panel.reveal(column);
            ChangeInspectorPanel.currentPanel.sendChangesToWebview();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'aiSupervisorChanges',
            'Change Inspector',
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );

        ChangeInspectorPanel.currentPanel = new ChangeInspectorPanel(panel, extensionUri, context);
    }

    public static dispose(): void {
        ChangeInspectorPanel.currentPanel?.dispose();
        ChangeInspectorPanel.currentPanel = undefined;
    }

    private dispose(): void {
        ChangeInspectorPanel.currentPanel = undefined;
        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    private sendChangesToWebview(): void {
        const changes = this.storageService.getAllChanges();
        this._panel.webview.postMessage({
            command: 'updateChanges',
            changes: changes
        });
    }

    private handleFilterChanges(filters: any): void {
        const changes = this.storageService.getFilteredChanges(filters);
        this._panel.webview.postMessage({
            command: 'updateChanges',
            changes: changes
        });
    }

    private handleShowInlineChange(changeId: string): void {
        const change = this.storageService.getChange(changeId);
        if (change) {
            this._panel.webview.postMessage({
                command: 'showChangeDetail',
                change: change
            });
        }
    }

    private async handleApproveChange(changeId: string): Promise<void> {
        const change = this.storageService.getChange(changeId);
        if (!change) {
            vscode.window.showErrorMessage('Change not found');
            return;
        }

        this.storageService.updateChangeStatus(changeId, 'approved');
        vscode.window.showInformationMessage(`Change approved: ${change.fileName}`);
        this.sendChangesToWebview();
    }

    private async handleRejectChange(changeId: string): Promise<void> {
        const change = this.storageService.getChange(changeId);
        if (!change) {
            vscode.window.showErrorMessage('Change not found');
            return;
        }

        const action = await vscode.window.showWarningMessage(
            `Reject change to ${change.fileName}?`,
            'Reject Only',
            'Reject & Revert',
            'Cancel'
        );

        if (action === 'Reject Only') {
            this.storageService.updateChangeStatus(changeId, 'rejected');
            vscode.window.showInformationMessage('Change rejected');
            this.sendChangesToWebview();
        } else if (action === 'Reject & Revert') {
            this.storageService.updateChangeStatus(changeId, 'rejected');
            await this.handleRevertChange(changeId);
        }
    }

    private async handleRevertChange(changeId: string): Promise<void> {
        const change = this.storageService.getChange(changeId);
        if (!change) {
            vscode.window.showErrorMessage('Change not found');
            return;
        }

        try {
            if (change.changeType === 'create') {
                if (fs.existsSync(change.filePath)) {
                    fs.unlinkSync(change.filePath);
                    vscode.window.showInformationMessage(`Reverted: Deleted ${change.fileName}`);
                }
            } else if (change.changeType === 'delete') {
                fs.writeFileSync(change.filePath, change.beforeContent, 'utf8');
                vscode.window.showInformationMessage(`Reverted: Restored ${change.fileName}`);
            } else {
                fs.writeFileSync(change.filePath, change.beforeContent, 'utf8');
                vscode.window.showInformationMessage(`Reverted: Restored previous version of ${change.fileName}`);
            }

            const uri = vscode.Uri.file(change.filePath);
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);

            this.sendChangesToWebview();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to revert change: ${error}`);
        }
    }

    private async handleShowDiff(changeId: string): Promise<void> {
        const change = this.storageService.getChange(changeId);
        if (!change) {
            vscode.window.showErrorMessage('Change not found');
            return;
        }

        try {
            const beforeUri = vscode.Uri.parse(`ai-supervisor-diff:${change.fileName} (before)#${changeId}-before`);
            const afterUri = vscode.Uri.parse(`ai-supervisor-diff:${change.fileName} (after)#${changeId}-after`);

            const beforeProvider = new (class implements vscode.TextDocumentContentProvider {
                provideTextDocumentContent(): string {
                    return change.beforeContent || '';
                }
            })();

            const afterProvider = new (class implements vscode.TextDocumentContentProvider {
                provideTextDocumentContent(): string {
                    return change.afterContent || '';
                }
            })();

            const beforeDisposable = vscode.workspace.registerTextDocumentContentProvider('ai-supervisor-diff', beforeProvider);
            const afterDisposable = vscode.workspace.registerTextDocumentContentProvider('ai-supervisor-diff', afterProvider);

            await vscode.commands.executeCommand('vscode.diff',
                beforeUri,
                afterUri,
                `${change.fileName} - AI Change Diff`,
                { preview: true }
            );

            setTimeout(() => {
                beforeDisposable.dispose();
                afterDisposable.dispose();
            }, 1000);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to show diff: ${error}`);
        }
    }

    private _getHtmlContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Change Inspector</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            font-size: 13px;
            line-height: 1.5;
            overflow: hidden;
        }

        .container {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }

        .header {
            padding: 16px 20px;
            background-color: var(--vscode-editor-background);
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .header h1 {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .filters {
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
            margin-top: 12px;
        }

        .filter-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .filter-group label {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }

        select, input[type="text"] {
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            padding: 4px 8px;
            border-radius: 2px;
            font-size: 12px;
        }

        select:focus, input:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }

        input[type="text"] {
            width: 200px;
        }

        .main-content {
            display: flex;
            flex: 1;
            overflow: hidden;
        }

        .changes-list {
            width: 400px;
            border-right: 1px solid var(--vscode-panel-border);
            overflow-y: auto;
            background-color: var(--vscode-sideBar-background);
        }

        .detail-view {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }

        .change-item {
            padding: 12px 16px;
            border-bottom: 1px solid var(--vscode-panel-border);
            cursor: pointer;
            transition: background-color 0.1s;
        }

        .change-item:hover {
            background-color: var(--vscode-list-hoverBackground);
        }

        .change-item.selected {
            background-color: var(--vscode-list-activeSelectionBackground);
            color: var(--vscode-list-activeSelectionForeground);
        }

        .change-item.reversal {
            border-left: 3px solid #ff9800;
        }

        .change-item.contradiction {
            border-left: 3px solid #f44336;
        }

        .change-item.approved {
            opacity: 0.6;
        }

        .change-item.rejected {
            opacity: 0.5;
            text-decoration: line-through;
        }

        .change-file {
            font-family: var(--vscode-editor-font-family);
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 4px;
        }

        .change-meta {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }

        .change-stats {
            display: flex;
            gap: 8px;
        }

        .additions {
            color: #4caf50;
        }

        .deletions {
            color: #f44336;
        }

        .tag {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            margin-right: 4px;
        }

        .tag.reversal {
            background-color: rgba(255, 152, 0, 0.2);
            color: #ff9800;
        }

        .tag.contradiction {
            background-color: rgba(244, 67, 54, 0.2);
            color: #f44336;
        }

        .tag.approved {
            background-color: rgba(76, 175, 80, 0.2);
            color: #4caf50;
        }

        .tag.rejected {
            background-color: rgba(158, 158, 158, 0.2);
            color: #9e9e9e;
        }

        .detail-header {
            margin-bottom: 20px;
        }

        .detail-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .detail-info {
            display: flex;
            gap: 16px;
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
            margin-bottom: 16px;
        }

        .context-box {
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 3px solid var(--vscode-textBlockQuote-border);
            padding: 12px;
            margin-bottom: 16px;
            font-style: italic;
        }

        .warning-box {
            background-color: rgba(255, 152, 0, 0.1);
            border-left: 3px solid #ff9800;
            padding: 12px;
            margin-bottom: 16px;
        }

        .warning-box strong {
            color: #ff9800;
        }

        .actions {
            display: flex;
            gap: 8px;
            margin-bottom: 20px;
        }

        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            cursor: pointer;
            border-radius: 2px;
            font-size: 13px;
            font-weight: 500;
        }

        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        button:active {
            transform: translateY(1px);
        }

        button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        button.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        button.success {
            background-color: #4caf50;
            color: white;
        }

        button.danger {
            background-color: #f44336;
            color: white;
        }

        .diff-container {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            overflow: hidden;
        }

        .diff-header {
            display: flex;
            background-color: var(--vscode-editor-background);
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .diff-view-toggle {
            display: flex;
            padding: 8px;
            gap: 4px;
        }

        .toggle-btn {
            padding: 4px 12px;
            background: transparent;
            border: 1px solid var(--vscode-panel-border);
            color: var(--vscode-foreground);
            font-size: 11px;
        }

        .toggle-btn.active {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .diff-viewer {
            background-color: var(--vscode-editor-background);
        }

        .diff-side-by-side {
            display: flex;
        }

        .diff-column {
            flex: 1;
            overflow-x: auto;
        }

        .diff-column:first-child {
            border-right: 1px solid var(--vscode-panel-border);
        }

        .diff-column-header {
            padding: 8px 12px;
            background-color: var(--vscode-editorGroupHeader-tabsBackground);
            font-weight: 600;
            font-size: 12px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .diff-line {
            display: flex;
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
            line-height: 18px;
        }

        .line-number {
            width: 50px;
            padding: 0 8px;
            text-align: right;
            color: var(--vscode-editorLineNumber-foreground);
            user-select: none;
            flex-shrink: 0;
        }

        .line-content {
            flex: 1;
            padding: 0 8px;
            white-space: pre;
            overflow-x: auto;
        }

        .diff-line.added {
            background-color: rgba(76, 175, 80, 0.2);
        }

        .diff-line.added .line-number {
            background-color: rgba(76, 175, 80, 0.3);
        }

        .diff-line.removed {
            background-color: rgba(244, 67, 54, 0.2);
        }

        .diff-line.removed .line-number {
            background-color: rgba(244, 67, 54, 0.3);
        }

        .diff-unified {
            display: block;
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--vscode-descriptionForeground);
        }

        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.5;
        }

        .empty-state h2 {
            font-size: 16px;
            margin-bottom: 8px;
        }

        ::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }

        ::-webkit-scrollbar-track {
            background: var(--vscode-scrollbarSlider-background);
        }

        ::-webkit-scrollbar-thumb {
            background: var(--vscode-scrollbarSlider-hoverBackground);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Change Inspector</h1>
            <div class="filters">
                <div class="filter-group">
                    <label>Status:</label>
                    <select id="statusFilter">
                        <option value="all">All Changes</option>
                        <option value="pending" selected>Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Search:</label>
                    <input type="text" id="searchInput" placeholder="Search files or content...">
                </div>
            </div>
        </div>

        <div class="main-content">
            <div class="changes-list" id="changesList">
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h2>No changes to review</h2>
                    <p>AI-generated code changes will appear here</p>
                </div>
            </div>

            <div class="detail-view" id="detailView">
                <div class="empty-state">
                    <div class="empty-state-icon">👈</div>
                    <h2>Select a change to inspect</h2>
                    <p>Click on any change from the list to view details and diff</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let allChanges = [];
        let selectedChange = null;
        let diffViewMode = 'side-by-side';

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateChanges':
                    allChanges = message.changes;
                    renderChangesList();
                    break;
                case 'showChangeDetail':
                    selectedChange = message.change;
                    renderChangeDetail();
                    break;
            }
        });

        document.getElementById('statusFilter').addEventListener('change', applyFilters);
        document.getElementById('searchInput').addEventListener('input', applyFilters);

        function applyFilters() {
            const status = document.getElementById('statusFilter').value;
            const searchText = document.getElementById('searchInput').value;

            vscode.postMessage({
                command: 'filterChanges',
                filters: {
                    status: status,
                    searchText: searchText
                }
            });
        }

        function renderChangesList() {
            const container = document.getElementById('changesList');

            if (allChanges.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <h2>No changes to review</h2>
                        <p>AI-generated code changes will appear here</p>
                    </div>
                \`;
                return;
            }

            container.innerHTML = allChanges.map(change => \`
                <div class="change-item \${change.flags.reversal ? 'reversal' : ''} \${change.flags.isContradiction ? 'contradiction' : ''} \${change.status} \${selectedChange && selectedChange.id === change.id ? 'selected' : ''}"
                     onclick="selectChange('\${change.id}')">
                    <div class="change-file">\${escapeHtml(change.fileName)}</div>
                    <div class="change-meta">
                        <div class="change-stats">
                            <span class="additions">+\${change.additions}</span>
                            <span class="deletions">-\${change.deletions}</span>
                        </div>
                        <span>\${formatTime(change.timestamp)}</span>
                    </div>
                    <div style="margin-top: 4px;">
                        \${change.flags.isReversal ? '<span class="tag reversal">Reversal</span>' : ''}
                        \${change.flags.isContradiction ? '<span class="tag contradiction">Contradiction</span>' : ''}
                        \${change.status === 'approved' ? '<span class="tag approved">Approved</span>' : ''}
                        \${change.status === 'rejected' ? '<span class="tag rejected">Rejected</span>' : ''}
                    </div>
                </div>
            \`).join('');
        }

        function selectChange(changeId) {
            const change = allChanges.find(c => c.id === changeId);
            if (change) {
                selectedChange = change;
                renderChangesList();
                renderChangeDetail();
            }
        }

        function renderChangeDetail() {
            const container = document.getElementById('detailView');

            if (!selectedChange) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-state-icon">👈</div>
                        <h2>Select a change to inspect</h2>
                        <p>Click on any change from the list to view details and diff</p>
                    </div>
                \`;
                return;
            }

            const change = selectedChange;

            container.innerHTML = \`
                <div class="detail-header">
                    <div class="detail-title">\${escapeHtml(change.fileName)}</div>
                    <div class="detail-info">
                        <span>\${escapeHtml(change.filePath)}</span>
                        <span>•</span>
                        <span>\${formatTime(change.timestamp)}</span>
                        <span>•</span>
                        <span>\${change.changeType}</span>
                    </div>

                    \${change.context?.userPrompt ? \`
                        <div class="context-box">
                            <strong>User Request:</strong> \${escapeHtml(change.context.userPrompt)}
                        </div>
                    \` : ''}

                    \${change.flags.isContradiction ? \`
                        <div class="warning-box">
                            <strong>⚠️ Contradiction Detected</strong><br>
                            \${escapeHtml(change.flags.contradictionReason || 'This change contradicts recent modifications')}
                        </div>
                    \` : ''}

                    \${change.flags.isReversal && !change.flags.isContradiction ? \`
                        <div class="warning-box">
                            <strong>🔄 Reversal Detected</strong><br>
                            This change reverses recent modifications
                        </div>
                    \` : ''}

                    <div class="actions">
                        <button onclick="showDiff('\${change.id}')">Open in VS Code Diff</button>
                        \${change.status === 'pending' ? \`
                            <button class="success" onclick="approveChange('\${change.id}')">Approve</button>
                            <button class="secondary" onclick="rejectChange('\${change.id}')">Reject</button>
                            <button class="danger" onclick="revertChange('\${change.id}')">Revert</button>
                        \` : ''}
                        \${change.status === 'rejected' ? \`
                            <button class="danger" onclick="revertChange('\${change.id}')">Revert</button>
                        \` : ''}
                    </div>
                </div>

                <div class="diff-container">
                    <div class="diff-header">
                        <div class="diff-view-toggle">
                            <button class="toggle-btn \${diffViewMode === 'side-by-side' ? 'active' : ''}"
                                    onclick="setDiffMode('side-by-side')">Side by Side</button>
                            <button class="toggle-btn \${diffViewMode === 'unified' ? 'active' : ''}"
                                    onclick="setDiffMode('unified')">Unified</button>
                        </div>
                    </div>
                    <div class="diff-viewer" id="diffViewer">
                        \${renderDiff(change)}
                    </div>
                </div>
            \`;
        }

        function renderDiff(change) {
            const beforeLines = (change.beforeContent || '').split('\\n');
            const afterLines = (change.afterContent || '').split('\\n');

            if (diffViewMode === 'side-by-side') {
                return \`
                    <div class="diff-side-by-side">
                        <div class="diff-column">
                            <div class="diff-column-header">Before</div>
                            \${beforeLines.map((line, i) => \`
                                <div class="diff-line \${!afterLines.includes(line) ? 'removed' : ''}">
                                    <div class="line-number">\${i + 1}</div>
                                    <div class="line-content">\${escapeHtml(line)}</div>
                                </div>
                            \`).join('')}
                        </div>
                        <div class="diff-column">
                            <div class="diff-column-header">After</div>
                            \${afterLines.map((line, i) => \`
                                <div class="diff-line \${!beforeLines.includes(line) ? 'added' : ''}">
                                    <div class="line-number">\${i + 1}</div>
                                    <div class="line-content">\${escapeHtml(line)}</div>
                                </div>
                            \`).join('')}
                        </div>
                    </div>
                \`;
            } else {
                const unifiedDiff = generateUnifiedDiff(beforeLines, afterLines);
                return \`
                    <div class="diff-unified">
                        \${unifiedDiff.map(item => \`
                            <div class="diff-line \${item.type}">
                                <div class="line-number">\${item.lineNum || ''}</div>
                                <div class="line-content">\${item.type === 'added' ? '+' : item.type === 'removed' ? '-' : ' '} \${escapeHtml(item.content)}</div>
                            </div>
                        \`).join('')}
                    </div>
                \`;
            }
        }

        function generateUnifiedDiff(beforeLines, afterLines) {
            const result = [];
            const maxLen = Math.max(beforeLines.length, afterLines.length);

            for (let i = 0; i < maxLen; i++) {
                const beforeLine = beforeLines[i];
                const afterLine = afterLines[i];

                if (beforeLine === afterLine && beforeLine !== undefined) {
                    result.push({ type: '', content: beforeLine, lineNum: i + 1 });
                } else {
                    if (beforeLine !== undefined && !afterLines.includes(beforeLine)) {
                        result.push({ type: 'removed', content: beforeLine, lineNum: i + 1 });
                    }
                    if (afterLine !== undefined && !beforeLines.includes(afterLine)) {
                        result.push({ type: 'added', content: afterLine, lineNum: i + 1 });
                    }
                }
            }

            return result;
        }

        function setDiffMode(mode) {
            diffViewMode = mode;
            renderChangeDetail();
        }

        function showDiff(changeId) {
            vscode.postMessage({ command: 'showDiff', changeId });
        }

        function approveChange(changeId) {
            vscode.postMessage({ command: 'approveChange', changeId });
        }

        function rejectChange(changeId) {
            vscode.postMessage({ command: 'rejectChange', changeId });
        }

        function revertChange(changeId) {
            if (confirm('Are you sure you want to revert this change? This will restore the previous version of the file.')) {
                vscode.postMessage({ command: 'revertChange', changeId });
            }
        }

        function formatTime(timestamp) {
            const now = Date.now();
            const diff = now - timestamp;
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);

            if (minutes < 1) {return 'Just now';}
            if (minutes < 60) {return \`\${minutes} minute\${minutes > 1 ? 's' : ''} ago\`;}
            if (hours < 24) {return \`\${hours} hour\${hours > 1 ? 's' : ''} ago\`;}
            return \`\${days} day\${days > 1 ? 's' : ''} ago\`;
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        vscode.postMessage({ command: 'getChanges' });
    </script>
</body>
</html>`;
    }
}
