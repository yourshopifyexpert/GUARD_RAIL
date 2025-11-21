import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true
});

// Stripe product and price IDs (set these after creating products in Stripe)
export const STRIPE_PRODUCTS = {
  INDIVIDUAL_MONTHLY: process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY || '',
  INDIVIDUAL_ANNUAL: process.env.STRIPE_PRICE_INDIVIDUAL_ANNUAL || '',
  STUDENT_MONTHLY: process.env.STRIPE_PRICE_STUDENT_MONTHLY || '',
  STUDENT_ANNUAL: process.env.STRIPE_PRICE_STUDENT_ANNUAL || '',
  TEAM_MONTHLY: process.env.STRIPE_PRICE_TEAM_MONTHLY || '',
  TEAM_ANNUAL: process.env.STRIPE_PRICE_TEAM_ANNUAL || ''
};

export default stripe;
