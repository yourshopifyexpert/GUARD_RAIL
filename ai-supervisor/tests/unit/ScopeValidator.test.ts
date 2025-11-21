import { ScopeValidator } from '../../src/analysis/ScopeValidator';
import { Goal, CodeChange } from '../../src/types';

describe('ScopeValidator', () => {
  let validator: ScopeValidator;

  beforeEach(() => {
    validator = new ScopeValidator();
  });

  describe('validateChange', () => {
    it('should allow changes within scope', () => {
      const goal: Goal = {
        id: 'goal_1',
        title: 'Test Goal',
        description: 'desc',
        constraints: [],
        scope: ['src/'],
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

      const deviation = validator.validateChange(change, [goal]);

      expect(deviation).toBeNull();
    });

    it('should detect scope violations', () => {
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

      const deviation = validator.validateChange(change, [goal]);

      expect(deviation).not.toBeNull();
      expect(deviation?.type).toBe('scope_violation');
      expect(deviation?.severity).toBe('medium');
    });

    it('should match wildcard patterns', () => {
      const goal: Goal = {
        id: 'goal_1',
        title: 'Test Goal',
        description: 'desc',
        constraints: [],
        scope: ['**/*.ts'],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      const change: CodeChange = {
        id: 'change_1',
        timestamp: new Date(),
        filePath: 'src/deep/nested/file.ts',
        beforeContent: '',
        afterContent: 'code',
        diff: '+ code'
      };

      const deviation = validator.validateChange(change, [goal]);

      expect(deviation).toBeNull();
    });

    it('should handle multiple scope patterns', () => {
      const goal: Goal = {
        id: 'goal_1',
        title: 'Test Goal',
        description: 'desc',
        constraints: [],
        scope: ['src/auth/', 'src/middleware/'],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      const change1: CodeChange = {
        id: 'change_1',
        timestamp: new Date(),
        filePath: 'src/auth/login.ts',
        beforeContent: '',
        afterContent: 'code',
        diff: '+ code'
      };

      const change2: CodeChange = {
        id: 'change_2',
        timestamp: new Date(),
        filePath: 'src/middleware/auth.ts',
        beforeContent: '',
        afterContent: 'code',
        diff: '+ code'
      };

      expect(validator.validateChange(change1, [goal])).toBeNull();
      expect(validator.validateChange(change2, [goal])).toBeNull();
    });

    it('should return null when no goals defined', () => {
      const change: CodeChange = {
        id: 'change_1',
        timestamp: new Date(),
        filePath: 'any/file.ts',
        beforeContent: '',
        afterContent: 'code',
        diff: '+ code'
      };

      const deviation = validator.validateChange(change, []);

      expect(deviation).toBeNull();
    });

    it('should detect file deletions when constrained', () => {
      const goal: Goal = {
        id: 'goal_1',
        title: 'Test Goal',
        description: 'desc',
        constraints: ['no_deletions'],
        scope: ['src/'],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      const change: CodeChange = {
        id: 'change_1',
        timestamp: new Date(),
        filePath: 'src/file.ts',
        beforeContent: 'lots of code here\nmore code\neven more',
        afterContent: '',
        diff: '- lots of code'
      };

      const deviation = validator.validateChange(change, [goal]);

      expect(deviation).not.toBeNull();
      expect(deviation?.type).toBe('unauthorized_action');
      expect(deviation?.description).toContain('deletion');
    });

    it('should detect external API calls when constrained', () => {
      const goal: Goal = {
        id: 'goal_1',
        title: 'Test Goal',
        description: 'desc',
        constraints: ['no_external_api'],
        scope: ['src/'],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      const change: CodeChange = {
        id: 'change_1',
        timestamp: new Date(),
        filePath: 'src/api.ts',
        beforeContent: '',
        afterContent: 'fetch("/api/users")',
        diff: '+ fetch("/api/users")'
      };

      const deviation = validator.validateChange(change, [goal]);

      expect(deviation).not.toBeNull();
      expect(deviation?.type).toBe('unauthorized_action');
      expect(deviation?.description).toContain('API');
    });

    it('should handle empty scope as allowing all files', () => {
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

      const change: CodeChange = {
        id: 'change_1',
        timestamp: new Date(),
        filePath: 'any/random/file.ts',
        beforeContent: '',
        afterContent: 'code',
        diff: '+ code'
      };

      const deviation = validator.validateChange(change, [goal]);

      expect(deviation).toBeNull();
    });
  });
});
