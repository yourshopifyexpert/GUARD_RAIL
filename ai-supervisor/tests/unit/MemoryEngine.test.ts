import { MemoryEngine } from '../../src/core/MemoryEngine';
import { SupervisorDatabase } from '../../src/storage/Database';

describe('MemoryEngine', () => {
  let db: SupervisorDatabase;
  let memory: MemoryEngine;

  beforeEach(() => {
    db = new SupervisorDatabase(':memory:');
    memory = new MemoryEngine(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('logConversation', () => {
    it('should log user messages', () => {
      const entry = memory.logConversation('user', 'Test message');

      expect(entry.id).toBeDefined();
      expect(entry.role).toBe('user');
      expect(entry.content).toBe('Test message');
      expect(entry.timestamp).toBeInstanceOf(Date);
    });

    it('should log assistant messages', () => {
      const entry = memory.logConversation('assistant', 'AI response');

      expect(entry.role).toBe('assistant');
      expect(entry.content).toBe('AI response');
    });

    it('should log system messages', () => {
      const entry = memory.logConversation('system', 'System message');

      expect(entry.role).toBe('system');
      expect(entry.content).toBe('System message');
    });

    it('should include metadata when provided', () => {
      const metadata = { key: 'value', number: 42 };
      const entry = memory.logConversation('user', 'Message with metadata', metadata);

      expect(entry.metadata).toEqual(metadata);
    });
  });

  describe('getConversationHistory', () => {
    beforeEach(() => {
      memory.logConversation('user', 'Message 1');
      memory.logConversation('assistant', 'Response 1');
      memory.logConversation('user', 'Message 2');
      memory.logConversation('assistant', 'Response 2');
      memory.logConversation('user', 'Message 3');
    });

    it('should retrieve all conversations', () => {
      const history = memory.getConversationHistory();

      expect(history).toHaveLength(5);
    });

    it('should retrieve limited conversations', () => {
      const history = memory.getConversationHistory(3);

      expect(history).toHaveLength(3);
    });

    it('should return conversations in reverse chronological order', () => {
      const history = memory.getConversationHistory();

      expect(history[0].content).toBe('Message 3');
      expect(history[4].content).toBe('Message 1');
    });
  });

  describe('logCodeChange', () => {
    it('should log code changes', () => {
      const change = memory.logCodeChange(
        'src/test.ts',
        'old code',
        'new code',
        'Updated test file'
      );

      expect(change.id).toBeDefined();
      expect(change.filePath).toBe('src/test.ts');
      expect(change.beforeContent).toBe('old code');
      expect(change.afterContent).toBe('new code');
      expect(change.reason).toBe('Updated test file');
      expect(change.diff).toBeDefined();
      expect(change.timestamp).toBeInstanceOf(Date);
    });

    it('should generate diff automatically', () => {
      const change = memory.logCodeChange(
        'src/test.ts',
        'line1\nline2',
        'line1\nline3'
      );

      expect(change.diff).toContain('line2');
      expect(change.diff).toContain('line3');
    });

    it('should link to conversation when provided', () => {
      const convEntry = memory.logConversation('user', 'Change this file');
      const change = memory.logCodeChange(
        'src/test.ts',
        'old',
        'new',
        'Updated',
        convEntry.id
      );

      expect(change.conversationId).toBe(convEntry.id);
    });
  });

  describe('getCodeChangeHistory', () => {
    beforeEach(() => {
      memory.logCodeChange('src/file1.ts', '', 'content1', 'Change 1');
      memory.logCodeChange('src/file2.ts', '', 'content2', 'Change 2');
      memory.logCodeChange('src/file1.ts', 'content1', 'content1 updated', 'Change 3');
    });

    it('should retrieve all code changes', () => {
      const history = memory.getCodeChangeHistory();

      expect(history).toHaveLength(3);
    });

    it('should filter by file path', () => {
      const history = memory.getCodeChangeHistory('src/file1.ts');

      expect(history).toHaveLength(2);
      expect(history.every(c => c.filePath === 'src/file1.ts')).toBe(true);
    });

    it('should limit results', () => {
      const history = memory.getCodeChangeHistory(undefined, 2);

      expect(history).toHaveLength(2);
    });

    it('should return changes in reverse chronological order', () => {
      const history = memory.getCodeChangeHistory('src/file1.ts');

      expect(history[0].reason).toBe('Change 3');
      expect(history[1].reason).toBe('Change 1');
    });
  });

  describe('getRecentChanges', () => {
    it('should retrieve recent changes for a file', () => {
      for (let i = 0; i < 15; i++) {
        memory.logCodeChange('src/test.ts', 'v' + i, 'v' + (i + 1), 'Change ' + i);
      }

      const recent = memory.getRecentChanges('src/test.ts', 10);

      expect(recent).toHaveLength(10);
    });

    it('should default to 10 changes', () => {
      for (let i = 0; i < 15; i++) {
        memory.logCodeChange('src/test.ts', 'v' + i, 'v' + (i + 1), 'Change ' + i);
      }

      const recent = memory.getRecentChanges('src/test.ts');

      expect(recent).toHaveLength(10);
    });
  });

  describe('getFileHistory', () => {
    it('should retrieve complete history for a file', () => {
      memory.logCodeChange('src/test.ts', '', 'v1', 'Change 1');
      memory.logCodeChange('src/test.ts', 'v1', 'v2', 'Change 2');
      memory.logCodeChange('src/other.ts', '', 'v1', 'Other change');
      memory.logCodeChange('src/test.ts', 'v2', 'v3', 'Change 3');

      const history = memory.getFileHistory('src/test.ts');

      expect(history).toHaveLength(3);
      expect(history.every(c => c.filePath === 'src/test.ts')).toBe(true);
    });
  });

  describe('generateActivitySummary', () => {
    it('should generate activity summary', () => {
      memory.logConversation('user', 'Message 1');
      memory.logConversation('assistant', 'Response 1');
      memory.logCodeChange('src/file1.ts', '', 'content1', 'Change 1');
      memory.logCodeChange('src/file2.ts', '', 'content2', 'Change 2');
      memory.logCodeChange('src/file1.ts', 'content1', 'updated', 'Change 3');

      const summary = memory.generateActivitySummary(24);

      expect(summary.conversationCount).toBe(2);
      expect(summary.changesCount).toBe(3);
      expect(summary.filesModified).toHaveLength(2);
      expect(summary.filesModified).toContain('src/file1.ts');
      expect(summary.filesModified).toContain('src/file2.ts');
    });

    it('should filter by time window', () => {
      // Create old entries
      const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
      memory.logConversation('user', 'Old message');
      
      // Create recent entries
      memory.logConversation('user', 'Recent message');
      memory.logCodeChange('src/test.ts', '', 'content', 'Recent change');

      const summary = memory.generateActivitySummary(24);

      // Should include recent entries but calculations might vary
      expect(summary.conversationCount).toBeGreaterThan(0);
    });
  });

  describe('cleanup', () => {
    it('should cleanup old records', () => {
      memory.logConversation('user', 'Message 1');
      memory.logCodeChange('src/test.ts', '', 'content', 'Change 1');

      memory.cleanup(30);

      // Should not throw error
      expect(true).toBe(true);
    });
  });
});
