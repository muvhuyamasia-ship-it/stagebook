import dotenv from "dotenv";

dotenv.config();

export const env = {
  appName: "StageBook API",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "stagebook-local-secret",
  webOrigin: process.env.WEB_ORIGIN ?? "*"
};
