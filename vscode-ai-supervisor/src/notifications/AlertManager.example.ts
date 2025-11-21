/**
 * AlertManager Usage Examples
 *
 * This file demonstrates how to use the AlertManager in a VS Code extension.
 * DO NOT import this file in production code - it's for reference only.
 */

import * as vscode from 'vscode';
import { AlertManager, AlertSeverity, AlertType } from './AlertManager';

/**
 * Example: Initialize AlertManager
 */
export function initializeAlertManager(context: vscode.ExtensionContext): AlertManager {
    const alertManager = new AlertManager(context);

    // Subscribe to alert events
    alertManager.onDidAlert((alert) => {
        console.log(`Alert fired: ${alert.type} - ${alert.message}`);
    });

    return alertManager;
}

/**
 * Example: Show different alert types with appropriate buttons
 */
export async function demonstrateAlertTypes(alertManager: AlertManager): Promise<void> {

    // 1. Goal Deviation Alert - Shows "Update Goals" button
    await alertManager.showDeviationAlert(
        'Goal Deviation Detected',
        'AI is modifying authentication logic, which deviates from project goal "No auth changes"',
        'goal-123',
        AlertSeverity.Warning
    );

    // 2. Code Reversal Alert - Shows "View Details" button
    await alertManager.showReversalAlert(
        '/src/components/UserProfile.tsx',
        'AI removed error handling code that was added 5 minutes ago'
    );

    // 3. Unauthorized Action Alert - Shows "Stop AI" button (modal)
    await alertManager.showUnauthorizedActionAlert(
        'Delete File',
        '/config/production.env',
        { description: 'AI attempted to delete production configuration file' }
    );

    // 4. Rapid Changes Alert - Shows "View Activity" button
    await alertManager.showRapidChangesAlert(
        15,  // changeCount
        3000 // timeWindow in milliseconds
    );

    // 5. Contradictory Change Alert
    await alertManager.showContradictionAlert(
        'AI is adding async/await while removing Promise chains in the same file',
        '/src/services/ApiService.ts'
    );
}

/**
 * Example: Working with Alert History
 */
export function demonstrateAlertHistory(alertManager: AlertManager): void {

    // Get all alerts (max 100, most recent first)
    const allAlerts = alertManager.getAlertHistory();
    console.log(`Total alerts: ${allAlerts.length}`);

    // Get recent alerts (last 10)
    const recentAlerts = alertManager.getRecentAlerts(10);
    console.log(`Recent alerts: ${recentAlerts.length}`);

    // Get alerts by severity
    const errors = alertManager.getAlertsBySeverity(AlertSeverity.Error);
    const warnings = alertManager.getAlertsBySeverity(AlertSeverity.Warning);
    const info = alertManager.getAlertsBySeverity(AlertSeverity.Info);
    console.log(`Errors: ${errors.length}, Warnings: ${warnings.length}, Info: ${info.length}`);

    // Get alerts by type
    const goalDeviations = alertManager.getAlertsByType(AlertType.GoalDeviation);
    const reversals = alertManager.getAlertsByType(AlertType.CodeReversal);
    console.log(`Goal deviations: ${goalDeviations.length}, Reversals: ${reversals.length}`);

    // Get alerts in time range (last 24 hours)
    const now = Date.now();
    const yesterday = now - (24 * 60 * 60 * 1000);
    const last24Hours = alertManager.getAlertsInTimeRange(yesterday, now);
    console.log(`Alerts in last 24 hours: ${last24Hours.length}`);

    // Get statistics
    const stats = alertManager.getStatistics();
    console.log('Alert Statistics:', stats);
    /*
    Example output:
    {
        total: 47,
        byType: {
            'goal-deviation': 12,
            'code-reversal': 8,
            'unauthorized-action': 2,
            'rapid-changes': 15,
            'contradictory-change': 10
        },
        bySeverity: {
            'error': 10,
            'warning': 22,
            'info': 15
        },
        last24Hours: 23
    }
    */
}

/**
 * Example: Show alert history to user
 */
export async function showAlertHistoryToUser(alertManager: AlertManager): Promise<void> {
    // This shows a Quick Pick with all alerts
    // User can select an alert to view details
    // Clicking an alert shows metadata and action buttons
    await alertManager.showAlertHistoryQuickPick();
}

/**
 * Example: Check if a deviation was allowed
 */
export function checkAllowedDeviations(alertManager: AlertManager, alertId: string): void {
    if (alertManager.isDeviationAllowed(alertId)) {
        console.log('This deviation was explicitly allowed by the user');
        // Don't show warning or block the action
    } else {
        console.log('This deviation was not allowed');
        // Show warning or block the action
    }
}

/**
 * Example: Clear alert history
 */
export function clearAlerts(alertManager: AlertManager): void {
    // This clears all alerts and shows a confirmation message
    alertManager.clearHistory();
}

/**
 * Example: Reset dismissed alert types
 */
export function resetDismissedAlerts(alertManager: AlertManager): void {
    // This re-enables all alert types that were dismissed by the user
    alertManager.resetDismissedTypes();
}

