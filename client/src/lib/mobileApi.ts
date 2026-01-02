// Zeus Mobile API Client
let mobileToken: string | null = null;

export const mobileApi = {
  setToken: (token: string) => {
    mobileToken = token;
  },

  getToken: () => mobileToken,

  clearToken: () => {
    mobileToken = null;
  },

  async login(username: string, password: string) {
    const res = await fetch("/api/mobile/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error("Login failed");
    return res.json();
  },

  async getDomains() {
    const res = await fetch("/api/mobile/domains", {
      headers: { Authorization: `Bearer ${mobileToken}` },
    });
    if (!res.ok) throw new Error("Failed to fetch domains");
    return res.json();
  },

  async startRun(domain: string, levelNumber: number) {
    const res = await fetch("/api/mobile/runs/start", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mobileToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ domain, levelNumber }),
    });
    if (!res.ok) throw new Error("Failed to start run");
    return res.json();
  },

  async getRunStatus(runId: string) {
    const res = await fetch(`/api/mobile/runs/${runId}`, {
      headers: { Authorization: `Bearer ${mobileToken}` },
    });
    if (!res.ok) throw new Error("Failed to fetch run status");
    return res.json();
  },

  async getMastery() {
    const res = await fetch("/api/mobile/mastery/me", {
      headers: { Authorization: `Bearer ${mobileToken}` },
    });
    if (!res.ok) throw new Error("Failed to fetch mastery");
    return res.json();
  },

  async getLeaderboard() {
    const res = await fetch("/api/mobile/leaderboard", {
      headers: { Authorization: `Bearer ${mobileToken}` },
    });
    if (!res.ok) throw new Error("Failed to fetch leaderboard");
    return res.json();
  },
};
