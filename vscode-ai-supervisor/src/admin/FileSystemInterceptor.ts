import * as vscode from 'vscode';
import { GuardianIntegration } from '../guardian/GuardianIntegration';

export interface SaveBlockResult {
    allowed: boolean;
    reason?: string;
    action?: 'block' | 'rollback' | 'fix';
}

/**
 * Intercepts file save operations to enforce guardian rules
 * Uses vscode.workspace.onWillSaveTextDocument to BLOCK saves before they happen
 */
export class FileSystemInterceptor {
    private disposables: vscode.Disposable[] = [];
    private guardian: GuardianIntegration | undefined;
    private isEnabled: boolean = true;

    constructor(
        private context: vscode.ExtensionContext,
        guardian?: GuardianIntegration
    ) {
        this.guardian = guardian;
        this.registerSaveInterceptor();
    }

    /**
     * Register the REAL save interceptor using onWillSaveTextDocument
     * This is the critical hook that can PREVENT saves from happening
     */
    private registerSaveInterceptor(): void {
        const saveInterceptor = vscode.workspace.onWillSaveTextDocument(
            async (event: vscode.TextDocumentWillSaveEvent) => {
                if (!this.isEnabled) {
                    return;
                }

                // Only intercept manual saves, not auto-saves unless configured
                const config = vscode.workspace.getConfiguration('aiSupervisor.admin');
                const interceptAutoSave = config.get<boolean>('interceptAutoSave', false);

                if (event.reason === vscode.TextDocumentSaveReason.AfterDelay && !interceptAutoSave) {
                    return;
                }

                // Use waitUntil to potentially BLOCK the save
                event.waitUntil(this.checkSavePermission(event.document));
            }
        );

        this.disposables.push(saveInterceptor);
    }

    /**
     * Check if the save should be allowed - returns Promise that resolves or rejects
     * If rejected, the save is BLOCKED
     */
    private async checkSavePermission(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
        try {
            const config = vscode.workspace.getConfiguration('aiSupervisor.admin');
            const editMode = config.get<string>('editMode', 'approval');

            if (editMode === 'permissive') {
                return []; // Allow all saves
            }

            // Get the document content
            const content = document.getText();
            const filePath = document.uri.fsPath;

            // Quick guardian analysis (with timeout)
            const result = await this.performQuickAnalysis(document, content);

            // Determine if we should block based on severity
            const blockSeverity = config.get<string>('blockSeverity', 'high');
            const shouldBlock = this.shouldBlockSave(result.severity, blockSeverity);

            if (shouldBlock) {
                // Show blocking modal dialog
                const action = await this.showBlockDialog(result, filePath);

                if (action === 'Allow Anyway') {
                    console.log(`[FileSystemInterceptor] User overrode block for ${filePath}`);
                    return [];
                } else if (action === 'Rollback') {
                    // Revert the document
                    await this.rollbackDocument(document);
                    throw new Error('Save cancelled - Document rolled back');
                } else {
                    // Block the save
                    throw new Error(`Save blocked: ${result.reasoning}`);
                }
            } else if (result.severity === 'medium' || result.severity === 'high') {
                // Require approval for medium/high severity
                const requireApproval = config.get<string[]>('requireApproval', ['critical', 'high']);

                if (requireApproval.includes(result.severity)) {
                    const approved = await this.requestApproval(result, filePath);

                    if (!approved) {
                        throw new Error(`Save cancelled: Approval denied`);
                    }
                }
            }

            return []; // Allow save
        } catch (error) {
            // If we throw an error, the save is BLOCKED
            console.error('[FileSystemInterceptor] Save blocked:', error);
            throw error;
        }
    }

    /**
     * Perform quick guardian analysis with timeout
     */
    private async performQuickAnalysis(
        document: vscode.TextDocument,
        content: string
    ): Promise<{
        severity: 'low' | 'medium' | 'high' | 'critical';
        reasoning: string;
        confidence: number;
    }> {
        // Try guardian analysis with 2 second timeout
        const timeout = 2000;

        try {
            const analysisPromise = this.guardian?.quickAnalyze(document);

            if (!analysisPromise) {
                // No guardian available, use heuristics
                return this.heuristicAnalysis(content);
            }

            const result = await Promise.race([
                analysisPromise,
                new Promise<null>((_, reject) =>
                    setTimeout(() => reject(new Error('Analysis timeout')), timeout)
                )
            ]);

            if (result) {
                return {
                    severity: (result as any).severity || 'low',
                    reasoning: (result as any).reasoning || 'Potential issue detected',
                    confidence: (result as any).confidence || 70
                };
            }
        } catch (error) {
            console.error('[FileSystemInterceptor] Analysis error:', error);
        }

        // Fallback to heuristic analysis
        return this.heuristicAnalysis(content);
    }

