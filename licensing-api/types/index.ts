export enum LicenseType {
  INDIVIDUAL = 'individual',
  TEAM = 'team',
  STUDENT = 'student',
  OSS = 'oss',
  TRIAL = 'trial'
}

export enum LicenseStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended'
}

export enum BillingPeriod {
  MONTHLY = 'monthly',
  ANNUAL = 'annual'
}

export interface LicenseKey {
  id: string;
  key: string;
  userId: string;
  email: string;
  type: LicenseType;
  status: LicenseStatus;
  billingPeriod?: BillingPeriod;
  issuedAt: Date;
  expiresAt: Date;
  lastValidatedAt?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  maxActivations: number;
  currentActivations: number;
  metadata?: Record<string, any>;
}

export interface LicensePayload {
  sub: string; // userId
  email: string;
  type: LicenseType;
  exp: number; // expiration timestamp
  iat: number; // issued at timestamp
  lic: string; // license ID
  max: number; // max activations
}

export interface ValidationResult {
  valid: boolean;
  license?: LicenseKey;
  reason?: string;
  gracePeriodDays?: number;
}

export interface ActivationRequest {
  licenseKey: string;
  machineId: string;
  metadata?: {
    vscodeVersion?: string;
    extensionVersion?: string;
    os?: string;
  };
}

export interface ActivationRecord {
  id: string;
  licenseId: string;
  machineId: string;
  activatedAt: Date;
  lastSeenAt: Date;
  metadata?: Record<string, any>;
}
