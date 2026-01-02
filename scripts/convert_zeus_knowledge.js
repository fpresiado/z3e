import fs from 'fs';

const sqlContent = fs.readFileSync('attached_assets/zeus_phd_backup_2025-11-13_1763076101223.sql', 'utf8');

const lessonsMatch = sqlContent.match(/-- Table: zeus_lessons[\s\S]*?(?=-- Table:|$)/);
if (!lessonsMatch) {
  console.error('Could not find zeus_lessons table');
  process.exit(1);
}

const jsonMatch = lessonsMatch[0].match(/\[[\s\S]*$/);
if (!jsonMatch) {
  console.error('Could not find JSON data in zeus_lessons');
  process.exit(1);
}

try {
  const allLessons = JSON.parse(jsonMatch[0]);
  console.log(`Found ${allLessons.length} total lessons`);
  
  const uniqueLessons = [];
  const seenTopics = new Set();
  
  for (const lesson of allLessons) {
    if (!seenTopics.has(lesson.topic) && uniqueLessons.length < 210) {
      seenTopics.add(lesson.topic);
      uniqueLessons.push(lesson);
    }
  }
  
  const knowledgeEntries = uniqueLessons.map((lesson, index) => ({
    level: index + 1,
    title: lesson.topic,
    content: [
      lesson.explanation || '',
      lesson.steps ? `Steps: ${lesson.steps.join(', ')}` : '',
      lesson.code_example ? `Example: ${lesson.code_example}` : '',
      lesson.tags ? `Tags: ${lesson.tags.join(', ')}` : ''
    ].filter(Boolean).join('\n'),
    source: `Zeus Lesson Database (Confidence: ${lesson.confidence}%, Success Rate: ${lesson.success_rate}%)`
  }));
  
  fs.writeFileSync(
    'attached_assets/zeus_knowledge_converted.json',
    JSON.stringify(knowledgeEntries, null, 2)
  );
  
  console.log(`✓ Converted ${knowledgeEntries.length} knowledge levels`);
  console.log(`✓ Saved to: attached_assets/zeus_knowledge_converted.json`);
  console.log(`✓ File size: ${(fs.statSync('attached_assets/zeus_knowledge_converted.json').size / 1024).toFixed(2)} KB`);
  
} catch (error) {
  console.error('Parse error:', error.message);
  process.exit(1);
}
