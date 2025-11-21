import * as vscode from 'vscode';
import { LicenseManager } from '../licensing/LicenseManager';

export class LicensePanel {
  public static currentPanel: LicensePanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly licenseManager: LicenseManager,
    private readonly extensionUri: vscode.Uri
  ) {
    this.panel = panel;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.html = this.getHtmlContent();

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'activateLicense':
            await this.handleActivateLicense(message.licenseKey);
            break;
          case 'activateTrial':
            await this.handleActivateTrial(message.email, message.name);
            break;
          case 'deactivateLicense':
            await this.handleDeactivateLicense();
            break;
          case 'openPricing':
            vscode.env.openExternal(vscode.Uri.parse('https://ai-supervisor.com/pricing'));
            break;
          case 'openDashboard':
            vscode.env.openExternal(vscode.Uri.parse('https://ai-supervisor.com/dashboard'));
            break;
        }
      },
      null,
      this.disposables
    );

    // Send initial license info
    this.updateLicenseInfo();
  }

  public static show(licenseManager: LicenseManager, extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (LicensePanel.currentPanel) {
      LicensePanel.currentPanel.panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'aiSupervisorLicense',
      'AI Supervisor - License',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [extensionUri]
      }
    );

    LicensePanel.currentPanel = new LicensePanel(panel, licenseManager, extensionUri);
  }

  private async handleActivateLicense(licenseKey: string) {
    const result = await this.licenseManager.activateLicense(licenseKey);

    this.panel.webview.postMessage({
      command: 'activationResult',
      success: result.success,
      message: result.message
    });

    if (result.success) {
      this.updateLicenseInfo();
      vscode.window.showInformationMessage(result.message);
    } else {
      vscode.window.showErrorMessage(result.message);
    }
  }

  private async handleActivateTrial(email: string, name?: string) {
    const result = await this.licenseManager.activateTrial(email, name);

    this.panel.webview.postMessage({
      command: 'activationResult',
      success: result.success,
      message: result.message
    });

    if (result.success) {
      this.updateLicenseInfo();
      vscode.window.showInformationMessage(result.message);
    } else {
      vscode.window.showErrorMessage(result.message);
    }
  }

  private async handleDeactivateLicense() {
    const confirm = await vscode.window.showWarningMessage(
      'Are you sure you want to deactivate your license?',
      'Yes',
      'No'
    );

    if (confirm === 'Yes') {
      await this.licenseManager.deactivateLicense();
      this.updateLicenseInfo();
      vscode.window.showInformationMessage('License deactivated');
    }
  }

  private updateLicenseInfo() {
    const info = this.licenseManager.getLicenseInfo();
    const features = this.licenseManager.getFeatureAccess();

    this.panel.webview.postMessage({
      command: 'updateLicense',
      license: {
        ...info,
        expiresAt: info.expiresAt?.toISOString()
      },
      features
    });
  }

  private getHtmlContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Supervisor License</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 20px;
      line-height: 1.6;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    h1 {
      font-size: 24px;
      margin-bottom: 20px;
      color: var(--vscode-foreground);
    }

    h2 {
      font-size: 18px;
      margin: 20px 0 10px;
      color: var(--vscode-foreground);
    }

    .card {
      background: var(--vscode-editor-inactiveSelectionBackground);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status.active {
      background: var(--vscode-testing-iconPassed);
      color: white;
    }

    .status.expired {
      background: var(--vscode-testing-iconFailed);
      color: white;
    }

    .status.grace {
      background: var(--vscode-editorWarning-foreground);
      color: white;
    }

    .input-group {
      margin-bottom: 15px;
    }

    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
    }

    input {
      width: 100%;
      padding: 8px 12px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      font-size: 14px;
    }

    input:focus {
      outline: none;
      border-color: var(--vscode-focusBorder);
    }

    button {
      padding: 8px 16px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      margin-right: 10px;
    }

    button:hover {
      background: var(--vscode-button-hoverBackground);
    }

    button.secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    button.secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }

    .feature-list {
      list-style: none;
      padding: 0;
    }

    .feature-list li {
      padding: 8px 0;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .feature-list li:last-child {
      border-bottom: none;
    }

    .feature-icon {
      display: inline-block;
      width: 20px;
      margin-right: 10px;
    }

    .message {
      padding: 12px;
      margin: 10px 0;
      border-radius: 4px;
    }

    .message.success {
      background: var(--vscode-testing-iconPassed);
      color: white;
    }

    .message.error {
      background: var(--vscode-testing-iconFailed);
      color: white;
    }

    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .tab {
      padding: 10px 20px;
      cursor: pointer;
      border-bottom: 2px solid transparent;
    }

    .tab.active {
      border-bottom-color: var(--vscode-focusBorder);
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>AI Supervisor License Management</h1>

    <div class="card" id="license-info">
      <h2>Current License</h2>
      <p id="license-status">Loading...</p>
    </div>

    <div class="tabs">
      <div class="tab active" onclick="showTab('activate')">Activate License</div>
      <div class="tab" onclick="showTab('trial')">Start Free Trial</div>
    </div>

    <div class="card">
      <div id="activate-tab" class="tab-content active">
        <h2>Activate License Key</h2>
        <div id="activation-message"></div>
        <div class="input-group">
          <label for="license-key">License Key</label>
          <input type="text" id="license-key" placeholder="Enter your license key">
        </div>
        <button onclick="activateLicense()">Activate</button>
        <button class="secondary" onclick="openDashboard()">Get License Key</button>
      </div>

      <div id="trial-tab" class="tab-content">
        <h2>Start 14-Day Free Trial</h2>
        <p style="margin-bottom: 15px;">Try all premium features free for 14 days. No credit card required.</p>
        <div id="trial-message"></div>
        <div class="input-group">
          <label for="trial-email">Email Address *</label>
          <input type="email" id="trial-email" placeholder="your@email.com" required>
        </div>
        <div class="input-group">
          <label for="trial-name">Name (optional)</label>
          <input type="text" id="trial-name" placeholder="Your name">
        </div>
        <button onclick="activateTrial()">Start Trial</button>
      </div>
    </div>

    <div class="card">
      <h2>Premium Features</h2>
      <ul class="feature-list" id="features-list">
        <li><span class="feature-icon" id="feat-advanced">❌</span> Advanced AI-powered deviation detection</li>
        <li><span class="feature-icon" id="feat-multi">❌</span> Multi-project support</li>
        <li><span class="feature-icon" id="feat-cloud">❌</span> Cloud sync and backup</li>
        <li><span class="feature-icon" id="feat-team">❌</span> Team collaboration features</li>
        <li><span class="feature-icon" id="feat-support">❌</span> Priority support</li>
      </ul>
      <button style="margin-top: 15px;" onclick="openPricing()">View Pricing Plans</button>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let currentLicense = null;

    function showTab(tab) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      document.querySelector(\`.tab[onclick="showTab('\${tab}')"]\`).classList.add('active');
      document.getElementById(\`\${tab}-tab\`).classList.add('active');
    }

    function activateLicense() {
      const licenseKey = document.getElementById('license-key').value.trim();
      if (!licenseKey) {
        showMessage('activation-message', 'Please enter a license key', 'error');
        return;
      }

      vscode.postMessage({
        command: 'activateLicense',
        licenseKey
      });
    }

    function activateTrial() {
      const email = document.getElementById('trial-email').value.trim();
      const name = document.getElementById('trial-name').value.trim();

      if (!email) {
        showMessage('trial-message', 'Please enter your email address', 'error');
        return;
      }

      vscode.postMessage({
        command: 'activateTrial',
        email,
        name: name || undefined
      });
    }

    function openPricing() {
      vscode.postMessage({ command: 'openPricing' });
    }

    function openDashboard() {
      vscode.postMessage({ command: 'openDashboard' });
    }

    function showMessage(elementId, message, type) {
      const el = document.getElementById(elementId);
      el.innerHTML = \`<div class="message \${type}">\${message}</div>\`;
      setTimeout(() => el.innerHTML = '', 5000);
    }

    function updateFeatureIcon(id, enabled) {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = enabled ? '✅' : '❌';
      }
    }

    window.addEventListener('message', event => {
      const message = event.data;

      switch (message.command) {
        case 'updateLicense':
          currentLicense = message.license;
          const statusEl = document.getElementById('license-status');

          let statusHtml = \`<p><strong>Type:</strong> \${message.license.type}</p>\`;
          statusHtml += \`<p><strong>Status:</strong> <span class="status \${message.license.status}">\${message.license.status}</span></p>\`;

          if (message.license.email) {
            statusHtml += \`<p><strong>Email:</strong> \${message.license.email}</p>\`;
          }

          if (message.license.expiresAt) {
            const expires = new Date(message.license.expiresAt);
            statusHtml += \`<p><strong>Expires:</strong> \${expires.toLocaleDateString()}</p>\`;
          }

          if (message.license.gracePeriodDays) {
            statusHtml += \`<p style="color: var(--vscode-editorWarning-foreground);"><strong>Grace Period:</strong> \${message.license.gracePeriodDays} days remaining</p>\`;
          }

          if (message.license.type !== 'free') {
            statusHtml += \`<button class="secondary" style="margin-top: 10px;" onclick="deactivate()">Deactivate License</button>\`;
          }

          statusEl.innerHTML = statusHtml;

          // Update feature checkmarks
          updateFeatureIcon('feat-advanced', message.features.advancedAnalysis);
          updateFeatureIcon('feat-multi', message.features.multiProject);
          updateFeatureIcon('feat-cloud', message.features.cloudSync);
          updateFeatureIcon('feat-team', message.features.teamFeatures);
          updateFeatureIcon('feat-support', message.features.prioritySupport);
          break;

        case 'activationResult':
          const tabId = message.success ? 'activation' : 'activation';
          showMessage(tabId + '-message', message.message, message.success ? 'success' : 'error');
          break;
      }
    });

    function deactivate() {
      if (confirm('Are you sure you want to deactivate your license?')) {
        vscode.postMessage({ command: 'deactivateLicense' });
      }
    }
  </script>
</body>
</html>`;
  }

  public dispose() {
    LicensePanel.currentPanel = undefined;
    this.panel.dispose();

    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
