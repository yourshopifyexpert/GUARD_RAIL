import * as vscode from 'vscode';
import { GuardianSettings } from './GuardianSettings';

/**
 * Usage record
 */
export interface UsageRecord {
    timestamp: number;
    model: string;
    provider: string;
    tokensUsed: number;
    estimatedCost: number;
    operation: 'analysis' | 'chat' | 'completion';
}

/**
 * Cost summary
 */
export interface CostSummary {
    totalCost: number;
    totalTokens: number;
    totalRequests: number;
    costByModel: Record<string, number>;
    costByProvider: Record<string, number>;
    currentMonth: number;
    budget: number;
    budgetUsedPercent: number;
}

/**
 * CostTracker - Tracks AI API costs and usage
 *
 * Features:
 * - Track tokens used per model
 * - Estimate costs based on provider pricing
 * - Monthly budget tracking
 * - Cost warnings
 * - Support for free local models
 */
export class CostTracker {
    private static readonly STORAGE_KEY = 'aiSupervisor.guardian.usage';
    private usageHistory: UsageRecord[] = [];
    private settings: GuardianSettings;

    constructor(private context: vscode.ExtensionContext) {
        this.settings = new GuardianSettings(context);
        this.loadUsageHistory();
    }

    /**
     * Record usage
     */
    async recordUsage(
        model: string,
        provider: string,
        tokensUsed: number,
        operation: 'analysis' | 'chat' | 'completion' = 'analysis'
    ): Promise<void> {
        const modelInfo = this.settings.getModelInfo(model);
        const estimatedCost = modelInfo
            ? this.settings.estimateCost(model, tokensUsed)
            : 0;

        const record: UsageRecord = {
            timestamp: Date.now(),
            model,
            provider,
            tokensUsed,
            estimatedCost,
            operation
        };

        this.usageHistory.push(record);
        await this.saveUsageHistory();

        // Check budget
        await this.checkBudget();
    }

    /**
     * Get cost summary
     */
    getCostSummary(): CostSummary {
        const currentMonth = this.getCurrentMonthTimestamp();
        const monthlyRecords = this.usageHistory.filter(
            r => r.timestamp >= currentMonth
        );

        const totalCost = monthlyRecords.reduce((sum, r) => sum + r.estimatedCost, 0);
        const totalTokens = monthlyRecords.reduce((sum, r) => sum + r.tokensUsed, 0);
        const totalRequests = monthlyRecords.length;

        const costByModel: Record<string, number> = {};
        const costByProvider: Record<string, number> = {};

        for (const record of monthlyRecords) {
            costByModel[record.model] = (costByModel[record.model] || 0) + record.estimatedCost;
            costByProvider[record.provider] = (costByProvider[record.provider] || 0) + record.estimatedCost;
        }

        const budget = this.settings.getCostBudget();
        const budgetUsedPercent = budget > 0 ? (totalCost / budget) * 100 : 0;

        return {
            totalCost,
            totalTokens,
            totalRequests,
            costByModel,
            costByProvider,
            currentMonth,
            budget,
            budgetUsedPercent
        };
    }

    /**
     * Get usage for date range
     */
    getUsageForRange(startTime: number, endTime: number): UsageRecord[] {
        return this.usageHistory.filter(
            r => r.timestamp >= startTime && r.timestamp <= endTime
        );
    }

    /**
     * Get monthly spend
     */
    getMonthlySpend(): number {
        const summary = this.getCostSummary();
        return summary.totalCost;
    }

    /**
     * Check budget and warn if approaching limit
     */
    private async checkBudget(): Promise<void> {
        const summary = this.getCostSummary();

        if (summary.budgetUsedPercent >= 100) {
            vscode.window.showErrorMessage(
                `AI Supervisor: Monthly budget exceeded! Used $${summary.totalCost.toFixed(2)} of $${summary.budget}`
            );
        } else if (summary.budgetUsedPercent >= 80) {
            vscode.window.showWarningMessage(
                `AI Supervisor: Approaching monthly budget. Used $${summary.totalCost.toFixed(2)} of $${summary.budget} (${summary.budgetUsedPercent.toFixed(0)}%)`
            );
        }
    }

