/**
 * Model Selector - Intelligent pairing of coding models with guardian models
 * CRITICAL: Never use the same model for coding and guarding
 */

import * as vscode from 'vscode';
import { AIProvider, AIProviderConfig, AIProviderType, AIModel } from './AIProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { GoogleProvider } from './providers/GoogleProvider';
import { OllamaProvider } from './providers/OllamaProvider';

export interface ModelPairing {
    codingModel: string;
    guardianModel: string;
    guardianProvider: AIProviderType;
    reason: string;
}

export class ModelSelector {
    private static instance: ModelSelector;
    private providers: Map<string, AIProvider> = new Map();
    private cache: Map<string, any> = new Map(); // For caching AI responses

    /**
     * Default model pairings - ensures different models for guardian
     */
    private static readonly DEFAULT_PAIRINGS: Record<string, ModelPairing> = {
        'claude': {
            codingModel: 'claude',
            guardianModel: AIModel.GPT_4O,
            guardianProvider: AIProviderType.OPENAI,
            reason: 'Claude codes → GPT-4o guards (independent oversight)'
        },
        'claude-3-5-sonnet': {
            codingModel: 'claude-3-5-sonnet',
            guardianModel: AIModel.GPT_4O,
            guardianProvider: AIProviderType.OPENAI,
            reason: 'Claude 3.5 codes → GPT-4o guards'
        },
        'gpt-4': {
            codingModel: 'gpt-4',
            guardianModel: AIModel.CLAUDE_3_5_SONNET,
            guardianProvider: AIProviderType.ANTHROPIC,
            reason: 'GPT-4 codes → Claude 3.5 guards'
        },
        'gpt-4o': {
            codingModel: 'gpt-4o',
            guardianModel: AIModel.CLAUDE_3_5_SONNET,
            guardianProvider: AIProviderType.ANTHROPIC,
            reason: 'GPT-4o codes → Claude 3.5 guards'
        },
        'github-copilot': {
            codingModel: 'github-copilot',
            guardianModel: AIModel.GEMINI_PRO,
            guardianProvider: AIProviderType.GOOGLE,
            reason: 'GitHub Copilot codes → Gemini Pro guards'
        },
        'cursor': {
            codingModel: 'cursor',
            guardianModel: AIModel.DEEPSEEK_CODER,
            guardianProvider: AIProviderType.OLLAMA,
            reason: 'Cursor codes → DeepSeek Coder guards (local)'
        },
        'continue': {
            codingModel: 'continue',
            guardianModel: AIModel.LLAMA_3_1_70B,
            guardianProvider: AIProviderType.OLLAMA,
            reason: 'Continue codes → Llama 3.1 guards (local)'
        },
        'cody': {
            codingModel: 'cody',
            guardianModel: AIModel.GPT_4O,
            guardianProvider: AIProviderType.OPENAI,
            reason: 'Cody codes → GPT-4o guards'
        }
    };

    private constructor() {
        this.initializeProviders();
    }

    public static getInstance(): ModelSelector {
        if (!ModelSelector.instance) {
            ModelSelector.instance = new ModelSelector();
        }
        return ModelSelector.instance;
    }

    /**
     * Initialize AI providers from VS Code settings
     */
    private initializeProviders(): void {
        const config = vscode.workspace.getConfiguration('aiSupervisor');

        // OpenAI
        const openAIKey = config.get<string>('guardian.openai.apiKey');
        if (openAIKey) {
            const openAIConfig: AIProviderConfig = {
                type: AIProviderType.OPENAI,
                model: config.get<string>('guardian.openai.model') || AIModel.GPT_4O,
                apiKey: openAIKey,
                temperature: 0.3,
                maxTokens: 2048
            };
            this.providers.set('openai', new OpenAIProvider(openAIConfig));
        }

        // Anthropic
        const anthropicKey = config.get<string>('guardian.anthropic.apiKey');
        if (anthropicKey) {
            const anthropicConfig: AIProviderConfig = {
                type: AIProviderType.ANTHROPIC,
                model: config.get<string>('guardian.anthropic.model') || AIModel.CLAUDE_3_5_SONNET,
                apiKey: anthropicKey,
                temperature: 0.3,
                maxTokens: 4096
            };
            this.providers.set('anthropic', new AnthropicProvider(anthropicConfig));
        }

        // Google
        const googleKey = config.get<string>('guardian.google.apiKey');
        if (googleKey) {
            const googleConfig: AIProviderConfig = {
                type: AIProviderType.GOOGLE,
                model: config.get<string>('guardian.google.model') || AIModel.GEMINI_PRO,
                apiKey: googleKey,
                temperature: 0.3,
                maxTokens: 2048
            };
            this.providers.set('google', new GoogleProvider(googleConfig));
        }

        // Ollama (local - no API key needed)
        const ollamaEnabled = config.get<boolean>('guardian.ollama.enabled', false);
        if (ollamaEnabled) {
            const ollamaConfig: AIProviderConfig = {
                type: AIProviderType.OLLAMA,
                model: config.get<string>('guardian.ollama.model') || AIModel.LLAMA_3_1_70B,
                endpoint: config.get<string>('guardian.ollama.endpoint') || 'http://localhost:11434',
                temperature: 0.3,
                maxTokens: 2048
            };
            this.providers.set('ollama', new OllamaProvider(ollamaConfig));
        }
    }

