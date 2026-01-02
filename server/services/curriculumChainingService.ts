import { progressTracker } from "./progressTracker";
import { godTierSyntheticGenerator } from "./godTierSyntheticGenerator";
import * as fs from "fs";
import * as path from "path";

const ALL_DOMAINS = [
  { name: "Meta-Intelligence & Theory", code: "META", focus: "recursive reasoning, epistemology, self-reference" },
  { name: "Operational Agent Skills", code: "OPS", focus: "execution excellence, orchestration, adaptive planning" },
  { name: "AI & Computer Science", code: "AI", focus: "emergent intelligence, scalable reasoning, systems thinking" },
  { name: "Mathematics", code: "MATH", focus: "rigorous proof, abstract structures, elegant solutions" },
  { name: "Physics & Engineering", code: "PHYS", focus: "fundamental principles, constraint satisfaction, optimization" },
  { name: "Natural Sciences", code: "NAT", focus: "emergence, adaptation, systemic complexity" },
  { name: "Medical & Health Science", code: "MED", focus: "precision diagnosis, personalized intervention, prevention" },
  { name: "Business & Economics", code: "BUS", focus: "strategic advantage, value creation, sustainable growth" },
  { name: "Human Sciences & Society", code: "HUM", focus: "context-aware reasoning, cultural nuance, ethical dimensions" },
  { name: "Creativity, Arts & Humanities", code: "ARTS", focus: "aesthetic principle, cultural synthesis, human meaning" },
  { name: "Domain Fusion Intelligence", code: "FUSION", focus: "cross-pollination, novel synthesis, unexpected connections" },
  { name: "Personalized Intelligence", code: "PERSONAL", focus: "adaptive learning, individual mastery paths" },
  { name: "Workflow Automation Intelligence", code: "WORKFLOW", focus: "process optimization, intelligent automation" },
  { name: "Operational Memory Intelligence", code: "MEMORY", focus: "knowledge retention, efficient recall" },
  { name: "Self-Improvement Intelligence", code: "SELF", focus: "continuous growth, gap analysis, deliberate practice" },
  { name: "Finance & Global Systems", code: "FINANCE", focus: "complex interdependencies, systemic risk, adaptation" },
  { name: "Engineering Megadisciplines", code: "ENGINEER", focus: "integration at scale, elegant complexity management" },
  { name: "Hyper-Scientific Frontiers", code: "HSCIENCE", focus: "cutting-edge synthesis, theory-practice integration" },
  { name: "Information & Language Structures", code: "INFO", focus: "semantic depth, computational elegance" },
  { name: "Esoteric Systems", code: "ESOTERIC", focus: "complex adaptive systems, emergent behavior" },
];

interface CurriculumChainState {
  currentSet: number;
  totalSets: number;
  questionsPerSet: number;
  totalQuestions: number;
  totalSimulations: number;
  isRunning: boolean;
  currentDomain: string;
  startTime: number;
  domainsCompleted: string[];
  currentLevel: number;
  currentQuestion: number;
}

let chainState: CurriculumChainState = {
  currentSet: 0,
  totalSets: 20,
  questionsPerSet: 10000,
  totalQuestions: 0,
  totalSimulations: 0,
  isRunning: false,
  currentDomain: "",
  startTime: 0,
  domainsCompleted: [],
  currentLevel: 0,
  currentQuestion: 0,
};

