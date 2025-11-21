/**
 * SupervisorBridge.ts
 *
 * Bridges VS Code extension components with the core AI Supervisor engine.
 * Handles event routing, state synchronization, and command execution.
 *
 * Features:
 * - Connect file changes to core supervisor engine
 * - Route AI interactions to deviation detector
 * - Synchronize goals and context
 * - Emit alerts based on supervisor events
 * - Handle intervention commands
 */

import * as vscode from 'vscode';
import { FileWatcher } from './FileWatcher';
import { AIDetector, AIToolInfo } from './AIDetector';
import { InterceptLayer, AIInteraction } from './InterceptLayer';
import { AlertManager, AlertSeverity, AlertType } from '../notifications/AlertManager';

/**
 * Supervisor event types
 */
export enum SupervisorEvent {
    GoalDeviation = 'goal-deviation',
    CodeReversal = 'code-reversal',
    UnauthorizedAction = 'unauthorized-action',
    ScopeViolation = 'scope-violation',
    RapidChanges = 'rapid-changes'
}

/**
 * Deviation event data
 */
export interface DeviationEvent {
    type: SupervisorEvent;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    details?: string;
    file?: string;
    timestamp: number;
    metadata?: Record<string, any>;
}

/**
 * Supervisor state
 */
export interface SupervisorState {
    isActive: boolean;
    isPaused: boolean;
    aiToolActive: string | null;
    monitoredFiles: number;
    recentDeviations: number;
}

/**
 * SupervisorBridge class
 *
 * Integrates VS Code components with core supervisor engine.
 */
export class SupervisorBridge {
    private fileWatcher: FileWatcher;
    private aiDetector: AIDetector;
    private interceptLayer: InterceptLayer;
    private alertManager: AlertManager;

    private state: SupervisorState = {
        isActive: false,
        isPaused: false,
        aiToolActive: null,
        monitoredFiles: 0,
        recentDeviations: 0
    };

    private disposables: vscode.Disposable[] = [];
    private stateChangeEmitter: vscode.EventEmitter<SupervisorState>;

    /**
     * Event fired when supervisor state changes
     */
    public readonly onDidChangeState: vscode.Event<SupervisorState>;

    constructor(private context: vscode.ExtensionContext) {
        // Initialize components
        this.fileWatcher = new FileWatcher(context);
        this.aiDetector = new AIDetector();
        this.interceptLayer = new InterceptLayer();
        this.alertManager = new AlertManager();

        // Initialize state event
        this.stateChangeEmitter = new vscode.EventEmitter<SupervisorState>();
        this.onDidChangeState = this.stateChangeEmitter.event;

        this.setupEventHandlers();
    }

    /**
     * Setup event handlers to connect components
     */
    private setupEventHandlers(): void {
        // Handle AI tool detection
        this.disposables.push(
            this.aiDetector.onDidDetectTools((tools) => {
                this.handleAIToolsDetected(tools);
            })
        );

        // Handle AI interactions
        this.disposables.push(
            this.interceptLayer.onDidInterceptInteraction((interaction) => {
                this.handleAIInteraction(interaction);
            })
        );

        // Handle rapid file changes
        // Note: Using simplified FileWatcher from the codebase
        // The FileWatcher was modified, so we'll work with it
    }

    /**
     * Initialize the supervisor bridge
     */
    public async initialize(): Promise<void> {
        console.log('SupervisorBridge: Initializing...');

        // Scan for AI tools
        const tools = await this.aiDetector.scan();
        console.log(`SupervisorBridge: Detected ${tools.length} AI tools`);

        // Initialize interception for primary tool
        const primaryTool = this.aiDetector.getPrimaryTool();
        if (primaryTool) {
            await this.interceptLayer.initialize(primaryTool);
            this.state.aiToolActive = primaryTool.name;
        }

        // Start monitoring
        this.state.isActive = true;
        this.emitStateChange();

        console.log('SupervisorBridge: Initialized');
    }

    /**
     * Handle detected AI tools
     */
    private async handleAIToolsDetected(tools: AIToolInfo[]): Promise<void> {
        if (tools.length === 0) {
            return;
        }

        const primaryTool = tools.find(t => t.isActive) || tools[0];

        if (primaryTool && this.state.aiToolActive !== primaryTool.name) {
            this.state.aiToolActive = primaryTool.name;
            this.emitStateChange();

            // Reinitialize interception layer
            await this.interceptLayer.initialize(primaryTool);

            // Show notification
            await vscode.window.showInformationMessage(
                `AI Supervisor: Now monitoring ${primaryTool.name}`
            );
        }
    }

