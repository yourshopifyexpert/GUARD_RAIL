import * as vscode from 'vscode';

export enum AlertSeverity {
    Info = 'info',
    Warning = 'warning',
    Error = 'error'
}

export interface Alert {
    id: string;
    message: string;
    severity: AlertSeverity;
    timestamp: number;
    source?: string;
    actionable?: boolean;
}

/**
 * Manages alert notifications and toast messages
 */
export class AlertManager {
    private alertHistory: Alert[] = [];
    private onDidAlertEmitter = new vscode.EventEmitter<Alert>();
    public readonly onDidAlert = this.onDidAlertEmitter.event;

    /**
     * Show an alert notification
     */
    public async showAlert(alert: Alert): Promise<void> {
        // Add to history
        this.alertHistory.push(alert);
        this.onDidAlertEmitter.fire(alert);

        // Check if notifications are enabled
        const config = vscode.workspace.getConfiguration('aiSupervisor');
        const showNotifications = config.get<boolean>('alerts.showNotifications', true);
        const minSeverity = config.get<string>('alerts.severity', 'all');

        if (!showNotifications) {
            return;
        }

        // Check severity filter
        if (minSeverity === 'warning' && alert.severity === AlertSeverity.Info) {
            return;
        }
        if (minSeverity === 'error' && alert.severity !== AlertSeverity.Error) {
            return;
        }

        // Show appropriate notification based on severity
        switch (alert.severity) {
            case AlertSeverity.Error:
                await this.showErrorAlert(alert);
                break;
            case AlertSeverity.Warning:
                await this.showWarningAlert(alert);
                break;
            case AlertSeverity.Info:
                await this.showInfoAlert(alert);
                break;
        }
    }

    /**
     * Show error alert with actions
     */
    private async showErrorAlert(alert: Alert): Promise<void> {
        const action = await vscode.window.showErrorMessage(
            `AI Supervisor: ` + alert.message,
            'Stop AI',
            'View Details',
            'Dismiss'
        );

        await this.handleAlertAction(alert, action);
    }

    /**
     * Show warning alert with actions
     */
    private async showWarningAlert(alert: Alert): Promise<void> {
        const action = await vscode.window.showWarningMessage(
            `AI Supervisor: ` + alert.message,
            'Allow This Time',
            'Update Goals',
            'View Details',
            'Dismiss'
        );

        await this.handleAlertAction(alert, action);
    }

    /**
     * Show info alert
     */
    private async showInfoAlert(alert: Alert): Promise<void> {
        const action = await vscode.window.showInformationMessage(
            `AI Supervisor: ` + alert.message,
            'View Details',
            'Dismiss'
        );

        await this.handleAlertAction(alert, action);
    }

    /**
     * Handle user action on alert
     */
    private async handleAlertAction(alert: Alert, action?: string): Promise<void> {
        switch (action) {
            case 'Stop AI':
                await vscode.commands.executeCommand('aiSupervisor.pauseMonitoring');
                break;
            case 'View Details':
                await vscode.commands.executeCommand('aiSupervisor.showChangeInspector');
                break;
            case 'Allow This Time':
                // TODO: Mark this deviation as allowed
                console.log('Allowing deviation:', alert.id);
                break;
            case 'Update Goals':
                await vscode.commands.executeCommand('aiSupervisor.showGoalManager');
                break;
            // 'Dismiss' or undefined - do nothing
        }
    }

    /**
     * Show a deviation alert
     */
    public async showDeviationAlert(
        deviationType: string,
        description: string,
        severity: AlertSeverity = AlertSeverity.Warning
    ): Promise<void> {
        const alert: Alert = {
            id: 'deviation-' + Date.now(),
            message: deviationType + ': ' + description,
            severity,
            timestamp: Date.now(),
            source: 'deviation-detector',
            actionable: true
        };

        await this.showAlert(alert);
    }

    /**
     * Show a code reversal alert
     */
    public async showReversalAlert(filePath: string, description: string): Promise<void> {
        await this.showDeviationAlert(
            'Code Reversal Detected',
            'AI reversed previous changes in ' + filePath + ': ' + description,
            AlertSeverity.Warning
        );
    }

    /**
     * Show a contradiction alert
     */
    public async showContradictionAlert(description: string): Promise<void> {
        await this.showDeviationAlert(
            'Contradictory Change',
            description,
            AlertSeverity.Error
        );
    }

    /**
     * Get alert history
     */
    public getAlertHistory(): Alert[] {
        return [...this.alertHistory];
    }

    /**
     * Clear alert history
     */
    public clearHistory(): void {
        this.alertHistory = [];
    }

    /**
     * Get alerts by severity
     */
    public getAlertsBySeverity(severity: AlertSeverity): Alert[] {
        return this.alertHistory.filter(alert => alert.severity === severity);
    }
}
