import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Shield, AlertCircle, Check, Loader2 } from "lucide-react";

export default function PasswordSetup() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"username" | "password">("username");
  const [userId, setUserId] = useState<string>("");
  const [displayName, setDisplayName] = useState("");

  const passwordsMatch = password === confirmPassword && password.length > 0;
  const passwordValid = password.length >= 8;

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: "check" }),
      });

      const data = await response.json();

      if (data.needsPasswordSetup) {
        setUserId(data.user.id);
        setDisplayName(data.user.username);
        setStep("password");
      } else if (data.error) {
        setError(data.error);
      } else {
        setError("This account already has a password. Please use the login page.");
      }
    } catch (err: any) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordValid) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("userId", userId);
        localStorage.setItem("username", displayName);
        
        if (data.requires2FA) {
          navigate("/2fa-setup");
        } else {
          navigate("/login");
        }
      } else {
        setError(data.error || "Failed to set password");
      }
    } catch (err: any) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "username") {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        <Card className="w-full max-w-md p-8 shadow-lg">
          <div className="flex flex-col items-center gap-4 mb-8">
            <Shield className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold">Account Setup</h1>
            <p className="text-muted-foreground text-center text-sm">
              Enter your username to set up your password
            </p>
          </div>

          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <Input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                autoFocus
                data-testid="input-username"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !username.trim()}
              data-testid="button-continue"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                "Continue"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have a password?{" "}
              <a href="/login" className="text-blue-600 hover:underline">Sign In</a>
            </p>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="flex flex-col items-center gap-4 mb-8">
          <Shield className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold">Create Password</h1>
          <p className="text-muted-foreground text-center text-sm">
            Hi <strong>{displayName}</strong>! Create a secure password for your account.
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password (min 8 characters)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="pr-10"
                autoFocus
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {password.length > 0 && (
              <div className={`text-xs mt-1 ${passwordValid ? "text-green-600" : "text-red-500"}`}>
                {passwordValid ? (
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3" /> Password length OK
                  </span>
                ) : (
                  `${8 - password.length} more characters needed`
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                className="pr-10"
                data-testid="input-confirm-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                data-testid="button-toggle-confirm-password"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <div className={`text-xs mt-1 flex items-center gap-1 ${passwordsMatch ? "text-green-600" : "text-red-500"}`}>
                {passwordsMatch ? (
                  <>
                    <Check className="w-3 h-3" /> Passwords match
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3" /> Passwords do not match
                  </>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !passwordValid || !passwordsMatch}
            data-testid="button-set-password"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting Password...
              </>
            ) : (
              "Set Password & Continue"
            )}
          </Button>

          <Button 
            type="button" 
            variant="ghost"
            className="w-full" 
            onClick={() => {
              setStep("username");
              setPassword("");
              setConfirmPassword("");
              setError("");
            }}
            data-testid="button-back"
          >
            Back
          </Button>
        </form>
      </Card>
    </div>
  );
}
