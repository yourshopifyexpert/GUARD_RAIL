import * as Diff from 'diff';
import { CodeChange, DiffResult, DiffHunk } from '../types';

/**
 * CodeDiffer - Analyzes code changes using the diff library
 *
 * This class provides comprehensive before/after code comparison capabilities:
 * - Line-by-line diffs with context
 * - Similarity scoring between versions
 * - Structured diff output for analysis
 * - Fast performance (<10ms for typical files)
 * - Reversal and contradiction detection
 * - Semantic chunk extraction
 *
 * @example
 * ```typescript
 * const differ = new CodeDiffer();
 * const result = differ.diff(beforeCode, afterCode);
 * console.log(`Added: ${result.addedLines}, Removed: ${result.removedLines}`);
 * console.log(`Similarity: ${(result.similarity * 100).toFixed(1)}%`);
 * ```
 */
export class CodeDiffer {
  /**
   * Compare two versions of code and return structured diff information
   *
   * @param before - Original code content
   * @param after - Modified code content
   * @returns Structured diff result with hunks and statistics
   *
   * @example
   * ```typescript
   * const diff = differ.diff(oldCode, newCode);
   * diff.hunks.forEach(hunk => {
   *   console.log(`Changed at line ${hunk.newStart}`);
   *   console.log(`Added: ${hunk.additions.length} lines`);
   * });
   * ```
   */
  public diff(before: string, after: string): DiffResult {
    const startTime = Date.now();

    // Generate unified diff using structured patch
    const patches = Diff.structuredPatch(
      'before',
      'after',
      before,
      after,
      '',
      '',
      { context: 3 }
    );

    const hunks: DiffHunk[] = [];
    let totalAdditions = 0;
    let totalDeletions = 0;
    let totalUnchanged = 0;

    // Process each hunk
    for (const hunk of patches.hunks) {
      const additions: string[] = [];
      const deletions: string[] = [];
      const context: string[] = [];

      for (const line of hunk.lines) {
        const content = line.substring(1); // Remove +/- prefix

        if (line.startsWith('+')) {
          additions.push(content);
          totalAdditions++;
        } else if (line.startsWith('-')) {
          deletions.push(content);
          totalDeletions++;
        } else {
          context.push(content);
          totalUnchanged++;
        }
      }

      hunks.push({
        oldStart: hunk.oldStart,
        oldLines: hunk.oldLines,
        newStart: hunk.newStart,
        newLines: hunk.newLines,
        additions,
        deletions,
        context,
      });
    }

    // Calculate similarity score (0 = completely different, 1 = identical)
    const similarity = this.calculateSimilarity(before, after);

    const elapsed = Date.now() - startTime;

    // Ensure fast performance (<100ms requirement)
    if (elapsed > 100) {
      console.warn(`CodeDiffer took ${elapsed}ms - exceeds 100ms target`);
    }

    return {
      hunks,
      addedLines: totalAdditions,
      removedLines: totalDeletions,
      unchangedLines: totalUnchanged,
      similarity,
    };
  }

  /**
   * Calculate similarity score between two code versions
   * Uses character-level diff normalized to 0-1 range
   *
   * @param before - Original code
   * @param after - Modified code
   * @returns Similarity score (0 = completely different, 1 = identical)
   */
  public calculateSimilarity(before: string, after: string): number {
    if (before === after) return 1.0;
    if (!before || !after) return 0.0;

    // Use character-level diff for similarity
    const changes = Diff.diffChars(before, after);

    let totalChars = 0;
    let unchangedChars = 0;

    for (const change of changes) {
      const count = change.value.length;
      totalChars += count;

      if (!change.added && !change.removed) {
        unchangedChars += count;
      }
    }

    return totalChars > 0 ? unchangedChars / totalChars : 0;
  }

  /**
   * Check if a code change is a reversal of a previous change
   *
   * @param original - Original code
   * @param intermediate - Code after first change
   * @param final - Code after potential reversal
   * @param threshold - Similarity threshold to consider a reversal (default 0.9)
   * @returns True if final code is similar to original (indicating reversal)
   *
   * @example
   * ```typescript
   * const isReversal = differ.isReversal(v1, v2, v3, 0.85);
   * if (isReversal) {
   *   console.log('Warning: Code was changed back to original!');
   * }
   * ```
   */
  public isReversal(
    original: string,
    intermediate: string,
    final: string,
    threshold: number = 0.9
  ): boolean {
    // If intermediate is same as original, not a change
    if (original === intermediate) return false;

    // If final is same as intermediate, not a reversal
    if (intermediate === final) return false;

    // Check if final is very similar to original
    const similarity = this.calculateSimilarity(original, final);
    return similarity >= threshold;
  }

  /**
   * Detect partial reversals where some but not all changes are undone
   *
   * @param change1 - First code change
   * @param change2 - Second code change (potential reversal)
   * @param threshold - Line-level similarity threshold (default 0.7)
   * @returns Object with isPartialReversal flag and percentage reversed
   */
  public detectPartialReversal(
    change1: CodeChange,
    change2: CodeChange,
    threshold: number = 0.7
  ): { isPartialReversal: boolean; percentageReversed: number } {
    // Get diff between the two changes
    const diff1 = this.diff(change1.before, change1.after);
    const diff2 = this.diff(change2.before, change2.after);

    let reversedLines = 0;
    let totalLines = 0;

    // Check if additions in change1 are deletions in change2
    for (const hunk1 of diff1.hunks) {
      totalLines += hunk1.additions.length;

      for (const addition of hunk1.additions) {
        for (const hunk2 of diff2.hunks) {
          if (hunk2.deletions.includes(addition)) {
            reversedLines++;
            break;
          }
        }
      }
    }

    const percentageReversed = totalLines > 0 ? reversedLines / totalLines : 0;
    const isPartialReversal = percentageReversed >= threshold;

    return { isPartialReversal, percentageReversed };
  }

