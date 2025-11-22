# Setting Up Your Guardian

Complete guide to configuring guardian models for AI code supervision.

## Quick Start

1. **Open Command Palette**: `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. **Run**: `AI Supervisor: Configure Guardian`
3. **Choose Provider**: Select your preferred AI provider
4. **Enter API Key**: Paste your API key
5. **Test Connection**: Verify it works
6. **Start Coding**: Guardian is now active!

## Option 1: Cloud Models (Best Accuracy)

Cloud models provide the highest accuracy and most advanced analysis capabilities.

### OpenAI (GPT-4o)

**Best for**: Security analysis, performance optimization, API design

#### Step 1: Get API Key

1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to **API Keys**
4. Click **Create new secret key**
5. Copy the key (starts with `sk-...`)

#### Step 2: Configure in VS Code

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run: `AI Supervisor: Configure Guardian`
3. Select Provider: **OpenAI**
4. Select Model: **gpt-4o** (recommended) or **gpt-4o-mini** (faster, cheaper)
5. Paste your API key
6. Click **Test Connection**
7. ✅ Success message confirms setup

#### Step 3: Configure Cost Limits (Optional)

```json
{
  "aiSupervisor.guardian.provider": "openai",
  "aiSupervisor.guardian.model": "gpt-4o",
  "aiSupervisor.guardian.costLimit": {
    "daily": 5.00,
    "monthly": 50.00
  }
}
```

#### Pricing

- **GPT-4o**: $2.50 per 1M input tokens, $10 per 1M output tokens
- **GPT-4o-mini**: $0.15 per 1M input tokens, $0.60 per 1M output tokens
- **Typical cost**: ~$0.01-0.05 per analysis

### Anthropic (Claude 3.5)

**Best for**: Logic verification, safety analysis, edge case detection

#### Step 1: Get API Key

1. Go to [https://console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to **API Keys**
4. Click **Create Key**
5. Copy the key (starts with `sk-ant-...`)

#### Step 2: Configure in VS Code

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run: `AI Supervisor: Configure Guardian`
3. Select Provider: **Anthropic**
4. Select Model: **claude-3-5-sonnet-20241022** (recommended)
5. Paste your API key
6. Click **Test Connection**
7. ✅ Success message confirms setup

#### Step 3: Set Analysis Depth

```json
{
  "aiSupervisor.guardian.provider": "anthropic",
  "aiSupervisor.guardian.model": "claude-3-5-sonnet-20241022",
  "aiSupervisor.guardian.analysisDepth": "thorough"
}
```

**Analysis Depth Options:**
- `quick` - Fast, high-level review
- `standard` - Balanced speed and thoroughness
- `thorough` - Deep analysis with detailed reasoning

#### Pricing

- **Claude 3.5 Sonnet**: $3 per 1M input tokens, $15 per 1M output tokens
- **Typical cost**: ~$0.02-0.08 per analysis

### Google Gemini Pro

**Best for**: API review, infrastructure code, scalability analysis

#### Step 1: Get API Key

1. Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click **Create API Key**
4. Copy the key

#### Step 2: Configure in VS Code

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run: `AI Supervisor: Configure Guardian`
3. Select Provider: **Google**
4. Select Model: **gemini-pro**
5. Paste your API key
6. Click **Test Connection**
7. ✅ Success message confirms setup

#### Pricing

- **Gemini Pro**: Free tier available (60 requests/minute)
- **Gemini Pro 1.5**: $0.35 per 1M input tokens, $1.05 per 1M output tokens

### DeepSeek

**Best for**: Code patterns, refactoring, architecture review

#### Step 1: Get API Key

1. Go to [https://platform.deepseek.com](https://platform.deepseek.com)
2. Sign up or log in
3. Navigate to **API Keys**
4. Create new key
5. Copy the key

#### Step 2: Configure in VS Code

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run: `AI Supervisor: Configure Guardian`
3. Select Provider: **DeepSeek**
4. Select Model: **deepseek-coder**
5. Paste your API key
6. Click **Test Connection**
7. ✅ Success message confirms setup

#### Pricing

- **DeepSeek Coder**: Very competitive pricing
- **Typical cost**: ~$0.005-0.02 per analysis

## Option 2: Local Models (Free, Private)

Local models run on your machine - 100% private, no API costs.

### Prerequisites

**Hardware Requirements:**
- **Recommended**: 16GB+ RAM, GPU with 8GB+ VRAM
- **Minimum**: 8GB RAM, CPU only (slower)
- **Storage**: 5-50GB depending on model

### Install Ollama

#### On macOS/Linux

```bash
curl https://ollama.ai/install.sh | sh
```

#### On Windows

1. Download from [https://ollama.ai/download](https://ollama.ai/download)
2. Run installer
3. Follow setup wizard

#### Verify Installation

```bash
ollama --version
# Should show: ollama version 0.x.x
```

### Choose and Download a Model

#### Llama 3.1 70B (General Purpose)

**Best for**: Balanced performance, general code review

```bash
# Download model (45GB)
ollama pull llama3.1:70b

