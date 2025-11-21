import * as vscode from 'vscode';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Change event emitted by FileWatcher
 */
export interface FileChangeEvent {
    id: string;
    uri: vscode.Uri;
    type: 'create' | 'modify' | 'delete';
    timestamp: number;
    beforeContent?: string;
    afterContent?: string;
    diff?: string;
    aiLikelihood: AILikelihood;
    metadata: ChangeMetadata;
}

/**
 * AI likelihood assessment
 */
export interface AILikelihood {
    isLikelyAI: boolean;
    confidence: number;
    reasons: string[];
}

/**
 * Metadata about the change
 */
export interface ChangeMetadata {
    linesAdded: number;
    linesRemoved: number;
    isRapidChange: boolean;
    isLargeAddition: boolean;
    isFormattingOnly: boolean;
    hasAIPatterns: boolean;
    fileSize: number;
    timeSinceLastChange: number;
}

/**
 * Debounce entry for tracking pending events
 */
interface DebounceEntry {
    uri: vscode.Uri;
    type: 'create' | 'modify' | 'delete';
    timeout: NodeJS.Timeout;
}

/**
 * File content cache for generating diffs
 */
interface FileContentCache {
    content: string;
    timestamp: number;
}

/**
 * Pattern for detecting rapid changes across multiple files
 */
interface ChangePattern {
    files: Set<string>;
    timestamp: number;
    changeCount: number;
}

/**
 * Monitors workspace file changes to detect AI-generated code modifications
 *
 * Features:
 * - Real-time file watching using VS Code FileSystemWatcher API
 * - AI detection heuristics (rapid changes, large additions, patterns)
 * - Automatic diff generation for all changes
 * - Event emission for integration with ActivityMonitor
 * - Debouncing to prevent event flooding
 * - Performance optimized with caching and cleanup
 * - Excludes node_modules, .git, dist, and other build folders
 */
export class FileWatcher implements vscode.Disposable {
    private watcher: vscode.FileSystemWatcher | undefined;
    private changeBuffer: Map<string, number> = new Map();
    private contentCache: Map<string, FileContentCache> = new Map();
    private debounceMap: Map<string, DebounceEntry> = new Map();
    private recentPatterns: ChangePattern[] = [];
    private isActive: boolean = true;
    private disposables: vscode.Disposable[] = [];

    private readonly DEBOUNCE_DELAY = 300; // ms
    private readonly RAPID_CHANGE_THRESHOLD = 2000; // ms
    private readonly LARGE_ADDITION_THRESHOLD = 50; // lines
    private readonly CACHE_TTL = 60000; // 1 minute
    private readonly BUFFER_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
    private readonly PATTERN_WINDOW = 10000; // 10 seconds for pattern detection

    private cleanupInterval: NodeJS.Timeout | undefined;
    private changeEmitter: vscode.EventEmitter<FileChangeEvent>;

    /**
     * Event fired when a file change is detected and processed
     */
    public readonly onDidChangeFile: vscode.Event<FileChangeEvent>;

    constructor(_context: vscode.ExtensionContext) {
        this.changeEmitter = new vscode.EventEmitter<FileChangeEvent>();
        this.onDidChangeFile = this.changeEmitter.event;

        this.initializeWatcher();
        this.startCleanupTimer();
    }

    /**
     * Initialize file system watcher for workspace
     */
    private initializeWatcher(): void {
        // Watch all code files, excluding node_modules, .git, dist, etc.
        const pattern = new vscode.RelativePattern(
            vscode.workspace.workspaceFolders?.[0] || '',
            '**/*.{ts,js,tsx,jsx,py,java,go,rs,cpp,c,h,hpp,cs,php,rb,swift,kt,dart,scala,r,m,mm,vue,svelte}'
        );

        this.watcher = vscode.workspace.createFileSystemWatcher(
            pattern,
            false, // ignoreCreateEvents
            false, // ignoreChangeEvents
            false  // ignoreDeleteEvents
        );

        // Handle file changes with debouncing
        this.watcher.onDidChange((uri) => {
            if (this.isActive && !this.shouldIgnoreFile(uri)) {
                this.debounceChange(uri, 'modify');
            }
        }, this, this.disposables);

        // Handle file creation
        this.watcher.onDidCreate((uri) => {
            if (this.isActive && !this.shouldIgnoreFile(uri)) {
                this.debounceChange(uri, 'create');
            }
        }, this, this.disposables);

        // Handle file deletion
        this.watcher.onDidDelete((uri) => {
            if (this.isActive && !this.shouldIgnoreFile(uri)) {
                this.debounceChange(uri, 'delete');
            }
        }, this, this.disposables);

        console.log('FileWatcher: Initialized with pattern matching');
    }

