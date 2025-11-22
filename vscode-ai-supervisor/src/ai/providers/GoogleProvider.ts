/**
 * Google Provider - Gemini Pro, Gemini Flash
 */

import { AIProvider, AIProviderConfig, AIResponse, GuardianAnalysisPrompt, GuardianAnalysisResult } from '../AIProvider';

interface GoogleResponse {
    candidates?: Array<{
        content: {
            parts: Array<{ text: string }>;
        };
    }>;
    usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
    };
}

export class GoogleProvider extends AIProvider {
    private apiKey: string;
    private endpoint: string;

    constructor(config: AIProviderConfig) {
        super(config);

        if (!config.apiKey) {
            throw new Error('Google API key is required');
        }

        this.apiKey = config.apiKey;
        this.endpoint = config.endpoint || 'https://generativelanguage.googleapis.com/v1beta';
    }

    async generate(prompt: string, systemPrompt?: string): Promise<AIResponse> {
        const startTime = Date.now();

        try {
            const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

            const response = await fetch(
                `${this.endpoint}/models/${this.config.model}:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: fullPrompt
                            }]
                        }],
                        generationConfig: {
                            temperature: this.config.temperature || 0.3,
                            maxOutputTokens: this.config.maxTokens || 2048,
                            topP: 0.95
                        }
                    })
                }
            );

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Google API error: ${response.status} - ${error}`);
            }

            const data = await response.json() as GoogleResponse;

            if (!data.candidates || data.candidates.length === 0) {
                throw new Error('No response from Gemini');
            }

            const content = data.candidates[0].content.parts[0].text;

            return {
                content,
                model: this.config.model,
                usage: {
                    promptTokens: data.usageMetadata?.promptTokenCount || 0,
                    completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
                    totalTokens: data.usageMetadata?.totalTokenCount || 0
                },
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Google generation failed:', error);
            throw new Error(`Google generation failed: ${error}`);
        }
    }

    async analyzeCodeChange(prompt: GuardianAnalysisPrompt): Promise<GuardianAnalysisResult> {
        const startTime = Date.now();

        const systemPrompt = `You are Gemini, an expert code review guardian providing independent analysis. Your role is to objectively analyze code changes against defined project goals and constraints. You are reviewing code written by ${prompt.codingModel}. Be thorough, specific, and unbiased in your assessment.`;

        const userPrompt = this.buildGuardianPrompt(prompt);

        const response = await this.generate(userPrompt, systemPrompt);

        return this.parseGuardianAnalysis(response.content, this.config.model, startTime);
    }

    async testConnection(): Promise<boolean> {
        try {
            const response = await fetch(
                `${this.endpoint}/models/${this.config.model}:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: 'Hello'
                            }]
                        }],
                        generationConfig: {
                            maxOutputTokens: 10
                        }
                    })
                }
            );

            return response.ok;
        } catch (error) {
            console.error('Google connection test failed:', error);
            return false;
        }
    }
}
