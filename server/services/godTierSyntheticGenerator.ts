/**
 * GOD-TIER SYNTHETIC QUESTION GENERATOR
 * Generates sophisticated, authentic curriculum questions WITHOUT external LLM calls
 * Uses domain-specific templates, reasoning patterns, and sophisticated synthesis
 */

const questionTemplates = {
  systems_analysis: [
    "Analyze {domain} through the lens of {perspective}. How do the interactions between {element1} and {element2} create emergent behaviors? What are the critical feedback loops?",
    "Design a {domain} system that must balance {constraint1}, {constraint2}, and {constraint3}. What trade-offs are unavoidable? How would you measure success?",
    "Examine a failure mode in {domain}: {scenario}. What systems-level factors contributed? How would early intervention points change the outcome?",
  ],
  cross_domain_synthesis: [
    "Synthesize principles from {domain1} and {domain2} to solve this {domain3} problem: {problem}. What unexpected insights emerge from the integration?",
    "How do concepts of {concept1} from {domain1} illuminate {concept2} in {domain2}? What novel applications become possible?",
    "Bridge {domain1} and {domain2}: Design a framework that integrates {element1} with {element2}. What are the emergent properties?",
  ],
  edge_case_reasoning: [
    "In extreme conditions ({extreme_condition}), how does {domain} behavior change fundamentally? What assumptions break down?",
    "Consider this edge case in {domain}: {edge_case}. Standard approaches fail because... A deeper analysis suggests...",
    "What happens at the boundaries? Examine {domain} when {boundary_condition}. How does this reveal fundamental principles?",
  ],
  ethical_tradeoff: [
    "You must choose between {value1} and {value2} in {domain}. Defend your choice across three different ethical frameworks: {framework1}, {framework2}, {framework3}.",
    "In {domain}, optimizing for {metric1} often harms {metric2}. How would you navigate this tension? What would you sacrifice?",
    "Design an approach to {domain} that serves {stakeholder1}, {stakeholder2}, and {stakeholder3} fairly. What's impossible to reconcile?",
  ],
  emergent_pattern_recognition: [
    "Identify the deep pattern connecting these {domain} phenomena: {phenomenon1}, {phenomenon2}, {phenomenon3}. What does this pattern suggest about future developments?",
    "What meta-pattern emerges when you examine {domain} across {timespan}? How is the present state an inevitable expression of this pattern?",
    "Recognize the hidden structure: {domain} manifests as {manifestation1}, {manifestation2}, {manifestation3}. What single principle unifies these?",
  ],
  meta_reasoning: [
    "Why do experts in {domain} often disagree about {topic}? What are they implicitly valuing differently? How would you resolve this?",
    "What does the history of thinking about {domain} reveal about how humans form understanding? How has this limited or enabled progress?",
    "Examine your own reasoning about {domain}: What assumptions are you making? What could you be missing?",
  ],
  creative_integration: [
    "Imagine {domain} reimagined through the principles of {inspiration_field}. What becomes possible that wasn't before?",
    "Combine {technique1} from {domain1} with {approach2} from {domain2} to create something new in {domain3}. What value does this create?",
    "What if {domain} worked like {analogy}? Follow this metaphor to its limits. What surprising insights emerge?",
  ],
  predictive_modeling: [
    "Project {domain} forward 20 years given current trajectories. What inflection points are likely? Which early signals matter most?",
    "Build a minimal model of {domain} that captures its essential dynamics. What variables matter most? What can be ignored?",
    "If you had to predict the next major disruption in {domain}, what forces would you track? How would you recognize it early?",
  ],
};

