import jwt from 'jsonwebtoken';
import { LicenseType, LicensePayload } from '../types';

const JWT_SECRET = process.env.LICENSE_JWT_SECRET!;
const JWT_ISSUER = 'ai-supervisor';

if (!JWT_SECRET) {
  throw new Error('LICENSE_JWT_SECRET environment variable is required');
}

export function generateLicenseKey(payload: {
  userId: string;
  email: string;
  type: LicenseType;
  licenseId: string;
  expiresAt: Date;
  maxActivations: number;
}): string {
  const jwtPayload: LicensePayload = {
    sub: payload.userId,
    email: payload.email,
    type: payload.type,
    exp: Math.floor(payload.expiresAt.getTime() / 1000),
    iat: Math.floor(Date.now() / 1000),
    lic: payload.licenseId,
    max: payload.maxActivations
  };

  return jwt.sign(jwtPayload, JWT_SECRET, {
    issuer: JWT_ISSUER,
    algorithm: 'HS256'
  });
}

export function verifyLicenseKey(key: string): LicensePayload | null {
  try {
    const decoded = jwt.verify(key, JWT_SECRET, {
      issuer: JWT_ISSUER,
      algorithms: ['HS256']
    }) as LicensePayload;

    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export function decodeLicenseKey(key: string): LicensePayload | null {
  try {
    const decoded = jwt.decode(key) as LicensePayload;
    return decoded;
  } catch (error) {
    return null;
  }
}
