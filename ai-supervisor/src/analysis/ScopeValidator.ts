import { ProjectScope, CodeChange, Deviation, DeviationType, ScopeValidationConfig, PathMatcher, DetectionContext } from '../types';

/**
 * ScopeValidator - Validates that code changes align with defined goals and scope
 *
 * This class provides comprehensive scope and goal validation:
 * - Path-based validation (allowed/blocked file patterns)
 * - Constraint enforcement (architectural rules, prohibited operations)
 * - Goal alignment checking (changes match stated objectives)
 * - Unauthorized action detection (dangerous operations)
 * - Semantic analysis for complex validations
 *
 * Validation strategies:
 * - Glob pattern matching for paths
 * - Regex matching for complex patterns
 * - Heuristic-based operation detection
 * - Optional semantic analysis (slower but more accurate)
 *
 * @example
 * ```typescript
 * const validator = new ScopeValidator({ strictness: 'strict' });
 * const scope: ProjectScope = {
 *   goals: ['Refactor auth module'],
 *   allowedPaths: ['src/auth/**'],
 *   prohibitedOperations: ['file_deletion', 'external_api']
 * };
 * const deviation = validator.validateChange(change, scope);
 * ```
 */
export class ScopeValidator {
  private config: ScopeValidationConfig;

  /**
   * Create a new ScopeValidator
   *
   * @param config - Configuration for scope validation
   */
  constructor(config: Partial<ScopeValidationConfig> = {}) {
    this.config = {
      strictness: config.strictness ?? 'normal',
      useSemanticAnalysis: config.useSemanticAnalysis ?? false,
      customPathMatchers: config.customPathMatchers ?? [],
    };
  }

  /**
   * Validate if a code change aligns with the project scope
   *
   * @param change - Code change to validate
   * @param scope - Project scope definition
   * @returns Deviation if validation fails, null if valid
   *
   * @example
   * ```typescript
   * const deviation = validator.validateChange(change, projectScope);
   * if (deviation) {
   *   console.log(`Scope violation: ${deviation.message}`);
   * }
   * ```
   */
  public validateChange(change: CodeChange, scope: ProjectScope): Deviation | null {
    // Check path-based scope
    const pathViolation = this.validatePath(change.filePath, scope);
    if (pathViolation) {
      return pathViolation;
    }

    // Check prohibited operations
    const operationViolation = this.validateOperations(change, scope);
    if (operationViolation) {
      return operationViolation;
    }

    // Check architectural constraints
    const constraintViolation = this.validateConstraints(change, scope);
    if (constraintViolation) {
      return constraintViolation;
    }

    // Semantic analysis (if enabled and goals defined)
    if (this.config.useSemanticAnalysis && scope.goals.length > 0) {
      const semanticViolation = this.validateSemanticAlignment(change, scope);
      if (semanticViolation) {
        return semanticViolation;
      }
    }

    return null;
  }

