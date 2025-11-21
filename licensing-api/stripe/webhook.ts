import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { stripe } from '../lib/stripe';
import prisma from '../lib/db';
import { generateLicenseKey } from '../lib/jwt';
import { calculateExpirationDate, getMaxActivations } from '../lib/license-utils';
import { LicenseType, BillingPeriod } from '../types';
import { nanoid } from 'nanoid';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

if (!WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
}

export const config = {
  api: {
    bodyParser: false
  }
};

async function buffer(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Check if event was already processed
  const existingEvent = await prisma.stripeEvent.findUnique({
    where: { stripeEventId: event.id }
  });

  if (existingEvent?.processed) {
    return res.status(200).json({ received: true, note: 'Already processed' });
  }

  // Store event
  await prisma.stripeEvent.upsert({
    where: { stripeEventId: event.id },
    create: {
      stripeEventId: event.id,
      type: event.type,
      data: event.data as any,
      processed: false
    },
    update: {}
  });

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await prisma.stripeEvent.update({
      where: { stripeEventId: event.id },
      data: { processed: true }
    });

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout completed:', session.id);

  const { userId, licenseType, billingPeriod } = session.metadata || {};

  if (!userId || !licenseType || !billingPeriod) {
    console.error('Missing metadata in checkout session');
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    console.error('User not found:', userId);
    return;
  }

  // License will be created when subscription is created
  console.log('Waiting for subscription.created event');
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);

  const { userId, licenseType, billingPeriod } = subscription.metadata || {};

  if (!userId || !licenseType || !billingPeriod) {
    console.error('Missing metadata in subscription');
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    console.error('User not found:', userId);
    return;
  }

  // Create license
  const type = licenseType as LicenseType;
  const period = billingPeriod as BillingPeriod;
  const expiresAt = calculateExpirationDate(type, period);
  const maxActivations = getMaxActivations(type);

  const license = await prisma.license.create({
    data: {
      id: nanoid(21),
      key: '',
      userId: user.id,
      type,
      status: 'active',
      billingPeriod: period,
      expiresAt,
      maxActivations,
      currentActivations: 0,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id
    }
  });

  const licenseKey = generateLicenseKey({
    userId: user.id,
    email: user.email,
    type,
    licenseId: license.id,
    expiresAt,
    maxActivations
  });

  await prisma.license.update({
    where: { id: license.id },
    data: { key: licenseKey }
  });

  console.log('License created:', license.id);

  // TODO: Send email with license key
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);

  const license = await prisma.license.findUnique({
    where: { stripeSubscriptionId: subscription.id }
  });

  if (!license) {
    console.error('License not found for subscription:', subscription.id);
    return;
  }

  // Update expiration if subscription period changed
  const periodEnd = new Date(subscription.current_period_end * 1000);

  await prisma.license.update({
    where: { id: license.id },
    data: {
      expiresAt: periodEnd,
      status: subscription.status === 'active' ? 'active' : 'suspended'
    }
  });

  console.log('License updated:', license.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);

  const license = await prisma.license.findUnique({
    where: { stripeSubscriptionId: subscription.id }
  });

  if (!license) {
    console.error('License not found for subscription:', subscription.id);
    return;
  }

  await prisma.license.update({
    where: { id: license.id },
    data: { status: 'cancelled' }
  });

  console.log('License cancelled:', license.id);

  // TODO: Send email notification
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded:', invoice.id);

  if (!invoice.subscription) {
    return;
  }

  const license = await prisma.license.findUnique({
    where: { stripeSubscriptionId: invoice.subscription as string }
  });

  if (!license) {
    console.error('License not found for subscription:', invoice.subscription);
    return;
  }

  // Extend license expiration
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
  const periodEnd = new Date(subscription.current_period_end * 1000);

  await prisma.license.update({
    where: { id: license.id },
    data: {
      expiresAt: periodEnd,
      status: 'active'
    }
  });

  console.log('License renewed:', license.id);

  // TODO: Send receipt email
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Payment failed:', invoice.id);

  if (!invoice.subscription) {
    return;
  }

  const license = await prisma.license.findUnique({
    where: { stripeSubscriptionId: invoice.subscription as string }
  });

  if (!license) {
    console.error('License not found for subscription:', invoice.subscription);
    return;
  }

  // Mark license as suspended (grace period)
  await prisma.license.update({
    where: { id: license.id },
    data: { status: 'suspended' }
  });

  console.log('License suspended due to payment failure:', license.id);

  // TODO: Send payment failed email
}
