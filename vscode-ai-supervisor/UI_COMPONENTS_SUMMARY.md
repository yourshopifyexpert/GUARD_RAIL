# UI/UX Components and User Flows Summary

## Overview

The VS Code AI Supervisor extension provides a comprehensive React-based UI for monitoring AI coding assistants. This document outlines all UI components, user flows, and integration patterns.

---

## Architecture

### Webview Infrastructure

**Location**: `/home/user/GUARD_RAIL/vscode-ai-supervisor/src/webview/`

#### Core Utilities

1. **VSCode API Wrapper** (`utils/vscode.ts`)
   - Singleton wrapper around `acquireVsCodeApi()`
   - Message posting/receiving system
   - State persistence helpers
   - React hooks for message handling

2. **Theme Integration** (`utils/theme.ts`)
   - Automatic VS Code theme color extraction
   - Dark/light theme detection
   - Status color mapping
   - Global CSS variable application

3. **Type Definitions** (`types.ts`)
   - Complete TypeScript interfaces for all data structures
   - Message protocol enums
   - Activity, Goal, Change, and Alert types
   - Premium status and theme types

### Build Configuration

- **Webpack** for bundling React components
- **Separate compilation** for extension and webview code
- **TypeScript configs** for both contexts
- **CSS module support** with style-loader

---

## UI Components

### 1. Shared Components (`src/webview/shared/`)

#### Button Component
**File**: `Button.tsx`

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  icon?: string; // Codicon name
  children?: React.ReactNode;
}
```

**Features**:
- Three variants matching VS Code button styles
- Codicon icon support
- Full accessibility (focus, disabled states)
- VS Code theme integration

**Usage**:
```tsx
<Button icon="add" variant="primary" onClick={handleAdd}>
  New Goal
</Button>
```

---

#### StatusBadge Component
**File**: `StatusBadge.tsx`

**Purpose**: Display activity status with color-coded indicators

**Status Types**:
- `on_track` - Green (passing tests icon)
- `minor_deviation` - Yellow (queued icon)
- `critical_alert` - Red (failed icon)

**Features**:
- Icon + optional label
- Automatic color mapping from VS Code theme
- Compact design for lists

---

#### VirtualList Component
**File**: `VirtualList.tsx`

**Purpose**: Performance-optimized list rendering using react-virtualized

**Features**:
- Automatic height calculation with AutoSizer
- Row virtualization for 1000+ items
- Configurable row height (fixed or dynamic)
- Click and keyboard navigation
- Selection highlighting
- Empty state message

**Props**:
```typescript
interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  rowHeight: number | ((params: {index: number}) => number);
  onItemClick?: (item: T, index: number) => void;
  selectedIndex?: number;
  emptyMessage?: string;
}
```

---

#### DiffViewer Component
**File**: `DiffViewer.tsx`

**Purpose**: Side-by-side diff visualization

**Features**:
- Table-based diff layout
- Line numbers (old/new)
- Color-coded additions/deletions
- Context lines
- Syntax highlighting support
- Hunk headers
- File path display
- Click handlers for lines

**Display**:
- Green background for additions
- Red background for deletions
- Neutral for context
- +/- indicators

---

#### Timeline Component
**File**: `Timeline.tsx`

**Purpose**: Chronological activity view

**Features**:
- Vertical timeline layout
- Status badges for each item
- Relative timestamps ("5m ago")
- File path linking
- Change counts
- Hover effects
- Click handlers
- Empty state

**Item Display**:
```
[Status] Title                    5m ago
         Description
         📄 file/path.ts
         📊 12 changes
