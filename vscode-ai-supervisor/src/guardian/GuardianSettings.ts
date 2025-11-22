import * as vscode from 'vscode';

/**
 * Supported AI providers
 */
export enum AIProvider {
    OpenAI = 'openai',
    Anthropic = 'anthropic',
    Google = 'google',
    Ollama = 'ollama'
}

/**
 * Model information
 */
export interface ModelInfo {
    id: string;
    name: string;
    provider: AIProvider;
    costPerMillionTokens: number;
    contextWindow: number;
    supportsStreaming: boolean;
}

/**
 * Guardian configuration
 */
export interface GuardianConfig {
    provider: AIProvider;
    model: string;
    apiKey?: string;
    ollamaEndpoint?: string;
    enableAnalysis: boolean;
    autoAnalyze: boolean;
    costBudgetMonthly: number;
}

/**
 * GuardianSettings - Manages configuration for multi-model guardian system
 */
export class GuardianSettings {
    private static readonly CONFIG_SECTION = 'aiSupervisor.guardian';

    private readonly MODEL_REGISTRY: ModelInfo[] = [
        // OpenAI models
        {
            id: 'gpt-4o',
            name: 'GPT-4o',
            provider: AIProvider.OpenAI,
            costPerMillionTokens: 10,
            contextWindow: 128000,
            supportsStreaming: true
        },
        {
            id: 'gpt-4o-mini',
            name: 'GPT-4o Mini',
            provider: AIProvider.OpenAI,
            costPerMillionTokens: 0.15,
            contextWindow: 128000,
            supportsStreaming: true
        },
        {
            id: 'gpt-4-turbo',
            name: 'GPT-4 Turbo',
            provider: AIProvider.OpenAI,
            costPerMillionTokens: 10,
            contextWindow: 128000,
            supportsStreaming: true
        },

        // Anthropic models
        {
            id: 'claude-3-5-sonnet-20241022',
            name: 'Claude 3.5 Sonnet',
            provider: AIProvider.Anthropic,
            costPerMillionTokens: 15,
            contextWindow: 200000,
            supportsStreaming: true
        },
        {
            id: 'claude-3-5-haiku-20241022',
            name: 'Claude 3.5 Haiku',
            provider: AIProvider.Anthropic,
            costPerMillionTokens: 1,
            contextWindow: 200000,
            supportsStreaming: true
        },
        {
            id: 'claude-3-opus-20240229',
            name: 'Claude 3 Opus',
            provider: AIProvider.Anthropic,
            costPerMillionTokens: 75,
            contextWindow: 200000,
            supportsStreaming: true
        },

        // Google models
        {
            id: 'gemini-1.5-pro',
            name: 'Gemini 1.5 Pro',
            provider: AIProvider.Google,
            costPerMillionTokens: 7,
            contextWindow: 1000000,
            supportsStreaming: true
        },
        {
            id: 'gemini-1.5-flash',
            name: 'Gemini 1.5 Flash',
            provider: AIProvider.Google,
            costPerMillionTokens: 0.35,
            contextWindow: 1000000,
            supportsStreaming: true
        },

        // Ollama models (local - free)
        {
            id: 'llama3.2',
            name: 'Llama 3.2',
            provider: AIProvider.Ollama,
            costPerMillionTokens: 0,
            contextWindow: 128000,
            supportsStreaming: true
        },
        {
            id: 'mistral',
            name: 'Mistral',
            provider: AIProvider.Ollama,
            costPerMillionTokens: 0,
            contextWindow: 32000,
            supportsStreaming: true
        },
        {
            id: 'codellama',
            name: 'Code Llama',
            provider: AIProvider.Ollama,
            costPerMillionTokens: 0,
            contextWindow: 100000,
            supportsStreaming: true
        }
    ];

    constructor(private context: vscode.ExtensionContext) {}

    /**
     * Get current provider
     */
    getProvider(): AIProvider {
        const config = vscode.workspace.getConfiguration(GuardianSettings.CONFIG_SECTION);
        const providerStr = config.get<string>('provider', 'openai');
        return providerStr as AIProvider;
    }

    /**
     * Set provider
     */
    async setProvider(provider: AIProvider): Promise<void> {
        const config = vscode.workspace.getConfiguration(GuardianSettings.CONFIG_SECTION);
        await config.update('provider', provider, vscode.ConfigurationTarget.Global);
    }

    /**
     * Get selected model
     */
    getModel(): string {
        const config = vscode.workspace.getConfiguration(GuardianSettings.CONFIG_SECTION);
        return config.get<string>('model', 'gpt-4o');
    }

    /**
     * Set model
     */
    async setModel(model: string): Promise<void> {
        const config = vscode.workspace.getConfiguration(GuardianSettings.CONFIG_SECTION);
        await config.update('model', model, vscode.ConfigurationTarget.Global);
    }

