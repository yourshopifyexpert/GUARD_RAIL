/**
 * Basic Usage Example for AI Supervisor
 * 
 * This example demonstrates how to integrate the AI Supervisor
 * into your AI coding assistant or IDE extension.
 */

import { SupervisorAPI } from '../src/api/SupervisorAPI';

async function main() {
  // Initialize the supervisor
  const supervisor = new SupervisorAPI({
    databasePath: './supervisor.db',
    interventionThreshold: 'medium',
    enableCodeReversalDetection: true,
    enableScopeValidation: true,
    maxConversationHistory: 1000,
    retentionDays: 30
  });

  console.log('AI Supervisor initialized\n');

  // Example 1: Setting up project goals
  console.log('=== Example 1: Setting Up Project Goals ===\n');

  const authGoal = supervisor.createGoal(
    'Implement User Authentication',
    'Build a secure JWT-based authentication system',
    ['no_external_api', 'no_deletions'],
    ['src/auth/', 'src/middleware/', '**/*.ts']
  );

  console.log('Created goal:', authGoal.title);
  console.log('Constraints:', authGoal.constraints);

  // Example 2: Logging conversations
  console.log('\n=== Example 2: Logging Conversations ===\n');

  supervisor.logUserMessage('Create an authentication middleware that validates JWT tokens');
  supervisor.logAssistantMessage('I will create the authentication middleware');

  console.log('Conversation logged');

  // Example 3: Logging code changes
  console.log('\n=== Example 3: Logging Code Changes ===\n');

  const codeChange = supervisor.logCodeChange(
    'src/auth/middleware.ts',
    '',
    'export const authMiddleware = () => { /* auth logic */ }',
    'Created JWT authentication middleware'
  );

  console.log('Code change logged:', codeChange.filePath);

  // Example 4: Event listeners for deviations
  console.log('\n=== Example 4: Setting Up Event Listeners ===\n');

  supervisor.on('deviation', (deviation) => {
    console.log('DEVIATION DETECTED:', deviation.type, '-', deviation.severity);
  });

  supervisor.on('intervention', (intervention) => {
    console.log('INTERVENTION:', intervention.type);
    console.log('Message:', intervention.message);
  });

  // Example 5: Detecting scope violations
  console.log('\n=== Example 5: Scope Violation Detection ===\n');

  supervisor.logCodeChange(
    'src/database/models/User.ts',
    '',
    'export class User {}',
    'Created user model (outside scope)'
  );

  // Example 6: Model switching
  console.log('\n=== Example 6: Model Switching ===\n');

  const summary = supervisor.generateModelSwitchSummary();
  console.log('Generated model switch summary');
  console.log('Active goals:', summary.activeGoals.length);
  console.log('Recent changes:', summary.recentChanges.length);

  const markdown = supervisor.exportSummaryMarkdown();
  console.log('\nMarkdown summary generated (length:', markdown.length, 'chars)');

  // Example 7: Querying data
  console.log('\n=== Example 7: Querying History ===\n');

  const conversations = supervisor.getConversationHistory(5);
  console.log('Recent conversations:', conversations.length);

  const changes = supervisor.getCodeChangeHistory();
  console.log('Total code changes:', changes.length);

  const activeGoals = supervisor.getActiveGoals();
  console.log('Active goals:', activeGoals.length);

  // Example 8: Completing goals
  console.log('\n=== Example 8: Managing Goals ===\n');

  supervisor.completeGoal(authGoal.id);
  console.log('Goal completed:', authGoal.title);

  // Cleanup
  supervisor.close();
  console.log('\nSupervisor closed');
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { main };
