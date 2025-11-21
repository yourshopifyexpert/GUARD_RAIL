/**
 * SupervisorBridge.ts
 *
 * Production-ready integration bridge connecting VS Code extension components
 * with the core AI Supervisor engine.
 *
 * Features:
 * - Complete integration with ai-supervisor core package
 * - Real-time file change monitoring and analysis
 * - Bidirectional sync between UI panels and core engine
 * - Full event routing and state management
 * - SQLite database initialization in workspace
 * - Error handling and recovery
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
    SupervisorAPI,
    Goal,
    CodeChange,
    Deviation,
    Intervention
} from '@guard-rail/ai-supervisor';
import { FileWatcher } from './FileWatcher';
import { AIDetector, AIToolInfo } from './AIDetector';
import { InterceptLayer } from './InterceptLayer';
import { AlertManager, AlertSeverity, AlertType, Alert } from '../notifications/AlertManager';
import { GoalManagerPanel } from '../panels/GoalManager';
import { ChangeInspectorPanel } from '../panels/ChangeInspector';
import { ActivityMonitorPanel } from '../panels/ActivityMonitor';

/**
 * Supervisor event types for VS Code extension
 */
export enum SupervisorEvent {
    GoalDeviation = 'goal-deviation',
    CodeReversal = 'code-reversal',
    UnauthorizedAction = 'unauthorized-action',
    ScopeViolation = 'scope-violation',
    RapidChanges = 'rapid-changes'
}

/**
 * Deviation event data for UI
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
 * Supervisor state tracking
 */
export interface SupervisorState {
    isActive: boolean;
    isPaused: boolean;
    aiToolActive: string | null;
    monitoredFiles: number;
    recentDeviations: number;
    databaseInitialized: boolean;
}

/**
 * Activity event for activity monitor
 */
interface ActivityEvent {
    description: string;
    severity?: 'warning' | 'error';
    timestamp: number;
    metadata?: Record<string, any>;
}

/**
 * SupervisorBridge class
 *
 * Central integration point connecting all VS Code components with core supervisor engine.
 */
export class SupervisorBridge {
    // Core supervisor engine
    private supervisorAPI: SupervisorAPI | null = null;

    // VS Code components
    private fileWatcher: FileWatcher;
    private aiDetector: AIDetector;
    private interceptLayer: InterceptLayer;
    private alertManager: AlertManager;

    // State management
    private state: SupervisorState = {
        isActive: false,
        isPaused: false,
        aiToolActive: null,
        monitoredFiles: 0,
        recentDeviations: 0,
        databaseInitialized: false
    };

    // File content cache for change detection
    private fileContentCache: Map<string, string> = new Map();

    // Activity history buffer
    private activityHistory: ActivityEvent[] = [];
    private readonly MAX_ACTIVITY_HISTORY = 100;

    private disposables: vscode.Disposable[] = [];
    private stateChangeEmitter: vscode.EventEmitter<SupervisorState>;

    /**
     * Event fired when supervisor state changes
     */
    public readonly onDidChangeState: vscode.Event<SupervisorState>;

    constructor(private context: vscode.ExtensionContext) {
        // Initialize VS Code components
        this.fileWatcher = new FileWatcher(context);
        this.aiDetector = new AIDetector();
        this.interceptLayer = new InterceptLayer();
        this.alertManager = new AlertManager(context);

        // Initialize state event emitter
        this.stateChangeEmitter = new vscode.EventEmitter<SupervisorState>();
        this.onDidChangeState = this.stateChangeEmitter.event;

        this.setupEventHandlers();
    }

