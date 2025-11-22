/**
 * Guardian Analyzer - Uses DIFFERENT AI model to analyze code changes
 * This is the core of independent AI oversight
 */

import * as vscode from 'vscode';
import { ModelSelector } from './ModelSelector';
import { GuardianAnalysisPrompt, GuardianAnalysisResult } from './AIProvider';
import { CodeChange } from '../services/ChangeStorageService';

export interface Goal {
    id: string;
    title: string;
    description: string;
    scope: string[];
    constraints: string[];
    status: 'active' | 'paused' | 'completed';
}

export interface AnalysisContext {
    change: CodeChange;
    goal: Goal;
    detectedCodingModel: string;
    recentChanges?: CodeChange[];
}

export class GuardianAnalyzer {
    private static instance: GuardianAnalyzer;
    private modelSelector: ModelSelector;
    private analysisHistory: Map<string, GuardianAnalysisResult> = new Map();

    private constructor() {
        this.modelSelector = ModelSelector.getInstance();
    }

    public static getInstance(): GuardianAnalyzer {
        if (!GuardianAnalyzer.instance) {
            GuardianAnalyzer.instance = new GuardianAnalyzer();
        }
        return GuardianAnalyzer.instance;
    }

    /**
     * Analyze a code change using a DIFFERENT model than the one that coded it
     */
    public async analyzeCodeChange(context: AnalysisContext): Promise<GuardianAnalysisResult> {
        const startTime = Date.now();

        try {
            // Step 1: Determine which model to use for guardian
            const pairing = this.modelSelector.selectGuardianModel(context.detectedCodingModel);

            console.log(`🛡️ Guardian Analysis:`, {
                codingModel: context.detectedCodingModel,
                guardianModel: pairing.guardianModel,
                reason: pairing.reason
            });

            // Step 2: Check cache first
            const cacheKey = this.generateCacheKey(context);
            const cached = this.modelSelector.getCachedResponse(cacheKey);
            if (cached) {
                console.log('✅ Using cached guardian analysis');
                return cached;
            }

            // Step 3: Get guardian provider
            const guardianProvider = this.modelSelector.getGuardianProvider(context.detectedCodingModel);
            if (!guardianProvider) {
                return this.createFallbackAnalysis(
                    `Guardian provider ${pairing.guardianProvider} not configured. Please add API key in settings.`,
                    context,
                    startTime
                );
            }

            // Step 4: Build analysis prompt
            const prompt = this.buildAnalysisPrompt(context);

            // Step 5: Get AI analysis
            const result = await guardianProvider.analyzeCodeChange(prompt);

            // Step 6: Enhance result with additional checks
            const enhancedResult = this.enhanceAnalysis(result, context);

            // Step 7: Cache result
            this.modelSelector.cacheResponse(cacheKey, enhancedResult);
            this.analysisHistory.set(context.change.id, enhancedResult);

            // Step 8: Log result
            this.logAnalysisResult(enhancedResult, context);

            return enhancedResult;

        } catch (error) {
            console.error('Guardian analysis failed:', error);
            return this.createFallbackAnalysis(
                `Analysis failed: ${error}`,
                context,
                startTime
            );
        }
    }

    /**
     * Build analysis prompt for guardian
     */
    private buildAnalysisPrompt(context: AnalysisContext): GuardianAnalysisPrompt {
        const { change, goal } = context;

        // Generate diff
        const diff = this.generateDiff(change);

        return {
            goal: {
                title: goal.title,
                description: goal.description,
                scope: goal.scope,
                constraints: goal.constraints
            },
            change: {
                filePath: change.filePath,
                fileName: change.fileName,
                diff,
                changeType: change.changeType
            },
            codingModel: context.detectedCodingModel,
            context: {
                recentChanges: context.recentChanges?.map(c => `${c.fileName} (${c.changeType})`),
                previousAnalysis: this.getPreviousAnalysisForFile(change.filePath)
            }
        };
    }

