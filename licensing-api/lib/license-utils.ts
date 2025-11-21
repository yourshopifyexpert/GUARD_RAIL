import { addDays, addMonths, addYears, isPast, isAfter } from 'date-fns';
import { LicenseType, LicenseStatus, BillingPeriod } from '../types';

const GRACE_PERIOD_DAYS = 7;
const TRIAL_PERIOD_DAYS = 14;

export function calculateExpirationDate(
  type: LicenseType,
  billingPeriod?: BillingPeriod,
  startDate: Date = new Date()
): Date {
  if (type === LicenseType.TRIAL) {
    return addDays(startDate, TRIAL_PERIOD_DAYS);
  }

  if (type === LicenseType.OSS) {
    // OSS licenses are valid for 1 year, renewable
    return addYears(startDate, 1);
  }

  if (billingPeriod === BillingPeriod.MONTHLY) {
    return addMonths(startDate, 1);
  }

  if (billingPeriod === BillingPeriod.ANNUAL) {
    return addYears(startDate, 1);
  }

  throw new Error('Invalid billing period for license type');
}

export function getMaxActivations(type: LicenseType): number {
  switch (type) {
    case LicenseType.INDIVIDUAL:
    case LicenseType.STUDENT:
    case LicenseType.OSS:
      return 3; // Allow 3 machines
    case LicenseType.TEAM:
      return 25; // Allow 25 team members
    case LicenseType.TRIAL:
      return 1; // Single machine for trial
    default:
      return 1;
  }
}

export function isLicenseValid(
  status: LicenseStatus,
  expiresAt: Date,
  lastValidatedAt?: Date
): {
  valid: boolean;
  reason?: string;
  gracePeriodDays?: number;
} {
  // Check if license is active
  if (status !== LicenseStatus.ACTIVE) {
    return {
      valid: false,
      reason: `License is ${status}`
    };
  }

  const now = new Date();

  // Check if expired
  if (isPast(expiresAt)) {
    // Check grace period
    if (lastValidatedAt) {
      const gracePeriodEnd = addDays(lastValidatedAt, GRACE_PERIOD_DAYS);

      if (isAfter(now, gracePeriodEnd)) {
        return {
          valid: false,
          reason: 'License expired and grace period ended'
        };
      }

      // Still in grace period
      const remainingDays = Math.ceil(
        (gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        valid: true,
        reason: 'Grace period active (offline mode)',
        gracePeriodDays: remainingDays
      };
    }

    return {
      valid: false,
      reason: 'License expired'
    };
  }

  return { valid: true };
}

export function getPricing(type: LicenseType, billingPeriod: BillingPeriod): number {
  if (type === LicenseType.TRIAL || type === LicenseType.OSS) {
    return 0;
  }

  const baseMonthly = type === LicenseType.STUDENT ? 6 : 12; // 50% off for students

  if (billingPeriod === BillingPeriod.MONTHLY) {
    return baseMonthly;
  }

  // Annual pricing (save 2 months)
  return baseMonthly * 10;
}

export function generateMachineId(): string {
  // This would be implemented in the client (VS Code extension)
  // Using system info like MAC address, hostname, etc.
  throw new Error('Machine ID should be generated on client side');
}
