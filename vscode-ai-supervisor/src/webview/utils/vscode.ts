/**
 * Utilities for webview communication with VS Code extension
 */

import { VSCodeAPI, Message, MessageType } from '../types';

// Get VS Code API instance (available in webview context)
declare function acquireVsCodeApi(): VSCodeAPI;

class VSCodeAPIWrapper {
  private readonly vscode: VSCodeAPI;
  private listeners: Map<MessageType, Set<(payload: any) => void>>;

  constructor() {
    this.vscode = acquireVsCodeApi();
    this.listeners = new Map();

    // Set up message listener
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  /**
   * Send message to extension
   */
  public postMessage(type: MessageType, payload?: any): void {
    const message: Message = { type, payload };
    this.vscode.postMessage(message);
  }

  /**
   * Subscribe to messages from extension
   */
  public onMessage(type: MessageType, callback: (payload: any) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(type);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  /**
   * Get persisted state
   */
  public getState<T = any>(): T | undefined {
    return this.vscode.getState();
  }

  /**
   * Persist state
   */
  public setState<T = any>(state: T): void {
    this.vscode.setState(state);
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(event: MessageEvent): void {
    const message = event.data as Message;
    const callbacks = this.listeners.get(message.type);

    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(message.payload);
        } catch (error) {
          console.error(`Error in message handler for ${message.type}:`, error);
        }
      });
    }
  }
}

// Singleton instance
export const vscodeApi = new VSCodeAPIWrapper();

/**
 * Hook-style API for React components
 */
export function useVSCodeMessage(
  type: MessageType,
  callback: (payload: any) => void,
  deps: any[] = []
): void {
  React.useEffect(() => {
    const unsubscribe = vscodeApi.onMessage(type, callback);
    return unsubscribe;
  }, deps);
}

// Re-export for convenience
export { MessageType } from '../types';
