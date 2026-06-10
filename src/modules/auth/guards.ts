import { redirect } from "next/navigation";
import { auth } from "./config";

/** Guards de autorização para Server Components / Server Actions. */

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  return session.user;
}

export async function requireRole(role: "ADMIN" | "GUARDIAN" | "JUDGE") {
  const user = await requireUser();
  if (user.role !== role) redirect("/");
  return user;
}
