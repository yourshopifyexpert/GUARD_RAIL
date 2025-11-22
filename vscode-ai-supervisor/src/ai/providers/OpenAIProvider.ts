/**
 * OpenAI Provider - GPT-4, GPT-4 Turbo, GPT-4o
 */

import { AIProvider, AIProviderConfig, AIResponse, GuardianAnalysisPrompt, GuardianAnalysisResult } from '../AIProvider';

export class OpenAIProvider extends AIProvider {
    private apiKey: string;
    private endpoint: string;

    constructor(config: AIProviderConfig) {
        super(config);

        if (!config.apiKey) {
            throw new Error('OpenAI API key is required');
        }

        this.apiKey = config.apiKey;
        this.endpoint = config.endpoint || 'https://api.openai.com/v1';
    }

    async generate(prompt: string, systemPrompt?: string): Promise<AIResponse> {
        const startTime = Date.now();

        try {
            const response = await fetch(`${this.endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: [
                        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                        { role: 'user', content: prompt }
                    ],
                    temperature: this.config.temperature || 0.3,
                    max_tokens: this.config.maxTokens || 2048
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`OpenAI API error: ${response.status} - ${error}`);
            }

            const data = await response.json();

            return {
                content: data.choices[0].message.content,
                model: data.model,
                usage: {
                    promptTokens: data.usage.prompt_tokens,
                    completionTokens: data.usage.completion_tokens,
                    totalTokens: data.usage.total_tokens
                },
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('OpenAI generation failed:', error);
            throw new Error(`OpenAI generation failed: ${error}`);
        }
    }

    async analyzeCodeChange(prompt: GuardianAnalysisPrompt): Promise<GuardianAnalysisResult> {
        const startTime = Date.now();

        const systemPrompt = `You are an expert code review guardian. Your role is to provide independent, objective analysis of code changes against defined project goals and constraints. You are reviewing code written by ${prompt.codingModel}. Be thorough, specific, and unbiased.`;

        const userPrompt = this.buildGuardianPrompt(prompt);

        const response = await this.generate(userPrompt, systemPrompt);

        return this.parseGuardianAnalysis(response.content, this.config.model, startTime);
    }

    async testConnection(): Promise<boolean> {
        try {
            const response = await fetch(`${this.endpoint}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            return response.ok;
        } catch (error) {
            console.error('OpenAI connection test failed:', error);
            return false;
        }
    }
}
