import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Conversation {
  id: string;
  title: string;
  subject?: string;
  programKey?: string;
  createdAtPacific: string;
  updatedAtPacific: string;
  tags: string[];
}

interface Message {
  id: string;
  sender: "human" | "zeus";
  content: string;
  createdAtPacific: string;
}

export default function ZeusDeveloperChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [mode, setMode] = useState<"learning" | "chat">("learning");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedId) loadMessages(selectedId);
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadConversations() {
    try {
      const res = await fetch("/api/dev-chat/conversations");
      const data = await res.json();
      setConversations(data);
      if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
    } catch (err) {
      console.error("Error loading conversations:", err);
    }
  }

  async function loadMessages(conversationId: string) {
    try {
      const res = await fetch(`/api/dev-chat/conversations/${conversationId}/messages`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  }

  async function handleSendMessage() {
    if (!inputValue.trim() || !selectedId) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/dev-chat/conversations/${selectedId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: inputValue }),
      });

      const data = await res.json();
      if (data.humanMessage && data.zeusMessage) {
        setMessages((prev) => [...prev, data.humanMessage, data.zeusMessage]);
      }
      setInputValue("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  }

  async function handleNewChat() {
    try {
      const res = await fetch("/api/dev-chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Chat – ${new Date().toLocaleString()}` }),
      });

      const newConv = await res.json();
      setConversations((prev) => [newConv, ...prev]);
      setSelectedId(newConv.id);
      setMessages([]);
    } catch (err) {
      console.error("Error creating conversation:", err);
    }
  }

  const selected = conversations.find((c) => c.id === selectedId);

  return (
    <div className="flex h-screen gap-4 p-4 bg-white dark:bg-black">
      {/* Sidebar */}
      <div className="w-80 border rounded-lg p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {/* Mode Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            size="sm"
            variant={mode === "learning" ? "default" : "outline"}
            onClick={() => { setMode("learning"); setSelectedId(null); setMessages([]); }}
            data-testid="button-learning-tab"
          >
            Learning
          </Button>
          <Button
            size="sm"
            variant={mode === "chat" ? "default" : "outline"}
            onClick={() => { setMode("chat"); setSelectedId(null); setMessages([]); }}
            data-testid="button-chat-tab"
          >
            Chat
          </Button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" data-testid="text-developer-chats">
            {mode === "learning" ? "Learning" : "Chat"}
          </h2>
          <Button size="sm" onClick={handleNewChat} data-testid="button-new-chat">+ New</Button>
        </div>
        <div className="space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              className={`p-3 rounded cursor-pointer transition-colors ${
                selectedId === conv.id
                  ? "bg-blue-100 dark:bg-blue-900"
                  : "hover:bg-gray-200 dark:hover:bg-gray-800"
              }`}
              data-testid={`chat-item-${conv.id}`}
            >
              <div className="font-semibold text-sm truncate">{conv.title}</div>
              {conv.subject && <div className="text-xs text-gray-600 dark:text-gray-400">{conv.subject}</div>}
              <div className="text-xs text-gray-500 dark:text-gray-500">{conv.updatedAtPacific}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selected ? (
          <>
            {/* Header */}
            <Card className="p-4 mb-4">
              <h1 className="text-2xl font-bold mb-2">{selected.title}</h1>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selected.subject && <div>Subject: {selected.subject}</div>}
                {selected.programKey && <div>Program: {selected.programKey}</div>}
                <div>Created: {selected.createdAtPacific}</div>
              </div>
            </Card>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "human" ? "justify-end" : "justify-start"}`}
                  data-testid={`message-${msg.id}`}
                >
                  <div
                    className={`max-w-md p-3 rounded-lg ${
                      msg.sender === "human"
                        ? "bg-blue-500 dark:bg-blue-700 text-white"
                        : "bg-gray-300 dark:bg-gray-700 text-black dark:text-white"
                    }`}
                  >
                    <div className="text-sm break-words">{msg.content}</div>
                    <div className="text-xs opacity-75 mt-1">{msg.createdAtPacific}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Message Zeus..."
                className="flex-1 resize-none border rounded-md p-2 dark:bg-gray-800 dark:text-white"
                rows={3}
                data-testid="input-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isSending || !inputValue.trim()}
                data-testid="button-send"
              >
                {isSending ? "Sending..." : "Send"}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">Select a conversation or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}
