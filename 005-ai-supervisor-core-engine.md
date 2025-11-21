<objective>
Build the core AI supervision and memory engine - a cross-platform Node.js library that monitors AI agent behavior, tracks conversation context, detects goal deviations, prevents code reversals, and enables active intervention to keep AI agents on track.

This is the foundation for a VS Code extension (and future cross-platform tools) that will be sold as a premium product. The core engine must be production-ready, well-architected, and designed for extensibility.
</objective>

<context>
This system addresses a critical problem: AI agents can hallucinate, deviate from goals, reverse previous changes, or perform unauthorized actions mid-conversation. The supervisor acts as an intelligent guardrail that:

- **Maintains comprehensive memory** of all AI interactions, code changes, and decisions
- **Tracks project goals and scope** to detect when AI strays from objectives
- **Detects harmful patterns** like code reversals or unauthorized operations
- **Actively intervenes** by alerting users and communicating with AI agents to stop/correct behavior
- **Preserves context** when switching models or resuming conversations

Target users: Developers using AI coding assistants who need reliability, accountability, and continuity across sessions.

Business model: Free tier with basic memory, premium tier with advanced supervision, multi-model support, and analytics.
</context>

<requirements>

## Core Memory System

1. **Conversation Logging**
   - Store complete dialogue history with timestamps
   - Track user requests, AI responses, and clarifications
   - Support conversation branching and resumption
   - Compress older context using intelligent summarization

2. **Code Change Tracking**
   - Log every file modification with before/after diffs
   - Track reasons for each change (linked to conversation context)
   - Maintain git-like history without requiring git
   - Detect when AI reverses or undoes previous changes

3. **Goal & Scope Management**
   - Allow users to define project goals, constraints, and scope
   - Track architectural decisions and design choices
   - Maintain "intent log" of what AI is supposed to accomplish
   - Version goals over time as projects evolve

4. **Model Switch Handling**
   - Export structured summaries when switching models
   - Preserve: current goals, recent changes, key decisions, active context
   - Generate model-agnostic handoff documents
   - Support seamless continuation across different AI providers

## AI Supervision & Intervention

5. **Deviation Detection**
   - Compare AI actions against stated goals and scope
   - Flag when AI suggests changes outside defined boundaries
   - Detect semantic drift from original requirements
   - Use pattern matching and optional LLM-based analysis for complex cases

6. **Code Reversal Detection**
   - Identify when AI undoes previous work without justification
   - Alert on contradictory changes (adding then removing same code)
   - Track circular edits that indicate confusion or hallucination

7. **Unauthorized Action Prevention**
   - Define allowlists/blocklists for AI operations
   - Catch dangerous operations (file deletions, external API calls, etc.)
   - Require user approval for high-risk actions

8. **Active Intervention Protocol**
   - **User alerts**: Real-time notifications when issues detected
   - **AI communication**: Generate messages to AI agent explaining the issue
   - **Corrective prompts**: Auto-suggest corrections to get AI back on track
   - **Halt mechanism**: Ability to pause AI mid-execution

## Data Storage & Performance

9. **Efficient Storage**
   - SQLite database for conversation and change history
   - JSON files for goals, scope, and configuration
   - Compression for large conversation logs
   - Configurable retention policies

10. **Performance Requirements**
    - Real-time monitoring with <100ms detection latency
    - Handle projects with 1000+ files
    - Support conversations with 100,000+ tokens
    - Minimal memory footprint (<50MB baseline)

</requirements>

<architecture>

## Recommended Structure

