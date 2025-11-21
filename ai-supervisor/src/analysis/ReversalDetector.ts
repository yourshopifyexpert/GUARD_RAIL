import { CodeChange, Deviation, DeviationType, ReversalDetectionConfig, DetectionContext } from '../types';
import { CodeDiffer } from './CodeDiffer';

/**
 * ReversalDetector - Detects when AI undoes previous work
 *
 * This class provides comprehensive code reversal detection:
 * - Full reversals (changing code back to original state)
 * - Partial reversals (undoing some but not all changes)
 * - Circular edits (A -> B -> A -> B patterns indicating confusion)
 * - Contradictory changes (adding then removing same code)
 * - Semantic reversals (removing then re-adding functionality)
 *
 * Detection strategies:
 * - Line-level similarity comparison
 * - Semantic chunk tracking (functions, classes)
 * - Time-window based analysis
 * - Pattern matching for common reversal indicators
 *
 * @example
 * ```typescript
 * const detector = new ReversalDetector({ similarityThreshold: 0.85 });
 * const deviation = detector.detectReversal(history, newChange);
 * if (deviation) {
 *   console.log(`Reversal detected: ${deviation.message}`);
 * }
 * ```
 */
export class ReversalDetector {
  private codeDiffer: CodeDiffer;
  private config: ReversalDetectionConfig;

  /**
   * Create a new ReversalDetector
   *
   * @param config - Configuration for reversal detection
   */
  constructor(config: Partial<ReversalDetectionConfig> = {}) {
    this.codeDiffer = new CodeDiffer();
    this.config = {
      similarityThreshold: config.similarityThreshold ?? 0.85,
      timeWindowMs: config.timeWindowMs ?? 3600000, // 1 hour default
      minSignificantLines: config.minSignificantLines ?? 5,
      detectPartialReversals: config.detectPartialReversals ?? true,
    };
  }

  /**
   * Detect if a new change reverses a previous change
   *
   * @param recentChanges - Array of recent code changes (history)
   * @param newChange - New change to analyze
   * @returns Deviation if reversal detected, null otherwise
   *
   * @example
   * ```typescript
   * const deviation = detector.detectReversal(history, newChange);
   * if (deviation && deviation.severity === 'high') {
   *   alertUser(deviation.message);
   * }
   * ```
   */
  public detectReversal(recentChanges: CodeChange[], newChange: CodeChange): Deviation | null {
    // Filter to changes in same file within time window
    const cutoffTime = new Date(newChange.timestamp.getTime() - this.config.timeWindowMs);
    const relevantChanges = recentChanges.filter(
      change =>
        change.filePath === newChange.filePath &&
        change.timestamp < newChange.timestamp &&
        change.timestamp >= cutoffTime
    );

    if (relevantChanges.length === 0) {
      return null;
    }

    // Check for full reversals (most recent first)
    const sortedChanges = relevantChanges.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const checkLimit = Math.min(5, sortedChanges.length);

    for (let i = 0; i < checkLimit; i++) {
      const previousChange = sortedChanges[i];

      // Check if new change reverts to state before previous change
      const isFullReversal = this.codeDiffer.isReversal(
        previousChange.before,
        previousChange.after,
        newChange.after,
        this.config.similarityThreshold
      );

      if (isFullReversal) {
        const magnitude = this.codeDiffer.calculateChangeMagnitude(newChange.before, newChange.after);

        // Only report significant reversals
        if (magnitude >= this.config.minSignificantLines) {
          const timeDiff = Math.round((newChange.timestamp.getTime() - previousChange.timestamp.getTime()) / 1000 / 60);

          return {
            id: this.generateId(),
            type: DeviationType.CODE_REVERSAL,
            severity: timeDiff < 10 ? 'critical' : 'high',
            message: `Code reversal detected in ${newChange.filePath}: Changes reverted to state from ${timeDiff} minutes ago (${magnitude} lines affected)`,
            affectedFiles: [newChange.filePath],
            timestamp: new Date(),
            metadata: {
              reversedChangeId: previousChange.conversationId,
              timeElapsedMinutes: timeDiff,
              linesAffected: magnitude,
              previousReason: previousChange.reason,
            },
            suggestedAction: `Review why these changes were reversed. Original reason: "${previousChange.reason || 'Not specified'}". Consider if the reversal is intentional.`,
          };
        }
      }

      // Check for partial reversals
      if (this.config.detectPartialReversals) {
        const partialResult = this.codeDiffer.detectPartialReversal(
          previousChange,
          newChange,
          0.5 // 50% threshold for partial reversal
        );

        if (partialResult.isPartialReversal && partialResult.percentageReversed > 0.5) {
          const percentRev = (partialResult.percentageReversed * 100).toFixed(0);

          return {
            id: this.generateId(),
            type: DeviationType.CODE_REVERSAL,
            severity: 'medium',
            message: `Partial reversal detected in ${newChange.filePath}: Approximately ${percentRev}% of previous changes were undone`,
            affectedFiles: [newChange.filePath],
            timestamp: new Date(),
            metadata: {
              reversedChangeId: previousChange.conversationId,
              percentageReversed: partialResult.percentageReversed,
              previousReason: previousChange.reason,
            },
            suggestedAction: `Some changes are being partially undone. Verify this is intentional.`,
          };
        }
      }
    }

    return null;
  }