```

---

### 2. Main Panel Views (`src/webview/views/`)

#### Activity Monitor Panel
**File**: `ActivityMonitor.tsx`

**Purpose**: Real-time view of all AI actions

**Layout**:
```
┌─────────────────────────────────────┐
│ 🫀 Activity Monitor    [⊞][↻][✕]   │ Header
├─────────────────────────────────────┤
│ 🔍 [Search activities...]          │ Search
│ [All] [✓ On Track] [⚠ Warning] [✕] │ Filters
├─────────────────────────────────────┤
│                                     │
│  Timeline / List View               │ Content
│  [Virtualized scrolling]            │
│                                     │
└─────────────────────────────────────┘
```

**Features**:
1. **Header**:
   - Title with pulse icon
   - View mode toggle (timeline/list)
   - Refresh button
   - Clear history button

2. **Filters**:
   - Search input (file paths, descriptions)
   - Status filter tabs with counts
   - All/On Track/Minor Deviation/Critical Alert

3. **Content**:
   - Toggle between Timeline and VirtualList
   - Real-time updates via messages
   - Click to open Change Inspector
   - Status-based color coding

**User Flow**:
1. User opens Activity Monitor
2. Sees real-time feed of AI changes
3. Filters by status or search term
4. Clicks item to inspect details
5. Can toggle between timeline/list views
6. Clears history when needed

---

#### Goal Manager Panel
**File**: `GoalManager.tsx`

**Purpose**: CRUD interface for project goals

**Layout**:
```
┌─────────────────────────────────────┐
│ 🎯 Project Goals   [📚 Templates] [+]│ Header
├─────────────────────────────────────┤
│ Templates (collapsible):            │
│ [Build REST API] [Refactor] [Tests] │ Templates
├─────────────────────────────────────┤
│ ┌─ Active Goals ────────────────┐   │
│ │ HIGH ║ Title          85% ✓   │   │ Goal Cards
│ │ Description...                │   │
│ │ #tag #tag                     │   │
│ │ [Edit] [Delete]               │   │
│ └───────────────────────────────┘   │
│                                     │
│ ┌─ Paused Goals ────────────────┐   │
│ └───────────────────────────────┘   │
│                                     │
│ ┌─ Completed Goals ─────────────┐   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Goal Templates**:
1. Build REST API
2. Performance Refactoring
3. Add Unit Tests
4. Build UI Component
5. Write Documentation

**Goal Card Components**:
- Priority badge (low/medium/high)
- Alignment percentage (if available)
- Title and description
- Tag chips
- Edit/Delete buttons

**Editor Mode**:
```
┌─────────────────────────────────────┐
│ New Goal / Edit Goal          [✕]   │
├─────────────────────────────────────┤
│ Title *                             │
│ [_____________________________]     │
│                                     │
│ Description                         │
│ [_____________________________]     │
│ [_____________________________]     │
│                                     │
│ Priority: [Medium ▼]  Status: [✓]  │
│                                     │
│ Tags:                               │
│ [#frontend] [#ui] [Add tag...]      │
│                                     │
│        [Cancel] [Create Goal]       │
└─────────────────────────────────────┘
```

**Features**:
- Template quick-start
- Tag input with Enter/comma
- Tag removal
- Priority dropdown (low/medium/high)
- Status dropdown (active/paused/completed)
- Goal alignment indicator
- Sectioned by status
- Empty state with call-to-action

**User Flow**:
1. **Add Goal**:
   - Click "New Goal" or template
   - Fill form (title required)
   - Add tags (press Enter)
   - Set priority and status
   - Click "Create Goal"

2. **Edit Goal**:
   - Click "Edit" on goal card
   - Modify fields
   - Click "Update Goal"

3. **Delete Goal**:
   - Click "Delete" on goal card
   - Confirm deletion

4. **Use Template**:
   - Click "Templates" to expand
   - Click template card
   - Pre-fills form with template data
   - Customize as needed

---

#### Change Inspector Panel
**File**: `ChangeInspector.tsx`

**Purpose**: Review and approve/reject AI code changes

