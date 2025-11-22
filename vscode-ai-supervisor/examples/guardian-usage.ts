/**
 * Guardian Usage Examples
 *
 * This file demonstrates how the Multi-Model Guardian System works
 * in AI Supervisor. These are conceptual examples showing the flow.
 */

// ============================================================================
// EXAMPLE 1: Basic Guardian Flow
// ============================================================================

/**
 * Scenario: You're coding with Claude 3.5, GPT-4o acts as guardian
 */
async function example1_BasicGuardianFlow() {
  // 1. You write code using Claude (via Continue, Claude extension, etc.)
  const codeByClaudeUser = `
    async function login(username: string, password: string) {
      const user = await validateCredentials(username, password);

      // Claude helpfully adds login tracking
      await db.users.update({
        id: user.id,
        lastLogin: new Date(),
        loginCount: user.loginCount + 1
      });

      return jwt.sign({ userId: user.id }, SECRET);
    }
  `;

  // 2. AI Supervisor detects the change
  const changeDetected = {
    file: 'src/auth/login.ts',
    codingModel: 'claude-3-5-sonnet',  // Auto-detected
    lines: '15-25',
    changeType: 'modification'
  };

  // 3. Guardian (GPT-4o) analyzes it
  const guardianAnalysis = await analyzeWithGuardian(codeByClaudeUser, {
    guardianModel: 'gpt-4o',  // Different from Claude!
    goal: {
      title: 'Implement authentication',
      constraints: ['no_database_writes_in_auth']
    }
  });

  // 4. Guardian response
  console.log(guardianAnalysis);
  /**
   * Output:
   * {
   *   aligned: false,
   *   confidence: 0.94,
   *   severity: 'high',
   *   guardianModel: 'gpt-4o',
   *   codingModel: 'claude-3-5-sonnet',
   *   reasoning: `
   *     GPT-4o Analysis:
   *
   *     This code violates your constraint: "no_database_writes_in_auth"
   *
   *     While Claude's intention to track logins is good, this creates issues:
   *     1. DB writes slow down authentication
   *     2. DB failures could prevent valid logins
   *     3. Violates stated architecture principle
   *
   *     Recommendation: Move to event-driven service
   *   `,
   *   suggestions: [
   *     {
   *       action: 'refactor',
   *       description: 'Extract DB write to background service',
   *       priority: 'high'
   *     }
   *   ]
   * }
   */
}

// ============================================================================
// EXAMPLE 2: Security Issue Detection
// ============================================================================

/**
 * Scenario: GPT-4 writes code, Claude 3.5 catches security issue
 */
async function example2_SecurityDetection() {
  // 1. Code written by GPT-4 (via Copilot)
  const codeByGPT4 = `
    async function searchUsers(query: string) {
      // GPT-4 generates this SQL query
      const sql = \`SELECT * FROM users WHERE name LIKE '%\${query}%'\`;
      return await db.execute(sql);
    }
  `;

  // 2. Guardian (Claude 3.5) analyzes
  const analysis = await analyzeWithGuardian(codeByGPT4, {
    guardianModel: 'claude-3-5-sonnet',
    codingModel: 'gpt-4',
    focus: 'security'
  });

  console.log(analysis);
  /**
   * Output:
   * {
   *   aligned: false,
   *   confidence: 0.98,
   *   severity: 'critical',
   *   guardianModel: 'claude-3-5-sonnet',
   *   codingModel: 'gpt-4',
   *   issueType: 'sql_injection',
   *   reasoning: `
   *     Claude 3.5 Analysis:
   *
   *     CRITICAL SECURITY VULNERABILITY: SQL Injection
   *
   *     The query parameter is directly interpolated into SQL:
   *     \`SELECT * FROM users WHERE name LIKE '%\${query}%'\`
   *
   *     Attack example: query = "'; DROP TABLE users; --"
   *     Result: Database destruction
   *
   *     This is a textbook SQL injection vulnerability.
   *
   *     FIX: Use parameterized queries
   *   `,
   *   suggestedFix: `
   *     async function searchUsers(query: string) {
   *       const sql = 'SELECT * FROM users WHERE name LIKE ?';
   *       return await db.execute(sql, [\`%\${query}%\`]);
   *     }
   *   `
   * }
   */
}

// ============================================================================
// EXAMPLE 3: Performance Issue Detection
// ============================================================================

/**
 * Scenario: Claude writes code, GPT-4o catches N+1 query problem
 */
