import { Router, Request, Response } from "express";
import { devChatService } from "../services/devChatService";

export const devChatRouter = Router();

// Conversations
devChatRouter.post("/conversations", async (req: Request, res: Response) => {
  try {
    const { title, subject, programKey, tags } = req.body;
    const conversation = await devChatService.createConversation({ title, subject, programKey, tags });
    res.json(conversation);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

devChatRouter.get("/conversations", async (req: Request, res: Response) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const conversations = await devChatService.listConversations(Number(limit), Number(offset));
    res.json(conversations);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

devChatRouter.get("/conversations/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const conversation = await devChatService.getConversation(id);
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    res.json(conversation);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Messages
devChatRouter.get("/conversations/:id/messages", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = 100 } = req.query;
    const conversation = await devChatService.getConversation(id);
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    
    const messages = await devChatService.getMessages(id, Number(limit));
    res.json({ conversation, messages });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

devChatRouter.post("/conversations/:id/message", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) return res.status(400).json({ error: "Content required" });

    // Add human message
    const humanMessage = await devChatService.addMessage(id, "human", content);

    // Get recent messages for context
    const recentMessages = await devChatService.getMessages(id, 20);

    // Generate Zeus response
    const zeusReply = await devChatService.generateZeusResponse(id, content, recentMessages);

    // Add Zeus message
    const zeusMessage = await devChatService.addMessage(id, "zeus", zeusReply);

    res.json({ humanMessage, zeusMessage });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Bibles
devChatRouter.get("/bibles/:programKey", async (req: Request, res: Response) => {
  try {
    const { programKey } = req.params;
    const bible = await devChatService.getBible(programKey);
    if (!bible) return res.status(404).json({ error: "Bible not found" });
    res.json(bible);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

devChatRouter.post("/bibles/:programKey", async (req: Request, res: Response) => {
  try {
    const { programKey } = req.params;
    const { title, summary, contentMarkdown, tags } = req.body;

    let bible = await devChatService.getBible(programKey);
    if (!bible) {
      bible = await devChatService.createBible(programKey, title || programKey, contentMarkdown || "");
    } else {
      bible = await devChatService.updateBible(programKey, { title, summary, contentMarkdown, tags });
    }

    res.json(bible);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