const domains_focus = {
  META: "recursive self-reference, knowing how you know, epistemological foundations, reasoning about reasoning",
  OPS: "execution excellence, scalable operations, adaptive coordination, orchestrating complexity",
  AI: "emergent intelligence, scaling laws, generalization, reasoning architectures, safety alignment",
  MATH: "elegant proof structures, abstract patterns, finding invariants, proof by contradiction and induction",
  PHYS: "conservation laws, symmetry principles, constraint satisfaction, coupling between phenomena",
  NAT: "adaptation, natural selection, emergence from simple rules, ecological interdependence",
  MED: "homeostatic mechanisms, diagnostic reasoning, personalized intervention, prediction from biomarkers",
  BUS: "competitive advantage, value creation, sustained profitability, strategic positioning",
  HUM: "cultural context, perspective-taking, historical causation, social norms and institutions",
  ARTS: "aesthetic principle, emotional resonance, cultural meaning-making, technique serving vision",
  FUSION: "cross-pollination of ideas, synthesis at domain boundaries, unexpected connections",
  PERSONAL: "individual variation, adaptive learning pathways, growth acceleration, personalization",
  WORKFLOW: "process bottlenecks, automation leverage points, human-AI collaboration, efficiency",
  MEMORY: "encoding strength, retrieval practice, spaced repetition, memory consolidation",
  SELF: "gap analysis, deliberate practice, mastery development, continuous improvement",
  FINANCE: "risk-return trade-offs, systemic interdependencies, information asymmetry, market dynamics",
  ENGINEER: "integration complexity, elegance under constraints, scalable architectures, optimization",
  HSCIENCE: "research frontiers, theory-practice integration, novel methodology, paradigm shifts",
  INFO: "semantic depth, information density, computational elegance, meaning representation",
  ESOTERIC: "nonlinear dynamics, emergence, self-organization, complex adaptive systems",
};

const subdomains = {
  META: ["self-reference", "epistemology", "reasoning patterns", "meta-cognition"],
  OPS: ["planning", "execution", "adaptation", "coordination"],
  AI: ["reasoning", "scaling", "emergence", "alignment"],
  MATH: ["proof", "abstraction", "invariants", "structure"],
  PHYS: ["conservation", "symmetry", "dynamics", "coupling"],
  NAT: ["adaptation", "selection", "emergence", "ecology"],
  MED: ["diagnosis", "treatment", "prevention", "precision"],
  BUS: ["strategy", "value", "advantage", "growth"],
  HUM: ["culture", "context", "history", "institutions"],
  ARTS: ["aesthetic", "technique", "meaning", "vision"],
  FUSION: ["synthesis", "cross-domain", "integration", "novel"],
  PERSONAL: ["adaptation", "mastery", "growth", "fit"],
  WORKFLOW: ["bottleneck", "automation", "collaboration", "efficiency"],
  MEMORY: ["encoding", "retrieval", "consolidation", "spacing"],
  SELF: ["assessment", "practice", "mastery", "improvement"],
  FINANCE: ["risk", "systems", "information", "dynamics"],
  ENGINEER: ["integration", "elegance", "scale", "optimization"],
  HSCIENCE: ["frontier", "theory", "method", "paradigm"],
  INFO: ["semantics", "density", "computation", "meaning"],
  ESOTERIC: ["dynamics", "emergence", "self-organization", "adaptation"],
};

const sophistication_markers = {
  1: ["basic concept", "foundational principle", "introduction"],
  5: ["intermediate application", "connecting concepts", "contextual understanding"],
  10: ["advanced synthesis", "nuanced reasoning", "handling complexity"],
  15: ["expert integration", "meta-pattern recognition", "emergent insights"],
  19: ["god-tier mastery", "recursive understanding", "transcendent synthesis"],
};

