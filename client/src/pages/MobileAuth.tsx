import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { mobileApi } from "@/lib/mobileApi";

export default function MobileAuth() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await mobileApi.login(username, password);
      mobileApi.setToken(result.token);
      localStorage.setItem("mobileToken", result.token);
      localStorage.setItem("mobileUser", JSON.stringify(result.user));
      setLocation("/mobile/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Zeus Mobile</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" data-testid="input-mobile-username" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" type="password" data-testid="input-mobile-password" />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <Button onClick={handleLogin} disabled={loading} className="w-full" data-testid="button-mobile-login">
            {loading ? "Logging in..." : "Login"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
