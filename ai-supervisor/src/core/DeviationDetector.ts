import { EventEmitter } from 'events';
import {
  CodeChange,
  Deviation,
  DeviationType,
  DeviationDetectorConfig,
  DetectionContext,
  DetectionRule,
  DetectionStrategy,
} from '../types';
import { ReversalDetector } from '../analysis/ReversalDetector';
import { ScopeValidator } from '../analysis/ScopeValidator';
import { SupervisorDatabase } from '../storage/Database';

/**
 * DeviationDetector - Main detection engine for AI supervision
 *
 * This is the central orchestration point for all deviation detection:
 * - Coordinates multiple detection strategies
 * - Manages detection rules and patterns
 * - Emits events for detected deviations
 * - Ensures fast detection (<100ms requirement)
 * - Supports pluggable detection strategies
 *
 * Features:
 * - Code reversal detection (full, partial, circular, semantic)
 * - Scope violation detection (path-based, constraint-based)
 * - Custom rule-based detection (extensible pattern matching)
 * - Unauthorized action detection (dangerous operations)
 * - Semantic drift detection (goal alignment)
 * - Event emission for real-time alerts
 * - Performance monitoring and metrics
 *
 * @example
 * ```typescript
 * const detector = new DeviationDetector(database, config);
 *
 * // Listen for deviations
 * detector.on('deviation', (deviation) => {
 *   console.log(`${deviation.severity}: ${deviation.message}`);
 * });
 *
 * // Analyze a code change
 * const deviations = await detector.analyzeChange(change, context);
 * ```
 */
export class DeviationDetector extends EventEmitter {
  private db: SupervisorDatabase;
  private config: DeviationDetectorConfig;
  private reversalDetector: ReversalDetector;
  private scopeValidator: ScopeValidator;
  private customStrategies: Map<string, DetectionStrategy>;
  private customRules: DetectionRule[];
  private performanceMetrics: {
    totalAnalyses: number;
    averageTimeMs: number;
    slowestTimeMs: number;
  };

  /**
   * Create a new DeviationDetector
   *
   * @param db - Database instance for persistence
   * @param config - Configuration for deviation detection
   *
   * @example
   * ```typescript
   * const detector = new DeviationDetector(database, {
   *   reversalDetection: {
   *     similarityThreshold: 0.85,
   *     timeWindowMs: 3600000,
   *     minSignificantLines: 5,
   *     detectPartialReversals: true
   *   },
   *   scopeValidation: {
   *     strictness: 'normal',
   *     useSemanticAnalysis: false
   *   },
   *   maxProcessingTimeMs: 100,
   *   emitEvents: true
   * });
   * ```
   */
  constructor(db: SupervisorDatabase, config: Partial<DeviationDetectorConfig> = {}) {
    super();
    this.db = db;

    this.config = {
      reversalDetection: {
        similarityThreshold: config.reversalDetection?.similarityThreshold ?? 0.85,
        timeWindowMs: config.reversalDetection?.timeWindowMs ?? 3600000,
        minSignificantLines: config.reversalDetection?.minSignificantLines ?? 5,
        detectPartialReversals: config.reversalDetection?.detectPartialReversals ?? true,
      },
      scopeValidation: {
        strictness: config.scopeValidation?.strictness ?? 'normal',
        useSemanticAnalysis: config.scopeValidation?.useSemanticAnalysis ?? false,
        customPathMatchers: config.scopeValidation?.customPathMatchers ?? [],
      },
      customRules: config.customRules ?? [],
      maxProcessingTimeMs: config.maxProcessingTimeMs ?? 100,
      emitEvents: config.emitEvents ?? true,
    };

    this.reversalDetector = new ReversalDetector(this.config.reversalDetection);
    this.scopeValidator = new ScopeValidator(this.config.scopeValidation);
    this.customStrategies = new Map();
    this.customRules = this.config.customRules ?? [];

    this.performanceMetrics = {
      totalAnalyses: 0,
      averageTimeMs: 0,
      slowestTimeMs: 0,
    };
  }

