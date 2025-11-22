import * as vscode from 'vscode';
import { GuardianSettings, AIProvider } from './GuardianSettings';

/**
 * Analysis result from guardian model
 */
export interface GuardianAnalysis {
    aligned: boolean;
    guardianModel: string;
    codingModel: string;
    reasoning: string;
    severity: 'info' | 'warning' | 'error';
    confidence: number;
    suggestions: string[];
    timestamp: number;
    goalId?: string;
}

/**
 * Code change to analyze
 */
export interface CodeChange {
    filePath: string;
    beforeContent: string;
    afterContent: string;
    diff: string;
    type: 'create' | 'modify' | 'delete';
}

/**
 * Project goal for analysis
 */
export interface ProjectGoal {
    id: string;
    title: string;
    description: string;
    constraints?: string[];
}

/**
 * GuardianAnalyzer - Uses different AI model to analyze code changes
 *
 * Core principle: Never use the same model for coding AND reviewing
 */
export class GuardianAnalyzer {
    private settings: GuardianSettings;
    private analysisCache: Map<string, GuardianAnalysis> = new Map();

    constructor(private context: vscode.ExtensionContext) {
        this.settings = new GuardianSettings(context);
    }

    /**
     * Analyze a code change against a project goal
     */
    async analyzeCodeChange(
        change: CodeChange,
        goal: ProjectGoal,
        codingModel: string
    ): Promise<GuardianAnalysis> {
        const cacheKey = this.getCacheKey(change, goal, codingModel);

        // Check cache first
        const cached = this.analysisCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 60000) {
            return cached;
        }

        // Get guardian model (must be different from coding model)
        const guardianModel = await this.selectGuardianModel(codingModel);

        // Build analysis prompt
        const prompt = this.buildAnalysisPrompt(change, goal, codingModel);