# Test it
ollama run llama3.1:70b "What is 2+2?"
```

**Configure in VS Code:**

```json
{
  "aiSupervisor.guardian.provider": "ollama",
  "aiSupervisor.guardian.model": "llama3.1:70b",
  "aiSupervisor.guardian.endpoint": "http://localhost:11434"
}
```

#### DeepSeek Coder 33B (Code Specialist)

**Best for**: Code-specific analysis, pattern detection

```bash
# Download model (19GB)
ollama pull deepseek-coder:33b

# Test it
ollama run deepseek-coder:33b "Review this code: function add(a,b) { return a+b; }"
```

**Configure in VS Code:**

```json
{
  "aiSupervisor.guardian.provider": "ollama",
  "aiSupervisor.guardian.model": "deepseek-coder:33b",
  "aiSupervisor.guardian.endpoint": "http://localhost:11434"
}
```

#### Phi-3 Medium (Lightweight)

**Best for**: Fast review, limited hardware

```bash
# Download model (7.9GB)
ollama pull phi3:medium

# Test it
ollama run phi3:medium "Hello!"
```

**Configure in VS Code:**

```json
{
  "aiSupervisor.guardian.provider": "ollama",
  "aiSupervisor.guardian.model": "phi3:medium",
  "aiSupervisor.guardian.endpoint": "http://localhost:11434"
}
```

#### CodeLlama 34B (Meta Code Model)

**Best for**: Code understanding, suggestions

```bash
# Download model (19GB)
ollama pull codellama:34b

# Test it
ollama run codellama:34b "Explain async/await"
```

**Configure in VS Code:**

```json
{
  "aiSupervisor.guardian.provider": "ollama",
  "aiSupervisor.guardian.model": "codellama:34b",
  "aiSupervisor.guardian.endpoint": "http://localhost:11434"
}
```

### Configure Ollama in Extension

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run: `AI Supervisor: Configure Guardian`
3. Select Provider: **Ollama (Local)**
4. Select Model: Choose from downloaded models
5. Endpoint: `http://localhost:11434` (default)
6. Click **Test Connection**
7. ✅ Success message confirms setup

### Performance Tuning

#### GPU Acceleration (Recommended)

```bash
# Check if Ollama is using GPU
ollama ps

# Should show GPU usage if available
```

#### Adjust Context Window

```json
{
  "aiSupervisor.guardian.ollama": {
    "numCtx": 4096,  // Context window size
    "numGpu": 1,     // Number of GPU layers
    "numThread": 8   // CPU threads (if no GPU)
  }
}
```

#### Memory Management

```json
{
  "aiSupervisor.guardian.ollama": {
    "keepAlive": "5m",    // Keep model in memory for 5 minutes
    "maxMemory": "8GB"    // Maximum memory usage
  }
}
```

## Advanced Configuration

### Auto-Select Guardian Based on Coding Model

```json
{
  "aiSupervisor.guardian.autoSelect": true,
  "aiSupervisor.guardian.pairings": {
    "claude-3-5-sonnet": "gpt-4o",
    "gpt-4": "claude-3-5-sonnet",
    "github-copilot": "claude-3-5-sonnet",
    "cursor": "gemini-pro",
    "continue": "deepseek-coder"
  }
}
```

