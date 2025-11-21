import * as vscode from 'vscode';
import { AIToolInfo } from './AIDetector';

/**
 * AI interaction event
 */
export interface AIInteraction {
    toolId: string;
    type: 'completion' | 'chat' | 'edit' | 'unknown';
    timestamp: number;
    code?: {
        uri: vscode.Uri;
        oldText: string;
        newText: string;
    };
    metadata?: Record<string, any>;
}

/**
 * Intercept layer for hooking into AI interactions (future feature)
 *
 * This is a placeholder for potential future integration with AI tool APIs.
 * Currently, AI Supervisor relies on file watching for universal compatibility.
 *
 * Future possibilities:
 * - GitHub Copilot API hooks (if/when available)
 * - Continue API integration
 * - Cody API integration
 * - Generic language server protocol hooks
 */
export class InterceptLayer implements vscode.Disposable {
    private isEnabled: boolean = false;
    private interactionEmitter: vscode.EventEmitter<AIInteraction>;
    private disposables: vscode.Disposable[] = [];

    /**
     * Event fired when an AI interaction is intercepted
     */
    public readonly onDidInterceptInteraction: vscode.Event<AIInteraction>;

    constructor() {
        this.interactionEmitter = new vscode.EventEmitter<AIInteraction>();
        this.onDidInterceptInteraction = this.interactionEmitter.event;

        console.log('InterceptLayer initialized (currently inactive - using file watching instead)');
    }

    /**
     * Attempt to hook into AI tool interactions
     * This is a placeholder for future API-based integration
     */
    public async initialize(tool?: AIToolInfo): Promise<void> {
        if (tool) {
            console.log(`InterceptLayer: Attempting to initialize for ${tool.name}`);
        }

        // TODO: Implement API-based interception when AI tools expose appropriate APIs
        // For now, we rely on FileWatcher for universal compatibility

        this.isEnabled = false;
        console.log('API-based interception not yet implemented - using file watching');
    }

    /**
     * Check if interception is active
     */
    public isActive(): boolean {
        return this.isEnabled;
    }

    /**
     * Disable interception
     */
    public disable(): void {
        this.isEnabled = false;
    }

    /**
     * Clean up resources
     */
    public dispose(): void {
        this.isEnabled = false;
        this.disposables.forEach(d => d.dispose());
        this.interactionEmitter.dispose();
    }
}