    /**
     * Generate unified diff from change
     */
    private generateDiff(change: CodeChange): string {
        const beforeLines = change.beforeContent.split('\n');
        const afterLines = change.afterContent.split('\n');

        let diff = `--- ${change.fileName}\n+++ ${change.fileName}\n`;
        diff += `@@ -1,${beforeLines.length} +1,${afterLines.length} @@\n`;

        const maxLines = Math.max(beforeLines.length, afterLines.length);
        for (let i = 0; i < maxLines; i++) {
            const beforeLine = beforeLines[i];
            const afterLine = afterLines[i];

            if (beforeLine === afterLine) {
                diff += ` ${beforeLine || ''}\n`;
            } else {
                if (beforeLine !== undefined) {
                    diff += `-${beforeLine}\n`;
                }
                if (afterLine !== undefined) {
                    diff += `+${afterLine}\n`;
                }
            }
        }

        return diff;
    }

    /**
     * Enhance analysis with additional heuristic checks
     */
    private enhanceAnalysis(
        result: GuardianAnalysisResult,
        context: AnalysisContext
    ): GuardianAnalysisResult {
        const enhanced = { ...result };

        // Check 1: Scope violation
        if (context.goal.scope.length > 0) {
            const inScope = this.checkScope(context.change.filePath, context.goal.scope);
            if (!inScope) {
                enhanced.deviations.push({
                    type: 'scope_violation',
                    severity: 'high',
                    description: `File ${context.change.filePath} is outside allowed scope: ${context.goal.scope.join(', ')}`,
                    suggestion: 'Remove this file from the change or update goal scope'
                });
                enhanced.riskLevel = 'high';
                enhanced.aligned = false;
            }
        }

        // Check 2: Reversal detection (enhanced from ChangeStorageService)
        if (context.change.flags.isReversal) {
            enhanced.deviations.push({
                type: 'reversal',
                severity: 'medium',
                description: `This change reverses previous work (target: ${context.change.flags.reversalTargetId})`,
                suggestion: 'Review if reversal is intentional or indicates AI confusion'
            });
            enhanced.riskLevel = this.escalateRisk(enhanced.riskLevel);
        }

        // Check 3: Suspicious patterns
        const suspiciousPatterns = this.detectSuspiciousPatterns(context.change);
        if (suspiciousPatterns.length > 0) {
            suspiciousPatterns.forEach(pattern => {
                enhanced.deviations.push(pattern);
            });
            enhanced.riskLevel = 'high';
            enhanced.aligned = false;
        }

        return enhanced;
    }

