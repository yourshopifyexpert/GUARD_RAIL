# Changelog

All notable changes to the "AI Supervisor" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned Features
- Advanced deviation detection with ML models
- Multi-project workspace support
- Cloud backup and sync
- Team collaboration features
- Custom rule engine
- Plugin system for extensibility

## [0.1.0] - 2024-01-XX

### Added
- **Activity Monitor Panel**
  - Real-time monitoring of AI code changes
  - Color-coded status indicators
  - Timeline view of changes
  - Filter by type, severity, and time range
  
- **Goal Manager**
  - Define and track project goals
  - Quick-add templates for common scenarios
  - Goal alignment visualization
  - CRUD operations on goals

- **Change Inspector**
  - Side-by-side diff viewer
  - Detection of code reversals
  - Contradiction highlighting
  - Approve/reject workflow

- **Alert System**
  - Toast notifications for deviations
  - Severity levels (info, warning, error)
  - Actionable alert responses
  - Alert history tracking

- **Intervention Controls**
  - Pause/resume monitoring
  - Manual override capabilities
  - Change rollback support

- **Model Switch Assistant**
  - Automatic handoff summary generation
  - Context preservation
  - Copy to clipboard functionality
  - Preview before sending

- **AI Tool Detection**
  - Automatic detection of installed AI assistants
  - Support for GitHub Copilot, Continue, Cody, and more
  - Fallback to file watching for any AI tool

- **File Watching**
  - Real-time workspace change monitoring
  - Smart AI activity detection
  - Change buffering and analysis

- **Settings & Configuration**
  - Monitoring sensitivity levels
  - Alert preferences
  - Storage location and retention
  - Premium license activation

### Extension Features
- Sidebar integration with custom views
- Command palette integration
- Webview-based UI panels
- VS Code native UI components
- Context-aware menus

### Developer Experience
- TypeScript codebase with strict mode
- Webpack bundling for production
- Source maps for debugging
- F5 debugging support
- Comprehensive README with setup instructions

### Infrastructure
- Extension manifest with proper activation events
- Command registration system
- Webview panel lifecycle management
- Event-based architecture
- Disposable pattern for cleanup

## [0.0.1] - Initial Development

### Added
- Project scaffolding
- Basic extension structure
- Development environment setup

---

## Release Notes Format

### Types of Changes
- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** in case of vulnerabilities

### Version Numbering
- **Major** (X.0.0): Breaking changes or major feature releases
- **Minor** (0.X.0): New features, backward compatible
- **Patch** (0.0.X): Bug fixes, backward compatible

---

For older versions and detailed commit history, see [Releases](https://github.com/your-org/ai-supervisor/releases).
