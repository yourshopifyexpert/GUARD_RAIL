import { ReversalDetector } from '../../src/analysis/ReversalDetector';
import { CodeChange } from '../../src/types';

describe('ReversalDetector', () => {
  let detector: ReversalDetector;

  beforeEach(() => {
    detector = new ReversalDetector(0.7);
  });

  describe('detectReversal', () => {
    it('should detect code reversal', () => {
      const originalCode = 'function test() { return 42; }';
      const modifiedCode = 'function test() { return 100; }';

      const change1: CodeChange = {
        id: 'change_1',
        timestamp: new Date('2024-01-01T10:00:00'),
        filePath: 'test.ts',
        beforeContent: originalCode,
        afterContent: modifiedCode,
        diff: '- return 42;\n+ return 100;'
      };

      const change2: CodeChange = {
        id: 'change_2',
        timestamp: new Date('2024-01-01T10:05:00'),
        filePath: 'test.ts',
        beforeContent: modifiedCode,
        afterContent: originalCode,
        diff: '- return 100;\n+ return 42;'
      };

      const deviation = detector.detectReversal([change1], change2);

      expect(deviation).not.toBeNull();
      expect(deviation?.type).toBe('code_reversal');
      expect(deviation?.severity).toBe('high');
    });

    it('should not detect reversal for different files', () => {
      const change1: CodeChange = {
        id: 'change_1',
        timestamp: new Date('2024-01-01T10:00:00'),
        filePath: 'file1.ts',
        beforeContent: 'code1',
        afterContent: 'code2',
        diff: 'diff'
      };

      const change2: CodeChange = {
        id: 'change_2',
        timestamp: new Date('2024-01-01T10:05:00'),
        filePath: 'file2.ts',
        beforeContent: 'code2',
        afterContent: 'code1',
        diff: 'diff'
      };

      const deviation = detector.detectReversal([change1], change2);

      expect(deviation).toBeNull();
    });

    it('should not detect reversal for progressive changes', () => {
      const change1: CodeChange = {
        id: 'change_1',
        timestamp: new Date('2024-01-01T10:00:00'),
        filePath: 'test.ts',
        beforeContent: 'function test() { return 1; }',
        afterContent: 'function test() { return 2; }',
        diff: 'diff'
      };

      const change2: CodeChange = {
        id: 'change_2',
        timestamp: new Date('2024-01-01T10:05:00'),
        filePath: 'test.ts',
        beforeContent: 'function test() { return 2; }',
        afterContent: 'function test() { return 3; }',
        diff: 'diff'
      };

      const deviation = detector.detectReversal([change1], change2);

      expect(deviation).toBeNull();
    });

    it('should return null when no recent changes exist', () => {
      const change: CodeChange = {
        id: 'change_1',
        timestamp: new Date(),
        filePath: 'test.ts',
        beforeContent: 'a',
        afterContent: 'b',
        diff: 'diff'
      };

      const deviation = detector.detectReversal([], change);

      expect(deviation).toBeNull();
    });
  });

  describe('detectCircularEdits', () => {
    it('should detect circular edit pattern (A -> B -> A)', () => {
      const codeA = 'function test() { return 1; }';
      const codeB = 'function test() { return 2; }';

      const changes: CodeChange[] = [
        {
          id: 'change_1',
          timestamp: new Date('2024-01-01T10:00:00'),
          filePath: 'test.ts',
          beforeContent: codeA,
          afterContent: codeB,
          diff: 'diff'
        },
        {
          id: 'change_2',
          timestamp: new Date('2024-01-01T10:05:00'),
          filePath: 'test.ts',
          beforeContent: codeB,
          afterContent: 'function test() { return 3; }',
          diff: 'diff'
        },
        {
          id: 'change_3',
          timestamp: new Date('2024-01-01T10:10:00'),
          filePath: 'test.ts',
          beforeContent: 'function test() { return 3; }',
          afterContent: codeA,
          diff: 'diff'
        }
      ];

      const deviation = detector.detectCircularEdits(changes, 'test.ts');

      expect(deviation).not.toBeNull();
      expect(deviation?.type).toBe('code_reversal');
      expect(deviation?.severity).toBe('critical');
      expect(deviation?.description).toContain('circular');
    });

    it('should not detect circular edits with less than 3 changes', () => {
      const changes: CodeChange[] = [
        {
          id: 'change_1',
          timestamp: new Date(),
          filePath: 'test.ts',
          beforeContent: 'a',
          afterContent: 'b',
          diff: 'diff'
        },
        {
          id: 'change_2',
          timestamp: new Date(),
          filePath: 'test.ts',
          beforeContent: 'b',
          afterContent: 'a',
          diff: 'diff'
        }
      ];

      const deviation = detector.detectCircularEdits(changes, 'test.ts');

      expect(deviation).toBeNull();
    });

    it('should not detect circular edits in progressive changes', () => {
      const changes: CodeChange[] = [
        {
          id: 'change_1',
          timestamp: new Date('2024-01-01T10:00:00'),
          filePath: 'test.ts',
          beforeContent: 'version 1',
          afterContent: 'version 2',
          diff: 'diff'
        },
        {
          id: 'change_2',
          timestamp: new Date('2024-01-01T10:05:00'),
          filePath: 'test.ts',
          beforeContent: 'version 2',
          afterContent: 'version 3',
          diff: 'diff'
        },
        {
          id: 'change_3',
          timestamp: new Date('2024-01-01T10:10:00'),
          filePath: 'test.ts',
          beforeContent: 'version 3',
          afterContent: 'version 4',
          diff: 'diff'
        }
      ];

      const deviation = detector.detectCircularEdits(changes, 'test.ts');

      expect(deviation).toBeNull();
    });
  });
});
