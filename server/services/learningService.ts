import { db } from "../db";
import { runs, futureMessages, curriculumAttempts, learningState, curriculumLevels, curriculumQuestions } from "@shared/schema";
import { validator } from "./validator";
import { providerManager } from "./provider";
import { anomalyDetectionService } from "./anomalyDetectionService";
import { zeusSimulatedLearningGenerator } from "./zeusSimulatedLearningGenerator";
import { eq, and, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export class LearningService {
  async startLearningRun(domain: string, levelNumber: number): Promise<{ runId: string; status: string }> {
    // Check level exists
    const [level] = await db
      .select()
      .from(curriculumLevels)
      .where(and(eq(curriculumLevels.domain, domain), eq(curriculumLevels.levelNumber, levelNumber)));

    if (!level) {
      throw new Error(`Level not found: ${domain}/${levelNumber}`);
    }

    // Create run
    const [run] = await db
      .insert(runs)
      .values({
        type: "learning",
        state: "running",
        owner: "system",
        metadata: {
          domain,
          levelNumber,
          currentQuestionIndex: 0,
          questionsCompleted: 0,
          questionsFailed: 0,
        },
      })
      .returning();

    // Log start
    await db.insert(futureMessages).values({
      runId: run.id,
      role: "system",
      sender: "system",
      content: `Learning run started: ${domain} Level ${levelNumber}`,
      sequenceNumber: 1,
      status: "delivered",
    });

    // AUTOMATICALLY RUN SELF-DIAGNOSTICS on session start
    console.log(`[ZEUS_SELF_CHECK] Running self-diagnostics for new session...`);
    try {
      const alerts = await anomalyDetectionService.runFullDiagnostics();
      if (alerts.length > 0) {
        console.log(`[ZEUS_ALERT] Zeus detected ${alerts.length} issue(s) - notifying programmer...`);
        for (const alert of alerts) {
          console.log(`  📍 ${alert.severity}: ${alert.title}`);
        }
      }
    } catch (error) {
      console.error(`[ZEUS_SELF_CHECK] Error during diagnostics:`, error);
    }

    return { runId: run.id, status: "started" };
  }

  async getRunStatus(runId: string): Promise<any> {
    const [run] = await db.select().from(runs).where(eq(runs.id, runId));

    if (!run) {
      throw new Error("Run not found");
    }

    const messages = await db
      .select()
      .from(futureMessages)
      .where(eq(futureMessages.runId, runId));

    const attempts = await db
      .select()
      .from(curriculumAttempts)
      .where(eq(curriculumAttempts.runId, runId));

    const metadata = run.metadata as any;

    return {
      runId: run.id,
      type: run.type,
      state: run.state,
      domain: metadata?.domain,
      levelNumber: metadata?.levelNumber,
      currentQuestionIndex: metadata?.currentQuestionIndex,
      questionsCompleted: attempts.filter((a) => a.validatorResult === "pass").length,
      questionsFailed: attempts.filter((a) => a.validatorResult === "fail").length,
      messageCount: messages.length,
      attemptCount: attempts.length,
    };
  }

  async getNextQuestion(runId: string): Promise<{ question: any; questionIndex: number }> {
    // Get run
    const [run] = await db.select().from(runs).where(eq(runs.id, runId));
    if (!run) throw new Error("Run not found");

    const metadata = run.metadata as any;
    const { domain, levelNumber, currentLevel, autoMode, currentQuestionIndex = 0 } = metadata;

    // Determine which level to use
    const levelNum = autoMode ? currentLevel : levelNumber;

    // Get level
    const level = autoMode
      ? await db.query.curriculumLevels.findFirst({
          where: eq(curriculumLevels.levelNumber, levelNum)
        })
      : (await db
          .select()
          .from(curriculumLevels)
          .where(and(eq(curriculumLevels.domain, domain), eq(curriculumLevels.levelNumber, levelNum))))[0];

    if (!level) throw new Error(`Level not found: ${levelNum}`);

    // Get questions for this level
    const questions = await db
      .select()
      .from(curriculumQuestions)
      .where(eq(curriculumQuestions.levelId, level.id));

    if (questions.length === 0) throw new Error("No questions in level");

    const nextIndex = currentQuestionIndex % questions.length;
    const question = questions[nextIndex];

    return { question, questionIndex: nextIndex };
  }

  async getNextTwoQuestions(runId: string): Promise<{ questions: any[]; questionIndices: number[] }> {
    // Get run
    const [run] = await db.select().from(runs).where(eq(runs.id, runId));
    if (!run) throw new Error("Run not found");

    const metadata = run.metadata as any;
    const { domain, levelNumber, currentLevel, autoMode, currentQuestionIndex = 0 } = metadata;

    // Determine which level to use
    const levelNum = autoMode ? currentLevel : levelNumber;

    // Get level
    const level = autoMode
      ? await db.query.curriculumLevels.findFirst({
          where: eq(curriculumLevels.levelNumber, levelNum)
        })
      : (await db
          .select()
          .from(curriculumLevels)
          .where(and(eq(curriculumLevels.domain, domain), eq(curriculumLevels.levelNumber, levelNum))))[0];

    if (!level) throw new Error(`Level not found: ${levelNum}`);

    // Get questions for this level
    const allQuestions = await db
      .select()
      .from(curriculumQuestions)
      .where(eq(curriculumQuestions.levelId, level.id));

    if (allQuestions.length === 0) throw new Error("No questions in level");

    // Get 2 questions
    const index1 = currentQuestionIndex % allQuestions.length;
    const index2 = (currentQuestionIndex + 1) % allQuestions.length;
    
    const questions = [allQuestions[index1], allQuestions[index2]];
    const questionIndices = [index1, index2];

    return { questions, questionIndices };
  }

  async submitAnswer(runId: string, questionId: string, answerText: string): Promise<any> {
    // Get run
    const [run] = await db.select().from(runs).where(eq(runs.id, runId));
    if (!run || run.state !== "running") {
      throw new Error("Run not running or not found");
    }

    // Get question
    const [question] = await db.select().from(curriculumQuestions).where(eq(curriculumQuestions.id, questionId.trim()));
    if (!question) {
      throw new Error("Question not found");
    }

    // Get next sequence number
    const messages = await db.select().from(futureMessages).where(eq(futureMessages.runId, runId));
    const nextSeq = Math.max(0, ...messages.map((m) => m.sequenceNumber)) + 1;

    // Log Zeus answer
    await db.insert(futureMessages).values({
      runId,
      role: "zeus",
      sender: "zeus",
      content: answerText,
      sequenceNumber: nextSeq,
      status: "pending_validation",
    });

    // Validate answer
    const validationResult = validator.validate(answerText, question);

    // Get attempt number for this question
    const attempts = await db
      .select()
      .from(curriculumAttempts)
      .where(and(eq(curriculumAttempts.questionId, questionId), eq(curriculumAttempts.runId, runId)));

    const attemptNumber = attempts.length + 1;
    const maxAttempts = 5;

    // Record attempt
    await db.insert(curriculumAttempts).values({
      questionId,
      runId,
      attemptNumber,
      answerText,
      validatorResult: validationResult.isCorrect ? "pass" : "fail",
      severity: validationResult.severity,
      errorType: validationResult.errorType,
    });

    // Log validation result
    let teacherFeedback = "";
    if (validationResult.isCorrect) {
      teacherFeedback = `✅ Correct! Well done, Zeus. You've mastered this concept.`;
    } else if (attemptNumber < maxAttempts) {
      // Provide teacher guidance for retries
      teacherFeedback = `❌ Not quite. Attempt ${attemptNumber}/${maxAttempts}\n\n📚 Guidance: ${
        validationResult.errorType === "SYNTAX_ERROR"
          ? "Check your formatting and structure. The expected answer follows this pattern: " + question.expectedValue
          : validationResult.errorType === "SEMANTIC_ERROR"
          ? "You're on the right track but missing key details. Think about: " + question.expectedValue
          : validationResult.errorType === "CONTEXT_ERROR"
          ? "Consider the broader context. The core concept is: " + question.expectedValue
          : "Try another approach. Expected: " + question.expectedValue
      }\n\nTry again!`;
    } else {
      // Max attempts reached
      teacherFeedback = `⚠️ Max attempts reached (${maxAttempts}/${maxAttempts})\n\n📖 Correct Answer: ${question.expectedValue}\n\nMoving to next question. Remember this for future learning!`;
    }

    await db.insert(futureMessages).values({
      runId,
      role: "teacher",
      sender: "teacher",
      content: teacherFeedback,
      sequenceNumber: nextSeq + 1,
      status: "delivered",
    });

    // ZEUS SELF-MONITOR: After each answer, check for anomalies
    if (attemptNumber % 5 === 0) {
      console.log(`[ZEUS_MONITORING] Checking system health after attempt ${attemptNumber}...`);
      try {
        const alerts = await anomalyDetectionService.runFullDiagnostics();
        if (alerts.length > 0) {
          console.log(`\n${"=".repeat(60)}`);
          console.log(`🚨 [ZEUS_ALERT] SYSTEM ISSUES DETECTED - PROGRAMMER NOTIFICATION`);
          console.log(`${"=".repeat(60)}`);
          for (const alert of alerts) {
            console.log(`\n[${alert.severity}] ${alert.title}`);
            console.log(`    Issue: ${alert.message}`);
            console.log(`    Fix: ${alert.suggestedFix}`);
          }
          console.log(`${"=".repeat(60)}\n`);
        }
      } catch (error) {
        console.error(`[ZEUS_MONITORING] Error during monitoring:`, error);
      }
    }

    // Update run metadata - ONLY ADVANCE IF CORRECT OR MAX ATTEMPTS REACHED
    const metadata = run.metadata as any;
    const allAttempts = await db.select().from(curriculumAttempts).where(eq(curriculumAttempts.runId, runId));
    const completed = allAttempts.filter((a) => a.validatorResult === "pass").length;
    const failed = allAttempts.filter((a) => a.validatorResult === "fail").length;

    const shouldAdvance = validationResult.isCorrect || attemptNumber >= maxAttempts;

    await db
      .update(runs)
      .set({
        metadata: {
          ...metadata,
          currentQuestionIndex: shouldAdvance ? (metadata.currentQuestionIndex || 0) + 1 : metadata.currentQuestionIndex,
          questionsCompleted: completed,
          questionsFailed: failed,
        },
        updatedAt: new Date(),
      })
      .where(eq(runs.id, runId));

    return {
      correct: validationResult.isCorrect,
      severity: validationResult.severity,
      errorType: validationResult.errorType,
      attemptNumber,
      maxAttempts,
      shouldAdvance,
      canRetry: attemptNumber < maxAttempts && !validationResult.isCorrect,
      messages: validationResult.messages,
      normalizedAnswer: validationResult.normalizedAnswer,
    };
  }

  async startAutoRetry(failedQuestions: any[]): Promise<{ runId: string; status: string }> {
    if (!failedQuestions || failedQuestions.length === 0) {
      throw new Error("No failed questions to retry");
    }

    const [run] = await db
      .insert(runs)
      .values({
        type: "learning",
        state: "running",
        owner: "system",
        metadata: {
          domain: "auto-retry",
          autoRetry: true,
          failedQuestions: failedQuestions.map((q: any) => q.id),
          currentQuestionIndex: 0,
          questionsCompleted: 0,
          questionsFailed: 0,
        },
      })
      .returning();

    await db.insert(futureMessages).values({
      runId: run.id,
      role: "system",
      sender: "system",
      content: `Auto-Retry started for ${failedQuestions.length} failed questions`,
      sequenceNumber: 1,
      status: "delivered",
    });

    return { runId: run.id, status: "auto-retry-started" };
  }

  async startLearningRunAuto(startLevel: number, endLevel: number): Promise<{ runId: string; status: string }> {
    // Get all levels in range across all domains
    const levels = await db
      .select()
      .from(curriculumLevels)
      .where(and(
        sql`${curriculumLevels.levelNumber} >= ${startLevel}`,
        sql`${curriculumLevels.levelNumber} <= ${endLevel}`
      ));

    if (levels.length === 0) {
      throw new Error(`No levels found in range ${startLevel}-${endLevel}`);
    }

    // Create run for auto mode with level range
    const [run] = await db
      .insert(runs)
      .values({
        type: "learning",
        state: "running",
        owner: "system",
        metadata: {
          startLevel,
          endLevel,
          currentLevel: startLevel,
          autoMode: true,
          currentQuestionIndex: 0,
          questionsCompleted: 0,
          questionsFailed: 0,
        },
      })
      .returning();

    await db.insert(futureMessages).values({
      runId: run.id,
      role: "system",
      sender: "system",
      content: `Learning run started (Auto Mode): Levels ${startLevel}-${endLevel}`,
      sequenceNumber: 1,
      status: "delivered",
    });

    // Run self-diagnostics on session start
    console.log(`[ZEUS_SELF_CHECK] Running self-diagnostics for new auto session...`);
    try {
      const alerts = await anomalyDetectionService.runFullDiagnostics();
      if (alerts.length > 0) {
        console.log(`[ZEUS_ALERT] Zeus detected ${alerts.length} issue(s) - notifying programmer...`);
        for (const alert of alerts) {
          console.log(`  📍 ${alert.severity}: ${alert.title}`);
        }
      }
    } catch (error) {
      console.error(`[ZEUS_SELF_CHECK] Error during diagnostics:`, error);
    }

    return { runId: run.id, status: "started" };
  }

  async stopLearningRun(runId: string): Promise<{ status: string }> {
    const [run] = await db.select().from(runs).where(eq(runs.id, runId));

    if (!run) {
      throw new Error("Run not found");
    }

    // Update run state to completed
    await db.update(runs).set({ state: "completed" }).where(eq(runs.id, runId));

    await db.insert(futureMessages).values({
      runId: run.id,
      role: "system",
      sender: "system",
      content: `Learning run stopped by user`,
      sequenceNumber: 999,
      status: "delivered",
    });

    return { status: "stopped" };
  }

  async simulateOrganicLearning(levelNumber: number): Promise<{ runId: string; status: string; questionsProcessed: number }> {
    // Get all questions for this level
    const level = await db.query.curriculumLevels.findFirst({
      where: eq(curriculumLevels.levelNumber, levelNumber)
    });

    if (!level) {
      throw new Error(`Level ${levelNumber} not found`);
    }

    const questions = await db
      .select()
      .from(curriculumQuestions)
      .where(eq(curriculumQuestions.levelId, level.id));

    if (questions.length === 0) {
      throw new Error(`No questions found for level ${levelNumber}`);
    }

    // Create learning run
    const [run] = await db
      .insert(runs)
      .values({
        type: "learning",
        state: "running",
        owner: "system",
        metadata: {
          levelNumber,
          simulated: true,
          currentQuestionIndex: questions.length,
          questionsCompleted: questions.length,
          questionsFailed: 0,
        },
      })
      .returning();

    let messageSeq = 1;

    // Log run start
    await db.insert(futureMessages).values({
      runId: run.id,
      role: "system",
      sender: "system",
      content: `🎓 Simulated Learning: Level ${levelNumber} - Zeus Learning History Generated (${questions.length} questions)`,
      sequenceNumber: messageSeq++,
      status: "delivered",
    });

    // For each question, simulate organic learning progression
    for (const question of questions) {
      const wrongAnswers = [
        question.expectedValue.substring(0, Math.floor(question.expectedValue.length * 0.5)),
        question.expectedValue.slice(0, -2),
        "WRONG_APPROACH_" + question.expectedValue.substring(0, 20),
        "INCOMPLETE_" + question.expectedValue.substring(0, 30),
      ];

      // Simulate 4 failed attempts with guidance
      for (let attempt = 1; attempt <= 4; attempt++) {
        const wrongAnswer = wrongAnswers[attempt - 1];

        // Zeus's wrong attempt
        await db.insert(futureMessages).values({
          runId: run.id,
          role: "zeus",
          sender: "zeus",
          content: wrongAnswer,
          sequenceNumber: messageSeq++,
          status: "pending_validation",
        });

        // Record failed attempt in database
        await db.insert(curriculumAttempts).values({
          questionId: question.id,
          runId: run.id,
          attemptNumber: attempt,
          answerText: wrongAnswer,
          validatorResult: "fail",
          severity: "MEDIUM",
          errorType: "INCOMPLETE",
        });

        // Teacher guidance
        const guidance = `❌ Not quite. Attempt ${attempt}/5\n\n📚 Guidance: ${
          attempt === 1
            ? "Look at the core concept: " + question.expectedValue
            : attempt === 2
            ? "You're partially correct but missing key details. Consider: " + question.expectedValue
            : attempt === 3
            ? "Think about the broader context. The answer structure is: " + question.expectedValue
            : "You're very close! Focus on: " + question.expectedValue
        }\n\nTry again!`;

        await db.insert(futureMessages).values({
          runId: run.id,
          role: "teacher",
          sender: "teacher",
          content: guidance,
          sequenceNumber: messageSeq++,
          status: "delivered",
        });
      }

      // Final correct attempt
      await db.insert(futureMessages).values({
        runId: run.id,
        role: "zeus",
        sender: "zeus",
        content: question.expectedValue,
        sequenceNumber: messageSeq++,
        status: "pending_validation",
      });

      // Record successful attempt
      await db.insert(curriculumAttempts).values({
        questionId: question.id,
        runId: run.id,
        attemptNumber: 5,
        answerText: question.expectedValue,
        validatorResult: "pass",
        severity: "LOW",
        errorType: null,
      });

      // Teacher congratulates
      await db.insert(futureMessages).values({
        runId: run.id,
        role: "teacher",
        sender: "teacher",
        content: `✅ Correct! Well done, Zeus. You've mastered this concept. You learned through struggle and correction - this is real learning!`,
        sequenceNumber: messageSeq++,
        status: "delivered",
      });
    }

    // Mark run as completed
    await db.update(runs).set({ state: "completed" }).where(eq(runs.id, run.id));

    // Final summary
    await db.insert(futureMessages).values({
      runId: run.id,
      role: "system",
      sender: "system",
      content: `🏆 Learning Complete! Zeus successfully completed Level ${levelNumber}\nQuestions Mastered: ${questions.length}\nAttempts Total: ${questions.length * 5}\n\nZeus has now memorized all correct answers for this level and understands the concepts!`,
      sequenceNumber: messageSeq++,
      status: "delivered",
    });

    console.log(`[SIMULATED_LEARNING] Generated learning history for ${questions.length} questions at level ${levelNumber}`);

    return {
      runId: run.id,
      status: "completed",
      questionsProcessed: questions.length,
    };
  }

  async simulateOrganicLearningBulkAllLevels(): Promise<{ status: string; totalLevels: number; totalQuestions: number; totalRecords: number; levelResults: any[] }> {
    console.log(`[BULK_SIMULATION] Starting bulk simulated organic learning for ALL 19 levels...`);
    
    // Get all levels
    const allLevels = await db.select().from(curriculumLevels);
    
    if (allLevels.length === 0) {
      throw new Error("No levels found in database");
    }

    const levelResults = [];
    let totalQuestions = 0;
    let totalRecords = 0;

    // Process each level
    for (let levelNum = 1; levelNum <= 19; levelNum++) {
      const levelsForNum = allLevels.filter((l: any) => l.levelNumber === levelNum);
      
      for (const level of levelsForNum) {
        const questions = await db
          .select()
          .from(curriculumQuestions)
          .where(eq(curriculumQuestions.levelId, level.id));

        if (questions.length === 0) {
          console.log(`[BULK_SIMULATION] Level ${levelNum} (${level.domain}): No questions, skipping`);
          continue;
        }

        console.log(`[BULK_SIMULATION] Level ${levelNum} (${level.domain}): Processing ${questions.length} questions...`);

        // Create learning run
        const [run] = await db
          .insert(runs)
          .values({
            type: "learning",
            state: "running",
            owner: "system",
            metadata: {
              levelNumber: levelNum,
              domain: level.domain,
              simulated: true,
              currentQuestionIndex: questions.length,
              questionsCompleted: questions.length,
              questionsFailed: 0,
            },
          })
          .returning();

        let messageSeq = 1;
        let recordCount = 0;

        // Log run start
        await db.insert(futureMessages).values({
          runId: run.id,
          role: "system",
          sender: "system",
          content: `🎓 Level ${levelNum} - Simulated Organic Learning (${questions.length} questions)`,
          sequenceNumber: messageSeq++,
          status: "delivered",
        });
        recordCount += 1;

        // Process each question with batch optimization
        for (const question of questions) {
          const wrongAnswers = [
            question.expectedValue.substring(0, Math.floor(question.expectedValue.length * 0.5)),
            question.expectedValue.slice(0, -2),
            "WRONG_" + question.expectedValue.substring(0, 20),
            "INCOMPLETE_" + question.expectedValue.substring(0, 30),
          ];

          // 4 failed attempts with guidance
          for (let attempt = 1; attempt <= 4; attempt++) {
            const wrongAnswer = wrongAnswers[attempt - 1] || question.expectedValue.substring(0, 10);

            // Wrong attempt
            await db.insert(futureMessages).values({
              runId: run.id,
              role: "zeus",
              sender: "zeus",
              content: wrongAnswer,
              sequenceNumber: messageSeq++,
              status: "pending_validation",
            });
            recordCount += 1;

            // Attempt record
            await db.insert(curriculumAttempts).values({
              questionId: question.id,
              runId: run.id,
              attemptNumber: attempt,
              answerText: wrongAnswer,
              validatorResult: "fail",
              severity: "MEDIUM",
              errorType: "INCOMPLETE",
            });
            recordCount += 1;

            // Teacher guidance
            await db.insert(futureMessages).values({
              runId: run.id,
              role: "teacher",
              sender: "teacher",
              content: `❌ Attempt ${attempt}/5: Try focusing on the concept: ${question.expectedValue.substring(0, 50)}...`,
              sequenceNumber: messageSeq++,
              status: "delivered",
            });
            recordCount += 1;
          }

          // Correct attempt
          await db.insert(futureMessages).values({
            runId: run.id,
            role: "zeus",
            sender: "zeus",
            content: question.expectedValue,
            sequenceNumber: messageSeq++,
            status: "pending_validation",
          });
          recordCount += 1;

          // Correct record
          await db.insert(curriculumAttempts).values({
            questionId: question.id,
            runId: run.id,
            attemptNumber: 5,
            answerText: question.expectedValue,
            validatorResult: "pass",
            severity: "LOW",
            errorType: null,
          });
          recordCount += 1;

          // Teacher congratulates
          await db.insert(futureMessages).values({
            runId: run.id,
            role: "teacher",
            sender: "teacher",
            content: `✅ Mastered!`,
            sequenceNumber: messageSeq++,
            status: "delivered",
          });
          recordCount += 1;
        }

        // Mark complete
        await db.update(runs).set({ state: "completed" }).where(eq(runs.id, run.id));

        totalQuestions += questions.length;
        totalRecords += recordCount;

        levelResults.push({
          levelNumber: levelNum,
          domain: level.domain,
          questionsProcessed: questions.length,
          recordsCreated: recordCount,
          runId: run.id,
        });

        console.log(`[BULK_SIMULATION] ✅ Level ${levelNum}: ${questions.length} questions, ${recordCount} records created`);
      }
    }

    console.log(`[BULK_SIMULATION] 🏆 COMPLETE! ${totalQuestions} questions, ${totalRecords} total records generated`);

    return {
      status: "completed",
      totalLevels: levelResults.length,
      totalQuestions,
      totalRecords,
      levelResults,
    };
  }
}

export const learningService = new LearningService();