    /**
     * Check if file should be ignored based on path patterns
     */
    private shouldIgnoreFile(uri: vscode.Uri): boolean {
        const filePath = uri.fsPath;
        const relativePath = vscode.workspace.asRelativePath(filePath);

        const ignorePatterns = [
            /node_modules/,
            /\.git/,
            /dist/,
            /build/,
            /out/,
            /\.next/,
            /\.nuxt/,
            /\.vscode/,
            /coverage/,
            /\.pytest_cache/,
            /__pycache__/,
            /\.cache/,
            /vendor/,
            /\.idea/,
            /\.venv/,
            /venv/,
            /\.DS_Store/,
            /\.min\./,
            /\.bundle\./,
            /\.map$/
        ];

        return ignorePatterns.some(pattern => pattern.test(relativePath));
    }

    /**
     * Debounce file changes to prevent flooding
     */
    private debounceChange(uri: vscode.Uri, type: 'create' | 'modify' | 'delete'): void {
        const key = uri.fsPath;

        // Clear existing debounce timer
        const existing = this.debounceMap.get(key);
        if (existing) {
            clearTimeout(existing.timeout);
        }

        // Set new debounce timer
        const timeout = setTimeout(() => {
            this.handleFileChange(uri, type);
            this.debounceMap.delete(key);
        }, this.DEBOUNCE_DELAY);

        this.debounceMap.set(key, { uri, type, timeout });
    }

    /**
     * Handle file change event
     */
    private async handleFileChange(uri: vscode.Uri, type: 'create' | 'modify' | 'delete'): Promise<void> {
        const filePath = uri.fsPath;
        const now = Date.now();

        try {
            // Read file contents for diff generation
            let beforeContent: string | undefined;
            let afterContent: string | undefined;
            let diff: string | undefined;

            if (type === 'delete') {
                const cached = this.contentCache.get(filePath);
                beforeContent = cached?.content;
                afterContent = undefined;
                diff = this.generateDiffString(beforeContent || '', '');
            } else {
                beforeContent = this.contentCache.get(filePath)?.content;
                afterContent = await this.readFileContent(uri);

                if (beforeContent && afterContent) {
                    diff = this.generateDiffString(beforeContent, afterContent);
                }

                // Update cache
                if (afterContent) {
                    this.contentCache.set(filePath, {
                        content: afterContent,
                        timestamp: now
                    });
                }
            }

            // Analyze change metadata
            const metadata = this.analyzeChange(
                filePath,
                beforeContent || '',
                afterContent || '',
                now
            );

            // Detect AI patterns
            const aiLikelihood = this.detectAIPatterns(
                filePath,
                beforeContent || '',
                afterContent || '',
                metadata,
                now
            );

            // Track in change buffer
            this.changeBuffer.set(filePath, now);

            // Track cross-file patterns
            this.trackChangePattern(filePath, now);

            // Create and emit change event
            const changeEvent: FileChangeEvent = {
                id: uuidv4(),
                uri,
                type,
                timestamp: now,
                beforeContent,
                afterContent,
                diff,
                aiLikelihood,
                metadata
            };

            this.changeEmitter.fire(changeEvent);

            console.log(`FileWatcher: ${type} detected - ${path.basename(filePath)} (AI: ${aiLikelihood.isLikelyAI}, confidence: ${aiLikelihood.confidence.toFixed(2)})`);

        } catch (error) {
            console.error(`FileWatcher: Error processing change for ${filePath}:`, error);
        }
    }