  /**
   * Validate if a file path is within allowed scope
   *
   * @param filePath - Path to validate
   * @param scope - Project scope
   * @returns Deviation if path is blocked or outside allowed scope, null otherwise
   */
  private validatePath(filePath: string, scope: ProjectScope): Deviation | null {
    // Check blocked paths first
    if (scope.blockedPaths && scope.blockedPaths.length > 0) {
      for (const blockedPattern of scope.blockedPaths) {
        if (this.matchesPattern(filePath, blockedPattern)) {
          return {
            id: this.generateId(),
            type: DeviationType.SCOPE_VIOLATION,
            severity: 'high',
            message: `File modification blocked: ${filePath} matches blocked pattern "${blockedPattern}"`,
            affectedFiles: [filePath],
            timestamp: new Date(),
            metadata: {
              blockedPattern,
              reason: 'File is in blocked path list',
            },
            suggestedAction: `File ${filePath} is explicitly blocked. Verify this change is necessary and remove from blocked paths if appropriate.`,
          };
        }
      }
    }

    // Check custom matchers
    for (const matcher of this.config.customPathMatchers ?? []) {
      const matches = matcher.isRegex
        ? new RegExp(matcher.pattern).test(filePath)
        : this.matchesPattern(filePath, matcher.pattern);

      if (matches && !matcher.allowed) {
        return {
          id: this.generateId(),
          type: DeviationType.SCOPE_VIOLATION,
          severity: 'medium',
          message: `File modification violates custom rule: ${filePath} (${matcher.reason || 'No reason specified'})`,
          affectedFiles: [filePath],
          timestamp: new Date(),
          metadata: {
            matcherPattern: matcher.pattern,
            matcherReason: matcher.reason,
          },
          suggestedAction: matcher.reason || 'Review custom path matching rules',
        };
      }
    }

    // Check allowed paths (if defined)
    if (scope.allowedPaths && scope.allowedPaths.length > 0) {
      const isAllowed = scope.allowedPaths.some(pattern => this.matchesPattern(filePath, pattern));

      if (!isAllowed) {
        const severity = this.config.strictness === 'strict' ? 'high' : 'medium';

        return {
          id: this.generateId(),
          type: DeviationType.SCOPE_VIOLATION,
          severity,
          message: `File modification outside defined scope: ${filePath}`,
          affectedFiles: [filePath],
          timestamp: new Date(),
          metadata: {
            allowedPaths: scope.allowedPaths,
            strictness: this.config.strictness,
          },
          suggestedAction: `File is outside allowed paths: ${scope.allowedPaths.join(', ')}. Verify necessity or update project scope.`,
        };
      }
    }

    return null;
  }

  /**
   * Validate that change doesn't perform prohibited operations
   *
   * @param change - Code change to validate
   * @param scope - Project scope
   * @returns Deviation if prohibited operation detected, null otherwise
   */
  private validateOperations(change: CodeChange, scope: ProjectScope): Deviation | null {
    if (!scope.prohibitedOperations || scope.prohibitedOperations.length === 0) {
      return null;
    }

    for (const operation of scope.prohibitedOperations) {
      const violation = this.checkProhibitedOperation(change, operation);
      if (violation) {
        return violation;
      }
    }

    return null;
  }

  /**
   * Check for specific prohibited operation
   */
  private checkProhibitedOperation(change: CodeChange, operation: string): Deviation | null {
    const op = operation.toLowerCase();

    // File deletion detection
    if (op.includes('deletion') || op.includes('delete')) {
      if (this.isSignificantDeletion(change)) {
        return {
          id: this.generateId(),
          type: DeviationType.UNAUTHORIZED_ACTION,
          severity: 'high',
          message: `Significant code deletion detected in ${change.filePath}, but deletions are prohibited`,
          affectedFiles: [change.filePath],
          timestamp: new Date(),
          metadata: {
            prohibitedOperation: operation,
            deletionPercentage: this.calculateDeletionPercentage(change),
          },
          suggestedAction: 'Deletions are not allowed in this project. Restore removed code or get explicit permission.',
        };
      }
    }

    // External API calls
    if (op.includes('api') || op.includes('external') || op.includes('http')) {
      if (this.hasExternalApiCall(change)) {
        return {
          id: this.generateId(),
          type: DeviationType.UNAUTHORIZED_ACTION,
          severity: 'critical',
          message: `External API call detected in ${change.filePath}, but external calls are prohibited`,
          affectedFiles: [change.filePath],
          timestamp: new Date(),
          metadata: {
            prohibitedOperation: operation,
            detectedPatterns: this.getApiCallPatterns(change),
          },
          suggestedAction: 'Remove external API calls or get explicit permission to make network requests.',
        };
      }
    }

    // Database operations
    if (op.includes('database') || op.includes('db') || op.includes('sql')) {
      if (this.hasDatabaseOperation(change)) {
        return {
          id: this.generateId(),
          type: DeviationType.UNAUTHORIZED_ACTION,
          severity: 'high',
          message: `Database operation detected in ${change.filePath}, but database access is prohibited`,
          affectedFiles: [change.filePath],
          timestamp: new Date(),
          metadata: {
            prohibitedOperation: operation,
          },
          suggestedAction: 'Database operations are not allowed. Use designated data access layer.',
        };
      }
    }

    // File system operations
    if (op.includes('filesystem') || op.includes('fs') || op.includes('file_write')) {
      if (this.hasFileSystemOperation(change)) {
        return {
          id: this.generateId(),
          type: DeviationType.UNAUTHORIZED_ACTION,
          severity: 'medium',
          message: `File system operation detected in ${change.filePath}, but FS operations are prohibited`,
          affectedFiles: [change.filePath],
          timestamp: new Date(),
          metadata: {
            prohibitedOperation: operation,
          },
          suggestedAction: 'Direct file system operations are not allowed in this scope.',
        };
      }
    }

    return null;
  }

