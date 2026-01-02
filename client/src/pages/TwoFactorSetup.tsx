import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, AlertCircle, Check, Copy, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

export default function TwoFactorSetup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const setup2FA = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          navigate("/login");
          return;
        }

        const response = await axios.post("/api/auth/setup-2fa", { userId });
        setQrCode(response.data.qrCode);
        setSecret(response.data.secret);
      } catch (error: any) {
        setError(error.response?.data?.error || "Failed to set up 2FA");
      } finally {
        setLoading(false);
      }
    };

    setup2FA();
  }, [navigate]);

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Secret key copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setVerifying(true);

    try {
      const userId = localStorage.getItem("userId");
      const response = await axios.post("/api/auth/verify-2fa", {
        userId,
        token: verificationCode,
      });

      if (response.data.valid) {
        toast({
          title: "2FA Enabled!",
          description: "Your account is now protected with two-factor authentication.",
        });
        navigate("/");
      } else {
        setError("Invalid verification code. Please try again.");
      }
    } catch (error: any) {
      setError(error.response?.data?.error || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleSkip = () => {
    toast({
      title: "2FA Skipped",
      description: "You can enable 2FA later in Settings.",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-lg text-muted-foreground">Setting up 2FA...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-lg p-8 shadow-lg">
        <div className="flex flex-col items-center gap-4 mb-6">
          <Shield className="w-12 h-12 text-green-600 dark:text-green-400" />
          <h1 className="text-2xl font-bold text-center">Two-Factor Authentication</h1>
          <p className="text-muted-foreground text-center text-sm">
            Scan the QR code with your Authy app or enter the secret key manually.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg shadow-inner mb-4">
              {qrCode && (
                <img 
                  src={qrCode} 
                  alt="2FA QR Code" 
                  className="w-48 h-48"
                  data-testid="img-qr-code"
                />
              )}
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Can't scan? Enter manually:</span>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
              <code className="text-sm font-mono break-all" data-testid="text-secret-key">
                {secret}
              </code>
              <button
                onClick={handleCopySecret}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                data-testid="button-copy-secret"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Enter 6-digit code from Authy
              </label>
              <Input
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setVerificationCode(value);
                  setError("");
                }}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
                data-testid="input-2fa-code"
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
              disabled={verifying || verificationCode.length !== 6}
              data-testid="button-verify-2fa"
            >
              {verifying ? "Verifying..." : "Verify & Enable 2FA"}
            </Button>
          </form>

          <div className="border-t pt-4">
            <button
              onClick={handleSkip}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-skip-2fa"
            >
              Skip for now (not recommended)
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