function select<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createQuestion(
  domainCode: string,
  level: number,
  questionNum: number,
  domainName: string
): any {
  const difficulty = Math.ceil((level / 19) * 10);
  const questionTypes = ["systems_analysis", "cross_domain_synthesis", "edge_case_reasoning", "ethical_tradeoff", "emergent_pattern_recognition", "meta_reasoning", "creative_integration", "predictive_modeling"];
  const qType = questionTypes[questionNum % questionTypes.length];

  const template = select(questionTemplates[qType as keyof typeof questionTemplates] || questionTemplates.systems_analysis);
  const subdomain = select(subdomains[domainCode as keyof typeof subdomains] || subdomains.META);
  const focus = domains_focus[domainCode as keyof typeof domains_focus] || "advanced reasoning";
  
  // Map level to nearest sophistication tier
  const tiers = [1, 5, 10, 15, 19];
  const tier = tiers.reduce((prev, curr) => Math.abs(curr - level) < Math.abs(prev - level) ? curr : prev);
  const marker = sophistication_markers[tier as keyof typeof sophistication_markers][0];

  // Fill template with domain-specific content
  let prompt = template
    .replace("{domain}", domainName)
    .replace("{perspective}", ["systems thinking", "first principles", "historical context", "stakeholder analysis"][questionNum % 4])
    .replace("{element1}", ["core mechanisms", "fundamental principles", "driving forces"][questionNum % 3])
    .replace("{element2}", ["emergent properties", "system constraints", "feedback loops"][questionNum % 3])
    .replace("{constraint1}", ["efficiency", "effectiveness", "equity"][questionNum % 3])
    .replace("{constraint2}", ["scalability", "sustainability", "resilience"][(questionNum + 1) % 3])
    .replace("{constraint3}", ["adaptability", "robustness", "innovation"][(questionNum + 2) % 3])
    .replace("{scenario}", `complex scenario in ${subdomain}`)
    .replace("{domain1}", domainName)
    .replace("{domain2}", ["psychology", "physics", "systems theory", "history"][questionNum % 4])
    .replace("{domain3}", domainName)
    .replace("{problem}", `real-world challenge requiring integration`)
    .replace("{concept1}", focus.split(",")[0])
    .replace("{concept2}", focus.split(",")[1] || focus)
    .replace("{element1}", subdomain)
    .replace("{element2}", ["innovation", "optimization", "understanding"][questionNum % 3])
    .replace("{extreme_condition}", ["scarcity", "abundance", "chaos", "perfect information"][questionNum % 4])
    .replace("{boundary_condition}", ["limits of scale", "breakdown of assumptions", "phase transitions"][questionNum % 3])
    .replace("{edge_case}", `boundary case in ${subdomain}`)
    .replace("{value1}", ["efficiency", "equity", "excellence"][questionNum % 3])
    .replace("{value2}", ["sustainability", "innovation", "stability"][(questionNum + 1) % 3])
    .replace("{framework1}", ["utilitarian", "deontological", "virtue ethics"][questionNum % 3])
    .replace("{framework2}", ["consequentialist", "contractarian", "care ethics"][(questionNum + 1) % 3])
    .replace("{framework3}", ["capabilities approach", "natural rights", "stakeholder theory"][(questionNum + 2) % 3])
    .replace("{metric1}", ["performance", "efficiency", "accuracy"][questionNum % 3])
    .replace("{metric2}", ["equity", "resilience", "sustainability"][(questionNum + 1) % 3])
    .replace("{stakeholder1}", ["efficiency maximizers", "affected communities", "long-term thinkers"][questionNum % 3])
    .replace("{stakeholder2}", ["innovators", "traditionalists", "pragmatists"][(questionNum + 1) % 3])
    .replace("{stakeholder3}", ["global interests", "local interests", "future generations"][(questionNum + 2) % 3])
    .replace("{phenomenon1}", subdomain)
    .replace("{phenomenon2}", focus.split(",")[0])
    .replace("{phenomenon3}", focus.split(",")[1] || "interconnection")
    .replace("{timespan}", ["decades", "centuries", "millennia"][questionNum % 3])
    .replace("{manifestation1}", ["in theory", "in practice", "historically"][questionNum % 3])
    .replace("{manifestation2}", ["in modern times", "in edge cases", "across cultures"][(questionNum + 1) % 3])
    .replace("{manifestation3}", ["in the future", "at scale", "under stress"][(questionNum + 2) % 3])
    .replace("{topic}", subdomain)
    .replace("{inspiration_field}", ["biology", "music", "mathematics", "literature", "engineering"][questionNum % 5])
    .replace("{technique1}", ["pattern recognition", "systems thinking", "first principles reasoning"][questionNum % 3])
    .replace("{approach2}", ["iterative refinement", "constraint satisfaction", "creative synthesis"][(questionNum + 1) % 3])
    .replace("{analogy}", ["a living organism", "a musical composition", "a market economy", "a learning system"][questionNum % 4]);

  const expectedAnswer = `A sophisticated analysis addressing the multi-dimensional aspects of this ${qType} question about ${subdomain} within ${domainName}. At this ${marker} level, the response should: (1) demonstrate deep understanding of ${focus}; (2) integrate multiple perspectives and constraints; (3) recognize nuanced trade-offs and implications; (4) anticipate second and third-order effects; (5) acknowledge uncertainty while providing actionable insights.`;

  return {
    id: `${domainCode}_L${level}_Q${questionNum}`,
    domain: domainName,
    domainCode,
    level,
    questionNumber: questionNum,
    difficulty,
    questionType: qType,
    prompt,
    expectedAnswer,
    metadata: {
      domainFocus: focus,
      subdomain,
      sophisticationMarker: marker,
      requiresIntegration: true,
      requiresMastery: true,
      estimatedTime: 5 + difficulty * 2,
    },
  };
}

