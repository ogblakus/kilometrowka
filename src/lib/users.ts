import "server-only";
import { getDb } from "@/lib/db";
import type { Plan } from "@/lib/plan";
import type { EwidencjaProfile } from "@/lib/types";

/**
 * Grace period after current_period_end before Premium stops counting even
 * without a webhook (S6: a lost `customer.subscription.deleted` must not
 * grant Premium forever).
 */
export const PREMIUM_GRACE_DAYS = 3;

export type DbUser = {
  clerk_user_id: string;
  email: string | null;
  /** Effective plan (stored plan + period-end grace check). */
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
};

type UserRow = Omit<DbUser, "plan" | "current_period_end"> & {
  plan: string;
  current_period_end: string | Date | null;
};

export function effectivePlan(
  plan: string,
  currentPeriodEnd: string | Date | null,
  now: Date = new Date(),
): Plan {
  if (plan !== "premium") return "free";
  if (!currentPeriodEnd) return "premium";
  const end = new Date(currentPeriodEnd).getTime();
  if (Number.isNaN(end)) return "premium";
  return end > now.getTime() - PREMIUM_GRACE_DAYS * 86_400_000 ? "premium" : "free";
}

function toDbUser(row: UserRow): DbUser {
  const cpe =
    row.current_period_end instanceof Date
      ? row.current_period_end.toISOString()
      : row.current_period_end;
  return {
    clerk_user_id: row.clerk_user_id,
    email: row.email,
    plan: effectivePlan(row.plan, cpe),
    stripe_customer_id: row.stripe_customer_id,
    stripe_subscription_id: row.stripe_subscription_id,
    subscription_status: row.subscription_status,
    current_period_end: cpe,
  };
}

/** Read-only lookup (no write on every request — S5). */
export async function getUser(clerkUserId: string): Promise<DbUser | null> {
  const db = getDb();
  const rows = await db`
    SELECT clerk_user_id, email, plan, stripe_customer_id, stripe_subscription_id,
           subscription_status, current_period_end
    FROM users WHERE clerk_user_id = ${clerkUserId}
  `;
  return rows[0] ? toDbUser(rows[0] as UserRow) : null;
}

/**
 * Create the row on first authenticated request (or fill a missing e-mail on
 * a row pre-created by a webhook). Does not overwrite an existing e-mail;
 * e-mail changes arrive via the Clerk `user.updated` webhook.
 */
export async function createUser(
  clerkUserId: string,
  email: string | null | undefined,
): Promise<DbUser> {
  const db = getDb();
  const normalized = email?.trim().toLowerCase() || null;
  const rows = await db`
    INSERT INTO users (clerk_user_id, email, plan, updated_at)
    VALUES (${clerkUserId}, ${normalized}, 'free', NOW())
    ON CONFLICT (clerk_user_id) DO UPDATE SET
      email = COALESCE(users.email, EXCLUDED.email),
      updated_at = CASE WHEN users.email IS NULL THEN NOW() ELSE users.updated_at END
    RETURNING clerk_user_id, email, plan, stripe_customer_id, stripe_subscription_id,
              subscription_status, current_period_end
  `;
  return toDbUser(rows[0] as UserRow);
}

export async function updateUserEmail(
  clerkUserId: string,
  email: string | null,
): Promise<void> {
  const db = getDb();
  const normalized = email?.trim().toLowerCase() || null;
  if (!normalized) return;
  await db`
    UPDATE users SET email = ${normalized}, updated_at = NOW()
    WHERE clerk_user_id = ${clerkUserId} AND email IS DISTINCT FROM ${normalized}
  `;
}

type ProfileRow = {
  full_name: string | null;
  address: string | null;
  employer: string | null;
  vehicle_registration: string | null;
  vehicle_engine_cc: number | null;
};

function rowToProfile(r: ProfileRow | undefined): EwidencjaProfile {
  return {
    fullName: r?.full_name ?? "",
    address: r?.address ?? "",
    employer: r?.employer ?? "",
    vehicleRegistration: r?.vehicle_registration ?? "",
    vehicleEngineCc: Number(r?.vehicle_engine_cc ?? 0) || 0,
  };
}

export async function getProfile(clerkUserId: string): Promise<EwidencjaProfile> {
  const db = getDb();
  const rows = await db`
    SELECT full_name, address, employer, vehicle_registration, vehicle_engine_cc
    FROM users WHERE clerk_user_id = ${clerkUserId}
  `;
  return rowToProfile(rows[0] as ProfileRow | undefined);
}

export async function updateProfile(
  clerkUserId: string,
  p: EwidencjaProfile,
): Promise<EwidencjaProfile> {
  const db = getDb();
  const rows = await db`
    UPDATE users SET
      full_name = ${p.fullName || null},
      address = ${p.address || null},
      employer = ${p.employer || null},
      vehicle_registration = ${p.vehicleRegistration || null},
      vehicle_engine_cc = ${p.vehicleEngineCc || null},
      updated_at = NOW()
    WHERE clerk_user_id = ${clerkUserId}
    RETURNING full_name, address, employer, vehicle_registration, vehicle_engine_cc
  `;
  return rowToProfile(rows[0] as ProfileRow | undefined);
}

/**
 * Delete the user row; trips and trip_quota go via ON DELETE CASCADE.
 * Returns the Stripe ids so the caller can cancel the subscription.
 */
export async function deleteUserData(clerkUserId: string): Promise<{
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
} | null> {
  const db = getDb();
  const rows = await db`
    DELETE FROM users WHERE clerk_user_id = ${clerkUserId}
    RETURNING stripe_customer_id, stripe_subscription_id
  `;
  const suffix = ":" + clerkUserId;
  await db`DELETE FROM rate_limits WHERE right(key, ${suffix.length}) = ${suffix}`;
  const r = rows[0] as
    | { stripe_customer_id: string | null; stripe_subscription_id: string | null }
    | undefined;
  return r
    ? { stripeCustomerId: r.stripe_customer_id, stripeSubscriptionId: r.stripe_subscription_id }
    : null;
}
