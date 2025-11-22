import * as vscode from 'vscode';

/**
 * Represents a code change that requires approval
 */
export interface CodeChange {
    id: string;
    file: string;
    beforeContent: string;
    afterContent: string;
    description: string;
    timestamp: Date;
}

/**
 * Guardian analysis result
 */
export interface GuardianAnalysis {
    risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidence: number;
    issues: Array<{
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        message: string;
        line?: number;
    }>;
    recommendations: string[];
    summary: string;
}

/**
 * Result of the approval dialog
 */
export enum ApprovalResult {
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    FIX_FIRST = 'FIX_FIRST',
    VIEW_DIFF = 'VIEW_DIFF'
}

/**
 * Manages approval dialogs for code changes
 * Shows rich approval UI with diff viewer and guardian analysis
 */
export class ApprovalDialog {
    constructor(private context: vscode.ExtensionContext) {}

    /**
     * Show approval dialog for a code change
     * @param change The code change to approve
     * @param analysis Guardian analysis of the change
     * @returns The user's decision
     */
    async showApprovalDialog(
        change: CodeChange,
        analysis: GuardianAnalysis
    ): Promise<ApprovalResult> {
        // First, show the diff in the editor
        await this.showDiff(change);

        // Show modal approval dialog
        const riskIcon = this.getRiskIcon(analysis.risk);
        const riskColor = this.getRiskColor(analysis.risk);

        const message = `${riskIcon} AI wants to modify: ${change.file}\n\n` +
            `Risk: ${analysis.risk} (${analysis.confidence}% confidence)\n` +
            `${analysis.summary}\n\n` +
            `${analysis.issues.length > 0 ? 'Issues found:\n' + analysis.issues.map(i => `  • ${i.message}`).join('\n') : ''}`;

        // Show different options based on risk level
        if (analysis.risk === 'CRITICAL' || analysis.risk === 'HIGH') {
            const result = await vscode.window.showErrorMessage(
                message,
                { modal: true },
                'Fix First',
                'Reject',
                'View Diff',
                'Override & Approve'
            );

            switch (result) {
                case 'Override & Approve':
                    // Require confirmation for high-risk approvals
                    const confirm = await vscode.window.showWarningMessage(
                        'Are you sure you want to approve this high-risk change?',
                        { modal: true },
                        'Yes, Approve'
                    );
                    return confirm === 'Yes, Approve' ? ApprovalResult.APPROVED : ApprovalResult.REJECTED;
                case 'Fix First':
                    return ApprovalResult.FIX_FIRST;
                case 'View Diff':
                    return ApprovalResult.VIEW_DIFF;
                default:
                    return ApprovalResult.REJECTED;
            }
        } else if (analysis.risk === 'MEDIUM') {
            const result = await vscode.window.showWarningMessage(
                message,
                { modal: true },
                'Approve',
                'Reject',
                'View Diff',
                'Fix First'
            );

            switch (result) {
                case 'Approve':
                    return ApprovalResult.APPROVED;
                case 'Fix First':
                    return ApprovalResult.FIX_FIRST;
                case 'View Diff':
                    return ApprovalResult.VIEW_DIFF;
                default:
                    return ApprovalResult.REJECTED;
            }
        } else {
            // Low risk - show info message
            const result = await vscode.window.showInformationMessage(
                message,
                { modal: true },
                'Approve',
                'Reject',
                'View Diff'
            );

            switch (result) {
                case 'Approve':
                    return ApprovalResult.APPROVED;
                case 'View Diff':
                    return ApprovalResult.VIEW_DIFF;
                default:
                    return ApprovalResult.REJECTED;
            }
        }
    }

    /**
     * Show a quick approval notification (non-blocking)
     */
    async showQuickApproval(
        change: CodeChange,
        analysis: GuardianAnalysis
    ): Promise<ApprovalResult> {
        const riskIcon = this.getRiskIcon(analysis.risk);
        const message = `${riskIcon} AI modified ${change.file} (Risk: ${analysis.risk})`;

        let result: string | undefined;

        if (analysis.risk === 'CRITICAL' || analysis.risk === 'HIGH') {
            result = await vscode.window.showErrorMessage(
                message,
                'Review',
                'Undo',
                'Ignore'
            );
        } else if (analysis.risk === 'MEDIUM') {
            result = await vscode.window.showWarningMessage(
                message,
                'Review',
                'Undo',
                'Ignore'
            );
        } else {
            result = await vscode.window.showInformationMessage(
                message,
                'Review',
                'Undo'
            );
        }

        switch (result) {
            case 'Review':
                return this.showApprovalDialog(change, analysis);
            case 'Undo':
                return ApprovalResult.REJECTED;
            default:
                return ApprovalResult.APPROVED;
        }
    }

