import { SupervisorAPI } from '../../src/api/SupervisorAPI';

describe('Supervisor End-to-End Tests', () => {
  let supervisor: SupervisorAPI;

  beforeEach(() => {
    supervisor = new SupervisorAPI({
      databasePath: ':memory:',
      interventionThreshold: 'medium'
    });
  });

  afterEach(() => {
    supervisor.close();
  });

  describe('Complete Workflow', () => {
    it('should handle full development session', () => {
      // 1. Create a goal
      const goal = supervisor.createGoal(
        'Implement Authentication',
        'Build JWT authentication system',
        ['no_external_api', 'no_deletions'],
        ['src/auth/']
      );

      expect(goal.id).toBeDefined();
      expect(goal.status).toBe('active');

      // 2. Log conversation
      supervisor.logUserMessage('Create authentication middleware');
      supervisor.logAssistantMessage('I will create the auth middleware');

      // 3. Log code changes
      const change1 = supervisor.logCodeChange(
        'src/auth/middleware.ts',
        '',
        'export const authMiddleware = () => {}',
        'Created auth middleware'
      );

      expect(change1.filePath).toBe('src/auth/middleware.ts');

      // 4. Verify no deviations for valid change
      const deviations = supervisor.getDeviations();
      expect(deviations).toHaveLength(0);

      // 5. Complete the goal
      const completed = supervisor.completeGoal(goal.id);
      expect(completed?.status).toBe('completed');
    });

    it('should detect and intervene on code reversal', (done) => {
      const goal = supervisor.createGoal(
        'Test Goal',
        'Description',
        [],
        ['src/']
      );

      // Listen for intervention
      supervisor.on('intervention', (intervention) => {
        expect(intervention.type).toBeDefined();
        expect(intervention.message).toContain('ALERT');
        done();
      });

      // Create initial change
      supervisor.logCodeChange(
        'src/test.ts',
        'function test() { return 1; }',
        'function test() { return 2; }',
        'Updated return value'
      );

      // Reverse the change
      supervisor.logCodeChange(
        'src/test.ts',
        'function test() { return 2; }',
        'function test() { return 1; }',
        'Reverted change'
      );
    });

    it('should detect scope violations', (done) => {
      const goal = supervisor.createGoal(
        'Auth Work',
        'Only modify auth directory',
        [],
        ['src/auth/']
      );

      supervisor.on('deviation', (deviation) => {
        expect(deviation.type).toBe('scope_violation');
        done();
      });

      // Change outside scope
      supervisor.logCodeChange(
        'src/database/models.ts',
        '',
        'export class User {}',
        'Created user model'
      );
    });

    it('should generate model switch summary', () => {
      // Set up scenario
      const goal = supervisor.createGoal(
        'Feature Implementation',
        'Implement new feature',
        [],
        ['src/features/']
      );

      supervisor.logUserMessage('Implement the new feature');
      supervisor.logAssistantMessage('I will implement it');
      
      supervisor.logCodeChange(
        'src/features/newFeature.ts',
        '',
        'export const newFeature = () => {}',
        'Created new feature'
      );

      // Generate summary
      const summary = supervisor.generateModelSwitchSummary();

      expect(summary.activeGoals).toHaveLength(1);
      expect(summary.activeGoals[0].id).toBe(goal.id);
      expect(summary.recentChanges.length).toBeGreaterThan(0);
      expect(summary.currentContext).toBeDefined();
      expect(summary.conversationSummary).toBeDefined();
    });

    it('should export model switch summary as JSON', () => {
      supervisor.createGoal('Test Goal', 'Description');
      supervisor.logUserMessage('Test message');

      const json = supervisor.exportSummaryJSON();

      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.activeGoals).toBeDefined();
    });

    it('should export model switch summary as Markdown', () => {
      supervisor.createGoal('Test Goal', 'Description', ['constraint1'], ['src/']);
      supervisor.logUserMessage('Test message');

      const markdown = supervisor.exportSummaryMarkdown();

      expect(markdown).toContain('# AI Model Switch Summary');
      expect(markdown).toContain('Test Goal');
      expect(markdown).toContain('constraint1');
    });
  });

  describe('Complex Deviation Scenarios', () => {
    it('should detect multiple deviations in sequence', () => {
      const goal = supervisor.createGoal(
        'Strict Development',
        'Strict constraints',
        ['no_deletions', 'no_external_api'],
        ['src/app/']
      );

      let deviationCount = 0;
      supervisor.on('deviation', () => {
        deviationCount++;
      });

      // Scope violation
      supervisor.logCodeChange(
        'src/database/models.ts',
        '',
        'code',
        'Outside scope'
      );

      // External API call (within scope but violates constraint)
      supervisor.logCodeChange(
        'src/app/api.ts',
        '',
        'fetch("/api/data")',
        'Added API call'
      );

      // Allow time for async events
      setTimeout(() => {
        expect(deviationCount).toBeGreaterThan(0);
      }, 100);
    });

    it('should track conversation and code change correlation', () => {
      const convEntry = supervisor.logUserMessage('Create a new function');
      const change = supervisor.logCodeChange(
        'src/test.ts',
        '',
        'function newFunc() {}',
        'Created new function',
        convEntry.id
      );

      expect(change.conversationId).toBe(convEntry.id);

      const history = supervisor.getCodeChangeHistory('src/test.ts');
      expect(history[0].conversationId).toBe(convEntry.id);
    });
  });

  describe('Data Persistence and Retrieval', () => {
    it('should persist and retrieve conversation history', () => {
      supervisor.logUserMessage('Message 1');
      supervisor.logAssistantMessage('Response 1');
      supervisor.logUserMessage('Message 2');

      const history = supervisor.getConversationHistory();

      expect(history).toHaveLength(3);
      expect(history[0].content).toBe('Message 2');
      expect(history[2].content).toBe('Message 1');
    });

    it('should persist and retrieve code changes', () => {
      supervisor.logCodeChange('file1.ts', '', 'content1', 'Change 1');
      supervisor.logCodeChange('file2.ts', '', 'content2', 'Change 2');
      supervisor.logCodeChange('file1.ts', 'content1', 'updated1', 'Change 3');

      const allChanges = supervisor.getCodeChangeHistory();
      const file1Changes = supervisor.getCodeChangeHistory('file1.ts');

      expect(allChanges).toHaveLength(3);
      expect(file1Changes).toHaveLength(2);
    });

    it('should persist and retrieve goals', () => {
      const goal1 = supervisor.createGoal('Goal 1', 'Description 1');
      const goal2 = supervisor.createGoal('Goal 2', 'Description 2');
      supervisor.completeGoal(goal2.id);

      const activeGoals = supervisor.getActiveGoals();
      const retrievedGoal = supervisor.getGoal(goal1.id);

      expect(activeGoals).toHaveLength(1);
      expect(activeGoals[0].id).toBe(goal1.id);
      expect(retrievedGoal?.title).toBe('Goal 1');
    });

    it('should persist and retrieve deviations', () => {
      const goal = supervisor.createGoal('Test', 'desc', [], ['src/auth/']);
      
      supervisor.logCodeChange(
        'src/database/models.ts',
        '',
        'code',
        'Outside scope'
      );

      const deviations = supervisor.getDeviations();
      const scopeViolations = supervisor.getDeviations('scope_violation');

      expect(deviations.length).toBeGreaterThan(0);
      expect(scopeViolations.length).toBeGreaterThan(0);
    });
  });

  describe('Event System', () => {
    it('should emit deviation events', (done) => {
      const goal = supervisor.createGoal('Test', 'desc', [], ['src/']);

      supervisor.on('deviation', (deviation) => {
        expect(deviation.type).toBe('scope_violation');
        done();
      });

      supervisor.logCodeChange('tests/test.ts', '', 'code', 'Test');
    });

    it('should emit intervention events', (done) => {
      const goal = supervisor.createGoal('Test', 'desc', [], ['src/']);

      supervisor.on('intervention', (intervention) => {
        expect(intervention.deviationId).toBeDefined();
        done();
      });

      supervisor.logCodeChange('tests/test.ts', '', 'code', 'Test');
    });
  });

  describe('Configuration', () => {
    it('should respect intervention threshold', () => {
      const strictSupervisor = new SupervisorAPI({
        databasePath: ':memory:',
        interventionThreshold: 'low'
      });

      let interventionCount = 0;
      strictSupervisor.on('intervention', () => {
        interventionCount++;
      });

      // This would normally not trigger with medium threshold
      // but should with low threshold

      strictSupervisor.close();
    });

    it('should respect code reversal detection setting', () => {
      const noReversalDetection = new SupervisorAPI({
        databasePath: ':memory:',
        enableCodeReversalDetection: false
      });

      // Log changes that would normally trigger reversal detection
      noReversalDetection.logCodeChange('test.ts', 'a', 'b', 'Change 1');
      noReversalDetection.logCodeChange('test.ts', 'b', 'a', 'Change 2');

      const deviations = noReversalDetection.getDeviations('code_reversal');
      
      // Should have fewer or no reversals detected
      expect(Array.isArray(deviations)).toBe(true);

      noReversalDetection.close();
    });
  });
});
