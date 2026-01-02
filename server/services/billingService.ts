import { db } from "../db";
import { billingRecords, subscriptions, licenseStatus, type BillingRecord, type Subscription } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export class BillingService {
  async createBillingRecord(data: {
    userId?: number;
    variantId?: string;
    estimateId?: string;
    amountUsd: number;
    paymentMethod?: string;
    notes?: string;
  }): Promise<BillingRecord> {
    const invoiceNumber = `INV-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`;
    
    const [record] = await db.insert(billingRecords).values({
      userId: data.userId,
      variantId: data.variantId,
      estimateId: data.estimateId,
      amountUsd: data.amountUsd.toFixed(2),
      paymentMethod: data.paymentMethod,
      invoiceNumber,
      notes: data.notes,
    }).returning();
    
    return record;
  }

  async markAsPaid(billingId: string, transactionId?: string): Promise<boolean> {
    const result = await db.update(billingRecords)
      .set({ 
        paymentStatus: "completed", 
        paidAt: new Date(),
        transactionId,
      })
      .where(eq(billingRecords.id, billingId))
      .returning();
    return result.length > 0;
  }

  async processChargeback(billingId: string): Promise<void> {
    const [record] = await db.select()
      .from(billingRecords)
      .where(eq(billingRecords.id, billingId));
    
    if (!record) return;
    
    await db.update(billingRecords)
      .set({ paymentStatus: "chargeback" })
      .where(eq(billingRecords.id, billingId));
    
    if (record.variantId) {
      await db.update(licenseStatus)
        .set({ 
          isValid: false, 
          terminationReason: "Chargeback detected - license auto-terminated",
          terminatedAt: new Date(),
          chargebackDetected: true,
        })
        .where(eq(licenseStatus.variantId, record.variantId));
    }
  }

  async createSubscription(data: {
    userId?: number;
    variantId?: string;
    planType: "one_time" | "monthly" | "yearly";
    tier: number;
    endDate?: Date;
  }): Promise<Subscription> {
    const [subscription] = await db.insert(subscriptions).values({
      userId: data.userId,
      variantId: data.variantId,
      planType: data.planType,
      tier: data.tier,
      endDate: data.endDate,
      renewalDate: data.planType !== "one_time" ? data.endDate : undefined,
    }).returning();
    
    if (data.variantId) {
      await db.insert(licenseStatus).values({
        userId: data.userId,
        variantId: data.variantId,
        isValid: true,
      });
    }
    
    return subscription;
  }

  async cancelSubscription(subscriptionId: string, reason?: string): Promise<boolean> {
    const result = await db.update(subscriptions)
      .set({ 
        status: "cancelled", 
        cancelledAt: new Date(),
        cancelReason: reason,
      })
      .where(eq(subscriptions.id, subscriptionId))
      .returning();
    return result.length > 0;
  }

  async checkLicenseValidity(variantId: string): Promise<{ valid: boolean; reason?: string }> {
    const [license] = await db.select()
      .from(licenseStatus)
      .where(eq(licenseStatus.variantId, variantId));
    
    if (!license) {
      return { valid: false, reason: "No license found" };
    }
    
    if (!license.isValid) {
      return { valid: false, reason: license.terminationReason || "License terminated" };
    }
    
    if (license.chargebackDetected) {
      return { valid: false, reason: "License terminated due to chargeback" };
    }
    
    return { valid: true };
  }

  async getUpgradePath(currentTier: number): Promise<{ tier: number; priceIncrease: number }[]> {
    const paths: { tier: number; priceIncrease: number }[] = [];
    const basePrice = 100;
    
    for (let tier = currentTier + 1; tier <= 9; tier++) {
      const currentPrice = basePrice * Math.pow(1.5, currentTier - 1);
      const newPrice = basePrice * Math.pow(1.5, tier - 1);
      paths.push({ tier, priceIncrease: newPrice - currentPrice });
    }
    
    return paths;
  }

  async getUserBillingHistory(userId: number): Promise<BillingRecord[]> {
    return db.select()
      .from(billingRecords)
      .where(eq(billingRecords.userId, userId));
  }

  async handleChargeback(transactionId: string, reason: string): Promise<{ handled: boolean }> {
    const [record] = await db.select()
      .from(billingRecords)
      .where(eq(billingRecords.transactionId, transactionId));
    
    if (record) {
      await this.processChargeback(record.id);
    }
    return { handled: true };
  }

  async terminateLicense(variantId: string, reason: string): Promise<{ terminated: boolean }> {
    await db.update(licenseStatus)
      .set({
        isValid: false,
        terminationReason: reason,
        terminatedAt: new Date(),
      })
      .where(eq(licenseStatus.variantId, variantId));
    return { terminated: true };
  }
}

export const billingService = new BillingService();
