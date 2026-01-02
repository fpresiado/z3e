import { db } from "../db";
import { activationLinks, onboardingProgress, type ActivationLink } from "@shared/schema";
import { eq, and, lt } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

export class MobileActivationService {
  async createActivationLink(data: {
    variantId: string;
    recipientName?: string;
    recipientEmail?: string;
    expiresInHours?: number;
    maxUses?: number;
    createdBy?: number;
  }): Promise<{ link: ActivationLink; url: string }> {
    const linkToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (data.expiresInHours || 72));
    
    const [link] = await db.insert(activationLinks).values({
      linkToken,
      variantId: data.variantId,
      recipientName: data.recipientName,
      recipientEmail: data.recipientEmail,
      expiresAt,
      maxUses: data.maxUses || 1,
      createdBy: data.createdBy,
    }).returning();
    
    const baseUrl = process.env.MAINFRAME_URL || "https://zeus.local";
    const url = `${baseUrl}/activate/${linkToken}`;
    
    return { link, url };
  }

  async validateLink(linkToken: string): Promise<{ valid: boolean; reason?: string; link?: ActivationLink }> {
    const [link] = await db.select()
      .from(activationLinks)
      .where(eq(activationLinks.linkToken, linkToken));
    
    if (!link) {
      return { valid: false, reason: "Link not found" };
    }
    
    if (link.status === "revoked") {
      return { valid: false, reason: "Link has been revoked" };
    }
    
    if (new Date(link.expiresAt) < new Date()) {
      await db.update(activationLinks)
        .set({ status: "expired" })
        .where(eq(activationLinks.id, link.id));
      return { valid: false, reason: "Link has expired" };
    }
    
    if (link.usedCount >= (link.maxUses || 1)) {
      await db.update(activationLinks)
        .set({ status: "used" })
        .where(eq(activationLinks.id, link.id));
      return { valid: false, reason: "Link has reached maximum uses" };
    }
    
    return { valid: true, link };
  }

  async useLink(linkToken: string): Promise<boolean> {
    const { valid, link } = await this.validateLink(linkToken);
    if (!valid || !link) return false;
    
    await db.update(activationLinks)
      .set({ usedCount: (link.usedCount || 0) + 1 })
      .where(eq(activationLinks.id, link.id));
    
    return true;
  }

  async revokeLink(linkToken: string): Promise<boolean> {
    const result = await db.update(activationLinks)
      .set({ status: "revoked" })
      .where(eq(activationLinks.linkToken, linkToken))
      .returning();
    return result.length > 0;
  }

  async trackOnboardingStep(data: {
    userId?: number;
    variantId?: string;
    step: string;
  }): Promise<void> {
    await db.insert(onboardingProgress).values({
      userId: data.userId,
      variantId: data.variantId,
      step: data.step,
      completed: true,
      completedAt: new Date(),
    });
  }

  async getOnboardingProgress(userId: number): Promise<string[]> {
    const progress = await db.select()
      .from(onboardingProgress)
      .where(eq(onboardingProgress.userId, userId));
    
    return progress.filter(p => p.completed).map(p => p.step);
  }

  async isOnboardingComplete(userId: number): Promise<boolean> {
    const progress = await this.getOnboardingProgress(userId);
    const requiredSteps = ["tos_view", "tos_scroll", "tos_check", "signature", "complete"];
    return requiredSteps.every(step => progress.includes(step));
  }
}

export const mobileActivationService = new MobileActivationService();
