import * as vscode from 'vscode';

/**
 * Detected model information
 */
export interface DetectedModel {
    modelName: string;
    provider: string;
    confidence: number;
    source: 'extension' | 'heuristic' | 'config';
}

/**
 * ModelDetector - Detects which AI model the user is currently coding with
 *
 * This helps ensure the guardian uses a DIFFERENT model for review
 */
export class ModelDetector {
    private lastDetectedModel: DetectedModel | null = null;
    private detectionCache: Map<string, DetectedModel> = new Map();

    constructor() {}

    /**
     * Detect the current coding model
     */
    async detectModel(): Promise<string> {
        // Try multiple detection methods
        const detection = await this.detectFromExtensions() ||
                         await this.detectFromContext() ||
                         this.detectFromHeuristics();

        if (detection) {
            this.lastDetectedModel = detection;
            return detection.modelName;
        }

        // Default fallback
        return 'unknown-model';
    }

    /**
     * Detect from installed AI extensions
     */
    private async detectFromExtensions(): Promise<DetectedModel | null> {
        // Check GitHub Copilot
        const copilot = vscode.extensions.getExtension('github.copilot');
        if (copilot?.isActive) {
            // Copilot uses various models, but primarily GPT-4
            return {
                modelName: 'gpt-4-copilot',
                provider: 'OpenAI',
                confidence: 0.8,
                source: 'extension'
            };
        }

        // Check Continue
        const continueExt = vscode.extensions.getExtension('continue.continue');
        if (continueExt?.isActive) {
            // Continue can use various models - check config
            const model = await this.detectContinueModel();
            if (model) {
                return model;
            }
        }

        // Check Cody
        const cody = vscode.extensions.getExtension('sourcegraph.cody-ai');
        if (cody?.isActive) {
            return {
                modelName: 'claude-3-sonnet',
                provider: 'Anthropic',
                confidence: 0.7,
                source: 'extension'
            };
        }

        // Check Cursor (if running in Cursor)
        if (this.isCursor()) {
            return {
                modelName: 'gpt-4-cursor',
                provider: 'OpenAI',
                confidence: 0.9,
                source: 'extension'
            };
        }

        return null;
    }

    /**
     * Detect Continue model from config
     */
    private async detectContinueModel(): Promise<DetectedModel | null> {
        try {
            const config = vscode.workspace.getConfiguration('continue');
            const modelConfig = config.get<any>('model');

            if (modelConfig) {
                const modelName = modelConfig.name || modelConfig.model;
                const provider = modelConfig.provider;

                if (modelName) {
                    return {
                        modelName,
                        provider: provider || 'Unknown',
                        confidence: 0.9,
                        source: 'config'
                    };
                }
            }
        } catch (error) {
            // Config not available
        }

        return null;
    }

    /**
     * Check if running in Cursor
     */
    private isCursor(): boolean {
        const userAgent = (global as any).navigator?.userAgent || '';
        return userAgent.includes('Cursor') ||
               vscode.env.appName.toLowerCase().includes('cursor');
    }

    /**
     * Detect from VS Code context
     */
    private async detectFromContext(): Promise<DetectedModel | null> {
        // Check for recent AI completions in editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return null;
        }

        // Check for inline completion provider
        // This is a heuristic - we can't directly access which provider is active

        return null;
    }

    /**
     * Detect from heuristics
     */
    private detectFromHeuristics(): DetectedModel {
        // Check which AI extensions are installed
        const installedAI = this.getInstalledAIExtensions();

        if (installedAI.includes('github.copilot')) {
            return {
                modelName: 'gpt-4-copilot',
                provider: 'OpenAI',
                confidence: 0.5,
                source: 'heuristic'
            };
        }

        if (installedAI.includes('continue.continue')) {
            return {
                modelName: 'gpt-4',
                provider: 'OpenAI',
                confidence: 0.4,
                source: 'heuristic'
            };
        }

        if (installedAI.includes('sourcegraph.cody-ai')) {
            return {
                modelName: 'claude-3-sonnet',
                provider: 'Anthropic',
                confidence: 0.5,
                source: 'heuristic'
            };
        }

        // Default to GPT-4 as it's most common
        return {
            modelName: 'gpt-4',
            provider: 'OpenAI',
            confidence: 0.3,
            source: 'heuristic'
        };
    }

    /**
     * Get installed AI extensions
     */
    private getInstalledAIExtensions(): string[] {
        const aiExtensions = [
            'github.copilot',
            'github.copilot-chat',
            'continue.continue',
            'sourcegraph.cody-ai',
            'tabnine.tabnine-vscode',
            'anthropic.claude-vscode'
        ];

        return aiExtensions.filter(ext =>
            vscode.extensions.getExtension(ext) !== undefined
        );
    }

    /**
     * Get last detected model
     */
    getLastDetected(): DetectedModel | null {
        return this.lastDetectedModel;
    }

    /**
     * Get detection summary
     */
    getDetectionSummary(): string {
        if (!this.lastDetectedModel) {
            return 'No model detected yet';
        }

        const { modelName, provider, confidence, source } = this.lastDetectedModel;
        const confidencePercent = Math.round(confidence * 100);

        return `Detected: ${modelName} (${provider}) - ${confidencePercent}% confidence (${source})`;
    }

    /**
     * Force set model (for testing or manual override)
     */
    setModel(modelName: string, provider: string): void {
        this.lastDetectedModel = {
            modelName,
            provider,
            confidence: 1.0,
            source: 'config'
        };
    }
}
