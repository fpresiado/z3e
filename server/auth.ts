import { db } from "./db";
import { users, userMastery } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

const JWT_SECRET = process.env.JWT_SECRET || "zeus-secret-key-change-in-production";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role?: string;
  has2FA?: boolean;
  requires2FA?: boolean;
}

export interface AuthToken {
  token: string;
  user: AuthUser;
  requires2FA?: boolean;
  needsPasswordSetup?: boolean;
}

export class AuthService {
  async register(username: string, email: string, password: string): Promise<AuthToken> {
    const existing = await db.execute(sql`
      SELECT id FROM users WHERE username = ${username}
    `);
    
    if (existing.rows && existing.rows.length > 0) {
      throw new Error("Username already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.execute(sql`
      INSERT INTO users (username, email, password)
      VALUES (${username}, ${email}, ${hashedPassword})
      RETURNING id, username, email
    `);

    const user = result.rows[0] as any;

    await db.execute(sql`
      INSERT INTO user_mastery (user_id, overall_mastery)
      VALUES (${user.id}, 0)
      ON CONFLICT (user_id) DO NOTHING
    `);

    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return {
      token,
      user: {
        id: String(user.id),
        username: user.username,
        email: user.email,
      },
    };
  }

  async login(username: string, password: string): Promise<AuthToken> {
    const result = await db.execute(sql`
      SELECT id, username, email, password, totp_secret
      FROM users WHERE username = ${username}
    `);

    if (!result.rows || result.rows.length === 0) {
      throw new Error("Invalid credentials");
    }

    const user = result.rows[0] as any;

    if (!user.password || user.password === "NEEDS_SETUP") {
      return {
        token: "",
        user: {
          id: String(user.id),
          username: user.username,
          email: user.email,
          has2FA: false,
        },
        needsPasswordSetup: true,
      };
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error("Invalid credentials");
    }

    if (user.totp_secret) {
      const pendingToken = jwt.sign(
        { userId: user.id, username: user.username, email: user.email, pending2FA: true },
        JWT_SECRET,
        { expiresIn: "5m" }
      );

      return {
        token: pendingToken,
        user: {
          id: String(user.id),
          username: user.username,
          email: user.email,
          has2FA: true,
        },
        requires2FA: true,
      };
    }

    const role = (user as any).role || "user";
    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email, role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return {
      token,
      user: {
        id: String(user.id),
        username: user.username,
        email: user.email,
        has2FA: false,
      },
      requires2FA: false,
    };
  }

  async setPassword(userId: string, password: string): Promise<{ success: boolean; requires2FA: boolean }> {
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(sql`
      UPDATE users SET password = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${parseInt(userId)}
    `);

    const userResult = await db.execute(sql`
      SELECT totp_secret FROM users WHERE id = ${parseInt(userId)}
    `);
    
    const has2FA = !!(userResult.rows?.[0] as any)?.totp_secret;

    return { success: true, requires2FA: !has2FA };
  }

  async complete2FALogin(userId: string, token: string): Promise<AuthToken> {
    const result = await db.execute(sql`
      SELECT id, username, email, totp_secret FROM users WHERE id = ${parseInt(userId)}
    `);

    if (!result.rows || result.rows.length === 0) {
      throw new Error("User not found");
    }

    const user = result.rows[0] as any;

    if (!user.totp_secret) {
      throw new Error("2FA not enabled for this user");
    }

    const valid = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: "base32",
      token: token,
      window: 2,
    });

    if (!valid) {
      throw new Error("Invalid verification code");
    }

    const fullToken = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return {
      token: fullToken,
      user: {
        id: String(user.id),
        username: user.username,
        email: user.email,
        has2FA: true,
      },
    };
  }

  async setup2FA(userId: string): Promise<{ secret: string; qrCode: string; otpauthUrl: string }> {
    const userResult = await db.execute(sql`
      SELECT username, email FROM users WHERE id = ${parseInt(userId)}
    `);

    if (!userResult.rows || userResult.rows.length === 0) {
      throw new Error("User not found");
    }

    const user = userResult.rows[0] as any;

    const secret = speakeasy.generateSecret({
      name: `Zeus3:${user.username}`,
      issuer: "Zeus 3 Learning System",
      length: 20,
    });

    await db.execute(sql`
      UPDATE users SET totp_secret = ${secret.base32}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${parseInt(userId)}
    `);

    const qrCode = await QRCode.toDataURL(secret.otpauth_url || "");

    return {
      secret: secret.base32,
      qrCode,
      otpauthUrl: secret.otpauth_url || "",
    };
  }

  async verify2FA(userId: string, token: string): Promise<{ valid: boolean }> {
    const result = await db.execute(sql`
      SELECT totp_secret FROM users WHERE id = ${parseInt(userId)}
    `);

    if (!result.rows || result.rows.length === 0) {
      throw new Error("User not found");
    }

    const user = result.rows[0] as any;

    if (!user.totp_secret) {
      throw new Error("2FA not set up for this user");
    }

    const valid = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: "base32",
      token: token,
      window: 2,
    });

    return { valid };
  }

  async disable2FA(userId: string): Promise<{ success: boolean }> {
    await db.execute(sql`
      UPDATE users SET totp_secret = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${parseInt(userId)}
    `);

    return { success: true };
  }

  async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return {
        id: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role || "user",
      };
    } catch (error) {
      return null;
    }
  }

  async getUserById(userId: string): Promise<AuthUser | null> {
    const result = await db.execute(sql`
      SELECT id, username, email, totp_secret FROM users WHERE id = ${parseInt(userId)}
    `);

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0] as any;
    return {
      id: String(user.id),
      username: user.username,
      email: user.email,
      has2FA: !!user.totp_secret,
    };
  }
}

export const authService = new AuthService();
