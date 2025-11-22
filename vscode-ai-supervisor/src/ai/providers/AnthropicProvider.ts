/**
 * Anthropic Provider - Claude 3.5 Sonnet, Opus, Haiku
 */

import { AIProvider, AIProviderConfig, AIResponse, GuardianAnalysisPrompt, GuardianAnalysisResult } from '../AIProvider';

interface AnthropicResponse {
    content: Array<{ text: string }>;
    model: string;
    usage: {
        input_tokens: number;
        output_tokens: number;
    };
}

export class AnthropicProvider extends AIProvider {
    private apiKey: string;
    private endpoint: string;
    private version: string;

    constructor(config: AIProviderConfig) {
        super(config);

        if (!config.apiKey) {
            throw new Error('Anthropic API key is required');
        }

        this.apiKey = config.apiKey;
        this.endpoint = config.endpoint || 'https://api.anthropic.com/v1';
        this.version = '2023-06-01';
    }

    async generate(prompt: string, systemPrompt?: string): Promise<AIResponse> {
        const startTime = Date.now();

        try {
            const response = await fetch(`${this.endpoint}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': this.version
                },
                body: JSON.stringify({
                    model: this.config.model,
                    max_tokens: this.config.maxTokens || 4096,
                    temperature: this.config.temperature || 0.3,
                    system: systemPrompt || 'You are a helpful AI assistant.',
                    messages: [
                        { role: 'user', content: prompt }
                    ]
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Anthropic API error: ${response.status} - ${error}`);
            }

            const data = await response.json() as AnthropicResponse;

            return {
                content: data.content[0].text,
                model: data.model,
                usage: {
                    promptTokens: data.usage.input_tokens,
                    completionTokens: data.usage.output_tokens,
                    totalTokens: data.usage.input_tokens + data.usage.output_tokens
                },
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Anthropic generation failed:', error);
            throw new Error(`Anthropic generation failed: ${error}`);
        }
    }

    async analyzeCodeChange(prompt: GuardianAnalysisPrompt): Promise<GuardianAnalysisResult> {
        const startTime = Date.now();

        const systemPrompt = `You are Claude, an expert code review guardian providing independent analysis. Your role is to objectively analyze code changes against defined project goals and constraints. You are reviewing code written by ${prompt.codingModel}. Be thorough, specific, and unbiased in your assessment.`;

        const userPrompt = this.buildGuardianPrompt(prompt);

        const response = await this.generate(userPrompt, systemPrompt);

        return this.parseGuardianAnalysis(response.content, this.config.model, startTime);
    }

    async testConnection(): Promise<boolean> {
        try {
            // Anthropic doesn't have a simple health check endpoint
            // So we'll make a minimal request
            const response = await fetch(`${this.endpoint}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': this.version
                },
                body: JSON.stringify({
                    model: this.config.model,
                    max_tokens: 10,
                    messages: [
                        { role: 'user', content: 'Hi' }
                    ]
                })
            });

            return response.ok;
        } catch (error) {
            console.error('Anthropic connection test failed:', error);
            return false;
        }
    }
}