  /**
   * Detect circular edits (A -> B -> A -> B pattern indicating AI confusion)
   *
   * @param changes - Array of all changes for a file
   * @param filePath - File path to analyze
   * @param minOccurrences - Minimum number of cycles to consider circular (default 2)
   * @returns Deviation if circular pattern detected, null otherwise
   *
   * @example
   * ```typescript
   * const deviation = detector.detectCircularEdits(allChanges, 'src/app.ts');
   * if (deviation) {
   *   console.log('AI is confused - circular edits detected');
   * }
   * ```
   */
  public detectCircularEdits(
    changes: CodeChange[],
    filePath: string,
    minOccurrences: number = 2
  ): Deviation | null {
    const fileChanges = changes
      .filter(c => c.filePath === filePath)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (fileChanges.length < 3) {
      return null;
    }

    // Track state cycles (state A -> state B -> state A)
    const cycles: Array<{ indices: number[]; similarity: number }> = [];

    for (let i = 0; i < fileChanges.length - 2; i++) {
      const stateA = fileChanges[i].after;

      // Look for return to similar state
      for (let j = i + 2; j < fileChanges.length; j++) {
        const stateReturned = fileChanges[j].after;
        const similarity = this.codeDiffer.calculateSimilarity(stateA, stateReturned);

        if (similarity >= this.config.similarityThreshold) {
          cycles.push({
            indices: [i, j],
            similarity,
          });
        }
      }
    }

    // Check if we have multiple cycles (indicating confusion)
    if (cycles.length >= minOccurrences) {
      const affectedIndices = new Set(cycles.flatMap(c => c.indices));

      return {
        id: this.generateId(),
        type: DeviationType.CIRCULAR_EDIT,
        severity: 'critical',
        message: `Circular edit pattern detected in ${filePath}: Code is being repeatedly changed and reverted (${cycles.length} cycles detected). AI may be confused about requirements.`,
        affectedFiles: [filePath],
        timestamp: new Date(),
        metadata: {
          cycleCount: cycles.length,
          affectedChangeCount: affectedIndices.size,
          averageSimilarity: cycles.reduce((sum, c) => sum + c.similarity, 0) / cycles.length,
        },
        suggestedAction: 'STOP: Circular edits detected. Clarify requirements with AI or restart conversation with clearer instructions.',
      };
    }

    return null;
  }

