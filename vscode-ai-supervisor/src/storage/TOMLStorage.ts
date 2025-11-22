/**
 * TOML Storage Service - Store goals, analyses, and changes in TOML format
 * More human-readable and maintainable than JSON
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Goal } from '../ai/GuardianAnalyzer';
import { GuardianAnalysisResult } from '../ai/AIProvider';
import { CodeChange } from '../services/ChangeStorageService';

// We'll use a simple TOML encoder/decoder since we can't rely on external packages yet
// This will be enhanced with proper TOML library after package.json update

export interface GoalTOML {
    id: string;
    title: string;
    description: string;
    status: 'active' | 'paused' | 'completed';
    created: string;
    updated: string;
    scope: {
        allowed_paths: string[];
    };
    constraints: string[];
}

export interface AnalysisTOML {
    id: string;
    goal_id: string;
    change_id: string;
    file: string;
    coding_model: string;
    guardian_model: string;
    timestamp: string;
    aligned: boolean;
    confidence: number;
    risk_level: string;
    reasoning: string;
    deviations: Array<{
        type: string;
        severity: string;
        description: string;
        suggestion?: string;
    }>;
}

export class TOMLStorage {
    private static instance: TOMLStorage;
    private storageUri: vscode.Uri;
    private goalsFile: string;
    private analysesFile: string;
    private changesFile: string;

    private constructor(context: vscode.ExtensionContext) {
        this.storageUri = context.globalStorageUri;
        this.ensureStorageDirectory();

        this.goalsFile = path.join(this.storageUri.fsPath, 'goals.toml');
        this.analysesFile = path.join(this.storageUri.fsPath, 'analyses.toml');
        this.changesFile = path.join(this.storageUri.fsPath, 'changes.toml');
    }

    public static getInstance(context?: vscode.ExtensionContext): TOMLStorage {
        if (!TOMLStorage.instance && context) {
            TOMLStorage.instance = new TOMLStorage(context);
        }
        return TOMLStorage.instance;
    }

    private ensureStorageDirectory(): void {
        try {
            if (!fs.existsSync(this.storageUri.fsPath)) {
                fs.mkdirSync(this.storageUri.fsPath, { recursive: true });
            }
        } catch (error) {
            console.error('Failed to create storage directory:', error);
        }
    }

    /**
     * Save goals to TOML
     */
    public async saveGoals(goals: Goal[]): Promise<void> {
        try {
            const toml = this.goalsToTOML(goals);
            fs.writeFileSync(this.goalsFile, toml, 'utf8');
            console.log(`✅ Saved ${goals.length} goals to TOML`);
        } catch (error) {
            console.error('Failed to save goals to TOML:', error);
            throw error;
        }
    }

    /**
     * Load goals from TOML
     */
    public async loadGoals(): Promise<Goal[]> {
        try {
            if (!fs.existsSync(this.goalsFile)) {
                return [];
            }

            const toml = fs.readFileSync(this.goalsFile, 'utf8');
            return this.tomlToGoals(toml);
        } catch (error) {
            console.error('Failed to load goals from TOML:', error);
            return [];
        }
    }

    /**
     * Save analyses to TOML
     */
    public async saveAnalyses(analyses: Map<string, GuardianAnalysisResult>, changeIds: Map<string, string>): Promise<void> {
        try {
            const toml = this.analysesToTOML(analyses, changeIds);
            fs.writeFileSync(this.analysesFile, toml, 'utf8');
            console.log(`✅ Saved ${analyses.size} analyses to TOML`);
        } catch (error) {
            console.error('Failed to save analyses to TOML:', error);
            throw error;
        }
    }

    /**
     * Load analyses from TOML
     */
    public async loadAnalyses(): Promise<AnalysisTOML[]> {
        try {
            if (!fs.existsSync(this.analysesFile)) {
                return [];
            }

            const toml = fs.readFileSync(this.analysesFile, 'utf8');
            return this.tomlToAnalyses(toml);
        } catch (error) {
            console.error('Failed to load analyses from TOML:', error);
            return [];
        }
    }

    /**
     * Save code changes to TOML
     */
    public async saveChanges(changes: CodeChange[]): Promise<void> {
        try {
            const toml = this.changesToTOML(changes);
            fs.writeFileSync(this.changesFile, toml, 'utf8');
            console.log(`✅ Saved ${changes.length} changes to TOML`);
        } catch (error) {
            console.error('Failed to save changes to TOML:', error);
            throw error;
        }
    }

    /**
     * Convert goals to TOML format
     */
    private goalsToTOML(goals: Goal[]): string {
        let toml = '# AI Supervisor - Project Goals\n';
        toml += `# Generated: ${new Date().toISOString()}\n\n`;

        for (const goal of goals) {
            toml += `[[goals]]\n`;
            toml += `id = "${this.escapeString(goal.id)}"\n`;
            toml += `title = "${this.escapeString(goal.title)}"\n`;
            toml += `description = "${this.escapeString(goal.description)}"\n`;
            toml += `status = "${goal.status}"\n`;
            toml += `created = "${new Date().toISOString()}"\n`;
            toml += `updated = "${new Date().toISOString()}"\n\n`;

            toml += `[goals.scope]\n`;
            toml += `allowed_paths = [\n`;
            goal.scope.forEach(s => {
                toml += `  "${this.escapeString(s)}",\n`;
            });
            toml += `]\n\n`;

            toml += `[[goals.constraints]]\n`;
            goal.constraints.forEach(c => {
                toml += `constraint = "${this.escapeString(c)}"\n`;
            });
            toml += `\n`;
        }

        return toml;
    }

    /**
     * Convert analyses to TOML format
     */
    private analysesToTOML(analyses: Map<string, GuardianAnalysisResult>, changeIds: Map<string, string>): string {
        let toml = '# AI Supervisor - Guardian Analyses\n';
        toml += `# Generated: ${new Date().toISOString()}\n\n`;

        let index = 0;
        for (const [id, analysis] of analyses.entries()) {
            const changeId = changeIds.get(id) || 'unknown';

            toml += `[[analyses]]\n`;
            toml += `id = "analysis-${index++}"\n`;
            toml += `goal_id = "goal-unknown"\n`;
            toml += `change_id = "${this.escapeString(changeId)}"\n`;
            toml += `file = "${this.escapeString(id)}"\n`;
            toml += `coding_model = "unknown"\n`;
            toml += `guardian_model = "${this.escapeString(analysis.metadata.guardianModel)}"\n`;
            toml += `timestamp = "${new Date(analysis.metadata.timestamp).toISOString()}"\n`;
            toml += `aligned = ${analysis.aligned}\n`;
            toml += `confidence = ${analysis.confidence.toFixed(2)}\n`;
            toml += `risk_level = "${analysis.riskLevel}"\n`;
            toml += `reasoning = "${this.escapeString(analysis.reasoning)}"\n\n`;

            if (analysis.deviations.length > 0) {
                analysis.deviations.forEach((dev, i) => {
                    toml += `[[analyses.deviations]]\n`;
                    toml += `type = "${dev.type}"\n`;
                    toml += `severity = "${dev.severity}"\n`;
                    toml += `description = "${this.escapeString(dev.description)}"\n`;
                    if (dev.suggestion) {
                        toml += `suggestion = "${this.escapeString(dev.suggestion)}"\n`;
                    }
                    toml += `\n`;
                });
            }

            toml += `\n`;
        }

        return toml;
    }

    /**
     * Convert changes to TOML format
     */
    private changesToTOML(changes: CodeChange[]): string {
        let toml = '# AI Supervisor - Code Changes\n';
        toml += `# Generated: ${new Date().toISOString()}\n\n`;

        for (const change of changes) {
            toml += `[[changes]]\n`;
            toml += `id = "${this.escapeString(change.id)}"\n`;
            toml += `file_path = "${this.escapeString(change.filePath)}"\n`;
            toml += `file_name = "${this.escapeString(change.fileName)}"\n`;
            toml += `timestamp = "${new Date(change.timestamp).toISOString()}"\n`;
            toml += `change_type = "${change.changeType}"\n`;
            toml += `status = "${change.status}"\n`;
            toml += `additions = ${change.additions}\n`;
            toml += `deletions = ${change.deletions}\n`;
            toml += `is_reversal = ${change.flags.isReversal}\n`;
            toml += `is_contradiction = ${change.flags.isContradiction}\n`;

            if (change.metadata.detectedAITool) {
                toml += `detected_ai_tool = "${this.escapeString(change.metadata.detectedAITool)}"\n`;
            }

            toml += `\n`;
        }

        return toml;
    }

    /**
     * Parse TOML to goals (simplified parser)
     */
    private tomlToGoals(toml: string): Goal[] {
        const goals: Goal[] = [];

        // This is a simplified parser - will be replaced with proper TOML library
        const goalBlocks = toml.split('[[goals]]').filter(b => b.trim());

        for (const block of goalBlocks) {
            const goal: any = {
                scope: [],
                constraints: []
            };

            const lines = block.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) {continue;}

                const match = trimmed.match(/^(\w+)\s*=\s*"([^"]*)"/);
                if (match) {
                    const [, key, value] = match;
                    if (key === 'id') {goal.id = value;}
                    else if (key === 'title') {goal.title = value;}
                    else if (key === 'description') {goal.description = value;}
                    else if (key === 'status') {goal.status = value as any;}
                }

                // Parse scope
                if (trimmed.includes('allowed_paths')) {
                    const scopeMatch = block.match(/allowed_paths\s*=\s*\[([\s\S]*?)\]/);
                    if (scopeMatch) {
                        const paths = scopeMatch[1].match(/"([^"]*)"/g);
                        if (paths) {
                            goal.scope = paths.map(p => p.replace(/"/g, ''));
                        }
                    }
                }

                // Parse constraints
                const constraintMatch = trimmed.match(/constraint\s*=\s*"([^"]*)"/);
                if (constraintMatch) {
                    goal.constraints.push(constraintMatch[1]);
                }
            }

            if (goal.id && goal.title) {
                goals.push(goal as Goal);
            }
        }

        return goals;
    }

    /**
     * Parse TOML to analyses (simplified parser)
     */
    private tomlToAnalyses(toml: string): AnalysisTOML[] {
        const analyses: AnalysisTOML[] = [];

        const analysisBlocks = toml.split('[[analyses]]').filter(b => b.trim());

        for (const block of analysisBlocks) {
            const analysis: any = {
                deviations: []
            };

            const lines = block.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) {continue;}

                const stringMatch = trimmed.match(/^(\w+)\s*=\s*"([^"]*)"/);
                const boolMatch = trimmed.match(/^(\w+)\s*=\s*(true|false)/);
                const numberMatch = trimmed.match(/^(\w+)\s*=\s*([0-9.]+)/);

                if (stringMatch) {
                    const [, key, value] = stringMatch;
                    analysis[key] = value;
                } else if (boolMatch) {
                    const [, key, value] = boolMatch;
                    analysis[key] = value === 'true';
                } else if (numberMatch) {
                    const [, key, value] = numberMatch;
                    analysis[key] = parseFloat(value);
                }
            }

            if (analysis.id) {
                analyses.push(analysis);
            }
        }

        return analyses;
    }

    /**
     * Escape special characters in strings for TOML
     */
    private escapeString(str: string): string {
        return str
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    }

    /**
     * Get storage file paths (for debugging)
     */
    public getStoragePaths(): { goals: string; analyses: string; changes: string } {
        return {
            goals: this.goalsFile,
            analyses: this.analysesFile,
            changes: this.changesFile
        };
    }
}