        try {
            // Call AI provider
            const response = await this.callAIProvider(guardianModel, prompt);

            // Parse response
            const analysis = this.parseAnalysisResponse(
                response,
                guardianModel,
                codingModel,
                goal.id
            );

            // Cache result
            this.analysisCache.set(cacheKey, analysis);

            return analysis;

        } catch (error) {
            console.error('GuardianAnalyzer: Failed to analyze code change:', error);

            // Return fallback analysis
            return {
                aligned: true,
                guardianModel: 'offline',
                codingModel,
                reasoning: 'Analysis unavailable - offline mode',
                severity: 'info',
                confidence: 0,
                suggestions: [],
                timestamp: Date.now(),
                goalId: goal.id
            };
        }
    }

    /**
     * Select guardian model that's different from coding model
     */
    private async selectGuardianModel(codingModel: string): Promise<string> {
        const provider = this.settings.getProvider();
        const availableModels = this.settings.getAvailableModels(provider);

        // Normalize coding model name
        const normalizedCodingModel = this.normalizeModelName(codingModel);

        // Find a different model from the same or different provider
        for (const model of availableModels) {
            const normalizedModel = this.normalizeModelName(model);
            if (normalizedModel !== normalizedCodingModel) {
                return model;
            }
        }

        // If no different model in same provider, use default from different provider
        if (provider === AIProvider.OpenAI) {
            return 'claude-3-5-sonnet-20241022'; // Anthropic
        } else {
            return 'gpt-4o'; // OpenAI
        }
    }

    /**
     * Normalize model name for comparison
     */
    private normalizeModelName(model: string): string {
        const normalized = model.toLowerCase().trim();

        // Group similar models
        if (normalized.includes('gpt-4') || normalized.includes('gpt4')) {
            return 'gpt4';
        }
        if (normalized.includes('claude') && normalized.includes('3.5')) {
            return 'claude3.5';
        }
        if (normalized.includes('gemini')) {
            return 'gemini';
        }

        return normalized;
    }

    /**
     * Build analysis prompt for AI model
     */
    private buildAnalysisPrompt(
        change: CodeChange,
        goal: ProjectGoal,
        codingModel: string
    ): string {
        return `You are a code reviewer analyzing changes made by ${codingModel}.

PROJECT GOAL:
Title: ${goal.title}
Description: ${goal.description}
${goal.constraints ? `Constraints:\n${goal.constraints.map(c => `- ${c}`).join('\n')}` : ''}

CODE CHANGE:
File: ${change.filePath}
Type: ${change.type}

DIFF:
${change.diff}

TASK:
Analyze if this code change aligns with the project goal. Consider:
1. Does it move toward the goal?
2. Does it violate any constraints?
3. Are there better approaches?
4. What are potential issues?

Respond in JSON format:
{
    "aligned": true/false,
    "reasoning": "Brief explanation of your analysis",
    "severity": "info|warning|error",
    "confidence": 0.0-1.0,
    "suggestions": ["suggestion 1", "suggestion 2"]
}`;
    }

    /**
     * Call AI provider API
     */
    private async callAIProvider(model: string, prompt: string): Promise<string> {
        const provider = this.settings.getProvider();

        // Check if offline mode
        if (provider === AIProvider.Ollama) {
            return await this.callOllama(model, prompt);
        }

        // Online providers
        const apiKey = this.settings.getApiKey(provider);
        if (!apiKey) {
            throw new Error(`No API key configured for ${provider}`);
        }

        switch (provider) {
            case AIProvider.OpenAI:
                return await this.callOpenAI(model, prompt, apiKey);
            case AIProvider.Anthropic:
                return await this.callAnthropic(model, prompt, apiKey);
            case AIProvider.Google:
                return await this.callGoogle(model, prompt, apiKey);
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }

    /**
     * Call OpenAI API
     */
    private async callOpenAI(model: string, prompt: string, apiKey: string): Promise<string> {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * Call Anthropic API
     */
    private async callAnthropic(model: string, prompt: string, apiKey: string): Promise<string> {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1000,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.content[0].text;
    }

    /**
     * Call Google Gemini API
     */
    private async callGoogle(model: string, prompt: string, apiKey: string): Promise<string> {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Google API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    /**
     * Call Ollama (local)
     */
    private async callOllama(model: string, prompt: string): Promise<string> {
        const endpoint = this.settings.getOllamaEndpoint();

        const response = await fetch(`${endpoint}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.response;
    }

    /**
     * Parse AI response into analysis
     */
    private parseAnalysisResponse(
        response: string,
        guardianModel: string,
        codingModel: string,
        goalId?: string
    ): GuardianAnalysis {
        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            return {
                aligned: parsed.aligned ?? true,
                guardianModel,
                codingModel,
                reasoning: parsed.reasoning || 'No reasoning provided',
                severity: parsed.severity || 'info',
                confidence: parsed.confidence ?? 0.5,
                suggestions: parsed.suggestions || [],
                timestamp: Date.now(),
                goalId
            };

        } catch (error) {
            console.error('Failed to parse analysis response:', error);

            // Fallback parsing
            const aligned = !response.toLowerCase().includes('not aligned') &&
                           !response.toLowerCase().includes('deviates');

            return {
                aligned,
                guardianModel,
                codingModel,
                reasoning: response.substring(0, 200),
                severity: aligned ? 'info' : 'warning',
                confidence: 0.5,
                suggestions: [],
                timestamp: Date.now(),
                goalId
            };
        }
    }

    /**
     * Generate cache key
     */
    private getCacheKey(change: CodeChange, goal: ProjectGoal, codingModel: string): string {
        const content = change.filePath + change.diff + goal.id + codingModel;
        return Buffer.from(content).toString('base64').substring(0, 32);
    }

    /**
     * Get guardian settings
     */
    public getSettings(): GuardianSettings {
        return this.settings;
    }

    /**
     * Clear analysis cache
     */
    public clearCache(): void {
        this.analysisCache.clear();
    }
}