**Layout**:
```
┌────────────────────────────────────────────┐
│ 📊 Change Inspector  [Filter: All ▼]       │
├──────────────┬─────────────────────────────┤
│ Change List  │ Change Detail               │
│ (350px)      │ (Flex)                      │
├──────────────┼─────────────────────────────┤
│ 📝 file.ts   │ ┌─ file.ts      [✓][✕] ──┐ │
│ +12 -8       │ │                          │ │
│ ⚠ Reversal   │ │ Time: 2m ago             │ │
│ 2m ago       │ │ Type: modified           │ │
│              │ │ Lines: +12 -8            │ │
│ 📝 other.ts  │ │ AI: GitHub Copilot       │ │
│ +25 -3       │ │                          │ │
│ 5m ago       │ │ 💬 Conversation Context  │ │
│              │ │ "Added error handling"   │ │
│              │ │                          │ │
│              │ │ ⚠ Warning:               │ │
│              │ │ Reverses previous code   │ │
│              │ │                          │ │
│              │ │ ┌─ Diff Viewer ────────┐ │ │
│              │ │ │ @@ -10,5 +10,12 @@   │ │ │
│              │ │ │  context line        │ │ │
│              │ │ │ +added line          │ │ │
│              │ │ │ -removed line        │ │ │
│              │ │ └──────────────────────┘ │ │
│              │ └─────────────────────────┘ │
└──────────────┴─────────────────────────────┘
```

**Change List Items**:
- File icon + path
- +/- stats
- Status indicator (pending/approved/rejected)
- Reversal badge (if applicable)
- Contradiction warning
- AI provider badge
- Timestamp

**Change Detail Sections**:
1. **Header**:
   - File path with icon
   - Approve/Reject buttons (if pending)
   - Status text (if already decided)

2. **Info Bar**:
   - Timestamp
   - Change type (added/modified/deleted)
   - Line stats (+/-)
   - AI provider

3. **Conversation Context** (if available):
   - Quoted text from AI conversation
   - Link to why the change was made

4. **Warnings**:
   - Reversal detection
   - Contradiction alerts
   - Multiple changes conflict notice

5. **Diff Viewer**:
   - Full DiffViewer component
   - Expandable hunks
   - Syntax highlighting

**Features**:
- Filter dropdown (all/pending/approved/rejected)
- Two-column layout (list + detail)
- Selection highlighting
- Approve/reject workflow
- Confirmation dialogs
- Warning badges
- Empty states

**User Flow**:
1. **Review Changes**:
   - See list of all AI changes
   - Click to view details
   - Review diff and context

2. **Approve Change**:
   - Click "Approve"
   - Change marked as approved
   - Status updates in list

3. **Reject Change**:
   - Click "Reject"
   - Confirm rejection
   - Option to revert file
   - Status updates in list

4. **Detect Issues**:
   - System highlights reversals
   - Shows contradiction warnings
   - User investigates and decides

---

## Panel TypeScript Controllers (`src/panels/`)

### WebviewPanel Base Class
**File**: `WebviewPanel.ts`

**Purpose**: Abstract base class for all webview panels

**Features**:
- HTML generation with CSP
- Webview lifecycle management
- Message handling infrastructure
- Nonce generation for security
- Resource URI mapping
- Codicon CSS linking
- Disposable pattern

**Abstract Methods**:
- `getScriptName()`: Return webpack bundle name
- `handleMessage(message)`: Process webview messages

---

### ActivityMonitorPanel
**File**: `ActivityMonitor.ts`

**Responsibilities**:
- Maintain activity history (max 1000 items)
- Send updates to webview
- Handle filter requests
- Clear history
- Provide statistics

**Message Handlers**:
- `requestActivityHistory`: Send full history
- `filterActivity`: Update filters
- `requestChangeDetail`: Open Change Inspector

**Public Methods**:
- `addActivity(item)`: Add new activity
- `clearHistory()`: Reset all activity
- `getStats()`: Get activity statistics

---

### GoalManagerPanel
**File**: `GoalManager.ts`

**Responsibilities**:
- Store goals in workspace state
- CRUD operations on goals
- Send updates to webview
- Update goal alignment scores

**Message Handlers**:
- `requestGoals`: Send all goals
- `addGoal`: Create new goal
- `updateGoal`: Modify existing goal
- `deleteGoal`: Remove goal

**Storage**:
- Uses VS Code workspace state
- Persists across sessions
- Workspace-specific

**Public Methods**:
- `getActiveGoals()`: Filter active goals
- `updateGoalAlignment(id, score)`: Update alignment
- `getGoalsAsText()`: Export for AI context

---

### ChangeInspectorPanel
**File**: `ChangeInspector.ts`

