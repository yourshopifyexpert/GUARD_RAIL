import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { stripe, STRIPE_PRODUCTS } from '../lib/stripe';
import prisma from '../lib/db';
import { LicenseType, BillingPeriod } from '../types';

const createCheckoutSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  type: z.enum(['individual', 'student', 'team']),
  billingPeriod: z.nativeEnum(BillingPeriod),
  successUrl: z.string().url(),
  cancelUrl: z.string().url()
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
    const data = createCheckoutSchema.parse(req.body);

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

    // Determine price ID
    let priceId: string;
    const isAnnual = data.billingPeriod === BillingPeriod.ANNUAL;

    switch (data.type) {
      case 'individual':
        priceId = isAnnual ? STRIPE_PRODUCTS.INDIVIDUAL_ANNUAL : STRIPE_PRODUCTS.INDIVIDUAL_MONTHLY;
        break;
      case 'student':
        priceId = isAnnual ? STRIPE_PRODUCTS.STUDENT_ANNUAL : STRIPE_PRODUCTS.STUDENT_MONTHLY;
        break;
      case 'team':
        priceId = isAnnual ? STRIPE_PRODUCTS.TEAM_ANNUAL : STRIPE_PRODUCTS.TEAM_MONTHLY;
        break;
      default:
        return res.status(400).json({ error: 'Invalid license type' });
    }

    if (!priceId) {
      return res.status(500).json({
        error: 'Price not configured',
        message: 'Please configure Stripe price IDs in environment variables'
      });
    }

    // Create or get Stripe customer
    let stripeCustomer;
    if (user.stripeCustomerId) {
      stripeCustomer = await stripe.customers.retrieve(user.stripeCustomerId);
    } else {
      stripeCustomer = await stripe.customers.create({
        email: data.email,
        name: data.name,
        metadata: {
          userId: user.id
        }
      });

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: stripeCustomer.id }
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${data.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: data.cancelUrl,
      metadata: {
        userId: user.id,
        licenseType: data.type,
        billingPeriod: data.billingPeriod
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          licenseType: data.type,
          billingPeriod: data.billingPeriod
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto'
    });

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        details: error.errors
      });
    }

    return res.status(500).json({
      error: 'Failed to create checkout session'
    });
  }
}
