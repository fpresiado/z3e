import { db } from "./db";
import { eq, desc, asc, and } from "drizzle-orm";
import {
  conversations, messages, settings, healthMetrics, systemLogs,
  runs, curriculumLevels, curriculumQuestions, curriculumAttempts, learningState,
  educationLevelRuns, educationLevelMessages, educationLevelSubjects,
  InsertConversation, InsertMessage, InsertSetting, InsertHealthMetric,
  InsertSystemLog, InsertRun, InsertCurriculumLevel, InsertCurriculumQuestion,
  InsertCurriculumAttempt, InsertLearningState, InsertEducationLevelRun,
  InsertEducationLevelMessage, InsertEducationLevelSubject,
  Conversation, Message, Setting, HealthMetric, SystemLog, Run,
  CurriculumLevel, CurriculumQuestion, CurriculumAttempt, LearningState,
  EducationLevelRun, EducationLevelMessage, EducationLevelSubject
} from "@shared/schema";

export interface IStorage {
  getConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(data: InsertConversation): Promise<Conversation>;
  deleteConversation(id: string): Promise<void>;
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(data: InsertMessage): Promise<Message>;
  getSetting(key: string): Promise<Setting | undefined>;
  upsertSetting(key: string, value: any): Promise<Setting>;
  createHealthMetric(data: InsertHealthMetric): Promise<HealthMetric>;
  getLatestHealthMetric(): Promise<HealthMetric | undefined>;
  createSystemLog(data: InsertSystemLog): Promise<SystemLog>;
  getSystemLogs(limit?: number): Promise<SystemLog[]>;
  getRuns(type?: string): Promise<Run[]>;
  getRun(id: string): Promise<Run | undefined>;
  createRun(data: InsertRun): Promise<Run>;
  updateRun(id: string, data: Partial<Run>): Promise<Run | undefined>;
  deleteRun(id: string): Promise<void>;
  getCurriculumLevels(domain?: string): Promise<CurriculumLevel[]>;
  getCurriculumLevel(id: string): Promise<CurriculumLevel | undefined>;
  getCurriculumLevelByNumber(domain: string, levelNumber: number): Promise<CurriculumLevel | undefined>;
  createCurriculumLevel(data: InsertCurriculumLevel): Promise<CurriculumLevel>;
  getCurriculumQuestions(levelId: string): Promise<CurriculumQuestion[]>;
  getCurriculumQuestion(id: string): Promise<CurriculumQuestion | undefined>;
  createCurriculumQuestion(data: InsertCurriculumQuestion): Promise<CurriculumQuestion>;
  getCurriculumAttempts(runId: string): Promise<CurriculumAttempt[]>;
  createCurriculumAttempt(data: InsertCurriculumAttempt): Promise<CurriculumAttempt>;
  getLearningState(domain: string): Promise<LearningState | undefined>;
  upsertLearningState(data: InsertLearningState): Promise<LearningState>;
  getEducationLevelRuns(): Promise<EducationLevelRun[]>;
  getEducationLevelRun(id: string): Promise<EducationLevelRun | undefined>;
  createEducationLevelRun(data: InsertEducationLevelRun): Promise<EducationLevelRun>;
  updateEducationLevelRun(id: string, data: Partial<EducationLevelRun>): Promise<EducationLevelRun | undefined>;
  deleteEducationLevelRun(id: string): Promise<void>;
  getEducationLevelMessages(runId: string): Promise<EducationLevelMessage[]>;
  createEducationLevelMessage(data: InsertEducationLevelMessage): Promise<EducationLevelMessage>;
  getEducationLevelSubjects(levelNumber?: number): Promise<EducationLevelSubject[]>;
  createEducationLevelSubject(data: InsertEducationLevelSubject): Promise<EducationLevelSubject>;
}

