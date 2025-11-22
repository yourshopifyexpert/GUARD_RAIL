# Multi-Model Guardian System Integration

## Overview

The AI Supervisor extension now includes a **multi-model guardian system** that uses a different AI model to review code changes made by your coding AI assistant. This provides an independent, unbiased analysis of code changes against your project goals.

## Architecture

### Core Components

1. **GuardianAnalyzer** (`src/guardian/GuardianAnalyzer.ts`)
   - Analyzes code changes using AI models
   - Ensures guardian model is different from coding model
   - Supports multiple AI providers (OpenAI, Anthropic, Google, Ollama)
   - Returns analysis with alignment status, reasoning, and suggestions

2. **ModelDetector** (`src/guardian/ModelDetector.ts`)
   - Detects which AI model the user is coding with
   - Checks installed extensions (Copilot, Continue, Cody, etc.)
   - Provides confidence scores for detection

3. **GuardianSettings** (`src/guardian/GuardianSettings.ts`)
   - Manages AI provider configuration
   - Handles API keys securely
   - Provides interactive settings UI
   - Tests connections to AI providers

4. **CostTracker** (`src/guardian/CostTracker.ts`)
   - Tracks AI API usage and costs
   - Monitors monthly budget
   - Warns when approaching limits
   - Supports free local models (Ollama)

5. **TomlStorage** (`src/guardian/TomlStorage.ts`)
   - Stores analyses in TOML format
   - Organized by date in `.ai-supervisor/analyses/`
   - Human-readable and version-controllable
   - Easy to review and share

6. **GuardianIntegration** (`src/guardian/GuardianIntegration.ts`)
   - Main integration point
   - Connects all guardian components
   - Handles file change events
   - Shows smart alerts

## User Workflow

### Setup

1. **Install Extension**
   - Install AI Supervisor from VS Code marketplace
   - Extension activates automatically

2. **Configure Guardian Model**
   - Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
   - Run: `AI Supervisor: Configure Guardian Model`
   - Select AI provider (OpenAI, Anthropic, Google, or Ollama)
   - Choose model (different from your coding model)
   - Enter API key (stored securely)

3. **Set Project Goals**
   - Run: `AI Supervisor: Manage Goals`
   - Add your project goals and constraints
   - Goals guide the guardian analysis

### Daily Use

1. **Code with AI Assistant**
   - Use your favorite AI coding tool (Copilot, Continue, Cody, etc.)
   - Make code changes as usual

2. **Automatic Analysis**
   - AI Supervisor detects your coding model automatically
   - Guardian uses a DIFFERENT model to analyze changes
   - Analysis happens in real-time (background)

3. **Review Alerts**
   - If code deviates from goals, you get a smart alert
   - Alert shows:
     - Which models were involved (coding vs guardian)
     - Reasoning from guardian model
     - Severity level
     - Suggestions for improvement

4. **View Analysis History**
   - Run: `AI Supervisor: View AI Analysis History`
   - See all past analyses
   - Filter by date, model, or alignment status

5. **Monitor Costs**
   - Run: `AI Supervisor: Check API Costs`
   - View monthly spend
   - See token usage by model
   - Get budget warnings

### Advanced Features

#### Test Guardian Connection
```
Command: AI Supervisor: Test Guardian Connection
```
Tests connection to your configured AI provider.

#### View Model Detection
```
Command: AI Supervisor: View Model Detection
```
Shows which coding model was detected and which guardian model is configured.

#### Offline Mode (Ollama)
- Use local models with Ollama (free)
- No internet required
- Complete privacy
- Configure endpoint: `http://localhost:11434`

## File Structure

```
.ai-supervisor/
├── analyses/
│   ├── 2025-11-22.toml  # Daily analysis logs
│   ├── 2025-11-23.toml
│   └── ...
└── README.md
```

### Sample TOML Analysis

```toml
[[analysis]]
timestamp = "2025-11-22T10:30:00.000Z"
file_path = "src/app.ts"
coding_model = "gpt-4-copilot"
guardian_model = "claude-3-5-sonnet-20241022"
aligned = false
severity = "warning"
confidence = 0.85
reasoning = """The code adds a new API endpoint but doesn't follow the REST
conventions specified in the project goals. Consider using /api/users/:id
instead of /getUser."""
suggestions = [
    "Update endpoint to follow REST conventions",
    "Add input validation",
    "Include error handling"
]
goal_id = "goal-123"
```

## Configuration Settings

### Provider Settings
```json
{
  "aiSupervisor.guardian.provider": "openai",
  "aiSupervisor.guardian.model": "gpt-4o",
  "aiSupervisor.guardian.enableAnalysis": true,
  "aiSupervisor.guardian.autoAnalyze": true,
  "aiSupervisor.guardian.costBudgetMonthly": 10
}
```

### API Keys (Secure Storage)
```json
{
  "aiSupervisor.guardian.openaiApiKey": "sk-...",
  "aiSupervisor.guardian.anthropicApiKey": "sk-ant-...",
  "aiSupervisor.guardian.googleApiKey": "...",
  "aiSupervisor.guardian.ollamaEndpoint": "http://localhost:11434"
}
```

