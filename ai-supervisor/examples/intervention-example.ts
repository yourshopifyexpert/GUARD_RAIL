/**
 * Comprehensive example of the AI Supervisor Intervention System
 *
 * This example demonstrates:
 * - Setting up the InterventionManager
 * - Configuring intervention protocols
 * - Handling different types of alerts
 * - Using the ModelSwitchHandler for context preservation
 * - Generating corrective prompts
 * - Managing pause/resume/halt mechanisms
 */

import {
  InterventionManager,
  ModelSwitchHandler,
  StandardProtocols,
  ProtocolPresets,
  ProtocolBuilder,
  IssueType,
  AlertSeverity,
  AlertChannel,
  InterventionStrategy,
  InterventionConfig
} from '../src/core/index.js';

/**
 * Example 1: Basic Intervention Manager Setup
 */
async function basicSetup() {
  console.log('\n=== Example 1: Basic Setup ===\n');

  // Create intervention manager with balanced protocols
  const manager = new InterventionManager({
    channels: [AlertChannel.CONSOLE, AlertChannel.EVENT],
    protocols: ProtocolPresets.balanced,
    enableAutoCorrection: true,
    enableModelSwitch: true,
    maxAlertsBeforeHalt: 10,
    alertRetentionDays: 30
  });

  // Listen for intervention events
  manager.on('alert', (event) => {
    console.log('Alert received:', event.alert?.message);
  });

  manager.on('intervention', (event) => {
    console.log('Intervention triggered:', event.prompt?.message);
  });

  // Trigger a sample intervention
  const alert = await manager.triggerIntervention({
    issueType: IssueType.CODE_REVERSAL,
    severity: AlertSeverity.WARNING,
    message: 'AI is reversing changes to authentication logic',
    context: {
      files: ['src/auth/login.ts'],
      codeSnippets: ['- const token = generateToken();'],
      metadata: {
        lineNumber: 42,
        previousVersion: 'v1.2.0'
      }
    }
  });

  console.log('Alert ID:', alert.id);
  console.log('Requires user action:', alert.requiresUserAction);
}

/**
 * Example 2: Custom Protocol Configuration
 */
async function customProtocols() {
  console.log('\n=== Example 2: Custom Protocols ===\n');

  // Build a custom protocol using ProtocolBuilder
  const customProtocol = new ProtocolBuilder(IssueType.UNAUTHORIZED_ACTION)
    .withSeverity(AlertSeverity.CRITICAL)
    .withStrategy(InterventionStrategy.HALT)
    .withChannels([AlertChannel.CONSOLE, AlertChannel.EVENT, AlertChannel.NOTIFICATION])
    .withAutoCorrect(false)
    .pauseOnTrigger(true)
    .withCustomHandler(async (alert) => {
      console.log('Custom handler: Logging security event...');
      // Could integrate with external security monitoring
    })
    .build();

  // Create manager with custom protocol
  const protocols = new Map([
    [IssueType.UNAUTHORIZED_ACTION, customProtocol],
    [IssueType.CODE_REVERSAL, StandardProtocols.codeReversal],
    [IssueType.GOAL_DEVIATION, StandardProtocols.goalDeviation]
  ]);

  const manager = new InterventionManager({
    channels: [AlertChannel.CONSOLE],
    protocols,
    enableAutoCorrection: true,
    enableModelSwitch: false
  });

  // This will trigger the halt mechanism
  await manager.triggerIntervention({
    issueType: IssueType.UNAUTHORIZED_ACTION,
    severity: AlertSeverity.CRITICAL,
    message: 'Attempted to access sensitive configuration file',
    context: {
      files: ['/etc/secrets.conf'],
      metadata: {
        attemptedOperation: 'read',
        reason: 'Out of project scope'
      }
    }
  });

  console.log('Is halted:', manager.halted);
}

/**
 * Example 3: Pause and Resume Mechanisms
 */
