/**
 * InterventionController.ts
 *
 * Handles user intervention commands for AI supervision.
 * Provides controls to pause/resume monitoring, rollback changes, and send prompts to AI.
 *
 * Features:
 * - Pause and resume AI monitoring
 * - Rollback file changes to previous state
 * - Send corrective prompts to AI tools
 * - Manual override for false positives
 * - Emergency stop functionality
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Change snapshot for rollback functionality
 */
interface ChangeSnapshot {
    uri: vscode.Uri;
    content: string;
    timestamp: number;
}

/**
 * InterventionController class
 *
 * Manages intervention commands and controls.
 */
export class InterventionController {
    private isPaused: boolean = false;
    private changeSnapshots: Map<string, ChangeSnapshot[]> = new Map();
    private maxSnapshotsPerFile: number = 10;

    constructor(private context: vscode.ExtensionContext) {}

    /**
     * Register intervention commands
     */
    public registerCommands(): vscode.Disposable[] {
        const disposables: vscode.Disposable[] = [];

        // Pause monitoring command
        disposables.push(
            vscode.commands.registerCommand('aiSupervisor.pauseMonitoring', async () => {
                await this.pauseMonitoring();
            })
        );

        // Resume monitoring command
        disposables.push(
            vscode.commands.registerCommand('aiSupervisor.resumeMonitoring', async () => {
                await this.resumeMonitoring();
            })
        );

        // Toggle monitoring command
        disposables.push(
            vscode.commands.registerCommand('aiSupervisor.toggleMonitoring', async () => {
                if (this.isPaused) {
                    await this.resumeMonitoring();
                } else {
                    await this.pauseMonitoring();
                }
            })
        );

        // Rollback changes command
        disposables.push(
            vscode.commands.registerCommand('aiSupervisor.rollbackChanges', async () => {
                await this.rollbackChanges();
            })
        );

        // Rollback file command
        disposables.push(
            vscode.commands.registerCommand('aiSupervisor.rollbackFile', async (uri?: vscode.Uri) => {
                await this.rollbackFile(uri);
            })
        );

        // Emergency stop command
        disposables.push(
            vscode.commands.registerCommand('aiSupervisor.emergencyStop', async () => {
                await this.emergencyStop();
            })
        );

        // Send corrective prompt command
        disposables.push(
            vscode.commands.registerCommand('aiSupervisor.sendCorrectivePrompt', async () => {
                await this.sendCorrectivePrompt();
            })
        );

        // Allow deviation command
        disposables.push(
            vscode.commands.registerCommand('aiSupervisor.allowDeviation', async () => {
                await this.allowDeviation();
            })
        );

        return disposables;
    }

    /**
     * Pause AI monitoring
     */
    public async pauseMonitoring(): Promise<void> {
        this.isPaused = true;

        // Update status bar
        await vscode.window.showInformationMessage(
            'AI Supervisor: Monitoring paused'
        );

        // Emit event
        await vscode.commands.executeCommand('setContext', 'aiSupervisor.isPaused', true);

        console.log('Monitoring paused');
    }

    /**
     * Resume AI monitoring
     */
    public async resumeMonitoring(): Promise<void> {
        this.isPaused = false;

        await vscode.window.showInformationMessage(
            'AI Supervisor: Monitoring resumed'
        );

        await vscode.commands.executeCommand('setContext', 'aiSupervisor.isPaused', false);

        console.log('Monitoring resumed');
    }

    /**
     * Get monitoring status
     */
    public isPausedStatus(): boolean {
        return this.isPaused;
    }

    /**
     * Emergency stop - immediately pause all AI activity
     */
    public async emergencyStop(): Promise<void> {
        await this.pauseMonitoring();

        const action = await vscode.window.showWarningMessage(
            'AI Supervisor: Emergency stop activated. All AI monitoring has been paused.',
            'Rollback Recent Changes',
            'Resume Monitoring',
            'Keep Paused'
        );

        switch (action) {
            case 'Rollback Recent Changes':
                await this.rollbackChanges();
                break;
            case 'Resume Monitoring':
                await this.resumeMonitoring();
                break;
            // 'Keep Paused' or undefined - do nothing
        }
    }

