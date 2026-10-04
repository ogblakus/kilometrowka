import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createUser, getUser, type DbUser } from "@/lib/users";

/**
 * Auth + DB user for API routes.
 * Hot path is one SELECT: Clerk Backend API (`currentUser()`) and the
 * INSERT are used only when the row does not exist yet (first request) or
 * has no e-mail (row pre-created by a webhook). Audit S5.
 */
export async function requireAuthUser(): Promise<
  | { ok: true; userId: string; dbUser: DbUser }
  | { ok: false; status: number; error: string }
> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, status: 401, error: "Wymagane logowanie." };
  }

  try {
    let dbUser = await getUser(userId);
    if (!dbUser || !dbUser.email) {
      const user = await currentUser();
      const email =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress ||
        null;
      dbUser = await createUser(userId, email);
    }
    return { ok: true, userId, dbUser };
  } catch (err) {
    console.error("[auth-api] user lookup", err);
    return { ok: false, status: 503, error: "Baza danych niedostępna." };
  }
}