    /**
     * Handle AI interactions
     */
    private async handleAIInteraction(interaction: AIInteraction): Promise<void> {
        console.log('AI Interaction detected:', {
            tool: interaction.toolId,
            type: interaction.type,
            timestamp: new Date(interaction.timestamp).toISOString()
        });

        // TODO: Send to core supervisor engine for analysis
        // const deviation = await supervisorEngine.analyzeInteraction(interaction);

        // For now, simulate deviation detection
        const shouldAlert = this.simulateDeviationDetection(interaction);

        if (shouldAlert) {
            await this.handleDeviation({
                type: SupervisorEvent.RapidChanges,
                severity: 'medium',
                message: `AI made rapid changes to ${interaction.code?.uri.fsPath || 'file'}`,
                timestamp: interaction.timestamp,
                file: interaction.code?.uri.fsPath
            });
        }
    }

    /**
     * Simulate deviation detection (temporary until core engine is integrated)
     */
    private simulateDeviationDetection(interaction: AIInteraction): boolean {
        // Simple heuristic: large code changes
        if (interaction.code && interaction.code.newText.length > 500) {
            return true;
        }
        return false;
    }

    /**
     * Handle deviation events
     */
    private async handleDeviation(event: DeviationEvent): Promise<void> {
        console.log('Deviation detected:', event);

        this.state.recentDeviations++;
        this.emitStateChange();

        // Map severity to alert severity
        const alertSeverity = this.mapSeverity(event.severity);

        // Show appropriate alert based on type
        switch (event.type) {
            case SupervisorEvent.GoalDeviation:
                await this.alertManager.showGoalDeviationAlert(
                    event.message,
                    event.details,
                    event.metadata
                );
                break;

            case SupervisorEvent.CodeReversal:
                await this.alertManager.showCodeReversalAlert(
                    event.message,
                    event.details,
                    event.metadata
                );
                break;

            case SupervisorEvent.UnauthorizedAction:
                await this.alertManager.showUnauthorizedActionAlert(
                    event.message,
                    event.details,
                    event.metadata
                );
                break;

            case SupervisorEvent.RapidChanges:
                await this.alertManager.showRapidChangesAlert(
                    event.message,
                    event.details,
                    event.metadata
                );
                break;

            default:
                await this.alertManager.showAlert(
                    alertSeverity,
                    AlertType.General,
                    'AI Supervisor Alert',
                    event.message,
                    { details: event.details, metadata: event.metadata }
                );
        }
    }

    /**
     * Map event severity to alert severity
     */
    private mapSeverity(severity: string): AlertSeverity {
        switch (severity) {
            case 'critical':
                return AlertSeverity.Critical;
            case 'high':
                return AlertSeverity.Error;
            case 'medium':
                return AlertSeverity.Warning;
            case 'low':
            default:
                return AlertSeverity.Info;
        }
    }

    /**
     * Pause AI monitoring
     */
    public pause(): void {
        this.state.isPaused = true;
        this.fileWatcher.pause();
        this.emitStateChange();

        vscode.window.showInformationMessage('AI Supervisor: Monitoring paused');
    }

    /**
     * Resume AI monitoring
     */
    public resume(): void {
        this.state.isPaused = false;
        this.fileWatcher.resume();
        this.emitStateChange();

        vscode.window.showInformationMessage('AI Supervisor: Monitoring resumed');
    }

    /**
     * Get current supervisor state
     */
    public getState(): SupervisorState {
        return { ...this.state };
    }

    /**
     * Emit state change event
     */
    private emitStateChange(): void {
        this.stateChangeEmitter.fire({ ...this.state });
    }

    /**
     * Get file watcher
     */
    public getFileWatcher(): FileWatcher {
        return this.fileWatcher;
    }

    /**
     * Get AI detector
     */
    public getAIDetector(): AIDetector {
        return this.aiDetector;
    }

    /**
     * Get intercept layer
     */
    public getInterceptLayer(): InterceptLayer {
        return this.interceptLayer;
    }

    /**
     * Get alert manager
     */
    public getAlertManager(): AlertManager {
        return this.alertManager;
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        this.fileWatcher.dispose();
        this.aiDetector.dispose();
        this.interceptLayer.dispose();
        this.alertManager.dispose();

        for (const disposable of this.disposables) {
            disposable.dispose();
        }

        this.stateChangeEmitter.dispose();
    }
}
