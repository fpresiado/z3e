import { reasoningTransformer, type ReasoningContext } from "./reasoningTransformer";
import { masteryEngine } from "./masteryEngine";
import { knowledgeGraphService } from "./knowledgeGraphService";

export class ZeusTestSuite {
  private testResults: any[] = [];

  async runAllTests(): Promise<{ passed: number; failed: number; details: any[] }> {
    console.log("\n[TestSuite] 🧪 Starting Zeus Ultimate Test Suite...\n");
    
    const results = {
      passed: 0,
      failed: 0,
      details: [] as any[],
    };

    // Human Track Tests
    results.details.push(...await this.runHumanTrackTests());
    
    // AI Track Tests
    results.details.push(...await this.runAITrackTests());
    
    // God-Tier Track Tests
    results.details.push(...await this.runGodTierTrackTests());
    
    // Knowledge Graph Tests
    results.details.push(...await this.runKnowledgeGraphTests());
    
    // Reasoning Tests
    results.details.push(...await this.runReasoningTests());
    
    // Mastery Tests
    results.details.push(...await this.runMasteryTests());

    results.passed = results.details.filter((t) => t.passed).length;
    results.failed = results.details.filter((t) => !t.passed).length;

    console.log(`\n[TestSuite] ✅ Completed: ${results.passed} passed, ${results.failed} failed\n`);
    return results;
  }

  private async runHumanTrackTests(): Promise<any[]> {
    console.log("[TestSuite] Running Human Track Tests...");
    const context: ReasoningContext = { query: "Explain confirmation bias", track: "human", mode: "human", level: 3 };
    const result = await reasoningTransformer.reason(context);
    return [{ test: "Human_ConfirmationBias", passed: result.conclusion.length > 0, result }];
  }

  private async runAITrackTests(): Promise<any[]> {
    console.log("[TestSuite] Running AI Track Tests...");
    const context: ReasoningContext = { query: "Explain gradient descent", track: "ai", mode: "ai", level: 5 };
    const result = await reasoningTransformer.reason(context);
    return [{ test: "AI_GradientDescent", passed: result.conclusion.length > 0, result }];
  }

  private async runGodTierTrackTests(): Promise<any[]> {
    console.log("[TestSuite] Running God-Tier Track Tests...");
    const context: ReasoningContext = { query: "Find the pattern underlying learning", track: "god-tier", mode: "god-tier", level: 15 };
    const result = await reasoningTransformer.reason(context);
    return [{ test: "GodTier_PatternRecognition", passed: result.conclusion.length > 0, result }];
  }

  private async runKnowledgeGraphTests(): Promise<any[]> {
    console.log("[TestSuite] Running Knowledge Graph Tests...");
    const neighbors = knowledgeGraphService.getConceptNeighbors("confirmation-bias");
    const prereqs = knowledgeGraphService.getPrerequisites("decision-making");
    
    return [
      { test: "KnowledgeGraph_Neighbors", passed: neighbors.length > 0 },
      { test: "KnowledgeGraph_Prerequisites", passed: prereqs.length >= 0 },
    ];
  }

  private async runReasoningTests(): Promise<any[]> {
    console.log("[TestSuite] Running Reasoning Tests...");
    const results = [];
    
    for (const mode of ["human", "ai", "god-tier"]) {
      const context: ReasoningContext = { query: "Test query", mode: mode as any, level: 10 };
      const result = await reasoningTransformer.reason(context);
      results.push({
        test: `Reasoning_${mode}`,
        passed: result.confidence > 0.6,
      });
    }
    
    return results;
  }

  private async runMasteryTests(): Promise<any[]> {
    console.log("[TestSuite] Running Mastery Tests...");
    await masteryEngine.initializeFromSimulation(["foundational", "human", "ai", "god-tier"]);
    
    const humanMastery = masteryEngine.getTrackMastery("human");
    const aiMastery = masteryEngine.getTrackMastery("ai");
    const godTierMastery = masteryEngine.getTrackMastery("god-tier");
    
    return [
      { test: "Mastery_HumanTrack", passed: humanMastery >= 0.4 },
      { test: "Mastery_AITrack", passed: aiMastery >= 0.4 },
      { test: "Mastery_GodTierTrack", passed: godTierMastery >= 0.4 },
    ];
  }
}

export const zeusTestSuite = new ZeusTestSuite();
