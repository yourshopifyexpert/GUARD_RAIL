import * as vscode from 'vscode';
import { ApprovalDialog, CodeChange, GuardianAnalysis, ApprovalResult } from './ApprovalDialog';
import { StatusBarManager } from './StatusBarManager';

/**
 * Demo mode to showcase AI Supervisor features
 * Simulates various scenarios to demonstrate the admin control capabilities
 */
export class DemoMode {
    private approvalDialog: ApprovalDialog;
    private statusBarManager: StatusBarManager | undefined;
    private outputChannel: vscode.OutputChannel;

    constructor(
        private context: vscode.ExtensionContext,
        statusBarManager?: StatusBarManager
    ) {
        this.approvalDialog = new ApprovalDialog(context);
        this.statusBarManager = statusBarManager;
        this.outputChannel = vscode.window.createOutputChannel('AI Supervisor Demo');
    }

    /**
     * Run the complete demo
     */
    async runDemo(): Promise<void> {
        this.outputChannel.show();
        this.log('🎬 Starting AI Supervisor Demo...\n');

        try {
            // 1. Show normal operation
            await this.log('1️⃣ Demonstrating normal operation...');
            await this.simulateNormalEdit();
            await this.wait(2000);

            // 2. Trigger block
            await this.log('\n2️⃣ Demonstrating security block...');
            await this.simulateBlockedSave();
            await this.wait(2000);

            // 3. Show approval flow
            await this.log('\n3️⃣ Demonstrating approval flow...');
            await this.simulateApproval();
            await this.wait(2000);

            // 4. Demonstrate lock
            await this.log('\n4️⃣ Demonstrating file locking...');
            await this.simulateLockedFile();
            await this.wait(2000);

            // 5. Emergency stop
            await this.log('\n5️⃣ Demonstrating emergency stop...');
            await this.simulateEmergencyStop();
            await this.wait(2000);

            // 6. Guardian analysis
            await this.log('\n6️⃣ Demonstrating Guardian AI analysis...');
            await this.simulateGuardianAnalysis();

            this.log('\n✅ Demo complete!');
            vscode.window.showInformationMessage('AI Supervisor demo completed!');
        } catch (error) {
            this.log(`\n❌ Demo error: ${error}`);
            vscode.window.showErrorMessage(`Demo failed: ${error}`);
        }
    }

    /**
     * Simulate normal edit operation
     */
    async simulateNormalEdit(): Promise<void> {
        this.log('  Creating a safe code change...');

        const doc = await vscode.workspace.openTextDocument({
            content: `function greet(name) {\n  return "Hello, " + name + "!";\n}`,
            language: 'javascript'
        });

        await vscode.window.showTextDocument(doc);

        this.log('  ✓ Safe change allowed');
        this.statusBarManager?.showTemporaryMessage('Safe edit approved', 'info', 3000);

        // Close the document
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    }

    /**
     * Simulate a blocked save due to security issues
     */
    async simulateBlockedSave(): Promise<void> {
        this.log('  Attempting to save file with SQL injection...');

        const analysis: GuardianAnalysis = {
            risk: 'CRITICAL',
            confidence: 98,
            issues: [
                {
                    severity: 'CRITICAL',
                    message: 'SQL Injection vulnerability detected',
                    line: 2
                },
                {
                    severity: 'HIGH',
                    message: 'Unsanitized user input used in query',
                    line: 2
                }
            ],
            recommendations: [
                'Use parameterized queries instead of string concatenation',
                'Validate and sanitize all user inputs',
                'Consider using an ORM for database operations'
            ],
            summary: 'Dangerous SQL query construction detected. User input is directly concatenated into SQL query, allowing SQL injection attacks.'
        };

        const doc = await vscode.workspace.openTextDocument({
            content: `async function getUser(userId) {\n  const query = "SELECT * FROM users WHERE id=" + userId;\n  return await db.execute(query);\n}`,
            language: 'javascript'
        });

        await vscode.window.showTextDocument(doc);

        this.log('  🚫 BLOCKED: SQL Injection detected');
        this.statusBarManager?.incrementBlockCount();
        this.statusBarManager?.showCriticalAlert('SQL Injection blocked!');

        // Show blocking dialog
        await vscode.window.showErrorMessage(
            '🔴 Cannot save: SQL Injection vulnerability detected\n\nLine 2: User input concatenated directly into SQL query',
            { modal: true },
            'Fix First'
        );

        this.log('  ✓ User prevented from saving dangerous code');

        // Close the document
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    }

    /**
     * Simulate approval workflow
     */
    async simulateApproval(): Promise<void> {
        this.log('  Creating a medium-risk change requiring approval...');

        const change: CodeChange = {
            id: 'demo-change-1',
            file: 'src/api/users.ts',
            beforeContent: `export async function updateUser(id, data) {\n  return db.update('users', id, data);\n}`,
            afterContent: `export async function updateUser(id, data) {\n  // Added admin permission check\n  if (data.role === 'admin' && !currentUser.isAdmin) {\n    throw new Error('Unauthorized');\n  }\n  return db.update('users', id, data);\n}`,
            description: 'Added admin permission check',
            timestamp: new Date()
        };

        const analysis: GuardianAnalysis = {
            risk: 'MEDIUM',
            confidence: 85,
            issues: [
                {
                    severity: 'MEDIUM',
                    message: 'Permission check added but may need additional validation',
                    line: 3
                }
            ],
            recommendations: [
                'Consider adding logging for failed permission checks',
                'Verify currentUser context is always available',
                'Add unit tests for permission scenarios'
            ],
            summary: 'Added security check for admin role assignment. Generally good practice, but needs thorough testing.'
        };

        this.log('  ⏳ Requesting approval from user...');

        // Show approval dialog (non-blocking for demo)
        vscode.window.showInformationMessage(
            '🟡 AI wants to modify: src/api/users.ts\n\nRisk: MEDIUM (85% confidence)\nAdded security check for admin role assignment.',
            'Approve (Demo)',
            'View Details'
        ).then(async (result) => {
            if (result === 'View Details') {
                await this.approvalDialog.showDetailedAnalysis(change, analysis);
            }
        });

        this.log('  ✓ Approval dialog shown');
    }

