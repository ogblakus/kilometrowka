import "server-only";
import { getDb } from "@/lib/db";
import type { Plan } from "@/lib/plan";

export type DbUser = {
  clerk_user_id: string;
  email: string | null;
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

/** Upsert user row from Clerk identity. Returns current DB user. */
export async function ensureUser(
  clerkUserId: string,
  email: string | null | undefined,
): Promise<DbUser> {
  const db = getDb();
  const normalized = email?.trim().toLowerCase() || null;

  const rows = await db`
    INSERT INTO users (clerk_user_id, email, plan, updated_at)
    VALUES (${clerkUserId}, ${normalized}, 'free', NOW())
    ON CONFLICT (clerk_user_id) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, users.email),
      updated_at = NOW()
    RETURNING clerk_user_id, email, plan, stripe_customer_id, stripe_subscription_id
  `;

  const row = rows[0] as DbUser;
  return {
    ...row,
    plan: row.plan === "premium" ? "premium" : "free",
  };
}

export async function setUserPlan(
  clerkUserId: string,
  plan: Plan,
  extras?: {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
  },
): Promise<DbUser | null> {
  const db = getDb();
  const customerId = extras?.stripeCustomerId ?? null;
  const subId = extras?.stripeSubscriptionId ?? null;

  const rows = await db`
    UPDATE users SET
      plan = ${plan},
      stripe_customer_id = COALESCE(${customerId}, stripe_customer_id),
      stripe_subscription_id = COALESCE(${subId}, stripe_subscription_id),
      updated_at = NOW()
    WHERE clerk_user_id = ${clerkUserId}
    RETURNING clerk_user_id, email, plan, stripe_customer_id, stripe_subscription_id
  `;

  if (!rows[0]) return null;
  const row = rows[0] as DbUser;
  return {
    ...row,
    plan: row.plan === "premium" ? "premium" : "free",
  };
}
