import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { stripe } from '../lib/stripe';
import prisma from '../lib/db';

const createPortalSchema = z.object({
  email: z.string().email(),
  returnUrl: z.string().url()
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
    const data = createPortalSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({
        error: 'Customer not found',
        message: 'No subscription found for this email'
      });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: data.returnUrl
    });

    return res.status(200).json({
      success: true,
      url: session.url
    });
  } catch (error) {
    console.error('Error creating portal session:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        details: error.errors
      });
    }

    return res.status(500).json({
      error: 'Failed to create portal session'
    });
  }
}
