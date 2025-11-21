import * as vscode from 'vscode';

export enum AlertSeverity {
    Info = 'info',
    Warning = 'warning',
    Error = 'error'
}

export enum AlertType {
    GoalDeviation = 'goal-deviation',
    CodeReversal = 'code-reversal',
    UnauthorizedAction = 'unauthorized-action',
    RapidChanges = 'rapid-changes',
    ContradictoryChange = 'contradictory-change',
    Generic = 'generic'
}

export interface AlertMetadata {
    filePath?: string;
    goalId?: string;
    changeCount?: number;
    deviationType?: string;
    description?: string;
    action?: string;
    details?: unknown;
    timeWindow?: number;
    [key: string]: unknown;
}

export interface Alert {
    id: string;
    type: AlertType;
    message: string;
    severity: AlertSeverity;
    timestamp: number;
    source?: string;
    actionable?: boolean;
    metadata?: AlertMetadata;
}

interface AlertPreferences {
    dismissedTypes: Set<AlertType>;
    lastAlertTime: number;
}

/**
 * Production-ready Alert Manager with VS Code notifications
 *
 * Features:
 * - Real VS Code notifications with action buttons
 * - Alert history (last 100 alerts)
 * - Status bar integration
 * - Rate limiting (max 1 per 5 seconds)
 * - User preferences and dismissed alerts
 * - Type-specific handlers for all alert types
 */
export class AlertManager {
    private static readonly MAX_HISTORY_SIZE = 100;
    private static readonly RATE_LIMIT_MS = 5000; // 5 seconds

    private alertHistory: Alert[] = [];
    private preferences: AlertPreferences = {
        dismissedTypes: new Set(),
        lastAlertTime: 0
    };

    private onDidAlertEmitter = new vscode.EventEmitter<Alert>();
    public readonly onDidAlert = this.onDidAlertEmitter.event;

    private statusBarItem: vscode.StatusBarItem;
    private allowedDeviations = new Set<string>();

    constructor(private context: vscode.ExtensionContext) {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.command = 'aiSupervisor.showAlertHistory';
        this.loadPreferences();
        this.updateStatusBar();
    }

    /**
     * Show an alert notification with appropriate actions
     */
    public async showAlert(alert: Alert): Promise<void> {
        // Add to history (maintain max 100)
        this.alertHistory.unshift(alert);
        if (this.alertHistory.length > AlertManager.MAX_HISTORY_SIZE) {
            this.alertHistory = this.alertHistory.slice(0, AlertManager.MAX_HISTORY_SIZE);
        }

        this.onDidAlertEmitter.fire(alert);
        this.updateStatusBar();

        // Check if this alert type is dismissed
        if (this.preferences.dismissedTypes.has(alert.type)) {
            return;
        }

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

        // Rate limiting: max 1 alert per 5 seconds
        const now = Date.now();
        if (now - this.preferences.lastAlertTime < AlertManager.RATE_LIMIT_MS) {
            return;
        }
        this.preferences.lastAlertTime = now;

        // Show appropriate notification based on type
        switch (alert.type) {
            case AlertType.GoalDeviation:
                await this.showGoalDeviationAlertInternal(alert);
                break;
            case AlertType.CodeReversal:
                await this.showCodeReversalAlertInternal(alert);
                break;
            case AlertType.UnauthorizedAction:
                await this.showUnauthorizedActionAlertInternal(alert);
                break;
            case AlertType.RapidChanges:
                await this.showRapidChangesAlertInternal(alert);
                break;
            case AlertType.ContradictoryChange:
                await this.showContradictoryChangeAlert(alert);
                break;
            default:
                await this.showGenericAlert(alert);
                break;
        }
    }

    /**
     * Show Goal Deviation alert with "Update Goals" button
     */
    private async showGoalDeviationAlertInternal(alert: Alert): Promise<void> {
        const action = await vscode.window.showWarningMessage(
            `AI Supervisor: ${alert.message}`,
            { modal: false },
            'Update Goals',
            'Allow This Time',
            'View Details',
            'Dismiss Type'
        );

        await this.handleAlertAction(alert, action);
    }