function createSimulation(question: any, domainName: string): any {
  const attemptStages = [
    "Initial attempt shows partial understanding with some gaps",
    "Student demonstrates understanding but misses nuances",
    "Response addresses main points but lacks integration",
  ];

  const feedbackStages = [
    "Consider how the broader system context affects this",
    "You've identified key points; now integrate the trade-offs",
    "Solid foundation; build by connecting to first principles",
  ];

  const improvedStages = [
    "Improved answer incorporates feedback and deeper analysis",
    "Enhanced response demonstrates better integration of concepts",
    "Refined answer shows recognition of complexity and nuance",
  ];

  const outcomeStages = [
    "Strong improvement: Student now recognizes systems interdependence",
    "Significant learning: Integration of multiple perspectives achieved",
    "Mastery development: Nuanced understanding of trade-offs demonstrated",
  ];

  const reflectionStages = [
    "This question taught me to see beyond surface-level analysis",
    "I now understand the importance of considering multiple stakeholders",
    "This deepened my appreciation for systemic complexity",
  ];

  const idx = question.questionNumber % attemptStages.length;

  return {
    questionId: question.id,
    attempt1: `Student's first attempt: ${attemptStages[idx]} in the context of ${question.metadata.subdomain}. The response shows understanding of ${domainName} but misses critical interconnections. It addresses the immediate question but doesn't fully engage with the complexity.`,
    feedback1: `Expert feedback: ${feedbackStages[idx]}. Specifically, consider how ${question.metadata.domainFocus} should inform your analysis. What assumptions are you making? How would they change if you prioritized different values or constraints? Look for the meta-pattern underlying the surface phenomena.`,
    attempt2: `Improved student response: After considering the feedback, the student now provides a more sophisticated analysis. The response demonstrates: (1) Recognition of ${question.metadata.domainFocus} as central; (2) Integration of ${question.metadata.subdomain} with broader context; (3) Awareness of trade-offs and tensions; (4) More nuanced reasoning that acknowledges complexity and uncertainty.`,
    outcome: `Learning outcome: ${outcomeStages[idx]}. The student has moved from surface-level comprehension to deeper, systems-level understanding. Key insight: The complexity isn't a problem to eliminate but a feature to navigate thoughtfully. The student now recognizes that ${domainName} at this level requires holding multiple perspectives simultaneously.`,
    reflection: `${reflectionStages[idx]}. I see how ${question.metadata.subdomain} connects to the bigger picture of ${question.metadata.domainFocus}. Going forward, I'll approach ${domainName} questions by first identifying the underlying systems dynamics.`,
    learningJourney: {
      stage1: "Initial understanding - grasping basic concepts",
      stage2: "Expert guidance - identifying gaps and suggesting depth",
      stage3: "Integrated understanding - connecting multiple dimensions",
      stage4: "Validated learning - recognizing growth and mastery markers",
      stage5: "Internalized insight - committing to new understanding",
    },
  };
}

export function generateGodTierQuestion(domainCode: string, level: number, questionNum: number, domainName: string) {
  return createQuestion(domainCode, level, questionNum, domainName);
}

export function generateGodTierSimulation(question: any, domainName: string) {
  return createSimulation(question, domainName);
}

export const godTierSyntheticGenerator = {
  generateGodTierQuestion,
  generateGodTierSimulation,
};
