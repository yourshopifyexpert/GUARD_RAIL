/**
 * Example: How to integrate Guardian Analyzer with the extension
 * This file shows how to use the multi-model AI guardian system
 */

import * as vscode from 'vscode';
import { GuardianAnalyzer, Goal } from './GuardianAnalyzer';
import { ModelSelector } from './ModelSelector';
import { TOMLStorage } from '../storage/TOMLStorage';
import { CodeChange } from '../services/ChangeStorageService';

export class GuardianIntegrationExample {
    private guardianAnalyzer: GuardianAnalyzer;
    private modelSelector: ModelSelector;
    private tomlStorage: TOMLStorage;

    constructor(context: vscode.ExtensionContext) {
        this.guardianAnalyzer = GuardianAnalyzer.getInstance();
        this.modelSelector = ModelSelector.getInstance();
        this.tomlStorage = TOMLStorage.getInstance(context);
    }

    /**
     * Example 1: Analyze a code change when file is saved
     */
    async onFileSaved(change: CodeChange): Promise<void> {
        // Step 1: Get active goals
        const goals = await this.tomlStorage.loadGoals();
        const activeGoals = goals.filter(g => g.status === 'active');

        if (activeGoals.length === 0) {
            console.log('No active goals - skipping guardian analysis');
            return;
        }

        // Step 2: Detect which AI model is being used for coding
        const detectedModel = this.detectCodingModel(change);

        // Step 3: Run guardian analysis for each active goal
        for (const goal of activeGoals) {
            try {
                const result = await this.guardianAnalyzer.analyzeCodeChange({
                    change,
                    goal,
                    detectedCodingModel: detectedModel
                });

                // Step 4: Handle result
                if (!result.aligned) {
                    this.handleDeviation(result, change, goal);
                } else {
                    console.log(`✅ Change aligned with goal: ${goal.title}`);
                }

            } catch (error) {
                console.error(`Guardian analysis failed for goal ${goal.title}:`, error);
            }
        }
    }

    /**
     * Example 2: Test all AI provider connections
     */
    async testProviders(): Promise<void> {
        const results = await this.modelSelector.testAllConnections();

        console.log('\n🔍 Testing AI Provider Connections:\n');

        for (const [provider, isConnected] of Object.entries(results)) {
            const status = isConnected ? '✅' : '❌';
            console.log(`${status} ${provider.toUpperCase()}: ${isConnected ? 'Connected' : 'Failed'}`);
        }

        console.log('\nTip: Configure API keys in VS Code settings (aiSupervisor.guardian.*)\n');
    }

    /**
     * Example 3: Show guardian model pairing
     */
    showModelPairings(): void {
        const codingModels = [
            'claude-3-5-sonnet',
            'gpt-4',
            'gpt-4o',
            'github-copilot',
            'cursor',
            'continue'
        ];

        console.log('\n🛡️ Guardian Model Pairings:\n');

        for (const model of codingModels) {
            const pairing = this.modelSelector.selectGuardianModel(model);
            console.log(`${model.padEnd(20)} → ${pairing.guardianModel}`);
            console.log(`  Reason: ${pairing.reason}\n`);
        }
    }

    /**
     * Example 4: Create a new goal and save to TOML
     */
    async createExampleGoal(): Promise<void> {
        const goal: Goal = {
            id: `goal-${Date.now()}`,
            title: 'Build REST API',
            description: 'Create user authentication endpoints with proper security',
            status: 'active',
            scope: [
                'src/api/**',
                'src/auth/**',
                'src/routes/**'
            ],
            constraints: [
                'No hardcoded secrets or API keys',
                'All endpoints must have authentication',
                'Use prepared statements for database queries',
                'Implement rate limiting',
                'No deletion of existing tests'
            ]
        };

        const goals = await this.tomlStorage.loadGoals();
        goals.push(goal);
        await this.tomlStorage.saveGoals(goals);

        console.log(`✅ Created goal: ${goal.title}`);
        console.log(`📁 Saved to: ${this.tomlStorage.getStoragePaths().goals}`);
    }

    /**
     * Example 5: View TOML storage files
     */
    async viewStorageFiles(): Promise<void> {
        const paths = this.tomlStorage.getStoragePaths();

        console.log('\n📁 TOML Storage Files:\n');
        console.log(`Goals:     ${paths.goals}`);
        console.log(`Analyses:  ${paths.analyses}`);
        console.log(`Changes:   ${paths.changes}\n`);

        // Open goals file in editor
        const goalsUri = vscode.Uri.file(paths.goals);
        await vscode.window.showTextDocument(goalsUri);
    }