  /**
   * Detect semantic reversals (removing and re-adding specific functions/classes)
   *
   * @param changes - Array of code changes
   * @param filePath - File to analyze
   * @returns Deviation if semantic reversal detected, null otherwise
   */
  public detectSemanticReversal(changes: CodeChange[], filePath: string): Deviation | null {
    const fileChanges = changes
      .filter(c => c.filePath === filePath)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (fileChanges.length < 2) {
      return null;
    }

    // Track semantic chunks across changes
    const removedChunks = new Map<string, { change: CodeChange; chunk: any }>();
    const restoredChunks: Array<{ name: string; type: string; removed: CodeChange; restored: CodeChange }> = [];

    for (const change of fileChanges) {
      const beforeChunks = this.codeDiffer.extractSemanticChunks(change.before);
      const afterChunks = this.codeDiffer.extractSemanticChunks(change.after);

      // Find removed chunks
      for (const beforeChunk of beforeChunks) {
        const existsAfter = afterChunks.some(
          ac => ac.name === beforeChunk.name && ac.type === beforeChunk.type
        );

        if (!existsAfter) {
          const key = `${beforeChunk.type}:${beforeChunk.name}`;
          removedChunks.set(key, { change, chunk: beforeChunk });
        }
      }

      // Find restored chunks
      for (const afterChunk of afterChunks) {
        const existedBefore = beforeChunks.some(
          bc => bc.name === afterChunk.name && bc.type === afterChunk.type
        );

        if (!existedBefore) {
          const key = `${afterChunk.type}:${afterChunk.name}`;
          const removed = removedChunks.get(key);

          if (removed) {
            restoredChunks.push({
              name: afterChunk.name,
              type: afterChunk.type,
              removed: removed.change,
              restored: change,
            });
          }
        }
      }
    }

    if (restoredChunks.length > 0) {
      const chunkNames = restoredChunks.map(rc => `${rc.type} ${rc.name}`).join(', ');

      return {
        id: this.generateId(),
        type: DeviationType.CODE_REVERSAL,
        severity: 'high',
        message: `Semantic reversal detected in ${filePath}: Functions/classes were removed and then re-added: ${chunkNames}`,
        affectedFiles: [filePath],
        timestamp: new Date(),
        metadata: {
          restoredCount: restoredChunks.length,
          restoredItems: restoredChunks.map(rc => ({ type: rc.type, name: rc.name })),
        },
        suggestedAction: 'Code elements are being removed and restored. Verify the AI understands the requirements.',
      };
    }

    return null;
  }

  /**
   * Detect contradictory changes in a sequence
   *
   * @param context - Detection context with change history
   * @param newChange - New change to analyze
   * @returns Deviation if contradiction detected, null otherwise
   */
  public detectContradiction(context: DetectionContext, newChange: CodeChange): Deviation | null {
    const relevantChanges = context.history.filter(
      c => c.filePath === newChange.filePath && c.timestamp < newChange.timestamp
    );

    if (relevantChanges.length === 0) {
      return null;
    }

    // Check recent change for contradictions
    const recentChange = relevantChanges[relevantChanges.length - 1];
    const isContradictory = this.codeDiffer.areChangesContradictory(recentChange, newChange);

    if (isContradictory) {
      return {
        id: this.generateId(),
        type: DeviationType.CODE_REVERSAL,
        severity: 'high',
        message: `Contradictory changes detected in ${newChange.filePath}: Recent additions are being removed`,
        affectedFiles: [newChange.filePath],
        timestamp: new Date(),
        metadata: {
          contradictedChangeId: recentChange.conversationId,
          previousReason: recentChange.reason,
          newReason: newChange.reason,
        },
        suggestedAction: `Changes contradict previous work. Previous: "${recentChange.reason}". Current: "${newChange.reason}". Clarify intent.`,
      };
    }

    return null;
  }

  /**
   * Generate a unique ID for deviations
   */
  private generateId(): string {
    return `reversal_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