**Responsibilities**:
- Track code changes (max 500)
- Approve/reject workflow
- Store in workspace state
- Trigger alerts for critical changes

**Message Handlers**:
- `requestChangeDetail`: Send all changes
- `approveChange`: Mark as approved
- `rejectChange`: Mark as rejected, offer revert

**Public Methods**:
- `addChange(change)`: Record new change
- `getPendingChangesCount()`: Count for badge
- `getChangesForFile(path)`: Filter by file

**Alerts**:
- Shows warning for reversals
- Shows warning for contradictions
- Offers "Review" button in notification

---

## VS Code Theme Integration

### CSS Variable Mapping

The extension uses VS Code's CSS variables for seamless theme integration:

```css
/* Background colors */
--vscode-editor-background
--vscode-editorGroupHeader-tabsBackground
--vscode-editorWidget-background

/* Foreground colors */
--vscode-foreground
--vscode-descriptionForeground

/* Interactive elements */
--vscode-button-background
--vscode-button-foreground
--vscode-button-hoverBackground
--vscode-button-secondaryBackground
--vscode-input-background
--vscode-input-border

/* Status colors */
--vscode-testing-iconPassed (green)
--vscode-testing-iconQueued (yellow)
--vscode-testing-iconFailed (red)

/* List/selection */
--vscode-list-hoverBackground
--vscode-list-activeSelectionBackground
--vscode-focusBorder

/* Diff colors */
--vscode-diffEditor-insertedTextBackground
--vscode-diffEditor-removedTextBackground
```

### Automatic Styling

The `applyVSCodeStyles()` function:
1. Creates global styles
2. Sets font family/size from VS Code
3. Configures scrollbar theming
4. Applies focus styles
5. Handles high contrast mode

---

## User Flows

### Flow 1: First-Time Setup

1. **Install Extension**
   - User installs from marketplace
   - Extension activates on VS Code startup

2. **Welcome Message**
   - Shows first-time welcome
   - Offers "Get Started" or "Set Goals"

3. **Define First Goal**
   - Opens Goal Manager
   - User clicks template or "New Goal"
   - Fills form
   - Creates goal

4. **Start Monitoring**
   - Monitoring auto-starts
   - User codes with AI assistant
   - Activity appears in real-time

---

### Flow 2: Daily Monitoring

1. **View Activity**
   - Open Activity Monitor from sidebar
   - See timeline of recent changes
   - Filter by status if needed

2. **Respond to Alert**
   - Toast notification appears
   - User clicks "Review"
   - Opens Change Inspector
   - Reviews diff and context
   - Approves or rejects

3. **Update Goals**
   - Open Goal Manager
   - Edit existing goal
   - Update description or priority
   - AI Supervisor adjusts monitoring

---

### Flow 3: Switching AI Models

1. **Generate Handoff**
   - Run "Generate Model Switch Handoff"
   - Extension creates summary:
     - Current project context
     - Active goals
     - Recent changes
     - Current task

2. **Review and Copy**
   - User reviews summary
   - Clicks "Copy to Clipboard"
   - Pastes into new AI chat

3. **Continue Work**
   - New AI has full context
   - Monitoring continues seamlessly
   - Goals remain consistent

---

### Flow 4: Reviewing Changes

1. **Open Change Inspector**
   - Via command or sidebar
   - See list of all changes

2. **Select Change**
   - Click change in list
   - Detail panel shows diff

3. **Review Context**
   - Read conversation context
   - Check for warnings
   - View full diff

4. **Make Decision**
   - Approve if good
   - Reject if problematic
   - Optionally revert file

---

## Accessibility Features

All components implement:
- Keyboard navigation (Tab, Enter, Space)
- ARIA labels where appropriate
- Focus indicators
- High contrast mode support
- Screen reader compatibility
- Semantic HTML structure

## Performance Optimizations

1. **Virtualization**:
   - Lists use react-virtualized
   - Only renders visible rows
   - Handles 1000+ items smoothly

2. **Message Batching**:
   - Reduces extension-webview communication
   - Debounced updates where appropriate

