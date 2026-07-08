import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app";
import { store } from "../src/lib/inMemoryStore";

describe("Auth routes", () => {
  beforeEach(() => {
    store.passwordResetTokens = [];
  });

  it("issues a reset token and accepts a new password", async () => {
    const forgotResponse = await request(app).post("/api/auth/forgot-password").send({
      email: "client@rasilwela.test"
    });

    expect(forgotResponse.status).toBe(200);
    expect(forgotResponse.body.resetToken).toBeTruthy();

    const resetResponse = await request(app).post("/api/auth/reset-password").send({
      token: forgotResponse.body.resetToken,
      password: "NewPassword123!"
    });

    expect(resetResponse.status).toBe(200);

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "client@rasilwela.test",
      password: "NewPassword123!"
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.user.email).toBe("client@rasilwela.test");
  });
});