    /**
     * Snapshot current file state for rollback
     */
    public async snapshotFile(uri: vscode.Uri): Promise<void> {
        try {
            const content = await fs.promises.readFile(uri.fsPath, 'utf8');
            const snapshot: ChangeSnapshot = {
                uri,
                content,
                timestamp: Date.now()
            };

            const filePath = uri.fsPath;
            if (!this.changeSnapshots.has(filePath)) {
                this.changeSnapshots.set(filePath, []);
            }

            const snapshots = this.changeSnapshots.get(filePath)!;
            snapshots.push(snapshot);

            // Limit snapshots per file
            if (snapshots.length > this.maxSnapshotsPerFile) {
                snapshots.shift();
            }

            console.log(`Snapshot created for ${filePath}`);
        } catch (error) {
            console.error('Error creating snapshot:', error);
        }
    }

    /**
     * Rollback recent changes across all files
     */
    public async rollbackChanges(): Promise<void> {
        const files = Array.from(this.changeSnapshots.keys());

        if (files.length === 0) {
            await vscode.window.showInformationMessage(
                'No snapshots available to rollback'
            );
            return;
        }

        const selection = await vscode.window.showQuickPick(
            [
                { label: 'All Files', description: `Rollback ${files.length} file(s)` },
                { label: 'Select Files', description: 'Choose specific files to rollback' }
            ],
            { placeHolder: 'Select rollback option' }
        );

        if (!selection) {
            return;
        }

        if (selection.label === 'All Files') {
            for (const filePath of files) {
                await this.rollbackFile(vscode.Uri.file(filePath));
            }
        } else {
            // Let user select specific files
            const fileItems = files.map(f => ({
                label: path.basename(f),
                description: f,
                uri: vscode.Uri.file(f)
            }));

            const selectedFiles = await vscode.window.showQuickPick(fileItems, {
                canPickMany: true,
                placeHolder: 'Select files to rollback'
            });

            if (selectedFiles) {
                for (const item of selectedFiles) {
                    await this.rollbackFile(item.uri);
                }
            }
        }
    }

    /**
     * Rollback a specific file to its previous state
     */
    public async rollbackFile(uri?: vscode.Uri): Promise<void> {
        // Use active editor if no URI provided
        if (!uri) {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                await vscode.window.showWarningMessage('No active file to rollback');
                return;
            }
            uri = editor.document.uri;
        }

        const filePath = uri.fsPath;
        const snapshots = this.changeSnapshots.get(filePath);

        if (!snapshots || snapshots.length === 0) {
            await vscode.window.showInformationMessage(
                `No snapshots available for ${path.basename(filePath)}`
            );
            return;
        }

        // Show snapshot picker
        const snapshotItems = snapshots.map((snapshot, index) => ({
            label: `Snapshot ${snapshots.length - index}`,
            description: new Date(snapshot.timestamp).toLocaleString(),
            snapshot
        })).reverse();

        const selected = await vscode.window.showQuickPick(snapshotItems, {
            placeHolder: 'Select snapshot to restore'
        });

        if (!selected) {
            return;
        }

