import * as vscode from 'vscode';
import { FileSystemInterceptor } from './FileSystemInterceptor';
import { CommandInterceptor } from './CommandInterceptor';
import { EditGuard } from './EditGuard';
import { FileLockManager } from './FileLockManager';
import { AIExecutionController } from './AIExecutionController';
import { ApprovalGate } from './ApprovalGate';
import { AdminControlPanel } from './AdminControlPanel';
import { GuardianIntegration } from '../guardian/GuardianIntegration';

/**
 * Coordinates all admin control components
 * Single point of access for the admin system
 */
export class AdminCoordinator {
    private static instance: AdminCoordinator | undefined;

    // Components
    public readonly fileSystemInterceptor: FileSystemInterceptor;
    public readonly commandInterceptor: CommandInterceptor;
    public readonly editGuard: EditGuard;
    public readonly lockManager: FileLockManager;
    public readonly executionController: AIExecutionController;
    public readonly approvalGate: ApprovalGate;

    private disposables: vscode.Disposable[] = [];

    private constructor(
        private context: vscode.ExtensionContext,
        guardian?: GuardianIntegration
    ) {
        console.log('[AdminCoordinator] Initializing admin control system...');

        // Initialize components in dependency order
        this.lockManager = new FileLockManager(context);
        this.editGuard = new EditGuard(context, this.lockManager);
        this.commandInterceptor = new CommandInterceptor(context);
        this.executionController = new AIExecutionController(
            context,
            this.commandInterceptor,
            this.lockManager,
            this.editGuard
        );
        this.approvalGate = new ApprovalGate(context);
        this.fileSystemInterceptor = new FileSystemInterceptor(context, guardian);

        // Register commands
        this.registerCommands();

        // Load initial configuration
        this.loadConfiguration();

        console.log('[AdminCoordinator] Admin control system ready');
    }

    /**
     * Get or create the singleton instance
     */
    public static getInstance(
        context?: vscode.ExtensionContext,
        guardian?: GuardianIntegration
    ): AdminCoordinator {
        if (!AdminCoordinator.instance && context) {
            AdminCoordinator.instance = new AdminCoordinator(context, guardian);
        }

        if (!AdminCoordinator.instance) {
            throw new Error('AdminCoordinator not initialized');
        }

        return AdminCoordinator.instance;
    }

    /**
     * Initialize the admin system
     */
    public static async initialize(
        context: vscode.ExtensionContext,
        guardian?: GuardianIntegration
    ): Promise<AdminCoordinator> {
        const coordinator = AdminCoordinator.getInstance(context, guardian);

        // Show welcome notification
        const config = vscode.workspace.getConfiguration('aiSupervisor.admin');
        const firstRun = context.globalState.get<boolean>('admin.firstRun', true);

        if (firstRun) {
            await coordinator.showWelcome();
            await context.globalState.update('admin.firstRun', false);
        }

        return coordinator;
    }

