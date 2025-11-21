# Assets Directory

This directory contains visual assets for the AI Supervisor VS Code extension.

## Required Assets

### Extension Icon
- **File**: `icon.png`
- **Size**: 128x128 pixels
- **Format**: PNG with transparency
- **Purpose**: Shown in VS Code marketplace and extension list

### Sidebar Icon
- **File**: `sidebar-icon.svg`
- **Format**: SVG (vector)
- **Purpose**: Shown in VS Code activity bar

### Screenshots

For marketplace listing, include:

1. **activity-monitor.png** - Activity Monitor panel showing real-time changes
2. **goal-manager.png** - Goal Manager UI with defined goals
3. **change-inspector.png** - Change Inspector with diff view
4. **alerts.png** - Alert notification examples

**Screenshot Guidelines**:
- Resolution: 1920x1080 or higher
- Format: PNG
- Show real usage examples
- Use dark theme (matches most developers' preference)
- Highlight key features with annotations

## Design Guidelines

### Colors
- Primary: #007ACC (VS Code blue)
- Success: #4CAF50 (green)
- Warning: #FF9800 (orange)
- Error: #F44336 (red)
- Background: Match VS Code themes

### Icon Style
- Minimalist design
- Clear at small sizes
- Recognizable symbol (e.g., shield, eye, guardian)
- Works in both light and dark themes

## Creating Assets

### Icon
```bash
# Use Figma, Sketch, or Illustrator to create
# Export as PNG at 128x128
# Ensure transparency for rounded corners
```

### Screenshots
1. Set up VS Code with extension installed
2. Use a sample project to demonstrate features
3. Take screenshots using OS screenshot tool
4. Annotate if needed using image editor
5. Optimize file size while maintaining quality

## Current Status

- [ ] icon.png - Need to create
- [ ] sidebar-icon.svg - Need to create
- [ ] Screenshots - Need to capture
- [ ] Banner image - Optional

## Resources

- [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [VS Code Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest)
- [Marketplace Presentation Tips](https://code.visualstudio.com/api/references/extension-manifest#marketplace-presentation-tips)
