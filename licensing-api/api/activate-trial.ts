import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import prisma from '../lib/db';
import { generateLicenseKey } from '../lib/jwt';
import { calculateExpirationDate, getMaxActivations } from '../lib/license-utils';
import { LicenseType } from '../types';

const activateTrialSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  machineId: z.string(),
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
    const data = activateTrialSchema.parse(req.body);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        licenses: {
          where: {
            type: LicenseType.TRIAL
          }
        }
      }
    });

    // Check if user already has a trial
    if (user && user.licenses.length > 0) {
      return res.status(400).json({
        error: 'Trial already activated',
        message: 'You have already used your free trial. Please upgrade to a premium plan.'
      });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name
        },
        include: {
          licenses: true
        }
      });
    }

    // Calculate trial expiration (14 days)
    const expiresAt = calculateExpirationDate(LicenseType.TRIAL);
    const maxActivations = getMaxActivations(LicenseType.TRIAL);

    // Create trial license
    const license = await prisma.license.create({
      data: {
        id: nanoid(21),
        key: '', // Will be updated after JWT generation
        userId: user.id,
        type: LicenseType.TRIAL,
        status: 'active',
        expiresAt,
        maxActivations,
        currentActivations: 1
      }
    });

    // Generate JWT-based license key
    const licenseKey = generateLicenseKey({
      userId: user.id,
      email: user.email,
      type: LicenseType.TRIAL,
      licenseId: license.id,
      expiresAt,
      maxActivations
    });

    // Update license with the key
    await prisma.license.update({
      where: { id: license.id },
      data: { key: licenseKey }
    });

    // Create activation
    await prisma.activation.create({
      data: {
        licenseId: license.id,
        machineId: data.machineId,
        metadata: data.metadata
      }
    });

    // Return the trial license
    return res.status(201).json({
      success: true,
      message: 'Trial activated successfully',
      license: {
        id: license.id,
        key: licenseKey,
        type: LicenseType.TRIAL,
        status: 'active',
        expiresAt: expiresAt.toISOString(),
        daysRemaining: 14
      }
    });
  } catch (error) {
    console.error('Error activating trial:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        details: error.errors
      });
    }

    return res.status(500).json({
      error: 'Failed to activate trial'
    });
  }
}