    /**
     * Show Code Reversal alert with "View Details" button
     */
    private async showCodeReversalAlertInternal(alert: Alert): Promise<void> {
        const action = await vscode.window.showErrorMessage(
            `AI Supervisor: ${alert.message}`,
            { modal: false },
            'View Details',
            'Stop AI',
            'Allow This Time',
            'Dismiss Type'
        );

        await this.handleAlertAction(alert, action);
    }

    /**
     * Show Unauthorized Action alert with "Stop AI" button
     */
    private async showUnauthorizedActionAlertInternal(alert: Alert): Promise<void> {
        const action = await vscode.window.showErrorMessage(
            `AI Supervisor: ${alert.message}`,
            { modal: true },
            'Stop AI',
            'View Details',
            'Allow This Time'
        );

        await this.handleAlertAction(alert, action);
    }

    /**
     * Show Rapid Changes alert with "View Activity" button
     */
    private async showRapidChangesAlertInternal(alert: Alert): Promise<void> {
        const changeCount = alert.metadata?.changeCount || 0;
        const action = await vscode.window.showInformationMessage(
            `AI Supervisor: ${alert.message} (${changeCount} changes in quick succession)`,
            { modal: false },
            'View Activity',
            'Stop AI',
            'Dismiss'
        );

        await this.handleAlertAction(alert, action);
    }

    /**
     * Show Contradictory Change alert
     */
    private async showContradictoryChangeAlert(alert: Alert): Promise<void> {
        const action = await vscode.window.showErrorMessage(
            `AI Supervisor: ${alert.message}`,
            { modal: false },
            'View Details',
            'Stop AI',
            'Update Goals',
            'Dismiss Type'
        );

        await this.handleAlertAction(alert, action);
    }

    /**
     * Show generic alert based on severity
     */
    private async showGenericAlert(alert: Alert): Promise<void> {
        let action: string | undefined;

        switch (alert.severity) {
            case AlertSeverity.Error:
                action = await vscode.window.showErrorMessage(
                    `AI Supervisor: ${alert.message}`,
                    { modal: false },
                    'Stop AI',
                    'View Details',
                    'Dismiss'
                );
                break;
            case AlertSeverity.Warning:
                action = await vscode.window.showWarningMessage(
                    `AI Supervisor: ${alert.message}`,
                    { modal: false },
                    'Allow This Time',
                    'Update Goals',
                    'View Details',
                    'Dismiss'
                );
                break;
            case AlertSeverity.Info:
                action = await vscode.window.showInformationMessage(
                    `AI Supervisor: ${alert.message}`,
                    { modal: false },
                    'View Details',
                    'Dismiss'
                );
                break;
        }

        if (action) {
            await this.handleAlertAction(alert, action);
        }
    }

    /**
     * Handle user action on alert with real implementations
     */
    private async handleAlertAction(alert: Alert, action?: string): Promise<void> {
        if (!action) {
            return;
        }

        switch (action) {
            case 'Stop AI':
                await vscode.commands.executeCommand('aiSupervisor.pauseMonitoring');
                vscode.window.showInformationMessage('AI Supervisor: Monitoring paused');
                break;

            case 'View Details':
                await vscode.commands.executeCommand('aiSupervisor.showChangeInspector');
                break;

            case 'View Activity':
                await vscode.commands.executeCommand('aiSupervisor.showActivityMonitor');
                break;

            case 'Allow This Time':
                this.allowedDeviations.add(alert.id);
                vscode.window.showInformationMessage(
                    `AI Supervisor: Allowed this ${alert.type} (ID: ${alert.id.substring(0, 8)}...)`
                );
                break;

            case 'Update Goals':
                await vscode.commands.executeCommand('aiSupervisor.showGoalManager');
                break;

            case 'Dismiss Type':
                this.preferences.dismissedTypes.add(alert.type);
                this.savePreferences();
                vscode.window.showInformationMessage(
                    `AI Supervisor: Dismissed all "${alert.type}" alerts. Re-enable in settings.`
                );
                break;

            case 'Dismiss':
                // Just close the notification
                break;
        }
    }

