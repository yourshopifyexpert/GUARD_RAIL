import * as vscode from 'vscode';
import { ActivityMonitorPanel } from '../panels/ActivityMonitor';

/**
 * Example usage of the Activity Monitor Panel
 * This demonstrates how to integrate the Activity Monitor with your extension
 */
export class ActivityMonitorExample {

    /**
     * Example 1: Basic setup and opening the panel
     */
    static registerCommands(context: vscode.ExtensionContext): void {
        // Register command to open Activity Monitor
        context.subscriptions.push(
            vscode.commands.registerCommand('ai-supervisor.openActivityMonitor', () => {
                ActivityMonitorPanel.createOrShow(context.extensionUri);
            })
        );

        // Register command to add sample activities (for testing)
        context.subscriptions.push(
            vscode.commands.registerCommand('ai-supervisor.addSampleActivities', () => {
                this.addSampleActivities();
            })
        );
    }

    /**
     * Example 2: Adding activities when files are changed
     */
    static onFileChange(uri: vscode.Uri, changeType: 'create' | 'change' | 'delete', aiTool: string): void {
        if (!ActivityMonitorPanel.currentPanel) {
            return; // Panel not open, skip
        }

        // Determine status based on file type or content
        const status = this.determineStatus(uri, changeType);

        // Add activity to the monitor
        ActivityMonitorPanel.currentPanel.addActivity({
            file: uri.fsPath,
            changeType,
            aiTool,
            status,
            description: this.generateDescription(uri, changeType, aiTool),
            details: this.generateDetails(uri, changeType)
        });
    }

    /**
     * Example 3: Adding activities with different statuses
     */
    static addSampleActivities(): void {
        if (!ActivityMonitorPanel.currentPanel) {
            vscode.window.showWarningMessage('Please open Activity Monitor first');
            return;
        }

        const samples = [
            {
                file: '/workspace/src/auth/login.ts',
                changeType: 'create' as const,
                aiTool: 'GitHub Copilot',
                status: 'success' as const,
                description: 'Created new login authentication module',
                details: 'Added JWT token generation and validation (127 lines)'
            },
            {
                file: '/workspace/src/api/users.ts',
                changeType: 'change' as const,
                aiTool: 'Cursor AI',
                status: 'success' as const,
                description: 'Enhanced user management API endpoints',
                details: 'Added pagination, filtering, and sorting capabilities'
            },
            {
                file: '/workspace/src/config/database.ts',
                changeType: 'change' as const,
                aiTool: 'Claude Code',
                status: 'warning' as const,
                description: 'Modified database connection settings',
                details: 'WARNING: Connection pool size increased to 200 - may impact performance'
            },
            {
                file: '/workspace/src/utils/validation.ts',
                changeType: 'delete' as const,
                aiTool: 'GitHub Copilot',
                status: 'warning' as const,
                description: 'Removed deprecated validation utilities',
                details: 'WARNING: Some components may still reference deleted functions'
            },
            {
                file: '/workspace/src/auth/password.ts',
                changeType: 'create' as const,
                aiTool: 'Cursor AI',
                status: 'error' as const,
                description: 'Created password hashing module with security issue',
                details: 'ERROR: Hardcoded salt detected on line 15. Use environment variables instead!'
            },
            {
                file: '/workspace/.env',
                changeType: 'change' as const,
                aiTool: 'Claude Code',
                status: 'error' as const,
                description: 'Modified environment configuration',
                details: 'CRITICAL ERROR: .env file should never be committed to version control'
            }
        ];

        // Add all sample activities
        samples.forEach((sample, index) => {
            // Add with delay to show animation
            setTimeout(() => {
                ActivityMonitorPanel.currentPanel?.addActivity(sample);
            }, index * 300);
        });

        vscode.window.showInformationMessage(`Added ${samples.length} sample activities`);
    }

    /**
     * Example 4: Filtering activities programmatically
     */
    static getErrorActivities(): void {
        if (!ActivityMonitorPanel.currentPanel) {
            return;
        }

        const errors = ActivityMonitorPanel.currentPanel.getFilteredActivities({
            status: 'error'
        });

        if (errors.length > 0) {
            vscode.window.showErrorMessage(
                `Found ${errors.length} error activities that need attention`
            );
        }
    }

    /**
     * Example 5: Getting recent activities
     */
    static getRecentActivities(minutes: number): void {
        if (!ActivityMonitorPanel.currentPanel) {
            return;
        }

        const cutoffTime = Date.now() - (minutes * 60 * 1000);
        const recent = ActivityMonitorPanel.currentPanel.getFilteredActivities({
            startTime: cutoffTime
        });

        vscode.window.showInformationMessage(
            `${recent.length} activities in the last ${minutes} minutes`
        );
    }

    /**
     * Example 6: Monitoring specific files
     */
    static getActivitiesForFile(filePath: string): void {
        if (!ActivityMonitorPanel.currentPanel) {
            return;
        }

        const fileActivities = ActivityMonitorPanel.currentPanel.getFilteredActivities({
            file: filePath
        });

        if (fileActivities.length > 0) {
            const message = `File ${filePath} has ${fileActivities.length} activities:\n` +
                fileActivities.map(a => `- ${a.changeType}: ${a.description}`).join('\n');
            vscode.window.showInformationMessage(message);
        }
    }

