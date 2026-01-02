import { db } from "../db";
import { termsVersions, termsSignatures, type TermsVersion, type TermsSignature } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

export class TosService {
  async createTermsVersion(data: {
    version: string;
    title: string;
    content: string;
    effectiveDate: Date;
  }): Promise<TermsVersion> {
    const contentHash = crypto.createHash("sha256").update(data.content).digest("hex");
    
    const [terms] = await db.insert(termsVersions).values({
      version: data.version,
      title: data.title,
      content: data.content,
      contentHash,
      effectiveDate: data.effectiveDate,
      isActive: false,
    }).returning();
    
    return terms;
  }

  async getActiveTerms(): Promise<TermsVersion | null> {
    const [terms] = await db.select()
      .from(termsVersions)
      .where(eq(termsVersions.isActive, true))
      .orderBy(desc(termsVersions.effectiveDate))
      .limit(1);
    return terms || null;
  }

  async activateVersion(versionId: string): Promise<boolean> {
    await db.update(termsVersions).set({ isActive: false });
    const result = await db.update(termsVersions)
      .set({ isActive: true })
      .where(eq(termsVersions.id, versionId))
      .returning();
    return result.length > 0;
  }

  async signTerms(data: {
    termsVersionId: string;
    userId?: number;
    variantId?: string;
    signatureData?: string;
    ipAddress?: string;
    deviceFingerprint?: string;
  }): Promise<TermsSignature> {
    const [signature] = await db.insert(termsSignatures).values({
      termsVersionId: data.termsVersionId,
      userId: data.userId,
      variantId: data.variantId,
      signatureData: data.signatureData,
      ipAddress: data.ipAddress,
      deviceFingerprint: data.deviceFingerprint,
    }).returning();
    
    return signature;
  }

  async hasSignedCurrentTerms(userId: number): Promise<boolean> {
    const activeTerms = await this.getActiveTerms();
    if (!activeTerms) return true;
    
    const [signature] = await db.select()
      .from(termsSignatures)
      .where(eq(termsSignatures.userId, userId));
    
    return !!signature && signature.termsVersionId === activeTerms.id;
  }

  async getSignatureProof(signatureId: string): Promise<{ hash: string; timestamp: Date } | null> {
    const [signature] = await db.select()
      .from(termsSignatures)
      .where(eq(termsSignatures.id, signatureId));
    
    if (!signature) return null;
    
    const proofData = `${signature.id}:${signature.termsVersionId}:${signature.signedAt}`;
    const hash = crypto.createHash("sha256").update(proofData).digest("hex");
    
    return { hash, timestamp: signature.signedAt };
  }
}

export const tosService = new TosService();
