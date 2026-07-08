import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import type { UserRole } from "@stagebook/shared";
import { env } from "../../config/env";
import { AppError } from "../../lib/errors";
import { sanitizeUser, store } from "../../lib/inMemoryStore";
import { createResetToken, hashPassword, verifyPassword } from "./password";

export class AuthService {
  signup(input: {
    email: string;
    password: string;
    displayName: string;
    role?: UserRole;
  }) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      throw new AppError("Invalid email address", 400);
    }
    if (input.password.length < 8) {
      throw new AppError("Password must be at least 8 characters", 400);
    }
    if (input.role === "admin") {
      throw new AppError("Admin accounts cannot be created through public signup", 403);
    }
    const existing = store.users.find((user) => user.email.toLowerCase() === input.email.toLowerCase());
    if (existing) {
      throw new AppError("Email already in use", 409);
    }

    const user = {
      id: uuid(),
      email: input.email,
      passwordHash: hashPassword(input.password),
      displayName: input.displayName,
      role: input.role ?? "client"
    };

    store.users.push(user);
    return this.issueToken(user.id, user.email, user.role, sanitizeUser(user));
  }

  login(input: { email: string; password: string }) {
    const user = store.users.find((entry) => entry.email.toLowerCase() === input.email.toLowerCase());
    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw new AppError("Invalid credentials", 401);
    }

    return this.issueToken(user.id, user.email, user.role, sanitizeUser(user));
  }

  getCurrentUser(userId: string) {
    const user = store.users.find((entry) => entry.id === userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    return sanitizeUser(user);
  }

  requestPasswordReset(input: { email: string }) {
    const message = "If an account exists for this email, a reset link has been prepared.";
    const user = store.users.find((entry) => entry.email.toLowerCase() === input.email.toLowerCase());

    if (!user) {
      return { message };
    }

    const token = createResetToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();
    store.passwordResetTokens = store.passwordResetTokens.filter((entry) => entry.email !== user.email);
    store.passwordResetTokens.push({
      id: uuid(),
      email: user.email,
      token,
      expiresAt
    });

    return {
      message,
      resetToken: token,
      expiresAt
    };
  }

  resetPassword(input: { token: string; password: string }) {
    if (input.password.length < 8) {
      throw new AppError("Password must be at least 8 characters", 400);
    }

    const resetRecord = store.passwordResetTokens.find((entry) => entry.token === input.token);
    if (!resetRecord) {
      throw new AppError("Reset token is invalid", 400);
    }
    if (new Date(resetRecord.expiresAt).getTime() < Date.now()) {
      store.passwordResetTokens = store.passwordResetTokens.filter((entry) => entry.token !== input.token);
      throw new AppError("Reset token has expired", 400);
    }

    const user = store.users.find((entry) => entry.email === resetRecord.email);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    user.passwordHash = hashPassword(input.password);
    store.passwordResetTokens = store.passwordResetTokens.filter((entry) => entry.email !== user.email);

    return { message: "Password reset successful." };
  }

  private issueToken(userId: string, email: string, role: UserRole, user: ReturnType<typeof sanitizeUser>) {
    const token = jwt.sign({ userId, email, role }, env.jwtSecret, { expiresIn: "7d" });
    return { token, user };
  }
}

export const authService = new AuthService();
