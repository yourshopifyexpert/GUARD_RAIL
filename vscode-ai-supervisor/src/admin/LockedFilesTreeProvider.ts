import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Represents a locked file in the tree view
 */
export class LockedFileItem extends vscode.TreeItem {
    constructor(
        public readonly filePath: string,
        public readonly reason: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(path.basename(filePath), collapsibleState);

        this.tooltip = `${filePath}\nReason: ${reason}`;
        this.description = reason;
        this.contextValue = 'lockedFile';
        this.iconPath = new vscode.ThemeIcon('lock', new vscode.ThemeColor('errorForeground'));

        // Add command to view file when clicked
        this.command = {
            command: 'vscode.open',
            title: 'View File',
            arguments: [vscode.Uri.file(filePath)]
        };
    }
}

/**
 * Tree data provider for locked files sidebar view
 * Shows all files that are locked from AI modifications
 */
export class LockedFilesTreeProvider implements vscode.TreeDataProvider<LockedFileItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<LockedFileItem | undefined | null | void> = new vscode.EventEmitter<LockedFileItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<LockedFileItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext) {
        // Watch for configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('aiSupervisor.admin.lockedFiles')) {
                this.refresh();
            }
        });
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: LockedFileItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: LockedFileItem): Promise<LockedFileItem[]> {
        if (element) {
            // No children for locked files
            return [];
        }

        // Get locked files from configuration
        const config = vscode.workspace.getConfiguration('aiSupervisor');
        const lockedFiles = config.get<Array<{ path: string; reason: string }>>('admin.lockedFiles', []);

        if (lockedFiles.length === 0) {
            return [];
        }

        // Convert to tree items
        return lockedFiles.map(file => {
            // Resolve full path if it's relative
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            const fullPath = workspaceFolder
                ? path.join(workspaceFolder.uri.fsPath, file.path)
                : file.path;

            return new LockedFileItem(
                fullPath,
                file.reason,
                vscode.TreeItemCollapsibleState.None
            );
        });
    }

    /**
     * Add a file to the locked list
     */
    async lockFile(filePath: string, reason: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('aiSupervisor');
        const lockedFiles = config.get<Array<{ path: string; reason: string }>>('admin.lockedFiles', []);

        // Make path relative to workspace
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const relativePath = workspaceFolder
            ? path.relative(workspaceFolder.uri.fsPath, filePath)
            : filePath;

        // Check if already locked
        if (lockedFiles.some(f => f.path === relativePath)) {
            vscode.window.showWarningMessage(`File already locked: ${relativePath}`);
            return;
        }

        // Add to locked files
        lockedFiles.push({ path: relativePath, reason });
        await config.update('admin.lockedFiles', lockedFiles, vscode.ConfigurationTarget.Workspace);

        vscode.window.showInformationMessage(`🔒 Locked: ${relativePath}`);
        this.refresh();
    }

    /**
     * Remove a file from the locked list
     */
    async unlockFile(filePath: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('aiSupervisor');
        const lockedFiles = config.get<Array<{ path: string; reason: string }>>('admin.lockedFiles', []);

        // Make path relative to workspace
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const relativePath = workspaceFolder
            ? path.relative(workspaceFolder.uri.fsPath, filePath)
            : filePath;

        // Filter out the file
        const filtered = lockedFiles.filter(f => f.path !== relativePath);

        if (filtered.length === lockedFiles.length) {
            vscode.window.showWarningMessage(`File not locked: ${relativePath}`);
            return;
        }

        await config.update('admin.lockedFiles', filtered, vscode.ConfigurationTarget.Workspace);

        vscode.window.showInformationMessage(`🔓 Unlocked: ${relativePath}`);
        this.refresh();
    }

    /**
     * Check if a file is locked
     */
    isFileLocked(filePath: string): boolean {
        const config = vscode.workspace.getConfiguration('aiSupervisor');
        const lockedFiles = config.get<Array<{ path: string; reason: string }>>('admin.lockedFiles', []);

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const relativePath = workspaceFolder
            ? path.relative(workspaceFolder.uri.fsPath, filePath)
            : filePath;

        return lockedFiles.some(f => f.path === relativePath);
    }

    /**
     * Get the lock reason for a file
     */
    getLockReason(filePath: string): string | undefined {
        const config = vscode.workspace.getConfiguration('aiSupervisor');
        const lockedFiles = config.get<Array<{ path: string; reason: string }>>('admin.lockedFiles', []);

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const relativePath = workspaceFolder
            ? path.relative(workspaceFolder.uri.fsPath, filePath)
            : filePath;

        const lockedFile = lockedFiles.find(f => f.path === relativePath);
        return lockedFile?.reason;
    }
}

/**
 * Register the locked files tree view
 */
export function registerLockedFilesTreeView(context: vscode.ExtensionContext): LockedFilesTreeProvider {
    const treeProvider = new LockedFilesTreeProvider(context);

    // Register the tree view
    const treeView = vscode.window.createTreeView('aiSupervisor.lockedFilesView', {
        treeDataProvider: treeProvider,
        showCollapseAll: false
    });

    context.subscriptions.push(treeView);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('aiSupervisor.lockFileFromTree', async (item: LockedFileItem) => {
            // This command is called from the tree view context menu
            const reason = await vscode.window.showInputBox({
                prompt: 'Why is this file being locked?',
                placeHolder: 'e.g., Critical system file, contains secrets, etc.'
            });

            if (reason) {
                await treeProvider.lockFile(item.filePath, reason);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aiSupervisor.unlockFileFromTree', async (item: LockedFileItem) => {
            const result = await vscode.window.showWarningMessage(
                `Unlock ${path.basename(item.filePath)}?`,
                { modal: true },
                'Unlock'
            );

            if (result === 'Unlock') {
                await treeProvider.unlockFile(item.filePath);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aiSupervisor.viewLockedFileReason', async (item: LockedFileItem) => {
            await vscode.window.showInformationMessage(
                `${path.basename(item.filePath)}: ${item.reason}`,
                { modal: false }
            );
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aiSupervisor.refreshLockedFiles', () => {
            treeProvider.refresh();
        })
    );

    return treeProvider;
}
