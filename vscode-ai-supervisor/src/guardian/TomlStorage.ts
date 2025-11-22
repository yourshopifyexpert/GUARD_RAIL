import * as vscode from 'vscode';
import * as path from 'path';
import { GuardianAnalysis } from './GuardianAnalyzer';

/**
 * TOML-compatible analysis record
 */
interface AnalysisRecord {
    timestamp: string;
    file_path: string;
    coding_model: string;
    guardian_model: string;
    aligned: boolean;
    severity: string;
    confidence: number;
    reasoning: string;
    suggestions: string[];
    goal_id?: string;
}

/**
 * TomlStorage - Stores guardian analyses in TOML format
 *
 * Features:
 * - Workspace-specific storage (.ai-supervisor/ directory)
 * - TOML format for human readability
 * - Organized by date
 * - Easy to review and share
 */
export class TomlStorage {
    private storageDir: vscode.Uri | undefined;

    constructor() {
        this.initializeStorage();
    }

    /**
     * Initialize storage directory
     */
    private async initializeStorage(): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri;
        this.storageDir = vscode.Uri.joinPath(workspaceRoot, '.ai-supervisor', 'analyses');

        try {
            await vscode.workspace.fs.createDirectory(this.storageDir);
        } catch (error) {
            // Directory might already exist
        }
    }

    /**
     * Save analysis to TOML file
     */
    async saveAnalysis(analysis: GuardianAnalysis, filePath: string): Promise<void> {
        if (!this.storageDir) {
            await this.initializeStorage();
        }

        if (!this.storageDir) {
            console.error('TomlStorage: No workspace folder available');
            return;
        }

        try {
            const record = this.analysisToRecord(analysis, filePath);
            const tomlContent = this.recordToToml(record);

            // Create filename based on date
            const date = new Date();
            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
            const filename = `${dateStr}.toml`;

            const fileUri = vscode.Uri.joinPath(this.storageDir, filename);

            // Append to existing file or create new
            let existingContent = '';
            try {
                const existing = await vscode.workspace.fs.readFile(fileUri);
                existingContent = Buffer.from(existing).toString('utf8');
            } catch (error) {
                // File doesn't exist yet
            }

            const newContent = existingContent + '\n' + tomlContent + '\n';
            await vscode.workspace.fs.writeFile(fileUri, Buffer.from(newContent, 'utf8'));

            console.log(`TomlStorage: Saved analysis to ${filename}`);

        } catch (error) {
            console.error('TomlStorage: Failed to save analysis:', error);
        }
    }

    /**
     * Convert analysis to record
     */
    private analysisToRecord(analysis: GuardianAnalysis, filePath: string): AnalysisRecord {
        return {
            timestamp: new Date(analysis.timestamp).toISOString(),
            file_path: filePath,
            coding_model: analysis.codingModel,
            guardian_model: analysis.guardianModel,
            aligned: analysis.aligned,
            severity: analysis.severity,
            confidence: analysis.confidence,
            reasoning: analysis.reasoning,
            suggestions: analysis.suggestions,
            goal_id: analysis.goalId
        };
    }

    /**
     * Convert record to TOML format
     */
    private recordToToml(record: AnalysisRecord): string {
        const lines: string[] = [];

        lines.push(`[[analysis]]`);
        lines.push(`timestamp = "${record.timestamp}"`);
        lines.push(`file_path = "${this.escapeToml(record.file_path)}"`);
        lines.push(`coding_model = "${record.coding_model}"`);
        lines.push(`guardian_model = "${record.guardian_model}"`);
        lines.push(`aligned = ${record.aligned}`);
        lines.push(`severity = "${record.severity}"`);
        lines.push(`confidence = ${record.confidence.toFixed(2)}`);
        lines.push(`reasoning = """${this.escapeToml(record.reasoning)}"""`);

        if (record.suggestions.length > 0) {
            lines.push(`suggestions = [`);
            for (const suggestion of record.suggestions) {
                lines.push(`    "${this.escapeToml(suggestion)}",`);
            }
            lines.push(`]`);
        } else {
            lines.push(`suggestions = []`);
        }

        if (record.goal_id) {
            lines.push(`goal_id = "${record.goal_id}"`);
        }

        return lines.join('\n');
    }

    /**
     * Escape special characters for TOML
     */
    private escapeToml(str: string): string {
        return str
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\t/g, '\\t');
    }

    /**
     * Read analyses for date
     */
    async readAnalysesForDate(date: Date): Promise<AnalysisRecord[]> {
        if (!this.storageDir) {
            return [];
        }

        const dateStr = date.toISOString().split('T')[0];
        const filename = `${dateStr}.toml`;
        const fileUri = vscode.Uri.joinPath(this.storageDir, filename);

        try {
            const content = await vscode.workspace.fs.readFile(fileUri);
            const tomlContent = Buffer.from(content).toString('utf8');

            // Simple TOML parsing (in production, use a proper TOML library)
            return this.parseToml(tomlContent);

        } catch (error) {
            // File doesn't exist or couldn't be read
            return [];
        }
    }

    /**
     * Simple TOML parser (basic implementation)
     */
    private parseToml(content: string): AnalysisRecord[] {
        const records: AnalysisRecord[] = [];
        const sections = content.split('[[analysis]]');

        for (const section of sections) {
            if (!section.trim()) continue;

            const record: Partial<AnalysisRecord> = {};

            // Parse key-value pairs
            const lines = section.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;

                const match = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
                if (match) {
                    const [, key, value] = match;
                    const cleanValue = value.replace(/^"|"$/g, '').replace(/"""/g, '');

                    switch (key) {
                        case 'timestamp':
                        case 'file_path':
                        case 'coding_model':
                        case 'guardian_model':
                        case 'severity':
                        case 'reasoning':
                        case 'goal_id':
                            (record as any)[key] = cleanValue;
                            break;
                        case 'aligned':
                            record.aligned = value === 'true';
                            break;
                        case 'confidence':
                            record.confidence = parseFloat(value);
                            break;
                    }
                }
            }

            if (record.timestamp) {
                records.push(record as AnalysisRecord);
            }
        }

        return records;
    }

    /**
     * Get analysis history
     */
    async getAnalysisHistory(days: number = 7): Promise<AnalysisRecord[]> {
        const allRecords: AnalysisRecord[] = [];

        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            const records = await this.readAnalysesForDate(date);
            allRecords.push(...records);
        }

        return allRecords;
    }

    /**
     * Get storage directory
     */
    getStorageDir(): vscode.Uri | undefined {
        return this.storageDir;
    }

    /**
     * Open storage directory
     */
    async openStorageDir(): Promise<void> {
        if (!this.storageDir) {
            vscode.window.showWarningMessage('Storage directory not initialized');
            return;
        }

        await vscode.commands.executeCommand('revealFileInOS', this.storageDir);
    }

    /**
     * Show analysis history
     */
    async showAnalysisHistory(): Promise<void> {
        const records = await this.getAnalysisHistory(7);

        if (records.length === 0) {
            vscode.window.showInformationMessage('No analyses recorded yet');
            return;
        }

        const items = records.map(record => {
            const icon = record.aligned ? '$(check)' : '$(warning)';
            const date = new Date(record.timestamp).toLocaleString();

            return {
                label: `${icon} ${path.basename(record.file_path)}`,
                description: `${record.guardian_model} vs ${record.coding_model}`,
                detail: `[${date}] ${record.reasoning.substring(0, 100)}...`,
                record
            };
        });

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select analysis to view details'
        });

        if (selected) {
            await this.showAnalysisDetails(selected.record);
        }
    }

    /**
     * Show analysis details
     */
    private async showAnalysisDetails(record: AnalysisRecord): Promise<void> {
        const details = `# Analysis Details

**File**: ${record.file_path}
**Timestamp**: ${new Date(record.timestamp).toLocaleString()}
**Coding Model**: ${record.coding_model}
**Guardian Model**: ${record.guardian_model}
**Aligned**: ${record.aligned ? 'Yes' : 'No'}
**Severity**: ${record.severity}
**Confidence**: ${(record.confidence * 100).toFixed(0)}%

## Reasoning
${record.reasoning}

## Suggestions
${record.suggestions.length > 0 ? record.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n') : 'No suggestions'}

${record.goal_id ? `\n**Goal ID**: ${record.goal_id}` : ''}
`;

        const doc = await vscode.workspace.openTextDocument({
            content: details,
            language: 'markdown'
        });

        await vscode.window.showTextDocument(doc, { preview: true });
    }
}
