# Guardian Model Pairings

## Default Intelligent Pairings

The ModelSelector ensures that **different AI models** are used for coding and guarding to provide truly independent oversight.

```
┌─────────────────────────────────────────────────────────────────┐
│  CODING MODEL              →  GUARDIAN MODEL                    │
├─────────────────────────────────────────────────────────────────┤
│  Claude 3.5 Sonnet         →  GPT-4o (OpenAI)                  │
│  Claude 3 Opus             →  GPT-4o (OpenAI)                  │
│  Claude 3 Haiku            →  GPT-4o (OpenAI)                  │
├─────────────────────────────────────────────────────────────────┤
│  GPT-4                     →  Claude 3.5 Sonnet (Anthropic)    │
│  GPT-4 Turbo               →  Claude 3.5 Sonnet (Anthropic)    │
│  GPT-4o                    →  Claude 3.5 Sonnet (Anthropic)    │
├─────────────────────────────────────────────────────────────────┤
│  GitHub Copilot            →  Gemini Pro (Google)              │
├─────────────────────────────────────────────────────────────────┤
│  Cursor                    →  DeepSeek Coder 33B (Ollama)      │
├─────────────────────────────────────────────────────────────────┤
│  Continue                  →  Llama 3.1 70B (Ollama)           │
├─────────────────────────────────────────────────────────────────┤
│  Cody (Sourcegraph)        →  GPT-4o (OpenAI)                  │
├─────────────────────────────────────────────────────────────────┤
│  Unknown/Other             →  GPT-4o (OpenAI) [Default]        │
└─────────────────────────────────────────────────────────────────┘
```

## Pairing Philosophy

### 1. Cross-Provider Diversity
- **OpenAI models** → Reviewed by **Anthropic** or **Google**
- **Anthropic models** → Reviewed by **OpenAI** or **Google**
- **OSS models** → Reviewed by **proprietary models** (or vice versa)

### 2. Capability Matching
- High-capability coding models → High-capability guardians
- Fast models → Fast guardians
- Local models → Local guardians (privacy)

### 3. Cost Optimization
- Expensive coding models → Cheaper guardians (Gemini)
- Cheap coding models → Premium guardians (balanced cost)

## Detailed Pairings

### Claude Codes → GPT-4o Guards

**Why this pairing:**
- Claude excels at complex reasoning and code generation
- GPT-4o provides fast, reliable review with different training data
- Cross-company bias elimination
- Both are top-tier models with complementary strengths

**Use case:**
- Professional development
- Complex system design
- Critical production code

**Cost:** Medium-High (~$0.04/analysis)

---

### GPT-4 Codes → Claude 3.5 Guards

**Why this pairing:**
- GPT-4 is widely used in tools like Copilot
- Claude 3.5 brings constitutional AI and ethical reasoning
- Different optimization strategies (OpenAI vs Anthropic)
- Claude's longer context window helps with comprehensive review

**Use case:**
- Enterprise development
- Team collaboration
- Security-critical applications

**Cost:** Medium-High (~$0.05/analysis)

---

### Copilot Codes → Gemini Pro Guards

**Why this pairing:**
- Copilot (GPT-based) gets independent Google review
- Gemini Pro is cost-effective but capable
- Good balance of quality and cost
- Fast analysis suitable for frequent changes

**Use case:**
- Daily development
- Rapid prototyping
- Budget-conscious teams

**Cost:** Low (~$0.002/analysis)

---

### Cursor Codes → DeepSeek Coder Guards

**Why this pairing:**
- Both are code-specialized
- DeepSeek runs locally (privacy + free)
- Cursor users often prefer privacy
- No external API dependencies

**Use case:**
- Privacy-sensitive projects
- Proprietary code
- Offline development
- Zero API budget

**Cost:** Free (local)

---

### Continue Codes → Llama 3.1 Guards

**Why this pairing:**
- Continue supports local models
- Llama 3.1 70B is highly capable
- Fully open-source stack
- Complete control over both sides

**Use case:**
- Open-source projects
- Self-hosted environments
- Air-gapped development
- Maximum transparency

**Cost:** Free (local)

## Custom Pairings

You can define custom pairings in VS Code settings:

```json
{
  "aiSupervisor.guardian.customPairings": {
    "my-custom-ai": {
      "codingModel": "my-custom-ai",
      "guardianModel": "gpt-4o",
      "guardianProvider": "openai",
      "reason": "Custom AI tool uses proprietary model, reviewed by GPT-4o"
    }
  }
}
```

