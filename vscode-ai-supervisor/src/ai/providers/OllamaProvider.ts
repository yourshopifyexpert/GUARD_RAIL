/**
 * Ollama Provider - Local models (Llama 3.1, DeepSeek Coder, Phi-3, etc.)
 * For privacy-focused users who want to run AI models locally
 */

import { AIProvider, AIProviderConfig, AIResponse, GuardianAnalysisPrompt, GuardianAnalysisResult } from '../AIProvider';

interface OllamaResponse {
    response: string;
    model: string;
    prompt_eval_count?: number;
    eval_count?: number;
}

interface OllamaListResponse {
    models?: Array<{ name: string }>;
}

export class OllamaProvider extends AIProvider {
    private endpoint: string;

    constructor(config: AIProviderConfig) {
        super(config);

        // Default Ollama endpoint
        this.endpoint = config.endpoint || 'http://localhost:11434';
    }

    async generate(prompt: string, systemPrompt?: string): Promise<AIResponse> {
        const startTime = Date.now();

        try {
            const response = await fetch(`${this.endpoint}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.config.model,
                    prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
                    stream: false,
                    options: {
                        temperature: this.config.temperature || 0.3,
                        num_predict: this.config.maxTokens || 2048
                    }
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Ollama API error: ${response.status} - ${error}`);
            }

            const data = await response.json() as OllamaResponse;

            return {
                content: data.response,
                model: data.model,
                usage: {
                    promptTokens: data.prompt_eval_count || 0,
                    completionTokens: data.eval_count || 0,
                    totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
                },
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Ollama generation failed:', error);
            throw new Error(`Ollama generation failed: ${error}. Ensure Ollama is running at ${this.endpoint}`);
        }
    }

    async analyzeCodeChange(prompt: GuardianAnalysisPrompt): Promise<GuardianAnalysisResult> {
        const startTime = Date.now();

        const systemPrompt = `You are a local AI code review guardian running on Ollama. Your role is to provide independent, objective analysis of code changes against defined project goals and constraints. You are reviewing code written by ${prompt.codingModel}. Be thorough, specific, and unbiased. All analysis stays local for privacy.`;

        const userPrompt = this.buildGuardianPrompt(prompt);

        const response = await this.generate(userPrompt, systemPrompt);

        return this.parseGuardianAnalysis(response.content, this.config.model, startTime);
    }

    async testConnection(): Promise<boolean> {
        try {
            // Test if Ollama is running
            const response = await fetch(`${this.endpoint}/api/tags`, {
                method: 'GET'
            });

            if (!response.ok) {
                return false;
            }

            // Check if the model exists
            const data = await response.json() as OllamaListResponse;
            const modelExists = data.models?.some((m) => m.name.includes(this.config.model));

            if (!modelExists) {
                console.warn(`Model ${this.config.model} not found in Ollama. Available models:`, data.models?.map((m) => m.name));
            }

            return response.ok;
        } catch (error) {
            console.error('Ollama connection test failed:', error);
            return false;
        }
    }

    /**
     * List available models in Ollama
     */
    async listAvailableModels(): Promise<string[]> {
        try {
            const response = await fetch(`${this.endpoint}/api/tags`, {
                method: 'GET'
            });

            if (!response.ok) {
                return [];
            }

            const data = await response.json() as OllamaListResponse;
            return data.models?.map((m) => m.name) || [];
        } catch (error) {
            console.error('Failed to list Ollama models:', error);
            return [];
        }
    }

    /**
     * Pull a model from Ollama registry
     */
    async pullModel(modelName: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.endpoint}/api/pull`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: modelName,
                    stream: false
                })
            });

            return response.ok;
        } catch (error) {
            console.error('Failed to pull Ollama model:', error);
            return false;
        }
    }
}
