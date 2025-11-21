import * as vscode from 'vscode';

/**
 * AI tool information
 */
export interface AIToolInfo {
    id: string;
    name: string;
    version: string;
    isActive: boolean;
    isEnabled: boolean;
}

/**
 * Detects which AI coding assistants are installed and active
 */
export class AIDetector implements vscode.Disposable {
    private detectedTools: Map<string, AIToolInfo> = new Map();
    private disposables: vscode.Disposable[] = [];
    private toolChangeEmitter: vscode.EventEmitter<AIToolInfo[]>;

    /**
     * Event fired when AI tools are detected or changed
     */
    public readonly onDidDetectTools: vscode.Event<AIToolInfo[]>;

    constructor() {
        this.toolChangeEmitter = new vscode.EventEmitter<AIToolInfo[]>();
        this.onDidDetectTools = this.toolChangeEmitter.event;

        this.detectInstalledAITools();

        // Watch for extension changes
        this.disposables.push(
            vscode.extensions.onDidChange(() => {
                this.detectInstalledAITools();
            })
        );
    }

    /**
     * Detect which AI tools are installed in VS Code
     */
    private detectInstalledAITools(): void {
        const commonAIExtensions = [
            { id: 'github.copilot', name: 'GitHub Copilot' },
            { id: 'github.copilot-chat', name: 'GitHub Copilot Chat' },
            { id: 'continue.continue', name: 'Continue' },
            { id: 'sourcegraph.cody-ai', name: 'Cody' },
            { id: 'tabnine.tabnine-vscode', name: 'Tabnine' },
            { id: 'anthropic.claude-vscode', name: 'Claude' },
            { id: 'cursor.cursor-vscode', name: 'Cursor' }
        ];

        const previousSize = this.detectedTools.size;
        this.detectedTools.clear();

        for (const extInfo of commonAIExtensions) {
            const extension = vscode.extensions.getExtension(extInfo.id);
            if (extension) {
                const toolInfo: AIToolInfo = {
                    id: extInfo.id,
                    name: extInfo.name,
                    version: extension.packageJSON.version || 'unknown',
                    isActive: extension.isActive,
                    isEnabled: true
                };
                this.detectedTools.set(extInfo.id, toolInfo);
                console.log(`AIDetector: Detected ${toolInfo.name} v${toolInfo.version}`);
            }
        }

        if (this.detectedTools.size === 0) {
            console.log('AIDetector: No AI coding assistants detected');
        } else {
            console.log(`AIDetector: Detected ${this.detectedTools.size} AI tool(s)`);
        }

        // Emit change event if tools changed
        if (this.detectedTools.size !== previousSize) {
            this.toolChangeEmitter.fire(Array.from(this.detectedTools.values()));
        }
    }

    /**
     * Scan for AI tools (async version)
     */
    public async scan(): Promise<AIToolInfo[]> {
        this.detectInstalledAITools();
        return Array.from(this.detectedTools.values());
    }

    /**
     * Get primary AI tool (most likely to be in use)
     */
    public getPrimaryTool(): AIToolInfo | undefined {
        // Priority order
        const priority = [
            'github.copilot',
            'continue.continue',
            'sourcegraph.cody-ai',
            'anthropic.claude-vscode',
            'cursor.cursor-vscode',
            'tabnine.tabnine-vscode'
        ];

        for (const id of priority) {
            const tool = this.detectedTools.get(id);
            if (tool && tool.isActive) {
                return tool;
            }
        }

        // Return first active tool
        const allTools = Array.from(this.detectedTools.values());
        for (const tool of allTools) {
            if (tool.isActive) {
                return tool;
            }
        }

        // Return first tool
        return allTools[0];
    }

    /**
     * Get list of detected AI tools
     */
    public getDetectedTools(): string[] {
        return Array.from(this.detectedTools.keys());
    }

    /**
     * Get detailed AI tool information
     */
    public getToolsInfo(): AIToolInfo[] {
        return Array.from(this.detectedTools.values());
    }

    /**
     * Check if a specific AI tool is installed
     */
    public isToolInstalled(toolId: string): boolean {
        return this.detectedTools.has(toolId);
    }

    /**
     * Check if GitHub Copilot is installed
     */
    public hasCopilot(): boolean {
        return this.isToolInstalled('github.copilot') ||
               this.isToolInstalled('github.copilot-chat');
    }

    /**
     * Check if Continue is installed
     */
    public hasContinue(): boolean {
        return this.isToolInstalled('continue.continue');
    }

    /**
     * Check if Cody is installed
     */
    public hasCody(): boolean {
        return this.isToolInstalled('sourcegraph.cody-ai');
    }

    /**
     * Get a user-friendly message about detected tools
     */
    public getDetectionSummary(): string {
        if (this.detectedTools.size === 0) {
            return 'No AI coding assistants detected. AI Supervisor will monitor file changes to detect AI activity.';
        }

        const toolNames = Array.from(this.detectedTools.values()).map(tool => tool.name).join(', ');

        return `Detected AI tools: ${toolNames}. Monitoring is active.`;
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.toolChangeEmitter.dispose();
        this.detectedTools.clear();
    }
}
