# Multi-Model AI Guardian System

## Overview

The AI Guardian System provides **independent AI oversight** by using a **different AI model** to review code changes made by your coding AI. This ensures unbiased analysis and catches deviations from your project goals.

## Key Principle

**NEVER use the same model for coding and guarding!**

When Claude writes code, GPT-4 reviews it.
When GPT-4 writes code, Claude reviews it.
When Copilot writes code, Gemini reviews it.

This creates true independent oversight.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  AI Supervisor Extension                                │
│                                                          │
│  ┌────────────────┐         ┌──────────────────┐       │
│  │  Coding AI     │────────▶│  File Changes    │       │
│  │  (Claude/GPT)  │         │                  │       │
│  └────────────────┘         └──────────────────┘       │
│                                      │                  │
│                                      ▼                  │
│                             ┌──────────────────┐       │
│                             │ GuardianAnalyzer │       │
│                             │                  │       │
│                             │  Uses DIFFERENT  │       │
│                             │  AI Model        │       │
│                             └──────────────────┘       │
│                                      │                  │
│                     ┌────────────────┼────────────────┐│
│                     ▼                ▼                ▼│
│             ┌──────────┐     ┌──────────┐    ┌────────┤
│             │ OpenAI   │     │Anthropic │    │ Google ││
│             │ GPT-4o   │     │ Claude   │    │ Gemini ││
│             └──────────┘     └──────────┘    └────────┤
│                     │                │                ││
│                     └────────────────┴────────────────┘│
│                                      │                  │
│                                      ▼                  │
│                             ┌──────────────────┐       │
│                             │  TOML Storage    │       │
│                             │  (Human-readable)│       │
│                             └──────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

## Components

### 1. AIProvider.ts
Base interface and abstract class for all AI providers. Defines:
- `AIModel` enum (all supported models)
- `AIProviderConfig` (configuration interface)
- `GuardianAnalysisPrompt` (input format)
- `GuardianAnalysisResult` (output format)

### 2. Providers

#### OpenAIProvider.ts
- Supports: GPT-4, GPT-4 Turbo, GPT-4o
- Uses OpenAI Chat Completions API
- Best for: High-quality analysis, fast response

#### AnthropicProvider.ts
- Supports: Claude 3.5 Sonnet, Opus, Haiku
- Uses Anthropic Messages API
- Best for: Deep reasoning, nuanced analysis

#### GoogleProvider.ts
- Supports: Gemini Pro, Gemini Flash
- Uses Google Generative AI API
- Best for: Fast analysis, cost-effective

#### OllamaProvider.ts
- Supports: Llama 3.1, DeepSeek Coder, Phi-3, CodeLlama
- Runs locally via Ollama
- Best for: Privacy, no API costs, offline use

### 3. ModelSelector.ts
Intelligently pairs coding models with guardian models:

```typescript
const pairing = modelSelector.selectGuardianModel('claude-3-5-sonnet');
// Returns: { guardianModel: 'gpt-4o', guardianProvider: 'openai' }
```

**Default Pairings:**
- Claude codes → GPT-4o guards
- GPT-4 codes → Claude 3.5 guards
- Copilot codes → Gemini Pro guards
- Cursor codes → DeepSeek Coder guards (local)
- Continue codes → Llama 3.1 guards (local)

### 4. GuardianAnalyzer.ts
Core analysis engine that:
1. Detects which AI model is being used for coding
2. Selects appropriate guardian model (always different)
3. Analyzes code changes against project goals
4. Detects deviations, scope violations, and suspicious patterns
5. Caches results to avoid duplicate API calls

### 5. TOMLStorage.ts
Stores all data in human-readable TOML format:
- `goals.toml` - Project goals and constraints
- `analyses.toml` - Guardian analysis results
- `changes.toml` - Code change history

## Configuration

### VS Code Settings

