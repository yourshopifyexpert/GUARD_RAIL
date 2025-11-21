export enum LicenseType {
  FREE = 'free',
  TRIAL = 'trial',
  INDIVIDUAL = 'individual',
  TEAM = 'team',
  STUDENT = 'student',
  OSS = 'oss'
}

export enum LicenseStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
  GRACE_PERIOD = 'grace_period'
}

export interface LicenseInfo {
  valid: boolean
  type: LicenseType
  status: LicenseStatus
  expiresAt?: Date
  gracePeriodDays?: number
  reason?: string
  email?: string
  maxActivations?: number
  currentActivations?: number
}

export interface FeatureAccess {
  advancedAnalysis: boolean
  multiProject: boolean
  cloudSync: boolean
  teamFeatures: boolean
  prioritySupport: boolean
}