    /**
     * Show a Goal Deviation alert (overloaded for compatibility)
     */
    public async showGoalDeviationAlert(
        messageOrType: string,
        description?: string,
        metadata?: AlertMetadata
    ): Promise<void> {
        let alert: Alert;

        if (description !== undefined) {
            // Called with (deviationType, description, metadata)
            alert = {
                id: `deviation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: AlertType.GoalDeviation,
                message: `${messageOrType}: ${description}`,
                severity: AlertSeverity.Warning,
                timestamp: Date.now(),
                source: 'deviation-detector',
                actionable: true,
                metadata: metadata || {}
            };
        } else {
            // Called with just (message, details, metadata) from SupervisorBridge
            alert = {
                id: `deviation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: AlertType.GoalDeviation,
                message: messageOrType,
                severity: AlertSeverity.Warning,
                timestamp: Date.now(),
                source: 'supervisor-bridge',
                actionable: true,
                metadata: metadata || {}
            };
        }

        await this.showAlert(alert);
    }

    /**
     * Show a deviation alert (legacy method)
     */
    public async showDeviationAlert(
        deviationType: string,
        description: string,
        goalId?: string,
        severity: AlertSeverity = AlertSeverity.Warning
    ): Promise<void> {
        const alert: Alert = {
            id: `deviation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: AlertType.GoalDeviation,
            message: `${deviationType}: ${description}`,
            severity,
            timestamp: Date.now(),
            source: 'deviation-detector',
            actionable: true,
            metadata: {
                goalId,
                deviationType
            }
        };

        await this.showAlert(alert);
    }

    /**
     * Show a Code Reversal alert (overloaded for compatibility)
     */
    public async showCodeReversalAlert(
        messageOrFilePath: string,
        description?: string,
        metadata?: AlertMetadata
    ): Promise<void> {
        let alert: Alert;

        if (description !== undefined && !metadata) {
            // Called with (filePath, description)
            alert = {
                id: `reversal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: AlertType.CodeReversal,
                message: `Code Reversal Detected in ${messageOrFilePath}: ${description}`,
                severity: AlertSeverity.Error,
                timestamp: Date.now(),
                source: 'reversal-detector',
                actionable: true,
                metadata: {
                    filePath: messageOrFilePath,
                    description
                }
            };
        } else {
            // Called with (message, details, metadata) from SupervisorBridge
            alert = {
                id: `reversal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: AlertType.CodeReversal,
                message: messageOrFilePath,
                severity: AlertSeverity.Error,
                timestamp: Date.now(),
                source: 'supervisor-bridge',
                actionable: true,
                metadata: metadata || {}
            };
        }

        await this.showAlert(alert);
    }

    /**
     * Show a reversal alert (legacy method)
     */
    public async showReversalAlert(filePath: string, description: string): Promise<void> {
        await this.showCodeReversalAlert(filePath, description);
    }

    /**
     * Show a Contradictory Change alert
     */
    public async showContradictionAlert(description: string, filePath?: string): Promise<void> {
        const alert: Alert = {
            id: `contradiction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: AlertType.ContradictoryChange,
            message: `Contradictory Change: ${description}`,
            severity: AlertSeverity.Error,
            timestamp: Date.now(),
            source: 'pattern-analyzer',
            actionable: true,
            metadata: {
                filePath,
                description
            }
        };

        await this.showAlert(alert);
    }