    /**
     * Quick heuristic analysis when guardian is unavailable
     */
    private heuristicAnalysis(content: string): {
        severity: 'low' | 'medium' | 'high' | 'critical';
        reasoning: string;
        confidence: number;
    } {
        // Check for dangerous patterns
        const dangerousPatterns = [
            { regex: /eval\s*\(/gi, severity: 'critical' as const, message: 'Use of eval() detected' },
            { regex: /exec\s*\(/gi, severity: 'critical' as const, message: 'Arbitrary code execution detected' },
            { regex: /dangerouslySetInnerHTML/gi, severity: 'high' as const, message: 'XSS vulnerability risk' },
            { regex: /SELECT\s+\*\s+FROM.*\+/gi, severity: 'critical' as const, message: 'SQL injection risk' },
            { regex: /process\.env\.\w+/gi, severity: 'medium' as const, message: 'Environment variable access' },
            { regex: /fs\.(unlink|rm|rmdir)/gi, severity: 'high' as const, message: 'File deletion operations' },
        ];

        for (const pattern of dangerousPatterns) {
            if (pattern.regex.test(content)) {
                return {
                    severity: pattern.severity,
                    reasoning: pattern.message,
                    confidence: 85
                };
            }
        }

        return {
            severity: 'low',
            reasoning: 'No issues detected',
            confidence: 60
        };
    }

    /**
     * Determine if save should be blocked based on severity threshold
     */
    private shouldBlockSave(
        severity: 'low' | 'medium' | 'high' | 'critical',
        threshold: string
    ): boolean {
        const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
        const severityValue = severityLevels[severity] || 0;
        const thresholdValue = severityLevels[threshold as keyof typeof severityLevels] || 3;

        return severityValue >= thresholdValue;
    }

    /**
     * Show BLOCKING modal dialog - execution waits for user response
     */
    private async showBlockDialog(
        result: { severity: string; reasoning: string; confidence: number },
        filePath: string
    ): Promise<string | undefined> {
        const fileName = filePath.split('/').pop() || filePath;

        const message = `🚫 SAVE BLOCKED - ${result.severity.toUpperCase()} Risk Detected

File: ${fileName}
Issue: ${result.reasoning}
Confidence: ${result.confidence}%

This save operation has been prevented by AI Supervisor.
What would you like to do?`;

        // Modal dialog BLOCKS until user responds
        const action = await vscode.window.showErrorMessage(
            message,
            { modal: true }, // This makes it BLOCKING
            'Fix First',
            'Allow Anyway',
            'Rollback'
        );

        return action;
    }

    /**
     * Request approval for medium-severity changes
     */
    private async requestApproval(
        result: { severity: string; reasoning: string; confidence: number },
        filePath: string
    ): Promise<boolean> {
        const fileName = filePath.split('/').pop() || filePath;

        const message = `⚠️ Approval Required - ${result.severity.toUpperCase()} Risk

File: ${fileName}
Issue: ${result.reasoning}
Confidence: ${result.confidence}%

Allow this save?`;

        const action = await vscode.window.showWarningMessage(
            message,
            { modal: true },
            'Allow',
            'Block'
        );

        return action === 'Allow';
    }

    /**
     * Rollback document to last saved state
     */
    private async rollbackDocument(document: vscode.TextDocument): Promise<void> {
        const edit = new vscode.WorkspaceEdit();

        // Get full document range
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
        );

        // Read original file content
        try {
            const fileUri = document.uri;
            const fileContent = await vscode.workspace.fs.readFile(fileUri);
            const originalText = Buffer.from(fileContent).toString('utf8');

            // Replace with original content
            edit.replace(fileUri, fullRange, originalText);
            await vscode.workspace.applyEdit(edit);

            vscode.window.showInformationMessage('✅ Document rolled back to last saved state');
        } catch (error) {
            console.error('[FileSystemInterceptor] Rollback failed:', error);
            vscode.window.showErrorMessage('Failed to rollback document');
        }
    }

    /**
     * Enable/disable the interceptor
     */
    public setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;

        if (enabled) {
            vscode.window.showInformationMessage('🛡️ File save protection ENABLED');
        } else {
            vscode.window.showWarningMessage('⚠️ File save protection DISABLED');
        }
    }

    /**
     * Check if interceptor is enabled
     */
    public getEnabled(): boolean {
        return this.isEnabled;
    }

    /**
     * Dispose of all resources
     */
    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
