import { beforeEach, describe, expect, it } from "vitest";
import { authService } from "../src/modules/auth/auth.service";
import { store } from "../src/lib/inMemoryStore";

describe("AuthService", () => {
  beforeEach(() => {
    store.users = [];
    store.passwordResetTokens = [];
  });

  it("creates a password reset token for a known account without exposing whether an email exists", () => {
    authService.signup({
      email: "client@rasilwela.test",
      password: "SecurePass123",
      displayName: "Client User",
      role: "client"
    });

    const known = authService.requestPasswordReset({ email: "client@rasilwela.test" });
    const unknown = authService.requestPasswordReset({ email: "unknown@rasilwela.test" });

    expect(known.message).toBe(unknown.message);
    expect(store.passwordResetTokens).toHaveLength(1);
    expect(store.passwordResetTokens[0]?.email).toBe("client@rasilwela.test");
  });

  it("resets a password with a valid token and invalidates the token afterward", () => {
    authService.signup({
      email: "client@rasilwela.test",
      password: "SecurePass123",
      displayName: "Client User",
      role: "client"
    });

    const resetRequest = authService.requestPasswordReset({ email: "client@rasilwela.test" });
    expect(resetRequest.resetToken).toBeDefined();

    authService.resetPassword({
      token: resetRequest.resetToken!,
      password: "EvenBetter456"
    });

    expect(() =>
      authService.login({
        email: "client@rasilwela.test",
        password: "SecurePass123"
      })
    ).toThrowError(/invalid credentials/i);

    expect(
      authService.login({
        email: "client@rasilwela.test",
        password: "EvenBetter456"
      }).token
    ).toBeTruthy();

    expect(store.passwordResetTokens).toHaveLength(0);
  });
});
