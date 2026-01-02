import { db } from "../db";
import { developerConversations, developerMessages, programBibles } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { formatPacific } from "../utils/timezone";
import { providerManager } from "./provider";

export const devChatService = {
  // Conversations
  async createConversation(data: {
    title?: string;
    subject?: string;
    programKey?: string;
    tags?: string[];
  }) {
    const now = new Date();
    const title = data.title || `New chat – ${formatPacific(now)}`;
    
    // Check if bible exists for this program
    let bibleId: string | null = null;
    if (data.programKey) {
      const existing = await db.select().from(programBibles).where(eq(programBibles.programKey, data.programKey));
      if (!existing.length) {
        // Create default bible
        const bible = await this.createBible(data.programKey, `${data.programKey} – Program Bible`, "");
        bibleId = bible.id;
      } else {
        bibleId = existing[0].id;
      }
    }

    const result = await db.insert(developerConversations).values({
      title,
      subject: data.subject,
      programKey: data.programKey,
      bibleId: bibleId,
      createdAt: now,
      updatedAt: now,
      createdAtPacific: formatPacific(now),
      updatedAtPacific: formatPacific(now),
      timezone: "America/Los_Angeles",
      tags: JSON.stringify(data.tags || []),
    }).returning();

    return result[0];
  },

  async listConversations(limit = 100, offset = 0) {
    return db.select()
      .from(developerConversations)
      .orderBy(desc(developerConversations.updatedAt))
      .limit(limit)
      .offset(offset);
  },

  async getConversation(id: string) {
    const result = await db.select().from(developerConversations).where(eq(developerConversations.id, id));
    return result[0];
  },

  // Messages
  async getMessages(conversationId: string, limit = 100) {
    return db.select()
      .from(developerMessages)
      .where(eq(developerMessages.conversationId, conversationId))
      .orderBy(developerMessages.createdAt)
      .limit(limit);
  },

  async addMessage(conversationId: string, sender: "human" | "zeus" | "system", content: string) {
    const now = new Date();
    const result = await db.insert(developerMessages).values({
      conversationId,
      sender,
      role: sender === "human" ? "user" : "assistant",
      content,
      createdAt: now,
      createdAtPacific: formatPacific(now),
      timezone: "America/Los_Angeles",
    }).returning();

    // Update conversation timestamp
    await db.update(developerConversations)
      .set({ updatedAt: now, updatedAtPacific: formatPacific(now) })
      .where(eq(developerConversations.id, conversationId));

    return result[0];
  },

  // Program Bibles
  async getBible(programKey: string) {
    const result = await db.select().from(programBibles).where(eq(programBibles.programKey, programKey));
    return result[0];
  },

  async createBible(programKey: string, title: string, contentMarkdown: string) {
    const now = new Date();
    const result = await db.insert(programBibles).values({
      programKey,
      title,
      contentMarkdown: contentMarkdown || `# ${programKey} – Program Bible\n\n## Overview\n- Status: New\n\n## Changelog\n- ${formatPacific(now)}: Created`,
      createdAt: now,
      updatedAt: now,
      createdAtPacific: formatPacific(now),
      updatedAtPacific: formatPacific(now),
      timezone: "America/Los_Angeles",
    }).returning();

    return result[0];
  },

  async updateBible(programKey: string, data: { title?: string; summary?: string; contentMarkdown?: string; tags?: string[] }) {
    const now = new Date();
    const result = await db.update(programBibles)
      .set({
        ...data,
        updatedAt: now,
        updatedAtPacific: formatPacific(now),
        tags: data.tags ? JSON.stringify(data.tags) : undefined,
      })
      .where(eq(programBibles.programKey, programKey))
      .returning();

    return result[0];
  },

  // Zeus chat response
  async generateZeusResponse(conversationId: string, userMessage: string, recentMessages: any[]) {
    try {
      const systemPrompt = `You are ZEUS, an AI engineer working for Isko. Your job is to design, explain, and maintain code, scripts, and architectures for Windows, FutureMainframe, and Zeus systems. Always explain your reasoning clearly and propose file structures and paths when relevant.`;

      const response = await providerManager.generateAnswer({
        question: userMessage,
        systemPrompt,
      });

      return response.answer;
    } catch (error) {
      console.error("Error generating Zeus response:", error);
      return "I'm temporarily unable to respond. Please try again.";
    }
  },
};
