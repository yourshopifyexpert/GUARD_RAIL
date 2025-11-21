import { SupervisorDatabase } from '../../src/storage/Database';
import { Goal, ConversationEntry, CodeChange, Deviation, Intervention } from '../../src/types';

describe('SupervisorDatabase', () => {
  let db: SupervisorDatabase;

  beforeEach(() => {
    db = new SupervisorDatabase(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  describe('Conversation Operations', () => {
    it('should insert and retrieve conversations', () => {
      const entry: ConversationEntry = {
        id: 'conv_1',
        timestamp: new Date(),
        role: 'user',
        content: 'Test message',
        metadata: { key: 'value' }
      };

      db.insertConversation(entry);
      const conversations = db.getConversations();

      expect(conversations).toHaveLength(1);
      expect(conversations[0].id).toBe('conv_1');
      expect(conversations[0].content).toBe('Test message');
      expect(conversations[0].metadata).toEqual({ key: 'value' });
    });

    it('should retrieve conversations with limit', () => {
      for (let i = 0; i < 5; i++) {
        db.insertConversation({
          id: 'conv_' + i,
          timestamp: new Date(),
          role: 'user',
          content: 'Message ' + i
        });
      }

      const conversations = db.getConversations(3);
      expect(conversations).toHaveLength(3);
    });

    it('should handle conversations without metadata', () => {
      const entry: ConversationEntry = {
        id: 'conv_1',
        timestamp: new Date(),
        role: 'assistant',
        content: 'Response'
      };

      db.insertConversation(entry);
      const conversations = db.getConversations();

      expect(conversations[0].metadata).toBeUndefined();
    });
  });

  describe('Code Change Operations', () => {
    it('should insert and retrieve code changes', () => {
      const change: CodeChange = {
        id: 'change_1',
        timestamp: new Date(),
        filePath: 'src/test.ts',
        beforeContent: 'old',
        afterContent: 'new',
        diff: '- old\n+ new',
        reason: 'Test change'
      };

      db.insertCodeChange(change);
      const changes = db.getCodeChanges();

      expect(changes).toHaveLength(1);
      expect(changes[0].filePath).toBe('src/test.ts');
      expect(changes[0].reason).toBe('Test change');
    });

    it('should filter code changes by file path', () => {
      db.insertCodeChange({
        id: 'change_1',
        timestamp: new Date(),
        filePath: 'src/file1.ts',
        beforeContent: '',
        afterContent: 'content',
        diff: '+ content'
      });

      db.insertCodeChange({
        id: 'change_2',
        timestamp: new Date(),
        filePath: 'src/file2.ts',
        beforeContent: '',
        afterContent: 'content',
        diff: '+ content'
      });

      const changes = db.getCodeChanges('src/file1.ts');
      expect(changes).toHaveLength(1);
      expect(changes[0].filePath).toBe('src/file1.ts');
    });

    it('should limit code change results', () => {
      for (let i = 0; i < 5; i++) {
        db.insertCodeChange({
          id: 'change_' + i,
          timestamp: new Date(),
          filePath: 'src/test.ts',
          beforeContent: '',
          afterContent: 'content' + i,
          diff: '+ content' + i
        });
      }

      const changes = db.getCodeChanges(undefined, 3);
      expect(changes).toHaveLength(3);
    });
  });

  describe('Goal Operations', () => {
    it('should insert and retrieve goals', () => {
      const goal: Goal = {
        id: 'goal_1',
        title: 'Test Goal',
        description: 'Test description',
        constraints: ['constraint1', 'constraint2'],
        scope: ['src/'],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      db.insertGoal(goal);
      const retrieved = db.getGoal('goal_1');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.title).toBe('Test Goal');
      expect(retrieved?.constraints).toEqual(['constraint1', 'constraint2']);
      expect(retrieved?.scope).toEqual(['src/']);
    });

    it('should update goals', () => {
      const goal: Goal = {
        id: 'goal_1',
        title: 'Original Title',
        description: 'Original description',
        constraints: [],
        scope: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      db.insertGoal(goal);
      
      const updatedGoal = { ...goal, title: 'Updated Title', updatedAt: new Date() };
      db.updateGoal(updatedGoal);

      const retrieved = db.getGoal('goal_1');
      expect(retrieved?.title).toBe('Updated Title');
    });

    it('should filter goals by status', () => {
      db.insertGoal({
        id: 'goal_1',
        title: 'Active Goal',
        description: 'desc',
        constraints: [],
        scope: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      });

      db.insertGoal({
        id: 'goal_2',
        title: 'Completed Goal',
        description: 'desc',
        constraints: [],
        scope: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'completed'
      });

      const activeGoals = db.getGoals('active');
      expect(activeGoals).toHaveLength(1);
      expect(activeGoals[0].status).toBe('active');
    });

    it('should delete goals', () => {
      const goal: Goal = {
        id: 'goal_1',
        title: 'Test Goal',
        description: 'desc',
        constraints: [],
        scope: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      db.insertGoal(goal);
      expect(db.getGoal('goal_1')).not.toBeNull();

      db.deleteGoal('goal_1');
      expect(db.getGoal('goal_1')).toBeNull();
    });
  });

  describe('Deviation Operations', () => {
    it('should insert and retrieve deviations', () => {
      const deviation: Deviation = {
        id: 'dev_1',
        timestamp: new Date(),
        type: 'code_reversal',
        severity: 'high',
        description: 'Code reversed',
        affectedFiles: ['src/test.ts'],
        suggestedAction: 'Review changes'
      };

      db.insertDeviation(deviation);
      const deviations = db.getDeviations();

      expect(deviations).toHaveLength(1);
      expect(deviations[0].type).toBe('code_reversal');
      expect(deviations[0].severity).toBe('high');
    });

    it('should filter deviations by type', () => {
      db.insertDeviation({
        id: 'dev_1',
        timestamp: new Date(),
        type: 'code_reversal',
        severity: 'high',
        description: 'Reversal'
      });

      db.insertDeviation({
        id: 'dev_2',
        timestamp: new Date(),
        type: 'scope_violation',
        severity: 'medium',
        description: 'Scope violation'
      });

      const reversals = db.getDeviations('code_reversal');
      expect(reversals).toHaveLength(1);
      expect(reversals[0].type).toBe('code_reversal');
    });
  });

  describe('Intervention Operations', () => {
    it('should insert and retrieve interventions', () => {
      const intervention: Intervention = {
        id: 'int_1',
        deviationId: 'dev_1',
        timestamp: new Date(),
        type: 'alert',
        message: 'Alert message',
        userNotified: false,
        aiMessageGenerated: 'AI message'
      };

      db.insertIntervention(intervention);
      const interventions = db.getInterventions();

      expect(interventions).toHaveLength(1);
      expect(interventions[0].message).toBe('Alert message');
      expect(interventions[0].userNotified).toBe(false);
    });

    it('should filter interventions by deviation ID', () => {
      db.insertIntervention({
        id: 'int_1',
        deviationId: 'dev_1',
        timestamp: new Date(),
        type: 'alert',
        message: 'Message 1',
        userNotified: false
      });

      db.insertIntervention({
        id: 'int_2',
        deviationId: 'dev_2',
        timestamp: new Date(),
        type: 'alert',
        message: 'Message 2',
        userNotified: false
      });

      const interventions = db.getInterventions('dev_1');
      expect(interventions).toHaveLength(1);
      expect(interventions[0].deviationId).toBe('dev_1');
    });
  });

  describe('Cleanup Operations', () => {
    it('should cleanup old records', () => {
      const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000); // 40 days ago
      const recentDate = new Date();

      db.insertConversation({
        id: 'conv_old',
        timestamp: oldDate,
        role: 'user',
        content: 'Old message'
      });

      db.insertConversation({
        id: 'conv_recent',
        timestamp: recentDate,
        role: 'user',
        content: 'Recent message'
      });

      db.cleanupOldRecords(30); // Keep 30 days

      const conversations = db.getConversations();
      expect(conversations).toHaveLength(1);
      expect(conversations[0].id).toBe('conv_recent');
    });
  });
});