  /**
   * Validate that change aligns with architectural constraints
   */
  private validateConstraints(change: CodeChange, scope: ProjectScope): Deviation | null {
    if (!scope.constraints || scope.constraints.length === 0) {
      return null;
    }

    for (const constraint of scope.constraints) {
      const violation = this.checkConstraint(change, constraint);
      if (violation) {
        return violation;
      }
    }

    return null;
  }

  /**
   * Check specific architectural constraint
   */
  private checkConstraint(change: CodeChange, constraint: string): Deviation | null {
    const lower = constraint.toLowerCase();

    // No dependencies constraint
    if (lower.includes('no_dependencies') || lower.includes('no_imports')) {
      if (this.hasNewDependencies(change)) {
        return {
          id: this.generateId(),
          type: DeviationType.PATTERN_VIOLATION,
          severity: 'medium',
          message: `New dependencies detected in ${change.filePath}, violating constraint: "${constraint}"`,
          affectedFiles: [change.filePath],
          timestamp: new Date(),
          metadata: { constraint },
          suggestedAction: 'Remove new import statements or update project constraints.',
        };
      }
    }

    // Type safety constraints
    if (lower.includes('type_safety') || lower.includes('no_any')) {
      if (this.hasTypeViolations(change)) {
        return {
          id: this.generateId(),
          type: DeviationType.PATTERN_VIOLATION,
          severity: 'low',
          message: `Type safety violation detected in ${change.filePath}: use of 'any' type`,
          affectedFiles: [change.filePath],
          timestamp: new Date(),
          metadata: { constraint },
          suggestedAction: 'Replace "any" types with specific type definitions.',
        };
      }
    }

    return null;
  }

  /**
   * Validate semantic alignment with project goals
   * (Only when semantic analysis is enabled)
   */
  private validateSemanticAlignment(change: CodeChange, scope: ProjectScope): Deviation | null {
    // Simple keyword-based semantic check
    // In production, this could use LLM-based analysis
    const changeContent = change.after.toLowerCase();
    const goalKeywords = scope.goals.flatMap(goal =>
      goal.toLowerCase().split(/\s+/).filter(word => word.length > 3)
    );

    // If change content has no overlap with goal keywords, might be drift
    if (goalKeywords.length > 0) {
      const hasRelevance = goalKeywords.some(keyword => changeContent.includes(keyword));

      if (!hasRelevance && this.config.strictness === 'strict') {
        return {
          id: this.generateId(),
          type: DeviationType.SEMANTIC_DRIFT,
          severity: 'low',
          message: `Changes in ${change.filePath} may not align with project goals: ${scope.goals.join(', ')}`,
          affectedFiles: [change.filePath],
          timestamp: new Date(),
          metadata: {
            goals: scope.goals,
            reason: change.reason,
          },
          suggestedAction: 'Verify that this change supports the defined project goals.',
        };
      }
    }

    return null;
  }

  /**
   * Match file path against pattern (supports glob-style wildcards)
   */
  private matchesPattern(filePath: string, pattern: string): boolean {
    // Normalize paths
    const normalizedPath = filePath.replace(/\\/g, '/');
    const normalizedPattern = pattern.replace(/\\/g, '/');

    // Exact match
    if (normalizedPath === normalizedPattern) return true;

    // Directory prefix match (e.g., "src/" matches "src/foo/bar.ts")
    if (normalizedPattern.endsWith('/') && normalizedPath.startsWith(normalizedPattern)) {
      return true;
    }

    // Wildcard patterns (glob-style)
    if (normalizedPattern.includes('*')) {
      const regexPattern = normalizedPattern
        .replace(/\./g, '\\.')
        .replace(/\*\*/g, '%%%DOUBLESTAR%%%')
        .replace(/\*/g, '[^/]*')
        .replace(/%%%DOUBLESTAR%%%/g, '.*');

      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(normalizedPath);
    }

    return false;
  }

