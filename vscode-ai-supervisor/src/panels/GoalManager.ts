import * as vscode from 'vscode';

/**
 * Panel for managing project goals
 */
export class GoalManagerPanel {
    public static currentPanel: GoalManagerPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.webview.html = this._getHtmlContent(this._panel.webview, extensionUri);

        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'addGoal':
                        this.handleAddGoal(message.goal);
                        break;
                    case 'updateGoal':
                        this.handleUpdateGoal(message.id, message.goal);
                        break;
                    case 'deleteGoal':
                        this.handleDeleteGoal(message.id);
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

        if (GoalManagerPanel.currentPanel) {
            GoalManagerPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'aiSupervisorGoals',
            'Project Goals',
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );

        GoalManagerPanel.currentPanel = new GoalManagerPanel(panel, extensionUri);
    }

    public static dispose(): void {
        GoalManagerPanel.currentPanel?.dispose();
        GoalManagerPanel.currentPanel = undefined;
    }

    private dispose(): void {
        GoalManagerPanel.currentPanel = undefined;
        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    private handleAddGoal(goal: any): void {
        // TODO: Implement add goal logic
        console.log('Add goal:', goal);
        vscode.window.showInformationMessage(`Goal added: ${goal.title}`);
    }

    private handleUpdateGoal(id: string, goal: any): void {
        // TODO: Implement update goal logic
        console.log('Update goal:', id, goal);
    }

    private handleDeleteGoal(id: string): void {
        // TODO: Implement delete goal logic
        console.log('Delete goal:', id);
    }

    private _getHtmlContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Goals</title>
    <style>
        body {
            padding: 20px;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
        }
        .goals-container {
            max-width: 800px;
            margin: 0 auto;
        }
        .goal-item {
            padding: 16px;
            margin-bottom: 12px;
            background-color: var(--vscode-editor-background);
            border-radius: 4px;
            border-left: 4px solid var(--vscode-textLink-foreground);
        }
        .goal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        .goal-title {
            font-size: 1.2em;
            font-weight: bold;
        }
        .goal-actions button {
            margin-left: 8px;
            padding: 4px 8px;
            font-size: 0.9em;
        }
        .add-goal-section {
            margin-bottom: 24px;
            padding: 16px;
            background-color: var(--vscode-editor-background);
            border-radius: 4px;
        }
        input, textarea {
            width: 100%;
            padding: 8px;
            margin: 8px 0;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
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
        .templates {
            margin-top: 12px;
        }
        .template-btn {
            margin-right: 8px;
            margin-bottom: 8px;
            padding: 6px 12px;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="goals-container">
        <h1>Project Goals</h1>
        
        <div class="add-goal-section">
            <h2>Add New Goal</h2>
            <input type="text" id="goalTitle" placeholder="Goal title (e.g., Build REST API)" />
            <textarea id="goalDescription" rows="3" placeholder="Detailed description..."></textarea>
            
            <div class="templates">
                <strong>Templates:</strong><br>
                <button class="template-btn secondary" onclick="useTemplate('api')">Build REST API</button>
                <button class="template-btn secondary" onclick="useTemplate('refactor')">Refactor for Performance</button>
                <button class="template-btn secondary" onclick="useTemplate('testing')">Add Test Coverage</button>
                <button class="template-btn secondary" onclick="useTemplate('docs')">Improve Documentation</button>
            </div>
            
            <div style="margin-top: 12px;">
                <button onclick="addGoal()">Add Goal</button>
            </div>
        </div>

        <div id="goalsList">
            <div class="goal-item">
                <div class="goal-header">
                    <div class="goal-title">Example Goal: Build User Authentication</div>
                    <div class="goal-actions">
                        <button class="secondary">Edit</button>
                        <button class="secondary">Delete</button>
                    </div>
                </div>
                <div class="goal-description">
                    Implement secure user authentication with JWT tokens, including login, logout, and password reset functionality.
                </div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        const templates = {
            api: {
                title: 'Build REST API',
                description: 'Create a RESTful API with proper endpoints, request/response handling, and error management.'
            },
            refactor: {
                title: 'Refactor for Performance',
                description: 'Optimize code for better performance, reduce complexity, and improve maintainability.'
            },
            testing: {
                title: 'Add Test Coverage',
                description: 'Write comprehensive unit and integration tests to ensure code reliability.'
            },
            docs: {
                title: 'Improve Documentation',
                description: 'Add clear documentation including API docs, README updates, and code comments.'
            }
        };

        function useTemplate(type) {
            const template = templates[type];
            if (template) {
                document.getElementById('goalTitle').value = template.title;
                document.getElementById('goalDescription').value = template.description;
            }
        }

        function addGoal() {
            const title = document.getElementById('goalTitle').value;
            const description = document.getElementById('goalDescription').value;

            if (!title) {
                alert('Please enter a goal title');
                return;
            }

            vscode.postMessage({
                command: 'addGoal',
                goal: { title, description }
            });

            // Clear form
            document.getElementById('goalTitle').value = '';
            document.getElementById('goalDescription').value = '';
        }
    </script>
</body>
</html>`;
    }
}