    /**
     * Detect which AI model is being used for coding
     */
    private detectCodingModel(change: CodeChange): string {
        // Check metadata first
        if (change.metadata.detectedAITool) {
            return change.metadata.detectedAITool;
        }

        // Check active extensions
        const extensions = vscode.extensions.all;

        if (extensions.some(ext => ext.id === 'github.copilot' && ext.isActive)) {
            return 'github-copilot';
        }

        if (extensions.some(ext => ext.id === 'continue.continue' && ext.isActive)) {
            return 'continue';
        }

        if (extensions.some(ext => ext.id === 'sourcegraph.cody' && ext.isActive)) {
            return 'cody';
        }

        // Default to Claude if unknown
        return 'claude-3-5-sonnet';
    }

    /**
     * Handle deviation detected by guardian
     */
    private handleDeviation(
        result: any,
        change: CodeChange,
        goal: Goal
    ): void {
        const riskEmoji = {
            low: '⚠️',
            medium: '⚠️⚠️',
            high: '🚨'
        };

        const message = `${riskEmoji[result.riskLevel]} Guardian Alert: Code deviation detected!\n\n` +
                       `Goal: ${goal.title}\n` +
                       `File: ${change.fileName}\n` +
                       `Risk: ${result.riskLevel.toUpperCase()}\n` +
                       `Confidence: ${(result.confidence * 100).toFixed(0)}%\n\n` +
                       `${result.deviations.length} issue(s) found:`;

        const items = result.deviations.map((dev: any, i: number) =>
            `${i + 1}. [${dev.severity.toUpperCase()}] ${dev.description}`
        );

        vscode.window.showWarningMessage(message, 'View Details', 'Ignore').then(choice => {
            if (choice === 'View Details') {
                // Show detailed analysis
                this.showDetailedAnalysis(result, change, goal);
            }
        });
    }

    /**
     * Show detailed analysis in webview
     */
    private showDetailedAnalysis(
        result: any,
        change: CodeChange,
        goal: Goal
    ): void {
        const panel = vscode.window.createWebviewPanel(
            'guardianAnalysis',
            'Guardian Analysis',
            vscode.ViewColumn.Two,
            {}
        );

        panel.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: var(--vscode-font-family); padding: 20px; }
                    .header { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
                    .section { margin-bottom: 20px; }
                    .label { font-weight: bold; color: var(--vscode-descriptionForeground); }
                    .deviation {
                        background: var(--vscode-inputValidation-errorBackground);
                        padding: 10px;
                        margin: 10px 0;
                        border-left: 3px solid var(--vscode-errorForeground);
                    }
                    .aligned { color: var(--vscode-testing-iconPassed); }
                    .not-aligned { color: var(--vscode-errorForeground); }
                </style>
            </head>
            <body>
                <div class="header">🛡️ Guardian Analysis Report</div>

                <div class="section">
                    <div class="label">Goal:</div>
                    <div>${goal.title}</div>
                </div>

                <div class="section">
                    <div class="label">File:</div>
                    <div>${change.fileName}</div>
                </div>

                <div class="section">
                    <div class="label">Status:</div>
                    <div class="${result.aligned ? 'aligned' : 'not-aligned'}">
                        ${result.aligned ? '✅ ALIGNED' : '⚠️ DEVIATION DETECTED'}
                    </div>
                </div>

                <div class="section">
                    <div class="label">Risk Level:</div>
                    <div>${result.riskLevel.toUpperCase()}</div>
                </div>

                <div class="section">
                    <div class="label">Confidence:</div>
                    <div>${(result.confidence * 100).toFixed(0)}%</div>
                </div>

                <div class="section">
                    <div class="label">Guardian Model:</div>
                    <div>${result.metadata.guardianModel}</div>
                </div>

                <div class="section">
                    <div class="label">Reasoning:</div>
                    <div>${result.reasoning}</div>
                </div>

                ${result.deviations.length > 0 ? `
                    <div class="section">
                        <div class="label">Deviations (${result.deviations.length}):</div>
                        ${result.deviations.map((dev: any, i: number) => `
                            <div class="deviation">
                                <strong>${i + 1}. [${dev.severity.toUpperCase()}] ${dev.type}</strong><br>
                                ${dev.description}<br>
                                ${dev.suggestion ? `<em>Suggestion: ${dev.suggestion}</em>` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </body>
            </html>
        `;
    }
}

/**
 * USAGE IN EXTENSION.TS:
 *
 * const integration = new GuardianIntegrationExample(context);
 *
 * // Register file watcher
 * vscode.workspace.onDidSaveTextDocument(async (document) => {
 *     const change = createChangeFromDocument(document);
 *     await integration.onFileSaved(change);
 * });
 *
 * // Register commands
 * context.subscriptions.push(
 *     vscode.commands.registerCommand('aiSupervisor.testProviders', () => {
 *         integration.testProviders();
 *     })
 * );
 */