async function example3_PerformanceIssue() {
  // 1. Code written by Claude
  const codeByClaudeN1 = `
    async function getUsersWithPosts() {
      const users = await db.users.findAll();

      // Claude adds post fetching for each user
      for (const user of users) {
        user.posts = await db.posts.findByUserId(user.id);
      }

      return users;
    }
  `;

  // 2. Guardian (GPT-4o) analyzes
  const analysis = await analyzeWithGuardian(codeByClaudeN1, {
    guardianModel: 'gpt-4o',
    codingModel: 'claude-3-5-sonnet',
    focus: 'performance'
  });

  console.log(analysis);
  /**
   * Output:
   * {
   *   aligned: false,
   *   confidence: 0.91,
   *   severity: 'high',
   *   issueType: 'n_plus_one_query',
   *   reasoning: `
   *     GPT-4o Analysis:
   *
   *     PERFORMANCE ISSUE: N+1 Query Problem
   *
   *     With 100 users, this code executes:
   *     - 1 query to get users
   *     - 100 queries to get posts (one per user)
   *     = 101 total database queries
   *
   *     This will cause severe performance degradation at scale.
   *
   *     Claude's logic is correct but inefficient.
   *   `,
   *   suggestedFix: `
   *     async function getUsersWithPosts() {
   *       // Single query with JOIN
   *       return await db.users.findAll({
   *         include: [{ model: db.posts }]
   *       });
   *
   *       // Now only 1 query total!
   *     }
   *   `
   * }
   */
}

// ============================================================================
// EXAMPLE 4: Cross-Model Comparison
// ============================================================================

/**
 * Scenario: Compare how different models view the same code
 */
async function example4_CrossModelComparison() {
  const code = `
    async function processPayment(amount: number, userId: string) {
      const user = await db.users.findById(userId);

      if (user.balance >= amount) {
        user.balance -= amount;
        await user.save();
        return { success: true };
      }

      return { success: false, error: 'Insufficient funds' };
    }
  `;

  // Analyze with multiple guardians
  const gpt4Analysis = await analyzeWithGuardian(code, {
    guardianModel: 'gpt-4o',
    focus: 'security'
  });

  const claudeAnalysis = await analyzeWithGuardian(code, {
    guardianModel: 'claude-3-5-sonnet',
    focus: 'logic'
  });

  const geminiAnalysis = await analyzeWithGuardian(code, {
    guardianModel: 'gemini-pro',
    focus: 'concurrency'
  });

  // Different perspectives!
  console.log({
    gpt4: gpt4Analysis.mainIssue,
    // "No transaction - race condition vulnerability"

    claude: claudeAnalysis.mainIssue,
    // "Missing error handling for db.users.findById failure"

    gemini: geminiAnalysis.mainIssue
    // "No locking mechanism - concurrent requests will corrupt balance"
  });

  // Each model caught different issues!
}

// ============================================================================
// EXAMPLE 5: Local vs Cloud Guardian
// ============================================================================

/**
 * Scenario: Using local Ollama models vs cloud models
 */
async function example5_LocalVsCloud() {
  const code = `
    function calculateDiscount(price: number, coupon: string): number {
      if (coupon === 'SAVE20') return price * 0.8;
      if (coupon === 'SAVE50') return price * 0.5;
      return price;
    }
  `;

  // Local guardian (Llama 3.1 via Ollama)
  const localAnalysis = await analyzeWithGuardian(code, {
    guardianModel: 'llama3.1:70b',
    provider: 'ollama',
    endpoint: 'http://localhost:11434'
  });

  console.log('Local (Llama 3.1):', localAnalysis);
  /**
   * Output:
   * {
   *   aligned: true,
   *   confidence: 0.75,
   *   reasoning: "Code looks good, basic discount logic",
   *   cost: 0,  // Free!
   *   executionTime: 2.5,  // seconds (slower on CPU)
   *   privacy: 'complete'  // Never left your machine
   * }
   */

  // Cloud guardian (GPT-4o)
  const cloudAnalysis = await analyzeWithGuardian(code, {
    guardianModel: 'gpt-4o',
    provider: 'openai'
  });

  console.log('Cloud (GPT-4o):', cloudAnalysis);
  /**
   * Output:
   * {
   *   aligned: false,
   *   confidence: 0.89,
   *   reasoning: `
   *     Issues found:
   *     1. No input validation - negative prices not handled
   *     2. Case-sensitive coupon codes - UX issue
   *     3. No expiration date check for coupons
   *     4. Hardcoded discounts - should be configurable
   *   `,
   *   cost: 0.015,  // $0.015 USD
   *   executionTime: 0.8,  // seconds (faster)
   *   privacy: 'cloud'  // Sent to OpenAI
   * }
   */

  // Cloud model found more issues but costs money
  // Local model is free and private but less thorough
}

// ============================================================================
// EXAMPLE 6: Real-Time Integration
// ============================================================================

/**
 * How AI Supervisor integrates guardian analysis in your workflow
 */
class GuardianIntegration {

  async onFileChange(change: FileChange) {
    // 1. Detect which AI model made the change
    const codingModel = await this.detectCodingModel(change);

    // 2. Select appropriate guardian (different model!)
    const guardianModel = this.selectGuardian(codingModel);

    // 3. Get project goals and constraints
    const goals = await this.loadGoals();

    // 4. Run guardian analysis
    const analysis = await this.analyzeWithGuardian(change.content, {
      guardianModel,
      codingModel,
      goals,
      file: change.file
    });

    // 5. Check for deviations
    if (!analysis.aligned) {
      // 6. Show alert to user
      await this.showAlert({
        severity: analysis.severity,
        title: 'Guardian Detected Issue',
        message: analysis.reasoning,
        actions: [
          'Accept',
          'Reject',
          'View Details',
          'Pause Monitoring'
        ]
      });
    }

    // 7. Store analysis in TOML
    await this.storeAnalysis(analysis);

    // 8. Track costs
    await this.trackCost(analysis.cost);
  }