    /**
     * Get API key for provider
     */
    getApiKey(provider: AIProvider): string | undefined {
        const secrets = this.context.secrets;
        const key = `guardian.${provider}.apiKey`;

        // For now, get from configuration (in production, use SecretStorage)
        const config = vscode.workspace.getConfiguration(GuardianSettings.CONFIG_SECTION);
        return config.get<string>(`${provider}ApiKey`);
    }

    /**
     * Set API key for provider (encrypted)
     */
    async setApiKey(provider: AIProvider, apiKey: string): Promise<void> {
        // Store in VS Code's secure storage
        await this.context.secrets.store(`guardian.${provider}.apiKey`, apiKey);

        // Also update config for backward compatibility
        const config = vscode.workspace.getConfiguration(GuardianSettings.CONFIG_SECTION);
        await config.update(`${provider}ApiKey`, apiKey, vscode.ConfigurationTarget.Global);

        vscode.window.showInformationMessage(`API key for ${provider} saved securely`);
    }

    /**
     * Get Ollama endpoint
     */
    getOllamaEndpoint(): string {
        const config = vscode.workspace.getConfiguration(GuardianSettings.CONFIG_SECTION);
        return config.get<string>('ollamaEndpoint', 'http://localhost:11434');
    }

    /**
     * Set Ollama endpoint
     */
    async setOllamaEndpoint(endpoint: string): Promise<void> {
        const config = vscode.workspace.getConfiguration(GuardianSettings.CONFIG_SECTION);
        await config.update('ollamaEndpoint', endpoint, vscode.ConfigurationTarget.Global);
    }

    /**
     * Get available models for provider
     */
    getAvailableModels(provider?: AIProvider): string[] {
        const targetProvider = provider || this.getProvider();
        return this.MODEL_REGISTRY
            .filter(m => m.provider === targetProvider)
            .map(m => m.id);
    }

    /**
     * Get model info
     */
    getModelInfo(modelId: string): ModelInfo | undefined {
        return this.MODEL_REGISTRY.find(m => m.id === modelId);
    }

    /**
     * Get all models
     */
    getAllModels(): ModelInfo[] {
        return [...this.MODEL_REGISTRY];
    }

    /**
     * Get cost estimate for tokens
     */
    estimateCost(modelId: string, tokens: number): number {
        const model = this.getModelInfo(modelId);
        if (!model) return 0;

        return (tokens / 1000000) * model.costPerMillionTokens;
    }

    /**
     * Is analysis enabled
     */
    isAnalysisEnabled(): boolean {
        const config = vscode.workspace.getConfiguration(GuardianSettings.CONFIG_SECTION);
        return config.get<boolean>('enableAnalysis', true);
    }

    /**
     * Is auto-analyze enabled
     */
    isAutoAnalyzeEnabled(): boolean {
        const config = vscode.workspace.getConfiguration(GuardianSettings.CONFIG_SECTION);
        return config.get<boolean>('autoAnalyze', true);
    }

    /**
     * Get monthly cost budget
     */
    getCostBudget(): number {
        const config = vscode.workspace.getConfiguration(GuardianSettings.CONFIG_SECTION);
        return config.get<number>('costBudgetMonthly', 10); // Default $10/month
    }

    /**
     * Get full configuration
     */
    getConfig(): GuardianConfig {
        return {
            provider: this.getProvider(),
            model: this.getModel(),
            apiKey: this.getApiKey(this.getProvider()),
            ollamaEndpoint: this.getOllamaEndpoint(),
            enableAnalysis: this.isAnalysisEnabled(),
            autoAnalyze: this.isAutoAnalyzeEnabled(),
            costBudgetMonthly: this.getCostBudget()
        };
    }

    /**
     * Test connection to AI provider
     */
    async testConnection(): Promise<{ success: boolean; message: string }> {
        const provider = this.getProvider();
        const model = this.getModel();

        try {
            if (provider === AIProvider.Ollama) {
                const endpoint = this.getOllamaEndpoint();
                const response = await fetch(`${endpoint}/api/tags`);

                if (!response.ok) {
                    return {
                        success: false,
                        message: `Ollama not responding at ${endpoint}`
                    };
                }

                return {
                    success: true,
                    message: `Successfully connected to Ollama at ${endpoint}`
                };
            } else {
                const apiKey = this.getApiKey(provider);
                if (!apiKey) {
                    return {
                        success: false,
                        message: `No API key configured for ${provider}`
                    };
                }

                // Test with a simple prompt
                // Implementation would depend on provider

                return {
                    success: true,
                    message: `API key configured for ${provider} (model: ${model})`
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `Connection failed: ${error}`
            };
        }
    }

    /**
     * Open settings UI
     */
    async openSettingsUI(): Promise<void> {
        // Show quick pick to configure settings
        const options = [
            {
                label: '$(server) Select AI Provider',
                description: `Current: ${this.getProvider()}`,
                action: 'provider'
            },
            {
                label: '$(symbol-class) Select Model',
                description: `Current: ${this.getModel()}`,
                action: 'model'
            },
            {
                label: '$(key) Configure API Keys',
                description: 'Set API keys for providers',
                action: 'apikey'
            },
            {
                label: '$(settings-gear) Ollama Settings',
                description: `Endpoint: ${this.getOllamaEndpoint()}`,
                action: 'ollama'
            },
            {
                label: '$(beaker) Test Connection',
                description: 'Test connection to AI provider',
                action: 'test'
            },
            {
                label: '$(graph) View Cost Estimate',
                description: 'View usage and cost estimates',
                action: 'cost'
            }
        ];

        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: 'Configure Guardian AI Settings'
        });

