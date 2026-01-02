import { db } from "../db";
import { personalityProfiles, personalityDriftLog, growthBoundaries, type PersonalityProfile } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface PersonalityPreset {
  name: string;
  responseStyle: string;
  formalityLevel: number;
  humorLevel: number;
  verbosityLevel: number;
}

export class PersonalityService {
  private readonly PRESETS: Record<string, PersonalityPreset> = {
    calm: { name: "calm", responseStyle: "balanced", formalityLevel: 6, humorLevel: 2, verbosityLevel: 5 },
    efficient: { name: "efficient", responseStyle: "concise", formalityLevel: 7, humorLevel: 1, verbosityLevel: 3 },
    friendly: { name: "friendly", responseStyle: "balanced", formalityLevel: 4, humorLevel: 6, verbosityLevel: 6 },
    formal: { name: "formal", responseStyle: "detailed", formalityLevel: 9, humorLevel: 1, verbosityLevel: 7 },
  };

  async createProfile(data: {
    userId?: number;
    variantId?: string;
    presetName?: string;
    customTraits?: Record<string, any>;
  }): Promise<PersonalityProfile> {
    const preset = data.presetName ? this.PRESETS[data.presetName] : this.PRESETS.calm;
    
    const [profile] = await db.insert(personalityProfiles).values({
      userId: data.userId,
      variantId: data.variantId,
      presetName: preset.name,
      responseStyle: preset.responseStyle,
      formalityLevel: preset.formalityLevel,
      humorLevel: preset.humorLevel,
      verbosityLevel: preset.verbosityLevel,
      customTraits: data.customTraits,
    }).returning();
    
    return profile;
  }

  async getProfile(userId?: number, variantId?: string): Promise<PersonalityProfile | null> {
    const conditions = [];
    if (userId) conditions.push(eq(personalityProfiles.userId, userId));
    if (variantId) conditions.push(eq(personalityProfiles.variantId, variantId));
    
    if (conditions.length === 0) return null;
    
    const [profile] = await db.select()
      .from(personalityProfiles)
      .where(and(...conditions));
    
    return profile || null;
  }

  async updateProfile(profileId: string, changes: Partial<PersonalityProfile>): Promise<boolean> {
    const [current] = await db.select()
      .from(personalityProfiles)
      .where(eq(personalityProfiles.id, profileId));
    
    if (!current) return false;
    
    for (const [key, newValue] of Object.entries(changes)) {
      const oldValue = (current as any)[key];
      if (oldValue !== newValue) {
        await this._logDriftInternal(profileId, "style_change", String(oldValue), String(newValue), true);
      }
    }
    
    await db.update(personalityProfiles)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(personalityProfiles.id, profileId));
    
    return true;
  }

  async applyPreset(profileId: string, presetName: string): Promise<boolean> {
    const preset = this.PRESETS[presetName];
    if (!preset) return false;
    
    return this.updateProfile(profileId, {
      presetName,
      responseStyle: preset.responseStyle,
      formalityLevel: preset.formalityLevel,
      humorLevel: preset.humorLevel,
      verbosityLevel: preset.verbosityLevel,
    });
  }

  async checkBoundaryViolation(variantId: string, requestedAction: string): Promise<{ allowed: boolean; reason?: string }> {
    const [boundary] = await db.select()
      .from(growthBoundaries)
      .where(and(
        eq(growthBoundaries.variantId, variantId),
        eq(growthBoundaries.boundaryType, requestedAction)
      ));
    
    if (!boundary || !boundary.isEnforced) {
      return { allowed: true };
    }
    
    await db.update(growthBoundaries)
      .set({ 
        violationCount: (boundary.violationCount || 0) + 1,
        lastViolationAt: new Date(),
      })
      .where(eq(growthBoundaries.id, boundary.id));
    
    return { allowed: false, reason: `${requestedAction} is not allowed for this variant` };
  }

  async setupBoundaries(variantId: string): Promise<void> {
    const boundaryTypes = ["tier_upgrade", "subject_expansion", "safety"];
    
    for (const boundaryType of boundaryTypes) {
      await db.insert(growthBoundaries).values({
        variantId,
        boundaryType,
        isEnforced: true,
      }).onConflictDoNothing();
    }
  }

  async logDrift(profileId: string, data: {
    attribute: string;
    oldValue: number | string;
    newValue: number | string;
  }): Promise<{ logged: boolean }> {
    await db.insert(personalityDriftLog).values({
      profileId,
      driftType: data.attribute,
      previousValue: String(data.oldValue),
      newValue: String(data.newValue),
      wasAllowed: true,
    });
    return { logged: true };
  }

  private async _logDriftInternal(
    profileId: string,
    driftType: string,
    previousValue: string,
    newValue: string,
    wasAllowed: boolean
  ): Promise<void> {
    await db.insert(personalityDriftLog).values({
      profileId,
      driftType,
      previousValue,
      newValue,
      wasAllowed,
    });
  }

  isWithinBoundary(profile: PersonalityProfile, attribute: string, value: number): boolean {
    const maxValues: Record<string, number> = {
      formalityLevel: 10,
      humorLevel: 10,
      verbosityLevel: 10,
    };
    return value <= (maxValues[attribute] || 10);
  }

  isForbiddenChange(changeType: string): boolean {
    const forbidden = ["core_identity", "safety_override", "ethics_bypass"];
    return forbidden.includes(changeType);
  }

  async resetProfile(profileId: string, presetName: string = "calm"): Promise<boolean> {
    const preset = this.PRESETS[presetName];
    if (!preset) return false;
    
    await this._logDriftInternal(profileId, "admin_reset", "custom", presetName, true);
    
    await db.update(personalityProfiles)
      .set({
        presetName,
        responseStyle: preset.responseStyle,
        formalityLevel: preset.formalityLevel,
        humorLevel: preset.humorLevel,
        verbosityLevel: preset.verbosityLevel,
        customTraits: {},
        updatedAt: new Date(),
      })
      .where(eq(personalityProfiles.id, profileId));
    
    return true;
  }

  getAvailablePresets(): PersonalityPreset[] {
    return Object.values(this.PRESETS);
  }
}

export const personalityService = new PersonalityService();
