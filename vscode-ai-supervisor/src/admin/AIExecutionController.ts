import * as vscode from 'vscode';
import { CommandInterceptor } from './CommandInterceptor';
import { FileLockManager } from './FileLockManager';
import { EditGuard } from './EditGuard';

export type ExecutionState = 'running' | 'paused' | 'stopped';

export interface PendingOperation {
    id: string;
    type: 'edit' | 'command' | 'save';
    description: string;
    timestamp: number;
    uri?: vscode.Uri;
}

/**
 * Controls AI execution state - pause, resume, emergency stop
 */
export class AIExecutionController {
    private state: ExecutionState = 'running';
    private executionQueue: PendingOperation[] = [];
    private commandInterceptor: CommandInterceptor;
    private lockManager: FileLockManager;
    private editGuard: EditGuard;
    private statusBarItem: vscode.StatusBarItem;

    constructor(
        private context: vscode.ExtensionContext,
        commandInterceptor: CommandInterceptor,
        lockManager: FileLockManager,
        editGuard: EditGuard
    ) {
        this.commandInterceptor = commandInterceptor;
        this.lockManager = lockManager;
        this.editGuard = editGuard;

        // Create status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            1000
        );
        this.statusBarItem.command = 'aiSupervisor.admin.showExecutionStatus';
        this.updateStatusBar();
        this.statusBarItem.show();