    /**
     * Select guardian model based on coding model
     * CRITICAL: Returns a DIFFERENT model than the one used for coding
     */
    public selectGuardianModel(codingModel: string): ModelPairing {
        const normalized = this.normalizeCodingModel(codingModel);

        // Check if we have a custom pairing in settings
        const config = vscode.workspace.getConfiguration('aiSupervisor');
        const customPairings = config.get<Record<string, ModelPairing>>('guardian.customPairings', {});

        if (customPairings[normalized]) {
            return customPairings[normalized];
        }

        // Use default pairing
        if (ModelSelector.DEFAULT_PAIRINGS[normalized]) {
            return ModelSelector.DEFAULT_PAIRINGS[normalized];
        }

        // Fallback: Use GPT-4o as guardian if unknown coding model
        return {
            codingModel: normalized,
            guardianModel: AIModel.GPT_4O,
            guardianProvider: AIProviderType.OPENAI,
            reason: 'Unknown coding model → Default to GPT-4o guardian'
        };
    }

    /**
     * Get guardian provider instance
     */
    public getGuardianProvider(codingModel: string): AIProvider | null {
        const pairing = this.selectGuardianModel(codingModel);
        const provider = this.providers.get(pairing.guardianProvider);

        if (!provider) {
            console.warn(`Guardian provider ${pairing.guardianProvider} not configured. Please add API key in settings.`);
            return null;
        }

        return provider;
    }

    /**
     * Normalize coding model name from various sources
     */
    private normalizeCodingModel(model: string): string {
        const lower = model.toLowerCase().trim();

        // Detect Claude
        if (lower.includes('claude')) {
            if (lower.includes('3.5') || lower.includes('3-5')) {
                return 'claude-3-5-sonnet';
            }
            return 'claude';
        }

        // Detect GPT
        if (lower.includes('gpt')) {
            if (lower.includes('4o')) {
                return 'gpt-4o';
            }
            if (lower.includes('4')) {
                return 'gpt-4';
            }
        }

        // Detect tools
        if (lower.includes('copilot')) {return 'github-copilot';}
        if (lower.includes('cursor')) {return 'cursor';}
        if (lower.includes('continue')) {return 'continue';}
        if (lower.includes('cody')) {return 'cody';}

        return lower;
    }

    /**
     * Get all available providers
     */
    public getAvailableProviders(): Map<string, AIProvider> {
        return this.providers;
    }

    /**
     * Test all provider connections
     */
    public async testAllConnections(): Promise<Record<string, boolean>> {
        const results: Record<string, boolean> = {};

        for (const [name, provider] of this.providers.entries()) {
            try {
                results[name] = await provider.testConnection();
            } catch (error) {
                console.error(`Failed to test ${name}:`, error);
                results[name] = false;
            }
        }

        return results;
    }

    /**
     * Cache AI response to avoid duplicate calls
     */
    public cacheResponse(key: string, response: any): void {
        this.cache.set(key, {
            response,
            timestamp: Date.now()
        });
    }

    /**
     * Get cached response if available and not expired
     */
    public getCachedResponse(key: string, maxAge: number = 3600000): any | null {
        const cached = this.cache.get(key);
        if (!cached) {return null;}

        const age = Date.now() - cached.timestamp;
        if (age > maxAge) {
            this.cache.delete(key);
            return null;
        }

        return cached.response;
    }

    /**
     * Clear response cache
     */
    public clearCache(): void {
        this.cache.clear();
    }

    /**
     * Reload providers from settings (call when settings change)
     */
    public reloadProviders(): void {
        this.providers.clear();
        this.initializeProviders();
    }
}