    /**
     * Initialize the supervisor bridge and core engine
     */
    public async initialize(): Promise<void> {
        try {
            console.log('SupervisorBridge: Initializing...');

            // Initialize database
            await this.initializeDatabase();

            // Initialize core supervisor API
            await this.initializeSupervisorAPI();

            // Load existing goals and history
            await this.loadExistingData();

            // Scan for AI tools
            const tools = await this.aiDetector.scan();
            console.log(`SupervisorBridge: Detected ${tools.length} AI tools`);

            // Initialize interception for primary tool
            const primaryTool = this.aiDetector.getPrimaryTool();
            if (primaryTool) {
                await this.interceptLayer.initialize();
                this.state.aiToolActive = primaryTool.name;
            }

            // Start file watching
            this.startFileWatching();

            // Mark as active
            this.state.isActive = true;
            this.emitStateChange();

            // Log initialization
            this.addActivityEvent({
                description: 'AI Supervisor initialized and monitoring active',
                timestamp: Date.now()
            });

            console.log('SupervisorBridge: Initialization complete');

        } catch (error) {
            console.error('SupervisorBridge: Initialization failed', error);
            await vscode.window.showErrorMessage(
                `AI Supervisor failed to initialize: ${error instanceof Error ? error.message : String(error)}`
            );
            throw error;
        }
    }

    /**
     * Initialize SQLite database in workspace .vscode folder
     */
    private async initializeDatabase(): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder open. Please open a workspace to use AI Supervisor.');
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const vscodePath = path.join(workspaceRoot, '.vscode');

        // Create .vscode directory if it doesn't exist
        if (!fs.existsSync(vscodePath)) {
            fs.mkdirSync(vscodePath, { recursive: true });
        }

        const dbPath = path.join(vscodePath, 'ai-supervisor.db');

        // Store database path in context
        this.context.workspaceState.update('databasePath', dbPath);

