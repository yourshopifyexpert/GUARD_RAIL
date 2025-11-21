/**
 * VS Code theme integration utilities
 */

import { ThemeColors } from '../types';

/**
 * Get current VS Code theme colors from CSS variables
 */
export function getThemeColors(): ThemeColors {
  const getColor = (cssVar: string): string => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(cssVar)
      .trim() || '#000000';
  };

  return {
    background: getColor('--vscode-editor-background'),
    foreground: getColor('--vscode-editor-foreground'),
    border: getColor('--vscode-panel-border'),
    buttonBackground: getColor('--vscode-button-background'),
    buttonForeground: getColor('--vscode-button-foreground'),
    buttonHoverBackground: getColor('--vscode-button-hoverBackground'),
    inputBackground: getColor('--vscode-input-background'),
    inputForeground: getColor('--vscode-input-foreground'),
    inputBorder: getColor('--vscode-input-border'),
    statusGreen: getColor('--vscode-testing-iconPassed'),
    statusYellow: getColor('--vscode-testing-iconQueued'),
    statusRed: getColor('--vscode-testing-iconFailed'),
    listHoverBackground: getColor('--vscode-list-hoverBackground'),
    listActiveBackground: getColor('--vscode-list-activeSelectionBackground'),
    editorBackground: getColor('--vscode-editor-background'),
    diffAddedBackground: getColor('--vscode-diffEditor-insertedTextBackground'),
    diffRemovedBackground: getColor('--vscode-diffEditor-removedTextBackground'),
  };
}

/**
 * Get status color based on activity status
 */
export function getStatusColor(status: 'on_track' | 'minor_deviation' | 'critical_alert'): string {
  const colors = getThemeColors();

  switch (status) {
    case 'on_track':
      return colors.statusGreen;
    case 'minor_deviation':
      return colors.statusYellow;
    case 'critical_alert':
      return colors.statusRed;
    default:
      return colors.foreground;
  }
}

/**
 * Apply VS Code styling to container
 */
export function applyVSCodeStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    body {
      padding: 0;
      margin: 0;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      font-weight: var(--vscode-font-weight);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
    }

    * {
      box-sizing: border-box;
    }

    :focus-visible {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: 2px;
    }

    .vscode-high-contrast :focus-visible {
      outline-width: 2px;
    }

    /* Scrollbar styling */
    ::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    ::-webkit-scrollbar-track {
      background: var(--vscode-scrollbarSlider-background);
    }

    ::-webkit-scrollbar-thumb {
      background: var(--vscode-scrollbarSlider-background);
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--vscode-scrollbarSlider-hoverBackground);
    }

    ::-webkit-scrollbar-thumb:active {
      background: var(--vscode-scrollbarSlider-activeBackground);
    }
  `;
  document.head.appendChild(style);
}

/**
 * Detect if dark theme is active
 */
export function isDarkTheme(): boolean {
  const background = getComputedStyle(document.documentElement)
    .getPropertyValue('--vscode-editor-background')
    .trim();

  // Simple heuristic: check if background is dark
  if (background.startsWith('#')) {
    const hex = background.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  }

  return true; // Default to dark
}