    /**
     * Show diff between before and after content
     */
    private async showDiff(change: CodeChange): Promise<void> {
        // Create temporary files for diff
        const beforeUri = vscode.Uri.parse(`untitled:${change.file}.before`);
        const afterUri = vscode.Uri.parse(`untitled:${change.file}.after`);

        // Write content to virtual documents
        const beforeDoc = await vscode.workspace.openTextDocument(beforeUri);
        const afterDoc = await vscode.workspace.openTextDocument(afterUri);

        const beforeEdit = new vscode.WorkspaceEdit();
        beforeEdit.insert(beforeUri, new vscode.Position(0, 0), change.beforeContent);
        await vscode.workspace.applyEdit(beforeEdit);

        const afterEdit = new vscode.WorkspaceEdit();
        afterEdit.insert(afterUri, new vscode.Position(0, 0), change.afterContent);
        await vscode.workspace.applyEdit(afterEdit);

        // Show diff
        await vscode.commands.executeCommand(
            'vscode.diff',
            beforeUri,
            afterUri,
            `${change.file} - AI Changes (Before ↔ After)`,
            {
                preview: true,
                preserveFocus: false
            }
        );
    }

    /**
     * Show detailed analysis in a webview
     */
    async showDetailedAnalysis(
        change: CodeChange,
        analysis: GuardianAnalysis
    ): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'aiSupervisorAnalysis',
            `Analysis: ${change.file}`,
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );

        panel.webview.html = this.getAnalysisHtml(change, analysis);
    }

    private getAnalysisHtml(change: CodeChange, analysis: GuardianAnalysis): string {
        const riskColor = this.getRiskColor(analysis.risk);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guardian Analysis</title>
    <style>
        body {
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            font-family: var(--vscode-font-family);
        }
        .header {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .risk-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 4px;
            background-color: ${riskColor};
            color: white;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .section {
            margin: 20px 0;
            padding: 15px;
            background-color: var(--vscode-input-background);
            border-radius: 6px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .issue {
            margin: 10px 0;
            padding: 10px;
            border-left: 3px solid ${riskColor};
            background-color: rgba(255, 255, 255, 0.05);
        }
        .issue-severity {
            font-weight: bold;
            margin-right: 10px;
        }
        ul {
            margin: 10px 0;
            padding-left: 25px;
        }
        li {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="header">Guardian Analysis Report</div>
    <div class="risk-badge">${analysis.risk} RISK (${analysis.confidence}% confidence)</div>

    <div class="section">
        <div class="section-title">File</div>
        <div>${change.file}</div>
    </div>

    <div class="section">
        <div class="section-title">Summary</div>
        <div>${analysis.summary}</div>
    </div>

    ${analysis.issues.length > 0 ? `
        <div class="section">
            <div class="section-title">Issues Found (${analysis.issues.length})</div>
            ${analysis.issues.map(issue => `
                <div class="issue">
                    <span class="issue-severity">${issue.severity}:</span>
                    ${issue.message}
                    ${issue.line ? `<div style="font-size: 0.9em; color: #888;">Line ${issue.line}</div>` : ''}
                </div>
            `).join('')}
        </div>
    ` : ''}

    ${analysis.recommendations.length > 0 ? `
        <div class="section">
            <div class="section-title">Recommendations</div>
            <ul>
                ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
    ` : ''}

    <div class="section">
        <div class="section-title">Change Details</div>
        <div>Timestamp: ${change.timestamp.toLocaleString()}</div>
        <div>Description: ${change.description}</div>
    </div>
</body>
</html>`;
    }

    private getRiskIcon(risk: string): string {
        switch (risk) {
            case 'CRITICAL':
                return '🔴';
            case 'HIGH':
                return '🟠';
            case 'MEDIUM':
                return '🟡';
            case 'LOW':
                return '🟢';
            default:
                return '⚪';
        }
    }

    private getRiskColor(risk: string): string {
        switch (risk) {
            case 'CRITICAL':
                return '#dc3545';
            case 'HIGH':
                return '#fd7e14';
            case 'MEDIUM':
                return '#ffc107';
            case 'LOW':
                return '#28a745';
            default:
                return '#6c757d';
        }
    }

    /**
     * Show a blocking save dialog (prevents save until approved)
     */
    async showBlockingSaveDialog(
        document: vscode.TextDocument,
        analysis: GuardianAnalysis
    ): Promise<boolean> {
        const fileName = document.fileName;
        const riskIcon = this.getRiskIcon(analysis.risk);

        const message = `${riskIcon} Cannot save ${fileName}\n\n` +
            `Risk: ${analysis.risk}\n` +
            `${analysis.summary}\n\n` +
            `Please fix the issues before saving.`;

        if (analysis.risk === 'CRITICAL' || analysis.risk === 'HIGH') {
            const result = await vscode.window.showErrorMessage(
                message,
                { modal: true },
                'Fix Issues',
                'View Details',
                'Force Save Anyway'
            );

            if (result === 'Force Save Anyway') {
                const confirm = await vscode.window.showWarningMessage(
                    'Are you absolutely sure? This could introduce security vulnerabilities.',
                    { modal: true },
                    'Yes, Force Save'
                );
                return confirm === 'Yes, Force Save';
            }

            if (result === 'View Details') {
                const change: CodeChange = {
                    id: 'current',
                    file: fileName,
                    beforeContent: '',
                    afterContent: document.getText(),
                    description: 'Current changes',
                    timestamp: new Date()
                };
                await this.showDetailedAnalysis(change, analysis);
            }

            return false;
        } else {
            const result = await vscode.window.showWarningMessage(
                message,
                { modal: true },
                'Fix Issues',
                'Save Anyway'
            );

            return result === 'Save Anyway';
        }
    }
}
