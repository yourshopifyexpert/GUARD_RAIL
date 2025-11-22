import * as vscode from 'vscode';

export interface BlockedCommand {
    commandId: string;
    blockedAt: number;
    reason: string;
}

/**
 * Intercepts and blocks dangerous AI commands
 * Prevents AI tools from executing until user approval
 */
export class CommandInterceptor {
    private disposables: vscode.Disposable[] = [];
    private blockedCommands: Set<string> = new Set();
    private commandLog: BlockedCommand[] = [];
    private isPaused: boolean = false;

    // AI tool command IDs to intercept
    private readonly AI_COMMANDS = {
        // GitHub Copilot
        copilot: [
            'github.copilot.generate',
            'github.copilot.acceptSolution',
            'github.copilot.acceptCursorPanelSolution',
            'editor.action.inlineSuggest.commit',
            'github.copilot.apply',
        ],
        // Continue
        continue: [
            'continue.acceptDiff',
            'continue.acceptVerticalDiffBlock',
            'continue.quickEdit',
        ],
        // Cursor
        cursor: [
            'cursor.applyEdit',
            'cursor.chat.apply',
        ],
        // Codeium
        codeium: [
            'codeium.acceptCompletion',
        ],
        // Tabnine
        tabnine: [
            'tabnine.accept-inline',
        ]
    };

    constructor(private context: vscode.ExtensionContext) {
        this.loadBlockedCommands();
    }

    /**
     * Start intercepting AI commands
     */
    public startIntercepting(): void {
        const config = vscode.workspace.getConfiguration('aiSupervisor.admin');
        const interceptCommands = config.get<boolean>('interceptCommands', false);

        if (!interceptCommands) {
            console.log('[CommandInterceptor] Command interception is disabled in settings');
            return;
        }

        // Register interceptors for all AI commands
        Object.entries(this.AI_COMMANDS).forEach(([toolName, commands]) => {
            commands.forEach(commandId => {
                this.registerInterceptor(commandId, toolName);
            });
        });

        console.log('[CommandInterceptor] Now intercepting AI commands');
        vscode.window.showInformationMessage('🛡️ AI command interception ACTIVE');
    }

    /**
     * Register an interceptor for a specific command
     */
    private registerInterceptor(commandId: string, toolName: string): void {
        try {
            // Try to register our interceptor
            const interceptor = vscode.commands.registerCommand(
                commandId,
                async (...args: any[]) => {
                    console.log(`[CommandInterceptor] Intercepted: ${commandId}`);

                    // Check if AI execution is paused
                    if (this.isPaused) {
                        vscode.window.showWarningMessage(
                            `⏸️ AI Execution Paused - ${toolName} command blocked`
                        );
                        return;
                    }

                    // Check if this specific command is blocked
                    if (this.blockedCommands.has(commandId)) {
                        this.logBlockedCommand(commandId, `Command is in block list`);
                        vscode.window.showErrorMessage(
                            `🚫 Blocked: ${commandId} is not allowed`
                        );
                        return;
                    }

                    // Request approval for the command
                    const approved = await this.requestCommandApproval(commandId, toolName, args);

                    if (approved) {
                        // Execute the original command
                        console.log(`[CommandInterceptor] Approved: ${commandId}`);
                        // Note: We can't easily execute the "original" command since we've overridden it
                        // In a real implementation, you'd need to store the original handler
                        // For now, we just approve it and let it through
                        return;
                    } else {
                        this.logBlockedCommand(commandId, 'User denied approval');
                        vscode.window.showWarningMessage(`⛔ ${toolName} command denied`);
                        return;
                    }
                }
            );

            this.disposables.push(interceptor);
            console.log(`[CommandInterceptor] Registered interceptor for: ${commandId}`);
        } catch (error) {
            // Command might not exist or already registered
            console.log(`[CommandInterceptor] Could not intercept ${commandId}:`, error);
        }
    }

