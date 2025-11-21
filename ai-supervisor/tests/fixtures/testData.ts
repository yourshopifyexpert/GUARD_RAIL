/**
 * Test fixtures and mock data for AI Supervisor tests
 */

import { Goal, ConversationEntry, CodeChange } from '../../src/types';

export const mockGoals: Goal[] = [
  {
    id: 'goal_1',
    title: 'Implement User Authentication',
    description: 'Build a secure authentication system with JWT tokens',
    constraints: ['no_external_api', 'no_deletions'],
    scope: ['src/auth/', 'src/middleware/', '*.ts'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    status: 'active'
  },
  {
    id: 'goal_2',
    title: 'Add Database Layer',
    description: 'Create database abstraction with TypeORM',
    constraints: [],
    scope: ['src/database/', 'src/models/'],
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    status: 'active'
  }
];

export const mockConversations: ConversationEntry[] = [
  {
    id: 'conv_1',
    timestamp: new Date('2024-01-01T10:00:00'),
    role: 'user',
    content: 'I need to implement user authentication with JWT tokens',
    metadata: {}
  },
  {
    id: 'conv_2',
    timestamp: new Date('2024-01-01T10:01:00'),
    role: 'assistant',
    content: 'I will help you implement JWT authentication. We will create an auth middleware and login endpoint.',
    metadata: {}
  },
  {
    id: 'conv_3',
    timestamp: new Date('2024-01-01T10:02:00'),
    role: 'user',
    content: 'Great! Make sure to use bcrypt for password hashing',
    metadata: {}
  }
];

export const mockCodeChanges: CodeChange[] = [
  {
    id: 'change_1',
    timestamp: new Date('2024-01-01T10:05:00'),
    filePath: 'src/auth/middleware.ts',
    beforeContent: '',
    afterContent: 'export const authMiddleware = (req, res, next) => {\n  // TODO\n};',
    diff: '+ export const authMiddleware = (req, res, next) => {\n+   // TODO\n+ };',
    reason: 'Created authentication middleware',
    conversationId: 'conv_2'
  },
  {
    id: 'change_2',
    timestamp: new Date('2024-01-01T10:10:00'),
    filePath: 'src/auth/middleware.ts',
    beforeContent: 'export const authMiddleware = (req, res, next) => {\n  // TODO\n};',
    afterContent: 'export const authMiddleware = (req, res, next) => {\n  const token = req.headers.authorization;\n  if (!token) return res.status(401).json({ error: "Unauthorized" });\n  next();\n};',
    diff: '  export const authMiddleware = (req, res, next) => {\n-   // TODO\n+   const token = req.headers.authorization;\n+   if (!token) return res.status(401).json({ error: "Unauthorized" });\n+   next();\n  };',
    reason: 'Implemented token validation',
    conversationId: 'conv_2'
  }
];

export const sampleCode = {
  before: `function calculateTotal(items) {
  let total = 0;
  for (const item of items) {
    total += item.price;
  }
  return total;
}`,
  
  after: `function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}`,

  reversed: `function calculateTotal(items) {
  let total = 0;
  for (const item of items) {
    total += item.price;
  }
  return total;
}`,

  withApiCall: `function fetchUserData(userId) {
  return fetch('/api/users/' + userId)
    .then(res => res.json());
}`,

  outsideScope: `// File in tests/ directory
describe('User tests', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});`
};