    /**
     * Register admin commands
     */
    private registerCommands(): void {
        // Admin panel
        this.disposables.push(
            vscode.commands.registerCommand('aiSupervisor.admin.showControlPanel', () => {
                this.showControlPanel();
            })
        );

        // Execution control
        this.disposables.push(
            vscode.commands.registerCommand('aiSupervisor.admin.pause', () => {
                this.executionController.pause();
            })
        );

        this.disposables.push(
            vscode.commands.registerCommand('aiSupervisor.admin.resume', () => {
                this.executionController.resume();
            })
        );

        this.disposables.push(
            vscode.commands.registerCommand('aiSupervisor.admin.emergencyStop', () => {
                this.executionController.emergencyStop();
            })
        );

        this.disposables.push(
            vscode.commands.registerCommand('aiSupervisor.admin.showExecutionStatus', () => {
                this.executionController.showStatus();
            })
        );

        // File locking
        this.disposables.push(
            vscode.commands.registerCommand('aiSupervisor.admin.lockFile', async () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage('No active editor');
                    return;
                }

                const reason = await vscode.window.showInputBox({
                    prompt: 'Why are you locking this file?',
                    placeHolder: 'e.g., Critical system file'
                });

                if (reason) {
                    this.lockManager.lockFile(editor.document.uri.fsPath, reason, 'user');
                }
            })
        );

        this.disposables.push(
            vscode.commands.registerCommand('aiSupervisor.admin.unlockFile', async () => {
                await this.lockManager.showLockedFiles();
            })
        );

        this.disposables.push(
            vscode.commands.registerCommand('aiSupervisor.admin.showLockedFiles', () => {
                this.lockManager.showLockedFiles();
            })
        );

        // Edit mode
        this.disposables.push(
            vscode.commands.registerCommand('aiSupervisor.admin.setEditMode', async () => {
                const mode = await vscode.window.showQuickPick(
                    ['permissive', 'approval', 'locked'],
                    { placeHolder: 'Select edit mode' }
                );

                if (mode) {
                    this.editGuard.setEditMode(mode as any);
                }
            })
        );

        // Command interception
        this.disposables.push(
            vscode.commands.registerCommand('aiSupervisor.admin.startCommandInterception', () => {
                this.commandInterceptor.startIntercepting();
            })
        );

        this.disposables.push(
            vscode.commands.registerCommand('aiSupervisor.admin.blockAllCommands', () => {
                this.commandInterceptor.blockAllAICommands();
            })
        );

        this.disposables.push(
            vscode.commands.registerCommand('aiSupervisor.admin.unblockAllCommands', () => {
                this.commandInterceptor.unblockAllAICommands();
            })
        );

        // Approval stats
        this.disposables.push(
            vscode.commands.registerCommand('aiSupervisor.admin.showApprovalStats', () => {
                this.approvalGate.showStatistics();
            })
        );

        // File system interceptor
        this.disposables.push(
            vscode.commands.registerCommand('aiSupervisor.admin.toggleFileInterception', () => {
                const enabled = this.fileSystemInterceptor.getEnabled();
                this.fileSystemInterceptor.setEnabled(!enabled);
            })
        );

        console.log('[AdminCoordinator] Commands registered');
    }

    /**
     * Load configuration from settings
     */
    private loadConfiguration(): void {
        const config = vscode.workspace.getConfiguration('aiSupervisor.admin');

        // Load edit mode
        const editMode = config.get<'permissive' | 'approval' | 'locked'>('editMode', 'approval');
        this.editGuard.setEditMode(editMode);

        // Load command interception setting
        const interceptCommands = config.get<boolean>('interceptCommands', false);
        if (interceptCommands) {
            this.commandInterceptor.startIntercepting();
        }

        // Load file interception setting
        const interceptSaves = config.get<boolean>('interceptSaves', true);
        this.fileSystemInterceptor.setEnabled(interceptSaves);

        console.log('[AdminCoordinator] Configuration loaded:', {
            editMode,
            interceptCommands,
            interceptSaves
        });
    }

    /**
     * Show admin control panel
     */
    public showControlPanel(): void {
        AdminControlPanel.createOrShow(this.context.extensionUri);
    }

    /**
     * Show welcome message
     */
    private async showWelcome(): Promise<void> {
        const message = [
            '🛡️ AI Supervisor Admin Controls Activated!',
            '',
            'The admin system provides REAL protection:',
            '• Block dangerous file saves',
            '• Intercept AI commands',
            '• Lock critical files',
            '• Require approval for risky changes',
            '• Emergency stop capabilities'
        ].join('\n');

        const action = await vscode.window.showInformationMessage(
            message,
            'Open Control Panel',
            'View Settings',
            'Dismiss'
        );

        if (action === 'Open Control Panel') {
            this.showControlPanel();
        } else if (action === 'View Settings') {
            vscode.commands.executeCommand(
                'workbench.action.openSettings',
                'aiSupervisor.admin'
            );
        }
    }

    /**
     * Get system status
     */
    public getStatus(): {
        executionState: string;
        editMode: string;
        lockedFiles: number;
        blockedCommands: number;
        fileInterceptionEnabled: boolean;
    } {
        return {
            executionState: this.executionController.getState(),
            editMode: this.editGuard.getEditMode(),
            lockedFiles: this.lockManager.getLockedFiles().length,
            blockedCommands: this.commandInterceptor.getBlockedCommands().length,
            fileInterceptionEnabled: this.fileSystemInterceptor.getEnabled()
        };
    }

    /**
     * Quick actions for common operations
     */
    public async quickAction(): Promise<void> {
        const status = this.getStatus();

        const actions = [
            {
                label: '$(play) Resume AI',
                description: 'Allow AI operations',
                action: 'resume',
                show: status.executionState !== 'running'
            },
            {
                label: '$(debug-pause) Pause AI',
                description: 'Pause all AI operations',
                action: 'pause',
                show: status.executionState === 'running'
            },
            {
                label: '$(stop-circle) Emergency Stop',
                description: 'Immediately halt all AI operations',
                action: 'emergency',
                show: true
            },
            {
                label: '$(lock) Lock Active File',
                description: 'Prevent AI from modifying current file',
                action: 'lock',
                show: true
            },
            {
                label: '$(unlock) View Locked Files',
                description: `${status.lockedFiles} files locked`,
                action: 'viewLocks',
                show: status.lockedFiles > 0
            },
            {
                label: '$(shield) Control Panel',
                description: 'Open admin dashboard',
                action: 'panel',
                show: true
            }
        ].filter(a => a.show);

        const selected = await vscode.window.showQuickPick(actions, {
            placeHolder: 'Admin Quick Actions'
        });

        if (!selected) {
            return;
        }

        switch (selected.action) {
            case 'resume':
                this.executionController.resume();
                break;
            case 'pause':
                this.executionController.pause();
                break;
            case 'emergency':
                this.executionController.emergencyStop();
                break;
            case 'lock':
                vscode.commands.executeCommand('aiSupervisor.admin.lockFile');
                break;
            case 'viewLocks':
                this.lockManager.showLockedFiles();
                break;
            case 'panel':
                this.showControlPanel();
                break;
        }
    }

    /**
     * Dispose of all resources
     */
    public dispose(): void {
        this.fileSystemInterceptor.dispose();
        this.commandInterceptor.dispose();
        this.editGuard.dispose();
        this.lockManager.dispose();
        this.executionController.dispose();

        this.disposables.forEach(d => d.dispose());
        this.disposables = [];

        AdminCoordinator.instance = undefined;

        console.log('[AdminCoordinator] Disposed');
    }
}