    /**
     * Show an Unauthorized Action alert (overloaded for compatibility)
     */
    public async showUnauthorizedActionAlert(
        messageOrAction: string,
        detailsOrFilePath?: string,
        metadata?: AlertMetadata
    ): Promise<void> {
        let alert: Alert;

        if (metadata !== undefined || detailsOrFilePath?.includes('/')) {
            // Called with (action, filePath, details) - traditional format
            alert = {
                id: `unauthorized-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: AlertType.UnauthorizedAction,
                message: `Unauthorized Action: ${messageOrAction}${detailsOrFilePath ? ` in ${detailsOrFilePath}` : ''}`,
                severity: AlertSeverity.Error,
                timestamp: Date.now(),
                source: 'security-monitor',
                actionable: true,
                metadata: {
                    action: messageOrAction,
                    filePath: detailsOrFilePath,
                    details: metadata
                }
            };
        } else {
            // Called with (message, details, metadata) from SupervisorBridge
            alert = {
                id: `unauthorized-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: AlertType.UnauthorizedAction,
                message: messageOrAction,
                severity: AlertSeverity.Error,
                timestamp: Date.now(),
                source: 'supervisor-bridge',
                actionable: true,
                metadata: metadata || {}
            };
        }

        await this.showAlert(alert);
    }

    /**
     * Show a Rapid Changes alert (overloaded for compatibility)
     */
    public async showRapidChangesAlert(
        messageOrCount: string | number,
        detailsOrTimeWindow?: string | number,
        metadata?: AlertMetadata
    ): Promise<void> {
        let alert: Alert;

        if (typeof messageOrCount === 'number') {
            // Called with (changeCount, timeWindow)
            const changeCount = messageOrCount;
            const timeWindow = detailsOrTimeWindow as number || 0;
            alert = {
                id: `rapid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: AlertType.RapidChanges,
                message: `Rapid Changes Detected: ${changeCount} changes in ${timeWindow}ms`,
                severity: AlertSeverity.Info,
                timestamp: Date.now(),
                source: 'activity-monitor',
                actionable: true,
                metadata: {
                    changeCount,
                    timeWindow
                }
            };
        } else {
            // Called with (message, details, metadata)
            alert = {
                id: `rapid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: AlertType.RapidChanges,
                message: messageOrCount,
                severity: AlertSeverity.Info,
                timestamp: Date.now(),
                source: 'supervisor-bridge',
                actionable: true,
                metadata: metadata || {}
            };
        }

        await this.showAlert(alert);
    }

    /**
     * Get alert history
     */
    public getAlertHistory(): Alert[] {
        return [...this.alertHistory];
    }

    /**
     * Get recent alerts (last N)
     */
    public getRecentAlerts(count: number = 10): Alert[] {
        return this.alertHistory.slice(0, count);
    }

    /**
     * Clear alert history
     */
    public clearHistory(): void {
        this.alertHistory = [];
        this.allowedDeviations.clear();
        this.updateStatusBar();
        vscode.window.showInformationMessage('AI Supervisor: Alert history cleared');
    }

    /**
     * Get alerts by severity
     */
    public getAlertsBySeverity(severity: AlertSeverity): Alert[] {
        return this.alertHistory.filter(alert => alert.severity === severity);
    }

    /**
     * Get alerts by type
     */
    public getAlertsByType(type: AlertType): Alert[] {
        return this.alertHistory.filter(alert => alert.type === type);
    }

    /**
     * Get alerts within time range
     */
    public getAlertsInTimeRange(startTime: number, endTime: number): Alert[] {
        return this.alertHistory.filter(
            alert => alert.timestamp >= startTime && alert.timestamp <= endTime
        );
    }

    /**
     * Check if deviation is allowed
     */
    public isDeviationAllowed(alertId: string): boolean {
        return this.allowedDeviations.has(alertId);
    }

    /**
     * Update status bar with alert count
     */
    private updateStatusBar(): void {
        const errorCount = this.getAlertsBySeverity(AlertSeverity.Error).length;
        const warningCount = this.getAlertsBySeverity(AlertSeverity.Warning).length;

        if (errorCount > 0) {
            this.statusBarItem.text = `$(error) ${errorCount} $(warning) ${warningCount}`;
            this.statusBarItem.tooltip = `AI Supervisor: ${errorCount} error(s), ${warningCount} warning(s)\nClick to view history`;
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
            this.statusBarItem.show();
        } else if (warningCount > 0) {
            this.statusBarItem.text = `$(warning) ${warningCount}`;
            this.statusBarItem.tooltip = `AI Supervisor: ${warningCount} warning(s)\nClick to view history`;
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            this.statusBarItem.show();
        } else if (this.alertHistory.length > 0) {
            this.statusBarItem.text = `$(check) ${this.alertHistory.length}`;
            this.statusBarItem.tooltip = `AI Supervisor: ${this.alertHistory.length} alert(s)\nClick to view history`;
            this.statusBarItem.backgroundColor = undefined;
            this.statusBarItem.show();
        } else {
            this.statusBarItem.hide();
        }
    }

