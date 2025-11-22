import * as vscode from 'vscode';

/**
 * Manages status bar indicators for AI Supervisor
 * Shows real-time status of AI execution, guardian, and security events
 */
export class StatusBarManager {
    private aiStatusItem: vscode.StatusBarItem;
    private editModeItem: vscode.StatusBarItem;
    private guardianItem: vscode.StatusBarItem;
    private blockCountItem: vscode.StatusBarItem;

    private blocksToday: number = 0;
    private lastResetDate: Date = new Date();

    constructor(private context: vscode.ExtensionContext) {
        // Create status bar items (right to left order)
        this.blockCountItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.blockCountItem.command = 'aiSupervisor.viewBlockHistory';
        this.blockCountItem.tooltip = 'View blocked operations today';

        this.guardianItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            101
        );
        this.guardianItem.command = 'aiSupervisor.configureGuardianModel';
        this.guardianItem.tooltip = 'Click to configure Guardian AI';

        this.editModeItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            102
        );
        this.editModeItem.command = 'aiSupervisor.setEditMode';
        this.editModeItem.tooltip = 'Click to change edit mode';

        this.aiStatusItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            103
        );
        this.aiStatusItem.command = 'aiSupervisor.showAdminPanel';
        this.aiStatusItem.tooltip = 'Click to open Admin Control Panel';

        // Register all items
        context.subscriptions.push(
            this.aiStatusItem,
            this.editModeItem,
            this.guardianItem,
            this.blockCountItem
        );

        // Load stored block count
        this.loadBlockCount();

        // Watch for configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('aiSupervisor')) {
                this.updateAllItems();
            }
        });

        // Initial update
        this.updateAllItems();
        this.showAll();

        // Reset block count daily
        this.scheduleBlockCountReset();
    }

    /**
     * Update all status bar items
     */
    public updateAllItems(): void {
        this.updateAIStatus();
        this.updateEditMode();
        this.updateGuardianStatus();
        this.updateBlockCount();
    }

    /**
     * Update AI execution status
     */
    public updateAIStatus(isRunning?: boolean): void {
        const config = vscode.workspace.getConfiguration('aiSupervisor');
        const monitoring = isRunning ?? config.get<boolean>('monitoring.enabled', true);

        if (monitoring) {
            this.aiStatusItem.text = '$(pulse) AI: Running';
            this.aiStatusItem.backgroundColor = undefined;
        } else {
            this.aiStatusItem.text = '$(debug-pause) AI: Paused';
            this.aiStatusItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        }
    }

    /**
     * Update edit mode status
     */
    public updateEditMode(mode?: string): void {
        const config = vscode.workspace.getConfiguration('aiSupervisor');
        const editMode = mode ?? config.get<string>('admin.editMode', 'approval');

        let icon: string;
        let color: vscode.ThemeColor | undefined;

        switch (editMode) {
            case 'permissive':
                icon = '$(unlock)';
                color = undefined;
                break;
            case 'approval':
                icon = '$(lock)';
                color = undefined;
                break;
            case 'locked':
                icon = '$(lock)';
                color = new vscode.ThemeColor('statusBarItem.errorBackground');
                break;
            default:
                icon = '$(lock)';
                color = undefined;
        }

        this.editModeItem.text = `${icon} ${editMode.charAt(0).toUpperCase() + editMode.slice(1)}`;
        this.editModeItem.backgroundColor = color;
    }

    /**
     * Update guardian AI status
     */
    public updateGuardianStatus(active?: boolean, model?: string): void {
        const config = vscode.workspace.getConfiguration('aiSupervisor');
        const guardianActive = active ?? config.get<boolean>('guardian.enableAnalysis', true);
        const guardianModel = model ?? config.get<string>('guardian.model', 'gpt-4o');

        if (guardianActive) {
            this.guardianItem.text = `$(shield) Guardian: ${this.getShortModelName(guardianModel)}`;
            this.guardianItem.backgroundColor = undefined;
        } else {
            this.guardianItem.text = '$(shield) Guardian: Off';
            this.guardianItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        }
    }

    /**
     * Update block count
     */
    public updateBlockCount(count?: number): void {
        if (count !== undefined) {
            this.blocksToday = count;
            this.saveBlockCount();
        }

        if (this.blocksToday === 0) {
            this.blockCountItem.text = '$(check) 0 blocks';
            this.blockCountItem.backgroundColor = undefined;
        } else if (this.blocksToday < 5) {
            this.blockCountItem.text = `$(warning) ${this.blocksToday} blocks`;
            this.blockCountItem.backgroundColor = undefined;
        } else {
            this.blockCountItem.text = `$(error) ${this.blocksToday} blocks`;
            this.blockCountItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        }
    }

    /**
     * Increment block count
     */
    public incrementBlockCount(): void {
        this.blocksToday++;
        this.updateBlockCount();
        this.saveBlockCount();
    }

    /**
     * Show all status bar items
     */
    public showAll(): void {
        this.aiStatusItem.show();
        this.editModeItem.show();
        this.guardianItem.show();
        this.blockCountItem.show();
    }

    /**
     * Hide all status bar items
     */
    public hideAll(): void {
        this.aiStatusItem.hide();
        this.editModeItem.hide();
        this.guardianItem.hide();
        this.blockCountItem.hide();
    }

    /**
     * Show a status bar message temporarily
     */
    public showTemporaryMessage(
        message: string,
        severity: 'info' | 'warning' | 'error' = 'info',
        durationMs: number = 5000
    ): vscode.Disposable {
        const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1000);

        let icon: string;
        let backgroundColor: vscode.ThemeColor | undefined;

        switch (severity) {
            case 'error':
                icon = '$(error)';
                backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
                break;
            case 'warning':
                icon = '$(warning)';
                backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                break;
            default:
                icon = '$(info)';
                backgroundColor = undefined;
        }

        item.text = `${icon} ${message}`;
        item.backgroundColor = backgroundColor;
        item.show();

        // Auto-hide after duration
        setTimeout(() => {
            item.dispose();
        }, durationMs);

        return item;
    }

    /**
     * Flash a status bar item to draw attention
     */
    public flashItem(
        item: 'ai' | 'editMode' | 'guardian' | 'blocks',
        durationMs: number = 2000
    ): void {
        const statusItem = this.getStatusItem(item);
        if (!statusItem) {
            return;
        }

        const originalBackground = statusItem.backgroundColor;
        const flashColor = new vscode.ThemeColor('statusBarItem.prominentBackground');

        // Flash on
        statusItem.backgroundColor = flashColor;

        // Flash off
        setTimeout(() => {
            statusItem.backgroundColor = originalBackground;
        }, durationMs);
    }

    /**
     * Show a critical alert in the status bar
     */
    public showCriticalAlert(message: string): void {
        this.showTemporaryMessage(message, 'error', 10000);
        this.flashItem('blocks', 3000);

        // Also show a notification
        vscode.window.showErrorMessage(message, 'Open Admin Panel').then(selection => {
            if (selection === 'Open Admin Panel') {
                vscode.commands.executeCommand('aiSupervisor.showAdminPanel');
            }
        });
    }

    /**
     * Get short model name for display
     */
    private getShortModelName(model: string): string {
        const modelMap: { [key: string]: string } = {
            'gpt-4o': 'GPT-4o',
            'gpt-4-turbo': 'GPT-4T',
            'gpt-4': 'GPT-4',
            'claude-3-5-sonnet-20241022': 'Claude 3.5',
            'claude-3-opus-20240229': 'Claude Opus',
            'gemini-1.5-pro-latest': 'Gemini Pro',
            'llama3.1:70b': 'Llama 70B'
        };

        return modelMap[model] || model.substring(0, 8);
    }

    /**
     * Get status bar item by type
     */
    private getStatusItem(
        item: 'ai' | 'editMode' | 'guardian' | 'blocks'
    ): vscode.StatusBarItem | undefined {
        switch (item) {
            case 'ai':
                return this.aiStatusItem;
            case 'editMode':
                return this.editModeItem;
            case 'guardian':
                return this.guardianItem;
            case 'blocks':
                return this.blockCountItem;
            default:
                return undefined;
        }
    }

    /**
     * Save block count to persistent storage
     */
    private saveBlockCount(): void {
        this.context.workspaceState.update('aiSupervisor.blocksToday', this.blocksToday);
        this.context.workspaceState.update('aiSupervisor.lastBlockReset', this.lastResetDate.toISOString());
    }

    /**
     * Load block count from persistent storage
     */
    private loadBlockCount(): void {
        const savedCount = this.context.workspaceState.get<number>('aiSupervisor.blocksToday', 0);
        const savedDate = this.context.workspaceState.get<string>('aiSupervisor.lastBlockReset');

        if (savedDate) {
            this.lastResetDate = new Date(savedDate);

            // Check if we need to reset (new day)
            const today = new Date();
            if (this.lastResetDate.toDateString() !== today.toDateString()) {
                this.blocksToday = 0;
                this.lastResetDate = today;
                this.saveBlockCount();
            } else {
                this.blocksToday = savedCount;
            }
        }
    }

    /**
     * Schedule daily reset of block count
     */
    private scheduleBlockCountReset(): void {
        // Check every hour if we need to reset
        setInterval(() => {
            const today = new Date();
            if (this.lastResetDate.toDateString() !== today.toDateString()) {
                this.blocksToday = 0;
                this.lastResetDate = today;
                this.saveBlockCount();
                this.updateBlockCount();
            }
        }, 60 * 60 * 1000); // Check every hour
    }

    /**
     * Dispose all status bar items
     */
    public dispose(): void {
        this.aiStatusItem.dispose();
        this.editModeItem.dispose();
        this.guardianItem.dispose();
        this.blockCountItem.dispose();
    }
}
