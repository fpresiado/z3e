import { db } from "../db";
import { costEstimates, pricingTables, type CostEstimate } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

interface CostBreakdown {
  buildTimeHours: number;
  energyCostUsd: number;
  hardwareWearUsd: number;
  laborCostUsd: number;
  totalCostUsd: number;
  kwhUsed: number;
  gpuHours: number;
  cpuHours: number;
}

export class CostEstimatorService {
  private readonly CA_KWH_RATE = 0.25;
  private readonly GPU_WATTS = 350;
  private readonly CPU_WATTS = 125;
  private readonly HARDWARE_WEAR_PER_HOUR = 0.50;
  private readonly LABOR_RATE_PER_HOUR = 75;

  private readonly TIER_MULTIPLIERS: Record<number, number> = {
    1: 1.0, 2: 1.5, 3: 2.0, 4: 3.0, 5: 4.5,
    6: 6.5, 7: 9.0, 8: 12.0, 9: 16.0,
  };

  private readonly SUBJECT_BASE_HOURS: Record<string, number> = {
    foundational: 2,
    debugging: 4,
    optimization: 6,
    architecture: 8,
    security: 10,
    ml_basics: 12,
    ml_advanced: 20,
    distributed: 16,
    quantum: 24,
  };

  async estimateCost(tier: number, subjects: string[]): Promise<CostEstimate> {
    const estimateId = `EST-${uuidv4().slice(0, 8).toUpperCase()}`;
    const tierMultiplier = this.TIER_MULTIPLIERS[tier] || 1.0;
    
    let totalBaseHours = 0;
    for (const subject of subjects) {
      totalBaseHours += this.SUBJECT_BASE_HOURS[subject] || 4;
    }
    
    const buildTimeHours = totalBaseHours * tierMultiplier;
    const gpuHours = buildTimeHours * 0.7;
    const cpuHours = buildTimeHours * 0.3;
    
    const gpuKwh = (gpuHours * this.GPU_WATTS) / 1000;
    const cpuKwh = (cpuHours * this.CPU_WATTS) / 1000;
    const totalKwh = gpuKwh + cpuKwh;
    
    const energyCost = totalKwh * this.CA_KWH_RATE;
    const hardwareWear = buildTimeHours * this.HARDWARE_WEAR_PER_HOUR;
    const laborCost = buildTimeHours * this.LABOR_RATE_PER_HOUR * (tier > 5 ? 1.5 : 1.0);
    const totalCost = energyCost + hardwareWear + laborCost;
    
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7);
    
    const [estimate] = await db.insert(costEstimates).values({
      estimateId,
      tier,
      subjects,
      buildTimeHours: buildTimeHours.toFixed(2),
      energyCostUsd: energyCost.toFixed(2),
      hardwareWearUsd: hardwareWear.toFixed(2),
      laborCostUsd: laborCost.toFixed(2),
      totalCostUsd: totalCost.toFixed(2),
      kwhUsed: totalKwh.toFixed(2),
      gpuHours: gpuHours.toFixed(2),
      cpuHours: cpuHours.toFixed(2),
      notes: "Pricing may change at any time. This estimate is valid for 7 days.",
      validUntil,
    }).returning();
    
    return estimate;
  }

  async getEstimate(estimateId: string): Promise<CostEstimate | null> {
    const [estimate] = await db.select()
      .from(costEstimates)
      .where(eq(costEstimates.estimateId, estimateId));
    return estimate || null;
  }

  async isEstimateValid(estimateId: string): Promise<boolean> {
    const estimate = await this.getEstimate(estimateId);
    if (!estimate || !estimate.validUntil) return false;
    return new Date(estimate.validUntil) > new Date();
  }

  getBreakdownExplanation(estimate: CostEstimate): string {
    return `
Cost Breakdown for Tier ${estimate.tier}:
- Build Time: ${estimate.buildTimeHours} hours
- GPU Time: ${estimate.gpuHours} hours (70% of build)
- CPU Time: ${estimate.cpuHours} hours (30% of build)
- Energy Used: ${estimate.kwhUsed} kWh @ $${this.CA_KWH_RATE}/kWh = $${estimate.energyCostUsd}
- Hardware Wear: $${estimate.hardwareWearUsd}
- Labor: $${estimate.laborCostUsd}
- TOTAL: $${estimate.totalCostUsd}

Note: ${estimate.notes}
    `.trim();
  }
}

export const costEstimatorService = new CostEstimatorService();
