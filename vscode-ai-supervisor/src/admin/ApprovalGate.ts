import * as vscode from 'vscode';

export interface CodeChange {
    file: string;
    uri: vscode.Uri;
    beforeContent: string;
    afterContent: string;
    changeType: 'add' | 'modify' | 'delete';
    linesChanged: number;
}

export interface GuardianAnalysis {
    codingModel: string;
    guardianModel: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    reasoning: string;
    suggestions?: string[];
    blocked?: boolean;
    requiresApproval?: boolean;
}

export interface ApprovalResult {
    approved: boolean;
    action?: 'allow' | 'block' | 'fix' | 'diff';
    timestamp: number;
}

/**
 * Approval gate for risky code changes
 * Shows detailed analysis and requires user approval
 */
export class ApprovalGate {
    private approvalHistory: Map<string, ApprovalResult[]> = new Map();

    constructor(private context: vscode.ExtensionContext) {
        this.loadApprovalHistory();
    }

    /**
     * Request approval for a code change
     */
    public async requestApproval(
        change: CodeChange,
        analysis: GuardianAnalysis
    ): Promise<boolean> {
        // Check if change is auto-approved
        if (this.isAutoApproved(change, analysis)) {
            this.recordApproval(change.file, true, 'allow');
            return true;
        }

        // Build approval message
        const message = this.buildApprovalMessage(change, analysis);

        // Show modal dialog with options
        const result = await this.showApprovalDialog(message, change, analysis);

        // Record the decision
        this.recordApproval(change.file, result.approved, result.action);

        return result.approved;
    }

    /**
     * Build detailed approval message
     */
    private buildApprovalMessage(change: CodeChange, analysis: GuardianAnalysis): string {
        const fileName = change.file.split('/').pop() || change.file;
        const severityEmoji = this.getSeverityEmoji(analysis.severity);

        const lines = [
            `${severityEmoji} AI Change Approval Required`,
            ``,
            `📄 File: ${fileName}`,
            `📝 Type: ${change.changeType.toUpperCase()}`,
            `📊 Lines: ${change.linesChanged} changed`,
            ``,
            `🤖 Coding Model: ${analysis.codingModel}`,
            `🛡️ Guardian Model: ${analysis.guardianModel}`,
            ``,
            `⚠️ Risk Level: ${analysis.severity.toUpperCase()}`,
            `📈 Confidence: ${analysis.confidence}%`,
            ``,
            `💡 Analysis:`,
            analysis.reasoning,
        ];

        if (analysis.suggestions && analysis.suggestions.length > 0) {
            lines.push('', '✨ Suggestions:');
            analysis.suggestions.forEach(suggestion => {
                lines.push(`  • ${suggestion}`);
            });
        }

        return lines.join('\n');
    }

    /**
     * Show approval dialog with multiple options
     */
    private async showApprovalDialog(
        message: string,
        change: CodeChange,
        analysis: GuardianAnalysis
    ): Promise<ApprovalResult> {
        // First, show the message with options
        const action = await vscode.window.showWarningMessage(
            message,
            { modal: true },
            'View Diff',
            'Allow',
            'Block',
            'Fix Issues'
        );

        if (action === 'View Diff') {
            // Show diff and ask again
            await this.showDiff(change);
            return this.showApprovalDialog(message, change, analysis);
        }

        if (action === 'Fix Issues') {
            // Show suggestions panel
            await this.showFixSuggestions(change, analysis);
            return this.showApprovalDialog(message, change, analysis);
        }

        const approved = action === 'Allow';

        return {
            approved,
            action: action?.toLowerCase() as any,
            timestamp: Date.now()
        };
    }

    /**
     * Show diff between before and after
     */
    private async showDiff(change: CodeChange): Promise<void> {
        try {
            // Create temporary files for diff
            const beforeUri = vscode.Uri.parse(
                `untitled:${change.file}.before`
            ).with({ scheme: 'untitled' });

            const afterUri = vscode.Uri.parse(
                `untitled:${change.file}.after`
            ).with({ scheme: 'untitled' });

            // Open diff view
            await vscode.commands.executeCommand(
                'vscode.diff',
                beforeUri,
                afterUri,
                `${change.file.split('/').pop()} - Changes`
            );

            // Note: In a real implementation, you'd use a TextDocumentContentProvider
            // to provide the before/after content to these URIs
        } catch (error) {
            console.error('[ApprovalGate] Failed to show diff:', error);

            // Fallback: show in output channel
            const channel = vscode.window.createOutputChannel('AI Supervisor - Diff');
            channel.clear();
            channel.appendLine('=== BEFORE ===');
            channel.appendLine(change.beforeContent);
            channel.appendLine('');
            channel.appendLine('=== AFTER ===');
            channel.appendLine(change.afterContent);
            channel.show();
        }
    }

