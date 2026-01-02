import { db } from "../db";
import { sql } from "drizzle-orm";
import { providerManager } from "./provider";

export async function runSimpleGeneration() {
  console.log("[GEN] ✅ GENERATION STARTED - calling your PC's LM Studio via ngrok");
  
  let count = 0;
  try {
    const levelResult = await db.execute(sql`SELECT id FROM curriculum_levels LIMIT 1`);
    const levelId = levelResult.rows[0]?.id;
    
    if (!levelId) {
      console.error("[GEN] ❌ NO LEVELS IN DATABASE");
      return;
    }

    console.log(`[GEN] Level ID: ${levelId}`);

    for (let qNum = 1; qNum <= 3; qNum++) {
      try {
        console.log(`[GEN] Q${qNum}: Calling LM Studio via ngrok...`);
        
        const response = await providerManager.generateAnswer({
          question: `Meta-Intelligence Question ${qNum}`,
          systemPrompt: "You are Zeus AI. Answer briefly."
        });

        console.log(`[GEN] Q${qNum}: Got LM answer: "${response.answer.substring(0, 50)}..."`);

        await db.execute(sql`
          INSERT INTO curriculum_questions (level_id, number, prompt, expected_category, expected_format, expected_value, metadata)
          VALUES (${levelId}, ${qNum}, ${'Q' + qNum}, 'META', 'text', ${response.answer}, ${'{}'}::jsonb)
          ON CONFLICT (level_id, number) DO UPDATE SET expected_value = ${response.answer}
        `);
        
        count++;
        console.log(`[GEN] ✅ Q${qNum} inserted - total: ${count}`);
      } catch (e: any) {
        console.error(`[GEN] Q${qNum} ERROR:`, e?.message || String(e));
      }
    }

    console.log(`[GEN] ✅ DONE - Created ${count} questions from LM Studio`);
  } catch (error: any) {
    console.error("[GEN] FATAL:", error?.message || String(error));
  }
}