    /**
     * Get current month timestamp
     */
    private getCurrentMonthTimestamp(): number {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    }

    /**
     * Clear history
     */
    async clearHistory(): Promise<void> {
        this.usageHistory = [];
        await this.saveUsageHistory();
        vscode.window.showInformationMessage('Usage history cleared');
    }

    /**
     * Clear monthly history
     */
    async clearMonthlyHistory(): Promise<void> {
        const currentMonth = this.getCurrentMonthTimestamp();
        this.usageHistory = this.usageHistory.filter(
            r => r.timestamp < currentMonth
        );
        await this.saveUsageHistory();
        vscode.window.showInformationMessage('Monthly usage history cleared');
    }

    /**
     * Export usage report
     */
    exportReport(): string {
        const summary = this.getCostSummary();

        let report = `# AI Guardian Usage Report\n\n`;
        report += `## Summary\n`;
        report += `- **Period**: Current Month\n`;
        report += `- **Total Cost**: $${summary.totalCost.toFixed(4)}\n`;
        report += `- **Total Tokens**: ${summary.totalTokens.toLocaleString()}\n`;
        report += `- **Total Requests**: ${summary.totalRequests}\n`;
        report += `- **Budget**: $${summary.budget}\n`;
        report += `- **Budget Used**: ${summary.budgetUsedPercent.toFixed(1)}%\n\n`;

        report += `## Cost by Model\n`;
        for (const [model, cost] of Object.entries(summary.costByModel)) {
            report += `- **${model}**: $${cost.toFixed(4)}\n`;
        }

        report += `\n## Cost by Provider\n`;
        for (const [provider, cost] of Object.entries(summary.costByProvider)) {
            report += `- **${provider}**: $${cost.toFixed(4)}\n`;
        }

        report += `\n## Recent Activity\n`;
        const recentRecords = this.usageHistory.slice(-10).reverse();
        for (const record of recentRecords) {
            const date = new Date(record.timestamp).toLocaleString();
            report += `- [${date}] ${record.model} - ${record.tokensUsed} tokens - $${record.estimatedCost.toFixed(4)}\n`;
        }

        return report;
    }

    /**
     * Show cost summary
     */
    async showCostSummary(): Promise<void> {
        const summary = this.getCostSummary();

        const items = [
            {
                label: `$(credit-card) Total Cost: $${summary.totalCost.toFixed(4)}`,
                description: `Budget: $${summary.budget} (${summary.budgetUsedPercent.toFixed(1)}% used)`
            },
            {
                label: `$(symbol-numeric) Total Tokens: ${summary.totalTokens.toLocaleString()}`,
                description: `${summary.totalRequests} requests`
            },
            {
                label: '$(graph) View Detailed Report',
                action: 'report'
            },
            {
                label: '$(trash) Clear Monthly History',
                action: 'clear'
            }
        ];

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'AI Guardian Cost Tracking'
        });

        if (selected) {
            if ((selected as any).action === 'report') {
                await this.showDetailedReport();
            } else if ((selected as any).action === 'clear') {
                const confirm = await vscode.window.showWarningMessage(
                    'Clear monthly usage history?',
                    'Clear',
                    'Cancel'
                );
                if (confirm === 'Clear') {
                    await this.clearMonthlyHistory();
                }
            }
        }
    }

    /**
     * Show detailed report
     */
    private async showDetailedReport(): Promise<void> {
        const report = this.exportReport();

        const doc = await vscode.workspace.openTextDocument({
            content: report,
            language: 'markdown'
        });

        await vscode.window.showTextDocument(doc, { preview: true });
    }

    /**
     * Load usage history from storage
     */
    private loadUsageHistory(): void {
        const stored = this.context.globalState.get<UsageRecord[]>(CostTracker.STORAGE_KEY, []);
        this.usageHistory = stored;
    }

    /**
     * Save usage history to storage
     */
    private async saveUsageHistory(): Promise<void> {
        // Keep only last 1000 records to prevent storage bloat
        if (this.usageHistory.length > 1000) {
            this.usageHistory = this.usageHistory.slice(-1000);
        }

        await this.context.globalState.update(CostTracker.STORAGE_KEY, this.usageHistory);
    }
}
