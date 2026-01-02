import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Switch, Route, useLocation, Link } from "wouter";
import { useState, useEffect } from "react";

const ONBOARDING_ROUTES = new Set(["/password-setup", "/2fa-setup", "/2fa-verify", "/login"]);

import Chat from "@/pages/Chat";
import Runs from "@/pages/Runs";
import Admin from "@/pages/Admin";
import Analytics from "@/pages/Analytics";
import AttemptHistory from "@/pages/AttemptHistory";
import Leaderboard from "@/pages/Leaderboard";
import Portfolio from "@/pages/Portfolio";
import TeacherView from "@/pages/TeacherView";
import Achievements from "@/pages/Achievements";
import Brain from "@/pages/Brain";
import Reports from "@/pages/Reports";
import Notifications from "@/pages/Notifications";
import Defense from "@/pages/Defense";
import DefenseAdvanced from "@/pages/DefenseAdvanced";
import ZeusDeveloperChat from "@/pages/ZeusDeveloperChat";
import LMCurriculumProgress from "@/pages/LMCurriculumProgress";
import CurriculumBrowser from "@/pages/CurriculumBrowser";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import FleetDashboard from "@/pages/FleetDashboard";
import ErrorDashboard from "@/pages/ErrorDashboard";
import PasswordSetup from "@/pages/PasswordSetup";
import TwoFactorSetup from "@/pages/TwoFactorSetup";
import TwoFactorVerify from "@/pages/TwoFactorVerify";
import PerformanceMetrics from "@/pages/PerformanceMetrics";
import ShortcutsSettings from "@/pages/ShortcutsSettings";
import MobileAuth from "@/pages/MobileAuth";
import MobileDashboard from "@/pages/MobileDashboard";
import MobileDomains from "@/pages/MobileDomains";
import MobileSession from "@/pages/MobileSession";
import MobileProgress from "@/pages/MobileProgress";
import MobileLeaderboard from "@/pages/MobileLeaderboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminUsers from "@/pages/AdminUsers";
import AdminLogs from "@/pages/AdminLogs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationCenter } from "@/components/NotificationCenter";

function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-white dark:bg-black flex-col md:flex-row">
      <aside
        className={`${
          sidebarOpen ? "w-full md:w-64 absolute md:relative z-50 md:z-auto" : "w-0 hidden md:w-64 md:block"
        } border-b md:border-b-0 md:border-r bg-gray-50 dark:bg-gray-900 overflow-hidden overflow-y-auto transition-all`}
      >
        <nav className="p-3 md:p-4 space-y-1 text-sm md:text-base">
          <Link href="/" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800" onClick={() => setSidebarOpen(false)} data-testid="link-dashboard">Dashboard</Link>
          <Link href="/zeus-chat" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800" onClick={() => setSidebarOpen(false)} data-testid="link-zeus-chat">Developer Chat</Link>
          <Link href="/curriculum-progress" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800" onClick={() => setSidebarOpen(false)} data-testid="link-curriculum-progress">LM Curriculum Progress</Link>
          <Link href="/curriculum-browser" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800" onClick={() => setSidebarOpen(false)} data-testid="link-curriculum-browser">Curriculum Browser</Link>
          <Link href="/runs" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800" onClick={() => setSidebarOpen(false)} data-testid="link-runs">Runs</Link>
          <Link href="/admin" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800" onClick={() => setSidebarOpen(false)} data-testid="link-admin">Admin</Link>
          <Link href="/analytics" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800" onClick={() => setSidebarOpen(false)} data-testid="link-analytics">Analytics</Link>
          <Link href="/attempts" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800" onClick={() => setSidebarOpen(false)} data-testid="link-attempts">Attempt History</Link>
          <Link href="/leaderboard" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800" onClick={() => setSidebarOpen(false)} data-testid="link-leaderboard">Leaderboard</Link>
          <Link href="/portfolio" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800" onClick={() => setSidebarOpen(false)} data-testid="link-portfolio">Portfolio</Link>
          <Link href="/teacher" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800" onClick={() => setSidebarOpen(false)} data-testid="link-teacher">Teacher View</Link>
          <Link href="/achievements" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800" onClick={() => setSidebarOpen(false)} data-testid="link-achievements">Achievements</Link>
          <Link href="/brain" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800" onClick={() => setSidebarOpen(false)} data-testid="link-brain">Brain</Link>
          <Link href="/reports" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800" onClick={() => setSidebarOpen(false)} data-testid="link-reports">Reports</Link>
          <Link href="/notifications" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800" onClick={() => setSidebarOpen(false)} data-testid="link-notifications">Notifications</Link>
          <Link href="/settings" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800" onClick={() => setSidebarOpen(false)} data-testid="link-settings">Settings</Link>
          <hr className="my-2 opacity-30" />
          <Link href="/defense" className="block px-4 py-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 font-semibold" onClick={() => setSidebarOpen(false)} data-testid="link-defense">
            Defense
          </Link>
          <Link href="/defense-advanced" className="block px-4 py-2 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 font-semibold" onClick={() => setSidebarOpen(false)} data-testid="link-defense-advanced">
            Defense Pro
          </Link>
          <hr className="my-2 opacity-30" />
          <Link href="/fleet" className="block px-4 py-2 rounded hover:bg-green-100 dark:hover:bg-green-900 text-green-600 dark:text-green-400 font-semibold" onClick={() => setSidebarOpen(false)} data-testid="link-fleet">
            Fleet
          </Link>
          <Link href="/errors" className="block px-4 py-2 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 font-semibold" onClick={() => setSidebarOpen(false)} data-testid="link-errors">
            Errors
          </Link>
          <Link href="/performance" className="block px-4 py-2 rounded hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-600 dark:text-purple-400 font-semibold" onClick={() => setSidebarOpen(false)} data-testid="link-performance">
            Performance
          </Link>
          <Link href="/shortcuts" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800" onClick={() => setSidebarOpen(false)} data-testid="link-shortcuts">
            Keyboard Shortcuts
          </Link>
          <hr className="my-2 opacity-30" />
          <button
            onClick={() => {
              localStorage.clear();
              window.location.replace("/login");
            }}
            className="w-full text-left block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-pointer"
            data-testid="button-sidebar-logout"
          >
            Sign Out
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto flex flex-col w-full">
        <header className="border-b p-2 md:p-4 flex items-center justify-between gap-2 md:gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex-shrink-0"
              data-testid="button-sidebar-toggle"
            >
              ☰
            </button>
            <h1 className="text-lg md:text-2xl font-bold whitespace-nowrap">Zeus 3</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <ThemeToggle />
          </div>
        </header>
        <div className="p-2 md:p-4 overflow-auto flex-1">{children}</div>
      </main>
    </div>
  );
}

