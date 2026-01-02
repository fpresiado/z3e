import * as fs from "fs";
import * as path from "path";

/**
 * ZEUS_ERROR JSON Logging Service
 * Standardized error logging for LLM repair and diagnostics
 */

export interface ZeusError {
  errorId: string;
  timestamp: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  component: string;
  errorType: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  clientId?: string;
  attempts?: number;
  recoveryAction?: string;
  status: "NEW" | "ACKNOWLEDGED" | "RESOLVED" | "ESCALATED";
}

export class ErrorLoggingService {
  private errorDir: string;
  private clientErrorDir: string;

  constructor() {
    this.errorDir = path.join(process.cwd(), "logs", "errors");
    this.clientErrorDir = path.join(process.cwd(), "logs", "errors", "clients");
    this.ensureDirectories();
  }

  private ensureDirectories() {
    if (!fs.existsSync(this.errorDir)) {
      fs.mkdirSync(this.errorDir, { recursive: true });
    }
    if (!fs.existsSync(this.clientErrorDir)) {
      fs.mkdirSync(this.clientErrorDir, { recursive: true });
    }
  }

  /**
   * Log ZEUS_ERROR in standardized JSON format
   */
  async logZeusError(error: ZeusError): Promise<{ logged: boolean; filename: string }> {
    try {
      const filename = `ZEUS_ERROR_${error.errorId}_${Date.now()}.json`;
      const filepath = path.join(this.errorDir, filename);

      const logEntry = {
        ...error,
        timestamp: error.timestamp || new Date().toISOString(),
        status: error.status || "NEW",
      };

      fs.writeFileSync(filepath, JSON.stringify(logEntry, null, 2));

      console.log(`[ZEUS_ERROR_LOG] ${filename}`);
      return { logged: true, filename };
    } catch (err: any) {
      console.error(`[ZEUS_ERROR_LOG_FAILED] ${err.message}`);
      return { logged: false, filename: "" };
    }
  }

  /**
   * Log client/remote AI errors
   */
  async logClientError(clientId: string, error: ZeusError): Promise<{ logged: boolean; filename: string }> {
    try {
      const clientDir = path.join(this.clientErrorDir, clientId);
      if (!fs.existsSync(clientDir)) {
        fs.mkdirSync(clientDir, { recursive: true });
      }

      const filename = `ZEUS_ERROR_${error.errorId}_${Date.now()}.json`;
      const filepath = path.join(clientDir, filename);

      const logEntry = {
        ...error,
        clientId,
        timestamp: error.timestamp || new Date().toISOString(),
      };

      fs.writeFileSync(filepath, JSON.stringify(logEntry, null, 2));

      console.log(`[CLIENT_ERROR_LOG] Client: ${clientId}, Error: ${filename}`);
      return { logged: true, filename };
    } catch (err: any) {
      console.error(`[CLIENT_ERROR_LOG_FAILED] ${err.message}`);
      return { logged: false, filename: "" };
    }
  }

  /**
   * Get all errors from directory
   */
  getErrors(limit: number = 100): ZeusError[] {
    try {
      const files = fs.readdirSync(this.errorDir).filter((f) => f.startsWith("ZEUS_ERROR"));
      const errors: ZeusError[] = [];

      files.slice(-limit).forEach((file) => {
        const filepath = path.join(this.errorDir, file);
        const content = fs.readFileSync(filepath, "utf-8");
        errors.push(JSON.parse(content));
      });

      return errors;
    } catch (err) {
      console.error(`[ERROR_RETRIEVAL_FAILED]`, err);
      return [];
    }
  }

  /**
   * Get client-specific errors
   */
  getClientErrors(clientId: string, limit: number = 50): ZeusError[] {
    try {
      const clientDir = path.join(this.clientErrorDir, clientId);
      if (!fs.existsSync(clientDir)) return [];

      const files = fs.readdirSync(clientDir).filter((f) => f.startsWith("ZEUS_ERROR"));
      const errors: ZeusError[] = [];

      files.slice(-limit).forEach((file) => {
        const filepath = path.join(clientDir, file);
        const content = fs.readFileSync(filepath, "utf-8");
        errors.push(JSON.parse(content));
      });

      return errors;
    } catch (err) {
      console.error(`[CLIENT_ERROR_RETRIEVAL_FAILED]`, err);
      return [];
    }
  }
}

export const errorLoggingService = new ErrorLoggingService();
