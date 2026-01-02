import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Eye, BookOpen } from "lucide-react";

const DOMAINS = [
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

const QUESTION_TYPES = [
  "systems_analysis",
  "cross_domain_synthesis",
  "edge_case_reasoning",
  "ethical_tradeoff",
  "emergent_pattern_recognition",
  "meta_reasoning",
  "creative_integration",
  "predictive_modeling",
];

export default function CurriculumBrowser() {
  const [selectedDomain, setSelectedDomain] = useState("META");
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"questions" | "simulations">("questions");
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [selectedSimulation, setSelectedSimulation] = useState<any>(null);

  const stats = useMemo(() => {
    const totalQuestions = 190000;
    const totalDomains = 20;
    const levelsPerDomain = 19;
    const questionsPerLevel = 500;
    
    return {
      totalQuestions,
      totalDomains,
      levelsPerDomain,
      questionsPerLevel,
      questionsPerDomain: questionsPerLevel * levelsPerDomain,
      totalSimulations: totalQuestions,
    };
  }, []);

  const getSophisticationMarker = (level: number) => {
    if (level <= 3) return "🟢 Basic";
    if (level <= 7) return "🟡 Intermediate";
    if (level <= 12) return "🟠 Advanced";
    if (level <= 17) return "🔴 Expert";
    return "🔵 God-Tier";
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
    if (difficulty <= 5) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
    if (difficulty <= 7) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
  };

  const getQuestionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      systems_analysis: "bg-blue-100 dark:bg-blue-900",
      cross_domain_synthesis: "bg-purple-100 dark:bg-purple-900",
      edge_case_reasoning: "bg-pink-100 dark:bg-pink-900",
      ethical_tradeoff: "bg-amber-100 dark:bg-amber-900",
      emergent_pattern_recognition: "bg-cyan-100 dark:bg-cyan-900",
      meta_reasoning: "bg-indigo-100 dark:bg-indigo-900",
      creative_integration: "bg-green-100 dark:bg-green-900",
      predictive_modeling: "bg-violet-100 dark:bg-violet-900",
    };
    return colors[type] || "bg-gray-100 dark:bg-gray-900";
  };

  return (
    <div className="w-full h-screen bg-background dark:bg-slate-950 overflow-hidden">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b bg-white dark:bg-slate-900 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Curriculum Browser</h1>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600 dark:text-gray-400">Total Questions</div>
                <div className="text-2xl font-bold">{stats.totalQuestions.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">Domains</div>
                <div className="text-2xl font-bold">{stats.totalDomains}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">Levels per Domain</div>
                <div className="text-2xl font-bold">{stats.levelsPerDomain}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">Questions/Level</div>
                <div className="text-2xl font-bold">{stats.questionsPerLevel}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex gap-4 p-6">
          {/* Sidebar */}
          <div className="w-80 flex flex-col gap-4">
            {/* Domain Selection */}
            <Card className="p-4 flex-1 flex flex-col overflow-hidden">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Domains ({DOMAINS.length})
              </h3>
              <div className="flex-1 overflow-y-auto pr-4">
                <div className="space-y-2">
                  {DOMAINS.map((domain) => (
                    <Button
                      key={domain.code}
                      variant={selectedDomain === domain.code ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start text-left h-auto py-2 px-3"
                      onClick={() => {
                        setSelectedDomain(domain.code);
                        setSelectedLevel(1);
                      }}
                      data-testid={`button-domain-${domain.code}`}
                    >
                      <div>
                        <div className="font-medium">{domain.code}</div>
                        <div className="text-xs text-muted-foreground">{domain.name.substring(0, 30)}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Level Selection */}
            <Card className="p-4">
              <h3 className="font-bold mb-3">Level {selectedLevel}</h3>
              <div className="text-xs text-muted-foreground mb-3">{getSophisticationMarker(selectedLevel)}</div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 19 }, (_, i) => i + 1).map((level) => (
                  <Button
                    key={level}
                    size="sm"
                    variant={selectedLevel === level ? "default" : "outline"}
                    onClick={() => setSelectedLevel(level)}
                    className="h-8 w-8 p-0"
                    data-testid={`button-level-${level}`}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Search & Controls */}
            <Card className="p-4">
              <div className="flex gap-2 items-center">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  data-testid="input-search-questions"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={viewMode === "questions" ? "default" : "outline"}
                    onClick={() => setViewMode("questions")}
                    data-testid="button-view-questions"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Questions
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === "simulations" ? "default" : "outline"}
                    onClick={() => setViewMode("simulations")}
                    data-testid="button-view-simulations"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Simulations
                  </Button>
                </div>
              </div>
            </Card>

            {/* Questions/Simulations Display */}
            <Card className="flex-1 p-4 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">
                  {viewMode === "questions" ? "Questions" : "Learning Simulations"} - {selectedDomain} Level {selectedLevel}
                </h3>
                <Button size="sm" variant="outline" data-testid="button-download">
                  <Download className="w-4 h-4 mr-2" />
                  Download Level
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="space-y-3 pr-4">
                  {viewMode === "questions" && (
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        Showing 500 questions per level × 19 levels = 9,500 questions per domain
                      </div>
                      {[1, 2, 3, 4, 5].map((idx) => {
                        const qNum = idx;
                        const questionId = `${selectedDomain}_L${selectedLevel}_Q${qNum}`;
                        const difficulty = Math.ceil((selectedLevel / 19) * 10);
                        const qType = QUESTION_TYPES[qNum % QUESTION_TYPES.length];
                        
                        return (
                          <Card
                            key={qNum}
                            className={`p-4 cursor-pointer hover-elevate transition-all ${getQuestionTypeColor(qType)}`}
                            onClick={() => setSelectedQuestion({ id: questionId, level: selectedLevel, qNum, qType })}
                            data-testid={`card-question-${qNum}`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1">
                                <div className="font-bold text-sm">{questionId}</div>
                                <div className="text-xs text-muted-foreground">{qType.replace(/_/g, " ")}</div>
                              </div>
                              <div className="flex gap-2">
                                <Badge className={getDifficultyColor(difficulty)}>
                                  D{difficulty}
                                </Badge>
                                <Badge variant="secondary">Q{qNum}</Badge>
                              </div>
                            </div>
                            <p className="text-sm line-clamp-2">
                              Analyze domain through the lens of first principles. How do the interactions between core mechanisms and emergent properties create feedback loops?
                            </p>
                            <div className="mt-2 text-xs text-muted-foreground">
                              Est. time: {5 + difficulty * 2} min
                            </div>
                          </Card>
                        );
                      })}
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        ... and 495 more questions in this level
                      </div>
                    </div>
                  )}

                  {viewMode === "simulations" && (
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        Each question has a 5-stage learning simulation with feedback loops
                      </div>
                      {[1, 2, 3].map((idx) => {
                        const questionId = `${selectedDomain}_L${selectedLevel}_Q${idx}`;
                        return (
                          <Card
                            key={idx}
                            className="p-4 cursor-pointer hover-elevate"
                            onClick={() => setSelectedSimulation({ id: questionId, stage: idx })}
                            data-testid={`card-simulation-${idx}`}
                          >
                            <div className="font-bold text-sm mb-2">{questionId} - Simulation</div>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-semibold">Stage 1 (Attempt):</span>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Student's initial attempt shows partial understanding...
                                </p>
                              </div>
                              <div>
                                <span className="font-semibold">Stage 2 (Feedback):</span>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Expert feedback identifies gaps and suggests deeper analysis...
                                </p>
                              </div>
                              <div>
                                <span className="font-semibold">Stage 3-5 (Improvement & Reflection):</span>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Student integrates feedback and develops mastery...
                                </p>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        ... and 497 more simulations in this level
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
