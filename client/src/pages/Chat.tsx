import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Play, Pause, RotateCcw, MessageSquare } from "lucide-react";

interface Message {
  role: "system" | "zeus" | "teacher" | "user";
  content: string;
  status?: string;
  timestamp?: number;
}

export default function Chat() {
  const [currentRun, setCurrentRun] = useState<string | null>(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [autoStartLevel, setAutoStartLevel] = useState(1);
  const [autoEndLevel, setAutoEndLevel] = useState(4);
  const [messages, setMessages] = useState<Message[]>([]);
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [failedQuestions, setFailedQuestions] = useState<any[]>([]);
  const [autoRetryMode, setAutoRetryMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const { data: activeRuns = [] } = useQuery({
    queryKey: ["/api/runs"],
    queryFn: () => fetch("/api/runs").then((r) => r.json()).catch(() => []),
  });

  const { data: runStatus } = useQuery({
    queryKey: ["/api/learning/status", currentRun],
    queryFn: () =>
      currentRun ? fetch(`/api/learning/status/${currentRun}`).then((r) => r.json()) : null,
    enabled: !!currentRun && !isPaused,
    refetchInterval: 1000,
  });

  const { data: educationLevels = [] } = useQuery({
    queryKey: ["/api/education/levels"],
    queryFn: () => fetch("/api/education/levels").then((r) => r.json()),
  });

  useEffect(() => {
    if (educationLevels.length > 0) {
      setCurrentLevel(educationLevels[0].level);
      setAutoStartLevel(educationLevels[0].level);
      setAutoEndLevel(Math.min(4, educationLevels[educationLevels.length - 1].level));
    }
  }, [educationLevels]);

  const { data: questionData } = useQuery({
    queryKey: ["/api/learning/question", currentRun, runStatus?.state],
    queryFn: () =>
      currentRun && runStatus?.state === "running"
        ? fetch(`/api/learning/question/${currentRun}`).then((r) => r.json())
        : null,
    enabled: !!currentRun && runStatus?.state === "running" && !isPaused,
    refetchInterval: 500,
  });

  const currentQuestion = questionData?.questions?.[currentQuestionIndex];

  const { data: failedQuestionsData = [] } = useQuery({
    queryKey: ["/api/learning/failed-questions"],
    queryFn: () => fetch("/api/learning/failed-questions").then((r) => r.json()).catch(() => []),
  });

  const { data: dbMessages = [] } = useQuery({
    queryKey: ["/api/learning/messages", currentRun],
    queryFn: () =>
      currentRun ? fetch(`/api/learning/messages/${currentRun}`).then((r) => r.json()).catch(() => []) : [],
    enabled: !!currentRun,
    refetchInterval: 500,
  });

  const startRunMutation = useMutation({
    mutationFn: () => {
      const payload: any = {};

      if (autoMode) {
        payload.startLevel = autoStartLevel;
        payload.endLevel = autoEndLevel;
        payload.autoMode = true;
      } else {
        payload.levelNumber = currentLevel;
        payload.autoMode = false;
      }

      return apiRequest("POST", "/api/learning/start", payload);
    },
    onSuccess: (data) => {
      setCurrentRun(data.runId);
      const levelInfo = autoMode 
        ? `Levels ${autoStartLevel}-${autoEndLevel}` 
        : `Level ${currentLevel}`;
      setMessages([
        {
          role: "system",
          content: `Learning session started - ${levelInfo}${autoMode ? " (Auto Mode)" : ""}`,
          timestamp: Date.now(),
        },
      ]);
      setAutoRetryMode(false);
      setFailedQuestions([]);
    },
  });

  const startAutoRetryMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/learning/auto-retry", {
        failedQuestions: failedQuestionsData,
      }),
    onSuccess: (data) => {
      setCurrentRun(data.runId);
      setMessages([
        {
          role: "system",
          content: `Auto-Retry Mode started - Retrying ${failedQuestionsData.length} failed questions`,
          timestamp: Date.now(),
        },
      ]);
      setAutoRetryMode(true);
      setFailedQuestions(failedQuestionsData);
    },
  });

  const generateAnswerMutation = useMutation({
    mutationFn: () => {
      if (!currentRun || !currentQuestion) return Promise.reject("No question");
      return apiRequest("POST", "/api/learning/generate-answer", {
        runId: currentRun,
        questionId: currentQuestion.id,
      });
    },
    onSuccess: (result) => {
      const zeusAnswer = result.zeusAnswer || "No response generated";
      submitAnswerMutation.mutate(zeusAnswer);
    },
    onError: (error: any) => {
      console.error("Failed to generate answer:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `⚠️ Failed to generate answer: ${error.message || "check LM Studio connection"}`,
          timestamp: Date.now(),
        },
      ]);
      setIsSubmitting(false);
    },
  });

  const submitAnswerMutation = useMutation({
    mutationFn: (answer: string) => {
      if (!currentRun || !currentQuestion) return Promise.reject("No question");
      return apiRequest("POST", "/api/learning/answer", {
        runId: currentRun,
        questionId: currentQuestion.id,
        answerText: answer,
      });
    },
    onSuccess: (result) => {
      const newMessages: Message[] = [
        { role: "zeus", content: submitAnswerMutation.variables || "Analyzing...", timestamp: Date.now() },
        {
          role: "system",
          content: `Validation: ${result.correct ? "✓ PASS" : "✗ FAIL"} (${result.severity})`,
          timestamp: Date.now() + 100,
        },
      ];

      if (!result.correct && result.errorType) {
        newMessages.push({
          role: "teacher",
          content: `${result.errorType}`,
          timestamp: Date.now() + 200,
        });
        if (currentQuestion) {
          setFailedQuestions((prev) => [...prev, currentQuestion]);
        }
      }

      setMessages((prev) => [...prev, ...newMessages]);
      setAnswerText("");

      if (currentQuestionIndex === 0 && questionData?.questions?.length === 2) {
        setCurrentQuestionIndex(1);
        setIsSubmitting(false);
      } else {
        setCurrentQuestionIndex(0);
        setIsSubmitting(false);
        setTimeout(() => {
          queryClient.invalidateQueries({
            queryKey: ["/api/learning/status", currentRun],
          });
          queryClient.invalidateQueries({
            queryKey: ["/api/learning/question", currentRun],
          });
        }, 500);
      }
    },
  });

  const isRunActive = runStatus?.state === "running" && !isPaused;

  // Merge database messages and current question into display messages
  useEffect(() => {
    if (!currentRun) return;

    setMessages((prevMessages) => {
      const systemMessage = prevMessages[0];
      let updatedMessages = systemMessage ? [systemMessage] : [];

      // Add database messages
      if (dbMessages && dbMessages.length > 0) {
        const dbMsgs = dbMessages.map((msg: any) => ({
          role: msg.role || "system",
          content: msg.content || "",
          timestamp: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
        }));
        updatedMessages = [...updatedMessages, ...dbMsgs];
      }

      // Add current question if not already shown
      if (currentQuestion && questionData?.questions) {
        const questionShown = updatedMessages.some(
          (msg) => msg.content.includes(currentQuestion.prompt)
        );
        if (!questionShown) {
          updatedMessages.push({
            role: "teacher",
            content: currentQuestion.prompt,
            timestamp: Date.now(),
          });
        }
      }

      return updatedMessages;
    });
  }, [dbMessages, currentQuestion, currentRun, questionData?.questions]);

  useEffect(() => {
    if (autoMode && isRunActive && currentQuestion && !isSubmitting && answerText === "") {
      const timer = setTimeout(() => {
        setIsSubmitting(true);
        generateAnswerMutation.mutate();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [autoMode, isRunActive, currentQuestion, isSubmitting, answerText]);

  const stopRunMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/learning/stop", { runId: currentRun }),
    onSuccess: () => {
      setCurrentRun(null);
      setMessages([]);
      setAnswerText("");
      setIsSubmitting(false);
      setCurrentQuestionIndex(0);
      queryClient.invalidateQueries({ queryKey: ["/api/runs"] });
    },
  });

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 overflow-auto border rounded-lg mb-3 md:mb-4 p-2 md:p-4 bg-gray-50 dark:bg-gray-900">
        {!currentRun ? (
          <Card className="p-4 md:p-8 text-center space-y-4 md:space-y-6 w-full md:max-w-3xl md:mx-auto animate-scale-in">
            <h2 className="text-xl md:text-2xl font-bold">Start Learning</h2>

            <div className="space-y-3 md:space-y-4">
              {/* Mode Selection */}
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center">
                <Button
                  variant={!autoMode ? "default" : "secondary"}
                  onClick={() => setAutoMode(false)}
                  className="flex-1"
                  data-testid="button-manual-mode"
                >
                  Manual
                </Button>
                <Button
                  variant={autoMode ? "default" : "secondary"}
                  onClick={() => setAutoMode(true)}
                  className="flex-1"
                  data-testid="button-auto-mode"
                >
                  Auto
                </Button>
                {failedQuestionsData.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={() => startAutoRetryMutation.mutate()}
                    disabled={startAutoRetryMutation.isPending}
                    className="flex-1"
                    data-testid="button-auto-retry"
                  >
                    <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                    <span className="hidden sm:inline">Retry Failed</span>
                    <span className="sm:hidden">Retry</span> ({failedQuestionsData.length})
                  </Button>
                )}
              </div>

              {/* Level Selection - Conditional based on mode */}
              {!autoMode ? (
                // Manual Mode - Single Level
                <div className="w-full">
                  <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">Select Level</label>
                  <select
                    value={currentLevel}
                    onChange={(e: any) => setCurrentLevel(Number(e.target.value))}
                    className="w-full border border-input rounded-md px-2 md:px-3 py-1.5 md:py-2 text-sm bg-background shadow-sm hover:bg-accent/5 focus:outline-none focus:ring-2 focus:ring-ring"
                    data-testid="select-level-manual"
                  >
                    {educationLevels.length === 0 ? (
                      <option disabled>No levels available</option>
                    ) : (
                      educationLevels.map((level: any) => (
                        <option key={level.level} value={level.level}>
                          Level {level.level}: {level.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              ) : (
                // Auto Mode - Level Range
                <div className="w-full space-y-2 md:space-y-3">
                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">Start Level</label>
                    <select
                      value={autoStartLevel}
                      onChange={(e: any) => {
                        const newStart = Number(e.target.value);
                        setAutoStartLevel(newStart);
                        if (newStart > autoEndLevel) {
                          setAutoEndLevel(newStart);
                        }
                      }}
                      className="w-full border border-input rounded-md px-2 md:px-3 py-1.5 md:py-2 text-sm bg-background shadow-sm hover:bg-accent/5 focus:outline-none focus:ring-2 focus:ring-ring"
                      data-testid="select-level-start"
                    >
                      {educationLevels.length === 0 ? (
                        <option disabled>No levels available</option>
                      ) : (
                        educationLevels.map((level: any) => (
                          <option key={level.level} value={level.level}>
                            Level {level.level}: {level.label}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">End Level</label>
                    <select
                      value={autoEndLevel}
                      onChange={(e: any) => {
                        const newEnd = Number(e.target.value);
                        setAutoEndLevel(newEnd);
                        if (newEnd < autoStartLevel) {
                          setAutoStartLevel(newEnd);
                        }
                      }}
                      className="w-full border border-input rounded-md px-2 md:px-3 py-1.5 md:py-2 text-sm bg-background shadow-sm hover:bg-accent/5 focus:outline-none focus:ring-2 focus:ring-ring"
                      data-testid="select-level-end"
                    >
                      {educationLevels.length === 0 ? (
                        <option disabled>No levels available</option>
                      ) : (
                        educationLevels
                          .filter((l: any) => l.level >= autoStartLevel)
                          .map((level: any) => (
                            <option key={level.level} value={level.level}>
                              Level {level.level}: {level.label}
                            </option>
                          ))
                      )}
                    </select>
                  </div>
                </div>
              )}

              {/* Start Button */}
              <Button
                onClick={() => startRunMutation.mutate()}
                disabled={startRunMutation.isPending || educationLevels.length === 0}
                size="lg"
                className="w-full text-sm md:text-base"
                data-testid="button-start-learning"
              >
                {startRunMutation.isPending ? "Starting..." : `Start ${autoMode ? "Auto" : "Manual"} Learning`}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col space-y-2 md:space-y-3">
            {messages.map((msg, idx) => {
              const isZeus = msg.role === "zeus";
              const isTeacher = msg.role === "teacher";
              const isSystem = msg.role === "system";

              const roleNames: Record<string, string> = {
                zeus: "Zeus (AI Student)",
                teacher: "Teacher",
                system: "System",
              };

              return (
                <div
                  key={`${idx}-${msg.timestamp || idx}`}
                  className={`flex ${isZeus ? "justify-end" : "justify-start"} w-full px-1 animate-slide-in-up transition-all duration-300`}
                  data-testid={`message-${msg.role}-${idx}`}
                  style={{
                    animationDelay: `${idx * 50}ms`,
                  }}
                >
                  <div className={`max-w-xs sm:max-w-sm md:max-w-md ${isSystem ? "w-full" : ""}`}>
                    <p className="text-xs font-semibold mb-0.5 md:mb-1 px-2 opacity-70">
                      {roleNames[msg.role as keyof typeof roleNames] || msg.role}
                    </p>

                    <div
                      className={`rounded-lg px-2 md:px-4 py-1 md:py-2 word-wrap text-xs md:text-sm transition-all duration-200 hover:shadow-md ${
                        isSystem
                          ? "bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 text-center"
                          : isZeus
                          ? "bg-blue-500 text-white rounded-br-none hover:bg-blue-600"
                          : isTeacher
                          ? "bg-orange-500 text-white rounded-bl-none hover:bg-orange-600"
                          : "bg-green-500 text-white rounded-bl-none hover:bg-green-600"
                      }`}
                    >
                      <p className="break-words">{msg.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      {currentRun && (
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mt-2 md:mt-4 animate-slide-in-up transition-all duration-300">
          {!isRunActive ? (
            <>
              <Button
                onClick={() => setIsPaused(false)}
                variant="secondary"
                className="flex-1 text-xs md:text-sm"
                data-testid="button-resume-learning"
              >
                <Play className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                Resume
              </Button>
              <Button
                onClick={() => stopRunMutation.mutate()}
                variant="destructive"
                className="flex-1 text-xs md:text-sm"
                data-testid="button-stop-learning"
              >
                Stop Learning
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => setIsPaused(true)}
                variant="secondary"
                className="flex-1 text-xs md:text-sm"
                data-testid="button-pause-learning"
              >
                <Pause className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                Pause
              </Button>
              <Button
                onClick={() => stopRunMutation.mutate()}
                variant="destructive"
                className="flex-1 text-xs md:text-sm"
                data-testid="button-stop-learning"
              >
                Stop Learning
              </Button>
            </>
          )}
        </div>
      )}

      {/* Manual Answer Input - Only shown in manual mode */}
      {currentRun && !autoMode && isRunActive && (
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mt-2 md:mt-4 animate-slide-in-up transition-all duration-300">
          <input
            type="text"
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && answerText.trim() && !isSubmitting) {
                setIsSubmitting(true);
                submitAnswerMutation.mutate(answerText);
              }
            }}
            placeholder="Type answer..."
            className="flex-1 border border-input rounded-md px-2 md:px-3 py-1.5 md:py-2 bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-xs md:text-sm transition-all duration-200 focus:shadow-lg"
            disabled={isSubmitting}
            data-testid="input-answer"
          />
          <Button
            onClick={() => {
              setIsSubmitting(true);
              submitAnswerMutation.mutate(answerText);
            }}
            disabled={!answerText.trim() || isSubmitting}
            className="text-xs md:text-sm"
            data-testid="button-submit-answer"
          >
            Submit
          </Button>
        </div>
      )}
    </div>
  );
}
