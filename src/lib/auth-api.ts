import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ensureUser, type DbUser } from "@/lib/users";

export async function requireAuthUser(): Promise<
  | { ok: true; userId: string; dbUser: DbUser }
  | { ok: false; status: number; error: string }
> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, status: 401, error: "Wymagane logowanie." };
  }

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    null;

  try {
    const dbUser = await ensureUser(userId, email);
    return { ok: true, userId, dbUser };
  } catch (err) {
    console.error("[auth-api] ensureUser", err);
    return { ok: false, status: 503, error: "Baza danych niedostępna." };
  }
}
