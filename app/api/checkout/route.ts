import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const TIER_PRICES: Record<string, { label: string; unitAmount: number }> = {
  basic:     { label: "Basic License",     unitAmount: 999  },
  premium:   { label: "Premium License",   unitAmount: 2499 },
  exclusive: { label: "Exclusive License", unitAmount: 9999 },
};

function sanitizeText(value: string | undefined, fallback: string, maxLength: number) {
  const nextValue = value?.trim();
  if (!nextValue) return fallback;
  return nextValue.slice(0, maxLength);
}

function resolveBaseUrl(req: NextRequest, rawOrigin?: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;

  if (configured) {
    try {
      const configuredUrl = new URL(configured);

      if (rawOrigin) {
        const requestedUrl = new URL(rawOrigin);
        if (requestedUrl.origin === configuredUrl.origin) {
          return configuredUrl.origin;
        }
      }

      return configuredUrl.origin;
    } catch {
      return configured;
    }
  }

  if (rawOrigin) {
    try {
      return new URL(rawOrigin).origin;
    } catch {
      return req.nextUrl.origin;
    }
  }

  return req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: "Payments not configured." }, { status: 503 });
  }

  let body: { tier?: string; trackName?: string; producer?: string; origin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { tier = "basic", origin } = body;

  const price = TIER_PRICES[tier];
  if (!price) {
    return NextResponse.json({ error: "Unknown license tier." }, { status: 400 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-02-24.acacia" });
  const trackName = sanitizeText(body.trackName, "Unknown Track", 90);
  const producer = sanitizeText(body.producer, "Unknown", 70);
  const baseUrl = resolveBaseUrl(req, origin);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: price.unitAmount,
            product_data: {
              name: `${price.label}: ${trackName}`,
              description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} license for "${trackName}" by ${producer} via Epic MusicSpace`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: { tier, trackName, producer, source: "ems-3d" },
      success_url: `${baseUrl}/?checkout=success`,
      cancel_url: `${baseUrl}/?checkout=cancelled`,
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error("[ems-3d] stripe checkout error:", error);
    return NextResponse.json({ error: "Unable to start checkout right now." }, { status: 502 });
  }
}