  /**
   * Check if change represents significant deletion
   */
  private isSignificantDeletion(change: CodeChange): boolean {
    const beforeLines = change.before.split('\n').filter(l => l.trim()).length;
    const afterLines = change.after.split('\n').filter(l => l.trim()).length;

    // Significant if more than 50% of non-empty lines removed
    return beforeLines > 0 && afterLines < beforeLines * 0.5;
  }

  /**
   * Calculate percentage of code deleted
   */
  private calculateDeletionPercentage(change: CodeChange): number {
    const beforeLen = change.before.length;
    const afterLen = change.after.length;

    if (beforeLen === 0) return 0;
    return ((beforeLen - afterLen) / beforeLen) * 100;
  }

  /**
   * Detect external API calls in code changes
   */
  private hasExternalApiCall(change: CodeChange): boolean {
    const apiPatterns = [
      /fetch\s*\(/,
      /axios\./,
      /http\s*\.\s*(get|post|put|delete|patch)/i,
      /XMLHttpRequest/,
      /\.request\s*\(/,
      /@(Get|Post|Put|Delete|Patch)\(/,
    ];

    const addedContent = this.getAddedContent(change);
    return apiPatterns.some(pattern => pattern.test(addedContent));
  }

  /**
   * Get patterns detected for API calls
   */
  private getApiCallPatterns(change: CodeChange): string[] {
    const patterns = ['fetch', 'axios', 'http', 'XMLHttpRequest'];
    const addedContent = this.getAddedContent(change);

    return patterns.filter(p => addedContent.toLowerCase().includes(p));
  }

  /**
   * Detect database operations
   */
  private hasDatabaseOperation(change: CodeChange): boolean {
    const dbPatterns = [
      /\.(query|execute)\s*\(/,
      /SELECT\s+.*FROM/i,
      /INSERT\s+INTO/i,
      /UPDATE\s+.*SET/i,
      /DELETE\s+FROM/i,
      /CREATE\s+TABLE/i,
      /mongoose\./,
      /sequelize\./,
    ];

    const addedContent = this.getAddedContent(change);
    return dbPatterns.some(pattern => pattern.test(addedContent));
  }

  /**
   * Detect file system operations
   */
  private hasFileSystemOperation(change: CodeChange): boolean {
    const fsPatterns = [
      /fs\.(readFile|writeFile|unlink|mkdir|rmdir)/,
      /require\s*\(\s*['"]fs['"]\s*\)/,
      /import.*from\s+['"]fs['"]/,
    ];

    const addedContent = this.getAddedContent(change);
    return fsPatterns.some(pattern => pattern.test(addedContent));
  }

  /**
   * Check for new import/require statements
   */
  private hasNewDependencies(change: CodeChange): boolean {
    const importPattern = /^import\s+.*from\s+['"]|^const\s+.*=\s*require\(/m;

    const beforeImports = (change.before.match(importPattern) || []).length;
    const afterImports = (change.after.match(importPattern) || []).length;

    return afterImports > beforeImports;
  }

  /**
   * Check for type safety violations (use of 'any')
   */
  private hasTypeViolations(change: CodeChange): boolean {
    const anyPattern = /:\s*any\b/;
    const addedContent = this.getAddedContent(change);

    return anyPattern.test(addedContent);
  }

  /**
   * Extract content that was added (simple approximation)
   */
  private getAddedContent(change: CodeChange): string {
    // Simple approach: if after is longer, get the difference
    if (change.after.length > change.before.length) {
      return change.after;
    }
    return '';
  }

  /**
   * Generate unique deviation ID
   */
  private generateId(): string {
    return `scope_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
