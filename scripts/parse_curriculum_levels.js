import fs from 'fs';

const sqlContent = fs.readFileSync('attached_assets/curriculum-levels-31-210-YOUR-PC_1763076456489.sql', 'utf8');

// Extract all level blocks with their lessons
const levelPattern = /-- Level (\d+) .*?\nINSERT INTO levels[\s\S]*?VALUES \(([\s\S]*?)\);[\s\S]*?-- Lesson \d+\.\d+: (.*?)\nINSERT INTO lessons[\s\S]*?'(.*?)',\s*'(.*?)',/g;

const levels = [];
let match;

while ((match = levelPattern.exec(sqlContent)) !== null) {
  const levelNumber = parseInt(match[1]);
  const lessonTitle = match[3];
  const lessonDescription = match[4];
  
  levels.push({
    level: levelNumber,
    title: lessonTitle,
    content: lessonDescription,
    source: `Zeus Curriculum Level ${levelNumber}`
  });
}

console.log(`Extracted ${levels.length} curriculum levels`);
console.log(`Range: ${levels[0]?.level} to ${levels[levels.length - 1]?.level}`);

// Save extracted curriculum
fs.writeFileSync(
  'attached_assets/zeus_curriculum_31-210.json',
  JSON.stringify(levels, null, 2)
);

console.log('✓ Saved to: attached_assets/zeus_curriculum_31-210.json');