  selectGuardian(codingModel: string): string {
    // Cross-model verification
    const pairings = {
      'claude-3-5-sonnet': 'gpt-4o',
      'gpt-4': 'claude-3-5-sonnet',
      'gpt-4o': 'claude-3-5-sonnet',
      'github-copilot': 'claude-3-5-sonnet',
      'cursor': 'gemini-pro',
      'continue': 'deepseek-coder'
    };

    return pairings[codingModel] || 'gpt-4o';
  }
}

// ============================================================================
// EXAMPLE 7: Custom Guardian Rules
// ============================================================================

/**
 * Define custom rules for guardian to check
 */
async function example7_CustomRules() {
  const customRules = {
    project: 'E-commerce Platform',

    constraints: [
      {
        id: 'no_console_log',
        rule: 'No console.log in production code',
        severity: 'warning',
        pattern: /console\.log\(/
      },
      {
        id: 'require_error_handling',
        rule: 'All async functions must have try-catch',
        severity: 'error',
        check: (code: string) => {
          const hasAsync = /async\s+function/.test(code);
          const hasTryCatch = /try\s*{/.test(code);
          return !hasAsync || hasTryCatch;
        }
      },
      {
        id: 'max_function_length',
        rule: 'Functions must be under 50 lines',
        severity: 'warning',
        check: (code: string) => code.split('\n').length <= 50
      }
    ],

    preferences: {
      coding_style: 'functional',
      test_coverage_min: 80,
      documentation_required: true
    }
  };

  // Guardian analyzes code against your custom rules
  const code = `
    async function processOrder(order) {
      console.log('Processing order:', order);  // ⚠️ Violates no_console_log

      const result = await payment.charge(order.total);  // ⚠️ No try-catch
      return result;
    }
  `;

  const analysis = await analyzeWithGuardian(code, {
    guardianModel: 'gpt-4o',
    customRules
  });

  console.log(analysis.violations);
  /**
   * Output:
   * [
   *   {
   *     rule: 'no_console_log',
   *     severity: 'warning',
   *     line: 2,
   *     message: 'Remove console.log from production code'
   *   },
   *   {
   *     rule: 'require_error_handling',
   *     severity: 'error',
   *     line: 4,
   *     message: 'Async function missing try-catch block'
   *   }
   * ]
   */
}

// ============================================================================
// Helper Types & Interfaces
// ============================================================================

interface FileChange {
  file: string;
  content: string;
  lines: string;
  timestamp: Date;
}

interface GuardianAnalysis {
  aligned: boolean;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  guardianModel: string;
  codingModel: string;
  reasoning: string;
  suggestions?: Suggestion[];
  cost?: number;
  executionTime?: number;
}

interface Suggestion {
  action: 'refactor' | 'fix' | 'test' | 'document';
  description: string;
  priority: 'low' | 'medium' | 'high';
  suggestedFix?: string;
}

interface Goal {
  title: string;
  constraints: string[];
  acceptance?: string[];
}

// Mock implementation for examples
async function analyzeWithGuardian(
  code: string,
  options: {
    guardianModel: string;
    codingModel?: string;
    goal?: Goal;
    focus?: string;
    provider?: string;
    endpoint?: string;
    customRules?: any;
  }
): Promise<GuardianAnalysis> {
  // In real implementation, this calls the guardian model API
  // and returns actual analysis. This is just for demonstration.
  return {
    aligned: true,
    confidence: 0.85,
    severity: 'low',
    guardianModel: options.guardianModel,
    codingModel: options.codingModel || 'unknown',
    reasoning: 'Example analysis result'
  };
}

// ============================================================================
// SUMMARY
// ============================================================================

/**
 * Key Takeaways:
 *
 * 1. Cross-Model Verification:
 *    - Code with Claude → Guardian is GPT-4o
 *    - Code with GPT-4 → Guardian is Claude
 *    - Different models catch different issues!
 *
 * 2. Automatic Detection:
 *    - AI Supervisor detects which model you're using
 *    - Automatically selects appropriate guardian
 *    - You just code normally
 *
 * 3. Real Guardianing Examples:
 *    - Security vulnerabilities (SQL injection)
 *    - Performance issues (N+1 queries)
 *    - Logic errors (race conditions)
 *    - Constraint violations (architecture rules)
 *
 * 4. Flexible Options:
 *    - Cloud models: High accuracy, costs money
 *    - Local models: Free, private, requires hardware
 *    - Mix both: Local for dev, cloud for critical code
 *
 * 5. Custom Rules:
 *    - Define your own constraints
 *    - Guardian enforces them automatically
 *    - Get alerts when violated
 *
 * This is the power of Multi-Model Guardian System!
 */

export {
  example1_BasicGuardianFlow,
  example2_SecurityDetection,
  example3_PerformanceIssue,
  example4_CrossModelComparison,
  example5_LocalVsCloud,
  example7_CustomRules,
  GuardianIntegration
};
