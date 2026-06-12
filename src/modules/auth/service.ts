import "server-only";

import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import type { Prisma } from "@/generated/prisma/client";
import { sendPasswordResetEmail } from "@/shared/integrations/email/client";
import { db } from "@/shared/db";
import { env } from "@/shared/env";

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function buildPasswordResetUrl(token: string): string {
  return new URL(`/recuperar-senha/${token}`, env.NEXT_PUBLIC_APP_URL).toString();
}

async function findUserByIdentifier(identifier: string) {
  const normalized = identifier.trim().toLowerCase();

  if (normalized.includes("@")) {
    return db.user.findUnique({
      where: { email: normalized },
      select: { id: true, name: true, email: true },
    });
  }

  const cpf = identifier.replace(/\D/g, "");
  const guardian = await db.guardianProfile.findUnique({
    where: { cpf },
    select: { user: { select: { id: true, name: true, email: true } } },
  });

  return guardian?.user ?? null;
}

export async function requestPasswordReset(identifier: string): Promise<void> {
  const user = await findUserByIdentifier(identifier);
  if (!user) return;

  const token = randomBytes(32).toString("hex");
  const now = new Date();

  await db.$transaction([
    db.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: now },
    }),
    db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(now.getTime() + PASSWORD_RESET_TTL_MS),
      },
    }),
  ]);

  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl: buildPasswordResetUrl(token),
  });
}

export async function getPasswordResetTokenStatus(token: string): Promise<"valid" | "invalid"> {
  const resetToken = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { expiresAt: true, usedAt: true },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
    return "invalid";
  }

  return "valid";
}

export async function resetPasswordWithToken(params: {
  token: string;
  password: string;
}): Promise<{ email: string }> {
  const tokenHash = hashToken(params.token);
  const passwordHash = await bcrypt.hash(params.password, 10);

  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    const resetToken = await tx.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
        user: { select: { email: true } },
      },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
      throw new Error("Link de recuperação inválido ou expirado.");
    }

    const now = new Date();

    await tx.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash,
        requiresPasswordSetup: false,
        emailVerifiedAt: now,
      },
    });

    await tx.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: now },
    });

    await tx.passwordResetToken.updateMany({
      where: {
        userId: resetToken.userId,
        usedAt: null,
        id: { not: resetToken.id },
      },
      data: { usedAt: now },
    });

    return { email: resetToken.user.email };
  });
}
