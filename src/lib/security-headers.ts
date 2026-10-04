/**
 * Security headers (audit: CSP / clickjacking / referrer / permissions).
 * CSP allows only what Clerk (Frontend API, Cloudflare Turnstile, avatars)
 * and Next.js need. Stripe Checkout and the Billing Portal are top-level
 * redirects, so they need no CSP entries.
 */

/** Clerk Frontend API host encoded in the publishable key (pk_test_/pk_live_ + base64("host$")). */
export function clerkFrontendHost(publishableKey: string | undefined): string | null {
  if (!publishableKey) return null;
  const m = /^pk_(?:test|live)_(.+)$/.exec(publishableKey.trim());
  if (!m) return null;
  try {
    const decoded = Buffer.from(m[1], "base64").toString("utf8").replace(/\$$/, "");
    return /^[a-z0-9.-]+$/i.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

export function buildCsp(opts: {
  publishableKey?: string;
  dev?: boolean;
  preview?: boolean;
}): string {
  const host = clerkFrontendHost(opts.publishableKey);
  const clerk = [host ? `https://${host}` : null, "https://*.clerk.accounts.dev"].filter(
    Boolean,
  ) as string[];
  const vercelLive = opts.preview ? ["https://vercel.live"] : [];
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      ...(opts.dev ? ["'unsafe-eval'"] : []),
      ...clerk,
      "https://challenges.cloudflare.com",
      ...vercelLive,
    ],
    "connect-src": [
      "'self'",
      ...clerk,
      "https://clerk-telemetry.com",
      ...vercelLive,
      ...(opts.preview ? ["wss://ws-us3.pusher.com"] : []),
    ],
    "img-src": ["'self'", "data:", "blob:", "https://img.clerk.com", ...vercelLive],
    "style-src": ["'self'", "'unsafe-inline'", ...vercelLive],
    "font-src": ["'self'", "data:", ...vercelLive],
    "frame-src": ["'self'", "https://challenges.cloudflare.com", ...vercelLive],
    "worker-src": ["'self'", "blob:"],
    "form-action": ["'self'", "https://checkout.stripe.com", "https://billing.stripe.com"],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
  };
  const csp = Object.entries(directives)
    .map(([k, v]) => `${k} ${v.join(" ")}`)
    .join("; ");
  return opts.dev ? csp : `${csp}; upgrade-insecure-requests`;
}

export function securityHeaders(env: NodeJS.ProcessEnv = process.env) {
  const dev = env.NODE_ENV !== "production";
  return [
    {
      key: "Content-Security-Policy",
      value: buildCsp({
        publishableKey: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        dev,
        preview: env.VERCEL_ENV === "preview",
      }),
    },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    },
    ...(dev
      ? []
      : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
  ];
}