    /**
     * Example 7: Real-time file watching integration
     */
    static setupFileWatcher(context: vscode.ExtensionContext): void {
        // Watch for file changes in workspace
        const watcher = vscode.workspace.createFileSystemWatcher(
            '**/*.{ts,js,tsx,jsx,py,java}',
            false, // ignoreCreateEvents
            false, // ignoreChangeEvents
            false  // ignoreDeleteEvents
        );

        // Track rapid changes to detect AI activity
        const changeBuffer = new Map<string, number>();

        const handleChange = (uri: vscode.Uri, type: 'create' | 'change' | 'delete') => {
            const filePath = uri.fsPath;
            const now = Date.now();
            const lastChange = changeBuffer.get(filePath) || 0;
            const timeSinceLastChange = now - lastChange;

            // If changes are rapid (< 2 seconds), likely AI-generated
            const isLikelyAI = timeSinceLastChange < 2000;

            changeBuffer.set(filePath, now);

            if (isLikelyAI && ActivityMonitorPanel.currentPanel) {
                ActivityMonitorPanel.currentPanel.addActivity({
                    file: filePath,
                    changeType: type,
                    aiTool: 'AI Assistant (detected)',
                    status: 'success',
                    description: `Rapid ${type} detected`,
                    details: `Time since last change: ${timeSinceLastChange}ms`
                });
            }
        };

        watcher.onDidCreate(uri => handleChange(uri, 'create'));
        watcher.onDidChange(uri => handleChange(uri, 'change'));
        watcher.onDidDelete(uri => handleChange(uri, 'delete'));

        context.subscriptions.push(watcher);
    }

    /**
     * Helper: Determine status based on file and change type
     */
    private static determineStatus(
        uri: vscode.Uri,
        changeType: 'create' | 'change' | 'delete'
    ): 'success' | 'warning' | 'error' {
        const fileName = uri.fsPath.toLowerCase();

        // Error conditions
        if (fileName.includes('.env') || fileName.includes('credentials')) {
            return 'error';
        }

        // Warning conditions
        if (changeType === 'delete' || fileName.includes('config')) {
            return 'warning';
        }

        // Success by default
        return 'success';
    }

    /**
     * Helper: Generate human-readable description
     */
    private static generateDescription(
        uri: vscode.Uri,
        changeType: 'create' | 'change' | 'delete',
        aiTool: string
    ): string {
        const fileName = uri.fsPath.split(/[\\/]/).pop() || 'file';
        const action = changeType === 'create' ? 'Created' :
                      changeType === 'delete' ? 'Deleted' : 'Modified';

        return `${action} ${fileName} using ${aiTool}`;
    }

    /**
     * Helper: Generate additional details
     */
    private static generateDetails(
        uri: vscode.Uri,
        changeType: 'create' | 'change' | 'delete'
    ): string | undefined {
        const fileName = uri.fsPath.toLowerCase();

        if (fileName.includes('.env')) {
            return 'CRITICAL: Environment files should not be modified by AI tools';
        }

        if (changeType === 'delete') {
            return 'WARNING: Ensure no other files depend on this deleted file';
        }

        if (fileName.includes('auth') || fileName.includes('security')) {
            return 'INFO: Security-related file - review changes carefully';
        }

        return undefined;
    }

    /**
     * Example 8: Export activities for reporting
     */
    static async exportActivityReport(outputPath: string): Promise<void> {
        if (!ActivityMonitorPanel.currentPanel) {
            vscode.window.showWarningMessage('Activity Monitor is not open');
            return;
        }

        const activities = ActivityMonitorPanel.currentPanel.getActivities();

        // Generate a markdown report
        const report = this.generateMarkdownReport(activities);

        // Write to file
        const uri = vscode.Uri.file(outputPath);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(report, 'utf8'));

        vscode.window.showInformationMessage(`Activity report exported to ${outputPath}`);
    }

    /**
     * Helper: Generate markdown report
     */
    private static generateMarkdownReport(activities: any[]): string {
        const stats = {
            total: activities.length,
            success: activities.filter(a => a.status === 'success').length,
            warning: activities.filter(a => a.status === 'warning').length,
            error: activities.filter(a => a.status === 'error').length
        };

        let report = '# AI Activity Report\n\n';
        report += `Generated: ${new Date().toLocaleString()}\n\n`;
        report += '## Summary\n\n';
        report += `- Total Activities: ${stats.total}\n`;
        report += `- Successful: ${stats.success}\n`;
        report += `- Warnings: ${stats.warning}\n`;
        report += `- Errors: ${stats.error}\n\n`;
        report += '## Activities\n\n';

        activities.forEach((activity, index) => {
            const statusEmoji = activity.status === 'success' ? '✅' :
                               activity.status === 'warning' ? '⚠️' : '❌';

            report += `### ${index + 1}. ${statusEmoji} ${activity.description}\n\n`;
            report += `- **File**: \`${activity.file}\`\n`;
            report += `- **Type**: ${activity.changeType.toUpperCase()}\n`;
            report += `- **Tool**: ${activity.aiTool}\n`;
            report += `- **Status**: ${activity.status}\n`;
            report += `- **Time**: ${new Date(activity.timestamp).toLocaleString()}\n`;

            if (activity.details) {
                report += `- **Details**: ${activity.details}\n`;
            }

            report += '\n';
        });

        return report;
    }
}

/**
 * Usage in extension.ts:
 *
 * export function activate(context: vscode.ExtensionContext) {
 *     // Register commands
 *     ActivityMonitorExample.registerCommands(context);
 *
 *     // Setup file watcher
 *     ActivityMonitorExample.setupFileWatcher(context);
 *
 *     // Open Activity Monitor on startup (optional)
 *     ActivityMonitorPanel.createOrShow(context.extensionUri);
 * }
 */
