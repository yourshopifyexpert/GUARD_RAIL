import * as vscode from 'vscode';

/**
 * Monitors workspace file changes to detect AI-generated code modifications
 */
export class FileWatcher implements vscode.Disposable {
    private watcher: vscode.FileSystemWatcher | undefined;
    private changeBuffer: Map<string, number> = new Map();
    private isActive: boolean = true;
    private disposables: vscode.Disposable[] = [];

    constructor(private context: vscode.ExtensionContext) {
        this.initializeWatcher();
    }

    /**
     * Initialize file system watcher for workspace
     */
    private initializeWatcher(): void {
        // Watch all files except node_modules, .git, etc.
        this.watcher = vscode.workspace.createFileSystemWatcher(
            '**/*.{ts,js,tsx,jsx,py,java,go,rs,cpp,c,h,cs,php,rb,swift,kt}',
            false, // ignoreCreateEvents
            false, // ignoreChangeEvents
            false  // ignoreDeleteEvents
        );

        // Handle file changes
        this.watcher.onDidChange((uri) => {
            if (this.isActive) {
                this.handleFileChange(uri, 'change');
            }
        }, this, this.disposables);

        // Handle file creation
        this.watcher.onDidCreate((uri) => {
            if (this.isActive) {
                this.handleFileChange(uri, 'create');
            }
        }, this, this.disposables);

        // Handle file deletion
        this.watcher.onDidDelete((uri) => {
            if (this.isActive) {
                this.handleFileChange(uri, 'delete');
            }
        }, this, this.disposables);

        console.log('File watcher initialized');
    }

    /**
     * Handle file change event
     */
    private handleFileChange(uri: vscode.Uri, type: 'change' | 'create' | 'delete'): void {
        const filePath = uri.fsPath;
        const now = Date.now();

        // Track rapid changes (likely AI-generated)
        const lastChange = this.changeBuffer.get(filePath) || 0;
        const timeSinceLastChange = now - lastChange;

        // If changes are happening rapidly (< 2 seconds), likely AI activity
        const isLikelyAI = timeSinceLastChange < 2000;

        this.changeBuffer.set(filePath, now);

        // Log the change
        console.log(`File ${type}: ${filePath} (AI likely: ${isLikelyAI})`);

        // TODO: Send to supervisor engine for analysis
        this.processChange({
            uri,
            type,
            timestamp: now,
            isLikelyAI
        });

        // Clean up old entries from buffer
        this.cleanupBuffer();
    }

    /**
     * Process the detected change
     */
    private processChange(change: any): void {
        // TODO: Integrate with supervisor engine
        // supervisorEngine.analyzeChange(change);
        
        // For now, just log
        console.log('Processing change:', change);
    }

    /**
     * Clean up old entries from change buffer (older than 5 minutes)
     */
    private cleanupBuffer(): void {
        const now = Date.now();
        const fiveMinutesAgo = now - (5 * 60 * 1000);

        for (const [filePath, timestamp] of this.changeBuffer.entries()) {
            if (timestamp < fiveMinutesAgo) {
                this.changeBuffer.delete(filePath);
            }
        }
    }

    /**
     * Pause file watching
     */
    public pause(): void {
        this.isActive = false;
        console.log('File watching paused');
    }

    /**
     * Resume file watching
     */
    public resume(): void {
        this.isActive = true;
        console.log('File watching resumed');
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        this.watcher?.dispose();
        this.disposables.forEach(d => d.dispose());
        this.changeBuffer.clear();
    }
}
