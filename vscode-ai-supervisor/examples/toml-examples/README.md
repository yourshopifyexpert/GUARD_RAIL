# TOML Examples

This directory contains example TOML files showing how AI Supervisor stores data.

## Files

### `goals.toml`
Example project goals configuration with:
- Active goals with constraints and acceptance criteria
- Completed goals
- Paused goals
- Scope definitions (includes/excludes)
- Multiple constraint types (architecture, security, performance)

**Use this to learn:**
- How to structure project goals
- How to define constraints
- How to set acceptance criteria
- How scope definitions work

### `analyses.toml`
Example guardian analysis results including:
- Constraint violation analysis (database write in auth)
- Security vulnerability detection (SQL injection)
- Performance issue detection (N+1 query)
- Aligned analysis (code passed review)
- Cost tracking per analysis
- User actions and responses

**Use this to learn:**
- How guardian analyses are stored
- What information is captured
- How violations are documented
- How costs are tracked per analysis
- User interaction tracking

### `config.toml`
Example extension configuration showing:
- Guardian model setup (OpenAI, Anthropic, Ollama)
- Model pairings for cross-model verification
- Cost limits and alerts
- File-specific guardian assignments
- Monitoring settings
- Alert preferences
- Storage options
- UI preferences
- Integration settings

**Use this to learn:**
- How to configure guardian models
- How to set up model pairings
- How to configure cost limits
- How to customize monitoring behavior
- Available configuration options

### `costs.toml`
Example cost tracking with:
- Monthly cost summary
- Daily breakdown with individual requests
- Cost by provider comparison
- Cost optimization suggestions
- Budget alerts
- Savings from local models
- Detailed pricing information

**Use this to learn:**
- How costs are tracked
- How to analyze spending patterns
- How to compare provider costs
- How to identify cost savings
- Budget monitoring

## Using These Examples

### 1. Copy as Template

You can copy these files as a starting point for your project:

```bash
# Copy goals template
cp examples/toml-examples/goals.toml .vscode/ai-supervisor/goals.toml

# Edit for your project
code .vscode/ai-supervisor/goals.toml
```

### 2. Reference for Structure

Use these as reference when manually editing your TOML files:

```bash
# View example while editing yours
code examples/toml-examples/config.toml .vscode/ai-supervisor/config.toml
```

### 3. Learn TOML Format

These examples show TOML syntax and conventions:

- Basic key-value pairs: `key = "value"`
- Numbers: `cost = 1.23`
- Booleans: `enabled = true`
- Dates: `timestamp = 2024-11-21T15:30:45Z`
- Arrays: `items = ["a", "b", "c"]`
- Tables: `[section]`
- Array of tables: `[[items]]`
- Nested structures

### 4. Understand Data Model

See how different pieces of data relate:

```
goals.toml
  └─> Defines constraints
        └─> Referenced in analyses.toml
              └─> Shows which constraints were violated
                    └─> Tracked in costs.toml for expense

config.toml
  └─> Sets guardian models
        └─> Used in analyses.toml
              └─> Shows which model did the analysis
```

## Common Tasks

### View All Goals

```bash
cat .vscode/ai-supervisor/goals.toml
```

### Check Recent Analyses

```bash
# View last 50 lines of analyses
tail -50 .vscode/ai-supervisor/analyses.toml
```

### Check Current Costs

```bash
cat .vscode/ai-supervisor/costs.toml | grep "total_cost_usd"
```

### Change Guardian Model

Edit `config.toml`:

```toml
[guardian]
provider = "openai"
model = "gpt-4o"  # Change this to your preferred model
```

### Add New Goal

Edit `goals.toml`:

```toml
[[goal]]
id = "goal-005"
title = "Your New Goal"
description = "What you want to achieve"
status = "active"
priority = "high"

[[goal.constraints]]
type = "security"
rule = "your_constraint"
description = "What must not be violated"
severity = "error"

[goal.scope]
includes = ["src/**/*.ts"]
excludes = ["**/*.test.ts"]
```

## File Locations

In your actual project, these files will be at:

```
your-project/
└── .vscode/
    └── ai-supervisor/
        ├── goals.toml       # Your project goals
        ├── analyses.toml    # Analysis history
        ├── config.toml      # Extension settings
        ├── costs.toml       # Cost tracking
        ├── sessions.toml    # Coding sessions
        └── alerts.toml      # Alert history
```

## Tips

### 1. Start Simple

Don't try to configure everything at once. Start with:
1. One goal in `goals.toml`
2. Basic guardian setup in `config.toml`
3. Let other files auto-generate

### 2. Use Comments

TOML supports comments - use them liberally:

```toml
# This constraint prevents database writes in auth
# Added: 2024-11-21 by @john
# Reason: Performance and reliability
[[goal.constraints]]
type = "architecture"
rule = "no_database_writes_in_auth"
```

### 3. Version Control

Commit some files, ignore others:

```gitignore
# Commit these (team-shared)
.vscode/ai-supervisor/goals.toml
.vscode/ai-supervisor/config.toml

# Ignore these (personal)
.vscode/ai-supervisor/costs.toml
.vscode/ai-supervisor/sessions.toml
.vscode/ai-supervisor/alerts.toml
```

### 4. Validate Before Saving

Use a TOML validator to check syntax:
- Online: https://www.toml-lint.com/
- VS Code: Install "Even Better TOML" extension
- CLI: `toml-lint file.toml`

### 5. Backup Regularly

```bash
# Create dated backup
cp -r .vscode/ai-supervisor .vscode/ai-supervisor-backup-$(date +%Y%m%d)

# Or use git
git add .vscode/ai-supervisor/
git commit -m "Backup AI Supervisor config"
```

## Further Reading

- [TOML Specification](https://toml.io/)
- [TOML Storage Documentation](../../TOML_STORAGE.md)
- [Guardian Setup Guide](../../SETUP_GUARDIAN.md)
- [Multi-Model Guardian Concept](../../MULTI_MODEL_GUARDIAN.md)

## Questions?

- Check the [main documentation](../../README.md)
- Review [TOML_STORAGE.md](../../TOML_STORAGE.md) for detailed format specs
- Open an issue on GitHub
- Contact support@your-site.com
