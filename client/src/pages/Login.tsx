import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Eye, EyeOff, AlertCircle, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordsMatch = password === confirmPassword;
  const passwordValid = password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!isLogin) {
      if (!passwordValid) {
        setError("Password must be at least 8 characters long");
        return;
      }
      if (!passwordsMatch) {
        setError("Passwords do not match. Please try again.");
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        console.log("[LOGIN] Sending login request for:", username);
        const response = await axios.post("/api/auth/login", { username, password });
        console.log("[LOGIN] Response received:", response.data);
        
        if (response.data.needsPasswordSetup) {
          console.log("[LOGIN] User needs password setup, navigating...");
          localStorage.setItem("setupUserId", response.data.user.id);
          localStorage.setItem("setupUsername", response.data.user.username);
          toast({
            title: "Password Setup Required",
            description: "Please create your password",
          });
          console.log("[LOGIN] Calling navigate('/password-setup')");
          navigate("/password-setup");
          console.log("[LOGIN] Navigate called");
          return;
        } else if (response.data.requires2FA) {
          localStorage.setItem("pending2FAToken", response.data.token);
          localStorage.setItem("pending2FAUserId", response.data.user.id);
          toast({
            title: "2FA Required",
            description: "Please enter your verification code",
          });
          navigate("/2fa-verify");
        } else {
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("userId", response.data.user.id);
          localStorage.setItem("username", response.data.user.username);
          toast({
            title: "Welcome back!",
            description: `Logged in as ${response.data.user.username}`,
          });
          navigate("/dashboard");
        }
      } else {
        const response = await axios.post("/api/auth/register", { username, email, password });
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userId", response.data.user.id);
        toast({
          title: "Account created!",
          description: `Welcome ${response.data.user.username}`,
        });
        navigate("/2fa-setup");
      }
    } catch (error: any) {
      setError(error.response?.data?.error || "Something went wrong");
      toast({
        title: "Error",
        description: error.response?.data?.error || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="flex flex-col items-center gap-4 mb-8">
          <BookOpen className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold">Zeus 3</h1>
          <p className="text-muted-foreground text-center">Autonomous Learning System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <Input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              data-testid="input-username"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={isLogin ? "Enter password" : "Enter password (min 8 characters)"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                required
                className="pr-10"
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
            {!isLogin && password.length > 0 && (
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

          {!isLogin && (
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
                  required
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
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || (!isLogin && (!passwordValid || !passwordsMatch))} 
            data-testid="button-submit"
          >
            {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setUsername("");
              setEmail("");
              setPassword("");
              setConfirmPassword("");
              setError("");
            }}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm"
            data-testid="button-toggle-mode"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </Card>
    </div>
  );
}
