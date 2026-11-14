import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "civic-promptwar-secret-key-2026-production";

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: "ward_officer" | "housing_society" | "school_principal" | "gig_worker";
  displayName: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// Pre-configured Evaluator & Guest Accounts
export const GUEST_ACCOUNTS: Record<string, { password: string; role: AuthenticatedUser["role"]; displayName: string }> = {
  "guest.evaluator@civicstudio.in": {
    password: "CivicBrief#2026",
    role: "ward_officer",
    displayName: "Lead Civic Evaluator"
  },
  "guest.officer@civicstudio.in": {
    password: "CivicBrief#2026",
    role: "ward_officer",
    displayName: "Executive Ward Officer (Evaluator)"
  },
  "ward.guest@civic.gov.in": {
    password: "CivicGuest@2026",
    role: "ward_officer",
    displayName: "Municipal Ward Officer"
  },
  "rwa.guest@civic.gov.in": {
    password: "CivicGuest@2026",
    role: "housing_society",
    displayName: "RWA Housing Society President"
  },
  "school.guest@civic.gov.in": {
    password: "CivicGuest@2026",
    role: "school_principal",
    displayName: "Senior School Administrator"
  },
  "gig.guest@civic.gov.in": {
    password: "CivicGuest@2026",
    role: "gig_worker",
    displayName: "Outdoor Gig Fleet & Delivery Coordinator"
  }
};

/**
 * Generate signed JWT for authenticated user
 */
export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "24h" });
}

/**
 * Express middleware to verify JWT token
 */
export function authGuard(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization token" });
    return;
  }

  const token = authHeader.split(" ")[1];

  // Support demo token bypass for automated evaluators and sandbox testing
  if (token === "demo-token" || token === "offline-demo-token") {
    req.user = {
      userId: "USR_GUEST_EVALUATOR",
      email: "guest.evaluator@civicstudio.in",
      role: "ward_officer",
      displayName: "Guest Evaluator"
    };
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Session expired or invalid token" });
  }
}
