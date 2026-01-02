import { db } from "../db";
import { securityTokens, tokenAbuseLog, type SecurityToken } from "@shared/schema";
import { eq, and, lt } from "drizzle-orm";
import crypto from "crypto";

export class LinkSecurityService {
  async createSecureToken(data: {
    tokenType: "activation" | "session" | "api" | "refresh";
    userId?: number;
    variantId?: string;
    deviceBinding?: string;
    ipBinding?: string;
    expiresInMinutes?: number;
  }): Promise<{ token: string; tokenId: string }> {
    const rawToken = crypto.randomBytes(48).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + (data.expiresInMinutes || 60));
    
    const [secToken] = await db.insert(securityTokens).values({
      tokenHash,
      tokenType: data.tokenType,
      userId: data.userId,
      variantId: data.variantId,
      deviceBinding: data.deviceBinding,
      ipBinding: data.ipBinding,
      expiresAt,
    }).returning();
    
    return { token: rawToken, tokenId: secToken.id };
  }

  async validateToken(rawToken: string, options?: {
    ipAddress?: string;
    deviceFingerprint?: string;
  }): Promise<{ valid: boolean; reason?: string; token?: SecurityToken }> {
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    
    const [token] = await db.select()
      .from(securityTokens)
      .where(eq(securityTokens.tokenHash, tokenHash));
    
    if (!token) {
      return { valid: false, reason: "Token not found" };
    }
    
    if (token.status !== "active") {
      await this.logAbuse(token.id, "expired_use", options?.ipAddress, options?.deviceFingerprint, "Token already used/revoked");
      return { valid: false, reason: `Token is ${token.status}` };
    }
    
    if (new Date(token.expiresAt) < new Date()) {
      await db.update(securityTokens).set({ status: "expired" }).where(eq(securityTokens.id, token.id));
      return { valid: false, reason: "Token has expired" };
    }
    
    if (token.ipBinding && options?.ipAddress && token.ipBinding !== options.ipAddress) {
      await this.logAbuse(token.id, "ip_mismatch", options.ipAddress, options.deviceFingerprint, `Expected ${token.ipBinding}, got ${options.ipAddress}`);
      return { valid: false, reason: "IP address mismatch" };
    }
    
    if (token.deviceBinding && options?.deviceFingerprint && token.deviceBinding !== options.deviceFingerprint) {
      await this.logAbuse(token.id, "sharing", options.ipAddress, options.deviceFingerprint, "Device fingerprint mismatch");
      return { valid: false, reason: "Device mismatch - possible token sharing" };
    }
    
    return { valid: true, token };
  }

  async rotateToken(oldToken: string): Promise<{ newToken: string; newTokenId: string } | null> {
    const { valid, token } = await this.validateToken(oldToken);
    if (!valid || !token) return null;
    
    await db.update(securityTokens)
      .set({ status: "rotated" })
      .where(eq(securityTokens.id, token.id));
    
    const newExpiry = new Date();
    newExpiry.setHours(newExpiry.getHours() + 24);
    
    const newRawToken = crypto.randomBytes(48).toString("hex");
    const newTokenHash = crypto.createHash("sha256").update(newRawToken).digest("hex");
    
    const [newSecToken] = await db.insert(securityTokens).values({
      tokenHash: newTokenHash,
      tokenType: token.tokenType,
      userId: token.userId,
      variantId: token.variantId,
      deviceBinding: token.deviceBinding,
      ipBinding: token.ipBinding,
      expiresAt: newExpiry,
      rotatedFrom: token.id,
    }).returning();
    
    return { newToken: newRawToken, newTokenId: newSecToken.id };
  }

  async revokeToken(tokenId: string, reason?: string): Promise<boolean> {
    const result = await db.update(securityTokens)
      .set({ status: "revoked" })
      .where(eq(securityTokens.id, tokenId))
      .returning();
    return result.length > 0;
  }

  async revokeAllUserTokens(userId: number): Promise<number> {
    const result = await db.update(securityTokens)
      .set({ status: "revoked" })
      .where(and(
        eq(securityTokens.userId, userId),
        eq(securityTokens.status, "active")
      ))
      .returning();
    return result.length;
  }

  private async logAbuse(
    tokenId: string,
    abuseType: string,
    ipAddress?: string,
    deviceFingerprint?: string,
    details?: string
  ): Promise<void> {
    const severity = abuseType === "sharing" ? "high" : abuseType === "ip_mismatch" ? "medium" : "low";
    
    await db.insert(tokenAbuseLog).values({
      tokenId,
      abuseType,
      ipAddress,
      deviceFingerprint,
      details,
      severity,
      actionTaken: severity === "high" ? "token_revoked" : "logged",
    });
    
    if (severity === "high") {
      await this.revokeToken(tokenId, "Abuse detected");
    }
  }

  async getAbuseLog(tokenId?: string): Promise<typeof tokenAbuseLog.$inferSelect[]> {
    if (tokenId) {
      return db.select().from(tokenAbuseLog).where(eq(tokenAbuseLog.tokenId, tokenId));
    }
    return db.select().from(tokenAbuseLog);
  }

  async reportSuspiciousActivity(data: {
    tokenId: string;
    activityType: string;
    ipAddress?: string;
    deviceFingerprint?: string;
    details?: string;
  }): Promise<{ recorded: boolean }> {
    await db.insert(tokenAbuseLog).values({
      tokenId: data.tokenId,
      abuseType: data.activityType,
      ipAddress: data.ipAddress,
      deviceFingerprint: data.deviceFingerprint,
      details: data.details || `Suspicious activity: ${data.activityType}`,
      severity: "medium",
      actionTaken: "logged",
    });
    return { recorded: true };
  }
}

export const linkSecurityService = new LinkSecurityService();