## Model Detection

The system automatically detects which AI is being used for coding by:

1. **Extension detection**: Checks which AI extensions are active
   - `github.copilot`
   - `continue.continue`
   - `sourcegraph.cody`

2. **Metadata analysis**: Reads AI tool information from change metadata

3. **Heuristic patterns**: Analyzes code patterns and comments

4. **Manual override**: User can specify coding model in settings

## Guardian Model Selection Algorithm

```typescript
function selectGuardianModel(codingModel: string): ModelPairing {
  // 1. Normalize coding model name
  const normalized = normalizeCodingModel(codingModel);
  
  // 2. Check custom pairings first
  if (customPairings[normalized]) {
    return customPairings[normalized];
  }
  
  // 3. Use default pairing
  if (defaultPairings[normalized]) {
    return defaultPairings[normalized];
  }
  
  // 4. Fallback to GPT-4o
  return {
    codingModel: normalized,
    guardianModel: 'gpt-4o',
    guardianProvider: 'openai',
    reason: 'Unknown coding model → GPT-4o default guardian'
  };
}
```

## Ensuring Independence

The system **guarantees** that coding and guardian models are different:

### Validation Rules

1. **Never same model family**
   - If coding with GPT-4 → Guardian cannot be GPT-4*
   - If coding with Claude → Guardian cannot be Claude*

2. **Never same provider** (when possible)
   - If coding with OpenAI → Guardian uses Anthropic/Google
   - If coding with Anthropic → Guardian uses OpenAI/Google

3. **Different training approaches**
   - RLHF-trained model → Constitutional AI model
   - Instruction-tuned → Base model with reasoning
   - Proprietary → Open-source (or vice versa)

### Benefits of Independence

1. **Eliminates echo chambers**: Different models spot different issues
2. **Reduces bias**: Cross-company review catches vendor-specific quirks
3. **Improves coverage**: Complementary training data = better detection
4. **Builds trust**: True oversight, not self-review
5. **Catches subtle issues**: Fresh perspective on code changes

## Example Scenario

**User codes with Claude 3.5 Sonnet:**

```typescript
// Claude writes code
const userService = {
  createUser: async (data) => {
    const password = hashPassword(data.password);
    const user = await db.query(
      'INSERT INTO users (email, password) VALUES ($1, $2)',
      [data.email, password]
    );
    return user;
  }
};
```

**GPT-4o reviews independently:**

```
✅ ALIGNED
Risk: LOW
Confidence: 94%

Reasoning: Code follows security best practices. Uses parameterized
queries to prevent SQL injection. Password is hashed before storage.
Input validation could be enhanced, but core implementation is sound.
```

**Why this works:**
- Claude wrote secure code (its strength: careful reasoning)
- GPT-4o independently verified security (its strength: pattern recognition)
- Both agreed = high confidence in code quality
- If they disagreed → would flag for human review

## Performance Characteristics

| Pairing | Speed | Accuracy | Cost | Privacy |
|---------|-------|----------|------|---------|
| Claude → GPT-4o | Fast | Excellent | $$$ | Cloud |
| GPT-4 → Claude | Medium | Excellent | $$$ | Cloud |
| Copilot → Gemini | Very Fast | Good | $ | Cloud |
| Cursor → DeepSeek | Medium | Good | Free | Local |
| Continue → Llama | Slow | Good | Free | Local |

**Legend:**
- Speed: Very Fast (< 1s), Fast (1-3s), Medium (3-5s), Slow (5-10s)
- Accuracy: Excellent (95%+), Good (85-95%), Fair (75-85%)
- Cost: $ (< $0.01), $$ ($0.01-$0.03), $$$ (> $0.03) per analysis
- Privacy: Cloud (data sent to API), Local (data stays on machine)

## Recommendations

### For Maximum Security
**Use:** Claude 3.5 → GPT-4o
**Why:** Both top-tier models, different companies, excellent detection

### For Best Value
**Use:** Any model → Gemini Pro
**Why:** Very low cost, fast, good accuracy

### For Complete Privacy
**Use:** Continue → Llama 3.1 70B
**Why:** Everything runs locally, no external calls

### For Balanced Approach
**Use:** Copilot → Gemini Pro
**Why:** Good quality, low cost, fast analysis

---

**Key Takeaway:** The guardian system ensures truly independent oversight by intelligently pairing different AI models, eliminating bias and improving code quality.