```json
{
  // OpenAI (GPT-4)
  "aiSupervisor.guardian.openai.apiKey": "sk-...",
  "aiSupervisor.guardian.openai.model": "gpt-4o",

  // Anthropic (Claude)
  "aiSupervisor.guardian.anthropic.apiKey": "sk-ant-...",
  "aiSupervisor.guardian.anthropic.model": "claude-3-5-sonnet-20241022",

  // Google (Gemini)
  "aiSupervisor.guardian.google.apiKey": "AIza...",
  "aiSupervisor.guardian.google.model": "gemini-1.5-pro-latest",

  // Ollama (Local)
  "aiSupervisor.guardian.ollama.enabled": true,
  "aiSupervisor.guardian.ollama.endpoint": "http://localhost:11434",
  "aiSupervisor.guardian.ollama.model": "llama3.1:70b",

  // Storage
  "aiSupervisor.storage.format": "toml",

  // Cache
  "aiSupervisor.guardian.cacheEnabled": true,
  "aiSupervisor.guardian.cacheMaxAge": 3600
}
```

## Usage

### Basic Usage

```typescript
import { GuardianAnalyzer } from './ai/GuardianAnalyzer';

const analyzer = GuardianAnalyzer.getInstance();

const result = await analyzer.analyzeCodeChange({
  change: codeChange,
  goal: projectGoal,
  detectedCodingModel: 'claude-3-5-sonnet'
});

if (!result.aligned) {
  console.log('⚠️ DEVIATION DETECTED!');
  console.log(`Risk: ${result.riskLevel}`);
  console.log(`Deviations: ${result.deviations.length}`);
}
```

### Creating Goals

```typescript
const goal: Goal = {
  id: 'goal-123',
  title: 'Build REST API',
  description: 'Create user authentication endpoints',
  status: 'active',
  scope: [
    'src/api/**',
    'src/auth/**'
  ],
  constraints: [
    'No hardcoded secrets',
    'All endpoints must have authentication',
    'Use prepared statements for SQL'
  ]
};
```

### Analysis Result

```typescript
interface GuardianAnalysisResult {
  aligned: boolean;           // true if change aligns with goal
  confidence: number;         // 0.0 to 1.0
  reasoning: string;          // Detailed explanation
  riskLevel: 'low' | 'medium' | 'high';
  deviations: Array<{
    type: 'scope_violation' | 'constraint_violation' | 'goal_misalignment' | 'reversal' | 'suspicious_pattern';
    severity: 'low' | 'medium' | 'high';
    description: string;
    suggestion?: string;
  }>;
  metadata: {
    guardianModel: string;
    analysisTime: number;
    timestamp: number;
  };
}
```

## Deviation Detection

The guardian analyzes code changes for:

### 1. Scope Violations
Files outside allowed patterns:
```
Goal scope: ['src/api/**', 'src/auth/**']
Change: 'src/database/users.ts'
Result: ⚠️ SCOPE VIOLATION
```

### 2. Constraint Violations
Breaking defined rules:
```
Constraint: "No hardcoded secrets"
Change: api_key = "sk-1234567890"
Result: ⚠️ CONSTRAINT VIOLATION
```

### 3. Goal Misalignment
Work not advancing the goal:
```
Goal: "Build REST API"
Change: Deleting API endpoints
Result: ⚠️ GOAL MISALIGNMENT
```

### 4. Reversals
Undoing previous work:
```
Previous: Added user authentication
Current: Removed authentication middleware
Result: ⚠️ REVERSAL DETECTED
```

### 5. Suspicious Patterns
Security concerns:
- Hardcoded secrets/API keys
- Deleting tests
- Disabling security features
- Unexpected external connections

## TOML Storage Format

### goals.toml
```toml
[[goals]]
id = "goal-123"
title = "Build REST API"
description = "Create user authentication endpoints"
status = "active"
created = 2024-11-21T10:00:00Z
updated = 2024-11-21T10:00:00Z

[goals.scope]
allowed_paths = [
  "src/api/**",
  "src/auth/**"
]

[[goals.constraints]]
constraint = "No hardcoded secrets"

[[goals.constraints]]
constraint = "All endpoints must have authentication"
```