async function pauseResumeExample() {
  console.log('\n=== Example 3: Pause/Resume Mechanisms ===\n');

  const manager = new InterventionManager({
    channels: [AlertChannel.CONSOLE],
    protocols: ProtocolPresets.balanced,
    enableAutoCorrection: true,
    enableModelSwitch: true
  });

  // Listen for pause/resume events
  manager.on('pause', (event) => {
    console.log('Execution paused:', event.data?.reason);
  });

  manager.on('resume', (event) => {
    console.log('Execution resumed');
  });

  // Trigger intervention that pauses execution
  await manager.triggerIntervention({
    issueType: IssueType.CIRCULAR_EDIT,
    severity: AlertSeverity.WARNING,
    message: 'Detected circular edits in database schema',
    context: {
      files: ['src/db/schema.ts'],
      metadata: {
        editCount: 5,
        timeWindow: '2 minutes'
      }
    }
  });

  console.log('Is paused:', manager.paused);

  // Simulate user review and resume
  setTimeout(async () => {
    console.log('\nUser reviewed the issue, resuming...');
    await manager.resume();
    console.log('Is paused:', manager.paused);
  }, 2000);
}

/**
 * Example 4: Corrective Prompt Generation
 */
async function correctivePromptExample() {
  console.log('\n=== Example 4: Corrective Prompts ===\n');

  const manager = new InterventionManager({
    channels: [AlertChannel.CONSOLE],
    protocols: ProtocolPresets.balanced,
    enableAutoCorrection: true,
    enableModelSwitch: true
  });

  // Trigger intervention
  const alert = await manager.triggerIntervention({
    issueType: IssueType.GOAL_DEVIATION,
    severity: AlertSeverity.WARNING,
    message: 'AI is adding UI components when task is backend-only',
    context: {
      files: ['src/components/NewButton.tsx'],
      conversationContext: 'User requested: "Add API endpoint for user registration"',
      metadata: {
        scope: 'backend-api-only',
        violatedConstraint: 'no-frontend-changes'
      }
    }
  });

  // Generate corrective prompt
  const prompt = await manager.generateCorrectivePrompt(alert);

  console.log('\n--- Corrective Prompt for AI ---');
  console.log(prompt.message);
  console.log('\n--- Context ---');
  console.log('Problem:', prompt.context.problem);
  console.log('Expected:', prompt.context.expectedBehavior);
}

/**
 * Example 5: Model Switch Handler
 */
async function modelSwitchExample() {
  console.log('\n=== Example 5: Model Switch Handler ===\n');

  const switchHandler = new ModelSwitchHandler({
    maxRecentChanges: 10,
    maxConversationMessages: 50,
    includeDiffs: true,
    compressionStrategy: 'summarize'
  });

  // Track some changes
  switchHandler.trackChange({
    file: 'src/api/users.ts',
    summary: 'Implemented user registration endpoint',
    reason: 'Required for MVP launch',
    timestamp: new Date(),
    diff: '+ router.post("/register", async (req, res) => {...})'
  });

  switchHandler.trackChange({
    file: 'src/db/models/User.ts',
    summary: 'Added User model with validation',
    reason: 'Data persistence for user accounts',
    timestamp: new Date()
  });

  // Track decisions
  switchHandler.trackDecision({
    decision: 'Use bcrypt for password hashing',
    rationale: 'Industry standard, well-tested security',
    timestamp: new Date(),
    relatedFiles: ['src/api/auth.ts']
  });

  // Set goals
  switchHandler.addGoal({
    description: 'Implement user authentication system',
    status: 'active',
    priority: 'high',
    timestamp: new Date()
  });

  switchHandler.addGoal({
    description: 'Add comprehensive error handling',
    status: 'active',
    priority: 'medium',
    timestamp: new Date()
  });

  // Track conversation
  switchHandler.trackConversation({
    role: 'user',
    content: 'Add user registration with email and password',
    timestamp: new Date(),
    important: true
  });

  switchHandler.trackConversation({
    role: 'assistant',
    content: 'I will implement user registration with proper validation',
    timestamp: new Date()
  });

  // Generate handoff
  const handoff = await switchHandler.generateHandoff({
    sourceModel: 'gpt-4-turbo',
    targetModel: 'claude-3-opus',
    currentGoals: [
      'Complete user authentication',
      'Add unit tests',
      'Update API documentation'
    ],
    activeScope: {
      allowed: ['src/api/**', 'src/db/**', 'tests/**'],
      prohibited: ['node_modules/**', 'dist/**', '.env'],
      filePatterns: ['*.ts', '*.js']
    },
    pendingTasks: [
      'Add password reset functionality',
      'Implement rate limiting',
      'Add logging'
    ],
    criticalContext: 'Currently implementing authentication. Database schema is finalized.'
  });

  console.log('Handoff ID:', handoff.id);
  console.log('\n--- Handoff Document ---');
  const document = switchHandler.exportHandoffDocument(handoff);
  console.log(document);

  // Also show JSON export
  console.log('\n--- JSON Export ---');
  console.log(switchHandler.exportHandoffJSON(handoff));
}

