import { ModelSwitchHandler } from '../../src/core/ModelSwitchHandler';
import { SupervisorDatabase } from '../../src/storage/Database';
import { Goal } from '../../src/types';

describe('ModelSwitchHandler', () => {
  let db: SupervisorDatabase;
  let handler: ModelSwitchHandler;

  beforeEach(() => {
    db = new SupervisorDatabase(':memory:');
    handler = new ModelSwitchHandler(db);

    // Set up some test data
    db.insertConversation({
      id: 'conv_1',
      timestamp: new Date(),
      role: 'user',
      content: 'We decided to use JWT for authentication'
    });

    db.insertConversation({
      id: 'conv_2',
      timestamp: new Date(),
      role: 'assistant',
      content: 'I will implement JWT authentication'
    });

    db.insertCodeChange({
      id: 'change_1',
      timestamp: new Date(),
      filePath: 'src/auth/middleware.ts',
      beforeContent: '',
      afterContent: 'export const authMiddleware = () => {}',
      diff: '+ export const authMiddleware = () => {}',
      reason: 'Created auth middleware'
    });
  });

  afterEach(() => {
    db.close();
  });

  describe('generateSummary', () => {
    it('should generate comprehensive summary', () => {
      const goals: Goal[] = [
        {
          id: 'goal_1',
          title: 'Implement Authentication',
          description: 'Build JWT authentication',
          constraints: ['no_external_api'],
          scope: ['src/auth/'],
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active'
        }
      ];

      const summary = handler.generateSummary(goals);

      expect(summary.timestamp).toBeInstanceOf(Date);
      expect(summary.activeGoals).toEqual(goals);
      expect(summary.recentChanges).toBeDefined();
      expect(summary.keyDecisions).toBeDefined();
      expect(summary.currentContext).toBeDefined();
      expect(summary.conversationSummary).toBeDefined();
    });

    it('should include recent changes', () => {
      const summary = handler.generateSummary([]);

      expect(summary.recentChanges.length).toBeGreaterThan(0);
      expect(summary.recentChanges[0].filePath).toBe('src/auth/middleware.ts');
    });

    it('should extract key decisions from conversations', () => {
      const summary = handler.generateSummary([]);

      expect(summary.keyDecisions.length).toBeGreaterThan(0);
      expect(summary.keyDecisions.some(d => d.includes('JWT'))).toBe(true);
    });

    it('should generate context summary', () => {
      const summary = handler.generateSummary([]);

      expect(summary.currentContext).toContain('Recent Activity Summary');
      expect(summary.currentContext).toContain('Conversation');
      expect(summary.currentContext).toContain('Code Changes');
    });

    it('should summarize conversations', () => {
      const summary = handler.generateSummary([]);

      expect(summary.conversationSummary).toContain('USER');
      expect(summary.conversationSummary).toContain('JWT');
    });

    it('should handle empty data gracefully', () => {
      const emptyDb = new SupervisorDatabase(':memory:');
      const emptyHandler = new ModelSwitchHandler(emptyDb);

      const summary = emptyHandler.generateSummary([]);

      expect(summary.recentChanges).toHaveLength(0);
      expect(summary.keyDecisions).toHaveLength(0);
      expect(summary.conversationSummary).toContain('No recent conversation');

      emptyDb.close();
    });
  });

  describe('exportSummaryJSON', () => {
    it('should export summary as JSON string', () => {
      const goals: Goal[] = [
        {
          id: 'goal_1',
          title: 'Test Goal',
          description: 'Test description',
          constraints: [],
          scope: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active'
        }
      ];

      const summary = handler.generateSummary(goals);
      const json = handler.exportSummaryJSON(summary);

      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.activeGoals).toBeDefined();
      expect(parsed.recentChanges).toBeDefined();
    });

    it('should produce valid JSON', () => {
      const summary = handler.generateSummary([]);
      const json = handler.exportSummaryJSON(summary);

      expect(() => JSON.parse(json)).not.toThrow();
    });
  });

  describe('exportSummaryMarkdown', () => {
    it('should export summary as markdown', () => {
      const goals: Goal[] = [
        {
          id: 'goal_1',
          title: 'Test Goal',
          description: 'Test description',
          constraints: ['constraint1'],
          scope: ['src/'],
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active'
        }
      ];

      const summary = handler.generateSummary(goals);
      const markdown = handler.exportSummaryMarkdown(summary);

      expect(markdown).toContain('# AI Model Switch Summary');
      expect(markdown).toContain('## Active Goals');
      expect(markdown).toContain('Test Goal');
      expect(markdown).toContain('## Key Decisions');
      expect(markdown).toContain('## Recent Changes');
      expect(markdown).toContain('## Current Context');
      expect(markdown).toContain('## Conversation Summary');
    });

    it('should include goal constraints in markdown', () => {
      const goals: Goal[] = [
        {
          id: 'goal_1',
          title: 'Test Goal',
          description: 'desc',
          constraints: ['no_deletions', 'no_external_api'],
          scope: ['src/'],
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active'
        }
      ];

      const summary = handler.generateSummary(goals);
      const markdown = handler.exportSummaryMarkdown(summary);

      expect(markdown).toContain('**Constraints:**');
      expect(markdown).toContain('no_deletions');
      expect(markdown).toContain('no_external_api');
    });

    it('should include goal scope in markdown', () => {
      const goals: Goal[] = [
        {
          id: 'goal_1',
          title: 'Test Goal',
          description: 'desc',
          constraints: [],
          scope: ['src/auth/', 'src/middleware/'],
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active'
        }
      ];

      const summary = handler.generateSummary(goals);
      const markdown = handler.exportSummaryMarkdown(summary);

      expect(markdown).toContain('**Scope:**');
      expect(markdown).toContain('src/auth/');
      expect(markdown).toContain('src/middleware/');
    });

    it('should format code diffs in markdown', () => {
      const summary = handler.generateSummary([]);
      const markdown = handler.exportSummaryMarkdown(summary);

      expect(markdown).toContain('```diff');
      expect(markdown).toContain('```');
    });
  });
});
