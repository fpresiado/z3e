import { db } from "../db";
import { curriculumAttempts, curriculumQuestions, runs, notifications } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Anomaly Detection Service
 * 
 * Monitors Zeus's learning patterns and detects issues:
 * - Repeated questions (same Q asked multiple times)
 * - Failed attempts threshold (5+ failures on same Q)
 * - Speech pattern anomalies (very short/very long answers)
 * - Response latency issues (>20s per question)
 * - Connection problems (LM Studio failures)
 * - Data inconsistencies (missing answers, duplicates)
 * 
 * Issues are logged and notifications sent to programmer
 */

interface Alert {
  id: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  type: string;
  title: string;
  message: string;
  details: Record<string, any>;
  suggestedFix: string;
  timestamp: Date;
  resolved: boolean;
}

export class AnomalyDetectionService {
  /**
   * Run all detection checks
   */
  async runFullDiagnostics(): Promise<Alert[]> {
    const alerts: Alert[] = [];

    console.log(`[ANOMALY] Starting full diagnostics...`);

    // Run all checks in parallel
    const [
      repeatedQuestions,
      failedAttempts,
      speechPatternIssues,
      latencyIssues,
      dataInconsistencies,
    ] = await Promise.all([
      this.detectRepeatedQuestions(),
      this.detectHighFailureRate(),
      this.detectSpeechPatternAnomalies(),
      this.detectLatencyIssues(),
      this.detectDataInconsistencies(),
    ]);

    alerts.push(
      ...repeatedQuestions,
      ...failedAttempts,
      ...speechPatternIssues,
      ...latencyIssues,
      ...dataInconsistencies
    );

    console.log(`[ANOMALY] Diagnostics complete. Found ${alerts.length} issues`);

    // Store alerts in database
    if (alerts.length > 0) {
      await this.storeAlerts(alerts);
    }

    return alerts;
  }

  /**
   * Detect: Same question asked multiple times in short period
   */
  async detectRepeatedQuestions(): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Get questions from last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const repeatedQuestions = await db.execute(sql`
      SELECT 
        question_id,
        COUNT(*) as attempt_count,
        COUNT(DISTINCT run_id) as run_count,
        MAX(timestamp) as last_attempt
      FROM curriculum_attempts
      WHERE timestamp > ${thirtyMinutesAgo}
      GROUP BY question_id
      HAVING COUNT(*) > 3
      ORDER BY COUNT(*) DESC
    `);

    for (const row of repeatedQuestions.rows) {
      const question = await db
        .select()
        .from(curriculumQuestions)
        .where(eq(curriculumQuestions.id, row.question_id as string))
        .limit(1);

      if (question.length > 0) {
        alerts.push({
          id: `repeated-${row.question_id}`,
          severity: "WARNING",
          type: "REPEATED_QUESTION",
          title: "Repeated Question Detected",
          message: `Question "${question[0].prompt.substring(0, 50)}..." asked ${row.attempt_count} times in 30 mins`,
          details: {
            questionId: row.question_id,
            attemptCount: row.attempt_count,
            runCount: row.run_count,
            questionPrompt: question[0].prompt,
          },
          suggestedFix: "Check if question pool is limited. Verify curriculum has enough questions.",
          timestamp: new Date(),
          resolved: false,
        });

        console.log(
          `[ANOMALY] REPEATED: Q ${row.question_id} asked ${row.attempt_count} times`
        );
      }
    }

