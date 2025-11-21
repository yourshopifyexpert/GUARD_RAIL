import * as vscode from 'vscode';

/**
 * Detects which AI coding assistants are installed and active
 */
export class AIDetector {
    private detectedTools: Set<string> = new Set();

    constructor() {
        this.detectInstalledAITools();
    }

    /**
     * Detect which AI tools are installed in VS Code
     */
    private detectInstalledAITools(): void {
        const commonAIExtensions = [
            'github.copilot',
            'github.copilot-chat',
            'continue.continue',
            'sourcegraph.cody-ai',
            'tabnine.tabnine-vscode',
            'anthropic.claude-vscode',
            'cursor.cursor-vscode'
        ];

        for (const extensionId of commonAIExtensions) {
            const extension = vscode.extensions.getExtension(extensionId);
            if (extension) {
                this.detectedTools.add(extensionId);
                console.log(`Detected AI tool: ${extensionId}`);
            }
        }

        if (this.detectedTools.size === 0) {
            console.log('No AI coding assistants detected');
        } else {
            console.log(`Detected ${this.detectedTools.size} AI tool(s)`);
        }
    }

    /**
     * Get list of detected AI tools
     */
    public getDetectedTools(): string[] {
        return Array.from(this.detectedTools);
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

        const toolNames = Array.from(this.detectedTools).map(id => {
            const parts = id.split('.');
            return parts[parts.length - 1];
        }).join(', ');

        return `Detected AI tools: ${toolNames}. Monitoring is active.`;
    }
}