### analyses.toml
```toml
[[analyses]]
id = "analysis-456"
goal_id = "goal-123"
change_id = "change-789"
file = "src/api/users.ts"
coding_model = "claude-3-5-sonnet"
guardian_model = "gpt-4o"
timestamp = "2024-11-21T10:05:00Z"
aligned = false
confidence = 0.92
risk_level = "high"
reasoning = "Code adds database writes which violates constraint 'no_database_write'"

[[analyses.deviations]]
type = "constraint_violation"
severity = "high"
description = "Direct database write detected in API endpoint"
suggestion = "Use repository pattern for database access"
```

## Privacy & Cost

### Using Local Models (Ollama)

For maximum privacy and zero API costs:

1. **Install Ollama**: https://ollama.ai
2. **Pull a model**:
   ```bash
   ollama pull llama3.1:70b
   # or
   ollama pull deepseek-coder:33b
   ```
3. **Enable in settings**:
   ```json
   {
     "aiSupervisor.guardian.ollama.enabled": true,
     "aiSupervisor.guardian.ollama.model": "llama3.1:70b"
   }
   ```

**Benefits:**
- ✅ Complete privacy (data never leaves your machine)
- ✅ No API costs
- ✅ Works offline
- ✅ Fast for small to medium codebases

**Trade-offs:**
- Requires 8-16GB RAM for 70B models
- Slightly lower accuracy than GPT-4/Claude
- Slower analysis time

### Cost Estimation

**Per analysis (approximate):**
- GPT-4o: $0.01 - $0.03
- Claude 3.5 Sonnet: $0.015 - $0.045
- Gemini Pro: $0.0005 - $0.0015
- Ollama (local): $0.00

**Monthly cost (100 analyses/day):**
- GPT-4o: ~$30-90/month
- Claude 3.5: ~$45-135/month
- Gemini Pro: ~$1.50-4.50/month
- Ollama: ~$0/month

## Best Practices

1. **Start with one provider**: Configure OpenAI or Anthropic first
2. **Test connection**: Run `aiSupervisor.testGuardianConnection`
3. **Define clear goals**: Specific goals = better analysis
4. **Use scope patterns**: Limit where AI can make changes
5. **Set constraints**: Define what AI cannot do
6. **Enable caching**: Avoid duplicate API calls
7. **Review deviations**: Guardian alerts need human verification

## Troubleshooting

### "Guardian provider not configured"
- Add API key in VS Code settings
- Check API key is valid
- Test connection: `aiSupervisor.testGuardianConnection`

### "Analysis parsing failed"
- Model might be overloaded
- Try different model
- Check API quotas

### "Ollama connection failed"
- Ensure Ollama is running: `ollama serve`
- Check endpoint: `http://localhost:11434`
- Verify model is pulled: `ollama list`

### High API costs
- Enable caching: `aiSupervisor.guardian.cacheEnabled`
- Reduce analysis frequency
- Switch to cheaper model (Gemini)
- Use Ollama for local analysis

## Example Output

```
🛡️ GUARDIAN ANALYSIS COMPLETE
File: src/api/users.ts
Status: ⚠️ DEVIATION
Risk: HIGH
Confidence: 92%
Guardian: gpt-4o
Deviations: 2

Deviations:
  1. [HIGH] scope_violation: File src/api/users.ts is outside allowed scope: src/auth/**, tests/**
  2. [HIGH] constraint_violation: Hardcoded API key detected on line 42

Reasoning: The code change adds a new user API endpoint, which is outside the defined scope for this goal...
```

## Integration Points

The guardian system integrates with:
- **FileWatcher**: Analyzes changes on file save
- **ChangeStorageService**: Tracks all code changes
- **GoalManager**: Loads active project goals
- **AlertManager**: Shows deviation alerts
- **ChangeInspector**: Displays analysis results

## License

MIT - Part of AI Supervisor extension
