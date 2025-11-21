import { InterventionManager } from '../../src/core/InterventionManager';
import { SupervisorDatabase } from '../../src/storage/Database';
import { Deviation } from '../../src/types';

describe('InterventionManager', () => {
  let db: SupervisorDatabase;
  let manager: InterventionManager;

  beforeEach(() => {
    db = new SupervisorDatabase(':memory:');
    manager = new InterventionManager(db, 'medium');
  });

  afterEach(() => {
    db.close();
  });

  describe('processDeviation', () => {
    it('should create intervention for high severity deviation', () => {
      const deviation: Deviation = {
        id: 'dev_1',
        timestamp: new Date(),
        type: 'code_reversal',
        severity: 'high',
        description: 'Code reversal detected',
        affectedFiles: ['test.ts']
      };

      const intervention = manager.processDeviation(deviation);

      expect(intervention).not.toBeNull();
      expect(intervention?.deviationId).toBe('dev_1');
      expect(intervention?.type).toBe('alert');
      expect(intervention?.message).toContain('ALERT');
    });

    it('should create blocking intervention for critical deviation', () => {
      const deviation: Deviation = {
        id: 'dev_1',
        timestamp: new Date(),
        type: 'unauthorized_action',
        severity: 'critical',
        description: 'Dangerous operation detected',
        affectedFiles: ['test.ts']
      };

      const intervention = manager.processDeviation(deviation);

      expect(intervention).not.toBeNull();
      expect(intervention?.type).toBe('block');
    });

    it('should create warning intervention for medium severity deviation', () => {
      const deviation: Deviation = {
        id: 'dev_1',
        timestamp: new Date(),
        type: 'scope_violation',
        severity: 'medium',
        description: 'Scope violation detected',
        affectedFiles: ['test.ts']
      };

      const intervention = manager.processDeviation(deviation);

      expect(intervention).not.toBeNull();
      expect(intervention?.type).toBe('warning');
    });

    it('should not create intervention for low severity when threshold is medium', () => {
      const deviation: Deviation = {
        id: 'dev_1',
        timestamp: new Date(),
        type: 'goal_drift',
        severity: 'low',
        description: 'Minor goal drift'
      };

      const intervention = manager.processDeviation(deviation);

      expect(intervention).toBeNull();
    });

    it('should emit intervention events', (done) => {
      const deviation: Deviation = {
        id: 'dev_1',
        timestamp: new Date(),
        type: 'code_reversal',
        severity: 'high',
        description: 'Code reversal detected'
      };

      manager.on('intervention', (intervention) => {
        expect(intervention.deviationId).toBe('dev_1');
        done();
      });

      manager.processDeviation(deviation);
    });

    it('should generate AI message for code reversal', () => {
      const deviation: Deviation = {
        id: 'dev_1',
        timestamp: new Date(),
        type: 'code_reversal',
        severity: 'high',
        description: 'Code reversal detected',
        affectedFiles: ['test.ts']
      };

      const intervention = manager.processDeviation(deviation);

      expect(intervention?.aiMessageGenerated).toBeDefined();
      expect(intervention?.aiMessageGenerated).toContain('reversal');
    });

    it('should generate AI message for scope violation', () => {
      const deviation: Deviation = {
        id: 'dev_1',
        timestamp: new Date(),
        type: 'scope_violation',
        severity: 'medium',
        description: 'Scope violation detected',
        affectedFiles: ['test.ts']
      };

      const intervention = manager.processDeviation(deviation);

      expect(intervention?.aiMessageGenerated).toBeDefined();
      expect(intervention?.aiMessageGenerated).toContain('scope');
    });

    it('should include suggested action in message', () => {
      const deviation: Deviation = {
        id: 'dev_1',
        timestamp: new Date(),
        type: 'code_reversal',
        severity: 'high',
        description: 'Code reversal detected',
        suggestedAction: 'Review the changes carefully'
      };

      const intervention = manager.processDeviation(deviation);

      expect(intervention?.message).toContain('Review the changes carefully');
    });

    it('should include affected files in message', () => {
      const deviation: Deviation = {
        id: 'dev_1',
        timestamp: new Date(),
        type: 'code_reversal',
        severity: 'high',
        description: 'Code reversal detected',
        affectedFiles: ['file1.ts', 'file2.ts']
      };

      const intervention = manager.processDeviation(deviation);

      expect(intervention?.message).toContain('file1.ts');
      expect(intervention?.message).toContain('file2.ts');
    });
  });

  describe('getInterventions', () => {
    it('should retrieve all interventions', () => {
      const deviation: Deviation = {
        id: 'dev_1',
        timestamp: new Date(),
        type: 'code_reversal',
        severity: 'high',
        description: 'Test deviation'
      };

      manager.processDeviation(deviation);
      const interventions = manager.getInterventions();

      expect(interventions.length).toBeGreaterThan(0);
    });

    it('should filter interventions by deviation ID', () => {
      const deviation1: Deviation = {
        id: 'dev_1',
        timestamp: new Date(),
        type: 'code_reversal',
        severity: 'high',
        description: 'Deviation 1'
      };

      const deviation2: Deviation = {
        id: 'dev_2',
        timestamp: new Date(),
        type: 'scope_violation',
        severity: 'medium',
        description: 'Deviation 2'
      };

      manager.processDeviation(deviation1);
      manager.processDeviation(deviation2);

      const interventions = manager.getInterventions('dev_1');

      expect(interventions).toHaveLength(1);
      expect(interventions[0].deviationId).toBe('dev_1');
    });
  });

  describe('markAsNotified', () => {
    it('should emit notified event', (done) => {
      manager.on('notified', (interventionId) => {
        expect(interventionId).toBe('int_1');
        done();
      });

      manager.markAsNotified('int_1');
    });
  });

  describe('intervention threshold', () => {
    it('should respect low threshold', () => {
      const lowManager = new InterventionManager(db, 'low');
      
      const deviation: Deviation = {
        id: 'dev_1',
        timestamp: new Date(),
        type: 'goal_drift',
        severity: 'low',
        description: 'Minor issue'
      };

      const intervention = lowManager.processDeviation(deviation);

      expect(intervention).not.toBeNull();
    });

    it('should respect high threshold', () => {
      const highManager = new InterventionManager(db, 'high');
      
      const deviation: Deviation = {
        id: 'dev_1',
        timestamp: new Date(),
        type: 'scope_violation',
        severity: 'medium',
        description: 'Medium issue'
      };

      const intervention = highManager.processDeviation(deviation);

      expect(intervention).toBeNull();
    });
  });
});
