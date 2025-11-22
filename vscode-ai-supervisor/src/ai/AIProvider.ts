/**
 * AI Provider Interface - Multi-model support for independent code review
 */

export enum AIModel {
    // OpenAI Models
    GPT_4 = 'gpt-4',
    GPT_4_TURBO = 'gpt-4-turbo',
    GPT_4O = 'gpt-4o',

    // Anthropic Models
    CLAUDE_3_5_SONNET = 'claude-3-5-sonnet-20241022',
    CLAUDE_3_OPUS = 'claude-3-opus-20240229',
    CLAUDE_3_HAIKU = 'claude-3-haiku-20240307',

    // Google Models
    GEMINI_PRO = 'gemini-1.5-pro-latest',
    GEMINI_FLASH = 'gemini-1.5-flash-latest',

    // Local Models (Ollama)
    LLAMA_3_1_70B = 'llama3.1:70b',
    LLAMA_3_1_8B = 'llama3.1:8b',
    DEEPSEEK_CODER = 'deepseek-coder:33b',
    PHI_3 = 'phi3:14b',
    CODELLAMA = 'codellama:34b'
}

export enum AIProviderType {
    OPENAI = 'openai',
    ANTHROPIC = 'anthropic',
    GOOGLE = 'google',
    OLLAMA = 'ollama'
}

export interface AIProviderConfig {
    type: AIProviderType;
    model: AIModel | string;
    apiKey?: string;
    endpoint?: string;
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
}

export interface AIResponse {
    content: string;
    model: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    cached?: boolean;
    timestamp: number;
}

export interface GuardianAnalysisPrompt {
    goal: {
        title: string;
        description: string;
        scope: string[];
        constraints: string[];
    };
    change: {
        filePath: string;
        diff: string;
        fileName: string;
        changeType: 'create' | 'modify' | 'delete';
    };
    codingModel: string;
    context?: {
        recentChanges?: string[];
        previousAnalysis?: string[];
    };
}

export interface GuardianAnalysisResult {
    aligned: boolean;
    confidence: number; // 0-1
    reasoning: string;
    riskLevel: 'low' | 'medium' | 'high';
    deviations: {
        type: 'scope_violation' | 'constraint_violation' | 'goal_misalignment' | 'reversal' | 'suspicious_pattern';
        severity: 'low' | 'medium' | 'high';
        description: string;
        suggestion?: string;
    }[];
    metadata: {
        guardianModel: string;
        analysisTime: number;
        timestamp: number;
    };
}

/**
 * Abstract base class for AI providers
 */
export abstract class AIProvider {
    protected config: AIProviderConfig;

    constructor(config: AIProviderConfig) {
        this.config = config;
    }

    /**
     * Generate AI response from prompt
     */
    abstract generate(prompt: string, systemPrompt?: string): Promise<AIResponse>;

    /**
     * Analyze code change against goal (specialized for guardian role)
     */
    abstract analyzeCodeChange(prompt: GuardianAnalysisPrompt): Promise<GuardianAnalysisResult>;

    /**
     * Test connection to AI provider
     */
    abstract testConnection(): Promise<boolean>;

    /**
     * Get provider name
     */
    getProviderName(): string {
        return this.config.type;
    }

    /**
     * Get model name
     */
    getModelName(): string {
        return this.config.model;
    }

    /**
     * Parse guardian analysis from AI response
     */
    protected parseGuardianAnalysis(response: string, model: string, startTime: number): GuardianAnalysisResult {
        try {
            // Try to parse as JSON first
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    aligned: parsed.aligned || false,
                    confidence: parsed.confidence || 0.5,
                    reasoning: parsed.reasoning || '',
                    riskLevel: parsed.riskLevel || 'medium',
                    deviations: parsed.deviations || [],
                    metadata: {
                        guardianModel: model,
                        analysisTime: Date.now() - startTime,
                        timestamp: Date.now()
                    }
                };
            }

            // Fallback to text parsing
            const aligned = response.toLowerCase().includes('aligned: true') ||
                          response.toLowerCase().includes('aligned with goal') ||
                          !response.toLowerCase().includes('deviation');

