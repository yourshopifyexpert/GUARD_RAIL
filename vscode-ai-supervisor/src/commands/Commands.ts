import * as vscode from 'vscode';
import { ExtensionContext } from '../extension';
import { ActivityMonitorPanel } from '../panels/ActivityMonitor';
import { GoalManagerPanel } from '../panels/GoalManager';
import { ChangeInspectorPanel } from '../panels/ChangeInspector';
import { GuardianSettings } from '../guardian/GuardianSettings';
import { CostTracker } from '../guardian/CostTracker';
import { TomlStorage } from '../guardian/TomlStorage';
import { ModelDetector } from '../guardian/ModelDetector';

/**
 * Centralized command handler for all AI Supervisor commands
 */
export class Commands {
    private guardianSettings: GuardianSettings;
    private costTracker: CostTracker;
    private tomlStorage: TomlStorage;
    private modelDetector: ModelDetector;

    constructor(private context: vscode.ExtensionContext) {
        this.guardianSettings = new GuardianSettings(context);
        this.costTracker = new CostTracker(context);
        this.tomlStorage = new TomlStorage();
        this.modelDetector = new ModelDetector();
    }

    /**
     * Show the Activity Monitor panel
     */
    public async showActivityMonitor(): Promise<void> {
        ActivityMonitorPanel.createOrShow(this.context.extensionUri);
    }

    /**
     * Show the Goal Manager panel
     */
    public async showGoalManager(): Promise<void> {
        GoalManagerPanel.createOrShow(this.context.extensionUri, this.context);
    }

    /**
     * Show the Change Inspector panel
     */
    public async showChangeInspector(): Promise<void> {
        ChangeInspectorPanel.createOrShow(this.context.extensionUri, this.context);
    }

    /**
     * Pause AI monitoring
     */
    public async pauseMonitoring(): Promise<void> {
        const extContext = ExtensionContext.getInstance();
        extContext.setMonitoringActive(false);
        extContext.fileWatcher?.pause();

        vscode.window.showInformationMessage('AI Supervisor: Monitoring paused');
    }

    /**
     * Resume AI monitoring
     */
    public async resumeMonitoring(): Promise<void> {
        const extContext = ExtensionContext.getInstance();
        extContext.setMonitoringActive(true);
        extContext.fileWatcher?.resume();

        vscode.window.showInformationMessage('AI Supervisor: Monitoring resumed');
    }

