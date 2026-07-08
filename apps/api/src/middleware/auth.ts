import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "@stagebook/shared";
import { env } from "../config/env";
import { AppError } from "../lib/errors";

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    role: UserRole;
    email: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError("Missing bearer token", 401));
  }

  try {
    const payload = jwt.verify(header.replace("Bearer ", ""), env.jwtSecret) as AuthenticatedRequest["auth"];
    req.auth = payload;
    next();
  } catch {
    next(new AppError("Invalid token", 401));
  }
}

export function attachAuthIfPresent(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) {
    return next();
  }
  if (!header.startsWith("Bearer ")) {
    return next(new AppError("Invalid authorization header", 401));
  }

  try {
    const payload = jwt.verify(header.replace("Bearer ", ""), env.jwtSecret) as AuthenticatedRequest["auth"];
    req.auth = payload;
    next();
  } catch {
    next(new AppError("Invalid token", 401));
  }
}

export function requireRole(roles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new AppError("Unauthenticated", 401));
    }
    if (!roles.includes(req.auth.role)) {
      return next(new AppError("Forbidden", 403));
    }
    next();
  };
}