  /**
   * Analyze a code change for deviations
   *
   * This is the main entry point for deviation detection. It runs all
   * applicable detection strategies and returns all detected deviations.
   *
   * @param change - Code change to analyze
   * @param context - Detection context with history and scope
   * @returns Promise resolving to array of detected deviations
   *
   * @example
   * ```typescript
   * const context = {
   *   history: previousChanges,
   *   scope: projectScope
   * };
   *
   * const deviations = await detector.analyzeChange(change, context);
   * deviations.forEach(dev => {
   *   if (dev.severity === 'critical') {
   *     haltExecution();
   *   }
   * });
   * ```
   */
  public async analyzeChange(
    change: CodeChange,
    context: DetectionContext
  ): Promise<Deviation[]> {
    const startTime = Date.now();
    const deviations: Deviation[] = [];

    try {
      // Get recent changes from database if context.history is not provided
      const history = context.history.length > 0
        ? context.history
        : this.db.getCodeChanges(change.filePath, 10);

      // 1. Check for code reversals
      const reversalDeviation = this.reversalDetector.detectReversal(history, change);
      if (reversalDeviation) {
        deviations.push(reversalDeviation);
        this.db.insertDeviation(reversalDeviation);
      }

      // 2. Check for circular edits
      const circularDeviation = this.reversalDetector.detectCircularEdits(
        [...history, change],
        change.filePath
      );
      if (circularDeviation) {
        deviations.push(circularDeviation);
        this.db.insertDeviation(circularDeviation);
      }

      // 3. Check for contradictions
      const contradictionContext = { ...context, history };
      const contradictionDeviation = this.reversalDetector.detectContradiction(
        contradictionContext,
        change
      );
      if (contradictionDeviation) {
        deviations.push(contradictionDeviation);
        this.db.insertDeviation(contradictionDeviation);
      }

      // 4. Check for semantic reversals
      const semanticReversalDeviation = this.reversalDetector.detectSemanticReversal(
        [...history, change],
        change.filePath
      );
      if (semanticReversalDeviation) {
        deviations.push(semanticReversalDeviation);
        this.db.insertDeviation(semanticReversalDeviation);
      }

      // 5. Validate scope (if scope is defined)
      if (context.scope) {
        const scopeDeviation = this.scopeValidator.validateChange(change, context.scope);
        if (scopeDeviation) {
          deviations.push(scopeDeviation);
          this.db.insertDeviation(scopeDeviation);
        }
      }

      // 6. Apply custom rules
      const ruleDeviations = this.applyCustomRules(change, context);
      ruleDeviations.forEach(dev => {
        deviations.push(dev);
        this.db.insertDeviation(dev);
      });

      // 7. Run custom strategies
      const strategyDeviations = await this.runCustomStrategies(change, context);
      strategyDeviations.forEach(dev => {
        deviations.push(dev);
        this.db.insertDeviation(dev);
      });

      // Emit events for detected deviations
      if (this.config.emitEvents) {
        deviations.forEach(deviation => {
          this.emit('deviation', deviation);
        });
      }

      // Track performance
      const elapsed = Date.now() - startTime;
      this.updatePerformanceMetrics(elapsed);

      // Warn if processing took too long
      if (elapsed > this.config.maxProcessingTimeMs) {
        console.warn(
          `DeviationDetector exceeded time budget: ${elapsed}ms (limit: ${this.config.maxProcessingTimeMs}ms)`
        );
        this.emit('performance_warning', {
          elapsed,
          limit: this.config.maxProcessingTimeMs,
          change: change.filePath,
        });
      }

      return deviations;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Apply custom detection rules
   *
   * @param change - Code change to analyze
   * @param context - Detection context
   * @returns Array of deviations from rule violations
   */
  private applyCustomRules(change: CodeChange, context: DetectionContext): Deviation[] {
    const deviations: Deviation[] = [];

    for (const rule of this.customRules) {
      try {
        const matches = rule.matcher(change, context);

        if (matches) {
          const message = rule.messageGenerator
            ? rule.messageGenerator(change, context)
            : `Rule violation: ${rule.description}`;

          deviations.push({
            id: this.generateRuleId(rule.id),
            type: rule.type,
            severity: rule.severity,
            message,
            affectedFiles: [change.filePath],
            timestamp: new Date(),
            metadata: {
              ruleId: rule.id,
              ruleName: rule.name,
              ruleDescription: rule.description,
            },
            suggestedAction: `Review and fix violation of rule: ${rule.name}`,
          });
        }
      } catch (error) {
        console.error(`Error applying rule ${rule.id}:`, error);
      }
    }

    return deviations;
  }

  /**
   * Run custom detection strategies
   *
   * @param change - Code change to analyze
   * @param context - Detection context
   * @returns Promise resolving to array of deviations
   */
  private async runCustomStrategies(
    change: CodeChange,
    context: DetectionContext
  ): Promise<Deviation[]> {
    const deviations: Deviation[] = [];

    for (const [name, strategy] of this.customStrategies) {
      try {
        const strategyDeviations = await strategy.detect(change, context);
        deviations.push(...strategyDeviations);
      } catch (error) {
        console.error(`Error running strategy ${name}:`, error);
      }
    }

    return deviations;
  }

  /**
   * Register a custom detection strategy
   *
   * @param strategy - Detection strategy to register
   *
   * @example
   * ```typescript
   * const customStrategy: DetectionStrategy = {
   *   name: 'security-checker',
   *   async detect(change, context) {
   *     if (change.after.includes('eval(')) {
   *       return [{
   *         id: 'security_001',
   *         type: DeviationType.UNAUTHORIZED_ACTION,
   *         severity: 'critical',
   *         message: 'Use of eval() detected - security risk',
   *         affectedFiles: [change.filePath],
   *         timestamp: new Date()
   *       }];
   *     }
   *     return [];
   *   }
   * };
   *
   * detector.registerStrategy(customStrategy);
   * ```
   */
  public registerStrategy(strategy: DetectionStrategy): void {
    this.customStrategies.set(strategy.name, strategy);
  }

  /**
   * Unregister a custom detection strategy
   *
   * @param name - Name of strategy to remove
   */
  public unregisterStrategy(name: string): void {
    this.customStrategies.delete(name);
  }

  /**
   * Add a custom detection rule
   *
   * @param rule - Detection rule to add
   *
   * @example
   * ```typescript
   * const noConsoleRule: DetectionRule = {
   *   id: 'no-console',
   *   name: 'No Console Statements',
   *   description: 'Prevent console.log in production code',
   *   type: DeviationType.PATTERN_VIOLATION,
   *   severity: 'low',
   *   matcher: (change) => /console\.(log|warn|error)/.test(change.after),
   *   messageGenerator: (change) => `Console statement found in ${change.filePath}`
   * };
   *
   * detector.addRule(noConsoleRule);
   * ```
   */
  public addRule(rule: DetectionRule): void {
    this.customRules.push(rule);
  }

  /**
   * Remove a custom detection rule
   *
   * @param ruleId - ID of rule to remove
   */
  public removeRule(ruleId: string): void {
    this.customRules = this.customRules.filter(r => r.id !== ruleId);
  }

  /**
   * Get all registered detection rules
   *
   * @returns Array of detection rules
   */
  public getRules(): DetectionRule[] {
    return [...this.customRules];
  }

  /**
   * Get all registered strategies
   *
   * @returns Array of strategy names
   */
  public getStrategies(): string[] {
    return Array.from(this.customStrategies.keys());
  }

  /**
   * Get all detected deviations from database
   *
   * @param type - Optional filter by deviation type
   * @param limit - Optional limit on number of results
   * @returns Array of deviations
   */
  public getDeviations(type?: string, limit?: number): Deviation[] {
    return this.db.getDeviations(type, limit);
  }

  /**
   * Get deviations by severity
   *
   * @param severity - Severity level to filter by
   * @returns Array of deviations with specified severity
   */
  public getDeviationsBySeverity(severity: string): Deviation[] {
    const allDeviations = this.db.getDeviations();
    return allDeviations.filter(d => d.severity === severity);
  }

  /**
   * Get high-priority deviations that need immediate attention
   *
   * @returns Array of critical deviations
   */
  public getCriticalDeviations(): Deviation[] {
    return this.getDeviationsBySeverity('critical');
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(elapsed: number): void {
    this.performanceMetrics.totalAnalyses++;
    this.performanceMetrics.averageTimeMs =
      (this.performanceMetrics.averageTimeMs * (this.performanceMetrics.totalAnalyses - 1) +
        elapsed) /
      this.performanceMetrics.totalAnalyses;
    this.performanceMetrics.slowestTimeMs = Math.max(
      this.performanceMetrics.slowestTimeMs,
      elapsed
    );
  }

  /**
   * Get performance metrics
   *
   * @returns Performance statistics
   */
  public getPerformanceMetrics(): {
    totalAnalyses: number;
    averageTimeMs: number;
    slowestTimeMs: number;
  } {
    return { ...this.performanceMetrics };
  }

  /**
   * Reset performance metrics
   */
  public resetPerformanceMetrics(): void {
    this.performanceMetrics = {
      totalAnalyses: 0,
      averageTimeMs: 0,
      slowestTimeMs: 0,
    };
  }

  /**
   * Generate unique rule-based deviation ID
   */
  private generateRuleId(ruleId: string): string {
    return `rule_${ruleId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Create default detection rules for common patterns
   *
   * @returns Array of default rules
   */
  public static createDefaultRules(): DetectionRule[] {
    return [
      // No eval() usage
      {
        id: 'no-eval',
        name: 'No eval() Usage',
        description: 'Prevent use of eval() for security',
        type: DeviationType.UNAUTHORIZED_ACTION,
        severity: 'critical',
        matcher: (change) => /\beval\s*\(/.test(change.after) && !/\beval\s*\(/.test(change.before),
      },

      // No TODO comments in production
      {
        id: 'no-todo',
        name: 'No TODO Comments',
        description: 'Prevent TODO comments from being committed',
        type: DeviationType.PATTERN_VIOLATION,
        severity: 'low',
        matcher: (change) => /\/\/\s*TODO/i.test(change.after) && !/\/\/\s*TODO/i.test(change.before),
      },

      // No hardcoded credentials
      {
        id: 'no-credentials',
        name: 'No Hardcoded Credentials',
        description: 'Prevent hardcoded passwords/API keys',
        type: DeviationType.UNAUTHORIZED_ACTION,
        severity: 'critical',
        matcher: (change) => {
          const patterns = [
            /password\s*=\s*['"][^'"]+['"]/i,
            /api[_-]?key\s*=\s*['"][^'"]+['"]/i,
            /secret\s*=\s*['"][^'"]+['"]/i,
          ];
          return patterns.some(p => p.test(change.after) && !p.test(change.before));
        },
      },

      // Large file changes (potential issue)
      {
        id: 'large-change',
        name: 'Large Code Change',
        description: 'Flag very large code changes for review',
        type: DeviationType.PATTERN_VIOLATION,
        severity: 'medium',
        matcher: (change) => {
          const linesBefore = change.before.split('\n').length;
          const linesAfter = change.after.split('\n').length;
          const delta = Math.abs(linesAfter - linesBefore);
          return delta > 500;
        },
        messageGenerator: (change) => {
          const delta = Math.abs(
            change.after.split('\n').length - change.before.split('\n').length
          );
          return `Very large change detected: ${delta} lines modified in ${change.filePath}`;
        },
      },
    ];
  }

  /**
   * Get configuration
   *
   * @returns Current detector configuration
   */
  public getConfig(): DeviationDetectorConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   *
   * @param config - Partial configuration to update
   */
  public updateConfig(config: Partial<DeviationDetectorConfig>): void {
    this.config = { ...this.config, ...config };

    // Update dependent detectors
    if (config.reversalDetection) {
      this.reversalDetector = new ReversalDetector(this.config.reversalDetection);
    }

    if (config.scopeValidation) {
      this.scopeValidator = new ScopeValidator(this.config.scopeValidation);
    }

    if (config.customRules) {
      this.customRules = config.customRules;
    }
  }
}