    /**
     * Simulate locked file protection
     */
    async simulateLockedFile(): Promise<void> {
        this.log('  Locking critical file: package.json...');

        // Add package.json to locked files
        const config = vscode.workspace.getConfiguration('aiSupervisor');
        const lockedFiles = config.get<Array<{ path: string; reason: string }>>('admin.lockedFiles', []);

        if (!lockedFiles.some(f => f.path === 'package.json')) {
            lockedFiles.push({
                path: 'package.json',
                reason: 'Critical system file - locked for demo'
            });
            await config.update('admin.lockedFiles', lockedFiles, vscode.ConfigurationTarget.Workspace);
        }

        this.log('  🔒 package.json is now locked');

        // Try to open and show lock message
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
            this.log('  Attempting to modify locked file...');

            await vscode.window.showWarningMessage(
                '🔒 File Locked: package.json\n\nReason: Critical system file - locked for demo\n\nThis file cannot be modified by AI.',
                { modal: true },
                'OK'
            );

            this.log('  ✓ Modification blocked - file is locked');
        }
    }

    /**
     * Simulate emergency stop
     */
    async simulateEmergencyStop(): Promise<void> {
        this.log('  Simulating dangerous AI behavior...');
        this.log('  AI is making multiple unauthorized changes...');

        // Show emergency situation
        await this.wait(1000);

        this.log('  🛑 EMERGENCY STOP ACTIVATED!');

        // Update status bar
        this.statusBarManager?.updateAIStatus(false);
        this.statusBarManager?.updateEditMode('locked');

        // Show emergency stop dialog
        await vscode.window.showErrorMessage(
            '🛑 EMERGENCY STOP ACTIVATED\n\nAll AI operations have been halted.\nEdit mode set to LOCKED.\nNo further changes can be made.',
            { modal: true },
            'Understood'
        );

        this.log('  ✓ All AI operations halted');
        this.log('  ✓ System locked down');

        // Reset for demo
        await this.wait(1000);
        this.statusBarManager?.updateAIStatus(true);
        this.statusBarManager?.updateEditMode('approval');
        this.log('  (System restored for demo continuation)');
    }

    /**
     * Simulate guardian AI analysis
     */
    async simulateGuardianAnalysis(): Promise<void> {
        this.log('  Running Guardian AI analysis...');

        const change: CodeChange = {
            id: 'demo-change-2',
            file: 'src/utils/crypto.ts',
            beforeContent: `export function hashPassword(password) {\n  return md5(password);\n}`,
            afterContent: `export function hashPassword(password) {\n  return bcrypt.hash(password, 10);\n}`,
            description: 'Upgraded password hashing from MD5 to bcrypt',
            timestamp: new Date()
        };

        const analysis: GuardianAnalysis = {
            risk: 'LOW',
            confidence: 96,
            issues: [],
            recommendations: [
                'Excellent security improvement!',
                'Consider migrating existing MD5 hashes in database',
                'Add salt rounds configuration to environment variables'
            ],
            summary: 'Great security improvement! Changed from insecure MD5 to bcrypt for password hashing. This is a best practice for password storage.'
        };

        this.log('  🛡️ Guardian Analysis Complete:');
        this.log(`     Risk Level: ${analysis.risk}`);
        this.log(`     Confidence: ${analysis.confidence}%`);
        this.log(`     Summary: ${analysis.summary}`);

        // Show analysis
        vscode.window.showInformationMessage(
            '🛡️ Guardian AI Analysis: LOW RISK\n\nSecurity improvement detected! Upgraded from MD5 to bcrypt.',
            'View Details'
        ).then(async (result) => {
            if (result === 'View Details') {
                await this.approvalDialog.showDetailedAnalysis(change, analysis);
            }
        });

        this.log('  ✓ Analysis complete - change approved');
    }

    /**
     * Run a quick demo (shorter version)
     */
    async runQuickDemo(): Promise<void> {
        this.outputChannel.show();
        this.log('⚡ Starting Quick Demo...\n');

        await this.simulateBlockedSave();
        await this.wait(2000);

        await this.log('\n✅ Quick demo complete!');
        vscode.window.showInformationMessage('AI Supervisor quick demo completed!');
    }

    /**
     * Run individual demo scenarios
     */
    async runScenario(scenario: 'block' | 'approval' | 'lock' | 'emergency' | 'guardian'): Promise<void> {
        this.outputChannel.show();

        switch (scenario) {
            case 'block':
                await this.simulateBlockedSave();
                break;
            case 'approval':
                await this.simulateApproval();
                break;
            case 'lock':
                await this.simulateLockedFile();
                break;
            case 'emergency':
                await this.simulateEmergencyStop();
                break;
            case 'guardian':
                await this.simulateGuardianAnalysis();
                break;
        }
    }

    /**
     * Log message to output channel
     */
    private log(message: string): void {
        this.outputChannel.appendLine(message);
    }

    /**
     * Wait for specified milliseconds
     */
    private wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        this.outputChannel.dispose();
    }
}
