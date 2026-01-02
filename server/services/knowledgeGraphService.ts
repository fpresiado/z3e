import { db } from "../db";

export class KnowledgeGraphService {
  // Graph nodes: Concepts, Skills, Questions, Error Patterns
  private concepts: Map<string, any> = new Map();
  private skills: Map<string, any> = new Map();
  private edges: Map<string, any[]> = new Map();

  constructor() {
    this.initializeGraph();
  }

  private initializeGraph() {
    // Create core concept nodes for all tracks
    const conceptDefinitions = {
      // Human track concepts
      "confirmation-bias": { track: "human", level: 3, category: "cognitive" },
      "decision-making": { track: "human", level: 5, category: "behavior" },
      "systems-thinking": { track: "human", level: 7, category: "meta" },
      
      // AI track concepts
      "gradient-descent": { track: "ai", level: 5, category: "algorithm" },
      "overfitting": { track: "ai", level: 6, category: "training" },
      "attention-mechanism": { track: "ai", level: 10, category: "architecture" },
      
      // God-tier concepts
      "pattern-abstraction": { track: "god-tier", level: 8, category: "meta" },
      "infinite-context": { track: "god-tier", level: 15, category: "architecture" },
      "theory-synthesis": { track: "god-tier", level: 18, category: "reasoning" },
    };

    Object.entries(conceptDefinitions).forEach(([id, data]) => {
      this.concepts.set(id, { id, ...data });
    });

    // Create skill nodes
    const skillDefinitions = [
      "critical-thinking", "pattern-recognition", "system-design",
      "debugging", "optimization", "abstraction", "synthesis"
    ];

    skillDefinitions.forEach((skill) => {
      this.skills.set(skill, { id: skill, category: "skill" });
    });

    // Create edges between concepts
    this.addEdge("confirmation-bias", "decision-making", "prerequisite");
    this.addEdge("decision-making", "systems-thinking", "reinforces");
    this.addEdge("gradient-descent", "overfitting", "related");
    this.addEdge("attention-mechanism", "pattern-abstraction", "analogous");
  }

  private addEdge(from: string, to: string, type: string) {
    if (!this.edges.has(from)) {
      this.edges.set(from, []);
    }
    this.edges.get(from)!.push({ to, type });
  }

  getConceptNeighbors(conceptId: string, radius: number = 1): any[] {
    const neighbors: any[] = [];
    const visited = new Set<string>();

    const traverse = (id: string, depth: number) => {
      if (depth === 0 || visited.has(id)) return;
      visited.add(id);

      const edges = this.edges.get(id) || [];
      edges.forEach(({ to, type }) => {
        if (this.concepts.has(to)) {
          neighbors.push({
            id: to,
            concept: this.concepts.get(to),
            edgeType: type,
            distance: radius - depth + 1,
          });
        }
        traverse(to, depth - 1);
      });
    };

    traverse(conceptId, radius);
    return neighbors;
  }

  getPrerequisites(conceptId: string): any[] {
    const prerequisites: any[] = [];
    const edges = this.edges.get(conceptId) || [];
    
    edges.forEach(({ to, type }) => {
      if (type === "prerequisite" && this.concepts.has(to)) {
        prerequisites.push(this.concepts.get(to));
      }
    });

    return prerequisites;
  }

  getSkillPath(fromSkill: string, toSkill: string): any[] {
    // Simple pathfinding between skills
    // This would be more sophisticated in production
    return [
      this.skills.get(fromSkill),
      { intermediate: true },
      this.skills.get(toSkill),
    ].filter((x) => x);
  }

  async loadFromDatabase() {
    // Load concepts and skills from curriculum data
    console.log("[KnowledgeGraph] Loading from database...");
  }

  exportGraph(): any {
    return {
      concepts: Array.from(this.concepts.values()),
      skills: Array.from(this.skills.values()),
      edges: Array.from(this.edges.entries()).map(([from, edges]) => ({
        from,
        connections: edges,
      })),
    };
  }
}

export const knowledgeGraphService = new KnowledgeGraphService();
