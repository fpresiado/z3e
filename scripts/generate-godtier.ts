import axios from "axios";
import { db } from "../server/db.js";
import { curriculumLevels, curriculumQuestions } from "../shared/schema.js";
import { eq } from "drizzle-orm";

const VLLM_BASE_URL = process.env.VLLM_URL || "http://localhost:8000/v1";
const MODEL = "Llama-2-7b-hf";

const DOMAINS = [
  "AI", "ARTS", "BUS", "ENGINEER", "ESOTERIC", "FINANCE", "FUSION",
  "HSCIENCE", "HUM", "INFO", "MATH", "MED", "MEMORY", "META", "NAT",
  "OPS", "PERSONAL", "PHYS", "SELF", "WORKFLOW"
];

const DOMAIN_DESCRIPTIONS: { [key: string]: string } = {
  AI: "Artificial Intelligence, machine learning, neural networks, and advanced algorithms",
  ARTS: "Visual arts, music theory, design principles, and creative expression",
  BUS: "Business strategy, management, economics, and organizational systems",
  ENGINEER: "Engineering disciplines, systems design, and technical architecture",
  ESOTERIC: "Esoteric knowledge, mysticism, and unconventional wisdom traditions",
  FINANCE: "Finance, investment strategies, economic theory, and wealth management",
  FUSION: "Fusion of multiple domains creating novel perspectives and synthesis",
  HSCIENCE: "Health sciences, medicine, biology, and human physiology",
  HUM: "Humanities, philosophy, history, and cultural studies",
  INFO: "Information technology, cybersecurity, software architecture",
  MATH: "Mathematics, calculus, linear algebra, and advanced computations",
  MED: "Medical practice, diagnostics, treatment protocols, and clinical reasoning",
  MEMORY: "Memory science, cognitive psychology, learning optimization",
  META: "Metacognition, self-awareness, thinking about thinking",
  NAT: "Natural sciences, chemistry, physics, and scientific method",
  OPS: "Operations, logistics, systems optimization, and process management",
  PERSONAL: "Personal development, psychology, relationships, and self-improvement",
  PHYS: "Physics, quantum mechanics, relativity, and physical laws",
  SELF: "Self-knowledge, identity, consciousness, and personal philosophy",
  WORKFLOW: "Workflow optimization, productivity, task management, systems"
};

async function generateQuestion(
  domain: string,
  level: number,
  questionType: "curriculum" | "simulation",
  questionNumber: number
): Promise<string> {
  const typeLabel = questionType === "curriculum" ? "curriculum question" : "simulation scenario";
  const sophisticationMap: { [key: number]: string } = {
    1: "basic concept mastery",
    2: "applied understanding",
    3: "integrated thinking",
    4: "expert-level synthesis",
    5: "boundary-pushing innovation",
    6: "cross-domain mastery",
    7: "systems-level thinking",
    8: "emergence recognition",
    9: "paradigm-shifting insight",
    10: "god-tier synthesis",
    11: "god-tier synthesis",
    12: "god-tier synthesis",
    13: "god-tier synthesis",
    14: "god-tier synthesis",
    15: "god-tier synthesis",
    16: "god-tier synthesis",
    17: "god-tier synthesis",
    18: "god-tier synthesis",
    19: "god-tier synthesis",
  };

  const prompt = `You are a God-Tier curriculum designer for ${domain}. Create a ${typeLabel} (${questionNumber}) for Level ${level} (${sophisticationMap[level]}).

Domain: ${domain}
Description: ${DOMAIN_DESCRIPTIONS[domain]}
Level: ${level}/19
Type: ${typeLabel}

Requirements:
- Sophistication: ${sophisticationMap[level]}
- Length: 150-300 words
- Include concrete examples or scenarios
- ${questionType === "simulation" ? "Create a realistic scenario requiring application of knowledge" : "Focus on deep understanding and integration with other domains"}
- Assume expert-level prior knowledge

Generate ONLY the question text, no preamble.`;

  try {
    const response = await axios.post(
      `${VLLM_BASE_URL}/chat/completions`,
      {
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 400,
        top_p: 0.9,
      },
      { timeout: 60000 }
    );

    return (response.data as any).choices[0]?.message?.content || "";
  } catch (error: any) {
    console.error(`Error generating question: ${error.message}`);
    return "";
  }
}