## Supported Models

### OpenAI
- GPT-4o ($10/M tokens) - Recommended
- GPT-4o Mini ($0.15/M tokens) - Budget
- GPT-4 Turbo ($10/M tokens)

### Anthropic
- Claude 3.5 Sonnet ($15/M tokens) - Recommended
- Claude 3.5 Haiku ($1/M tokens) - Budget
- Claude 3 Opus ($75/M tokens) - Premium

### Google
- Gemini 1.5 Pro ($7/M tokens) - Recommended
- Gemini 1.5 Flash ($0.35/M tokens) - Budget

### Ollama (Local - Free)
- Llama 3.2 (Free)
- Mistral (Free)
- Code Llama (Free)

## Cost Estimation

Typical analysis:
- ~500-1000 tokens per analysis
- At $10/M tokens = $0.01 per analysis
- Monthly budget of $10 = ~1000 analyses/month
- ~33 analyses per day

With budget model (GPT-4o Mini):
- $0.15/M tokens = $0.00015 per analysis
- Monthly budget of $10 = ~66,000 analyses/month
- Effectively unlimited for most use cases

## Activity Monitor Integration

The Activity Monitor now shows:

```
File: src/app.ts
Type: modify
AI Tool: GitHub Copilot (GPT-4)
Guardian: Claude 3.5 Sonnet
Status: ⚠️ Deviation Detected
Description: Code doesn't follow REST conventions
Confidence: 85%
```

## Smart Alerts

When guardian detects deviation:

```
┌─────────────────────────────────────────────┐
│ ⚠️ Claude 3.5 Sonnet detected deviation     │
├─────────────────────────────────────────────┤
│ The code adds a new API endpoint but       │
│ doesn't follow the REST conventions        │
│ specified in the project goals.            │
│                                             │
│ Coding Model: GPT-4 (Copilot)              │
│ Guardian Model: Claude 3.5 Sonnet          │
│ Confidence: 85%                             │
├─────────────────────────────────────────────┤
│ [Update Goals] [Allow Once] [View Details] │
└─────────────────────────────────────────────┘
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `aiSupervisor.configureGuardianModel` | Configure AI provider and model |
| `aiSupervisor.viewAnalysisHistory` | View all past analyses |
| `aiSupervisor.checkApiCosts` | Check API usage and costs |
| `aiSupervisor.testGuardianConnection` | Test connection to AI provider |
| `aiSupervisor.viewModelDetection` | View detected coding and guardian models |

## Best Practices

1. **Use Different Models**
   - Coding: GPT-4 (Copilot) → Guardian: Claude 3.5 Sonnet
   - Coding: Claude (Cody) → Guardian: GPT-4o
   - Different perspectives = better analysis

2. **Set Clear Goals**
   - Define specific, measurable goals
   - Include constraints and conventions
   - Update goals as project evolves

3. **Monitor Costs**
   - Set realistic monthly budget
   - Use budget models for high-volume projects
   - Consider Ollama for free local analysis

4. **Review Analyses**
   - Check analysis history regularly
   - Look for patterns in deviations
   - Refine goals based on feedback

5. **Offline Mode**
   - Use Ollama for privacy-sensitive projects
   - No internet = no data leakage
   - Free = unlimited analyses

## Troubleshooting

### "Analysis failed - offline mode"
- Guardian analysis requires API key or Ollama
- Configure provider: `AI Supervisor: Configure Guardian Model`
- Test connection: `AI Supervisor: Test Guardian Connection`

### "No model detected yet"
- Make some code changes with your AI assistant
- Guardian needs to detect which model you're using
- Manual override: `AI Supervisor: View Model Detection`

### "Budget exceeded"
- Check costs: `AI Supervisor: Check API Costs`
- Increase budget in settings or switch to budget model
- Consider Ollama for free local analysis

### "Same model warning"
- Guardian detected you're using the same model for coding and reviewing
- Change guardian model to get independent analysis
- Configure: `AI Supervisor: Configure Guardian Model`

## Privacy & Security

- **API Keys**: Stored securely in VS Code's secret storage
- **Local Mode**: Use Ollama for complete privacy
- **Data Storage**: Analyses stored locally in `.ai-supervisor/`
- **No Telemetry**: Extension doesn't send data anywhere except configured AI providers
- **Version Control**: Add `.ai-supervisor/` to `.gitignore` if desired

## Future Enhancements

- [ ] Support for more AI providers (Azure, AWS, etc.)
- [ ] Custom analysis prompts
- [ ] Team-shared guardian configurations
- [ ] Analysis quality ratings
- [ ] Auto-remediation suggestions
- [ ] Integration with CI/CD pipelines

## Support

For issues, questions, or feedback:
- GitHub Issues: [your-org/ai-supervisor/issues](https://github.com/your-org/ai-supervisor/issues)
- Documentation: [your-org/ai-supervisor#readme](https://github.com/your-org/ai-supervisor#readme)

---

**Generated by AI Supervisor v0.1.0**