### Multiple Guardians (Premium)

```json
{
  "aiSupervisor.guardian.strategy": "multi",
  "aiSupervisor.guardian.models": [
    {
      "provider": "openai",
      "model": "gpt-4o",
      "focus": "security"
    },
    {
      "provider": "anthropic",
      "model": "claude-3-5-sonnet",
      "focus": "logic"
    }
  ]
}
```

### File-Specific Guardians

```json
{
  "aiSupervisor.guardian.filePatterns": {
    "**/*.auth.ts": {
      "provider": "openai",
      "model": "gpt-4o"
    },
    "**/*.api.ts": {
      "provider": "google",
      "model": "gemini-pro"
    },
    "**/*.db.ts": {
      "provider": "anthropic",
      "model": "claude-3-5-sonnet"
    }
  }
}
```

## Testing Your Setup

### Run Test Analysis

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run: `AI Supervisor: Test Guardian`
3. Review test results

### Manual Test

Create a test file:

```typescript
// test-guardian.ts
async function login(user: string, pass: string) {
    // Intentional security issue for testing
    const query = `SELECT * FROM users WHERE name='${user}' AND pass='${pass}'`;
    return db.execute(query);
}
```

Your guardian should flag:
- SQL injection vulnerability
- Plaintext password comparison
- Direct database query in auth handler

## Troubleshooting

### Connection Failed

**Cloud Models:**
1. Verify API key is correct
2. Check internet connection
3. Confirm API key has credits/quota
4. Check provider status page

**Ollama:**
1. Ensure Ollama is running: `ollama ps`
2. Verify endpoint: `curl http://localhost:11434/api/version`
3. Check model is downloaded: `ollama list`
4. Restart Ollama: `ollama serve`

### Slow Analysis

**Cloud Models:**
- Use mini/faster models (gpt-4o-mini)
- Reduce analysis depth in settings
- Enable caching for repeated analyses

**Ollama:**
- Enable GPU acceleration
- Use smaller models (phi3:medium)
- Increase numGpu in settings
- Close other applications

### High Costs

1. Set daily/monthly cost limits in settings
2. Use local models for development
3. Enable analysis only for important files
4. Use mini/cheaper models
5. Review cost tracking: `AI Supervisor: View Usage`

### Model Not Found

**Ollama:**
```bash
# List available models
ollama list

# Download if missing
ollama pull model-name
```

### Inaccurate Analysis

1. Try different guardian model
2. Increase analysis depth
3. Provide more context in goals
4. Use cloud models instead of local
5. Upgrade to larger model variant

## Best Practices

### 1. Match Guardian to Task

- **Security code** → GPT-4o
- **Logic-heavy** → Claude 3.5
- **API design** → Gemini Pro
- **Refactoring** → DeepSeek Coder

### 2. Start with Cloud, Move to Local

1. Use cloud models during development
2. Test and validate with high accuracy
3. Switch to local models for production
4. Keep cloud as backup for critical code

### 3. Monitor Costs

```bash
# View usage statistics
AI Supervisor: View Usage Report

# Set alerts
{
  "aiSupervisor.guardian.alerts": {
    "dailyCostThreshold": 2.00,
    "monthlyCostThreshold": 20.00
  }
}
```

### 4. Regular Updates

- Update Ollama: `ollama upgrade`
- Update models: `ollama pull model-name`
- Check extension updates in VS Code
- Review new guardian models quarterly

## Next Steps

- ✅ Guardian configured successfully!
- [Learn about TOML Storage](TOML_STORAGE.md)
- [View Usage Examples](examples/guardian-usage.ts)
- [Understand Multi-Model Concept](MULTI_MODEL_GUARDIAN.md)

## Support

Having issues? Get help:

- **Documentation**: Check [troubleshooting](#troubleshooting) section
- **GitHub Issues**: Report bugs or request features
- **Premium Support**: Email support@your-site.com
- **Community**: Join our Discord server

---

**Your guardian is ready to protect your code!**
