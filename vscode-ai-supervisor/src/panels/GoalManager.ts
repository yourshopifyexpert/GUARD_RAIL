import * as vscode from 'vscode';
import { randomUUID } from 'crypto';

/**
 * Goal status types
 */
type GoalStatus = 'active' | 'paused' | 'completed';

/**
 * Priority levels
 */
type PriorityLevel = 'low' | 'medium' | 'high';

/**
 * Goal data structure
 */
interface Goal {
    id: string;
    title: string;
    description: string;
    status: GoalStatus;
    priority: PriorityLevel;
    tags: string[];
    scope: string[];
    constraints: string[];
    createdAt: string;
    updatedAt: string;
}

/**
 * Template for quick goal creation
 */
interface GoalTemplate {
    title: string;
    description: string;
    tags: string[];
    scope: string[];
    constraints: string[];
}

/**
 * Panel for managing project goals
 */
export class GoalManagerPanel {
    public static currentPanel: GoalManagerPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private _context: vscode.ExtensionContext;

    private static readonly STORAGE_KEY = 'aiSupervisor.goals';
    private static readonly TEMPLATES: Record<string, GoalTemplate> = {
        api: {
            title: 'Build REST API',
            description: 'Create a RESTful API with proper endpoints, request/response handling, error management, and documentation.',
            tags: ['backend', 'api', 'rest'],
            scope: ['src/api/**', 'src/routes/**', 'src/controllers/**'],
            constraints: [
                'Follow RESTful principles',
                'Implement proper error handling',
                'Add input validation',
                'Use TypeScript types'
            ]
        },
        refactor: {
            title: 'Refactor for Performance',
            description: 'Optimize code for better performance, reduce complexity, improve maintainability, and remove code smells.',
            tags: ['refactoring', 'performance', 'quality'],
            scope: ['src/**/*.ts', 'src/**/*.js'],
            constraints: [
                'Maintain existing functionality',
                'Add tests before refactoring',
                'Keep changes atomic',
                'Document breaking changes'
            ]
        },
        testing: {
            title: 'Add Test Coverage',
            description: 'Write comprehensive unit and integration tests to ensure code reliability and prevent regressions.',
            tags: ['testing', 'quality', 'ci'],
            scope: ['src/**', 'tests/**'],
            constraints: [
                'Aim for 80% coverage',
                'Write meaningful tests',
                'Test edge cases',
                'Use proper mocking'
            ]
        },
        docs: {
            title: 'Improve Documentation',
            description: 'Add clear documentation including API docs, README updates, code comments, and usage examples.',
            tags: ['documentation', 'developer-experience'],
            scope: ['**/*.md', 'src/**'],
            constraints: [
                'Keep documentation up to date',
                'Include code examples',
                'Document public APIs',
                'Add JSDoc comments'
            ]
        },
        security: {
            title: 'Security Hardening',
            description: 'Implement security best practices, fix vulnerabilities, add authentication/authorization, and secure sensitive data.',
            tags: ['security', 'authentication', 'critical'],
            scope: ['src/**'],
            constraints: [
                'Follow OWASP guidelines',
                'Never commit secrets',
                'Use prepared statements',
                'Implement rate limiting'
            ]
        },
        database: {
            title: 'Database Schema Design',
            description: 'Design and implement database schema with proper relationships, indexes, and migrations.',
            tags: ['database', 'backend', 'schema'],
            scope: ['src/db/**', 'migrations/**'],
            constraints: [
                'Use migrations for schema changes',
                'Add proper indexes',
                'Normalize data structure',
                'Document relationships'
            ]
        }
    };

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        this._panel = panel;
        this._context = context;

        this._panel.webview.html = this._getHtmlContent(this._panel.webview, extensionUri);

