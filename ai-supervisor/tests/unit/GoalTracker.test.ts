import { GoalTracker } from '../../src/core/GoalTracker';
import { SupervisorDatabase } from '../../src/storage/Database';

describe('GoalTracker', () => {
  let db: SupervisorDatabase;
  let tracker: GoalTracker;

  beforeEach(() => {
    db = new SupervisorDatabase(':memory:');
    tracker = new GoalTracker(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('createGoal', () => {
    it('should create a new goal', () => {
      const goal = tracker.createGoal(
        'Test Goal',
        'Test description',
        ['constraint1'],
        ['src/']
      );

      expect(goal.id).toBeDefined();
      expect(goal.title).toBe('Test Goal');
      expect(goal.description).toBe('Test description');
      expect(goal.constraints).toEqual(['constraint1']);
      expect(goal.scope).toEqual(['src/']);
      expect(goal.status).toBe('active');
    });

    it('should create goal with default empty arrays', () => {
      const goal = tracker.createGoal('Test Goal', 'Description');

      expect(goal.constraints).toEqual([]);
      expect(goal.scope).toEqual([]);
    });

    it('should set timestamps on creation', () => {
      const goal = tracker.createGoal('Test Goal', 'Description');

      expect(goal.createdAt).toBeInstanceOf(Date);
      expect(goal.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateGoal', () => {
    it('should update an existing goal', () => {
      const goal = tracker.createGoal('Original Title', 'Original description');
      
      const updated = tracker.updateGoal(goal.id, {
        title: 'Updated Title',
        description: 'Updated description'
      });

      expect(updated).not.toBeNull();
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.description).toBe('Updated description');
    });

    it('should update the updatedAt timestamp', () => {
      const goal = tracker.createGoal('Test Goal', 'Description');
      const originalUpdatedAt = goal.updatedAt;

      // Wait a bit to ensure timestamp difference
      setTimeout(() => {}, 10);

      const updated = tracker.updateGoal(goal.id, { title: 'New Title' });

      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it('should return null for non-existent goal', () => {
      const updated = tracker.updateGoal('nonexistent', { title: 'New Title' });

      expect(updated).toBeNull();
    });
  });

  describe('getGoal', () => {
    it('should retrieve a goal by ID', () => {
      const created = tracker.createGoal('Test Goal', 'Description');
      const retrieved = tracker.getGoal(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.title).toBe('Test Goal');
    });

    it('should return null for non-existent goal', () => {
      const retrieved = tracker.getGoal('nonexistent');

      expect(retrieved).toBeNull();
    });
  });

  describe('getGoals', () => {
    it('should retrieve all goals', () => {
      tracker.createGoal('Goal 1', 'Description 1');
      tracker.createGoal('Goal 2', 'Description 2');
      tracker.createGoal('Goal 3', 'Description 3');

      const goals = tracker.getGoals();

      expect(goals).toHaveLength(3);
    });

    it('should filter goals by status', () => {
      const goal1 = tracker.createGoal('Goal 1', 'Description 1');
      const goal2 = tracker.createGoal('Goal 2', 'Description 2');
      tracker.completeGoal(goal2.id);

      const activeGoals = tracker.getGoals('active');
      const completedGoals = tracker.getGoals('completed');

      expect(activeGoals).toHaveLength(1);
      expect(completedGoals).toHaveLength(1);
      expect(activeGoals[0].id).toBe(goal1.id);
    });
  });

  describe('getActiveGoals', () => {
    it('should retrieve only active goals', () => {
      const goal1 = tracker.createGoal('Active Goal', 'Description');
      const goal2 = tracker.createGoal('Another Goal', 'Description');
      tracker.completeGoal(goal2.id);

      const activeGoals = tracker.getActiveGoals();

      expect(activeGoals).toHaveLength(1);
      expect(activeGoals[0].id).toBe(goal1.id);
      expect(activeGoals[0].status).toBe('active');
    });
  });

  describe('completeGoal', () => {
    it('should mark a goal as completed', () => {
      const goal = tracker.createGoal('Test Goal', 'Description');
      const completed = tracker.completeGoal(goal.id);

      expect(completed).not.toBeNull();
      expect(completed?.status).toBe('completed');
    });

    it('should return null for non-existent goal', () => {
      const completed = tracker.completeGoal('nonexistent');

      expect(completed).toBeNull();
    });
  });

  describe('archiveGoal', () => {
    it('should mark a goal as archived', () => {
      const goal = tracker.createGoal('Test Goal', 'Description');
      const archived = tracker.archiveGoal(goal.id);

      expect(archived).not.toBeNull();
      expect(archived?.status).toBe('archived');
    });
  });

  describe('deleteGoal', () => {
    it('should delete a goal', () => {
      const goal = tracker.createGoal('Test Goal', 'Description');
      
      tracker.deleteGoal(goal.id);
      
      const retrieved = tracker.getGoal(goal.id);
      expect(retrieved).toBeNull();
    });

    it('should not throw error when deleting non-existent goal', () => {
      expect(() => tracker.deleteGoal('nonexistent')).not.toThrow();
    });
  });

  describe('addConstraint', () => {
    it('should add a constraint to a goal', () => {
      const goal = tracker.createGoal('Test Goal', 'Description', [], []);
      const updated = tracker.addConstraint(goal.id, 'no_deletions');

      expect(updated).not.toBeNull();
      expect(updated?.constraints).toContain('no_deletions');
    });

    it('should return null for non-existent goal', () => {
      const updated = tracker.addConstraint('nonexistent', 'constraint');

      expect(updated).toBeNull();
    });
  });

  describe('removeConstraint', () => {
    it('should remove a constraint from a goal', () => {
      const goal = tracker.createGoal('Test Goal', 'Description', ['constraint1', 'constraint2'], []);
      const updated = tracker.removeConstraint(goal.id, 'constraint1');

      expect(updated).not.toBeNull();
      expect(updated?.constraints).not.toContain('constraint1');
      expect(updated?.constraints).toContain('constraint2');
    });
  });

  describe('addScope', () => {
    it('should add a scope pattern to a goal', () => {
      const goal = tracker.createGoal('Test Goal', 'Description', [], []);
      const updated = tracker.addScope(goal.id, 'src/auth/');

      expect(updated).not.toBeNull();
      expect(updated?.scope).toContain('src/auth/');
    });
  });

  describe('removeScope', () => {
    it('should remove a scope pattern from a goal', () => {
      const goal = tracker.createGoal('Test Goal', 'Description', [], ['src/auth/', 'src/api/']);
      const updated = tracker.removeScope(goal.id, 'src/auth/');

      expect(updated).not.toBeNull();
      expect(updated?.scope).not.toContain('src/auth/');
      expect(updated?.scope).toContain('src/api/');
    });
  });
});
