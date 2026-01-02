/**
 * Fast JSONL Curriculum Export - Generates 3M questions in batch format
 * Output: data/curriculum_master.jsonl (one question per line)
 */

import * as fs from "fs";
import * as path from "path";

export async function generateCurriculumJSONL() {
  const OUTPUT_PATH = "data/curriculum_master.jsonl";
  const DOMAINS_PATH = "attached_assets/ZeusMaster";
  const LEVELS_PER_DOMAIN = 30;
  const QUESTIONS_PER_LEVEL = 500;

  console.log(`[CURRICULUM_EXPORT] 🚀 Generating JSONL curriculum...`);
  
  if (!fs.existsSync(DOMAINS_PATH)) {
    console.log(`[CURRICULUM_EXPORT] ❌ Domain path not found: ${DOMAINS_PATH}`);
    return { generated: 0 };
  }

  // Create output stream
  const outputStream = fs.createWriteStream(OUTPUT_PATH, { flags: "w" });
  let totalGenerated = 0;
  let domainsProcessed = 0;

  try {
    const entries = fs.readdirSync(DOMAINS_PATH)
      .filter((e) => e.match(/^D\d{3}$/))
      .sort();

    console.log(`[CURRICULUM_EXPORT] Found ${entries.length} domains`);

    for (const domainDir of entries) {
      const specPath = path.join(DOMAINS_PATH, domainDir, "DOMAIN_SPEC.md");
      if (!fs.existsSync(specPath)) {
        continue;
      }

      // Generate for each level
      for (let level = 1; level <= LEVELS_PER_DOMAIN; level++) {
        const levelName = getLevelName(level);
        
        // Generate 500 questions for this level
        for (let q = 1; q <= QUESTIONS_PER_LEVEL; q++) {
          const question = {
            id: `${domainDir}_L${level}_Q${q}`,
            domain: domainDir,
            level,
            question_number: q,
            prompt: generateQuestionPrompt(domainDir, level, q, levelName),
            expected_format: "structured",
            difficulty: Math.ceil((q / QUESTIONS_PER_LEVEL) * 5),
            type: getLevelType(level),
            skills: getSkillsForLevel(level),
            simulation_available: true,
          };

          // Write as JSONL (one JSON object per line)
          outputStream.write(JSON.stringify(question) + "\n");
          totalGenerated++;

          // Progress logging every 50k questions
          if (totalGenerated % 50000 === 0) {
            console.log(`[CURRICULUM_EXPORT] ✅ ${totalGenerated.toLocaleString()} questions generated...`);
          }
        }
      }

      domainsProcessed++;
      if (domainsProcessed % 10 === 0) {
        console.log(`[CURRICULUM_EXPORT] ✅ ${domainsProcessed}/${entries.length} domains processed`);
      }
    }

    outputStream.end();

    console.log(`[CURRICULUM_EXPORT] 🏆 COMPLETE!`);
    console.log(`[CURRICULUM_EXPORT] Generated: ${totalGenerated.toLocaleString()} questions`);
    console.log(`[CURRICULUM_EXPORT] File: ${OUTPUT_PATH}`);
    console.log(`[CURRICULUM_EXPORT] Domains: ${domainsProcessed}`);
    console.log(`[CURRICULUM_EXPORT] Levels: ${domainsProcessed * LEVELS_PER_DOMAIN}`);

    return {
      generated: totalGenerated,
      domains: domainsProcessed,
      levels: domainsProcessed * LEVELS_PER_DOMAIN,
      file: OUTPUT_PATH,
    };
  } catch (error: any) {
    console.error(`[CURRICULUM_EXPORT] ❌ Error: ${error.message}`);
    throw error;
  }
}

function getLevelName(level: number): string {
  const names = [
    "Foundations", "Recognition", "Basic Application", "Simple Contexts",
    "Intermediate Scenarios", "Application & Synthesis", "Advanced Integration",
    "Complex Problem-Solving", "Systems Integration", "Mastery",
    "Expertise Building", "Advanced Synthesis", "Expert-Level Reasoning",
    "Specialized Mastery", "Cross-Domain Integration", "Strategic Thinking",
    "Advanced Theory", "Integrated Mastery", "Culmination & Transfer",
    "Research Frontiers", "Paradigm Exploration", "Theoretical Innovation",
    "Meta-Theory Building", "Emergence Patterns", "Universal Laws",
    "Beyond Current Knowledge", "Synthetic Breakthrough", "Transcendent Understanding",
    "Infinite Complexity Navigation", "God-Tier Synthesis"
  ];
  return names[level - 1] || `Level ${level}`;
}

function getLevelType(level: number): string {
  if (level <= 5) return "foundational";
  if (level <= 10) return "applied";
  if (level <= 15) return "advanced";
  if (level <= 20) return "expert";
  if (level <= 25) return "research";
  return "god-tier";
}

function getSkillsForLevel(level: number): string[] {
  if (level <= 5) return ["recall", "recognition", "understanding"];
  if (level <= 10) return ["application", "analysis", "comprehension"];
  if (level <= 15) return ["synthesis", "evaluation", "integration"];
  if (level <= 20) return ["expert-reasoning", "theory-building"];
  if (level <= 25) return ["research-methodology", "innovation"];
  return ["transcendent-understanding", "meta-cognition"];
}

function generateQuestionPrompt(domain: string, level: number, q: number, levelName: string): string {
  const templates = [
    `Explain the core principles of ${domain} at the ${levelName} level`,
    `How would you approach this ${domain} problem using ${levelName} reasoning?`,
    `Analyze the deeper implications in ${domain} at level ${level}`,
    `Design a solution for ${domain} incorporating ${levelName} concepts`,
    `What are the critical connections in ${domain} at this level?`,
    `Synthesize knowledge from ${domain} domain using ${levelName} thinking`,
    `Evaluate different approaches in ${domain} at the ${levelName} level`,
    `Propose an innovative application of ${domain} at level ${level}`,
  ];
  return templates[q % templates.length];
}