        console.log(`SupervisorBridge: Database initialized at ${dbPath}`);
        this.state.databaseInitialized = true;
    }

    /**
     * Initialize core SupervisorAPI instance
     */
    private async initializeSupervisorAPI(): Promise<void> {
        const dbPath = this.context.workspaceState.get<string>('databasePath');
        if (!dbPath) {
            throw new Error('Database path not initialized');
        }

        const config = vscode.workspace.getConfiguration('aiSupervisor');

        this.supervisorAPI = new SupervisorAPI({
            databasePath: dbPath,
            enableCodeReversalDetection: true,
            enableScopeValidation: true,
            enableUnauthorizedActionPrevention: true,
            maxConversationHistory: config.get<number>('storage.maxHistory') || 1000,
            retentionDays: config.get<number>('storage.retentionDays') || 30,
            interventionThreshold: config.get<string>('monitoring.sensitivity') as 'low' | 'medium' | 'high' || 'medium'
        });

        // Set up core engine event handlers
        this.setupCoreEngineEvents();

        console.log('SupervisorBridge: Core SupervisorAPI initialized');
    }

    /**
     * Set up event handlers for core engine
     */
    private setupCoreEngineEvents(): void {
        if (!this.supervisorAPI) return;

        // Handle deviation events from core engine
        this.supervisorAPI.on('deviation', async (deviation: Deviation) => {
            await this.handleCoreDeviation(deviation);
        });

        // Handle intervention events from core engine
        this.supervisorAPI.on('intervention', async (intervention: Intervention) => {
            await this.handleCoreIntervention(intervention);
        });
    }

    /**
     * Load existing goals and history from database
     */
    private async loadExistingData(): Promise<void> {
        if (!this.supervisorAPI) return;

        try {
            // Load active goals
            const goals = this.supervisorAPI.getActiveGoals();
            console.log(`SupervisorBridge: Loaded ${goals.length} active goals`);

            // Load recent code changes
            const recentChanges = this.supervisorAPI.getCodeChangeHistory(undefined, 50);
            console.log(`SupervisorBridge: Loaded ${recentChanges.length} recent code changes`);

            // Load recent deviations
            const deviations = this.supervisorAPI.getDeviations(undefined, 20);
            this.state.recentDeviations = deviations.length;
            console.log(`SupervisorBridge: Loaded ${deviations.length} recent deviations`);

        } catch (error) {
            console.error('SupervisorBridge: Error loading existing data', error);
        }
    }

    /**
     * Start file watching and connect to core engine
     */
    private startFileWatching(): void {
        // Already initialized in constructor, just ensure it's active
        this.fileWatcher.resume();
        console.log('SupervisorBridge: File watching started');
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

        // Handle file system changes - integrate with core engine
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            const watcher = vscode.workspace.createFileSystemWatcher(
                new vscode.RelativePattern(workspaceFolders[0], '**/*.{ts,js,tsx,jsx,py,java,go,rs,cpp,c,h,cs,php,rb,swift,kt}')
            );

            watcher.onDidChange(uri => this.handleFileChange(uri, 'change'));
            watcher.onDidCreate(uri => this.handleFileChange(uri, 'create'));
            watcher.onDidDelete(uri => this.handleFileChange(uri, 'delete'));

            this.disposables.push(watcher);
        }
    }

    /**
     * Handle file change events and route to core engine
     */
    private async handleFileChange(uri: vscode.Uri, changeType: 'change' | 'create' | 'delete'): Promise<void> {
        if (this.state.isPaused || !this.supervisorAPI) return;

        try {
            const filePath = uri.fsPath;
            const relativePath = vscode.workspace.asRelativePath(filePath);

            if (changeType === 'delete') {
                this.fileContentCache.delete(filePath);
                this.addActivityEvent({
                    description: `File deleted: ${relativePath}`,
                    timestamp: Date.now()
                });
                return;
            }

            // Read current file content
            const document = await vscode.workspace.openTextDocument(uri);
            const afterContent = document.getText();

            // Get previous content from cache
            const beforeContent = this.fileContentCache.get(filePath) || '';

            // Skip if no actual change
            if (beforeContent === afterContent && changeType !== 'create') {
                return;
            }

            // Update cache
            this.fileContentCache.set(filePath, afterContent);

            // Log change to core engine
            const codeChange = await this.supervisorAPI.logCodeChange(
                relativePath,
                beforeContent,
                afterContent,
                changeType === 'create' ? 'File created' : 'File modified'
            );

            // Add to activity
            this.addActivityEvent({
                description: `${changeType === 'create' ? 'Created' : 'Modified'}: ${relativePath} (${this.getChangeStats(beforeContent, afterContent)})`,
                timestamp: Date.now()
            });

            // Update monitored files count
            this.state.monitoredFiles = this.fileContentCache.size;
            this.emitStateChange();

        } catch (error) {
            console.error('SupervisorBridge: Error handling file change', error);
        }
    }

    /**
     * Get change statistics
     */
    private getChangeStats(before: string, after: string): string {
        const beforeLines = before.split('\n').length;
        const afterLines = after.split('\n').length;
        const diff = afterLines - beforeLines;

        if (diff > 0) return `+${diff} lines`;
        if (diff < 0) return `${diff} lines`;
        return 'modified';
    }

    /**
     * Handle detected AI tools
     */
    private async handleAIToolsDetected(tools: AIToolInfo[]): Promise<void> {
        if (tools.length === 0) return;

        const primaryTool = tools.find(t => t.isActive) || tools[0];

        if (primaryTool && this.state.aiToolActive !== primaryTool.name) {
            this.state.aiToolActive = primaryTool.name;
            this.emitStateChange();

            // Reinitialize interception layer
            await this.interceptLayer.initialize();

            // Log activity
            this.addActivityEvent({
                description: `Now monitoring ${primaryTool.name}`,
                timestamp: Date.now()
            });

            await vscode.window.showInformationMessage(
                `AI Supervisor: Now monitoring ${primaryTool.name}`
            );
        }
    }

    /**
     * Handle deviation events from core engine
     */
    private async handleCoreDeviation(deviation: Deviation): Promise<void> {
        console.log('Deviation detected by core engine:', deviation);

        this.state.recentDeviations++;
        this.emitStateChange();

        // Map to internal event format
        const deviationEvent: DeviationEvent = {
            type: this.mapDeviationType(deviation.type),
            severity: deviation.severity,
            message: deviation.message,
            details: deviation.suggestedAction,
            file: deviation.affectedFiles[0],
            timestamp: deviation.timestamp.getTime(),
            metadata: deviation.metadata
        };

        // Route to alert manager
        await this.handleDeviation(deviationEvent);

        // Add to activity
        this.addActivityEvent({
            description: `Deviation: ${deviation.message}`,
            severity: deviation.severity === 'critical' || deviation.severity === 'high' ? 'error' : 'warning',
            timestamp: deviation.timestamp.getTime(),
            metadata: deviation.metadata
        });
    }

    /**
     * Map core deviation type to extension event type
     */
    private mapDeviationType(type: string): SupervisorEvent {
        switch (type) {
            case 'code_reversal':
                return SupervisorEvent.CodeReversal;
            case 'goal_deviation':
                return SupervisorEvent.GoalDeviation;
            case 'scope_violation':
                return SupervisorEvent.ScopeViolation;
            case 'unauthorized_action':
                return SupervisorEvent.UnauthorizedAction;
            default:
                return SupervisorEvent.RapidChanges;
        }
    }

    /**
     * Handle intervention events from core engine
     */
    private async handleCoreIntervention(intervention: Intervention): Promise<void> {
        console.log('Intervention created:', intervention);

        // Show intervention alert
        const severity = intervention.type === 'block' ? AlertSeverity.Error :
                        intervention.type === 'pause' ? AlertSeverity.Warning :
                        AlertSeverity.Info;

        const alert: Alert = {
            id: intervention.id,
            type: AlertType.Generic,
            message: `AI Supervisor Intervention: ${intervention.message}`,
            severity: severity,
            timestamp: intervention.timestamp.getTime(),
            metadata: {
                interventionType: intervention.type,
                details: intervention.aiMessageGenerated
            }
        };

        await this.alertManager.showAlert(alert);

        // Add to activity
        this.addActivityEvent({
            description: `Intervention: ${intervention.message}`,
            severity: intervention.type === 'block' || intervention.type === 'pause' ? 'error' : 'warning',
            timestamp: intervention.timestamp.getTime()
        });
    }

    /**
     * Handle deviation events and route to alert manager
     */
    private async handleDeviation(event: DeviationEvent): Promise<void> {
        console.log('Handling deviation event:', event);

        const alertType = this.mapToAlertType(event.type);
        const alertSeverity = this.mapSeverity(event.severity);

        const alert: Alert = {
            id: `deviation-${Date.now()}`,
            type: alertType,
            message: event.message,
            severity: alertSeverity,
            timestamp: event.timestamp,
            metadata: {
                filePath: event.file,
                details: event.details,
                ...event.metadata
            }
        };

        await this.alertManager.showAlert(alert);
    }

    /**
     * Map supervisor event type to alert type
     */
    private mapToAlertType(type: SupervisorEvent): AlertType {
        switch (type) {
            case SupervisorEvent.GoalDeviation:
                return AlertType.GoalDeviation;
            case SupervisorEvent.CodeReversal:
                return AlertType.CodeReversal;
            case SupervisorEvent.UnauthorizedAction:
                return AlertType.UnauthorizedAction;
            case SupervisorEvent.RapidChanges:
                return AlertType.RapidChanges;
            default:
                return AlertType.Generic;
        }
    }

    /**
     * Map event severity to alert severity
     */
    private mapSeverity(severity: string): AlertSeverity {
        switch (severity) {
            case 'critical':
                return AlertSeverity.Error;
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
     * Add activity event to history
     */
    private addActivityEvent(event: ActivityEvent): void {
        this.activityHistory.unshift(event);

        // Limit history size
        if (this.activityHistory.length > this.MAX_ACTIVITY_HISTORY) {
            this.activityHistory = this.activityHistory.slice(0, this.MAX_ACTIVITY_HISTORY);
        }

        // Notify activity monitor if panel is open
        this.updateActivityMonitor();
    }

    /**
     * Update activity monitor panel with latest activity
     */
    private updateActivityMonitor(): void {
        // Activity monitor panel will poll for updates or we can implement event-based updates later
        // For now, the panel is self-contained
    }

    /**
     * Pause AI monitoring
     */
    public pause(): void {
        this.state.isPaused = true;
        this.fileWatcher.pause();
        this.emitStateChange();

        this.addActivityEvent({
            description: 'Monitoring paused',
            timestamp: Date.now()
        });

        vscode.window.showInformationMessage('AI Supervisor: Monitoring paused');
    }

    /**
     * Resume AI monitoring
     */
    public resume(): void {
        this.state.isPaused = false;
        this.fileWatcher.resume();
        this.emitStateChange();

        this.addActivityEvent({
            description: 'Monitoring resumed',
            timestamp: Date.now()
        });

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
     * Get core SupervisorAPI instance
     */
    public getSupervisorAPI(): SupervisorAPI | null {
        return this.supervisorAPI;
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
     * Get activity history
     */
    public getActivityHistory(): ActivityEvent[] {
        return [...this.activityHistory];
    }

    /**
     * Clear activity history
     */
    public clearActivityHistory(): void {
        this.activityHistory = [];
        this.updateActivityMonitor();
    }

    /**
     * Export supervision report
     */
    public async exportReport(): Promise<void> {
        if (!this.supervisorAPI) {
            vscode.window.showErrorMessage('Supervisor API not initialized');
            return;
        }

        try {
            const markdown = this.supervisorAPI.exportSummaryMarkdown();

            // Show in new document
            const doc = await vscode.workspace.openTextDocument({
                content: markdown,
                language: 'markdown'
            });

            await vscode.window.showTextDocument(doc);

            this.addActivityEvent({
                description: 'Supervision report exported',
                timestamp: Date.now()
            });

        } catch (error) {
            console.error('SupervisorBridge: Error exporting report', error);
            vscode.window.showErrorMessage(
                `Failed to export report: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Generate model switch handoff
     */
    public async generateHandoff(): Promise<void> {
        if (!this.supervisorAPI) {
            vscode.window.showErrorMessage('Supervisor API not initialized');
            return;
        }

        try {
            const summary = this.supervisorAPI.generateModelSwitchSummary();
            const markdown = this.supervisorAPI.exportSummaryMarkdown();

            // Show in new document
            const doc = await vscode.workspace.openTextDocument({
                content: markdown,
                language: 'markdown'
            });

            await vscode.window.showTextDocument(doc);

            this.addActivityEvent({
                description: 'Model switch handoff generated',
                timestamp: Date.now()
            });

            vscode.window.showInformationMessage(
                'Model switch handoff generated. Share this document when switching AI models.'
            );

        } catch (error) {
            console.error('SupervisorBridge: Error generating handoff', error);
            vscode.window.showErrorMessage(
                `Failed to generate handoff: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Cleanup old data
     */
    public async cleanup(): Promise<void> {
        if (!this.supervisorAPI) return;

        try {
            const config = vscode.workspace.getConfiguration('aiSupervisor');
            const retentionDays = config.get<number>('storage.retentionDays') || 30;

            this.supervisorAPI.cleanup();

            this.addActivityEvent({
                description: `Cleaned up data older than ${retentionDays} days`,
                timestamp: Date.now()
            });

            vscode.window.showInformationMessage(
                `Cleaned up supervision data older than ${retentionDays} days`
            );

        } catch (error) {
            console.error('SupervisorBridge: Error during cleanup', error);
        }
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        // Dispose components
        this.fileWatcher.dispose();
        this.aiDetector.dispose();
        this.interceptLayer.dispose();
        this.alertManager.dispose();

        // Dispose event listeners
        for (const disposable of this.disposables) {
            disposable.dispose();
        }

        // Close core engine
        if (this.supervisorAPI) {
            this.supervisorAPI.close();
        }

        // Clear caches
        this.fileContentCache.clear();
        this.activityHistory = [];

        this.stateChangeEmitter.dispose();

        console.log('SupervisorBridge: Disposed');
    }
}
