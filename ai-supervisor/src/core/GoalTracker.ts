/**
 * Goal Tracker - Goal and scope management for AI Supervisor
 * @module core/GoalTracker
 *
 * Provides comprehensive goal management with:
 * - CRUD operations for goals
 * - Goal versioning and history
 * - Priority management
 * - Scope and constraint tracking
 * - Goal status lifecycle management
 */

import { SupervisorDatabase } from '../storage/Database';
import { randomUUID } from 'crypto';

/**
 * Goal status enumeration
 */
export type GoalStatus = 'active' | 'completed' | 'archived' | 'abandoned';

/**
 * Goal structure
 */
export interface Goal {
  id: string;
  title: string;
  description: string;
  constraints: string[];
  scope: string[];
  priority: number;
  createdAt: string;
  updatedAt: string;
  status: GoalStatus;
}

/**
 * Goal version for history tracking
 */
export interface GoalVersion {
  id: string;
  goalId: string;
  version: number;
  title: string;
  description: string;
  scope: string[];
  constraints: string[];
  createdAt: string;
  changeReason?: string;
}

/**
 * Goal Tracker - Manages project goals, constraints, and scope
 *
 * Features:
 * - Create, read, update, delete goals
 * - Automatic versioning on updates
 * - Priority-based ordering
 * - Status lifecycle management
 * - Scope and constraint management
 *
 * @example
 * ```typescript
 * const tracker = new GoalTracker(database);
 *
 * // Create a goal
 * const goal = tracker.createGoal({
 *   title: 'Implement user authentication',
 *   description: 'Add JWT-based authentication',
 *   constraints: ['Use bcrypt for password hashing'],
 *   scope: ['src/auth/**'],
 *   priority: 1,
 * });
 *
 * // Update goal
 * tracker.updateGoal(goal.id, {
 *   description: 'Add JWT and OAuth authentication',
 * });
 * ```
 */
export class GoalTracker {
  private db: SupervisorDatabase;

  constructor(db: SupervisorDatabase) {
    this.db = db;
  }