```
ai-supervisor/
├── src/
│   ├── core/
│   │   ├── MemoryEngine.ts        # Conversation & code change logging
│   │   ├── GoalTracker.ts         # Goal/scope management
│   │   ├── DeviationDetector.ts   # Pattern matching & analysis
│   │   ├── InterventionManager.ts # Alert & correction system
│   │   └── ModelSwitchHandler.ts  # Context preservation
│   ├── storage/
│   │   ├── Database.ts            # SQLite wrapper
│   │   ├── ChangeLog.ts           # Code diff storage
│   │   └── ConversationStore.ts   # Dialogue history
│   ├── analysis/
│   │   ├── CodeDiffer.ts          # Before/after comparison
│   │   ├── ReversalDetector.ts    # Undo pattern detection
│   │   └── ScopeValidator.ts      # Goal alignment checking
│   ├── api/
│   │   └── SupervisorAPI.ts       # Public interface for extensions
│   └── index.ts                   # Main exports
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

## Key Design Patterns

- **Event-driven architecture**: Emit events for all detected issues
- **Plugin system**: Allow custom deviation detectors and intervention strategies
- **Streaming support**: Handle real-time AI output parsing
- **Cross-platform**: Pure Node.js, no platform-specific dependencies (VS Code integration comes later)

</architecture>

<implementation>

## Technology Stack

- **TypeScript** for type safety and maintainability
- **better-sqlite3** for fast, embedded storage
- **diff** library for code comparison
- **EventEmitter** for pub/sub architecture
- **zod** for schema validation

## Critical Implementation Guidelines

1. **Memory efficiency**: Use streaming and pagination for large datasets
2. **Extensibility**: Design APIs that editors/IDEs can easily integrate
3. **Testing**: Comprehensive unit tests for deviation detection logic
4. **Documentation**: JSDoc all public APIs - this will be used by extension developers
5. **Configuration**: Support both programmatic and file-based config
6. **Privacy**: All data stored locally, no external services required (free tier)

## What to Build First

Focus on core functionality in this order:
1. Memory engine with conversation + code change logging
2. Goal tracker with simple scope validation
3. Deviation detector with pattern-based rules
4. Intervention manager with event emission
5. Model switch handler with summary generation
6. Database schema and storage layer
7. Public API for extension integration

## What to Avoid

- **Don't** build UI components - this is a headless library
- **Don't** integrate with specific AI providers - remain provider-agnostic
- **Don't** include VS Code APIs - that's the next prompt
- **Don't** implement complex ML models for detection - start with rule-based, make it pluggable
- **Don't** add cloud sync features yet - local-first for free tier

Why these constraints? The core library must work across any platform and editor. Platform-specific integrations come in subsequent prompts.

</implementation>

<output>

Create the following structure:

- `./ai-supervisor/package.json` - Node.js package with dependencies
- `./ai-supervisor/tsconfig.json` - TypeScript configuration
- `./ai-supervisor/src/` - All source code as described in architecture
- `./ai-supervisor/tests/` - Unit tests for core functionality
- `./ai-supervisor/README.md` - Setup instructions and API documentation
- `./ai-supervisor/.gitignore` - Standard Node.js gitignore

Include comprehensive JSDoc comments and inline documentation explaining:
- How deviation detection works
- How to configure supervision rules
- How extensions should integrate with the API
- Example usage patterns

</output>

<verification>

Before declaring complete, verify:

1. **Run tests**: All unit tests pass (`npm test`)
2. **Example integration**: Create `examples/basic-usage.ts` showing how an extension would use the API
3. **Deviation detection**: Test that code reversal and goal deviation are caught correctly
4. **Performance check**: Verify memory usage stays under 50MB with sample data
5. **Build check**: TypeScript compiles without errors (`npm run build`)

Create a verification checklist in the README documenting these checks.

</verification>

<success_criteria>

- Core engine implements all 10 requirements from the requirements section
- Public API is well-documented and easy to integrate
- Deviation detection catches at least: code reversals, scope violations, unauthorized actions
- Memory system stores conversations, code changes, and goals efficiently
- Model switch handler generates structured summaries
- All code is TypeScript with proper types
- Test coverage >80% for core logic
- README explains architecture and usage clearly

</success_criteria>

<research>

Before implementing, briefly research:
- Existing AI monitoring/supervision tools (if any)
- Best practices for real-time code diff analysis
- Efficient conversation storage patterns
- Standard formats for AI agent communication

Use findings to inform architecture decisions.
</research>
