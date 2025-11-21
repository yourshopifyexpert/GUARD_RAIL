import * as vscode from 'vscode';
import { Commands } from './commands/Commands';
import { FileWatcher } from './integration/FileWatcher';
import { AIDetector } from './integration/AIDetector';
import { AlertManager } from './notifications/AlertManager';
import { ActivityMonitorPanel } from './panels/ActivityMonitor';
import { GoalManagerPanel } from './panels/GoalManager';
import { ChangeInspectorPanel } from './panels/ChangeInspector';
// import { SupervisorEngine } from 'ai-supervisor';

/**
 * Extension state and services
 */
export class ExtensionContext {
    private static instance: ExtensionContext;
    
    public readonly context: vscode.ExtensionContext;
    public fileWatcher: FileWatcher | undefined;
    public aiDetector: AIDetector | undefined;
    public alertManager: AlertManager | undefined;
    // public supervisorEngine: SupervisorEngine | undefined;
    
    private monitoringActive: boolean = true;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public static getInstance(context?: vscode.ExtensionContext): ExtensionContext {
        if (!ExtensionContext.instance && context) {
            ExtensionContext.instance = new ExtensionContext(context);
        }
        return ExtensionContext.instance;
    }

    public isMonitoringActive(): boolean {
        return this.monitoringActive;
    }

    public setMonitoringActive(active: boolean): void {
        this.monitoringActive = active;
        vscode.commands.executeCommand('setContext', 'aiSupervisor.monitoring.active', active);
    }
}

/**
 * Called when the extension is activated
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    console.log('AI Supervisor extension is now active');

    // Initialize extension context
    const extContext = ExtensionContext.getInstance(context);

    // Check if monitoring is enabled in settings
    const config = vscode.workspace.getConfiguration('aiSupervisor');
    const monitoringEnabled = config.get<boolean>('monitoring.enabled', true);
    extContext.setMonitoringActive(monitoringEnabled);

    // Initialize core services
    try {
        // Initialize AI Supervisor core engine
        // extContext.supervisorEngine = new SupervisorEngine({
        //     storageLocation: context.globalStorageUri.fsPath,
        //     sensitivity: config.get('monitoring.sensitivity', 'medium')
        // });

        // Initialize change storage service
        const { ChangeStorageService } = await import('./services/ChangeStorageService');
        const changeStorage = ChangeStorageService.getInstance(context);

        // Initialize file watcher for monitoring workspace changes
        extContext.fileWatcher = new FileWatcher(context);

        // Connect file watcher to change storage
        extContext.fileWatcher.onDidChangeFile((changeEvent) => {
            // Store the change if it's likely AI-generated
            if (changeEvent.aiLikelihood.isLikelyAI) {
                changeStorage.recordFileChange(
                    changeEvent.uri,
                    changeEvent.beforeContent || '',
                    changeEvent.afterContent || '',
                    changeEvent.type
                );
            }
        });

        // Initialize AI tool detector
        extContext.aiDetector = new AIDetector();

        // Initialize alert manager
        extContext.alertManager = new AlertManager(context);

        console.log('Core services initialized successfully');
    } catch (error) {
        console.error('Failed to initialize core services:', error);
        vscode.window.showErrorMessage(
            'AI Supervisor: Failed to initialize monitoring services. Some features may not work correctly.'
        );
    }

    // Register all commands
    registerCommands(context);

    // Register webview providers
    registerWebviewProviders(context);

    // Set up context keys for when clauses
    await vscode.commands.executeCommand('setContext', 'aiSupervisor.monitoring.active', extContext.isMonitoringActive());

    // Show welcome message on first activation
    const isFirstActivation = context.globalState.get<boolean>('aiSupervisor.firstActivation', true);
    if (isFirstActivation) {
        await showWelcomeMessage(context);
        await context.globalState.update('aiSupervisor.firstActivation', false);
    }

    // Check for premium license
    checkPremiumLicense(context);

    console.log('AI Supervisor extension activation complete');
}

/**
 * Register all extension commands
 */
function registerCommands(context: vscode.ExtensionContext): void {
    const commands = new Commands(context);

    // Register each command
    context.subscriptions.push(
        vscode.commands.registerCommand('aiSupervisor.showActivityMonitor', () => commands.showActivityMonitor()),
        vscode.commands.registerCommand('aiSupervisor.showGoalManager', () => commands.showGoalManager()),
        vscode.commands.registerCommand('aiSupervisor.showChangeInspector', () => commands.showChangeInspector()),
        vscode.commands.registerCommand('aiSupervisor.pauseMonitoring', () => commands.pauseMonitoring()),
        vscode.commands.registerCommand('aiSupervisor.resumeMonitoring', () => commands.resumeMonitoring()),
        vscode.commands.registerCommand('aiSupervisor.generateHandoff', () => commands.generateHandoff()),
        vscode.commands.registerCommand('aiSupervisor.clearHistory', () => commands.clearHistory()),
        vscode.commands.registerCommand('aiSupervisor.exportReport', () => commands.exportReport()),
        vscode.commands.registerCommand('aiSupervisor.openSettings', () => commands.openSettings()),
        vscode.commands.registerCommand('aiSupervisor.activatePremium', () => commands.activatePremium()),
        vscode.commands.registerCommand('aiSupervisor.showAlertHistory', async () => {
            const alertManager = ExtensionContext.getInstance().alertManager;
            if (alertManager) {
                await alertManager.showAlertHistoryQuickPick();
            }
        })
    );

    console.log('Commands registered successfully');
}

/**
 * Register webview panel providers
 */
function registerWebviewProviders(_context: vscode.ExtensionContext): void {
    // Activity Monitor Panel is created on-demand via command
    // Goal Manager Panel is created on-demand via command
    // Change Inspector Panel is created on-demand via command

    console.log('Webview providers registered successfully');
}

/**
 * Show welcome message on first activation
 */
async function showWelcomeMessage(_context: vscode.ExtensionContext): Promise<void> {
    const message = 'Welcome to AI Supervisor! Monitor and control AI code changes in real-time.';
    const action = await vscode.window.showInformationMessage(
        message,
        'View Activity',
        'Set Goals',
        'Learn More'
    );

    switch (action) {
        case 'View Activity':
            vscode.commands.executeCommand('aiSupervisor.showActivityMonitor');
            break;
        case 'Set Goals':
            vscode.commands.executeCommand('aiSupervisor.showGoalManager');
            break;
        case 'Learn More':
            vscode.env.openExternal(vscode.Uri.parse('https://github.com/your-org/ai-supervisor#readme'));
            break;
    }
}

/**
 * Check for premium license
 */
function checkPremiumLicense(context: vscode.ExtensionContext): void {
    const config = vscode.workspace.getConfiguration('aiSupervisor');
    const licenseKey = config.get<string>('premium.licenseKey', '');

    if (licenseKey) {
        // TODO: Validate license key with licensing server
        console.log('Premium license detected (validation pending)');
        context.globalState.update('aiSupervisor.isPremium', true);
    } else {
        context.globalState.update('aiSupervisor.isPremium', false);
        console.log('Running in free mode');
    }
}

/**
 * Called when the extension is deactivated
 */
export function deactivate(): void {
    const extContext = ExtensionContext.getInstance();

    // Clean up file watcher
    extContext.fileWatcher?.dispose();

    // Clean up alert manager
    extContext.alertManager?.dispose();

    // Clean up any active panels
    ActivityMonitorPanel.dispose();
    GoalManagerPanel.dispose();
    ChangeInspectorPanel.dispose();

    console.log('AI Supervisor extension deactivated');
}