async function generateCurriculumSet(setNumber: number, domain: any): Promise<{ questions: number; simulations: number }> {
  console.log(`\n[ChainingService] 🎯 SET ${setNumber}/20: Generating 10,000 GOD-TIER questions for "${domain.name}"`);

  let questionsInSet = 0;
  let simulationsInSet = 0;
  const questionsPerLevel = 526; // 10,000 / 19 levels

  const outputDir = path.join(process.cwd(), "curriculum_output", `set_${String(setNumber).padStart(2, "0")}_${domain.code}`);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (let level = 1; level <= 19; level++) {
    if (!progressTracker.shouldContinueGeneration()) {
      console.log("[ChainingService] ⏸ Generation paused");
      return { questions: questionsInSet, simulations: simulationsInSet };
    }

    chainState.currentLevel = level;
    const questionsFile = path.join(outputDir, `level_${String(level).padStart(2, "0")}_questions_part01.jsonl`);
    const questionsFile2 = path.join(outputDir, `level_${String(level).padStart(2, "0")}_questions_part02.jsonl`);
    const simulationsFile = path.join(outputDir, `level_${String(level).padStart(2, "0")}_simulations_part01.jsonl`);
    const simulationsFile2 = path.join(outputDir, `level_${String(level).padStart(2, "0")}_simulations_part02.jsonl`);

    const questionsStream = fs.createWriteStream(questionsFile);
    const questionsStream2 = fs.createWriteStream(questionsFile2);
    const simulationsStream = fs.createWriteStream(simulationsFile);
    const simulationsStream2 = fs.createWriteStream(simulationsFile2);

    const midpoint = 263; // questionsPerLevel / 2

    for (let qNum = 1; qNum <= questionsPerLevel; qNum++) {
      if (!progressTracker.shouldContinueGeneration()) break;

      chainState.currentQuestion = qNum;

      try {
        const question = godTierSyntheticGenerator.generateGodTierQuestion(domain.code, level, qNum, domain.name);
        const questionsStream_active = qNum <= midpoint ? questionsStream : questionsStream2;
        questionsStream_active.write(JSON.stringify(question) + "\n");
        questionsInSet++;

        const simulation = godTierSyntheticGenerator.generateGodTierSimulation(question, domain.name);
        const simulationsStream_active = qNum <= midpoint ? simulationsStream : simulationsStream2;
        simulationsStream_active.write(JSON.stringify(simulation) + "\n");
        simulationsInSet++;
      } catch (e) {
        console.error(`[ChainingService] ⚠ Error on Q${qNum}: ${e}`);
      }

      if (qNum % 100 === 0) {
        console.log(`  [Level ${level}] ${qNum}/${questionsPerLevel} generated ✅`);
      }
    }

    questionsStream.end();
    questionsStream2.end();
    simulationsStream.end();
    simulationsStream2.end();

    console.log(`  ✅ Level ${level}: Complete`);
  }

  return { questions: questionsInSet, simulations: simulationsInSet };
}

async function runGeneration() {
  try {
    console.log("\n🚀 ========================================");
    console.log("   GOD-TIER CURRICULUM CHAINING STARTED");
    console.log("   20 sets × 10,000 questions = 199,500");
    console.log("========================================");

    for (let setNum = 1; setNum <= 20; setNum++) {
      if (!progressTracker.shouldContinueGeneration()) {
        console.log(`[ChainingService] ⏹ Stopped at set ${setNum}`);
        break;
      }

      chainState.currentSet = setNum;
      const domain = ALL_DOMAINS[setNum - 1];
      chainState.currentDomain = domain.name;

      const { questions, simulations } = await generateCurriculumSet(setNum, domain);

      chainState.totalQuestions += questions;
      chainState.totalSimulations += simulations;
      chainState.domainsCompleted.push(domain.name);

      console.log(`✅ SET ${setNum}/20 COMPLETE - ${chainState.totalQuestions}/199,500`);
    }

    console.log(`\n🏆 CHAINING COMPLETE! - ${chainState.totalQuestions} questions`);
    chainState.isRunning = false;
  } catch (error) {
    console.error("[ChainingService] ❌ ERROR:", error);
    chainState.isRunning = false;
  }
}

export async function startCurriculumChaining() {
  if (chainState.isRunning) {
    console.log("[API] Already running");
    return { error: "Already running" };
  }

  chainState = {
    currentSet: 1,
    totalSets: 20,
    questionsPerSet: 10000,
    totalQuestions: 0,
    totalSimulations: 0,
    isRunning: true,
    currentDomain: "",
    startTime: Date.now(),
    domainsCompleted: [],
    currentLevel: 0,
    currentQuestion: 0,
  };

  console.log("[API] 🚀 STARTING GENERATION");

  // Use setImmediate to ensure it runs in background
  setImmediate(() => {
    runGeneration().catch(err => console.error("[ChainingService] Unhandled:", err));
  });

  return { status: "chaining_started", message: "Generation started" };
}

export function getChainingStatus() {
  const elapsed = chainState.isRunning ? Date.now() - chainState.startTime : 0;
  const rate = chainState.totalQuestions / (elapsed / 1000 || 1);

  return {
    ...chainState,
    rate: rate.toFixed(3),
    progress: `${chainState.totalQuestions}/199500 (${((chainState.totalQuestions / 199500) * 100).toFixed(1)}%)`,
    estimatedHoursRemaining:
      chainState.totalQuestions < 199500 ? ((199500 - chainState.totalQuestions) / (rate || 0.02) / 3600).toFixed(1) : "Complete",
  };
}

export function stopChaining() {
  chainState.isRunning = false;
  progressTracker.pauseGeneration();
  return { status: "stopped" };
}

export const curriculumChainingService = {
  startCurriculumChaining,
  getChainingStatus,
  stopChaining,
};
