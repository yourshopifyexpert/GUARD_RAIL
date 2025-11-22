import * as vscode from 'vscode';
import { FileLockManager } from './FileLockManager';

export interface EditEvent {
    document: vscode.TextDocument;
    changes: vscode.TextDocumentContentChangeEvent[];
    timestamp: number;
    blocked: boolean;
    reason?: string;
}

/**
 * Guards against unauthorized edits
 * Monitors text changes and can prevent saves of locked files
 */
export class EditGuard {
    private disposables: vscode.Disposable[] = [];
    private editHistory: EditEvent[] = [];
    private lockManager: FileLockManager;
    private editMode: 'permissive' | 'approval' | 'locked' = 'approval';

    constructor(
        private context: vscode.ExtensionContext,
        lockManager: FileLockManager
    ) {
        this.lockManager = lockManager;
        this.loadEditMode();
        this.registerEditMonitor();
        this.registerSaveGuard();
    }

    /**
     * Register text document change monitor
     */
    private registerEditMonitor(): void {
        const changeListener = vscode.workspace.onDidChangeTextDocument(
            (event: vscode.TextDocumentChangeEvent) => {
                this.handleTextChange(event);
            }
        );

        this.disposables.push(changeListener);
    }

    /**
     * Register save guard (additional layer with FileLockManager)
     */
    private registerSaveGuard(): void {
        const saveGuard = vscode.workspace.onWillSaveTextDocument(
            async (event: vscode.TextDocumentWillSaveEvent) => {
                // Check if file is locked
                const filePath = event.document.uri.fsPath;

                if (this.lockManager.isLocked(filePath)) {
                    const lock = this.lockManager.getLock(filePath);

                    // BLOCK the save with an error
                    event.waitUntil(
                        Promise.reject(
                            new Error(`🔒 File is LOCKED: ${lock?.reason || 'Protected file'}`)
                        )
                    );

                    vscode.window.showErrorMessage(
                        `🔒 Save Blocked - File is Locked\n\nFile: ${filePath.split('/').pop()}\nReason: ${lock?.reason || 'Protected'}`,
                        'Unlock File'
                    ).then(action => {
                        if (action === 'Unlock File') {
                            this.lockManager.unlockFile(filePath);
                            vscode.window.showInformationMessage('File unlocked - you can now save');
                        }
                    });

                    return;
                }

                // Check edit mode
                if (this.editMode === 'locked') {
                    // In locked mode, require explicit approval for ALL saves
                    event.waitUntil(this.requestSavePermission(event.document));
                }
            }
        );

        this.disposables.push(saveGuard);
    }

    /**
     * Handle text document changes
     */
    private handleTextChange(event: vscode.TextDocumentChangeEvent): void {
        const filePath = event.document.uri.fsPath;

        // Ignore untitled documents
        if (event.document.isUntitled) {
            return;
        }

        // Check if file is locked
        if (this.lockManager.isLocked(filePath)) {
            // Log the attempt
            this.logEditAttempt(event, true, 'File is locked');

            // Show warning (but we can't actually prevent the edit in-memory)
            vscode.window.showWarningMessage(
                `⚠️ Warning: Editing locked file - Changes cannot be saved!`,
                'Unlock'
            ).then(action => {
                if (action === 'Unlock') {
                    this.lockManager.unlockFile(filePath);
                }
            });

            return;
        }

        // Log the edit
        this.logEditAttempt(event, false);

        // Check for large changes
        const totalChanges = event.contentChanges.reduce(
            (sum, change) => sum + Math.abs(change.text.length - change.rangeLength),
            0
        );

        // Alert on large changes (possible AI generation)
        if (totalChanges > 500) {
            const config = vscode.workspace.getConfiguration('aiSupervisor.admin');
            const alertLargeChanges = config.get<boolean>('alertLargeChanges', true);

            if (alertLargeChanges) {
                vscode.window.showInformationMessage(
                    `📝 Large change detected: ${totalChanges} characters in ${filePath.split('/').pop()}`
                );
            }
        }
    }

    /**
     * Request permission to save (for locked mode)
     */
    private async requestSavePermission(document: vscode.TextDocument): Promise<void> {
        const fileName = document.uri.fsPath.split('/').pop() || 'file';

        const result = await vscode.window.showWarningMessage(
            `🔒 LOCKED MODE - Save Permission Required\n\nFile: ${fileName}\n\nAllow this save?`,
            { modal: true },
            'Allow',
            'Deny'
        );

        if (result !== 'Allow') {
            throw new Error('Save denied by user in locked mode');
        }
    }