/**
 * Example 6: Using Strict Protocols
 */
async function strictProtocolsExample() {
  console.log('\n=== Example 6: Strict Protocols ===\n');

  const manager = new InterventionManager({
    channels: [AlertChannel.CONSOLE, AlertChannel.NOTIFICATION],
    protocols: ProtocolPresets.strict,
    enableAutoCorrection: true,
    enableModelSwitch: true,
    maxAlertsBeforeHalt: 5 // Lower threshold for strict mode
  });

  manager.on('halt', (event) => {
    console.log('\n!!! SYSTEM HALTED !!!');
    console.log('Reason:', event.data?.reason);
  });

  // Even minor deviations trigger strong interventions
  await manager.triggerIntervention({
    issueType: IssueType.SCOPE_VIOLATION,
    severity: AlertSeverity.WARNING,
    message: 'Attempting to modify test fixtures',
    context: {
      files: ['tests/fixtures/users.json']
    }
  });

  console.log('Is paused:', manager.paused);
}

/**
 * Example 7: Alert Management
 */
async function alertManagementExample() {
  console.log('\n=== Example 7: Alert Management ===\n');

  const manager = new InterventionManager({
    channels: [AlertChannel.CONSOLE],
    protocols: ProtocolPresets.balanced,
    enableAutoCorrection: true,
    enableModelSwitch: true,
    alertRetentionDays: 7
  });

  // Create several alerts
  for (let i = 0; i < 5; i++) {
    await manager.triggerIntervention({
      issueType: IssueType.CODE_REVERSAL,
      severity: i % 2 === 0 ? AlertSeverity.WARNING : AlertSeverity.INFO,
      message: `Code reversal detected #${i + 1}`,
      context: {
        files: [`src/file${i}.ts`]
      }
    });
  }

  // Get all alerts
  const allAlerts = manager.getAlerts();
  console.log('Total alerts:', allAlerts.length);

  // Filter alerts by severity
  const warnings = manager.getAlerts({ severity: AlertSeverity.WARNING });
  console.log('Warning alerts:', warnings.length);

  // Filter by issue type
  const reversals = manager.getAlerts({ issueType: IssueType.CODE_REVERSAL });
  console.log('Code reversal alerts:', reversals.length);

  // Filter by time
  const recent = manager.getAlerts({ since: new Date(Date.now() - 60000) });
  console.log('Alerts in last minute:', recent.length);
}

/**
 * Run all examples
 */
async function runExamples() {
  try {
    await basicSetup();
    await customProtocols();
    await pauseResumeExample();
    await correctivePromptExample();
    await modelSwitchExample();
    await strictProtocolsExample();
    await alertManagementExample();

    console.log('\n=== All Examples Completed ===\n');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runExamples();
}

export {
  basicSetup,
  customProtocols,
  pauseResumeExample,
  correctivePromptExample,
  modelSwitchExample,
  strictProtocolsExample,
  alertManagementExample
};
