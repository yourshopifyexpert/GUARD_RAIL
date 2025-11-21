/**
 * Example integration of the licensing system into the VS Code extension
 * This shows how to initialize the license manager and gate features
 */

import * as vscode from 'vscode';
import { LicenseManager } from './licensing/LicenseManager';
import { LicensePanel } from './ui/LicensePanel';

let licenseManager: LicenseManager;

export async function activate(context: vscode.ExtensionContext) {
  console.log('AI Supervisor is now active');

  // Initialize license manager
  licenseManager = new LicenseManager(context);
  await licenseManager.initialize();

  // Show license status in status bar
  const licenseStatusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  updateStatusBar(licenseStatusBar);
  licenseStatusBar.show();
  context.subscriptions.push(licenseStatusBar);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('aiSupervisor.showLicensePanel', () => {
      LicensePanel.show(licenseManager, context.extensionUri);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('aiSupervisor.activateTrial', async () => {
      const email = await vscode.window.showInputBox({
        prompt: 'Enter your email address to start a 14-day free trial',
        placeHolder: 'your@email.com',
        validateInput: (value) => {
          if (!value || !value.includes('@')) {
            return 'Please enter a valid email address';
          }
          return undefined;
        }
      });

      if (email) {
        const result = await licenseManager.activateTrial(email);
        if (result.success) {
          vscode.window.showInformationMessage(result.message);
          updateStatusBar(licenseStatusBar);
        } else {
          vscode.window.showErrorMessage(result.message);
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('aiSupervisor.checkForDeviations', async () => {
      // Example: Gate premium feature
      if (!licenseManager.hasFeature('advancedAnalysis')) {
        licenseManager.showUpgradePrompt('Advanced Deviation Detection');
        return;
      }

      // Premium feature logic here
      await performAdvancedAnalysis();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('aiSupervisor.syncToCloud', async () => {
      // Example: Gate cloud sync feature
      if (!licenseManager.hasFeature('cloudSync')) {
        licenseManager.showUpgradePrompt('Cloud Sync');
        return;
      }

      // Cloud sync logic here
      await syncToCloud();
    })
  );

  // Check license status periodically and update UI
  setInterval(() => {
    updateStatusBar(licenseStatusBar);
  }, 60000); // Every minute
}

export function deactivate() {
  if (licenseManager) {
    licenseManager.dispose();
  }
}

function updateStatusBar(statusBar: vscode.StatusBarItem) {
  const info = licenseManager.getLicenseInfo();

  switch (info.type) {
    case 'free':
      statusBar.text = '$(key) AI Supervisor: Free';
      statusBar.tooltip = 'Click to upgrade to Premium';
      break;
    case 'trial':
      const daysRemaining = info.expiresAt
        ? Math.ceil((info.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;
      statusBar.text = `$(key) AI Supervisor: Trial (${daysRemaining}d)`;
      statusBar.tooltip = `Trial expires in ${daysRemaining} days`;
      break;
    case 'individual':
    case 'team':
    case 'student':
    case 'oss':
      statusBar.text = `$(verified) AI Supervisor: Premium`;
      statusBar.tooltip = `License: ${info.type}`;
      break;
  }

  if (info.status === 'grace_period' && info.gracePeriodDays) {
    statusBar.text = `$(warning) AI Supervisor: Grace (${info.gracePeriodDays}d)`;
    statusBar.tooltip = `License validation failed. ${info.gracePeriodDays} days remaining in grace period`;
  } else if (info.status === 'expired') {
    statusBar.text = '$(error) AI Supervisor: Expired';
    statusBar.tooltip = 'License expired. Click to renew';
  }

  statusBar.command = 'aiSupervisor.showLicensePanel';
}

async function performAdvancedAnalysis() {
  // Premium feature: Advanced AI-powered analysis
  vscode.window.showInformationMessage('Running advanced deviation analysis...');
  // Implementation here
}

async function syncToCloud() {
  // Premium feature: Cloud sync
  vscode.window.showInformationMessage('Syncing to cloud...');
  // Implementation here
}

/**
 * Example: Gate a feature at the function level
 */
export function createFeatureGate(feature: keyof import('./licensing/types').FeatureAccess) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      if (!licenseManager.hasFeature(feature)) {
        licenseManager.showUpgradePrompt(propertyKey);
        return;
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Example usage of feature gate decorator:
 *
 * class MyFeatures {
 *   @createFeatureGate('multiProject')
 *   async switchProject() {
 *     // This will only run if user has multiProject feature
 *   }
 * }
 */