export class DatabaseStorage implements IStorage {
  async getConversations(): Promise<Conversation[]> {
    return db.select().from(conversations).orderBy(desc(conversations.updatedAt));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async createConversation(data: InsertConversation): Promise<Conversation> {
    const [conversation] = await db.insert(conversations).values(data).returning();
    return conversation;
  }

  async deleteConversation(id: string): Promise<void> {
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.timestamp));
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(data).returning();
    return message;
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async upsertSetting(key: string, value: any): Promise<Setting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const [updated] = await db.update(settings).set({ value, updatedAt: new Date() }).where(eq(settings.key, key)).returning();
      return updated;
    }
    const [setting] = await db.insert(settings).values({ key, value }).returning();
    return setting;
  }

  async createHealthMetric(data: InsertHealthMetric): Promise<HealthMetric> {
    const [metric] = await db.insert(healthMetrics).values(data).returning();
    return metric;
  }

  async getLatestHealthMetric(): Promise<HealthMetric | undefined> {
    const [metric] = await db.select().from(healthMetrics).orderBy(desc(healthMetrics.timestamp)).limit(1);
    return metric;
  }

  async createSystemLog(data: InsertSystemLog): Promise<SystemLog> {
    const [log] = await db.insert(systemLogs).values(data).returning();
    return log;
  }

  async getSystemLogs(limit = 100): Promise<SystemLog[]> {
    return db.select().from(systemLogs).orderBy(desc(systemLogs.timestamp)).limit(limit);
  }

  async getRuns(type?: string): Promise<Run[]> {
    if (type) {
      return db.select().from(runs).where(eq(runs.type, type)).orderBy(desc(runs.createdAt));
    }
    return db.select().from(runs).orderBy(desc(runs.createdAt));
  }

  async getRun(id: string): Promise<Run | undefined> {
    const [run] = await db.select().from(runs).where(eq(runs.id, id));
    return run;
  }

  async createRun(data: InsertRun): Promise<Run> {
    const [run] = await db.insert(runs).values(data).returning();
    return run;
  }

  async updateRun(id: string, data: Partial<Run>): Promise<Run | undefined> {
    const [run] = await db.update(runs).set({ ...data, updatedAt: new Date() }).where(eq(runs.id, id)).returning();
    return run;
  }

  async deleteRun(id: string): Promise<void> {
    await db.delete(runs).where(eq(runs.id, id));
  }

  async getCurriculumLevels(domain?: string): Promise<CurriculumLevel[]> {
    if (domain) {
      return db.select().from(curriculumLevels).where(eq(curriculumLevels.domain, domain)).orderBy(asc(curriculumLevels.levelNumber));
    }
    return db.select().from(curriculumLevels).orderBy(asc(curriculumLevels.levelNumber));
  }

  async getCurriculumLevel(id: string): Promise<CurriculumLevel | undefined> {
    const [level] = await db.select().from(curriculumLevels).where(eq(curriculumLevels.id, id));
    return level;
  }

  async getCurriculumLevelByNumber(domain: string, levelNumber: number): Promise<CurriculumLevel | undefined> {
    const [level] = await db.select().from(curriculumLevels).where(and(eq(curriculumLevels.domain, domain), eq(curriculumLevels.levelNumber, levelNumber)));
    return level;
  }

  async createCurriculumLevel(data: InsertCurriculumLevel): Promise<CurriculumLevel> {
    const [level] = await db.insert(curriculumLevels).values(data).returning();
    return level;
  }

  async getCurriculumQuestions(levelId: string): Promise<CurriculumQuestion[]> {
    return db.select().from(curriculumQuestions).where(eq(curriculumQuestions.levelId, levelId)).orderBy(asc(curriculumQuestions.number));
  }

  async getCurriculumQuestion(id: string): Promise<CurriculumQuestion | undefined> {
    const [question] = await db.select().from(curriculumQuestions).where(eq(curriculumQuestions.id, id));
    return question;
  }

  async createCurriculumQuestion(data: InsertCurriculumQuestion): Promise<CurriculumQuestion> {
    const [question] = await db.insert(curriculumQuestions).values(data).returning();
    return question;
  }

  async getCurriculumAttempts(runId: string): Promise<CurriculumAttempt[]> {
    return db.select().from(curriculumAttempts).where(eq(curriculumAttempts.runId, runId)).orderBy(asc(curriculumAttempts.timestamp));
  }

  async createCurriculumAttempt(data: InsertCurriculumAttempt): Promise<CurriculumAttempt> {
    const [attempt] = await db.insert(curriculumAttempts).values(data).returning();
    return attempt;
  }

  async getLearningState(domain: string): Promise<LearningState | undefined> {
    const [state] = await db.select().from(learningState).where(eq(learningState.curriculumDomain, domain));
    return state;
  }

  async upsertLearningState(data: InsertLearningState): Promise<LearningState> {
    const existing = await this.getLearningState(data.curriculumDomain);
    if (existing) {
      const [updated] = await db.update(learningState).set({ ...data, updatedAt: new Date() }).where(eq(learningState.curriculumDomain, data.curriculumDomain)).returning();
      return updated;
    }
    const [state] = await db.insert(learningState).values(data).returning();
    return state;
  }

  async getEducationLevelRuns(): Promise<EducationLevelRun[]> {
    return db.select().from(educationLevelRuns).orderBy(desc(educationLevelRuns.createdAt));
  }

  async getEducationLevelRun(id: string): Promise<EducationLevelRun | undefined> {
    const [run] = await db.select().from(educationLevelRuns).where(eq(educationLevelRuns.id, id));
    return run;
  }

  async createEducationLevelRun(data: InsertEducationLevelRun): Promise<EducationLevelRun> {
    const [run] = await db.insert(educationLevelRuns).values(data).returning();
    return run;
  }

  async updateEducationLevelRun(id: string, data: Partial<EducationLevelRun>): Promise<EducationLevelRun | undefined> {
    const [run] = await db.update(educationLevelRuns).set({ ...data, updatedAt: new Date() }).where(eq(educationLevelRuns.id, id)).returning();
    return run;
  }

  async deleteEducationLevelRun(id: string): Promise<void> {
    await db.delete(educationLevelRuns).where(eq(educationLevelRuns.id, id));
  }

  async getEducationLevelMessages(runId: string): Promise<EducationLevelMessage[]> {
    return db.select().from(educationLevelMessages).where(eq(educationLevelMessages.runId, runId)).orderBy(asc(educationLevelMessages.id));
  }

  async createEducationLevelMessage(data: InsertEducationLevelMessage): Promise<EducationLevelMessage> {
    const [message] = await db.insert(educationLevelMessages).values(data).returning();
    return message;
  }

  async getEducationLevelSubjects(levelNumber?: number): Promise<EducationLevelSubject[]> {
    if (levelNumber !== undefined) {
      return db.select().from(educationLevelSubjects).where(eq(educationLevelSubjects.levelNumber, levelNumber)).orderBy(asc(educationLevelSubjects.name));
    }
    return db.select().from(educationLevelSubjects).orderBy(asc(educationLevelSubjects.name));
  }

  async createEducationLevelSubject(data: InsertEducationLevelSubject): Promise<EducationLevelSubject> {
    const [subject] = await db.insert(educationLevelSubjects).values(data).returning();
    return subject;
  }
}

export const storage = new DatabaseStorage();
