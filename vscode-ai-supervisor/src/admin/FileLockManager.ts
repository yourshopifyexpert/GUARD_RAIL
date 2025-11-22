import * as vscode from 'vscode';

export interface FileLock {
    path: string;
    reason: string;
    lockedAt: number;
    lockedBy: 'user' | 'guardian' | 'system';
    autoUnlock?: number; // Timestamp when to auto-unlock
}

/**
 * Manages file locks to prevent AI modification
 */
export class FileLockManager {
    private locks: Map<string, FileLock> = new Map();
    private decorationType: vscode.TextEditorDecorationType;
    private disposables: vscode.Disposable[] = [];

    constructor(private context: vscode.ExtensionContext) {
        // Create decoration for locked files
        this.decorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 165, 0, 0.1)',
            border: '1px solid rgba(255, 165, 0, 0.3)',
            overviewRulerColor: 'orange',
            overviewRulerLane: vscode.OverviewRulerLane.Right,
            isWholeLine: true
        });

        this.loadLocks();
        this.registerDecorationUpdater();
        this.autoLockCriticalFiles();
    }

    /**
     * Lock a file
     */
    public lockFile(
        filePath: string,
        reason: string = 'Protected file',
        lockedBy: 'user' | 'guardian' | 'system' = 'user',
        autoUnlockAfter?: number
    ): void {
        const lock: FileLock = {
            path: filePath,
            reason,
            lockedAt: Date.now(),
            lockedBy,
            autoUnlock: autoUnlockAfter ? Date.now() + autoUnlockAfter : undefined
        };

        this.locks.set(filePath, lock);
        this.saveLocks();

        // Add decoration to visible editors
        this.updateDecorations();

        const fileName = filePath.split('/').pop() || filePath;
        vscode.window.showInformationMessage(
            `🔒 File Locked: ${fileName}`,
            'View Locks'
        ).then(action => {
            if (action === 'View Locks') {
                this.showLockedFiles();
            }
        });
    }

    /**
     * Unlock a file
     */
    public unlockFile(filePath: string): void {
        if (!this.locks.has(filePath)) {
            vscode.window.showWarningMessage('File is not locked');
            return;
        }

        this.locks.delete(filePath);
        this.saveLocks();
        this.updateDecorations();

        const fileName = filePath.split('/').pop() || filePath;
        vscode.window.showInformationMessage(`🔓 File Unlocked: ${fileName}`);
    }

    /**
     * Check if a file is locked
     */
    public isLocked(filePath: string): boolean {
        const lock = this.locks.get(filePath);

        if (!lock) {
            return false;
        }

        // Check for auto-unlock
        if (lock.autoUnlock && Date.now() > lock.autoUnlock) {
            this.unlockFile(filePath);
            return false;
        }

        return true;
    }

    /**
     * Get lock information for a file
     */
    public getLock(filePath: string): FileLock | undefined {
        return this.locks.get(filePath);
    }

    /**
     * Get all locked files
     */
    public getLockedFiles(): FileLock[] {
        // Clean up expired locks
        this.cleanupExpiredLocks();
        return Array.from(this.locks.values());
    }

    /**
     * Lock multiple files matching a pattern
     */
    public lockPattern(pattern: string, reason: string): void {
        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        // Use glob pattern to find files
        vscode.workspace.findFiles(pattern).then(files => {
            let count = 0;

            files.forEach(file => {
                this.lockFile(file.fsPath, reason, 'user');
                count++;
            });

            vscode.window.showInformationMessage(
                `🔒 Locked ${count} file(s) matching pattern: ${pattern}`
            );
        });
    }

    /**
     * Unlock all files
     */
    public unlockAll(): void {
        const count = this.locks.size;
        this.locks.clear();
        this.saveLocks();
        this.updateDecorations();

        vscode.window.showInformationMessage(`🔓 Unlocked ${count} file(s)`);
    }

    /**
     * Auto-lock critical files based on configuration
     */
    private autoLockCriticalFiles(): void {
        const config = vscode.workspace.getConfiguration('aiSupervisor.admin');
        const lockedFiles = config.get<string[]>('lockedFiles', []);

        if (lockedFiles.length === 0) {
            // Default critical files
            const defaultLocked = [
                'package.json',
                'package-lock.json',
                '.env',
                '.env.local',
                '.env.production',
                'tsconfig.json',
                'webpack.config.js',
                'vite.config.ts'
            ];

            lockedFiles.push(...defaultLocked);
        }

        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (!workspaceFolders) {
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;

        lockedFiles.forEach(file => {
            const fullPath = `${rootPath}/${file}`;
            this.lockFile(fullPath, 'Critical system file', 'system');
        });
    }

    /**
     * Clean up expired locks
     */
    private cleanupExpiredLocks(): void {
        const now = Date.now();
        const expiredPaths: string[] = [];

        this.locks.forEach((lock, path) => {
            if (lock.autoUnlock && now > lock.autoUnlock) {
                expiredPaths.push(path);
            }
        });

        expiredPaths.forEach(path => this.unlockFile(path));
    }

    /**
     * Register decoration updater
     */
    private registerDecorationUpdater(): void {
        // Update decorations when visible editors change
        const editorListener = vscode.window.onDidChangeVisibleTextEditors(() => {
            this.updateDecorations();
        });

        this.disposables.push(editorListener);

        // Update decorations periodically to show lock status
        const interval = setInterval(() => {
            this.updateDecorations();
        }, 5000);

        this.context.subscriptions.push({
            dispose: () => clearInterval(interval)
        });
    }

    /**
     * Update decorations for locked files
     */
    private updateDecorations(): void {
        vscode.window.visibleTextEditors.forEach(editor => {
            const filePath = editor.document.uri.fsPath;

            if (this.isLocked(filePath)) {
                // Add lock decoration to entire file
                const fullRange = new vscode.Range(
                    editor.document.positionAt(0),
                    editor.document.positionAt(editor.document.getText().length)
                );

                editor.setDecorations(this.decorationType, [fullRange]);

                // Show lock indicator in status bar
                const lock = this.getLock(filePath);
                vscode.window.setStatusBarMessage(
                    `🔒 LOCKED: ${lock?.reason || 'Protected'}`,
                    5000
                );
            } else {
                // Clear decorations
                editor.setDecorations(this.decorationType, []);
            }
        });
    }

    /**
     * Show quick pick of locked files
     */
    public async showLockedFiles(): Promise<void> {
        const locks = this.getLockedFiles();

        if (locks.length === 0) {
            vscode.window.showInformationMessage('No files are currently locked');
            return;
        }

        const items = locks.map(lock => ({
            label: `🔒 ${lock.path.split('/').pop() || lock.path}`,
            description: lock.reason,
            detail: `Locked by: ${lock.lockedBy} | ${new Date(lock.lockedAt).toLocaleString()}`,
            lock
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a locked file to unlock',
            canPickMany: false
        });

        if (selected) {
            const action = await vscode.window.showQuickPick(
                ['Unlock', 'View File', 'Cancel'],
                { placeHolder: `Action for ${selected.label}` }
            );

            if (action === 'Unlock') {
                this.unlockFile(selected.lock.path);
            } else if (action === 'View File') {
                const uri = vscode.Uri.file(selected.lock.path);
                await vscode.window.showTextDocument(uri);
            }
        }
    }

    /**
     * Save locks to workspace state
     */
    private saveLocks(): void {
        const locksArray = Array.from(this.locks.entries()).map(([path, lock]) => ({
            path,
            ...lock
        }));

        this.context.workspaceState.update('aiSupervisor.fileLocks', locksArray);
    }

    /**
     * Load locks from workspace state
     */
    private loadLocks(): void {
        const locksArray = this.context.workspaceState.get<any[]>('aiSupervisor.fileLocks', []);

        locksArray.forEach(lockData => {
            const { path, ...lock } = lockData;
            this.locks.set(path, lock);
        });

        console.log(`[FileLockManager] Loaded ${this.locks.size} file locks`);
    }

    /**
     * Export locks for reporting
     */
    public exportLocks(): string {
        const locks = this.getLockedFiles();

        const report = locks.map(lock => ({
            file: lock.path.split('/').pop(),
            fullPath: lock.path,
            reason: lock.reason,
            lockedBy: lock.lockedBy,
            lockedAt: new Date(lock.lockedAt).toISOString()
        }));

        return JSON.stringify(report, null, 2);
    }

    /**
     * Dispose of all resources
     */
    public dispose(): void {
        this.decorationType.dispose();
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
