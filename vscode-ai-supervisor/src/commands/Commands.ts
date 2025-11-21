import * as vscode from 'vscode';
import { ExtensionContext } from '../extension';
import { ActivityMonitorPanel } from '../panels/ActivityMonitor';
import { GoalManagerPanel } from '../panels/GoalManager';
import { ChangeInspectorPanel } from '../panels/ChangeInspector';

/**
 * Centralized command handler for all AI Supervisor commands
 */
export class Commands {
    constructor(private context: vscode.ExtensionContext) {}

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
        GoalManagerPanel.createOrShow(this.context.extensionUri);
    }

    /**
     * Show the Change Inspector panel
     */
    public async showChangeInspector(): Promise<void> {
        ChangeInspectorPanel.createOrShow(this.context.extensionUri);
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
            // TODO: Clear history from supervisor engine
            await this.context.globalState.update('aiSupervisor.activityHistory', []);
            vscode.window.showInformationMessage('Activity history cleared');
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
            defaultUri: vscode.Uri.file('ai-supervisor-report.json'),
            filters: {
                'JSON': ['json'],
                'Markdown': ['md'],
                'All Files': ['*']
            }
        });

        if (uri) {
            // TODO: Generate and save report
            vscode.window.showInformationMessage(`Report exported to ${uri.fsPath}`);
        }
    }

    /**
     * Open AI Supervisor settings
     */
    public async openSettings(): Promise<void> {
        await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:your-publisher-name.ai-supervisor');
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
        // TODO: Integrate with supervisor engine to get actual data
        const summary = `# Model Switch Handoff Summary

## Project Context
Working on: ${vscode.workspace.name || 'Unknown Project'}

## Current Goals
- [Add current goals from goal manager]

## Recent Changes
- [List recent file changes]

## Active Issues/Alerts
- [List any active alerts or deviations]

## Next Steps
- [Suggested next steps based on current context]

---
Generated by AI Supervisor at ${new Date().toISOString()}
`;

        return summary;
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
        // TODO: Implement actual license validation
        // For now, accept any non-empty key for development
        return licenseKey.trim().length > 0;
    }
}