/**
 * Example: Status Bar Integration
 *
 * The AlertManager automatically updates the status bar with:
 * - Error count (red background)
 * - Warning count (yellow background)
 * - Total alert count (no background)
 *
 * The status bar item is clickable and shows the alert history.
 * It automatically hides when there are no alerts.
 */

/**
 * Example: Rate Limiting Demonstration
 *
 * The AlertManager enforces a rate limit of 1 alert per 5 seconds.
 * This prevents notification spam.
 */
export async function demonstrateRateLimiting(alertManager: AlertManager): Promise<void> {
    // Only the first alert will show a notification
    // The rest will be added to history but not shown
    await alertManager.showDeviationAlert('Test 1', 'First alert');
    await alertManager.showDeviationAlert('Test 2', 'Second alert (won\'t show - rate limited)');
    await alertManager.showDeviationAlert('Test 3', 'Third alert (won\'t show - rate limited)');

    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));

    // This will show because 5 seconds have passed
    await alertManager.showDeviationAlert('Test 4', 'Fourth alert (will show)');
}

/**
 * Example: User Preferences
 *
 * Users can configure alert behavior in VS Code settings:
 *
 * settings.json:
 * {
 *   "aiSupervisor.alerts.showNotifications": true,    // Enable/disable all notifications
 *   "aiSupervisor.alerts.severity": "warning",        // Show only warnings and errors
 *   "aiSupervisor.alerts.severity": "error",          // Show only errors
 *   "aiSupervisor.alerts.severity": "all"             // Show all alerts
 * }
 */

/**
 * Example: Alert Action Handlers
 *
 * When users click action buttons, the following happens:
 *
 * 1. "Stop AI" -> Executes 'aiSupervisor.pauseMonitoring' command
 * 2. "View Details" -> Executes 'aiSupervisor.showChangeInspector' command
 * 3. "View Activity" -> Executes 'aiSupervisor.showActivityMonitor' command
 * 4. "Update Goals" -> Executes 'aiSupervisor.showGoalManager' command
 * 5. "Allow This Time" -> Marks the alert as allowed (stored in memory)
 * 6. "Dismiss Type" -> Dismisses all future alerts of this type (persisted)
 * 7. "Dismiss" -> Closes the notification
 */

/**
 * Example: Integration with File Watcher
 */
export async function integrateWithFileWatcher(
    alertManager: AlertManager,
    fileWatcher: any
): Promise<void> {
    // When file changes are detected, check for various issues

    // Example: Detect unauthorized file deletion
    const deletedFile = '/important/config.ts';
    await alertManager.showUnauthorizedActionAlert(
        'File Deletion',
        deletedFile,
        { description: 'AI attempted to delete critical configuration file' }
    );

    // Example: Detect rapid changes
    const changeCount = 20;
    const timeWindow = 2000; // 2 seconds
    await alertManager.showRapidChangesAlert(changeCount, timeWindow);

    // Example: Detect code reversal
    await alertManager.showReversalAlert(
        '/src/utils/validation.ts',
        'Removed input validation that was added in previous session'
    );
}

/**
 * Example: Integration with Goal Manager
 */
export async function integrateWithGoalManager(
    alertManager: AlertManager,
    goalManager: any
): Promise<void> {
    // When AI code deviates from project goals

    const activeGoals = [
        { id: 'goal-1', description: 'No database schema changes' },
        { id: 'goal-2', description: 'Maintain TypeScript strict mode' },
        { id: 'goal-3', description: 'No external API calls without approval' }
    ];

    // Example: AI violated goal-3
    await alertManager.showDeviationAlert(
        'External API Call Detected',
        'AI added fetch() call to third-party service without approval',
        'goal-3',
        AlertSeverity.Warning
    );
}

/**
 * Example: Complete workflow
 */
export async function completeWorkflow(
    context: vscode.ExtensionContext
): Promise<void> {
    // 1. Initialize
    const alertManager = initializeAlertManager(context);

    // 2. Monitor for issues
    // (normally done by FileWatcher, DeviationDetector, etc.)

    // 3. Detect an issue and show alert
    await alertManager.showDeviationAlert(
        'Architecture Violation',
        'AI is adding business logic to UI components',
        'goal-architecture',
        AlertSeverity.Warning
    );

    // 4. User sees notification with buttons:
    //    [Update Goals] [Allow This Time] [View Details] [Dismiss Type]

    // 5. If user clicks "Update Goals":
    //    -> Opens Goal Manager panel
    //    -> User can modify project goals

    // 6. If user clicks "Allow This Time":
    //    -> This specific deviation is marked as allowed
    //    -> Future similar deviations still trigger alerts

    // 7. If user clicks "Dismiss Type":
    //    -> All "goal-deviation" alerts are disabled
    //    -> Preference is saved in workspace state

    // 8. User can view history at any time:
    await alertManager.showAlertHistoryQuickPick();

    // 9. Clean up on extension deactivation
    alertManager.dispose();
}