            const confidenceMatch = response.match(/confidence[:\s]+([0-9.]+)/i);
            const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.7;

            const riskMatch = response.match(/risk[:\s]+(low|medium|high)/i);
            const riskLevel = (riskMatch?.[1]?.toLowerCase() as 'low' | 'medium' | 'high') || 'medium';

            const deviations: GuardianAnalysisResult['deviations'] = [];

            // Check for scope violations
            if (response.toLowerCase().includes('scope violation') ||
                response.toLowerCase().includes('outside scope')) {
                deviations.push({
                    type: 'scope_violation',
                    severity: 'high',
                    description: 'Code change appears to be outside defined scope'
                });
            }

            // Check for constraint violations
            if (response.toLowerCase().includes('constraint violation') ||
                response.toLowerCase().includes('violates constraint')) {
                deviations.push({
                    type: 'constraint_violation',
                    severity: 'high',
                    description: 'Code change violates defined constraints'
                });
            }

            // Check for reversals
            if (response.toLowerCase().includes('reversal') ||
                response.toLowerCase().includes('undoes previous work')) {
                deviations.push({
                    type: 'reversal',
                    severity: 'medium',
                    description: 'Change appears to reverse previous work'
                });
            }

            return {
                aligned,
                confidence,
                reasoning: response.trim(),
                riskLevel,
                deviations,
                metadata: {
                    guardianModel: model,
                    analysisTime: Date.now() - startTime,
                    timestamp: Date.now()
                }
            };
        } catch (error) {
            console.error('Failed to parse guardian analysis:', error);
            return {
                aligned: false,
                confidence: 0.0,
                reasoning: `Failed to parse analysis: ${error}`,
                riskLevel: 'high',
                deviations: [{
                    type: 'suspicious_pattern',
                    severity: 'high',
                    description: 'Analysis parsing failed - manual review required'
                }],
                metadata: {
                    guardianModel: model,
                    analysisTime: Date.now() - startTime,
                    timestamp: Date.now()
                }
            };
        }
    }

    /**
     * Build guardian analysis prompt
     */
    protected buildGuardianPrompt(prompt: GuardianAnalysisPrompt): string {
        return `You are an independent code review guardian. Your role is to analyze code changes against project goals and constraints.

CRITICAL: You are reviewing code written by ${prompt.codingModel}. Provide objective, independent analysis.

PROJECT GOAL:
Title: ${prompt.goal.title}
Description: ${prompt.goal.description}

ALLOWED SCOPE:
${prompt.goal.scope.length > 0 ? prompt.goal.scope.map(s => `- ${s}`).join('\n') : '- No scope restrictions'}

CONSTRAINTS (AI MUST NOT violate these):
${prompt.goal.constraints.length > 0 ? prompt.goal.constraints.map(c => `- ${c}`).join('\n') : '- No specific constraints'}

CODE CHANGE:
File: ${prompt.change.filePath}
Type: ${prompt.change.changeType}

DIFF:
\`\`\`diff
${prompt.change.diff}
\`\`\`

ANALYSIS REQUIRED:
Respond in JSON format with the following structure:
{
  "aligned": boolean,  // true if change aligns with goal
  "confidence": number,  // 0.0 to 1.0
  "reasoning": "string",  // Detailed explanation
  "riskLevel": "low" | "medium" | "high",
  "deviations": [
    {
      "type": "scope_violation" | "constraint_violation" | "goal_misalignment" | "reversal" | "suspicious_pattern",
      "severity": "low" | "medium" | "high",
      "description": "string",
      "suggestion": "string (optional)"
    }
  ]
}

IMPORTANT:
1. Check if file path matches allowed scope patterns
2. Verify no constraints are violated
3. Assess if change advances the stated goal
4. Look for suspicious patterns (e.g., deleting tests, adding backdoors, exposing secrets)
5. Be specific about what's wrong, not just "deviation detected"

Analyze now:`;
    }
}