async function generateExpectedAnswer(question: string, domain: string): Promise<string> {
  const prompt = `As a world-class expert in ${domain}, provide the definitive answer to this ${domain} question:

"${question}"

Requirements:
- Comprehensive yet concise (150-250 words)
- Address all aspects of the question
- Include specific examples or frameworks
- Show expert-level reasoning
- Acknowledge nuance and complexity

Provide ONLY the answer, no preamble.`;

  try {
    const response = await axios.post(
      `${VLLM_BASE_URL}/chat/completions`,
      {
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 350,
        top_p: 0.9,
      },
      { timeout: 60000 }
    );

    return (response.data as any).choices[0]?.message?.content || "";
  } catch (error: any) {
    console.error(`Error generating answer: ${error.message}`);
    return "";
  }
}

async function generateBatch() {
  console.log("\n========================================");
  console.log("Zeus 3 God-Tier Question Generator");
  console.log("========================================\n");

  // Verify vLLM is running
  try {
    await axios.get(`${VLLM_BASE_URL}/models`, { timeout: 5000 });
    console.log("✅ vLLM server connected");
  } catch (error) {
    console.error("❌ vLLM server not responding at", VLLM_BASE_URL);
    console.error("Start vLLM with: python3 -m vllm.entrypoints.openai.api_server --model /workspace/models/Llama-2-7b-hf --port 8000");
    process.exit(1);
  }

  // Clear existing curriculum (DESTRUCTIVE - be careful!)
  console.log("\n🗑️  Clearing existing curriculum data...");
  try {
    await db.delete(curriculumQuestions);
    await db.delete(curriculumLevels);
    console.log("✓ Database cleared");
  } catch (error: any) {
    console.error("Error clearing database:", error.message);
  }

  let totalGenerated = 0;
  const startTime = Date.now();

  // Generate for each domain
  for (const domain of DOMAINS) {
    console.log(`\n📚 Generating ${domain}...`);

    for (let level = 1; level <= 19; level++) {
      // Create level
      const [levelRecord] = await db
        .insert(curriculumLevels)
        .values({
          domain,
          levelNumber: level,
          name: `Level ${level}`,
          description: `${domain} - Level ${level}`,
          questionCount: 1000, // 500 curriculum + 500 simulations
        })
        .returning();

      let levelCount = 0;

      // Generate 500 curriculum questions
      for (let i = 1; i <= 500; i++) {
        const question = await generateQuestion(domain, level, "curriculum", i);
        const answer = await generateExpectedAnswer(question, domain);

        if (question && answer) {
          await db.insert(curriculumQuestions).values({
            levelId: levelRecord.id,
            number: i,
            prompt: question,
            expectedCategory: `${domain}_L${level}_C`,
            expectedFormat: "essay",
            expectedValue: answer,
            metadata: {
              difficulty: Math.ceil(level / 2),
              type: "curriculum",
              domainFocus: domain,
            },
          });
          levelCount++;
        }

        // Progress indicator
        if (i % 50 === 0) {
          process.stdout.write(`.`);
        }
      }

      // Generate 500 simulation questions
      for (let i = 1; i <= 500; i++) {
        const question = await generateQuestion(domain, level, "simulation", i);
        const answer = await generateExpectedAnswer(question, domain);

        if (question && answer) {
          await db.insert(curriculumQuestions).values({
            levelId: levelRecord.id,
            number: 500 + i,
            prompt: question,
            expectedCategory: `${domain}_L${level}_S`,
            expectedFormat: "essay",
            expectedValue: answer,
            metadata: {
              difficulty: Math.ceil(level / 2),
              type: "simulation",
              domainFocus: domain,
            },
          });
          levelCount++;
        }

        if (i % 50 === 0) {
          process.stdout.write(`.`);
        }
      }

      console.log(`\n  ✓ Level ${level}: ${levelCount} questions`);
      totalGenerated += levelCount;
    }

    console.log(`✓ ${domain} complete: ${19 * 1000} total questions`);
  }

  const duration = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n========================================`);
  console.log(`✅ Generation Complete!`);
  console.log(`📊 Total: ${totalGenerated} authentic questions`);
  console.log(`⏱️  Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`);
  console.log(`📈 Rate: ~${Math.round(totalGenerated / (duration / 60))} questions/minute`);
  console.log(`========================================\n`);
}

// Run
generateBatch().catch(console.error);
