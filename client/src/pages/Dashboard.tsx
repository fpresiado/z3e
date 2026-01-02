import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, TrendingUp, Target, Zap, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

interface UserProfile {
  user: {
    id: string;
    username: string;
    email: string;
    createdAt: string;
  };
  mastery: {
    overallMastery: string;
    levelsCompleted: number;
    totalAttempts: number;
    successAttempts: number;
    totalTimeSpent: number;
  };
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          navigate("/login");
          return;
        }

        const response = await axios.get(`/api/user/profile/${userId}`);
        setProfile(response.data);
        setError(null);
      } catch (err: any) {
        console.error("Profile load error:", err);
        setError(err.response?.data?.error || "Failed to load profile");
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate, toast]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Profile</h2>
          <p className="text-muted-foreground mb-4">{error || "Profile not found"}</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => window.location.reload()} data-testid="button-retry">
              Retry
            </Button>
            <Button variant="destructive" onClick={handleLogout} data-testid="button-logout-error">
              Logout
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const masteryPercent = Math.round(parseFloat(profile.mastery.overallMastery));
  const successRate = profile.mastery.totalAttempts > 0 
    ? Math.round((profile.mastery.successAttempts / profile.mastery.totalAttempts) * 100)
    : 0;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Welcome back, {profile.user.username}!</h1>
          <p className="text-muted-foreground mt-2">{profile.user.email}</p>
        </div>
        <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
          Logout
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overall Mastery</p>
              <p className="text-2xl font-bold">{masteryPercent}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Levels Completed</p>
              <p className="text-2xl font-bold">{profile.mastery.levelsCompleted}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold">{successRate}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <BookOpen className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Attempts</p>
              <p className="text-2xl font-bold">{profile.mastery.totalAttempts}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button 
            onClick={() => navigate("/curriculum-browser")}
            className="w-full"
            data-testid="button-start-learning"
          >
            Start Learning
          </Button>
          <Button 
            onClick={() => navigate("/analytics")}
            variant="outline"
            className="w-full"
            data-testid="button-view-analytics"
          >
            View Analytics
          </Button>
          <Button 
            onClick={() => navigate("/achievements")}
            variant="outline"
            className="w-full"
            data-testid="button-view-achievements"
          >
            View Achievements
          </Button>
        </div>
      </Card>

      {/* User Info */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Member Since</p>
            <p className="font-medium">{new Date(profile.user.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Time Spent Learning</p>
            <p className="font-medium">{Math.round(profile.mastery.totalTimeSpent / 60)} hours</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
