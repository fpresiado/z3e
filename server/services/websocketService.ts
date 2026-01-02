import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";

interface RunProgress {
  runId: string;
  questionsCompleted: number;
  totalQuestions: number;
  state: string;
  currentQuestion?: string;
  mastery?: number;
}

export class WebSocketService {
  private io: SocketIOServer;
  private activeRuns = new Map<string, RunProgress>();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: { origin: "*", methods: ["GET", "POST"] },
    });

    this.io.on("connection", (socket: Socket) => {
      console.log(`WebSocket client connected: ${socket.id}`);

      socket.on("subscribe:run", (runId: string) => {
        socket.join(`run:${runId}`);
        console.log(`Client subscribed to run: ${runId}`);

        if (this.activeRuns.has(runId)) {
          socket.emit("run:progress", this.activeRuns.get(runId));
        }
      });

      socket.on("disconnect", () => {
        console.log(`WebSocket client disconnected: ${socket.id}`);
      });
    });
  }

  broadcastRunProgress(runId: string, progress: RunProgress) {
    this.activeRuns.set(runId, progress);
    this.io.to(`run:${runId}`).emit("run:progress", progress);
  }

  broadcastQuestionUpdate(runId: string, question: any) {
    this.io.to(`run:${runId}`).emit("question:new", question);
  }

  broadcastValidationResult(runId: string, result: any) {
    this.io.to(`run:${runId}`).emit("validation:result", result);
  }

  broadcastLeaderboardUpdate(leaderboard: any[]) {
    this.io.emit("leaderboard:update", leaderboard);
  }

  getIO() {
    return this.io;
  }
}