    /**
     * Show fix suggestions
     */
    private async showFixSuggestions(
        change: CodeChange,
        analysis: GuardianAnalysis
    ): Promise<void> {
        if (!analysis.suggestions || analysis.suggestions.length === 0) {
            vscode.window.showInformationMessage('No fix suggestions available');
            return;
        }

        const items = analysis.suggestions.map((suggestion, index) => ({
            label: `Fix ${index + 1}`,
            description: suggestion,
            suggestion
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a fix to apply',
            canPickMany: false
        });

        if (selected) {
            vscode.window.showInformationMessage(
                `💡 Suggestion: ${selected.suggestion}`,
                'Copy to Clipboard',
                'Open File'
            ).then(action => {
                if (action === 'Copy to Clipboard') {
                    vscode.env.clipboard.writeText(selected.suggestion);
                } else if (action === 'Open File') {
                    vscode.window.showTextDocument(change.uri);
                }
            });
        }
    }

    /**
     * Check if change should be auto-approved
     */
    private isAutoApproved(change: CodeChange, analysis: GuardianAnalysis): boolean {
        const config = vscode.workspace.getConfiguration('aiSupervisor.admin');

        // Check if auto-approval is enabled
        const autoApprove = config.get<boolean>('autoApprove', false);
        if (!autoApprove) {
            return false;
        }

        // Check severity threshold
        const autoApproveSeverity = config.get<string>('autoApproveSeverity', 'low');
        const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };

        const changeSeverity = severityLevels[analysis.severity] || 0;
        const thresholdSeverity = severityLevels[autoApproveSeverity as keyof typeof severityLevels] || 1;

        if (changeSeverity > thresholdSeverity) {
            return false;
        }

        // Check file type whitelist
        const whitelistedExtensions = config.get<string[]>('autoApproveExtensions', []);
        const fileExtension = change.file.split('.').pop() || '';

        if (whitelistedExtensions.length > 0 && !whitelistedExtensions.includes(fileExtension)) {
            return false;
        }

        return true;
    }

    /**
     * Record approval decision
     */
    private recordApproval(
        file: string,
        approved: boolean,
        action?: string
    ): void {
        const result: ApprovalResult = {
            approved,
            action: action as any,
            timestamp: Date.now()
        };

        const history = this.approvalHistory.get(file) || [];
        history.push(result);
        this.approvalHistory.set(file, history);

        // Keep only last 10 decisions per file
        if (history.length > 10) {
            this.approvalHistory.set(file, history.slice(-10));
        }

        this.saveApprovalHistory();
    }

    /**
     * Get approval history for a file
     */
    public getApprovalHistory(file: string): ApprovalResult[] {
        return this.approvalHistory.get(file) || [];
    }

    /**
     * Get all approval history
     */
    public getAllHistory(): Map<string, ApprovalResult[]> {
        return new Map(this.approvalHistory);
    }

    /**
     * Get approval statistics
     */
    public getStatistics(): {
        totalApprovals: number;
        totalBlocks: number;
        approvalRate: number;
        fileCount: number;
    } {
        let totalApprovals = 0;
        let totalBlocks = 0;

        this.approvalHistory.forEach(history => {
            history.forEach(result => {
                if (result.approved) {
                    totalApprovals++;
                } else {
                    totalBlocks++;
                }
            });
        });

        const total = totalApprovals + totalBlocks;
        const approvalRate = total > 0 ? (totalApprovals / total) * 100 : 0;

        return {
            totalApprovals,
            totalBlocks,
            approvalRate,
            fileCount: this.approvalHistory.size
        };
    }

    /**
     * Show approval statistics
     */
    public async showStatistics(): Promise<void> {
        const stats = this.getStatistics();

        const message = [
            '📊 Approval Statistics',
            '',
            `✅ Approved: ${stats.totalApprovals}`,
            `🚫 Blocked: ${stats.totalBlocks}`,
            `📈 Approval Rate: ${stats.approvalRate.toFixed(1)}%`,
            `📁 Files: ${stats.fileCount}`,
        ].join('\n');

        vscode.window.showInformationMessage(message, 'View History').then(action => {
            if (action === 'View History') {
                this.showApprovalHistoryPanel();
            }
        });
    }

    /**
     * Show approval history panel
     */
    private async showApprovalHistoryPanel(): Promise<void> {
        const items: any[] = [];

        this.approvalHistory.forEach((history, file) => {
            const fileName = file.split('/').pop() || file;
            const approvalCount = history.filter(h => h.approved).length;
            const blockCount = history.filter(h => !h.approved).length;

            items.push({
                label: `📄 ${fileName}`,
                description: `✅ ${approvalCount} | 🚫 ${blockCount}`,
                detail: file,
                file,
                history
            });
        });

        if (items.length === 0) {
            vscode.window.showInformationMessage('No approval history');
            return;
        }

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a file to view history',
            canPickMany: false
        });

        if (selected) {
            this.showFileHistory(selected.file, selected.history);
        }
    }

    /**
     * Show history for a specific file
     */
    private async showFileHistory(file: string, history: ApprovalResult[]): Promise<void> {
        const items = history.map((result, index) => ({
            label: result.approved ? '✅ Approved' : '🚫 Blocked',
            description: result.action || 'unknown',
            detail: new Date(result.timestamp).toLocaleString(),
            result
        }));

        await vscode.window.showQuickPick(items, {
            placeHolder: `Approval history for ${file.split('/').pop()}`,
            canPickMany: false
        });
    }

    /**
     * Clear approval history
     */
    public clearHistory(): void {
        this.approvalHistory.clear();
        this.saveApprovalHistory();
        vscode.window.showInformationMessage('Approval history cleared');
    }

    /**
     * Get severity emoji
     */
    private getSeverityEmoji(severity: string): string {
        const emojis: Record<string, string> = {
            low: '✅',
            medium: '⚠️',
            high: '🔴',
            critical: '🚨'
        };

        return emojis[severity] || '❓';
    }

    /**
     * Save approval history
     */
    private saveApprovalHistory(): void {
        const historyArray = Array.from(this.approvalHistory.entries());
        this.context.workspaceState.update('aiSupervisor.approvalHistory', historyArray);
    }

    /**
     * Load approval history
     */
    private loadApprovalHistory(): void {
        const historyArray = this.context.workspaceState.get<[string, ApprovalResult[]][]>(
            'aiSupervisor.approvalHistory',
            []
        );

        this.approvalHistory = new Map(historyArray);
        console.log(`[ApprovalGate] Loaded ${this.approvalHistory.size} file histories`);
    }
}