    /**
     * Generate a model switch handoff summary
     */
    public async generateHandoff(): Promise<void> {
        try {
            const handoffSummary = await this.createHandoffSummary();
            
            const action = await vscode.window.showInformationMessage(
                'Model switch handoff generated',
                'Copy to Clipboard',
                'Show Preview',
                'Cancel'
            );

            switch (action) {
                case 'Copy to Clipboard':
                    await vscode.env.clipboard.writeText(handoffSummary);
                    vscode.window.showInformationMessage('Handoff summary copied to clipboard');
                    break;
                case 'Show Preview':
                    await this.showHandoffPreview(handoffSummary);
                    break;
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate handoff: ${error}`);
        }
    }

    /**
     * Clear activity history
     */
    public async clearHistory(): Promise<void> {
        const confirmation = await vscode.window.showWarningMessage(
            'Are you sure you want to clear all activity history? This cannot be undone.',
            { modal: true },
            'Clear History',
            'Cancel'
        );

        if (confirmation === 'Clear History') {
            try {
                // Clear all stored activity data
                await this.context.globalState.update('aiSupervisor.activityHistory', []);
                await this.context.workspaceState.update('aiSupervisor.activityHistory', []);
                await this.context.globalState.update('aiSupervisor.deviationHistory', []);
                await this.context.globalState.update('aiSupervisor.changeSnapshots', []);

                // Clear alert history
                const extContext = ExtensionContext.getInstance();
                extContext.alertManager?.clearHistory();

                // Update activity monitor panel if open
                if (ActivityMonitorPanel.currentPanel) {
                    ActivityMonitorPanel.currentPanel.clearActivity();
                }

                vscode.window.showInformationMessage('Activity history cleared successfully');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to clear history: ${error}`);
            }
        }
    }

    /**
     * Export a supervision report
     */
    public async exportReport(): Promise<void> {
        const isPremium = this.context.globalState.get<boolean>('aiSupervisor.isPremium', false);

        if (!isPremium) {
            const action = await vscode.window.showInformationMessage(
                'Report export is a Premium feature',
                'Activate Premium',
                'Cancel'
            );

            if (action === 'Activate Premium') {
                await this.activatePremium();
            }
            return;
        }

        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('ai-supervisor-report.md'),
            filters: {
                'Markdown': ['md'],
                'JSON': ['json'],
                'All Files': ['*']
            }
        });

        if (uri) {
            try {
                const report = await this.generateReport();
                const extension = uri.fsPath.split('.').pop()?.toLowerCase();

                let content: string;
                if (extension === 'json') {
                    content = JSON.stringify(report, null, 2);
                } else {
                    content = this.formatReportAsMarkdown(report);
                }

                await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));

                const action = await vscode.window.showInformationMessage(
                    `Report exported successfully to ${uri.fsPath}`,
                    'Open Report',
                    'Show in Folder'
                );

                if (action === 'Open Report') {
                    const doc = await vscode.workspace.openTextDocument(uri);
                    await vscode.window.showTextDocument(doc);
                } else if (action === 'Show in Folder') {
                    await vscode.commands.executeCommand('revealFileInOS', uri);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to export report: ${error}`);
            }
        }
    }

    /**
     * Open AI Supervisor settings
     */
    public async openSettings(): Promise<void> {
        await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:your-publisher-name.ai-supervisor');
    }

    /**
     * Configure Guardian Model
     */
    public async configureGuardianModel(): Promise<void> {
        await this.guardianSettings.openSettingsUI();
    }

    /**
     * View AI Analysis History
     */
    public async viewAnalysisHistory(): Promise<void> {
        await this.tomlStorage.showAnalysisHistory();
    }

    /**
     * Check API Costs
     */
    public async checkApiCosts(): Promise<void> {
        await this.costTracker.showCostSummary();
    }

    /**
     * Test Guardian Connection
     */
    public async testGuardianConnection(): Promise<void> {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Testing Guardian AI connection...',
                cancellable: false
            },
            async () => {
                const result = await this.guardianSettings.testConnection();

                if (result.success) {
                    vscode.window.showInformationMessage(
                        `Guardian AI: ${result.message}`,
                        'View Settings'
                    ).then(action => {
                        if (action === 'View Settings') {
                            this.configureGuardianModel();
                        }
                    });
                } else {
                    vscode.window.showErrorMessage(
                        `Guardian AI: ${result.message}`,
                        'Configure'
                    ).then(action => {
                        if (action === 'Configure') {
                            this.configureGuardianModel();
                        }
                    });
                }
            }
        );
    }

    /**
     * View Model Detection Info
     */
    public async viewModelDetection(): Promise<void> {
        const detected = this.modelDetector.getLastDetected();

        if (!detected) {
            const message = 'No coding model detected yet. Make some code changes with your AI assistant.';
            vscode.window.showInformationMessage(message);
            return;
        }

        const summary = this.modelDetector.getDetectionSummary();
        const guardianModel = this.guardianSettings.getModel();
        const provider = this.guardianSettings.getProvider();

        const message = `**Coding Model Detection**

${summary}

**Guardian Configuration**
- Provider: ${provider}
- Model: ${guardianModel}

**Status**: ${detected.modelName !== guardianModel ? 'Different models ✓' : 'Same model - Consider changing guardian model'}`;

        const action = await vscode.window.showInformationMessage(
            message,
            { modal: true },
            'Configure Guardian',
            'Close'
        );

        if (action === 'Configure Guardian') {
            await this.configureGuardianModel();
        }
    }

    /**
     * Activate premium license
     */
    public async activatePremium(): Promise<void> {
        const licenseKey = await vscode.window.showInputBox({
            prompt: 'Enter your AI Supervisor Premium license key',
            placeHolder: 'XXXX-XXXX-XXXX-XXXX',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'License key cannot be empty';
                }
                return null;
            }
        });

        if (licenseKey) {
            // TODO: Validate license key with licensing server
            const isValid = await this.validateLicenseKey(licenseKey);
            
            if (isValid) {
                const config = vscode.workspace.getConfiguration('aiSupervisor');
                await config.update('premium.licenseKey', licenseKey, vscode.ConfigurationTarget.Global);
                await this.context.globalState.update('aiSupervisor.isPremium', true);
                
                vscode.window.showInformationMessage(
                    'Premium license activated successfully! Thank you for supporting AI Supervisor.',
                    'View Premium Features'
                ).then(action => {
                    if (action === 'View Premium Features') {
                        vscode.env.openExternal(vscode.Uri.parse('https://github.com/your-org/ai-supervisor#premium'));
                    }
                });
            } else {
                vscode.window.showErrorMessage('Invalid license key. Please check and try again.');
            }
        }
    }

    /**
     * Create a handoff summary for model switching
     */
    private async createHandoffSummary(): Promise<string> {
        const extContext = ExtensionContext.getInstance();

        // Get stored goals
        const goals = this.context.workspaceState.get<any[]>('aiSupervisor.goals', []);
        const activityHistory = this.context.globalState.get<any[]>('aiSupervisor.activityHistory', []);
        const deviationHistory = this.context.globalState.get<any[]>('aiSupervisor.deviationHistory', []);

        // Get recent file changes from activity
        const recentChanges = activityHistory.slice(-10).reverse();

        // Get active alerts
        const alerts = extContext.alertManager?.getAlertHistory() || [];
        const activeAlerts = alerts.slice(-5).reverse();

        // Get workspace info
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const workspaceName = workspaceFolders?.[0]?.name || vscode.workspace.name || 'Unknown Project';
        const workspacePath = workspaceFolders?.[0]?.uri.fsPath || 'Unknown Path';

        // Format the summary
        const summary = `# Model Switch Handoff Summary

## Project Context
- **Project Name**: ${workspaceName}
- **Workspace Path**: ${workspacePath}
- **Monitoring Status**: ${extContext.isMonitoringActive() ? 'Active' : 'Paused'}
- **Generated**: ${new Date().toLocaleString()}

## Current Goals
${goals.length > 0
    ? goals.map(g => `- **${g.title}**: ${g.description || 'No description'}`).join('\n')
    : '- No goals currently defined. Consider setting project goals to guide AI development.'}

## Recent Changes (Last 10 Activities)
${recentChanges.length > 0
    ? recentChanges.map((change, i) => {
        const timestamp = new Date(change.timestamp || Date.now()).toLocaleTimeString();
        return `${i + 1}. [${timestamp}] ${change.description || change.message || 'Change detected'}`;
    }).join('\n')
    : '- No recent activity detected'}

## Active Issues/Alerts (Last 5)
${activeAlerts.length > 0
    ? activeAlerts.map((alert, i) => {
        const timestamp = new Date(alert.timestamp).toLocaleTimeString();
        const severity = alert.severity.toUpperCase();
        return `${i + 1}. [${severity}] [${timestamp}] ${alert.message}`;
    }).join('\n')
    : '- No active alerts or issues'}

## Deviations Detected
${deviationHistory.length > 0
    ? `- Total deviations: ${deviationHistory.length}\n` +
      deviationHistory.slice(-3).map(d => `  - ${d.type}: ${d.message}`).join('\n')
    : '- No deviations detected'}

## Next Steps
${this.generateNextSteps(goals, activeAlerts)}

## Statistics
- Total Goals: ${goals.length}
- Total Activities: ${activityHistory.length}
- Total Alerts: ${alerts.length}
- Total Deviations: ${deviationHistory.length}

---
*Generated by AI Supervisor v${this.context.extension.packageJSON.version}*
*Timestamp: ${new Date().toISOString()}*
`;

        return summary;
    }

    /**
     * Generate suggested next steps based on current state
     */
    private generateNextSteps(goals: any[], alerts: any[]): string {
        const steps: string[] = [];

        if (goals.length === 0) {
            steps.push('- Define project goals using the Goal Manager to help guide AI development');
        } else {
            const activeGoals = goals.filter(g => !g.completed);
            if (activeGoals.length > 0) {
                steps.push(`- Continue working on ${activeGoals.length} active goal(s)`);
                steps.push(`  - Primary goal: "${activeGoals[0].title}"`);
            }
        }

        if (alerts.length > 0) {
            const recentErrors = alerts.filter(a => a.severity === 'error').slice(-3);
            if (recentErrors.length > 0) {
                steps.push(`- Review and address ${recentErrors.length} error alert(s)`);
            }
        }

        steps.push('- Review the Change Inspector for detailed code modifications');
        steps.push('- Consider exporting a detailed report for future reference');

        return steps.length > 0 ? steps.join('\n') : '- Continue normal development';
    }

    /**
     * Show handoff preview in a new editor
     */
    private async showHandoffPreview(content: string): Promise<void> {
        const doc = await vscode.workspace.openTextDocument({
            content,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc, { preview: true });
    }

    /**
     * Validate license key
     */
    private async validateLicenseKey(licenseKey: string): Promise<boolean> {
        // Basic validation checks
        const trimmedKey = licenseKey.trim();

        // Check format: XXXX-XXXX-XXXX-XXXX (4 groups of 4 characters)
        const keyPattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;

        if (!keyPattern.test(trimmedKey)) {
            vscode.window.showWarningMessage('License key must be in format: XXXX-XXXX-XXXX-XXXX');
            return false;
        }

        // Simple checksum validation (last character of last group)
        const parts = trimmedKey.split('-');
        const checksum = parts.slice(0, 3).join('').split('').reduce((acc, char) =>
            acc + char.charCodeAt(0), 0
        ) % 36;

        const expectedCheckChar = checksum < 10
            ? String.fromCharCode(48 + checksum)  // 0-9
            : String.fromCharCode(65 + checksum - 10); // A-Z

        const lastChar = parts[3].charAt(3).toUpperCase();

        // For demo purposes, also accept development keys starting with "DEV-"
        if (trimmedKey.toUpperCase().startsWith('DEV-')) {
            console.log('Development license key accepted');
            return true;
        }

        // In production, this would validate against a licensing server
        // For now, accept keys that pass basic format validation
        console.log('License key validation:', {
            format: 'valid',
            checksum: lastChar === expectedCheckChar ? 'valid' : 'warning',
            status: 'accepted'
        });

        return true;
    }

    /**
     * Generate comprehensive supervision report
     */
    private async generateReport(): Promise<any> {
        const extContext = ExtensionContext.getInstance();

        const goals = this.context.workspaceState.get<any[]>('aiSupervisor.goals', []);
        const activityHistory = this.context.globalState.get<any[]>('aiSupervisor.activityHistory', []);
        const deviationHistory = this.context.globalState.get<any[]>('aiSupervisor.deviationHistory', []);
        const alerts = extContext.alertManager?.getAlertHistory() || [];

        const workspaceFolders = vscode.workspace.workspaceFolders;

        return {
            metadata: {
                generatedAt: new Date().toISOString(),
                version: this.context.extension.packageJSON.version,
                workspace: {
                    name: workspaceFolders?.[0]?.name || vscode.workspace.name || 'Unknown',
                    path: workspaceFolders?.[0]?.uri.fsPath,
                    folders: workspaceFolders?.length || 0
                },
                monitoringStatus: extContext.isMonitoringActive() ? 'active' : 'paused'
            },
            summary: {
                totalGoals: goals.length,
                activeGoals: goals.filter(g => !g.completed).length,
                completedGoals: goals.filter(g => g.completed).length,
                totalActivities: activityHistory.length,
                totalAlerts: alerts.length,
                totalDeviations: deviationHistory.length,
                alertsBySeverity: {
                    info: alerts.filter(a => a.severity === 'info').length,
                    warning: alerts.filter(a => a.severity === 'warning').length,
                    error: alerts.filter(a => a.severity === 'error').length
                }
            },
            goals: goals,
            activities: activityHistory,
            deviations: deviationHistory,
            alerts: alerts,
            configuration: {
                sensitivity: vscode.workspace.getConfiguration('aiSupervisor').get('monitoring.sensitivity'),
                alertsEnabled: vscode.workspace.getConfiguration('aiSupervisor').get('alerts.showNotifications'),
                retentionDays: vscode.workspace.getConfiguration('aiSupervisor').get('storage.retentionDays')
            }
        };
    }

    /**
     * Format report as markdown
     */
    private formatReportAsMarkdown(report: any): string {
        return `# AI Supervisor Report

## Report Metadata
- **Generated**: ${new Date(report.metadata.generatedAt).toLocaleString()}
- **Extension Version**: ${report.metadata.version}
- **Workspace**: ${report.metadata.workspace.name}
- **Monitoring Status**: ${report.metadata.monitoringStatus}

## Summary Statistics
- **Goals**: ${report.summary.totalGoals} total (${report.summary.activeGoals} active, ${report.summary.completedGoals} completed)
- **Activities**: ${report.summary.totalActivities} tracked
- **Alerts**: ${report.summary.totalAlerts} total
  - Info: ${report.summary.alertsBySeverity.info}
  - Warnings: ${report.summary.alertsBySeverity.warning}
  - Errors: ${report.summary.alertsBySeverity.error}
- **Deviations**: ${report.summary.totalDeviations} detected

## Project Goals

${report.goals.length > 0
    ? report.goals.map((g: any, i: number) => `### ${i + 1}. ${g.title}
${g.description || 'No description'}
- **Status**: ${g.completed ? 'Completed' : 'Active'}
- **Created**: ${g.timestamp ? new Date(g.timestamp).toLocaleString() : 'Unknown'}
`).join('\n')
    : 'No goals defined.'}

## Recent Activities

${report.activities.length > 0
    ? report.activities.slice(-20).reverse().map((a: any, i: number) =>
        `${i + 1}. [${new Date(a.timestamp || Date.now()).toLocaleString()}] ${a.description || a.message || 'Activity'}`
    ).join('\n')
    : 'No activities recorded.'}

## Alerts & Issues

${report.alerts.length > 0
    ? report.alerts.slice(-20).reverse().map((a: any, i: number) =>
        `${i + 1}. **[${a.severity.toUpperCase()}]** [${new Date(a.timestamp).toLocaleString()}] ${a.message}`
    ).join('\n')
    : 'No alerts triggered.'}

## Deviations Detected

${report.deviations.length > 0
    ? report.deviations.map((d: any, i: number) =>
        `${i + 1}. **${d.type}** [${new Date(d.timestamp).toLocaleString()}]: ${d.message}`
    ).join('\n')
    : 'No deviations detected.'}

## Configuration

- **Sensitivity**: ${report.configuration.sensitivity}
- **Alerts Enabled**: ${report.configuration.alertsEnabled ? 'Yes' : 'No'}
- **Data Retention**: ${report.configuration.retentionDays} days

---
*Generated by AI Supervisor v${report.metadata.version}*
`;
    }
}
