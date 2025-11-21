import { CodeDiffer } from '../../src/analysis/CodeDiffer';
import { sampleCode } from '../fixtures/testData';

describe('CodeDiffer', () => {
  let differ: CodeDiffer;

  beforeEach(() => {
    differ = new CodeDiffer();
  });

  describe('generateDiff', () => {
    it('should generate diff between two code samples', () => {
      const diff = differ.generateDiff(sampleCode.before, sampleCode.after);
      
      expect(diff).toContain('-');
      expect(diff).toContain('+');
      expect(diff.length).toBeGreaterThan(0);
    });

    it('should return empty diff for identical content', () => {
      const diff = differ.generateDiff(sampleCode.before, sampleCode.before);
      
      expect(diff).not.toContain('-');
      expect(diff).not.toContain('+');
    });

    it('should handle empty strings', () => {
      const diff = differ.generateDiff('', 'new content');
      
      expect(diff).toContain('+');
      expect(diff).toContain('new content');
    });
  });

  describe('calculateChangeMagnitude', () => {
    it('should calculate magnitude of changes', () => {
      const magnitude = differ.calculateChangeMagnitude(sampleCode.before, sampleCode.after);
      
      expect(magnitude).toBeGreaterThan(0);
    });

    it('should return 0 for identical content', () => {
      const magnitude = differ.calculateChangeMagnitude(sampleCode.before, sampleCode.before);
      
      expect(magnitude).toBe(0);
    });

    it('should handle additions', () => {
      const before = 'line1\nline2';
      const after = 'line1\nline2\nline3\nline4';
      const magnitude = differ.calculateChangeMagnitude(before, after);
      
      expect(magnitude).toBeGreaterThan(0);
    });

    it('should handle deletions', () => {
      const before = 'line1\nline2\nline3\nline4';
      const after = 'line1\nline2';
      const magnitude = differ.calculateChangeMagnitude(before, after);
      
      expect(magnitude).toBeGreaterThan(0);
    });
  });

  describe('isAdditive', () => {
    it('should detect purely additive changes', () => {
      const before = 'function test() {}';
      const after = 'function test() {}\nfunction test2() {}';
      
      expect(differ.isAdditive(before, after)).toBe(true);
    });

    it('should return false for changes with deletions', () => {
      expect(differ.isAdditive(sampleCode.before, sampleCode.after)).toBe(false);
    });

    it('should return true for identical content', () => {
      expect(differ.isAdditive(sampleCode.before, sampleCode.before)).toBe(true);
    });
  });

  describe('isDeletive', () => {
    it('should detect purely deletive changes', () => {
      const before = 'line1\nline2\nline3';
      const after = 'line1';
      
      expect(differ.isDeletive(before, after)).toBe(true);
    });

    it('should return false for changes with additions', () => {
      const before = 'line1';
      const after = 'line1\nline2';
      
      expect(differ.isDeletive(before, after)).toBe(false);
    });
  });

  describe('getAddedLines', () => {
    it('should extract added lines', () => {
      const before = 'line1\nline2';
      const after = 'line1\nline2\nline3';
      const added = differ.getAddedLines(before, after);
      
      expect(added).toContain('line3');
    });

    it('should return empty array for no additions', () => {
      const added = differ.getAddedLines(sampleCode.before, sampleCode.before);
      
      expect(added).toEqual([]);
    });

    it('should filter out empty lines', () => {
      const before = 'line1';
      const after = 'line1\n\nline2';
      const added = differ.getAddedLines(before, after);
      
      expect(added).toContain('line2');
      expect(added).not.toContain('');
    });
  });

  describe('getRemovedLines', () => {
    it('should extract removed lines', () => {
      const before = 'line1\nline2\nline3';
      const after = 'line1';
      const removed = differ.getRemovedLines(before, after);
      
      expect(removed).toContain('line2');
      expect(removed).toContain('line3');
    });

    it('should return empty array for no removals', () => {
      const before = 'line1';
      const after = 'line1\nline2';
      const removed = differ.getRemovedLines(before, after);
      
      expect(removed).toEqual([]);
    });
  });

  describe('areChangesContradictory', () => {
    it('should detect contradictory changes', () => {
      const change1 = {
        id: '1',
        timestamp: new Date(),
        filePath: 'test.ts',
        beforeContent: '',
        afterContent: 'function test() { return 42; }',
        diff: '+ function test() { return 42; }'
      };

      const change2 = {
        id: '2',
        timestamp: new Date(),
        filePath: 'test.ts',
        beforeContent: 'function test() { return 42; }',
        afterContent: '',
        diff: '- function test() { return 42; }'
      };

      expect(differ.areChangesContradictory(change1, change2)).toBe(true);
    });

    it('should return false for different files', () => {
      const change1 = {
        id: '1',
        timestamp: new Date(),
        filePath: 'test1.ts',
        beforeContent: '',
        afterContent: 'content',
        diff: '+ content'
      };

      const change2 = {
        id: '2',
        timestamp: new Date(),
        filePath: 'test2.ts',
        beforeContent: 'content',
        afterContent: '',
        diff: '- content'
      };

      expect(differ.areChangesContradictory(change1, change2)).toBe(false);
    });

    it('should return false for non-contradictory changes', () => {
      const change1 = {
        id: '1',
        timestamp: new Date(),
        filePath: 'test.ts',
        beforeContent: '',
        afterContent: 'line1',
        diff: '+ line1'
      };

      const change2 = {
        id: '2',
        timestamp: new Date(),
        filePath: 'test.ts',
        beforeContent: 'line1',
        afterContent: 'line1\nline2',
        diff: '  line1\n+ line2'
      };

      expect(differ.areChangesContradictory(change1, change2)).toBe(false);
    });
  });
});
