import { godTierSyntheticGenerator } from "./godTierSyntheticGenerator";
import * as fs from "fs";
import * as path from "path";

const ALL_DOMAINS = [
  { name: "Meta-Intelligence & Theory", code: "META" },
  { name: "Operational Agent Skills", code: "OPS" },
  { name: "AI & Computer Science", code: "AI" },
  { name: "Mathematics", code: "MATH" },
  { name: "Physics & Engineering", code: "PHYS" },
  { name: "Natural Sciences", code: "NAT" },
  { name: "Medical & Health Science", code: "MED" },
  { name: "Business & Economics", code: "BUS" },
  { name: "Human Sciences & Society", code: "HUM" },
  { name: "Creativity, Arts & Humanities", code: "ARTS" },
  { name: "Domain Fusion Intelligence", code: "FUSION" },
  { name: "Personalized Intelligence", code: "PERSONAL" },
  { name: "Workflow Automation Intelligence", code: "WORKFLOW" },
  { name: "Operational Memory Intelligence", code: "MEMORY" },
  { name: "Self-Improvement Intelligence", code: "SELF" },
  { name: "Finance & Global Systems", code: "FINANCE" },
  { name: "Engineering Megadisciplines", code: "ENGINEER" },
  { name: "Hyper-Scientific Frontiers", code: "HSCIENCE" },
  { name: "Information & Language Structures", code: "INFO" },
  { name: "Esoteric Systems", code: "ESOTERIC" },
];

export async function generateOneDomain(domainIndex: number) {
  const domain = ALL_DOMAINS[domainIndex];
  if (!domain) {
    return { error: "Invalid domain index" };
  }

  console.log(`\n[DirectGen] 🎯 Domain ${domainIndex + 1}/20: ${domain.name}...`);

  const outputDir = path.join(process.cwd(), "curriculum_output", `domain_${domain.code}`);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let totalQ = 0;
  let totalS = 0;
  const startTime = Date.now();

  // Generate ALL 19 levels × 500 questions per domain
  for (let level = 1; level <= 19; level++) {
    const questionsFile = path.join(outputDir, `level_${String(level).padStart(2, "0")}_questions_part01.jsonl`);
    const questionsFile2 = path.join(outputDir, `level_${String(level).padStart(2, "0")}_questions_part02.jsonl`);
    const simulationsFile = path.join(outputDir, `level_${String(level).padStart(2, "0")}_simulations_part01.jsonl`);
    const simulationsFile2 = path.join(outputDir, `level_${String(level).padStart(2, "0")}_simulations_part02.jsonl`);

    const questionsStream = fs.createWriteStream(questionsFile);
    const questionsStream2 = fs.createWriteStream(questionsFile2);
    const simulationsStream = fs.createWriteStream(simulationsFile);
    const simulationsStream2 = fs.createWriteStream(simulationsFile2);

    const midpoint = 250; // 500 / 2

    // Generate 500 questions per level
    for (let qNum = 1; qNum <= 500; qNum++) {
      try {
        const question = godTierSyntheticGenerator.generateGodTierQuestion(domain.code, level, qNum, domain.name);
        const questionsStream_active = qNum <= midpoint ? questionsStream : questionsStream2;
        questionsStream_active.write(JSON.stringify(question) + "\n");
        totalQ++;

        const simulation = godTierSyntheticGenerator.generateGodTierSimulation(question, domain.name);
        const simulationsStream_active = qNum <= midpoint ? simulationsStream : simulationsStream2;
        simulationsStream_active.write(JSON.stringify(simulation) + "\n");
        totalS++;
      } catch (e) {
        console.error(`Error L${level}Q${qNum}:`, e);
      }

      if (qNum % 100 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = qNum / elapsed;
        console.log(`    Level ${level}: ${qNum}/500 questions (${rate.toFixed(1)} q/s)`);
      }
    }

    questionsStream.end();
    questionsStream2.end();
    simulationsStream.end();
    simulationsStream2.end();
  }

  const elapsed = (Date.now() - startTime) / 1000;
  console.log(`  ✅ ${domain.name}: ${totalQ} questions + ${totalS} simulations in ${elapsed.toFixed(1)}s`);
  return { domain: domain.name, questions: totalQ, simulations: totalS };
}

export async function generateAllDomains() {
  console.log("\n🚀 ========================================");
  console.log("   GENERATING FULL CURRICULUM");
  console.log("   20 domains × 19 levels × 500 questions");
  console.log("   = 199,500 questions with simulations");
  console.log("========================================\n");

  const results = [];
  let totalQuestions = 0;
  let totalSimulations = 0;
  const startTime = Date.now();

  for (let i = 0; i < 20; i++) {
    try {
      const result = await generateOneDomain(i);
      if (!result.error) {
        results.push(result);
        totalQuestions += result.questions;
        totalSimulations += result.simulations;

        const elapsed = (Date.now() - startTime) / 1000;
        const progress = ((i + 1) / 20) * 100;
        console.log(`Progress: ${i + 1}/20 domains (${progress.toFixed(0)}%) | ${totalQuestions} questions total\n`);
      }
    } catch (e) {
      console.error(`Domain ${i} error:`, e);
    }
  }

  const totalElapsed = (Date.now() - startTime) / 1000;
  console.log("\n🏆 ========================================");
  console.log("   GENERATION COMPLETE!");
  console.log(`   ✅ Domains: ${results.length}`);
  console.log(`   ✅ Questions: ${totalQuestions}`);
  console.log(`   ✅ Simulations: ${totalSimulations}`);
  console.log(`   ✅ Time: ${(totalElapsed / 60).toFixed(1)} minutes`);
  console.log(`   📁 Output: /curriculum_output/`);
  console.log("========================================\n");

  return {
    status: "complete",
    domains: results.length,
    questions: totalQuestions,
    simulations: totalSimulations,
    totalTime: `${(totalElapsed / 60).toFixed(1)} minutes`,
    results,
  };
}

export const directGenerationService = {
  generateOneDomain,
  generateAllDomains,
};
