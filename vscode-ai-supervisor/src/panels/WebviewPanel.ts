/**
 * Base class for webview panels
 */

import * as vscode from 'vscode';
import * as path from 'path';

export abstract class WebviewPanel {
  protected panel: vscode.WebviewPanel | undefined;
  protected disposables: vscode.Disposable[] = [];

  constructor(
    protected readonly context: vscode.ExtensionContext,
    protected readonly viewType: string,
    protected readonly title: string
  ) {}

  /**
   * Show the panel
   */
  public show(): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
    } else {
      this.create();
    }
  }

  /**
   * Dispose the panel
   */
  public dispose(): void {
    if (this.panel) {
      this.panel.dispose();
    }
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  /**
   * Post message to webview
   */
  protected postMessage(type: string, payload?: any): void {
    if (this.panel) {
      this.panel.webview.postMessage({ type, payload });
    }
  }

  /**
   * Create the webview panel
   */
  protected create(): void {
    this.panel = vscode.window.createWebviewPanel(
      this.viewType,
      this.title,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(this.context.extensionPath, 'out', 'webview')),
          vscode.Uri.file(path.join(this.context.extensionPath, 'node_modules')),
        ],
      }
    );

    this.panel.webview.html = this.getHtmlContent();

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      (message) => this.handleMessage(message),
      null,
      this.disposables
    );

    // Handle panel disposal
    this.panel.onDidDispose(() => this.onDispose(), null, this.disposables);

    // Initialize after creation
    this.onDidCreate();
  }

  /**
   * Get the HTML content for the webview
   */
  protected getHtmlContent(): string {
    if (!this.panel) {
      return '';
    }

    const scriptUri = this.panel.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this.context.extensionPath, 'out', 'webview', `${this.getScriptName()}.js`)
      )
    );

    const codiconsUri = this.panel.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(
          this.context.extensionPath,
          'node_modules',
          '@vscode/codicons',
          'dist',
          'codicon.css'
        )
      )
    );

    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this.panel.webview.cspSource} 'unsafe-inline'; font-src ${this.panel.webview.cspSource}; script-src 'nonce-${nonce}';">
  <link href="${codiconsUri}" rel="stylesheet" />
  <title>${this.title}</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  /**
   * Get the script name for this panel
   */
  protected abstract getScriptName(): string;

  /**
   * Handle messages from webview
   */
  protected abstract handleMessage(message: any): void;

  /**
   * Called after panel is created
   */
  protected onDidCreate(): void {
    // Override in subclass if needed
  }

  /**
   * Called when panel is disposed
   */
  protected onDispose(): void {
    this.panel = undefined;
  }

  /**
   * Generate a nonce for CSP
   */
  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