export default function App() {
  const [location] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const isOnboardingRoute = ONBOARDING_ROUTES.has(location);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || isOnboardingRoute) {
    return (
      <QueryClientProvider client={queryClient}>
        <Switch>
          <Route path="/password-setup" component={PasswordSetup} />
          <Route path="/2fa-setup" component={TwoFactorSetup} />
          <Route path="/2fa-verify" component={TwoFactorVerify} />
          <Route path="/mobile/auth" component={MobileAuth} />
          <Route path="/login" component={Login} />
          <Route path="*" component={Login} />
        </Switch>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/password-setup" component={PasswordSetup} />
        <Route path="/2fa-setup" component={TwoFactorSetup} />
        <Route path="/2fa-verify" component={TwoFactorVerify} />
        <Route path="/mobile/dashboard" component={MobileDashboard} />
        <Route path="/mobile/domains" component={MobileDomains} />
        <Route path="/mobile/session" component={MobileSession} />
        <Route path="/mobile/progress" component={MobileProgress} />
        <Route path="/mobile/leaderboard" component={MobileLeaderboard} />
        <Route>
          {() => (
            <Layout>
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/zeus-chat" component={ZeusDeveloperChat} />
                <Route path="/curriculum-progress" component={LMCurriculumProgress} />
                <Route path="/curriculum-browser" component={CurriculumBrowser} />
                <Route path="/runs" component={Runs} />
                <Route path="/admin" component={Admin} />
                <Route path="/admin-dashboard" component={AdminDashboard} />
                <Route path="/admin-users" component={AdminUsers} />
                <Route path="/admin-logs" component={AdminLogs} />
                <Route path="/analytics" component={Analytics} />
                <Route path="/attempts" component={AttemptHistory} />
                <Route path="/leaderboard" component={Leaderboard} />
                <Route path="/portfolio" component={Portfolio} />
                <Route path="/teacher" component={TeacherView} />
                <Route path="/achievements" component={Achievements} />
                <Route path="/settings" component={Settings} />
                <Route path="/fleet" component={FleetDashboard} />
                <Route path="/errors" component={ErrorDashboard} />
                <Route path="/brain" component={Brain} />
                <Route path="/reports" component={Reports} />
                <Route path="/notifications" component={Notifications} />
                <Route path="/defense" component={Defense} />
                <Route path="/defense-advanced" component={DefenseAdvanced} />
                <Route path="/performance" component={PerformanceMetrics} />
                <Route path="/shortcuts" component={ShortcutsSettings} />
                <Route path="*" component={Dashboard} />
              </Switch>
            </Layout>
          )}
        </Route>
      </Switch>
    </QueryClientProvider>
  );
}
