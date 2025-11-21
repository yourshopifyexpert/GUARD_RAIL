# Contributing to AI Supervisor

Thank you for your interest in contributing to AI Supervisor! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

1. **Check existing issues** - Search for similar issues first
2. **Create detailed report** - Include:
   - VS Code version
   - Extension version
   - Operating system
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Console logs (Help > Toggle Developer Tools)

### Suggesting Features

1. **Check roadmap** - Review planned features in issues
2. **Open feature request** - Describe:
   - Use case and problem it solves
   - Proposed solution
   - Alternative solutions considered
   - Impact on existing features

### Pull Requests

1. **Fork the repository**
2. **Create feature branch** - `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Follow code style** - Run linter before committing
5. **Write tests** - Add tests for new features
6. **Update documentation** - README, comments, etc.
7. **Commit with clear messages** - Follow conventional commits
8. **Push to your fork**
9. **Open Pull Request**

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/ai-supervisor.git
cd vscode-ai-supervisor

# Install dependencies
npm install

# Start development
npm run watch

# In VS Code, press F5 to debug
```

## Code Style

- **TypeScript**: Use strict mode
- **Formatting**: Use VS Code default formatter
- **Naming**: 
  - Classes: PascalCase
  - Functions/variables: camelCase
  - Constants: UPPER_SNAKE_CASE
  - Private members: prefix with `_`
- **Comments**: JSDoc for public APIs
- **Imports**: Organize and remove unused

## Testing

```bash
# Run tests
npm test

# Run linter
npm run lint

# Fix linting issues
npm run lint -- --fix
```

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new alert type for contradictions
fix: resolve file watcher memory leak
docs: update installation instructions
style: format code according to prettier
refactor: simplify command registration
test: add tests for goal manager
chore: update dependencies
```

## Project Structure

```
vscode-ai-supervisor/
├── src/
│   ├── extension.ts          # Entry point
│   ├── commands/             # Command handlers
│   │   └── Commands.ts
│   ├── panels/               # Webview panels
│   │   ├── ActivityMonitor.ts
│   │   ├── GoalManager.ts
│   │   └── ChangeInspector.ts
│   ├── integration/          # AI tool integration
│   │   ├── FileWatcher.ts
│   │   ├── AIDetector.ts
│   │   └── InterceptLayer.ts
│   └── notifications/        # Alert system
│       └── AlertManager.ts
├── dist/                     # Compiled output
└── package.json              # Extension manifest
```

## Adding New Features

### 1. Commands

```typescript
// In Commands.ts
public async myNewCommand(): Promise<void> {
    // Implementation
}

// In extension.ts
vscode.commands.registerCommand(
    'aiSupervisor.myNewCommand', 
    () => commands.myNewCommand()
)
```

Update `package.json`:
```json
{
  "contributes": {
    "commands": [
      {
        "command": "aiSupervisor.myNewCommand",
        "title": "My New Command",
        "category": "AI Supervisor"
      }
    ]
  }
}
```

### 2. Settings

Add to `package.json`:
```json
{
  "configuration": {
    "properties": {
      "aiSupervisor.myNewSetting": {
        "type": "boolean",
        "default": true,
        "description": "Description of my setting"
      }
    }
  }
}
```

Access in code:
```typescript
const config = vscode.workspace.getConfiguration('aiSupervisor');
const value = config.get<boolean>('myNewSetting', true);
```

### 3. Webview Panels

Create new panel in `src/panels/`:
```typescript
export class MyNewPanel {
    public static currentPanel: MyNewPanel | undefined;
    
    public static createOrShow(extensionUri: vscode.Uri): void {
        // Implementation
    }
}
```

## Review Process

1. **Automated checks** - Must pass CI/CD
2. **Code review** - At least one maintainer approval
3. **Testing** - Verify functionality in Extension Development Host
4. **Documentation** - Ensure docs are updated

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag
4. Build VSIX: `npm run build:vsix`
5. Publish to marketplace: `vsce publish`

## Questions?

- **Documentation**: Check README.md first
- **Issues**: Search existing issues
- **Discussions**: Use GitHub Discussions for questions
- **Email**: contact@your-site.com for private inquiries

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
