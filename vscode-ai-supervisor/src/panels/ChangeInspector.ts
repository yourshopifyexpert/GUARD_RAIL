import * as vscode from 'vscode';

/**
 * Panel for inspecting AI code changes with diff view
 */
export class ChangeInspectorPanel {
    public static currentPanel: ChangeInspectorPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.webview.html = this._getHtmlContent(this._panel.webview, extensionUri);

        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'approveChange':
                        this.handleApproveChange(message.changeId);
                        break;
                    case 'rejectChange':
                        this.handleRejectChange(message.changeId);
                        break;
                    case 'showDiff':
                        this.handleShowDiff(message.changeId);
                        break;
                }
            },
            null,
            this._disposables
        );

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public static createOrShow(extensionUri: vscode.Uri): void {
        const column = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.One;

        if (ChangeInspectorPanel.currentPanel) {
            ChangeInspectorPanel.currentPanel._panel.reveal(column);
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

        ChangeInspectorPanel.currentPanel = new ChangeInspectorPanel(panel, extensionUri);
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

    private async handleApproveChange(changeId: string): Promise<void> {
        // TODO: Implement approve logic
        console.log('Approve change:', changeId);
        vscode.window.showInformationMessage('Change approved');
    }

    private async handleRejectChange(changeId: string): Promise<void> {
        // TODO: Implement reject logic
        console.log('Reject change:', changeId);
        vscode.window.showWarningMessage('Change rejected - consider reverting');
    }

    private async handleShowDiff(changeId: string): Promise<void> {
        // TODO: Open VS Code diff editor
        console.log('Show diff for change:', changeId);
    }

    private _getHtmlContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Change Inspector</title>
    <style>
        body {
            padding: 20px;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
        }
        .change-item {
            padding: 16px;
            margin-bottom: 16px;
            background-color: var(--vscode-editor-background);
            border-radius: 4px;
            border-left: 4px solid var(--vscode-textLink-foreground);
        }
        .change-item.reversal {
            border-left-color: #ff9800;
        }
        .change-item.contradiction {
            border-left-color: #f44336;
        }
        .change-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }
        .change-file {
            font-family: monospace;
            font-size: 1.1em;
        }
        .change-stats {
            color: var(--vscode-descriptionForeground);
            font-size: 0.9em;
        }
        .additions {
            color: #4caf50;
        }
        .deletions {
            color: #f44336;
        }
        .change-context {
            margin: 12px 0;
            padding: 12px;
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 2px solid var(--vscode-textBlockQuote-border);
            font-style: italic;
        }
        .change-actions {
            display: flex;
            gap: 8px;
            margin-top: 12px;
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            cursor: pointer;
            border-radius: 2px;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        button.danger {
            background-color: #f44336;
            color: white;
        }
        .tag {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.85em;
            margin-right: 8px;
        }
        .tag.reversal {
            background-color: rgba(255, 152, 0, 0.2);
            color: #ff9800;
        }
        .tag.contradiction {
            background-color: rgba(244, 67, 54, 0.2);
            color: #f44336;
        }
    </style>
</head>
<body>
    <h1>Change Inspector</h1>
    <p>Review AI-generated code changes and detect contradictions or reversals</p>

    <div id="changesList">
        <div class="change-item reversal">
            <div class="change-header">
                <div>
                    <div class="change-file">src/auth/login.ts</div>
                    <div class="change-stats">
                        <span class="additions">+12</span>
                        <span class="deletions">-8</span>
                        <span style="margin-left: 12px;">2 minutes ago</span>
                    </div>
                </div>
                <div>
                    <span class="tag reversal">Reversal Detected</span>
                </div>
            </div>
            
            <div class="change-context">
                "Added error handling for login validation"
                <br>
                <strong>Note:</strong> This reverses changes made 5 minutes ago
            </div>

            <div class="change-actions">
                <button onclick="showDiff('1')">View Diff</button>
                <button class="secondary" onclick="approveChange('1')">Approve</button>
                <button class="danger" onclick="rejectChange('1')">Reject & Revert</button>
            </div>
        </div>

        <div class="change-item">
            <div class="change-header">
                <div>
                    <div class="change-file">src/utils/validation.ts</div>
                    <div class="change-stats">
                        <span class="additions">+25</span>
                        <span class="deletions">-3</span>
                        <span style="margin-left: 12px;">5 minutes ago</span>
                    </div>
                </div>
            </div>
            
            <div class="change-context">
                "Refactored validation logic to use shared utility functions"
            </div>

            <div class="change-actions">
                <button onclick="showDiff('2')">View Diff</button>
                <button class="secondary" onclick="approveChange('2')">Approve</button>
                <button class="danger" onclick="rejectChange('2')">Reject & Revert</button>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function showDiff(changeId) {
            vscode.postMessage({
                command: 'showDiff',
                changeId: changeId
            });
        }

        function approveChange(changeId) {
            vscode.postMessage({
                command: 'approveChange',
                changeId: changeId
            });
        }

        function rejectChange(changeId) {
            if (confirm('Are you sure you want to reject this change? This will revert the changes.')) {
                vscode.postMessage({
                    command: 'rejectChange',
                    changeId: changeId
                });
            }
        }
    </script>
</body>
</html>`;
    }
}