    /**
     * Log an edit attempt
     */
    private logEditAttempt(
        event: vscode.TextDocumentChangeEvent,
        blocked: boolean,
        reason?: string
    ): void {
        const editEvent: EditEvent = {
            document: event.document,
            changes: Array.from(event.contentChanges),
            timestamp: Date.now(),
            blocked,
            reason
        };

        this.editHistory.push(editEvent);

        // Keep only last 50 edits
        if (this.editHistory.length > 50) {
            this.editHistory = this.editHistory.slice(-50);
        }
    }

    /**
     * Detect changes between old and new content
     */
    public async detectChanges(document: vscode.TextDocument): Promise<{
        added: number;
        removed: number;
        modified: number;
    }> {
        try {
            // Get current content
            const currentContent = document.getText();

            // Try to get saved content
            const savedContent = await this.getSavedContent(document.uri);

            if (!savedContent) {
                return { added: 0, removed: 0, modified: 0 };
            }

            // Simple line-based diff
            const currentLines = currentContent.split('\n');
            const savedLines = savedContent.split('\n');

            let added = 0;
            let removed = 0;
            let modified = 0;

            const maxLen = Math.max(currentLines.length, savedLines.length);

            for (let i = 0; i < maxLen; i++) {
                const current = currentLines[i];
                const saved = savedLines[i];

                if (current === undefined) {
                    removed++;
                } else if (saved === undefined) {
                    added++;
                } else if (current !== saved) {
                    modified++;
                }
            }

            return { added, removed, modified };
        } catch (error) {
            console.error('[EditGuard] Error detecting changes:', error);
            return { added: 0, removed: 0, modified: 0 };
        }
    }

    /**
     * Get saved content of a document
     */
    private async getSavedContent(uri: vscode.Uri): Promise<string | null> {
        try {
            const fileContent = await vscode.workspace.fs.readFile(uri);
            return Buffer.from(fileContent).toString('utf8');
        } catch (error) {
            return null;
        }
    }

    /**
     * Set edit mode
     */
    public setEditMode(mode: 'permissive' | 'approval' | 'locked'): void {
        this.editMode = mode;
        this.saveEditMode();

        const messages = {
            permissive: '✅ Edit Mode: PERMISSIVE - All edits allowed',
            approval: '⚠️ Edit Mode: APPROVAL - Requires approval for saves',
            locked: '🔒 Edit Mode: LOCKED - All saves require explicit permission'
        };

        vscode.window.showInformationMessage(messages[mode]);
    }

    /**
     * Get current edit mode
     */
    public getEditMode(): 'permissive' | 'approval' | 'locked' {
        return this.editMode;
    }

    /**
     * Get edit history
     */
    public getEditHistory(): EditEvent[] {
        return [...this.editHistory];
    }

    /**
     * Get blocked edits count
     */
    public getBlockedCount(): number {
        return this.editHistory.filter(e => e.blocked).length;
    }

    /**
     * Clear edit history
     */
    public clearHistory(): void {
        this.editHistory = [];
        vscode.window.showInformationMessage('Edit history cleared');
    }

    /**
     * Save edit mode to configuration
     */
    private saveEditMode(): void {
        const config = vscode.workspace.getConfiguration('aiSupervisor.admin');
        config.update('editMode', this.editMode, vscode.ConfigurationTarget.Global);
    }

    /**
     * Load edit mode from configuration
     */
    private loadEditMode(): void {
        const config = vscode.workspace.getConfiguration('aiSupervisor.admin');
        this.editMode = config.get<'permissive' | 'approval' | 'locked'>('editMode', 'approval');
    }

    /**
     * Revert a document to its saved state
     */
    public async revertDocument(uri: vscode.Uri): Promise<boolean> {
        try {
            const savedContent = await this.getSavedContent(uri);

            if (!savedContent) {
                vscode.window.showErrorMessage('Cannot revert: No saved version found');
                return false;
            }

            const document = await vscode.workspace.openTextDocument(uri);
            const edit = new vscode.WorkspaceEdit();

            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(document.getText().length)
            );

            edit.replace(uri, fullRange, savedContent);
            const success = await vscode.workspace.applyEdit(edit);

            if (success) {
                vscode.window.showInformationMessage('✅ Document reverted to saved state');
            }

            return success;
        } catch (error) {
            console.error('[EditGuard] Revert failed:', error);
            vscode.window.showErrorMessage('Failed to revert document');
            return false;
        }
    }

    /**
     * Dispose of all resources
     */
    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
