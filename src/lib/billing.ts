import "server-only";
import type Stripe from "stripe";

let cachedConfigId: string | null = null;

/**
 * Customer Portal configuration used for "Zarządzaj subskrypcją / anuluj".
 * Uses the account's default configuration when it exists; otherwise creates
 * one (cancel at period end, card update, invoice history) so the portal works
 * without a manual Dashboard step. Can be overridden with
 * STRIPE_PORTAL_CONFIGURATION_ID.
 */
export async function ensurePortalConfiguration(
  stripe: Stripe,
  siteUrl: string,
): Promise<string> {
  const fromEnv = process.env.STRIPE_PORTAL_CONFIGURATION_ID?.trim();
  if (fromEnv) return fromEnv;
  if (cachedConfigId) return cachedConfigId;

  const list = await stripe.billingPortal.configurations.list({ active: true, limit: 20 });
  const existing =
    list.data.find((c) => c.is_default) ??
    list.data.find((c) => c.metadata?.app === "kilometrowka") ??
    null;
  if (existing) {
    cachedConfigId = existing.id;
    return existing.id;
  }

  const created = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: "Kilometrówka.app — zarządzanie subskrypcją Premium",
      privacy_policy_url: `${siteUrl}/polityka-prywatnosci`,
      terms_of_service_url: `${siteUrl}/regulamin`,
    },
    default_return_url: `${siteUrl}/konto`,
    features: {
      customer_update: { enabled: true, allowed_updates: ["email", "name", "address", "tax_id"] },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
        proration_behavior: "none",
      },
      subscription_update: { enabled: false },
    },
    metadata: { app: "kilometrowka" },
  });
  cachedConfigId = created.id;
  return created.id;
}

export async function createPortalSession(
  stripe: Stripe,
  customerId: string,
  siteUrl: string,
): Promise<string> {
  const configuration = await ensurePortalConfiguration(stripe, siteUrl);
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    configuration,
    return_url: `${siteUrl}/konto`,
    locale: "pl",
  });
  return session.url;
}

/** Statuses for which a new purchase must be blocked (W2). */
/** Subscription statuses that block a new purchase (manage it in the portal instead). */
export const BLOCKING_SUB_STATUSES = new Set(["active", "trialing", "past_due"]);

/** Statuses to cancel when the account is deleted (anything that can still bill). */
export const CANCELLABLE_SUB_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "incomplete",
  "unpaid",
]);