  /**
   * Create a new goal
   *
   * @param options - Goal creation options
   * @returns The created goal
   */
  createGoal(options: {
    title: string;
    description: string;
    constraints?: string[];
    scope?: string[];
    priority?: number;
  }): Goal {
    const now = new Date().toISOString();
    const goal: Goal = {
      id: randomUUID(),
      title: options.title,
      description: options.description,
      constraints: options.constraints || [],
      scope: options.scope || [],
      priority: options.priority ?? 0,
      createdAt: now,
      updatedAt: now,
      status: 'active',
    };

    this.db.execute(
      `INSERT INTO goals (id, title, description, constraints, scope, priority, created_at, updated_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        goal.id,
        goal.title,
        goal.description,
        JSON.stringify(goal.constraints),
        JSON.stringify(goal.scope),
        goal.priority,
        goal.createdAt,
        goal.updatedAt,
        goal.status,
      ]
    );

    // Create initial version
    this.createVersion(goal, 'Initial creation');

    return goal;
  }

  /**
   * Update an existing goal
   * Automatically creates a version entry
   *
   * @param id - Goal ID
   * @param updates - Fields to update
   * @param changeReason - Reason for the change
   * @returns The updated goal or null if not found
   */
  updateGoal(
    id: string,
    updates: Partial<Omit<Goal, 'id' | 'createdAt'>>,
    changeReason?: string
  ): Goal | null {
    const existingGoal = this.getGoal(id);
    if (!existingGoal) {
      return null;
    }

    const now = new Date().toISOString();
    const updatedGoal: Goal = {
      ...existingGoal,
      ...updates,
      updatedAt: now,
    };

    this.db.execute(
      `UPDATE goals
       SET title = ?, description = ?, constraints = ?, scope = ?, priority = ?, updated_at = ?, status = ?
       WHERE id = ?`,
      [
        updatedGoal.title,
        updatedGoal.description,
        JSON.stringify(updatedGoal.constraints),
        JSON.stringify(updatedGoal.scope),
        updatedGoal.priority,
        updatedGoal.updatedAt,
        updatedGoal.status,
        id,
      ]
    );

    // Create version entry
    this.createVersion(updatedGoal, changeReason || 'Goal updated');

    return updatedGoal;
  }

  /**
   * Get a goal by ID
   *
   * @param id - Goal ID
   * @returns The goal or null if not found
   */
  getGoal(id: string): Goal | null {
    const row = this.db.queryOne<{
      id: string;
      title: string;
      description: string;
      constraints: string;
      scope: string;
      priority: number;
      created_at: string;
      updated_at: string;
      status: string;
    }>('SELECT * FROM goals WHERE id = ?', [id]);

    if (!row) return null;

    return this.mapRowToGoal(row);
  }

  /**
   * Get all goals, optionally filtered by status
   *
   * @param status - Optional status filter
   * @param limit - Maximum number of goals to return
   * @param offset - Offset for pagination
   * @returns Array of goals
   */
  getGoals(status?: GoalStatus, limit = 100, offset = 0): Goal[] {
    let sql = 'SELECT * FROM goals';
    const params: any[] = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY priority DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = this.db.query<{
      id: string;
      title: string;
      description: string;
      constraints: string;
      scope: string;
      priority: number;
      created_at: string;
      updated_at: string;
      status: string;
    }>(sql, params);

    return rows.map(row => this.mapRowToGoal(row));
  }

  /**
   * Get all active goals
   */
  getActiveGoals(): Goal[] {
    return this.getGoals('active');
  }

  /**
   * Mark a goal as completed
   */
  completeGoal(id: string, reason?: string): Goal | null {
    return this.updateGoal(id, { status: 'completed' }, reason || 'Goal completed');
  }

  /**
   * Archive a goal
   */
  archiveGoal(id: string, reason?: string): Goal | null {
    return this.updateGoal(id, { status: 'archived' }, reason || 'Goal archived');
  }

  /**
   * Mark a goal as abandoned
   */
  abandonGoal(id: string, reason?: string): Goal | null {
    return this.updateGoal(id, { status: 'abandoned' }, reason || 'Goal abandoned');
  }

  /**
   * Delete a goal
   * This will also delete all versions via CASCADE
   */
  deleteGoal(id: string): void {
    this.db.execute('DELETE FROM goals WHERE id = ?', [id]);
  }

  /**
   * Add a constraint to a goal
   */
  addConstraint(goalId: string, constraint: string): Goal | null {
    const goal = this.getGoal(goalId);
    if (!goal) return null;

    if (!goal.constraints.includes(constraint)) {
      const constraints = [...goal.constraints, constraint];
      return this.updateGoal(goalId, { constraints }, `Added constraint: ${constraint}`);
    }

    return goal;
  }

  /**
   * Remove a constraint from a goal
   */
  removeConstraint(goalId: string, constraint: string): Goal | null {
    const goal = this.getGoal(goalId);
    if (!goal) return null;

    const constraints = goal.constraints.filter(c => c !== constraint);
    return this.updateGoal(goalId, { constraints }, `Removed constraint: ${constraint}`);
  }

  /**
   * Add a scope pattern to a goal
   */
  addScope(goalId: string, scopePattern: string): Goal | null {
    const goal = this.getGoal(goalId);
    if (!goal) return null;

    if (!goal.scope.includes(scopePattern)) {
      const scope = [...goal.scope, scopePattern];
      return this.updateGoal(goalId, { scope }, `Added scope: ${scopePattern}`);
    }

    return goal;
  }

  /**
   * Remove a scope pattern from a goal
   */
  removeScope(goalId: string, scopePattern: string): Goal | null {
    const goal = this.getGoal(goalId);
    if (!goal) return null;

    const scope = goal.scope.filter(s => s !== scopePattern);
    return this.updateGoal(goalId, { scope }, `Removed scope: ${scopePattern}`);
  }

  /**
   * Update goal priority
   */
  setPriority(goalId: string, priority: number): Goal | null {
    return this.updateGoal(goalId, { priority }, `Priority changed to ${priority}`);
  }

  /**
   * Get goal version history
   *
   * @param goalId - Goal ID
   * @returns Array of goal versions
   */
  getGoalVersions(goalId: string): GoalVersion[] {
    const rows = this.db.query<{
      id: string;
      goal_id: string;
      version: number;
      title: string;
      description: string;
      scope: string;
      constraints: string;
      created_at: string;
      change_reason: string | null;
    }>('SELECT * FROM goal_versions WHERE goal_id = ? ORDER BY version DESC', [goalId]);

    return rows.map(row => ({
      id: row.id,
      goalId: row.goal_id,
      version: row.version,
      title: row.title,
      description: row.description,
      scope: JSON.parse(row.scope),
      constraints: JSON.parse(row.constraints),
      createdAt: row.created_at,
      changeReason: row.change_reason || undefined,
    }));
  }

  /**
   * Get goal statistics
   */
  getGoalStats(): {
    total: number;
    active: number;
    completed: number;
    archived: number;
    abandoned: number;
  } {
    const stats = this.db.queryOne<{
      total: number;
      active: number;
      completed: number;
      archived: number;
      abandoned: number;
    }>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived,
        SUM(CASE WHEN status = 'abandoned' THEN 1 ELSE 0 END) as abandoned
      FROM goals
    `);

    return {
      total: stats?.total || 0,
      active: stats?.active || 0,
      completed: stats?.completed || 0,
      archived: stats?.archived || 0,
      abandoned: stats?.abandoned || 0,
    };
  }

  /**
   * Create a version entry for a goal
   */
  private createVersion(goal: Goal, changeReason: string): void {
    // Get current version number
    const currentVersion = this.db.queryOne<{ max_version: number | null }>(
      'SELECT MAX(version) as max_version FROM goal_versions WHERE goal_id = ?',
      [goal.id]
    );

    const version = (currentVersion?.max_version || 0) + 1;

    this.db.execute(
      `INSERT INTO goal_versions (id, goal_id, version, title, description, scope, constraints, created_at, change_reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        goal.id,
        version,
        goal.title,
        goal.description,
        JSON.stringify(goal.scope),
        JSON.stringify(goal.constraints),
        new Date().toISOString(),
        changeReason,
      ]
    );
  }

  /**
   * Map database row to Goal object
   */
  private mapRowToGoal(row: {
    id: string;
    title: string;
    description: string;
    constraints: string;
    scope: string;
    priority: number;
    created_at: string;
    updated_at: string;
    status: string;
  }): Goal {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      constraints: JSON.parse(row.constraints),
      scope: JSON.parse(row.scope),
      priority: row.priority,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      status: row.status as GoalStatus,
    };
  }
}
