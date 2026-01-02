import { db } from "../db";
import { aiVariants, variantRegistrations, type AiVariant, type InsertAiVariant } from "@shared/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export class VariantBuilderService {
  async createVariant(data: {
    name: string;
    edition: "FM" | "F" | "C";
    tier: number;
    subjects?: string[];
    abilities?: Record<string, boolean>;
    defenseModules?: string[];
    createdBy?: number;
  }): Promise<AiVariant> {
    const variantId = `ZEUS-${data.edition}-T${data.tier}-${uuidv4().slice(0, 8).toUpperCase()}`;
    
    const [variant] = await db.insert(aiVariants).values({
      variantId,
      name: data.name,
      edition: data.edition,
      tier: data.tier,
      subjects: data.subjects || [],
      abilities: data.abilities || {},
      defenseModules: data.defenseModules || [],
      createdBy: data.createdBy,
    }).returning();
    
    return variant;
  }

  async getVariant(id: string): Promise<AiVariant | null> {
    const [variant] = await db.select().from(aiVariants).where(eq(aiVariants.id, id));
    return variant || null;
  }

  async getVariantByVariantId(variantId: string): Promise<AiVariant | null> {
    const [variant] = await db.select().from(aiVariants).where(eq(aiVariants.variantId, variantId));
    return variant || null;
  }

  async listVariants(edition?: string): Promise<AiVariant[]> {
    if (edition) {
      return db.select().from(aiVariants).where(eq(aiVariants.edition, edition));
    }
    return db.select().from(aiVariants);
  }

  async registerDevice(variantId: string, deviceId: string, userId?: number): Promise<string> {
    const activationCode = `ACT-${uuidv4().slice(0, 12).toUpperCase()}`;
    
    await db.insert(variantRegistrations).values({
      variantId,
      userId,
      deviceId,
      activationCode,
      status: "pending",
    });
    
    return activationCode;
  }

  async activateRegistration(activationCode: string, ipAddress?: string): Promise<boolean> {
    const result = await db.update(variantRegistrations)
      .set({ 
        status: "active", 
        activatedAt: new Date(),
        ipAddress,
      })
      .where(eq(variantRegistrations.activationCode, activationCode))
      .returning();
    
    return result.length > 0;
  }

  async getEditionLimits(edition: string): Promise<{ maxTier: number; features: string[] }> {
    const limits: Record<string, { maxTier: number; features: string[] }> = {
      FM: { maxTier: 3, features: ["basic_chat", "learning_basic"] },
      F: { maxTier: 6, features: ["basic_chat", "learning_basic", "learning_advanced", "analytics_basic"] },
      C: { maxTier: 9, features: ["all"] },
    };
    return limits[edition] || limits.FM;
  }

  async lockVariant(variantId: string): Promise<boolean> {
    const result = await db.update(aiVariants)
      .set({ isLocked: true })
      .where(eq(aiVariants.variantId, variantId))
      .returning();
    return result.length > 0;
  }

  getAbilitiesForEdition(edition: string): string[] {
    const abilities: Record<string, string[]> = {
      FM: ["basic_learning", "chat", "progress_tracking"],
      F: ["basic_learning", "chat", "progress_tracking", "advanced_learning", "analytics", "defense_basic"],
      C: ["basic_learning", "chat", "progress_tracking", "advanced_learning", "analytics", "defense_basic", "defense_advanced", "fleet_management", "llm_engine", "variant_builder"],
    };
    return abilities[edition] || abilities.FM;
  }
}

export const variantBuilderService = new VariantBuilderService();