  /**
   * Compare two code changes to detect if they are contradictory
   *
   * @param change1 - First code change
   * @param change2 - Second code change
   * @returns True if changes contradict each other
   */
  public areChangesContradictory(change1: CodeChange, change2: CodeChange): boolean {
    if (change1.filePath !== change2.filePath) {
      return false;
    }

    // Check if change2 reverts what change1 added
    const diff1 = this.diff(change1.before, change1.after);
    const diff2 = this.diff(change2.before, change2.after);

    let contradictions = 0;
    let totalChanges = 0;

    // Check if additions in change1 are deletions in change2
    for (const hunk1 of diff1.hunks) {
      for (const addition of hunk1.additions) {
        totalChanges++;
        for (const hunk2 of diff2.hunks) {
          if (hunk2.deletions.includes(addition)) {
            contradictions++;
            break;
          }
        }
      }
    }

    // 50% threshold for contradiction
    return totalChanges > 0 && (contradictions / totalChanges) > 0.5;
  }

  /**
   * Extract semantic chunks from code (functions, classes, etc.)
   * This helps detect when specific functionality is removed
   *
   * @param code - Code to analyze
   * @returns Array of code chunks with metadata
   */
  public extractSemanticChunks(code: string): Array<{ type: string; name: string; content: string; lineStart: number }> {
    const chunks: Array<{ type: string; name: string; content: string; lineStart: number }> = [];
    const lines = code.split('\n');

    // Pattern matching for common constructs
    const patterns = {
      function: /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
      class: /^\s*(?:export\s+)?class\s+(\w+)/,
      method: /^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*{/,
      const: /^\s*(?:export\s+)?const\s+(\w+)\s*=/,
      interface: /^\s*(?:export\s+)?interface\s+(\w+)/,
      type: /^\s*(?:export\s+)?type\s+(\w+)\s*=/,
    };

    let currentChunk: { type: string; name: string; lines: string[]; lineStart: number } | null = null;
    let braceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for new semantic constructs
      if (!currentChunk || braceDepth === 0) {
        for (const [type, pattern] of Object.entries(patterns)) {
          const match = line.match(pattern);
          if (match) {
            if (currentChunk) {
              chunks.push({
                type: currentChunk.type,
                name: currentChunk.name,
                content: currentChunk.lines.join('\n'),
                lineStart: currentChunk.lineStart,
              });
            }
            currentChunk = {
              type,
              name: match[1],
              lines: [line],
              lineStart: i + 1,
            };
            braceDepth = 0;
            break;
          }
        }
      }

      if (currentChunk) {
        if (currentChunk.lines.length > 0 && currentChunk.lines[0] !== line) {
          currentChunk.lines.push(line);
        }

        // Track brace depth to know when construct ends
        braceDepth += (line.match(/{/g) || []).length;
        braceDepth -= (line.match(/}/g) || []).length;

        if (braceDepth === 0 && currentChunk.lines.length > 1) {
          chunks.push({
            type: currentChunk.type,
            name: currentChunk.name,
            content: currentChunk.lines.join('\n'),
            lineStart: currentChunk.lineStart,
          });
          currentChunk = null;
        }
      }
    }

    // Add final chunk if exists
    if (currentChunk) {
      chunks.push({
        type: currentChunk.type,
        name: currentChunk.name,
        content: currentChunk.lines.join('\n'),
        lineStart: currentChunk.lineStart,
      });
    }

    return chunks;
  }

  /**
   * Generate a human-readable summary of changes
   *
   * @param diffResult - Diff result to summarize
   * @returns Human-readable change summary
   */
  public summarizeChanges(diffResult: DiffResult): string {
    const { addedLines, removedLines, similarity } = diffResult;
    const totalChanges = addedLines + removedLines;

    if (totalChanges === 0) {
      return 'No changes detected';
    }

    const similarityPct = (similarity * 100).toFixed(1);
    const parts = [];

    if (addedLines > 0) {
      parts.push(`${addedLines} line${addedLines !== 1 ? 's' : ''} added`);
    }
    if (removedLines > 0) {
      parts.push(`${removedLines} line${removedLines !== 1 ? 's' : ''} removed`);
    }

    return `${parts.join(', ')} (${similarityPct}% similar to original)`;
  }

  /**
   * Calculate the magnitude of a change (lines added + removed)
   *
   * @param before - Original code
   * @param after - Modified code
   * @returns Total number of lines changed
   */
  public calculateChangeMagnitude(before: string, after: string): number {
    const diffResult = this.diff(before, after);
    return diffResult.addedLines + diffResult.removedLines;
  }

  /**
   * Check if a change is purely additive (no deletions)
   *
   * @param before - Original code
   * @param after - Modified code
   * @returns True if only additions, no deletions
   */
  public isAdditive(before: string, after: string): boolean {
    const diffResult = this.diff(before, after);
    return diffResult.removedLines === 0 && diffResult.addedLines > 0;
  }

  /**
   * Check if a change is purely deletive (no additions)
   *
   * @param before - Original code
   * @param after - Modified code
   * @returns True if only deletions, no additions
   */
  public isDeletive(before: string, after: string): boolean {
    const diffResult = this.diff(before, after);
    return diffResult.addedLines === 0 && diffResult.removedLines > 0;
  }
}