        this.context.subscriptions.push(this.statusBarItem);
    }

    /**
     * Pause AI execution
     */
    public pause(): void {
        this.state = 'paused';

        // Pause command interception
        this.commandInterceptor.pauseExecution();

        // Set edit guard to locked mode
        this.editGuard.setEditMode('locked');

        // Update status bar
        this.updateStatusBar();

        vscode.window.showWarningMessage(
            '⏸️ AI EXECUTION PAUSED',
            'Resume',
            'Emergency Stop'
        ).then(action => {
            if (action === 'Resume') {
                this.resume();
            } else if (action === 'Emergency Stop') {
                this.emergencyStop();
            }
        });

        console.log('[AIExecutionController] Execution PAUSED');
    }

    /**
     * Resume AI execution
     */
    public resume(): void {
        this.state = 'running';

        // Resume command interception
        this.commandInterceptor.resumeExecution();

        // Reset edit guard to approval mode
        this.editGuard.setEditMode('approval');

        // Process queued operations
        this.processQueue();

        // Update status bar
        this.updateStatusBar();

        vscode.window.showInformationMessage('▶️ AI EXECUTION RESUMED');

        console.log('[AIExecutionController] Execution RESUMED');
    }

    /**
     * Emergency stop - halt ALL operations immediately
     */
    public emergencyStop(): void {
        this.state = 'stopped';

        // Block ALL AI commands
        this.commandInterceptor.blockAllAICommands();

        // Set edit guard to fully locked
        this.editGuard.setEditMode('locked');

        // Clear execution queue
        const queueSize = this.executionQueue.length;
        this.executionQueue = [];

        // Revert all pending changes
        this.revertPendingChanges();

        // Lock all currently open files
        this.lockAllOpenFiles();

        // Update status bar
        this.updateStatusBar();

        vscode.window.showErrorMessage(
            `🛑 EMERGENCY STOP ACTIVATED\n\n` +
            `- All AI operations halted\n` +
            `- ${queueSize} pending operations cancelled\n` +
            `- All open files locked\n` +
            `- Pending changes reverted`,
            'Unlock & Resume',
            'Keep Stopped'
        ).then(action => {
            if (action === 'Unlock & Resume') {
                this.unlockAndResume();
            }
        });

        console.log('[AIExecutionController] EMERGENCY STOP activated');
    }

    /**
     * Unlock and resume after emergency stop
     */
    private unlockAndResume(): void {
        // Unblock all commands
        this.commandInterceptor.unblockAllAICommands();

        // Resume execution
        this.resume();

        vscode.window.showInformationMessage('System unlocked and resumed');
    }

    /**
     * Lock all currently open files
     */
    private lockAllOpenFiles(): void {
        const editors = vscode.window.visibleTextEditors;

        editors.forEach(editor => {
            const filePath = editor.document.uri.fsPath;

            if (!this.lockManager.isLocked(filePath)) {
                this.lockManager.lockFile(
                    filePath,
                    'Emergency stop - Auto-locked',
                    'system'
                );
            }
        });
    }

    /**
     * Revert all pending changes in open editors
     */
    private async revertPendingChanges(): Promise<void> {
        const dirtyDocuments = vscode.workspace.textDocuments.filter(doc => doc.isDirty);

        for (const document of dirtyDocuments) {
            try {
                await this.editGuard.revertDocument(document.uri);
            } catch (error) {
                console.error('[AIExecutionController] Failed to revert:', error);
            }
        }

        if (dirtyDocuments.length > 0) {
            vscode.window.showInformationMessage(
                `🔄 Reverted ${dirtyDocuments.length} file(s) to saved state`
            );
        }
    }

    /**
     * Add operation to queue
     */
    public queueOperation(operation: Omit<PendingOperation, 'id' | 'timestamp'>): void {
        const fullOperation: PendingOperation = {
            ...operation,
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            timestamp: Date.now()
        };

        this.executionQueue.push(fullOperation);

        vscode.window.showInformationMessage(
            `📋 Operation queued: ${operation.description}`
        );
    }

    /**
     * Process queued operations
     */
    private async processQueue(): Promise<void> {
        if (this.state !== 'running') {
            return;
        }

        const queue = [...this.executionQueue];
        this.executionQueue = [];

        for (const operation of queue) {
            await this.executeOperation(operation);
        }

        if (queue.length > 0) {
            vscode.window.showInformationMessage(
                `✅ Processed ${queue.length} queued operation(s)`
            );
        }
    }

    /**
     * Execute a queued operation
     */
    private async executeOperation(operation: PendingOperation): Promise<void> {
        try {
            console.log(`[AIExecutionController] Executing queued operation: ${operation.type}`);

            switch (operation.type) {
                case 'save':
                    if (operation.uri) {
                        const document = await vscode.workspace.openTextDocument(operation.uri);
                        await document.save();
                    }
                    break;

                case 'command':
                    // Command execution would happen here
                    break;

                case 'edit':
                    // Edit operations would be applied here
                    break;
            }
        } catch (error) {
            console.error('[AIExecutionController] Failed to execute operation:', error);
        }
    }

    /**
     * Get current execution state
     */
    public getState(): ExecutionState {
        return this.state;
    }

    /**
     * Get pending operations
     */
    public getPendingOperations(): PendingOperation[] {
        return [...this.executionQueue];
    }

    /**
     * Clear all pending operations
     */
    public clearQueue(): void {
        const count = this.executionQueue.length;
        this.executionQueue = [];

        vscode.window.showInformationMessage(`🗑️ Cleared ${count} pending operation(s)`);
    }

    /**
     * Update status bar
     */
    private updateStatusBar(): void {
        const icons = {
            running: '▶️',
            paused: '⏸️',
            stopped: '🛑'
        };

        const colors = {
            running: new vscode.ThemeColor('statusBarItem.prominentForeground'),
            paused: new vscode.ThemeColor('statusBarItem.warningForeground'),
            stopped: new vscode.ThemeColor('statusBarItem.errorForeground')
        };

        this.statusBarItem.text = `${icons[this.state]} AI: ${this.state.toUpperCase()}`;
        this.statusBarItem.backgroundColor = colors[this.state];

        if (this.executionQueue.length > 0) {
            this.statusBarItem.text += ` (${this.executionQueue.length} queued)`;
        }

        this.statusBarItem.tooltip = this.getStatusTooltip();
    }

    /**
     * Get status tooltip
     */
    private getStatusTooltip(): string {
        const lines = [
            `AI Execution State: ${this.state.toUpperCase()}`,
            ``,
            `Pending Operations: ${this.executionQueue.length}`,
            `Locked Files: ${this.lockManager.getLockedFiles().length}`,
            `Edit Mode: ${this.editGuard.getEditMode()}`,
            ``,
            `Click for details`
        ];

        return lines.join('\n');
    }

    /**
     * Show execution status panel
     */
    public async showStatus(): Promise<void> {
        const state = this.state;
        const queueSize = this.executionQueue.length;
        const lockedFiles = this.lockManager.getLockedFiles();
        const editMode = this.editGuard.getEditMode();
        const blockedCommands = this.commandInterceptor.getBlockedCommands();

        const message = [
            `🤖 AI Execution Status`,
            ``,
            `State: ${state.toUpperCase()}`,
            `Edit Mode: ${editMode}`,
            ``,
            `📋 Queue: ${queueSize} pending operations`,
            `🔒 Locks: ${lockedFiles.length} files locked`,
            `🚫 Blocks: ${blockedCommands.length} commands blocked`,
            ``,
            `What would you like to do?`
        ].join('\n');

        const actions = [];

        if (state === 'running') {
            actions.push('Pause', 'Emergency Stop');
        } else if (state === 'paused') {
            actions.push('Resume', 'Emergency Stop');
        } else {
            actions.push('Resume');
        }

        actions.push('View Queue', 'View Locks');

        const result = await vscode.window.showInformationMessage(
            message,
            { modal: false },
            ...actions
        );

        switch (result) {
            case 'Pause':
                this.pause();
                break;
            case 'Resume':
                this.resume();
                break;
            case 'Emergency Stop':
                this.emergencyStop();
                break;
            case 'View Queue':
                this.showQueue();
                break;
            case 'View Locks':
                this.lockManager.showLockedFiles();
                break;
        }
    }

    /**
     * Show execution queue
     */
    private async showQueue(): Promise<void> {
        if (this.executionQueue.length === 0) {
            vscode.window.showInformationMessage('No pending operations');
            return;
        }

        const items = this.executionQueue.map(op => ({
            label: `${this.getOperationIcon(op.type)} ${op.description}`,
            description: new Date(op.timestamp).toLocaleTimeString(),
            detail: op.uri?.fsPath || '',
            operation: op
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Pending operations',
            canPickMany: false
        });

        if (selected) {
            const action = await vscode.window.showQuickPick(
                ['Remove from Queue', 'Execute Now', 'Cancel'],
                { placeHolder: 'Choose action' }
            );

            if (action === 'Remove from Queue') {
                this.executionQueue = this.executionQueue.filter(
                    op => op.id !== selected.operation.id
                );
                vscode.window.showInformationMessage('Operation removed from queue');
            } else if (action === 'Execute Now') {
                await this.executeOperation(selected.operation);
                this.executionQueue = this.executionQueue.filter(
                    op => op.id !== selected.operation.id
                );
            }
        }
    }

    /**
     * Get icon for operation type
     */
    private getOperationIcon(type: string): string {
        const icons: Record<string, string> = {
            save: '💾',
            edit: '✏️',
            command: '⚡'
        };

        return icons[type] || '📝';
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        this.statusBarItem.dispose();
    }
}
