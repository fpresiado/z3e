import fs from 'fs';

// Load both datasets
const lessonLevels = JSON.parse(fs.readFileSync('attached_assets/zeus_knowledge_converted.json', 'utf8'));
const curriculumLevels = JSON.parse(fs.readFileSync('attached_assets/zeus_curriculum_31-210.json', 'utf8'));

console.log(`Lesson levels: ${lessonLevels.length} entries (1-${lessonLevels.length})`);
console.log(`Curriculum levels: ${curriculumLevels.length} entries (${curriculumLevels[0].level}-${curriculumLevels[curriculumLevels.length - 1].level})`);

// Take levels 1-30 from lessons, 31-210 from curriculum
const levels1to30 = lessonLevels.slice(0, 30);
const finalKnowledge = [...levels1to30, ...curriculumLevels];

console.log(`\n✓ Combined knowledge base:`);
console.log(`  Levels 1-30: From Zeus lesson database (${levels1to30.length} entries)`);
console.log(`  Levels 31-210: From Zeus curriculum (${curriculumLevels.length} entries)`);
console.log(`  Total: ${finalKnowledge.length} levels`);

// Save final combined knowledge
fs.writeFileSync(
  'attached_assets/zeus_knowledge_1-210_FINAL.json',
  JSON.stringify(finalKnowledge, null, 2)
);

const fileSizeKB = (fs.statSync('attached_assets/zeus_knowledge_1-210_FINAL.json').size / 1024).toFixed(2);
console.log(`\n✓ Saved to: attached_assets/zeus_knowledge_1-210_FINAL.json`);
console.log(`✓ File size: ${fileSizeKB} KB`);

// Show samples
console.log(`\n--- SAMPLE ENTRIES ---`);
console.log(`Level 1: "${finalKnowledge[0].title}"`);
console.log(`Level 30: "${finalKnowledge[29].title}"`);
console.log(`Level 31: "${finalKnowledge[30].title}"`);
console.log(`Level 210: "${finalKnowledge[209].title}"`);
