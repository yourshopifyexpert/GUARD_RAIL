import * as vscode from 'vscode';
import * as os from 'os';
import * as crypto from 'crypto';
import { LicenseType, LicenseStatus, LicenseInfo, FeatureAccess } from './types';

const LICENSE_API_URL = process.env.LICENSE_API_URL || 'https://api.ai-supervisor.com';
const VALIDATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const GRACE_PERIOD_DAYS = 7;

export class LicenseManager {
  private context: vscode.ExtensionContext;
  private licenseInfo: LicenseInfo | null = null;
  private validationTimer: NodeJS.Timeout | null = null;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async initialize(): Promise<void> {
    // Load cached license info
    const cachedInfo = this.context.globalState.get<LicenseInfo>('licenseInfo');
    if (cachedInfo) {
      this.licenseInfo = {
        ...cachedInfo,
        expiresAt: cachedInfo.expiresAt ? new Date(cachedInfo.expiresAt) : undefined
      };
    }

    // Validate license
    await this.validateLicense();

    // Set up periodic validation
    this.validationTimer = setInterval(() => {
      this.validateLicense();
    }, VALIDATION_INTERVAL);
  }

  dispose(): void {
    if (this.validationTimer) {
      clearInterval(this.validationTimer);
    }
  }

  async activateLicense(licenseKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const machineId = await this.getMachineId();
      const metadata = {
        vscodeVersion: vscode.version,
        extensionVersion: this.context.extension.packageJSON.version,
        os: os.platform()
      };

      const response = await fetch(`${LICENSE_API_URL}/api/validate-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey,
          machineId,
          metadata
        })
      });

      const data = await response.json();

      if (data.valid) {
        // Store license key and info
        await this.context.secrets.store('licenseKey', licenseKey);
        this.licenseInfo = {
          valid: true,
          type: data.license.type as LicenseType,
          status: data.license.status as LicenseStatus,
          expiresAt: new Date(data.license.expiresAt),
          email: data.license.email,
          maxActivations: data.license.maxActivations,
          currentActivations: data.license.currentActivations,
          gracePeriodDays: data.license.gracePeriodDays
        };

        await this.context.globalState.update('licenseInfo', this.licenseInfo);
        await this.context.globalState.update('lastValidation', new Date().toISOString());

        return {
          success: true,
          message: 'License activated successfully!'
        };
      } else {
        return {
          success: false,
          message: data.reason || 'Invalid license key'
        };
      }
    } catch (error) {
      console.error('License activation failed:', error);
      return {
        success: false,
        message: 'Failed to activate license. Please check your internet connection.'
      };
    }
  }

  async activateTrial(email: string, name?: string): Promise<{ success: boolean; message: string }> {
    try {
      const machineId = await this.getMachineId();
      const metadata = {
        vscodeVersion: vscode.version,
        extensionVersion: this.context.extension.packageJSON.version,
        os: os.platform()
      };

      const response = await fetch(`${LICENSE_API_URL}/api/activate-trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          machineId,
          metadata
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store trial license
        await this.context.secrets.store('licenseKey', data.license.key);
        this.licenseInfo = {
          valid: true,
          type: LicenseType.TRIAL,
          status: LicenseStatus.ACTIVE,
          expiresAt: new Date(data.license.expiresAt),
          email
        };

        await this.context.globalState.update('licenseInfo', this.licenseInfo);
        await this.context.globalState.update('lastValidation', new Date().toISOString());

        return {
          success: true,
          message: `14-day trial activated! ${data.license.daysRemaining} days remaining.`
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to activate trial'
        };
      }
    } catch (error) {
      console.error('Trial activation failed:', error);
      return {
        success: false,
        message: 'Failed to activate trial. Please check your internet connection.'
      };
    }
  }

  async validateLicense(): Promise<void> {
    const licenseKey = await this.context.secrets.get('licenseKey');

    if (!licenseKey) {
      // No license key - use free tier
      this.licenseInfo = {
        valid: true,
        type: LicenseType.FREE,
        status: LicenseStatus.ACTIVE
      };
      await this.context.globalState.update('licenseInfo', this.licenseInfo);
      return;
    }

    try {
      const machineId = await this.getMachineId();
      const response = await fetch(`${LICENSE_API_URL}/api/validate-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey,
          machineId
        })
      });

      const data = await response.json();

      if (data.valid) {
        this.licenseInfo = {
          valid: true,
          type: data.license.type as LicenseType,
          status: data.license.status as LicenseStatus,
          expiresAt: new Date(data.license.expiresAt),
          email: data.license.email,
          maxActivations: data.license.maxActivations,
          currentActivations: data.license.currentActivations,
          gracePeriodDays: data.license.gracePeriodDays
        };

        await this.context.globalState.update('licenseInfo', this.licenseInfo);
        await this.context.globalState.update('lastValidation', new Date().toISOString());
      } else {
        // License invalid - check grace period
        const lastValidation = this.context.globalState.get<string>('lastValidation');
        if (lastValidation) {
          const daysSinceValidation = Math.floor(
            (Date.now() - new Date(lastValidation).getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceValidation < GRACE_PERIOD_DAYS) {
            // Still in grace period
            if (this.licenseInfo) {
              this.licenseInfo.status = LicenseStatus.GRACE_PERIOD;
              this.licenseInfo.gracePeriodDays = GRACE_PERIOD_DAYS - daysSinceValidation;
            }
          } else {
            // Grace period expired
            this.licenseInfo = {
              valid: false,
              type: LicenseType.FREE,
              status: LicenseStatus.EXPIRED,
              reason: data.reason
            };
          }
        } else {
          // No last validation - license expired
          this.licenseInfo = {
            valid: false,
            type: LicenseType.FREE,
            status: LicenseStatus.EXPIRED,
            reason: data.reason
          };
        }

        await this.context.globalState.update('licenseInfo', this.licenseInfo);
      }
    } catch (error) {
      console.error('License validation failed:', error);

      // Offline mode - check grace period
      const lastValidation = this.context.globalState.get<string>('lastValidation');
      if (lastValidation && this.licenseInfo) {
        const daysSinceValidation = Math.floor(
          (Date.now() - new Date(lastValidation).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceValidation < GRACE_PERIOD_DAYS) {
          // Still in grace period
          this.licenseInfo.status = LicenseStatus.GRACE_PERIOD;
          this.licenseInfo.gracePeriodDays = GRACE_PERIOD_DAYS - daysSinceValidation;
        }
      }
    }
  }

  getLicenseInfo(): LicenseInfo {
    return this.licenseInfo || {
      valid: true,
      type: LicenseType.FREE,
      status: LicenseStatus.ACTIVE
    };
  }

  getFeatureAccess(): FeatureAccess {
    const info = this.getLicenseInfo();

    // Free tier features
    if (info.type === LicenseType.FREE || !info.valid) {
      return {
        advancedAnalysis: false,
        multiProject: false,
        cloudSync: false,
        teamFeatures: false,
        prioritySupport: false
      };
    }

    // Trial and paid tiers get all features
    return {
      advancedAnalysis: true,
      multiProject: true,
      cloudSync: true,
      teamFeatures: info.type === LicenseType.TEAM,
      prioritySupport: true
    };
  }

  hasFeature(feature: keyof FeatureAccess): boolean {
    return this.getFeatureAccess()[feature];
  }

  async deactivateLicense(): Promise<void> {
    await this.context.secrets.delete('licenseKey');
    this.licenseInfo = {
      valid: true,
      type: LicenseType.FREE,
      status: LicenseStatus.ACTIVE
    };
    await this.context.globalState.update('licenseInfo', this.licenseInfo);
    await this.context.globalState.update('lastValidation', undefined);
  }

  private async getMachineId(): Promise<string> {
    // Get or create a unique machine ID
    let machineId = this.context.globalState.get<string>('machineId');

    if (!machineId) {
      // Generate machine ID from system info
      const info = `${os.hostname()}-${os.platform()}-${os.arch()}-${os.userInfo().username}`;
      machineId = crypto.createHash('sha256').update(info).digest('hex');
      await this.context.globalState.update('machineId', machineId);
    }

    return machineId;
  }

  showUpgradePrompt(feature: string): void {
    vscode.window.showInformationMessage(
      `${feature} is a premium feature. Upgrade to unlock!`,
      'Start Free Trial',
      'View Plans',
      'Dismiss'
    ).then(selection => {
      if (selection === 'Start Free Trial') {
        vscode.commands.executeCommand('aiSupervisor.activateTrial');
      } else if (selection === 'View Plans') {
        vscode.env.openExternal(vscode.Uri.parse('https://ai-supervisor.com/pricing'));
      }
    });
  }
}