    /**
     * Check if file path matches scope patterns (glob patterns)
     */
    private checkScope(filePath: string, scopePatterns: string[]): boolean {
        if (scopePatterns.length === 0) {return true;} // No scope restrictions

        const normalized = filePath.replace(/\\/g, '/');

        for (const pattern of scopePatterns) {
            const regex = this.globToRegex(pattern);
            if (regex.test(normalized)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Convert glob pattern to regex
     */
    private globToRegex(pattern: string): RegExp {
        const escaped = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');

        return new RegExp(`^${escaped}$`, 'i');
    }

    /**
     * Detect suspicious patterns in code changes
     */
    private detectSuspiciousPatterns(change: CodeChange): GuardianAnalysisResult['deviations'] {
        const deviations: GuardianAnalysisResult['deviations'] = [];
        const content = change.afterContent.toLowerCase();

        // Pattern 1: Secrets or API keys
        const secretPatterns = [
            /api[_-]?key\s*=\s*['"][^'"]+['"]/i,
            /password\s*=\s*['"][^'"]+['"]/i,
            /secret\s*=\s*['"][^'"]+['"]/i,
            /token\s*=\s*['"][^'"]+['"]/i
        ];

        for (const pattern of secretPatterns) {
            if (pattern.test(change.afterContent)) {
                deviations.push({
                    type: 'suspicious_pattern',
                    severity: 'high',
                    description: 'Potential hardcoded secret or API key detected',
                    suggestion: 'Use environment variables or secure secret management'
                });
                break;
            }
        }

        // Pattern 2: Deleting tests
        if (change.changeType === 'delete' &&
            (change.fileName.includes('test') || change.fileName.includes('spec'))) {
            deviations.push({
                type: 'suspicious_pattern',
                severity: 'high',
                description: 'Test file deletion detected',
                suggestion: 'Verify if test deletion is intentional'
            });
        }

        // Pattern 3: Disabled security features
        if (content.includes('disable') || content.includes('skip')) {
            if (content.includes('auth') || content.includes('security') || content.includes('validation')) {
                deviations.push({
                    type: 'suspicious_pattern',
                    severity: 'high',
                    description: 'Possible security feature bypass detected',
                    suggestion: 'Review security implications carefully'
                });
            }
        }

        // Pattern 4: External connections
        if (content.includes('fetch(') || content.includes('axios') || content.includes('http.request')) {
            const hasExternalUrl = /https?:\/\/[^\s'"]+/.test(change.afterContent);
            if (hasExternalUrl) {
                deviations.push({
                    type: 'suspicious_pattern',
                    severity: 'medium',
                    description: 'External HTTP request detected',
                    suggestion: 'Verify external endpoint is expected and secure'
                });
            }
        }

        return deviations;
    }

    /**
     * Escalate risk level
     */
    private escalateRisk(current: 'low' | 'medium' | 'high'): 'low' | 'medium' | 'high' {
        if (current === 'low') {return 'medium';}
        if (current === 'medium') {return 'high';}
        return 'high';
    }

    /**
     * Get previous analysis for file
     */
    private getPreviousAnalysisForFile(filePath: string): string[] {
        const results: string[] = [];

        for (const [id, analysis] of this.analysisHistory.entries()) {
            if (id.includes(filePath)) {
                results.push(`${analysis.aligned ? '✅' : '⚠️'} ${analysis.reasoning.substring(0, 100)}...`);
            }
        }

        return results.slice(-3); // Last 3 analyses
    }

    /**
     * Generate cache key
     */
    private generateCacheKey(context: AnalysisContext): string {
        const hash = Buffer.from(
            context.change.filePath +
            context.change.timestamp +
            context.goal.id
        ).toString('base64');

        return `analysis_${hash}`;
    }

    /**
     * Create fallback analysis when provider fails
     */
    private createFallbackAnalysis(
        reason: string,
        context: AnalysisContext,
        startTime: number
    ): GuardianAnalysisResult {
        return {
            aligned: false,
            confidence: 0.0,
            reasoning: `⚠️ Guardian analysis unavailable: ${reason}. Manual review recommended.`,
            riskLevel: 'high',
            deviations: [{
                type: 'suspicious_pattern',
                severity: 'high',
                description: 'Guardian analysis failed - manual review required',
                suggestion: 'Configure AI provider in settings or review change manually'
            }],
            metadata: {
                guardianModel: 'fallback',
                analysisTime: Date.now() - startTime,
                timestamp: Date.now()
            }
        };
    }

    /**
     * Log analysis result
     */
    private logAnalysisResult(result: GuardianAnalysisResult, context: AnalysisContext): void {
        const status = result.aligned ? '✅ ALIGNED' : '⚠️ DEVIATION';
        const risk = result.riskLevel.toUpperCase();

        console.log(`\n🛡️ GUARDIAN ANALYSIS COMPLETE`);
        console.log(`File: ${context.change.fileName}`);
        console.log(`Status: ${status}`);
        console.log(`Risk: ${risk}`);
        console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
        console.log(`Guardian: ${result.metadata.guardianModel}`);
        console.log(`Deviations: ${result.deviations.length}`);

        if (result.deviations.length > 0) {
            console.log(`\nDeviations:`);
            result.deviations.forEach((dev, i) => {
                console.log(`  ${i + 1}. [${dev.severity.toUpperCase()}] ${dev.type}: ${dev.description}`);
            });
        }

        console.log(`\nReasoning: ${result.reasoning.substring(0, 200)}...`);
        console.log(`\n${'='.repeat(80)}\n`);
    }

    /**
     * Get analysis history
     */
    public getAnalysisHistory(): Map<string, GuardianAnalysisResult> {
        return this.analysisHistory;
    }

    /**
     * Clear analysis history
     */
    public clearHistory(): void {
        this.analysisHistory.clear();
    }
}