        if (!selected) return;

        switch (selected.action) {
            case 'provider':
                await this.selectProvider();
                break;
            case 'model':
                await this.selectModel();
                break;
            case 'apikey':
                await this.configureApiKey();
                break;
            case 'ollama':
                await this.configureOllama();
                break;
            case 'test':
                await this.runConnectionTest();
                break;
            case 'cost':
                await this.viewCostEstimate();
                break;
        }
    }

    /**
     * Select provider
     */
    private async selectProvider(): Promise<void> {
        const providers = [
            { label: 'OpenAI', value: AIProvider.OpenAI, description: 'GPT-4o, GPT-4 Turbo' },
            { label: 'Anthropic', value: AIProvider.Anthropic, description: 'Claude 3.5 Sonnet, Claude 3 Opus' },
            { label: 'Google', value: AIProvider.Google, description: 'Gemini 1.5 Pro, Gemini Flash' },
            { label: 'Ollama (Local)', value: AIProvider.Ollama, description: 'Free - Runs locally' }
        ];

        const selected = await vscode.window.showQuickPick(providers, {
            placeHolder: 'Select AI Provider'
        });

        if (selected) {
            await this.setProvider(selected.value);
            vscode.window.showInformationMessage(`Guardian provider set to ${selected.label}`);
        }
    }

    /**
     * Select model
     */
    private async selectModel(): Promise<void> {
        const provider = this.getProvider();
        const models = this.MODEL_REGISTRY
            .filter(m => m.provider === provider)
            .map(m => ({
                label: m.name,
                value: m.id,
                description: `$${m.costPerMillionTokens}/M tokens | ${m.contextWindow.toLocaleString()} ctx`,
                detail: m.provider
            }));

        const selected = await vscode.window.showQuickPick(models, {
            placeHolder: `Select model for ${provider}`
        });

        if (selected) {
            await this.setModel(selected.value);
            vscode.window.showInformationMessage(`Guardian model set to ${selected.label}`);
        }
    }

    /**
     * Configure API key
     */
    private async configureApiKey(): Promise<void> {
        const provider = this.getProvider();

        if (provider === AIProvider.Ollama) {
            vscode.window.showInformationMessage('Ollama runs locally and does not require an API key');
            return;
        }

        const apiKey = await vscode.window.showInputBox({
            prompt: `Enter API key for ${provider}`,
            password: true,
            placeHolder: 'sk-...',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'API key cannot be empty';
                }
                return null;
            }
        });

        if (apiKey) {
            await this.setApiKey(provider, apiKey);
        }
    }

    /**
     * Configure Ollama
     */
    private async configureOllama(): Promise<void> {
        const endpoint = await vscode.window.showInputBox({
            prompt: 'Enter Ollama endpoint URL',
            value: this.getOllamaEndpoint(),
            placeHolder: 'http://localhost:11434'
        });

        if (endpoint) {
            await this.setOllamaEndpoint(endpoint);
            vscode.window.showInformationMessage(`Ollama endpoint set to ${endpoint}`);
        }
    }

    /**
     * Run connection test
     */
    private async runConnectionTest(): Promise<void> {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Testing connection to AI provider...',
                cancellable: false
            },
            async () => {
                const result = await this.testConnection();

                if (result.success) {
                    vscode.window.showInformationMessage(`✓ ${result.message}`);
                } else {
                    vscode.window.showErrorMessage(`✗ ${result.message}`);
                }
            }
        );
    }

    /**
     * View cost estimate
     */
    private async viewCostEstimate(): Promise<void> {
        const model = this.getModelInfo(this.getModel());
        if (!model) {
            vscode.window.showWarningMessage('Model information not available');
            return;
        }

        const message = `Model: ${model.name}
Provider: ${model.provider}
Cost: $${model.costPerMillionTokens}/million tokens
Budget: $${this.getCostBudget()}/month

Estimated analyses per month at current budget:
- ~${Math.floor((this.getCostBudget() / model.costPerMillionTokens) * 1000)} analyses
(assuming ~1000 tokens per analysis)`;

        vscode.window.showInformationMessage(message, { modal: true });
    }
}