    /**
     * Show alert history in Quick Pick
     */
    public async showAlertHistoryQuickPick(): Promise<void> {
        if (this.alertHistory.length === 0) {
            vscode.window.showInformationMessage('AI Supervisor: No alerts in history');
            return;
        }

        const items = this.alertHistory.map(alert => {
            const icon = alert.severity === AlertSeverity.Error ? '$(error)' :
                        alert.severity === AlertSeverity.Warning ? '$(warning)' : '$(info)';
            const date = new Date(alert.timestamp).toLocaleString();

            return {
                label: `${icon} ${alert.message}`,
                description: date,
                detail: `Type: ${alert.type} | Source: ${alert.source || 'unknown'}`,
                alert
            };
        });

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select an alert to view details',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (selected) {
            await this.showAlertDetails(selected.alert);
        }
    }

    /**
     * Show detailed information about an alert
     */
    private async showAlertDetails(alert: Alert): Promise<void> {
        const details = [
            `**Alert Details**`,
            ``,
            `**Type:** ${alert.type}`,
            `**Severity:** ${alert.severity}`,
            `**Time:** ${new Date(alert.timestamp).toLocaleString()}`,
            `**Source:** ${alert.source || 'unknown'}`,
            `**ID:** ${alert.id}`,
            ``,
            `**Message:** ${alert.message}`,
        ];

        if (alert.metadata) {
            details.push(``, `**Metadata:**`);
            for (const [key, value] of Object.entries(alert.metadata)) {
                if (value !== undefined && value !== null) {
                    details.push(`- ${key}: ${value}`);
                }
            }
        }

        const actions = ['View in Inspector', 'Close'];
        const action = await vscode.window.showInformationMessage(
            details.join('\n'),
            { modal: true },
            ...actions
        );

        if (action === 'View in Inspector') {
            await vscode.commands.executeCommand('aiSupervisor.showChangeInspector');
        }
    }

    /**
     * Reset dismissed alert types
     */
    public resetDismissedTypes(): void {
        this.preferences.dismissedTypes.clear();
        this.savePreferences();
        vscode.window.showInformationMessage('AI Supervisor: Re-enabled all dismissed alert types');
    }

    /**
     * Get alert statistics
     */
    public getStatistics(): {
        total: number;
        byType: Partial<Record<AlertType, number>>;
        bySeverity: Partial<Record<AlertSeverity, number>>;
        last24Hours: number;
    } {
        const now = Date.now();
        const last24Hours = now - (24 * 60 * 60 * 1000);

        const byType: Partial<Record<AlertType, number>> = {};
        const bySeverity: Partial<Record<AlertSeverity, number>> = {};

        for (const alert of this.alertHistory) {
            byType[alert.type] = (byType[alert.type] || 0) + 1;
            bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
        }

        return {
            total: this.alertHistory.length,
            byType,
            bySeverity,
            last24Hours: this.alertHistory.filter(a => a.timestamp >= last24Hours).length
        };
    }

    /**
     * Load preferences from workspace state
     */
    private loadPreferences(): void {
        const dismissed = this.context.workspaceState.get<string[]>('dismissedAlertTypes', []);
        this.preferences.dismissedTypes = new Set(dismissed as AlertType[]);
    }

    /**
     * Save preferences to workspace state
     */
    private savePreferences(): void {
        const dismissed = Array.from(this.preferences.dismissedTypes);
        this.context.workspaceState.update('dismissedAlertTypes', dismissed);
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        this.statusBarItem.dispose();
        this.onDidAlertEmitter.dispose();
    }
}
