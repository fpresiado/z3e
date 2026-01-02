import { CurriculumQuestion } from "@shared/schema";

export interface ValidationResult {
  isCorrect: boolean;
  severity: "NONE" | "MILD" | "MODERATE" | "SEVERE";
  errorType: string | null;
  messages: string[];
  normalizedAnswer?: string;
}

export class AnswerValidator {
  validate(answer: string, question: CurriculumQuestion): ValidationResult {
    const trimmed = answer.trim();

    // RULE: No empty answers
    if (!trimmed) {
      return {
        isCorrect: false,
        severity: "SEVERE",
        errorType: "EMPTY_ANSWER",
        messages: ["Answer cannot be empty"],
      };
    }

    const expectedCategory = question.expectedCategory || "";
    const expectedFormat = question.expectedFormat || "literal";

    if (expectedFormat === "literal") {
      return this.validateLiteral(trimmed, expectedCategory);
    }

    return {
      isCorrect: true,
      severity: "NONE",
      errorType: null,
      messages: ["Valid answer"],
      normalizedAnswer: trimmed,
    };
  }

  private validateLiteral(answer: string, expectedCategory: string): ValidationResult {
    // RULE: Single sentence only (no periods, no newlines except final)
    const sentences = answer.split(/[.!?]/).filter((s) => s.trim().length > 0);
    if (sentences.length > 1) {
      return {
        isCorrect: false,
        severity: "SEVERE",
        errorType: "MULTI_SENTENCE",
        messages: ["Answer must be a single sentence. No multiple sentences allowed."],
      };
    }

    // RULE: Must match format "<subject> is <value>."
    const literalPattern = /^(.+?)\s+(?:is|=|equals|shows|displays)\s+(.+?)\.?$/i;
    const match = answer.match(literalPattern);

    if (!match) {
      return {
        isCorrect: false,
        severity: "SEVERE",
        errorType: "FORMAT_VIOLATION",
        messages: ['Answer must follow format: "<metric> is <value>."'],
      };
    }

    const [, metricPart, valuePart] = match;
    const cleanValue = valuePart.replace(/\.+$/, "").trim();

    // RULE: Category lock - detect which category is referenced
    const answerCategory = this.detectCategory(metricPart);

    if (!answerCategory || answerCategory !== expectedCategory) {
      return {
        isCorrect: false,
        severity: "SEVERE",
        errorType: "WRONG_CATEGORY",
        messages: [
          `Wrong metric. Expected: ${expectedCategory}, but answered about: ${answerCategory || "unknown"}`,
        ],
      };
    }

    // RULE: Check for multiple metrics in one answer
    if (this.containsMultipleMetrics(answer)) {
      return {
        isCorrect: false,
        severity: "SEVERE",
        errorType: "MULTIPLE_METRICS",
        messages: ["Answer mentions multiple metrics. Answer only the asked metric."],
      };
    }

    // If we reach here, answer is structurally valid
    // Classify severity based on other factors
    const severity = this.classifySeverity(answer, cleanValue);

    return {
      isCorrect: severity === "NONE",
      severity,
      errorType: severity === "NONE" ? null : "VALUE_VARIANCE",
      messages: [severity === "NONE" ? "Valid answer" : `Acceptable but not exact (severity: ${severity})`],
      normalizedAnswer: answer.trim(),
    };
  }

  private detectCategory(metricPart: string): string | null {
    const lower = metricPart.toLowerCase();

    if (lower.includes("cpu")) return "CPU_LOAD";
    if (lower.includes("memory") || lower.includes("ram")) return "MEMORY_USAGE";
    if (lower.includes("disk")) return "DISK_USAGE";
    if (lower.includes("response") || lower.includes("latency")) return "RESPONSE_TIME";
    if (lower.includes("status")) return "STATUS_CODE";
    if (lower.includes("load")) return "CPU_LOAD";

    return null;
  }

  private containsMultipleMetrics(answer: string): boolean {
    const metrics = [
      { pattern: /\bcpu\b/i, cat: "CPU_LOAD" },
      { pattern: /\bmemory\b|\bram\b/i, cat: "MEMORY_USAGE" },
      { pattern: /\bdisk\b/i, cat: "DISK_USAGE" },
      { pattern: /\bresponse\b|\blatency\b/i, cat: "RESPONSE_TIME" },
      { pattern: /\bstatus\b/i, cat: "STATUS_CODE" },
    ];

    let foundCategories = new Set<string>();
    for (const { pattern, cat } of metrics) {
      if (pattern.test(answer)) {
        foundCategories.add(cat);
      }
    }

    return foundCategories.size > 1;
  }

  private classifySeverity(answer: string, value: string): "NONE" | "MILD" | "MODERATE" | "SEVERE" {
    // Check for indicators of lower severity issues
    if (answer.includes("seems") || answer.includes("appears") || answer.includes("looks")) {
      return "MILD"; // Speculative language
    }

    if (answer.toLowerCase().startsWith("the ")) {
      return "MILD"; // Article usage
    }

    return "NONE"; // Clean, valid answer
  }
}

export const validator = new AnswerValidator();
