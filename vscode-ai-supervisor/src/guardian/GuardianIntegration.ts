import * as vscode from 'vscode';
import { FileChangeEvent } from '../integration/FileWatcher';
import { GuardianAnalyzer, CodeChange, ProjectGoal } from './GuardianAnalyzer';
import { ModelDetector } from './ModelDetector';
import { CostTracker } from './CostTracker';
import { TomlStorage } from './TomlStorage';
import { AlertManager } from '../notifications/AlertManager';

/**
 * GuardianIntegration - Integrates multi-model guardian system with FileWatcher
 *
 * This is the main integration point that connects:
 * - FileWatcher (detects changes)
 * - ModelDetector (identifies coding model)
 * - GuardianAnalyzer (analyzes with different model)
 * - AlertManager (shows smart alerts)
 * - CostTracker (tracks API costs)
 * - TomlStorage (stores analyses)
 */
export class GuardianIntegration {
    private guardianAnalyzer: GuardianAnalyzer;
    private modelDetector: ModelDetector;
    private costTracker: CostTracker;
    private tomlStorage: TomlStorage;
    private alertManager: AlertManager | undefined;

    constructor(
        private context: vscode.ExtensionContext,
        alertManager?: AlertManager
    ) {
        this.guardianAnalyzer = new GuardianAnalyzer(context);
        this.modelDetector = new ModelDetector();
        this.costTracker = new CostTracker(context);
        this.tomlStorage = new TomlStorage();
        this.alertManager = alertManager;
    }

    /**
     * Handle file change with guardian analysis
     */
    async handleFileChange(
        changeEvent: FileChangeEvent,
        activeGoals: ProjectGoal[]
    ): Promise<void> {
        // Check if guardian analysis is enabled
        const settings = this.guardianAnalyzer.getSettings();
        if (!settings.isAnalysisEnabled()) {
            return;
        }

        // Only analyze AI-generated changes
        if (!changeEvent.aiLikelihood.isLikelyAI) {
            return;
        }

        // Need at least one goal to analyze against
        if (activeGoals.length === 0) {
            return;
        }

        try {
            // Detect which model is being used for coding
            const codingModel = await this.modelDetector.detectModel();

            console.log(`GuardianIntegration: Detected coding model: ${codingModel}`);

            // Prepare code change
            const change: CodeChange = {
                filePath: changeEvent.uri.fsPath,
                beforeContent: changeEvent.beforeContent || '',
                afterContent: changeEvent.afterContent || '',
                diff: changeEvent.diff || '',
                type: changeEvent.type
            };

            // Analyze against the first active goal
            const goal = activeGoals[0];

            const analysis = await this.guardianAnalyzer.analyzeCodeChange(
                change,
                goal,
                codingModel
            );

            console.log(`GuardianIntegration: Analysis complete - aligned: ${analysis.aligned}, confidence: ${analysis.confidence}`);

            // Record cost (estimate ~1000 tokens per analysis)
            const estimatedTokens = this.estimateTokensUsed(change, goal);
            await this.costTracker.recordUsage(
                analysis.guardianModel,
                this.getProviderFromModel(analysis.guardianModel),
                estimatedTokens,
                'analysis'
            );

            // Save analysis to TOML
            await this.tomlStorage.saveAnalysis(analysis, change.filePath);

            // Show alert if not aligned
            if (!analysis.aligned && this.alertManager) {
                await this.showSmartAlert(analysis);
            }

        } catch (error) {
            console.error('GuardianIntegration: Failed to analyze change:', error);

            // Show error notification (but don't block)
            if (this.alertManager) {
                vscode.window.showWarningMessage(
                    `AI Guardian: Analysis failed - ${error}`
                );
            }
        }
    }

    /**
     * Show smart alert with AI reasoning
     */
    private async showSmartAlert(analysis: any): Promise<void> {
        if (!this.alertManager) return;

        const title = `${analysis.guardianModel} detected deviation`;
        const message = `${title}\n\n${analysis.reasoning}`;

        // Determine alert severity
        let alertSeverity: 'info' | 'warning' | 'error' = 'info';
        if (analysis.severity === 'error') {
            alertSeverity = 'error';
        } else if (analysis.severity === 'warning') {
            alertSeverity = 'warning';
        }

        // Show using AlertManager's showAlert method
        await this.alertManager.showAlert({
            id: `guardian-${Date.now()}`,
            type: 'goal-deviation' as any,
            message: analysis.reasoning,
            severity: alertSeverity as any,
            timestamp: Date.now(),
            source: 'guardian',
            actionable: true,
            metadata: {
                codingModel: analysis.codingModel,
                guardianModel: analysis.guardianModel,
                suggestions: analysis.suggestions,
                confidence: analysis.confidence
            }
        });
    }

    /**
     * Estimate tokens used in analysis
     */
    private estimateTokensUsed(change: CodeChange, goal: ProjectGoal): number {
        // Rough estimate: prompt + response
        const promptTokens = Math.ceil(
            (change.diff.length + goal.description.length + 500) / 4
        );
        const responseTokens = 200; // Typical response size

        return promptTokens + responseTokens;
    }

    /**
     * Get provider from model name
     */
    private getProviderFromModel(model: string): string {
        const normalized = model.toLowerCase();

        if (normalized.includes('gpt')) {
            return 'OpenAI';
        } else if (normalized.includes('claude')) {
            return 'Anthropic';
        } else if (normalized.includes('gemini')) {
            return 'Google';
        } else if (normalized.includes('llama') || normalized.includes('mistral')) {
            return 'Ollama';
        }

        return 'Unknown';
    }

    /**
     * Get model detector
     */
    getModelDetector(): ModelDetector {
        return this.modelDetector;
    }

    /**
     * Get cost tracker
     */
    getCostTracker(): CostTracker {
        return this.costTracker;
    }

    /**
     * Get TOML storage
     */
    getTomlStorage(): TomlStorage {
        return this.tomlStorage;
    }

    /**
     * Get guardian analyzer
     */
    getGuardianAnalyzer(): GuardianAnalyzer {
        return this.guardianAnalyzer;
    }

    /**
     * Quick analysis for file save interception (< 500ms target)
     * Returns simplified security assessment
     */
    async quickAnalyze(document: vscode.TextDocument): Promise<{
        severity: 'low' | 'medium' | 'high' | 'critical';
        reasoning: string;
        confidence: number;
    }> {
        // For quick analysis, use heuristics instead of full LLM call
        const content = document.getText();

        // Check for dangerous patterns
        const patterns = [
            { regex: /eval\s*\(/gi, severity: 'critical' as const, msg: 'Use of eval()' },
            { regex: /exec\s*\(/gi, severity: 'critical' as const, msg: 'Code execution detected' },
            { regex: /dangerouslySetInnerHTML/gi, severity: 'high' as const, msg: 'XSS risk' },
            { regex: /process\.env\./gi, severity: 'medium' as const, msg: 'Environment variable access' },
        ];

        for (const pattern of patterns) {
            if (pattern.regex.test(content)) {
                return {
                    severity: pattern.severity,
                    reasoning: pattern.msg,
                    confidence: 85
                };
            }
        }

        return {
            severity: 'low',
            reasoning: 'No obvious security issues detected',
            confidence: 70
        };
    }
}