3. **State Management**:
   - React hooks for local state
   - VS Code state API for persistence
   - Minimal re-renders

4. **Lazy Loading**:
   - Panels create on-demand
   - Retain context when hidden
   - Dispose when not needed

---

## File Structure Summary

```
vscode-ai-supervisor/
├── src/
│   ├── extension.ts                    # Entry point, command registration
│   ├── panels/
│   │   ├── WebviewPanel.ts            # Base class for panels
│   │   ├── ActivityMonitor.ts         # Activity panel controller
│   │   ├── GoalManager.ts             # Goal panel controller
│   │   └── ChangeInspector.ts         # Change panel controller
│   └── webview/
│       ├── types.ts                   # TypeScript interfaces
│       ├── utils/
│       │   ├── vscode.ts              # VS Code API wrapper
│       │   └── theme.ts               # Theme utilities
│       ├── shared/                    # Reusable components
│       │   ├── Button.tsx
│       │   ├── StatusBadge.tsx
│       │   ├── VirtualList.tsx
│       │   ├── DiffViewer.tsx
│       │   └── Timeline.tsx
│       └── views/                     # Main panel views
│           ├── ActivityMonitor.tsx
│           ├── GoalManager.tsx
│           └── ChangeInspector.tsx
├── package.json                       # Extension manifest
├── webpack.config.js                  # Build configuration
├── tsconfig.json                      # Extension TypeScript config
├── tsconfig.webview.json              # Webview TypeScript config
├── README.md                          # Documentation
├── CHANGELOG.md                       # Version history
└── .vscodeignore                      # Package exclusions
```

---

## Message Protocol

### Extension → Webview

```typescript
// Activity updates
{ type: 'activityUpdate', payload: ActivityItem }
{ type: 'activityHistoryResponse', payload: ActivityItem[] }

// Goal updates
{ type: 'goalsUpdate', payload: ProjectGoal[] }
{ type: 'goalsResponse', payload: ProjectGoal[] }

// Change updates
{ type: 'changesUpdate', payload: CodeChange }
{ type: 'changeDetailResponse', payload: CodeChange[] }

// Alerts
{ type: 'alertTriggered', payload: Alert }

// Theme
{ type: 'themeChanged', payload: ThemeColors }

// Premium
{ type: 'premiumStatusUpdate', payload: PremiumStatus }
```

### Webview → Extension

```typescript
// Activity
{ type: 'requestActivityHistory' }
{ type: 'filterActivity', payload: ActivityFilter }

// Goals
{ type: 'requestGoals' }
{ type: 'addGoal', payload: ProjectGoal }
{ type: 'updateGoal', payload: ProjectGoal }
{ type: 'deleteGoal', payload: { id: string } }

// Changes
{ type: 'requestChangeDetail' }
{ type: 'approveChange', payload: { id: string } }
{ type: 'rejectChange', payload: { id: string } }
```

---

## Next Steps for Development

1. **Install Dependencies**:
   ```bash
   cd /home/user/GUARD_RAIL/vscode-ai-supervisor
   npm install
   ```

2. **Add Codicons Package**:
   ```bash
   npm install @vscode/codicons
   ```

3. **Compile**:
   ```bash
   npm run compile
   ```

4. **Debug**:
   - Open project in VS Code
   - Press F5 to launch Extension Development Host

5. **Test UI**:
   - Run commands from command palette
   - Test all three panels
   - Verify theme integration

6. **Build VSIX**:
   ```bash
   npm run build:vsix
   ```

---

## Summary

This VS Code extension provides a comprehensive, professional UI for monitoring AI coding assistants:

- **3 Main Panels**: Activity Monitor, Goal Manager, Change Inspector
- **6 Shared Components**: Button, StatusBadge, VirtualList, DiffViewer, Timeline
- **Full VS Code Integration**: Theme, commands, sidebar, notifications
- **React + TypeScript**: Modern, type-safe codebase
- **Performance**: Virtualized lists, efficient rendering
- **Accessibility**: Keyboard navigation, ARIA, high contrast
- **Professional UX**: Matches VS Code design language perfectly

All components are ready for development and testing!
