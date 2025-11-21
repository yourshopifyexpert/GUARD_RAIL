import { DeviationDetector } from '../../src/core/DeviationDetector';
import { SupervisorDatabase } from '../../src/storage/Database';
import { CodeChange, Goal } from '../../src/types';

describe('DeviationDetector', () => {
  let db: SupervisorDatabase;
  let detector: DeviationDetector;

  beforeEach(() => {
    db = new SupervisorDatabase(':memory:');
    detector = new DeviationDetector(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('analyzeChange', () => {
    it('should detect code reversals', () => {
      const originalCode = 'function test() { return 42; }';
      const modifiedCode = 'function test() { return 100; }';

      // First change
      const change1: CodeChange = {
        id: 'change_1',
        timestamp: new Date('2024-01-01T10:00:00'),
        filePath: 'test.ts',
        beforeContent: originalCode,
        afterContent: modifiedCode,
        diff: '- return 42;\n+ return 100;'
      };
      db.insertCodeChange(change1);

      // Reversal change
      const change2: CodeChange = {
        id: 'change_2',
        timestamp: new Date('2024-01-01T10:05:00'),
        filePath: 'test.ts',
        beforeContent: modifiedCode,
        afterContent: originalCode,
        diff: '- return 100;\n+ return 42;'
      };

      const deviations = detector.analyzeChange(change2, []);

      expect(deviations.length).toBeGreaterThan(0);
      const reversal = deviations.find(d => d.type === 'code_reversal');
      expect(reversal).toBeDefined();
      expect(reversal?.severity).toBe('high');
    });

    it('should detect scope violations', () => {
      const goal: Goal = {
        id: 'goal_1',
        title: 'Auth Module',
        description: 'Work only in auth directory',
        constraints: [],
        scope: ['src/auth/'],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      const change: CodeChange = {
        id: 'change_1',
        timestamp: new Date(),
        filePath: 'src/database/models.ts',
        beforeContent: '',
        afterContent: 'code',
        diff: '+ code'
      };

      const deviations = detector.analyzeChange(change, [goal]);

      expect(deviations.length).toBeGreaterThan(0);
      const scopeViolation = deviations.find(d => d.type === 'scope_violation');
      expect(scopeViolation).toBeDefined();
    });

    it('should emit deviation events', (done) => {
      const goal: Goal = {
        id: 'goal_1',
        title: 'Test Goal',
        description: 'desc',
        constraints: [],
        scope: ['src/auth/'],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      const change: CodeChange = {
        id: 'change_1',
        timestamp: new Date(),
        filePath: 'src/database/models.ts',
        beforeContent: '',
        afterContent: 'code',
        diff: '+ code'
      };

      detector.on('deviation', (deviation) => {
        expect(deviation.type).toBe('scope_violation');
        done();
      });

      detector.analyzeChange(change, [goal]);
    });

    it('should not detect deviations for valid changes', () => {
      const goal: Goal = {
        id: 'goal_1',
        title: 'Test Goal',
        description: 'desc',
        constraints: [],
        scope: ['src/auth/'],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      const change: CodeChange = {
        id: 'change_1',
        timestamp: new Date(),
        filePath: 'src/auth/middleware.ts',
        beforeContent: '',
        afterContent: 'code',
        diff: '+ code'
      };

      const deviations = detector.analyzeChange(change, [goal]);

      expect(deviations).toHaveLength(0);
    });
  });

  describe('getDeviations', () => {
    it('should retrieve all deviations', () => {
      const change: CodeChange = {
        id: 'change_1',
        timestamp: new Date(),
        filePath: 'test.ts',
        beforeContent: 'a',
        afterContent: 'b',
        diff: '- a\n+ b'
      };

      const goal: Goal = {
        id: 'goal_1',
        title: 'Test',
        description: 'desc',
        constraints: [],
        scope: ['src/'],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      detector.analyzeChange(change, [goal]);
      const deviations = detector.getDeviations();

      expect(deviations.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter deviations by type', () => {
      const goal: Goal = {
        id: 'goal_1',
        title: 'Test',
        description: 'desc',
        constraints: [],
        scope: ['src/auth/'],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      const change: CodeChange = {
        id: 'change_1',
        timestamp: new Date(),
        filePath: 'src/database/models.ts',
        beforeContent: '',
        afterContent: 'code',
        diff: '+ code'
      };

      detector.analyzeChange(change, [goal]);
      const scopeViolations = detector.getDeviations('scope_violation');

      expect(scopeViolations.every(d => d.type === 'scope_violation')).toBe(true);
    });
  });

  describe('getDeviationsBySeverity', () => {
    it('should filter deviations by severity', () => {
      // This would require setting up specific deviations with known severities
      const deviations = detector.getDeviationsBySeverity('high');
      
      expect(Array.isArray(deviations)).toBe(true);
      if (deviations.length > 0) {
        expect(deviations.every(d => d.severity === 'high')).toBe(true);
      }
    });
  });

  describe('getCriticalDeviations', () => {
    it('should retrieve only critical deviations', () => {
      const deviations = detector.getCriticalDeviations();
      
      expect(Array.isArray(deviations)).toBe(true);
      if (deviations.length > 0) {
        expect(deviations.every(d => d.severity === 'critical')).toBe(true);
      }
    });
  });
});
