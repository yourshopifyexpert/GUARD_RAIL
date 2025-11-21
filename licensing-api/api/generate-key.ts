import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import prisma from '../lib/db';
import { generateLicenseKey } from '../lib/jwt';
import { calculateExpirationDate, getMaxActivations, getPricing } from '../lib/license-utils';
import { LicenseType, BillingPeriod } from '../types';

const generateKeySchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  type: z.nativeEnum(LicenseType),
  billingPeriod: z.nativeEnum(BillingPeriod).optional(),
  stripeSubscriptionId: z.string().optional(),
  stripePriceId: z.string().optional()
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin API key
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Validate request body
    const data = generateKeySchema.parse(req.body);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name
        }
      });
    }

    // Calculate expiration
    const expiresAt = calculateExpirationDate(data.type, data.billingPeriod);
    const maxActivations = getMaxActivations(data.type);

    // Create license record first (without key)
    const license = await prisma.license.create({
      data: {
        id: nanoid(21),
        key: '', // Will be updated after JWT generation
        userId: user.id,
        type: data.type,
        status: 'active',
        billingPeriod: data.billingPeriod,
        expiresAt,
        maxActivations,
        currentActivations: 0,
        stripeSubscriptionId: data.stripeSubscriptionId,
        stripePriceId: data.stripePriceId
      }
    });

    // Generate JWT-based license key
    const licenseKey = generateLicenseKey({
      userId: user.id,
      email: user.email,
      type: data.type,
      licenseId: license.id,
      expiresAt,
      maxActivations
    });

    // Update license with the key
    await prisma.license.update({
      where: { id: license.id },
      data: { key: licenseKey }
    });

    // Return the license key and details
    return res.status(201).json({
      success: true,
      license: {
        id: license.id,
        key: licenseKey,
        type: data.type,
        status: 'active',
        expiresAt: expiresAt.toISOString(),
        maxActivations
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Error generating license key:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        details: error.errors
      });
    }

    return res.status(500).json({
      error: 'Failed to generate license key'
    });
  }
}