        this._panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'loadGoals':
                        await this.handleLoadGoals();
                        break;
                    case 'addGoal':
                        await this.handleAddGoal(message.goal);
                        break;
                    case 'updateGoal':
                        await this.handleUpdateGoal(message.id, message.updates);
                        break;
                    case 'deleteGoal':
                        await this.handleDeleteGoal(message.id);
                        break;
                    case 'loadTemplate':
                        this.handleLoadTemplate(message.templateId);
                        break;
                    case 'validateGoal':
                        this.handleValidateGoal(message.goal);
                        break;
                }
            },
            null,
            this._disposables
        );

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this.handleLoadGoals();
    }

    public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext): void {
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

        GoalManagerPanel.currentPanel = new GoalManagerPanel(panel, extensionUri, context);
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

    private async handleLoadGoals(): Promise<void> {
        const goals = await this.getGoals();
        this._panel.webview.postMessage({
            command: 'goalsLoaded',
            goals: goals
        });
    }

    private async handleAddGoal(goalData: Partial<Goal>): Promise<void> {
        const validation = this.validateGoalData(goalData);
        if (!validation.valid) {
            vscode.window.showErrorMessage(`Invalid goal: ${validation.error}`);
            return;
        }

        const now = new Date().toISOString();
        const goal: Goal = {
            id: randomUUID(),
            title: goalData.title!,
            description: goalData.description || '',
            status: goalData.status || 'active',
            priority: goalData.priority || 'medium',
            tags: goalData.tags || [],
            scope: goalData.scope || [],
            constraints: goalData.constraints || [],
            createdAt: now,
            updatedAt: now
        };

        const goals = await this.getGoals();
        goals.push(goal);
        await this.saveGoals(goals);

        vscode.window.showInformationMessage(`Goal created: ${goal.title}`);

        this._panel.webview.postMessage({
            command: 'goalAdded',
            goal: goal
        });

        this.notifyGoalChange('created', goal);
    }

    private async handleUpdateGoal(id: string, updates: Partial<Goal>): Promise<void> {
        const goals = await this.getGoals();
        const index = goals.findIndex(g => g.id === id);

        if (index === -1) {
            vscode.window.showErrorMessage('Goal not found');
            return;
        }

        const validation = this.validateGoalData({ ...goals[index], ...updates });
        if (!validation.valid) {
            vscode.window.showErrorMessage(`Invalid update: ${validation.error}`);
            return;
        }

        goals[index] = {
            ...goals[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        await this.saveGoals(goals);

        vscode.window.showInformationMessage(`Goal updated: ${goals[index].title}`);

        this._panel.webview.postMessage({
            command: 'goalUpdated',
            goal: goals[index]
        });

        this.notifyGoalChange('updated', goals[index]);
    }

    private async handleDeleteGoal(id: string): Promise<void> {
        const goals = await this.getGoals();
        const goal = goals.find(g => g.id === id);

        if (!goal) {
            vscode.window.showErrorMessage('Goal not found');
            return;
        }

        const confirmation = await vscode.window.showWarningMessage(
            `Delete goal "${goal.title}"? This cannot be undone.`,
            { modal: true },
            'Delete',
            'Cancel'
        );

        if (confirmation !== 'Delete') {
            return;
        }

        const filtered = goals.filter(g => g.id !== id);
        await this.saveGoals(filtered);

        vscode.window.showInformationMessage(`Goal deleted: ${goal.title}`);

        this._panel.webview.postMessage({
            command: 'goalDeleted',
            id: id
        });

        this.notifyGoalChange('deleted', goal);
    }

    private handleLoadTemplate(templateId: string): void {
        const template = GoalManagerPanel.TEMPLATES[templateId];
        if (template) {
            this._panel.webview.postMessage({
                command: 'templateLoaded',
                template: template
            });
        }
    }

    private handleValidateGoal(goalData: Partial<Goal>): void {
        const validation = this.validateGoalData(goalData);
        this._panel.webview.postMessage({
            command: 'validationResult',
            valid: validation.valid,
            error: validation.error
        });
    }

    private validateGoalData(goal: Partial<Goal>): { valid: boolean; error?: string } {
        if (!goal.title || goal.title.trim().length === 0) {
            return { valid: false, error: 'Title is required' };
        }

        if (goal.title.length > 200) {
            return { valid: false, error: 'Title must be less than 200 characters' };
        }

        if (goal.description && goal.description.length > 2000) {
            return { valid: false, error: 'Description must be less than 2000 characters' };
        }

        if (goal.scope && goal.scope.length > 50) {
            return { valid: false, error: 'Maximum 50 scope patterns allowed' };
        }

        if (goal.constraints && goal.constraints.length > 50) {
            return { valid: false, error: 'Maximum 50 constraints allowed' };
        }

        if (goal.tags && goal.tags.length > 20) {
            return { valid: false, error: 'Maximum 20 tags allowed' };
        }

        return { valid: true };
    }

    private async getGoals(): Promise<Goal[]> {
        return this._context.workspaceState.get<Goal[]>(GoalManagerPanel.STORAGE_KEY, []);
    }

    private async saveGoals(goals: Goal[]): Promise<void> {
        await this._context.workspaceState.update(GoalManagerPanel.STORAGE_KEY, goals);
    }

    private notifyGoalChange(action: 'created' | 'updated' | 'deleted', goal: Goal): void {
        vscode.commands.executeCommand('aiSupervisor.goalChanged', {
            action,
            goal
        });
    }

    private _getHtmlContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline';">
    <title>Project Goals</title>
    <style>
        * { box-sizing: border-box; }

        body {
            padding: 20px;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            line-height: 1.6;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        h1 {
            margin-top: 0;
            margin-bottom: 24px;
            font-size: 24px;
            font-weight: 600;
        }

        .stats-bar {
            display: flex;
            gap: 16px;
            margin-bottom: 24px;
            padding: 12px;
            background-color: var(--vscode-editor-background);
            border-radius: 4px;
        }

        .stat-item {
            flex: 1;
            text-align: center;
        }

        .stat-value {
            display: block;
            font-size: 24px;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }

        .stat-label {
            display: block;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }

        .section {
            margin-bottom: 32px;
        }

        .section-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
        }

        .add-goal-section {
            padding: 20px;
            background-color: var(--vscode-editor-background);
            border-radius: 4px;
            margin-bottom: 24px;
        }

        .form-group {
            margin-bottom: 16px;
        }

        label {
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
            color: var(--vscode-foreground);
        }

        input, textarea, select {
            width: 100%;
            padding: 8px 12px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
        }

        input:focus, textarea:focus, select:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }

        textarea {
            resize: vertical;
            min-height: 80px;
        }

        .tag-input-container {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
        }

        .tag-input-container input {
            flex: 1;
        }

        .tag-list, .scope-list, .constraint-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
        }

        .tag-item, .scope-item, .constraint-item {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 12px;
            font-size: 13px;
        }

        .remove-btn {
            cursor: pointer;
            font-weight: bold;
            opacity: 0.7;
        }

        .remove-btn:hover {
            opacity: 1;
        }

        .templates {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid var(--vscode-panel-border);
        }

        .template-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
        }

        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            cursor: pointer;
            border-radius: 2px;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            font-weight: 500;
        }

        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        button.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        button.small {
            padding: 4px 10px;
            font-size: 13px;
        }

        button.danger {
            background-color: var(--vscode-errorForeground);
            color: var(--vscode-editor-background);
        }

        .form-row {
            display: flex;
            gap: 16px;
        }

        .form-row .form-group {
            flex: 1;
        }

        .goals-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .goal-card {
            padding: 20px;
            background-color: var(--vscode-editor-background);
            border-radius: 4px;
            border-left: 4px solid var(--vscode-textLink-foreground);
        }

        .goal-card.status-paused {
            border-left-color: var(--vscode-editorWarning-foreground);
        }

        .goal-card.status-completed {
            border-left-color: var(--vscode-testing-iconPassed);
            opacity: 0.8;
        }

        .goal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
        }

        .goal-title-section {
            flex: 1;
        }

        .goal-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .goal-meta {
            display: flex;
            gap: 12px;
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
        }

        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .badge.priority-high {
            background-color: var(--vscode-errorForeground);
            color: var(--vscode-editor-background);
        }

        .badge.priority-medium {
            background-color: var(--vscode-editorWarning-foreground);
            color: var(--vscode-editor-background);
        }

        .badge.priority-low {
            background-color: var(--vscode-descriptionForeground);
            color: var(--vscode-editor-background);
        }

        .badge.status-active {
            background-color: var(--vscode-testing-iconPassed);
            color: var(--vscode-editor-background);
        }

        .badge.status-paused {
            background-color: var(--vscode-editorWarning-foreground);
            color: var(--vscode-editor-background);
        }

        .badge.status-completed {
            background-color: var(--vscode-descriptionForeground);
            color: var(--vscode-editor-background);
        }

        .goal-actions {
            display: flex;
            gap: 8px;
        }

        .goal-description {
            margin-bottom: 12px;
            line-height: 1.6;
        }

        .goal-details {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid var(--vscode-panel-border);
        }

        .detail-section {
            font-size: 13px;
        }

        .detail-label {
            font-weight: 600;
            margin-bottom: 4px;
            color: var(--vscode-descriptionForeground);
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--vscode-descriptionForeground);
        }

        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }

        .validation-error {
            color: var(--vscode-errorForeground);
            font-size: 13px;
            margin-top: 4px;
        }

        .edit-form {
            display: none;
            padding: 16px;
            background-color: var(--vscode-input-background);
            border-radius: 4px;
            margin-top: 12px;
        }

        .edit-form.active {
            display: block;
        }

        .filter-bar {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Project Goals Manager</h1>

        <div class="stats-bar">
            <div class="stat-item">
                <span class="stat-value" id="totalGoals">0</span>
                <span class="stat-label">Total Goals</span>
            </div>
            <div class="stat-item">
                <span class="stat-value" id="activeGoals">0</span>
                <span class="stat-label">Active</span>
            </div>
            <div class="stat-item">
                <span class="stat-value" id="pausedGoals">0</span>
                <span class="stat-label">Paused</span>
            </div>
            <div class="stat-item">
                <span class="stat-value" id="completedGoals">0</span>
                <span class="stat-label">Completed</span>
            </div>
        </div>

        <div class="section add-goal-section">
            <h2 class="section-title">Create New Goal</h2>

            <form id="goalForm">
                <div class="form-group">
                    <label for="goalTitle">Title *</label>
                    <input type="text" id="goalTitle" placeholder="e.g., Build User Authentication" required maxlength="200">
                    <div class="validation-error" id="titleError"></div>
                </div>

                <div class="form-group">
                    <label for="goalDescription">Description</label>
                    <textarea id="goalDescription" placeholder="Detailed description of the goal..." rows="4" maxlength="2000"></textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="goalPriority">Priority</label>
                        <select id="goalPriority">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="goalStatus">Status</label>
                        <select id="goalStatus">
                            <option value="active" selected>Active</option>
                            <option value="paused">Paused</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label>Tags</label>
                    <div class="tag-input-container">
                        <input type="text" id="tagInput" placeholder="Add a tag (e.g., backend, api)">
                        <button type="button" class="secondary small" onclick="addTag()">Add Tag</button>
                    </div>
                    <div class="tag-list" id="tagList"></div>
                </div>

                <div class="form-group">
                    <label>Scope Patterns (glob patterns for allowed files)</label>
                    <div class="tag-input-container">
                        <input type="text" id="scopeInput" placeholder="e.g., src/api/**, tests/**">
                        <button type="button" class="secondary small" onclick="addScope()">Add Pattern</button>
                    </div>
                    <div class="scope-list" id="scopeList"></div>
                </div>

                <div class="form-group">
                    <label>Constraints (what AI cannot do)</label>
                    <div class="tag-input-container">
                        <input type="text" id="constraintInput" placeholder="e.g., Don't modify database schema">
                        <button type="button" class="secondary small" onclick="addConstraint()">Add Constraint</button>
                    </div>
                    <div class="constraint-list" id="constraintList"></div>
                </div>

                <div class="templates">
                    <strong>Quick Start Templates:</strong>
                    <div class="template-buttons">
                        <button type="button" class="secondary small" onclick="loadTemplate('api')">REST API</button>
                        <button type="button" class="secondary small" onclick="loadTemplate('refactor')">Refactoring</button>
                        <button type="button" class="secondary small" onclick="loadTemplate('testing')">Testing</button>
                        <button type="button" class="secondary small" onclick="loadTemplate('docs')">Documentation</button>
                        <button type="button" class="secondary small" onclick="loadTemplate('security')">Security</button>
                        <button type="button" class="secondary small" onclick="loadTemplate('database')">Database</button>
                    </div>
                </div>

                <div style="margin-top: 20px; display: flex; gap: 8px;">
                    <button type="submit">Create Goal</button>
                    <button type="button" class="secondary" onclick="resetForm()">Clear Form</button>
                </div>
            </form>
        </div>

        <div class="section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h2 class="section-title" style="margin: 0;">Goals</h2>
                <div class="filter-bar">
                    <button class="secondary small" onclick="filterGoals('all')">All</button>
                    <button class="secondary small" onclick="filterGoals('active')">Active</button>
                    <button class="secondary small" onclick="filterGoals('paused')">Paused</button>
                    <button class="secondary small" onclick="filterGoals('completed')">Completed</button>
                </div>
            </div>

            <div class="goals-list" id="goalsList">
                <div class="empty-state">
                    <div class="empty-state-icon">🎯</div>
                    <div>No goals yet. Create your first goal to get started!</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        let goals = [];
        let currentFilter = 'all';
        let currentTags = [];
        let currentScope = [];
        let currentConstraints = [];
        let editingGoalId = null;

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'goalsLoaded':
                    goals = message.goals;
                    renderGoals();
                    updateStats();
                    break;
                case 'goalAdded':
                    goals.push(message.goal);
                    renderGoals();
                    updateStats();
                    resetForm();
                    break;
                case 'goalUpdated':
                    const index = goals.findIndex(g => g.id === message.goal.id);
                    if (index !== -1) {
                        goals[index] = message.goal;
                        renderGoals();
                        updateStats();
                    }
                    break;
                case 'goalDeleted':
                    goals = goals.filter(g => g.id !== message.id);
                    renderGoals();
                    updateStats();
                    break;
                case 'templateLoaded':
                    loadTemplateData(message.template);
                    break;
            }
        });

        document.getElementById('goalForm').addEventListener('submit', (e) => {
            e.preventDefault();

            if (editingGoalId) {
                updateGoal();
            } else {
                createGoal();
            }
        });

        document.getElementById('tagInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
            }
        });

        document.getElementById('scopeInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addScope();
            }
        });

        document.getElementById('constraintInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addConstraint();
            }
        });

        function createGoal() {
            const title = document.getElementById('goalTitle').value.trim();
            const description = document.getElementById('goalDescription').value.trim();
            const priority = document.getElementById('goalPriority').value;
            const status = document.getElementById('goalStatus').value;

            if (!title) {
                document.getElementById('titleError').textContent = 'Title is required';
                return;
            }

            document.getElementById('titleError').textContent = '';

            vscode.postMessage({
                command: 'addGoal',
                goal: {
                    title,
                    description,
                    priority,
                    status,
                    tags: currentTags,
                    scope: currentScope,
                    constraints: currentConstraints
                }
            });
        }

        function updateGoal() {
            const title = document.getElementById('goalTitle').value.trim();
            const description = document.getElementById('goalDescription').value.trim();
            const priority = document.getElementById('goalPriority').value;
            const status = document.getElementById('goalStatus').value;

            if (!title) {
                document.getElementById('titleError').textContent = 'Title is required';
                return;
            }

            vscode.postMessage({
                command: 'updateGoal',
                id: editingGoalId,
                updates: {
                    title,
                    description,
                    priority,
                    status,
                    tags: currentTags,
                    scope: currentScope,
                    constraints: currentConstraints
                }
            });

            editingGoalId = null;
        }

        function editGoal(id) {
            const goal = goals.find(g => g.id === id);
            if (!goal) return;

            editingGoalId = id;
            document.getElementById('goalTitle').value = goal.title;
            document.getElementById('goalDescription').value = goal.description;
            document.getElementById('goalPriority').value = goal.priority;
            document.getElementById('goalStatus').value = goal.status;

            currentTags = [...goal.tags];
            currentScope = [...goal.scope];
            currentConstraints = [...goal.constraints];

            renderTags();
            renderScope();
            renderConstraints();

            document.querySelector('.add-goal-section').scrollIntoView({ behavior: 'smooth' });
        }

        function deleteGoal(id) {
            vscode.postMessage({
                command: 'deleteGoal',
                id
            });
        }

        function changeStatus(id, newStatus) {
            vscode.postMessage({
                command: 'updateGoal',
                id,
                updates: { status: newStatus }
            });
        }

        function addTag() {
            const input = document.getElementById('tagInput');
            const tag = input.value.trim();

            if (tag && !currentTags.includes(tag)) {
                currentTags.push(tag);
                renderTags();
                input.value = '';
            }
        }

        function removeTag(tag) {
            currentTags = currentTags.filter(t => t !== tag);
            renderTags();
        }

        function renderTags() {
            const container = document.getElementById('tagList');
            container.innerHTML = currentTags.map(tag =>
                \`<span class="tag-item">
                    \${escapeHtml(tag)}
                    <span class="remove-btn" onclick="removeTag('\${escapeHtml(tag)}')">×</span>
                </span>\`
            ).join('');
        }

        function addScope() {
            const input = document.getElementById('scopeInput');
            const scope = input.value.trim();

            if (scope && !currentScope.includes(scope)) {
                currentScope.push(scope);
                renderScope();
                input.value = '';
            }
        }

        function removeScope(scope) {
            currentScope = currentScope.filter(s => s !== scope);
            renderScope();
        }

        function renderScope() {
            const container = document.getElementById('scopeList');
            container.innerHTML = currentScope.map(scope =>
                \`<span class="scope-item">
                    \${escapeHtml(scope)}
                    <span class="remove-btn" onclick="removeScope('\${escapeHtml(scope)}')">×</span>
                </span>\`
            ).join('');
        }

        function addConstraint() {
            const input = document.getElementById('constraintInput');
            const constraint = input.value.trim();

            if (constraint && !currentConstraints.includes(constraint)) {
                currentConstraints.push(constraint);
                renderConstraints();
                input.value = '';
            }
        }

        function removeConstraint(constraint) {
            currentConstraints = currentConstraints.filter(c => c !== constraint);
            renderConstraints();
        }

        function renderConstraints() {
            const container = document.getElementById('constraintList');
            container.innerHTML = currentConstraints.map(constraint =>
                \`<span class="constraint-item">
                    \${escapeHtml(constraint)}
                    <span class="remove-btn" onclick="removeConstraint('\${escapeHtml(constraint)}')">×</span>
                </span>\`
            ).join('');
        }

        function loadTemplate(templateId) {
            vscode.postMessage({
                command: 'loadTemplate',
                templateId
            });
        }

        function loadTemplateData(template) {
            document.getElementById('goalTitle').value = template.title;
            document.getElementById('goalDescription').value = template.description;
            currentTags = [...template.tags];
            currentScope = [...template.scope];
            currentConstraints = [...template.constraints];

            renderTags();
            renderScope();
            renderConstraints();
        }

        function resetForm() {
            document.getElementById('goalForm').reset();
            currentTags = [];
            currentScope = [];
            currentConstraints = [];
            editingGoalId = null;

            renderTags();
            renderScope();
            renderConstraints();

            document.getElementById('titleError').textContent = '';
        }

        function filterGoals(filter) {
            currentFilter = filter;
            renderGoals();
        }

        function renderGoals() {
            const container = document.getElementById('goalsList');
            const filteredGoals = currentFilter === 'all'
                ? goals
                : goals.filter(g => g.status === currentFilter);

            if (filteredGoals.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-state-icon">🎯</div>
                        <div>No \${currentFilter === 'all' ? '' : currentFilter} goals found.</div>
                    </div>
                \`;
                return;
            }

            container.innerHTML = filteredGoals
                .sort((a, b) => {
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                })
                .map(goal => renderGoalCard(goal))
                .join('');
        }

        function renderGoalCard(goal) {
            const createdDate = new Date(goal.createdAt).toLocaleDateString();
            const updatedDate = new Date(goal.updatedAt).toLocaleDateString();

            return \`
                <div class="goal-card status-\${goal.status}">
                    <div class="goal-header">
                        <div class="goal-title-section">
                            <div class="goal-title">\${escapeHtml(goal.title)}</div>
                            <div class="goal-meta">
                                <span class="badge priority-\${goal.priority}">\${goal.priority} priority</span>
                                <span class="badge status-\${goal.status}">\${goal.status}</span>
                                <span>Created: \${createdDate}</span>
                                \${goal.updatedAt !== goal.createdAt ? \`<span>Updated: \${updatedDate}</span>\` : ''}
                            </div>
                        </div>
                        <div class="goal-actions">
                            \${goal.status === 'active' ? \`
                                <button class="secondary small" onclick="changeStatus('\${goal.id}', 'paused')">Pause</button>
                                <button class="secondary small" onclick="changeStatus('\${goal.id}', 'completed')">Complete</button>
                            \` : ''}
                            \${goal.status === 'paused' ? \`
                                <button class="secondary small" onclick="changeStatus('\${goal.id}', 'active')">Resume</button>
                            \` : ''}
                            \${goal.status === 'completed' ? \`
                                <button class="secondary small" onclick="changeStatus('\${goal.id}', 'active')">Reopen</button>
                            \` : ''}
                            <button class="secondary small" onclick="editGoal('\${goal.id}')">Edit</button>
                            <button class="danger small" onclick="deleteGoal('\${goal.id}')">Delete</button>
                        </div>
                    </div>

                    \${goal.description ? \`<div class="goal-description">\${escapeHtml(goal.description)}</div>\` : ''}

                    <div class="goal-details">
                        \${goal.tags.length > 0 ? \`
                            <div class="detail-section">
                                <div class="detail-label">Tags</div>
                                <div class="tag-list">
                                    \${goal.tags.map(tag => \`<span class="tag-item">\${escapeHtml(tag)}</span>\`).join('')}
                                </div>
                            </div>
                        \` : ''}

                        \${goal.scope.length > 0 ? \`
                            <div class="detail-section">
                                <div class="detail-label">Scope Patterns (\${goal.scope.length})</div>
                                <div class="scope-list">
                                    \${goal.scope.map(s => \`<span class="scope-item">\${escapeHtml(s)}</span>\`).join('')}
                                </div>
                            </div>
                        \` : ''}

                        \${goal.constraints.length > 0 ? \`
                            <div class="detail-section">
                                <div class="detail-label">Constraints (\${goal.constraints.length})</div>
                                <div class="constraint-list">
                                    \${goal.constraints.map(c => \`<span class="constraint-item">\${escapeHtml(c)}</span>\`).join('')}
                                </div>
                            </div>
                        \` : ''}
                    </div>
                </div>
            \`;
        }

        function updateStats() {
            document.getElementById('totalGoals').textContent = goals.length;
            document.getElementById('activeGoals').textContent = goals.filter(g => g.status === 'active').length;
            document.getElementById('pausedGoals').textContent = goals.filter(g => g.status === 'paused').length;
            document.getElementById('completedGoals').textContent = goals.filter(g => g.status === 'completed').length;
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        vscode.postMessage({ command: 'loadGoals' });
    </script>
</body>
</html>`;
    }
}