    /**
     * Request user approval for a command execution
     */
    private async requestCommandApproval(
        commandId: string,
        toolName: string,
        args: any[]
    ): Promise<boolean> {
        const config = vscode.workspace.getConfiguration('aiSupervisor.admin');
        const autoApprove = config.get<string[]>('autoApproveCommands', []);

        // Check if this command is auto-approved
        if (autoApprove.includes(commandId)) {
            return true;
        }

        // Get approval mode
        const approvalMode = config.get<string>('commandApprovalMode', 'manual');

        if (approvalMode === 'auto') {
            return true;
        }

        // Show approval dialog
        const message = `🤖 ${toolName} wants to execute:

Command: ${commandId}
${args.length > 0 ? `Arguments: ${JSON.stringify(args, null, 2).substring(0, 200)}` : ''}

Allow this AI command?`;

        const result = await vscode.window.showWarningMessage(
            message,
            { modal: true },
            'Allow Once',
            'Allow Always',
            'Block'
        );

        if (result === 'Allow Always') {
            // Add to auto-approve list
            autoApprove.push(commandId);
            await config.update('autoApproveCommands', autoApprove, vscode.ConfigurationTarget.Global);
            return true;
        }

        return result === 'Allow Once';
    }

    /**
     * Block a specific command
     */
    public blockCommand(commandId: string, reason: string = 'Manually blocked'): void {
        this.blockedCommands.add(commandId);
        this.logBlockedCommand(commandId, reason);
        this.saveBlockedCommands();

        vscode.window.showInformationMessage(`🚫 Blocked command: ${commandId}`);
    }

    /**
     * Unblock a command
     */
    public unblockCommand(commandId: string): void {
        this.blockedCommands.delete(commandId);
        this.saveBlockedCommands();

        vscode.window.showInformationMessage(`✅ Unblocked command: ${commandId}`);
    }

    /**
     * Block all AI commands
     */
    public blockAllAICommands(): void {
        Object.values(this.AI_COMMANDS).forEach(commands => {
            commands.forEach(cmd => this.blockedCommands.add(cmd));
        });

        this.saveBlockedCommands();
        vscode.window.showWarningMessage('🚫 All AI commands BLOCKED');
    }

    /**
     * Unblock all AI commands
     */
    public unblockAllAICommands(): void {
        this.blockedCommands.clear();
        this.saveBlockedCommands();
        vscode.window.showInformationMessage('✅ All AI commands UNBLOCKED');
    }

    /**
     * Pause all AI execution
     */
    public pauseExecution(): void {
        this.isPaused = true;
        vscode.window.showWarningMessage('⏸️ AI Execution PAUSED - All commands blocked');
    }

    /**
     * Resume AI execution
     */
    public resumeExecution(): void {
        this.isPaused = false;
        vscode.window.showInformationMessage('▶️ AI Execution RESUMED');
    }

    /**
     * Check if execution is paused
     */
    public isPausedState(): boolean {
        return this.isPaused;
    }

    /**
     * Get list of blocked commands
     */
    public getBlockedCommands(): string[] {
        return Array.from(this.blockedCommands);
    }

    /**
     * Get command block history
     */
    public getCommandLog(): BlockedCommand[] {
        return [...this.commandLog];
    }

    /**
     * Log a blocked command
     */
    private logBlockedCommand(commandId: string, reason: string): void {
        this.commandLog.push({
            commandId,
            blockedAt: Date.now(),
            reason
        });

        // Keep only last 100 entries
        if (this.commandLog.length > 100) {
            this.commandLog = this.commandLog.slice(-100);
        }

        // Save to workspace state
        this.context.workspaceState.update('aiSupervisor.commandLog', this.commandLog);
    }

    /**
     * Save blocked commands to workspace state
     */
    private saveBlockedCommands(): void {
        const commands = Array.from(this.blockedCommands);
        this.context.workspaceState.update('aiSupervisor.blockedCommands', commands);
    }

    /**
     * Load blocked commands from workspace state
     */
    private loadBlockedCommands(): void {
        const commands = this.context.workspaceState.get<string[]>('aiSupervisor.blockedCommands', []);
        this.blockedCommands = new Set(commands);

        const log = this.context.workspaceState.get<BlockedCommand[]>('aiSupervisor.commandLog', []);
        this.commandLog = log;
    }

    /**
     * Get available AI tools
     */
    public getAvailableAITools(): string[] {
        return Object.keys(this.AI_COMMANDS);
    }

    /**
     * Get commands for a specific AI tool
     */
    public getCommandsForTool(toolName: string): string[] {
        return this.AI_COMMANDS[toolName as keyof typeof this.AI_COMMANDS] || [];
    }

    /**
     * Dispose of all resources
     */
    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
