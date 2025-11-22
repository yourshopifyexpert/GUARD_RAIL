# TOML Storage Format

AI Supervisor stores all data in human-readable TOML files. This document explains the storage format, file structure, and how to work with the data.

## Why TOML?

**TOML (Tom's Obvious, Minimal Language)** is perfect for AI Supervisor because it's:

- **Human-readable**: Easy to inspect and edit manually
- **Version control friendly**: Works great with git
- **Structured**: Supports complex nested data
- **Simple**: No complex syntax or parsing rules
- **Portable**: Works across all platforms

**Example comparison:**

```toml
# TOML - Clean and readable
[goal]
title = "Build REST API"
status = "active"
constraints = ["no_database_writes", "use_jwt"]
```

```json
// JSON - More verbose
{
  "goal": {
    "title": "Build REST API",
    "status": "active",
    "constraints": ["no_database_writes", "use_jwt"]
  }
}
```

## Storage Location

All AI Supervisor data is stored in your workspace:

```
your-project/
└── .vscode/
    └── ai-supervisor/
        ├── goals.toml           # Project goals and constraints
        ├── analyses.toml        # Guardian analysis results
        ├── config.toml          # Extension configuration
        ├── costs.toml           # API usage and costs
        ├── sessions.toml        # Coding sessions
        └── alerts.toml          # Alert history
```

**Benefits:**
- ✅ Per-project data isolation
- ✅ Version control integration
- ✅ Easy backup (just commit the folder)
- ✅ Portable across machines
- ✅ No database setup required

## File Formats

### 1. `goals.toml` - Project Goals

Stores your project goals, constraints, and acceptance criteria.

```toml
# File: .vscode/ai-supervisor/goals.toml

# Metadata
version = "1.0"
created = 2024-11-21T10:00:00Z
updated = 2024-11-21T15:30:00Z

# Active goal
[[goal]]
id = "goal-001"
title = "Implement User Authentication"
description = """
Build a secure authentication system with JWT tokens.
Must support login, logout, and token refresh.
"""
status = "active"
priority = "high"
created = 2024-11-21T10:00:00Z
updated = 2024-11-21T15:30:00Z

# Constraints (hard requirements)
[[goal.constraints]]
type = "architecture"
rule = "no_database_writes_in_auth"
description = "Authentication handlers must not write to database"
severity = "error"

[[goal.constraints]]
type = "security"
rule = "use_jwt_tokens"
description = "Must use JWT for session management, not cookies"
severity = "error"

[[goal.constraints]]
type = "performance"
rule = "max_response_time_100ms"
description = "Auth endpoints must respond within 100ms"
severity = "warning"

# Acceptance criteria
[[goal.acceptance]]
criterion = "User can login with username/password"
status = "completed"
verified = true

[[goal.acceptance]]
criterion = "JWT tokens are properly signed and validated"
status = "in_progress"
verified = false

[[goal.acceptance]]
criterion = "Token refresh works correctly"
status = "pending"
verified = false

# Scope - what files this goal covers
[goal.scope]
includes = [
    "src/auth/**/*.ts",
    "src/middleware/auth.ts"
]
excludes = [
    "src/auth/**/*.test.ts"
]

# Completed goals
[[goal]]
id = "goal-002"
title = "Setup Project Structure"
status = "completed"
completed = 2024-11-21T09:00:00Z
```

### 2. `analyses.toml` - Guardian Analysis Results

Stores all guardian model analyses of code changes.

```toml
# File: .vscode/ai-supervisor/analyses.toml

version = "1.0"

# Individual analysis
[[analysis]]
id = "20241121-153045-abc123"
timestamp = 2024-11-21T15:30:45Z

# File information
file = "src/auth/login.ts"
lines = "15-42"
change_type = "modification"

# Model information
coding_model = "claude-3-5-sonnet-20241022"
guardian_model = "gpt-4o"
guardian_provider = "openai"

# Analysis results
[analysis.result]
aligned = false
confidence = 0.94
severity = "high"
execution_time_ms = 1250

# Deviation details
[analysis.deviation]
type = "constraint_violation"
constraint_id = "no_database_writes_in_auth"
detected = true

# Guardian's reasoning
[analysis.reasoning]
summary = "Database write operation added to authentication handler"
details = """
GPT-4o Analysis:

This code adds a database write operation in the login handler:

```typescript
await db.users.update({
    id: user.id,
    lastLogin: new Date()
});
```

ISSUE:
This violates your explicit constraint: "no_database_writes_in_auth"

WHY THIS MATTERS:
1. Performance: DB writes slow down authentication
2. Reliability: DB failures could prevent valid logins
3. Architecture: Violates your stated design principle
4. Security: Creates potential for race conditions

CLAUDE'S INTENTION:
Claude was trying to be helpful by tracking login activity.
This is a reasonable feature, but wrong location.

RECOMMENDATION:
Move login tracking to a separate service:

```typescript
// In login handler - no DB write
const token = await generateToken(user);

// Emit event instead
loginEvents.emit('user-logged-in', {
    userId: user.id,
    timestamp: new Date()
});

return token;
```

Then handle in background service:
```typescript
// In separate service
loginEvents.on('user-logged-in', async (event) => {
    await db.users.update({
        id: event.userId,
        lastLogin: event.timestamp
    });
});
```

This maintains your constraint while preserving functionality.
"""

# Code snippets
[[analysis.code_snippets]]
type = "violation"
content = """
await db.users.update({
    id: user.id,
    lastLogin: new Date(),
    loginCount: user.loginCount + 1
});
"""
line_start = 23
line_end = 27

# Suggestions
[[analysis.suggestions]]
priority = "high"
action = "refactor"
title = "Move DB write to event-driven service"
description = """
Extract database update to separate background service.
Use event emitter pattern to decouple.
"""
estimated_effort = "15 minutes"

[[analysis.suggestions]]
priority = "medium"
action = "test"
title = "Add tests for login tracking"
description = "Ensure login tracking works in background service"
estimated_effort = "30 minutes"

# Cost tracking
[analysis.cost]
input_tokens = 2450
output_tokens = 856
total_tokens = 3306
cost_usd = 0.0147
provider = "openai"
model = "gpt-4o"

# User action taken
[analysis.user_action]
action = "accepted"
timestamp = 2024-11-21T15:35:00Z
comment = "Good catch! Implemented event-driven approach."
```

### 3. `config.toml` - Extension Configuration

Stores extension settings and user preferences.

```toml
# File: .vscode/ai-supervisor/config.toml

version = "1.0"
created = 2024-11-21T09:00:00Z

# Guardian configuration
[guardian]
provider = "openai"
model = "gpt-4o"
auto_select = true
analysis_depth = "standard"

# Provider API keys (encrypted)
[guardian.providers.openai]
api_key_hash = "sha256:abc123..."  # Encrypted, not plaintext
enabled = true
last_used = 2024-11-21T15:30:45Z

[guardian.providers.anthropic]
api_key_hash = "sha256:def456..."
enabled = true
last_used = 2024-11-20T10:00:00Z

# Model pairings
[guardian.pairings]
"claude-3-5-sonnet" = "gpt-4o"
"gpt-4" = "claude-3-5-sonnet"
"github-copilot" = "claude-3-5-sonnet"
"cursor" = "gemini-pro"

# Cost limits
[guardian.cost_limits]
daily_usd = 5.00
monthly_usd = 50.00
alert_threshold = 0.8  # Alert at 80% of limit

# Monitoring settings
[monitoring]
enabled = true
sensitivity = "medium"
auto_pause_on_alert = false
track_all_changes = true

# Alert settings
[alerts]
show_notifications = true
severity_filter = "all"  # all, warning, error
sound_enabled = false
desktop_notifications = true

# Storage settings
[storage]
retention_days = 30
auto_cleanup = true
compress_old_analyses = true
max_size_mb = 100
```

### 4. `costs.toml` - API Usage Tracking

Tracks API costs and usage across all guardian providers.

```toml
# File: .vscode/ai-supervisor/costs.toml

version = "1.0"

# Current month summary
[summary.current]
month = "2024-11"
total_cost_usd = 3.47
total_requests = 142
total_tokens = 456789

# Breakdown by provider
[[summary.current.by_provider]]
provider = "openai"
model = "gpt-4o"
requests = 98
cost_usd = 2.34
input_tokens = 245678
output_tokens = 89012

[[summary.current.by_provider]]
provider = "anthropic"
model = "claude-3-5-sonnet"
requests = 44
cost_usd = 1.13
input_tokens = 98765
output_tokens = 23334

# Daily breakdown
[[daily]]
date = 2024-11-21
total_cost_usd = 0.47
total_requests = 23

[[daily.requests]]
timestamp = 2024-11-21T15:30:45Z
provider = "openai"
model = "gpt-4o"
input_tokens = 2450
output_tokens = 856
cost_usd = 0.0147
analysis_id = "20241121-153045-abc123"

[[daily.requests]]
timestamp = 2024-11-21T14:15:30Z
provider = "anthropic"
model = "claude-3-5-sonnet"
input_tokens = 3200
output_tokens = 1100
cost_usd = 0.0261
analysis_id = "20241121-141530-def456"

# Historical data
[[monthly]]
month = "2024-10"
total_cost_usd = 12.34
total_requests = 456
total_tokens = 1234567
average_cost_per_request = 0.027
```

### 5. `sessions.toml` - Coding Sessions

Tracks coding sessions and AI tool usage.

```toml
# File: .vscode/ai-supervisor/sessions.toml

version = "1.0"

# Active session
[[session]]
id = "session-20241121-150000"
start_time = 2024-11-21T15:00:00Z
end_time = 2024-11-21T16:30:00Z
status = "completed"

# Detected AI tools
[[session.ai_tools]]
name = "Continue"
model = "claude-3-5-sonnet"
first_detected = 2024-11-21T15:05:00Z
last_detected = 2024-11-21T16:25:00Z
interactions = 12

# Files modified
[[session.files]]
path = "src/auth/login.ts"
changes = 3
lines_added = 45
lines_removed = 12
guardian_analyses = 2

[[session.files]]
path = "src/auth/middleware.ts"
changes = 1
lines_added = 23
lines_removed = 0
guardian_analyses = 1

# Alerts triggered
[session.alerts]
total = 3
severity_high = 1
severity_medium = 2
severity_low = 0
user_actions_taken = 3

# Productivity metrics
[session.metrics]
duration_minutes = 90
files_modified = 2
total_changes = 4
alerts_per_change = 0.75
guardian_catch_rate = 0.33  # 33% of changes flagged
```

### 6. `alerts.toml` - Alert History

Complete history of all alerts shown to user.

```toml
# File: .vscode/ai-supervisor/alerts.toml

version = "1.0"

[[alert]]
id = "alert-20241121-153045"
timestamp = 2024-11-21T15:30:45Z
type = "constraint_violation"
severity = "high"
dismissed = false

# Alert content
[alert.content]
title = "Constraint Violation Detected"
message = "Database write in authentication handler violates project constraints"
file = "src/auth/login.ts"
lines = "23-27"

# Related analysis
[alert.analysis]
id = "20241121-153045-abc123"
guardian_model = "gpt-4o"
confidence = 0.94

# User response
[alert.user_response]
action = "accepted"
timestamp = 2024-11-21T15:35:00Z
comment = "Fixed by implementing event-driven approach"
time_to_respond_seconds = 315
```

## Working with TOML Files

### Reading TOML in Code

```typescript
import * as fs from 'fs';
import * as toml from 'toml';

// Read goals
const goalsFile = '.vscode/ai-supervisor/goals.toml';
const goalsContent = fs.readFileSync(goalsFile, 'utf-8');
const goals = toml.parse(goalsContent);

console.log(goals.goal[0].title);
// Output: "Implement User Authentication"
```

### Writing TOML in Code

```typescript
import * as fs from 'fs';
import * as TOML from '@iarna/toml';

// Create analysis object
const analysis = {
  id: '20241121-153045-abc123',
  timestamp: new Date(),
  file: 'src/auth/login.ts',
  coding_model: 'claude-3-5-sonnet',
  guardian_model: 'gpt-4o',
  result: {
    aligned: false,
    confidence: 0.94,
    severity: 'high'
  }
};

// Convert to TOML
const tomlString = TOML.stringify({ analysis: [analysis] });

// Write to file
fs.writeFileSync('.vscode/ai-supervisor/analyses.toml', tomlString);
```

### Manual Editing

You can manually edit TOML files with any text editor:

```bash
# Open in VS Code
code .vscode/ai-supervisor/goals.toml

# Or use vim, nano, etc.
vim .vscode/ai-supervisor/goals.toml
```

**Common edits:**
- Add new goals
- Update constraints
- Modify cost limits
- Change guardian settings
- Review analysis history

## Version Control

### What to Commit

**Recommended to commit:**
- ✅ `goals.toml` - Share goals across team
- ✅ `config.toml` - Consistent settings (without API keys)
- ⚠️ `analyses.toml` - Optional, for historical record

**Recommended to ignore:**
- ❌ API keys in config (use environment variables instead)
- ❌ `costs.toml` - Personal usage data
- ❌ `sessions.toml` - Personal session data
- ❌ `alerts.toml` - Personal alert history

### `.gitignore` Example

```gitignore
# AI Supervisor - Ignore personal data
.vscode/ai-supervisor/costs.toml
.vscode/ai-supervisor/sessions.toml
.vscode/ai-supervisor/alerts.toml

# But keep team-shared data
# .vscode/ai-supervisor/goals.toml (committed)
# .vscode/ai-supervisor/config.toml (committed, no keys)
```

### Sharing Config Without Keys

```toml
# Committed version - no secrets
[guardian]
provider = "openai"
model = "gpt-4o"

# Personal version - with secrets (in .gitignore)
[guardian.providers.openai]
api_key = "sk-..."  # This file is ignored
```

## Migration and Backup

### Backup All Data

```bash
# Create backup
cp -r .vscode/ai-supervisor .vscode/ai-supervisor-backup-$(date +%Y%m%d)

# Or compress
tar -czf ai-supervisor-backup.tar.gz .vscode/ai-supervisor
```

### Restore from Backup

```bash
# Restore from compressed backup
tar -xzf ai-supervisor-backup.tar.gz

# Or from directory
cp -r .vscode/ai-supervisor-backup-20241121 .vscode/ai-supervisor
```

### Export to JSON

```typescript
import * as fs from 'fs';
import * as toml from 'toml';

// Read TOML
const tomlContent = fs.readFileSync('.vscode/ai-supervisor/goals.toml', 'utf-8');
const data = toml.parse(tomlContent);

// Write as JSON
fs.writeFileSync('goals-export.json', JSON.stringify(data, null, 2));
```

### Migrate from Old Version

```typescript
// Migration script example
import * as fs from 'fs';
import * as toml from 'toml';
import * as TOML from '@iarna/toml';

// Read old format
const oldData = toml.parse(fs.readFileSync('old-data.toml', 'utf-8'));

// Transform to new format
const newData = {
  version: '1.0',
  goals: oldData.goals.map(g => ({
    ...g,
    // Add new required fields
    priority: g.priority || 'medium',
    scope: g.scope || { includes: [], excludes: [] }
  }))
};

// Write new format
fs.writeFileSync('goals.toml', TOML.stringify(newData));
```

## Best Practices

### 1. Regular Cleanup

```toml
# In config.toml
[storage]
retention_days = 30  # Auto-delete old analyses
auto_cleanup = true
```

### 2. Use Comments

```toml
# Project goal for Sprint 23
# Started: 2024-11-21
# Expected completion: 2024-11-28
[[goal]]
title = "Implement User Authentication"
```

### 3. Validate on Save

```typescript
// Add validation hook
function validateToml(file: string) {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    toml.parse(content);  // Will throw if invalid
    return true;
  } catch (error) {
    console.error('Invalid TOML:', error);
    return false;
  }
}
```

### 4. Use Semantic Versioning

```toml
# Update version when format changes
version = "1.0"  # Major.Minor
```

## Troubleshooting

### "Invalid TOML syntax" Error

**Problem**: TOML file is malformed

**Solution**:
1. Check for common issues:
   - Unmatched quotes
   - Invalid dates
   - Wrong array syntax
2. Use TOML validator: https://www.toml-lint.com/
3. Restore from backup if needed

### "File not found" Error

**Problem**: TOML file missing

**Solution**:
1. Extension creates files automatically
2. Or create manually:
```bash
mkdir -p .vscode/ai-supervisor
touch .vscode/ai-supervisor/goals.toml
```

### Large File Size

**Problem**: TOML files getting too large

**Solution**:
1. Enable auto-cleanup in config
2. Reduce retention period
3. Archive old data:
```bash
# Move old analyses to archive
mv analyses.toml analyses-2024-10.toml
```

## Advanced: Custom Schema

You can extend TOML files with custom fields:

```toml
[[goal]]
title = "My Custom Goal"

# Standard fields
status = "active"

# Custom fields (your own data)
[goal.custom]
team = "backend"
sprint = 23
jira_ticket = "PROJ-123"
slack_channel = "#backend-auth"

# Custom metadata
[goal.custom.metrics]
complexity = "high"
estimated_hours = 40
actual_hours = 0
```

## Next Steps

- [Setup Your Guardian](SETUP_GUARDIAN.md)
- [View Code Examples](examples/guardian-usage.ts)
- [See Example TOML Files](examples/toml-examples/)

---

**TOML makes AI Supervisor data transparent, portable, and easy to work with!**