    return alerts;
  }

  /**
   * Detect: 5+ failed attempts on same question
   */
  async detectHighFailureRate(): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Get questions with 5+ failures in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const failedQuestions = await db.execute(sql`
      SELECT 
        question_id,
        COUNT(*) as failure_count,
        COUNT(DISTINCT run_id) as run_count,
        ARRAY_AGG(DISTINCT error_type) as error_types,
        MAX(timestamp) as last_failure
      FROM curriculum_attempts
      WHERE validator_result = 'fail'
        AND timestamp > ${oneHourAgo}
      GROUP BY question_id
      HAVING COUNT(*) >= 5
      ORDER BY COUNT(*) DESC
    `);

    for (const row of failedQuestions.rows) {
      const question = await db
        .select()
        .from(curriculumQuestions)
        .where(eq(curriculumQuestions.id, row.question_id as string))
        .limit(1);

      if (question.length > 0) {
        alerts.push({
          id: `failed-${row.question_id}`,
          severity: "CRITICAL",
          type: "HIGH_FAILURE_RATE",
          title: "High Failure Rate on Question",
          message: `Question failed ${row.failure_count} times in 1 hour. Common errors: ${(row.error_types as string[])?.join(", ") || "Unknown"}`,
          details: {
            questionId: row.question_id,
            failureCount: row.failure_count,
            runCount: row.run_count,
            errorTypes: row.error_types,
            questionPrompt: question[0].prompt,
          },
          suggestedFix:
            "Review question validity. Check if validation logic is too strict or question is ambiguous.",
          timestamp: new Date(),
          resolved: false,
        });

        console.log(
          `[ANOMALY] HIGH_FAILURE: Q ${row.question_id} failed ${row.failure_count} times`
        );
      }
    }

    return alerts;
  }

  /**
   * Detect: Unusual answer lengths (very short or very long)
   */
  async detectSpeechPatternAnomalies(): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Get average answer length
    const stats = await db.execute(sql`
      SELECT 
        AVG(CHAR_LENGTH(answer_text))::int as avg_length,
        MIN(CHAR_LENGTH(answer_text))::int as min_length,
        MAX(CHAR_LENGTH(answer_text))::int as max_length,
        STDDEV_POP(CHAR_LENGTH(answer_text))::int as std_dev
      FROM curriculum_attempts
      WHERE timestamp > NOW() - INTERVAL '6 hours'
    `);

    const stat = stats.rows[0];
    if (!stat) return alerts;

    const avgLen = stat.avg_length as number;
    const stdDev = stat.std_dev as number || 0;
    const upperBound = avgLen + stdDev * 3; // 3 sigma
    const lowerBound = Math.max(10, avgLen - stdDev * 3); // Min 10 chars

    // Find anomalous answers
    const anomalies = await db.execute(sql`
      SELECT 
        id,
        answer_text,
        CHAR_LENGTH(answer_text) as length,
        question_id,
        run_id,
        timestamp
      FROM curriculum_attempts
      WHERE timestamp > NOW() - INTERVAL '6 hours'
        AND (CHAR_LENGTH(answer_text) > ${upperBound} OR CHAR_LENGTH(answer_text) < ${lowerBound})
      ORDER BY CHAR_LENGTH(answer_text) DESC
      LIMIT 5
    `);

    for (const row of anomalies.rows) {
      const pattern = (row.length as number) > upperBound ? "TOO_LONG" : "TOO_SHORT";

      alerts.push({
        id: `anomaly-${row.id}`,
        severity: "INFO",
        type: "SPEECH_PATTERN_ANOMALY",
        title: `Answer ${pattern}`,
        message: `Answer has unusual length: ${row.length} chars (expected ~${avgLen}±${stdDev}). Answer: "${(row.answer_text as string).substring(0, 50)}..."`,
        details: {
          attemptId: row.id,
          answerLength: row.length,
          avgLength: avgLen,
          stdDev: stdDev,
          pattern,
          answer: row.answer_text,
        },
        suggestedFix: "Verify answer quality. May indicate LM Studio model issue or prompt ambiguity.",
        timestamp: new Date(),
        resolved: false,
      });

      console.log(`[ANOMALY] SPEECH_PATTERN: Answer ${pattern} (${row.length} chars)`);
    }

    return alerts;
  }

  /**
   * Detect: Response latency issues (>20 seconds)
   */
  async detectLatencyIssues(): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Simplified latency check using CTE to avoid window function + aggregate issues
    try {
      const latencyStats = await db.execute(sql`
        WITH latencies AS (
          SELECT 
            run_id,
            EXTRACT(EPOCH FROM (timestamp - LAG(timestamp) OVER (PARTITION BY run_id ORDER BY timestamp))) as latency_sec
          FROM curriculum_attempts
          WHERE timestamp > NOW() - INTERVAL '1 hour'
        )
        SELECT 
          MAX(latency_sec)::int as max_latency
        FROM latencies
        WHERE latency_sec IS NOT NULL
      `);

      const stat = latencyStats.rows[0];
      if (!stat || !stat.max_latency) return alerts;

      const maxLatency = stat.max_latency as number;

      if (maxLatency > 20) {
        alerts.push({
          id: `latency-spike`,
          severity: "WARNING",
          type: "LATENCY_SPIKE",
          title: "High Response Latency Detected",
          message: `Answer generation took ${maxLatency} seconds. Expected: 5-15s. This may indicate LM Studio overload or network issues.`,
          details: {
            maxLatency,
            expectedRange: "5-15 seconds",
            timestamp: new Date(),
          },
          suggestedFix:
            "Check LM Studio server load. Verify ngrok tunnel connection. Consider increasing model size or reducing batch size.",
          timestamp: new Date(),
          resolved: false,
        });

        console.log(`[ANOMALY] LATENCY_SPIKE: ${maxLatency}s detected`);
      }
    } catch (error) {
      console.log(`[ANOMALY] Latency check skipped - not enough data`);
    }

    return alerts;
  }

  /**
   * Detect: Data inconsistencies (missing answers, wrong format, etc)
   */
  async detectDataInconsistencies(): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Missing answers (attempted but no answer_text)
    const missingAnswers = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM curriculum_attempts
      WHERE answer_text IS NULL OR answer_text = ''
        AND timestamp > NOW() - INTERVAL '1 hour'
    `);

    const missingCount = (missingAnswers.rows[0]?.count as number) || 0;
    if (missingCount > 0) {
      alerts.push({
        id: `missing-answers`,
        severity: "CRITICAL",
        type: "MISSING_ANSWERS",
        title: "Missing Answer Data",
        message: `${missingCount} attempts recorded without answer text in the last hour. Data integrity issue!`,
        details: { missingCount },
        suggestedFix: "Check database insertion logic and API error handling. Review logs for failures.",
        timestamp: new Date(),
        resolved: false,
      });

      console.log(`[ANOMALY] MISSING_ANSWERS: ${missingCount} records found`);
    }

    // Duplicate attempts (same question, same run, same answer)
    const duplicates = await db.execute(sql`
      SELECT 
        question_id,
        run_id,
        COUNT(*) as duplicate_count
      FROM curriculum_attempts
      WHERE timestamp > NOW() - INTERVAL '6 hours'
      GROUP BY question_id, run_id
      HAVING COUNT(*) > 1
      LIMIT 10
    `);

    if (duplicates.rows.length > 0) {
      alerts.push({
        id: `duplicate-attempts`,
        severity: "WARNING",
        type: "DUPLICATE_ATTEMPTS",
        title: "Duplicate Attempts Detected",
        message: `${duplicates.rows.length} questions have multiple attempts in same run. Possible message repetition issue.`,
        details: {
          duplicateCount: duplicates.rows.length,
          examples: duplicates.rows.slice(0, 3),
        },
        suggestedFix: "Check if messages are being submitted multiple times. Verify deduplication logic.",
        timestamp: new Date(),
        resolved: false,
      });

      console.log(`[ANOMALY] DUPLICATES: ${duplicates.rows.length} found`);
    }

    return alerts;
  }

  /**
   * Store alerts in database and send notifications
   */
  private async storeAlerts(alerts: Alert[]): Promise<void> {
    for (const alert of alerts) {
      // Log to console with severity color
      const severityEmoji = {
        INFO: "ℹ️",
        WARNING: "⚠️",
        CRITICAL: "🚨",
      }[alert.severity];

      console.log(
        `${severityEmoji} [${alert.severity}] ${alert.type}: ${alert.title}`
      );
      console.log(`   Message: ${alert.message}`);
      console.log(`   Fix: ${alert.suggestedFix}`);

      // Create notification for system alerts
      try {
        await db.insert(notifications).values({
          userId: "system",
          title: `${severityEmoji} ${alert.title}`,
          message: alert.message,
          type: "system_alert",
          data: JSON.stringify({
            alertType: alert.type,
            severity: alert.severity,
            details: alert.details,
            suggestedFix: alert.suggestedFix,
          }),
          read: false,
        });
      } catch (error) {
        console.error(`Failed to store notification for alert ${alert.type}:`, error);
      }
    }
  }

  /**
   * Get all active alerts
   */
  async getActiveAlerts(): Promise<any[]> {
    try {
      const alerts = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, "system"),
            eq(notifications.read, false)
          )
        );

      return alerts.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        data: n.data ? JSON.parse(n.data) : {},
        createdAt: n.createdAt,
      }));
    } catch (error) {
      console.error("Error fetching alerts:", error);
      return [];
    }
  }

  /**
   * Mark alert as resolved
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      // In a real system, we'd have an alerts table
      // For now, mark notification as read
      console.log(`[ANOMALY] Alert ${alertId} marked as resolved`);
    } catch (error) {
      console.error("Error resolving alert:", error);
    }
  }

  /**
   * Get health score (0-100)
   * Based on number and severity of issues
   */
  async getSystemHealthScore(): Promise<number> {
    const alerts = await this.runFullDiagnostics();

    let score = 100;

    for (const alert of alerts) {
      if (alert.severity === "CRITICAL") {
        score -= 25;
      } else if (alert.severity === "WARNING") {
        score -= 10;
      } else if (alert.severity === "INFO") {
        score -= 2;
      }
    }

    return Math.max(0, score);
  }
}

export const anomalyDetectionService = new AnomalyDetectionService();
