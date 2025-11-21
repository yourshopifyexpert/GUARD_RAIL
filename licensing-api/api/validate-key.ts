import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import prisma from '../lib/db';
import { verifyLicenseKey } from '../lib/jwt';
import { isLicenseValid } from '../lib/license-utils';
import { ValidationResult } from '../types';

const validateKeySchema = z.object({
  licenseKey: z.string(),
  machineId: z.string().optional(),
  metadata: z.object({
    vscodeVersion: z.string().optional(),
    extensionVersion: z.string().optional(),
    os: z.string().optional()
  }).optional()
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const data = validateKeySchema.parse(req.body);

    // Verify JWT signature
    const payload = verifyLicenseKey(data.licenseKey);
    if (!payload) {
      await logValidation(data.licenseKey, false, 'Invalid JWT signature', req);
      return res.status(200).json({
        valid: false,
        reason: 'Invalid license key'
      } as ValidationResult);
    }

    // Find license in database
    const license = await prisma.license.findUnique({
      where: { key: data.licenseKey },
      include: {
        user: true,
        activations: {
          where: {
            deactivatedAt: null
          }
        }
      }
    });

    if (!license) {
      await logValidation(data.licenseKey, false, 'License not found', req);
      return res.status(200).json({
        valid: false,
        reason: 'License not found'
      } as ValidationResult);
    }

    // Check license validity
    const validationResult = isLicenseValid(
      license.status as any,
      license.expiresAt,
      license.lastValidatedAt || undefined
    );

    if (!validationResult.valid) {
      await logValidation(license.id, false, validationResult.reason, req);
      return res.status(200).json(validationResult);
    }

    // Check activation limit if machineId is provided
    if (data.machineId) {
      const existingActivation = license.activations.find(
        a => a.machineId === data.machineId
      );

      if (!existingActivation) {
        // New activation
        if (license.currentActivations >= license.maxActivations) {
          await logValidation(license.id, false, 'Activation limit reached', req);
          return res.status(200).json({
            valid: false,
            reason: `Activation limit reached (${license.maxActivations} devices)`
          } as ValidationResult);
        }

        // Create new activation
        await prisma.activation.create({
          data: {
            licenseId: license.id,
            machineId: data.machineId,
            metadata: data.metadata
          }
        });

        // Increment activation count
        await prisma.license.update({
          where: { id: license.id },
          data: {
            currentActivations: {
              increment: 1
            }
          }
        });
      } else {
        // Update existing activation
        await prisma.activation.update({
          where: { id: existingActivation.id },
          data: {
            lastSeenAt: new Date(),
            metadata: data.metadata || existingActivation.metadata
          }
        });
      }
    }

    // Update last validated timestamp
    await prisma.license.update({
      where: { id: license.id },
      data: {
        lastValidatedAt: new Date()
      }
    });

    // Log successful validation
    await logValidation(license.id, true, undefined, req);

    // Return success with license info
    return res.status(200).json({
      valid: true,
      license: {
        id: license.id,
        type: license.type,
        status: license.status,
        expiresAt: license.expiresAt.toISOString(),
        maxActivations: license.maxActivations,
        currentActivations: license.currentActivations + (data.machineId && !license.activations.find(a => a.machineId === data.machineId) ? 1 : 0),
        email: license.user.email,
        gracePeriodDays: validationResult.gracePeriodDays
      }
    } as ValidationResult);
  } catch (error) {
    console.error('Error validating license key:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        details: error.errors
      });
    }

    return res.status(500).json({
      error: 'Failed to validate license key'
    });
  }
}

async function logValidation(
  licenseIdOrKey: string,
  valid: boolean,
  reason: string | undefined,
  req: VercelRequest
) {
  try {
    // Try to find license by ID first, then by key
    const license = await prisma.license.findFirst({
      where: {
        OR: [
          { id: licenseIdOrKey },
          { key: licenseIdOrKey }
        ]
      }
    });

    if (license) {
      await prisma.validationLog.create({
        data: {
          licenseId: license.id,
          valid,
          reason,
          ipAddress: (req.headers['x-forwarded-for'] as string) ||
                     (req.headers['x-real-ip'] as string) ||
                     'unknown',
          userAgent: req.headers['user-agent'] as string
        }
      });
    }
  } catch (error) {
    console.error('Failed to log validation:', error);
  }
}