    /**
     * Read file content
     */
    private async readFileContent(uri: vscode.Uri): Promise<string> {
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            return document.getText();
        } catch (error) {
            console.error(`FileWatcher: Failed to read ${uri.fsPath}:`, error);
            return '';
        }
    }

    /**
     * Generate diff string between before and after content
     */
    private generateDiffString(before: string, after: string): string {
        const beforeLines = before.split('\n');
        const afterLines = after.split('\n');
        const diffLines: string[] = [];

        // Simple line-by-line diff
        const maxLines = Math.max(beforeLines.length, afterLines.length);

        for (let i = 0; i < maxLines; i++) {
            const beforeLine = beforeLines[i];
            const afterLine = afterLines[i];

            if (beforeLine !== afterLine) {
                if (beforeLine !== undefined) {
                    diffLines.push(`- ${beforeLine}`);
                }
                if (afterLine !== undefined) {
                    diffLines.push(`+ ${afterLine}`);
                }
            }
        }

        return diffLines.join('\n');
    }

    /**
     * Analyze change to extract metadata
     */
    private analyzeChange(
        filePath: string,
        before: string,
        after: string,
        timestamp: number
    ): ChangeMetadata {
        const beforeLines = before.split('\n');
        const afterLines = after.split('\n');

        let linesAdded = 0;
        let linesRemoved = 0;

        // Calculate line changes
        const maxLines = Math.max(beforeLines.length, afterLines.length);
        for (let i = 0; i < maxLines; i++) {
            if (i >= beforeLines.length) {
                linesAdded++;
            } else if (i >= afterLines.length) {
                linesRemoved++;
            } else if (beforeLines[i] !== afterLines[i]) {
                linesAdded++;
                linesRemoved++;
            }
        }

        // Check timing
        const lastChange = this.changeBuffer.get(filePath) || 0;
        const timeSinceLastChange = timestamp - lastChange;
        const isRapidChange = timeSinceLastChange < this.RAPID_CHANGE_THRESHOLD && lastChange > 0;

        // Check if large addition
        const isLargeAddition = linesAdded > this.LARGE_ADDITION_THRESHOLD;

        // Check if formatting only (whitespace changes)
        const isFormattingOnly = this.isFormattingOnlyChange(before, after);

        // File size
        const fileSize = Buffer.byteLength(after, 'utf8');

        return {
            linesAdded,
            linesRemoved,
            isRapidChange,
            isLargeAddition,
            isFormattingOnly,
            hasAIPatterns: false, // Will be set by detectAIPatterns
            fileSize,
            timeSinceLastChange
        };
    }

    /**
     * Check if change is formatting only
     */
    private isFormattingOnlyChange(before: string, after: string): boolean {
        const normalizedBefore = before.replace(/\s+/g, ' ').trim();
        const normalizedAfter = after.replace(/\s+/g, ' ').trim();
        return normalizedBefore === normalizedAfter;
    }

    /**
     * Detect AI-generated patterns
     */
    private detectAIPatterns(
        filePath: string,
        before: string,
        after: string,
        metadata: ChangeMetadata,
        timestamp: number
    ): AILikelihood {
        const reasons: string[] = [];
        let confidence = 0.0;

        // Rapid changes indicator
        if (metadata.isRapidChange) {
            reasons.push('Rapid change detected (< 2 seconds since last change)');
            confidence += 0.3;
        }

        // Large code additions
        if (metadata.isLargeAddition) {
            reasons.push(`Large addition detected (${metadata.linesAdded} lines added)`);
            confidence += 0.25;
        }

        // Multiple files changed rapidly
        const recentPattern = this.getRecentChangePattern();
        if (recentPattern && recentPattern.files.size > 1 && recentPattern.changeCount > 3) {
            reasons.push(`Multiple files changed rapidly (${recentPattern.files.size} files, ${recentPattern.changeCount} changes)`);
            confidence += 0.35;
        }

        // AI-generated comment patterns
        if (this.hasAICommentPatterns(after)) {
            reasons.push('AI-generated comment patterns detected');
            confidence += 0.15;
            metadata.hasAIPatterns = true;
        }

        // Boilerplate code patterns
        if (this.hasBoilerplatePatterns(after)) {
            reasons.push('Boilerplate code patterns detected');
            confidence += 0.1;
        }

        // Perfect formatting (very consistent)
        if (this.hasPerfectFormatting(after) && metadata.linesAdded > 20) {
            reasons.push('Perfect formatting detected on large addition');
            confidence += 0.1;
        }

        // Normalize confidence to 0-1 range
        confidence = Math.min(confidence, 1.0);

        const isLikelyAI = confidence > 0.5;

        return {
            isLikelyAI,
            confidence,
            reasons
        };
    }

    /**
     * Check for AI-generated comment patterns
     */
    private hasAICommentPatterns(code: string): boolean {
        const aiCommentPatterns = [
            /\/\*\*[\s\S]*?@param.*?@returns.*?\*\//,  // JSDoc with @param and @returns
            /\/\/\s*TODO:.*AI.*generated/i,
            /\/\*\s*Generated by/i,
            /\/\/\s*\w+\s*-\s*\w+.*\w+.*\w+/,  // Very structured comments
            /\/\*\*\s*\n\s*\*\s*[A-Z][^*]*\n\s*\*\s*\n/,  // Multi-line JSDoc with specific structure
        ];

        return aiCommentPatterns.some(pattern => pattern.test(code));
    }

    /**
     * Check for boilerplate patterns
     */
    private hasBoilerplatePatterns(code: string): boolean {
        const boilerplatePatterns = [
            /export\s+(interface|type|class)\s+\w+\s*{[\s\S]*}/,
            /constructor\([^)]*\)\s*{\s*}/,
            /async\s+function\s+\w+\([^)]*\):\s*Promise<\w+>/,
            /\w+\s*=\s*\([^)]*\)\s*=>\s*{/,
        ];

        let patternCount = 0;
        for (const pattern of boilerplatePatterns) {
            if (pattern.test(code)) {
                patternCount++;
            }
        }

        return patternCount >= 2;
    }

    /**
     * Check for perfect formatting
     */
    private hasPerfectFormatting(code: string): boolean {
        const lines = code.split('\n');
        if (lines.length < 10) return false;

        let consistentIndentation = true;
        let indentLevel = 0;
        const indentPattern = /^(\s*)/;

        for (const line of lines) {
            if (line.trim().length === 0) continue;

            const match = line.match(indentPattern);
            const spaces = match ? match[1].length : 0;

            // Check if indentation is consistent (2 or 4 spaces)
            if (spaces % 2 !== 0 && spaces % 4 !== 0) {
                consistentIndentation = false;
                break;
            }
        }

        return consistentIndentation;
    }

    /**
     * Track change patterns across files
     */
    private trackChangePattern(filePath: string, timestamp: number): void {
        // Clean old patterns
        this.recentPatterns = this.recentPatterns.filter(
            p => timestamp - p.timestamp < this.PATTERN_WINDOW
        );

        // Find or create current pattern
        let currentPattern = this.recentPatterns.find(
            p => timestamp - p.timestamp < this.PATTERN_WINDOW
        );

        if (!currentPattern) {
            currentPattern = {
                files: new Set(),
                timestamp,
                changeCount: 0
            };
            this.recentPatterns.push(currentPattern);
        }

        currentPattern.files.add(filePath);
        currentPattern.changeCount++;
    }

    /**
     * Get recent change pattern
     */
    private getRecentChangePattern(): ChangePattern | undefined {
        if (this.recentPatterns.length === 0) return undefined;
        return this.recentPatterns[this.recentPatterns.length - 1];
    }

    /**
     * Start cleanup timer for old buffers and caches
     */
    private startCleanupTimer(): void {
        this.cleanupInterval = setInterval(() => {
            this.cleanupBuffer();
            this.cleanupCache();
        }, this.BUFFER_CLEANUP_INTERVAL);
    }

    /**
     * Clean up old entries from change buffer
     */
    private cleanupBuffer(): void {
        const now = Date.now();
        const cutoff = now - this.BUFFER_CLEANUP_INTERVAL;

        const entriesToDelete: string[] = [];
        this.changeBuffer.forEach((timestamp, filePath) => {
            if (timestamp < cutoff) {
                entriesToDelete.push(filePath);
            }
        });

        entriesToDelete.forEach(filePath => this.changeBuffer.delete(filePath));
    }

    /**
     * Clean up old cache entries
     */
    private cleanupCache(): void {
        const now = Date.now();
        const cutoff = now - this.CACHE_TTL;

        const entriesToDelete: string[] = [];
        this.contentCache.forEach((cache, filePath) => {
            if (cache.timestamp < cutoff) {
                entriesToDelete.push(filePath);
            }
        });

        entriesToDelete.forEach(filePath => this.contentCache.delete(filePath));
    }

    /**
     * Pause file watching
     */
    public pause(): void {
        this.isActive = false;
        console.log('FileWatcher: Monitoring paused');
    }

    /**
     * Resume file watching
     */
    public resume(): void {
        this.isActive = true;
        console.log('FileWatcher: Monitoring resumed');
    }

    /**
     * Get statistics about current monitoring
     */
    public getStats() {
        const recentPattern = this.getRecentChangePattern();
        return {
            isActive: this.isActive,
            trackedFiles: this.changeBuffer.size,
            cachedFiles: this.contentCache.size,
            pendingDebounce: this.debounceMap.size,
            recentPatterns: {
                files: recentPattern?.files.size || 0,
                changes: recentPattern?.changeCount || 0
            }
        };
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        // Clear cleanup timer
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        // Clear all debounce timers
        const debounceEntries = Array.from(this.debounceMap.values());
        debounceEntries.forEach(entry => clearTimeout(entry.timeout));

        // Dispose watcher and subscriptions
        this.watcher?.dispose();
        this.disposables.forEach(d => d.dispose());
        this.changeEmitter.dispose();

        // Clear all maps
        this.changeBuffer.clear();
        this.contentCache.clear();
        this.debounceMap.clear();
        this.recentPatterns = [];

        console.log('FileWatcher: Disposed');
    }
}