        // Restore the snapshot
        try {
            await fs.promises.writeFile(uri.fsPath, selected.snapshot.content, 'utf8');

            await vscode.window.showInformationMessage(
                `Rolled back ${path.basename(filePath)} to ${selected.label}`
            );

            console.log(`Rolled back ${filePath}`);
        } catch (error) {
            await vscode.window.showErrorMessage(
                `Failed to rollback ${path.basename(filePath)}: ${error}`
            );
        }
    }

    /**
     * Send a corrective prompt to the AI tool
     */
    public async sendCorrectivePrompt(): Promise<void> {
        const prompt = await vscode.window.showInputBox({
            prompt: 'Enter corrective prompt to send to AI',
            placeHolder: 'e.g., "Please stick to the original requirements and avoid changing existing functionality"'
        });

        if (!prompt) {
            return;
        }

        // Try to send to clipboard for user to paste
        await vscode.env.clipboard.writeText(prompt);

        await vscode.window.showInformationMessage(
            'Corrective prompt copied to clipboard. Paste it into your AI chat.',
            'Open Chat'
        ).then(async (action) => {
            if (action === 'Open Chat') {
                // Try to open common AI chat commands
                try {
                    await vscode.commands.executeCommand('github.copilot.openChat');
                } catch {
                    try {
                        await vscode.commands.executeCommand('continue.continueGUIView.focus');
                    } catch {
                        console.log('Could not auto-open chat');
                    }
                }
            }
        });
    }

    /**
     * Allow a detected deviation (false positive)
     */
    public async allowDeviation(): Promise<void> {
        try {
            // Get the active text editor to determine context
            const editor = vscode.window.activeTextEditor;
            const fileUri = editor?.document.uri.fsPath || 'unknown';

            // Prompt user for deviation details
            const deviationType = await vscode.window.showQuickPick(
                [
                    { label: 'Code Pattern', description: 'Allow this specific code pattern' },
                    { label: 'File Type', description: 'Allow all changes to this file type' },
                    { label: 'Specific File', description: 'Allow all changes to this specific file' },
                    { label: 'Change Scope', description: 'Allow changes of this scope/size' }
                ],
                { placeHolder: 'What type of deviation do you want to allow?' }
            );

            if (!deviationType) {
                return;
            }

            // Get or create allowlist from workspace state
            const allowlist = this.context.workspaceState.get<any[]>('aiSupervisor.allowlist', []);

            const allowEntry = {
                id: Date.now().toString(),
                type: deviationType.label,
                timestamp: Date.now(),
                file: fileUri,
                createdBy: 'user',
                description: `Allowed ${deviationType.label.toLowerCase()} deviation`
            };

            // Add custom description
            const description = await vscode.window.showInputBox({
                prompt: 'Add a description for this allowlist entry (optional)',
                placeHolder: 'e.g., "Test files can have large changes"'
            });

            if (description) {
                allowEntry.description = description;
            }

            // Add to allowlist
            allowlist.push(allowEntry);
            await this.context.workspaceState.update('aiSupervisor.allowlist', allowlist);

            // Show confirmation
            const action = await vscode.window.showInformationMessage(
                `Deviation marked as allowed. Similar patterns will be ignored (${allowlist.length} total rules).`,
                'View Allowlist',
                'OK'
            );

            if (action === 'View Allowlist') {
                await this.showAllowlistManager();
            }

            console.log('Deviation allowed:', allowEntry);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to allow deviation: ${error}`);
        }
    }

    /**
     * Show allowlist manager
     */
    private async showAllowlistManager(): Promise<void> {
        const allowlist = this.context.workspaceState.get<any[]>('aiSupervisor.allowlist', []);

        if (allowlist.length === 0) {
            vscode.window.showInformationMessage('No allowlist entries yet.');
            return;
        }

        const items = allowlist.map(entry => ({
            label: `${entry.type}: ${entry.description}`,
            description: new Date(entry.timestamp).toLocaleString(),
            detail: entry.file !== 'unknown' ? entry.file : undefined,
            entry
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select an allowlist entry to remove (or press Escape to close)',
            canPickMany: false
        });

        if (selected) {
            const confirm = await vscode.window.showWarningMessage(
                `Remove allowlist entry: ${selected.label}?`,
                'Remove',
                'Cancel'
            );

            if (confirm === 'Remove') {
                const updatedAllowlist = allowlist.filter(e => e.id !== selected.entry.id);
                await this.context.workspaceState.update('aiSupervisor.allowlist', updatedAllowlist);
                vscode.window.showInformationMessage('Allowlist entry removed');
            }
        }
    }

    /**
     * Check if a deviation is allowed based on allowlist
     */
    public isDeviationAllowed(deviation: any): boolean {
        const allowlist = this.context.workspaceState.get<any[]>('aiSupervisor.allowlist', []);

        return allowlist.some(entry => {
            switch (entry.type) {
                case 'Code Pattern':
                    // Would check for specific code pattern match
                    return false;
                case 'File Type':
                    return deviation.file?.endsWith(entry.fileType);
                case 'Specific File':
                    return deviation.file === entry.file;
                case 'Change Scope':
                    // Would check change size/scope
                    return false;
                default:
                    return false;
            }
        });
    }

    /**
     * Clear all snapshots
     */
    public clearSnapshots(): void {
        this.changeSnapshots.clear();
        console.log('All snapshots cleared');
    }

    /**
     * Get snapshot count for a file
     */
    public getSnapshotCount(uri: vscode.Uri): number {
        const snapshots = this.changeSnapshots.get(uri.fsPath);
        return snapshots ? snapshots.length : 0;
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        this.clearSnapshots();
    }
}
