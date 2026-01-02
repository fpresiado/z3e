import { db } from "../db";
import { tutorialProgress } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
  action?: string;
}

export interface Tutorial {
  id: string;
  name: string;
  description: string;
  steps: TutorialStep[];
}

const TUTORIALS: Tutorial[] = [
  {
    id: "onboarding",
    name: "Welcome to Zeus 3",
    description: "Learn the basics of the Zeus 3 Enterprise platform",
    steps: [
      {
        id: "welcome",
        title: "Welcome to Zeus 3 Enterprise",
        description: "Zeus 3 is an autonomous AI education platform designed to help you master complex technical concepts through adaptive learning.",
        position: "center",
      },
      {
        id: "dashboard",
        title: "Your Dashboard",
        description: "This is your main dashboard. Here you can see your learning progress, mastery levels, and quick actions.",
        target: "[data-testid='dashboard-stats']",
        position: "bottom",
      },
      {
        id: "sidebar",
        title: "Navigation Sidebar",
        description: "Use the sidebar to navigate between different sections: Learning, Analytics, Achievements, and more.",
        target: "[data-testid='sidebar']",
        position: "right",
      },
      {
        id: "learning",
        title: "Start Learning",
        description: "Click here to begin your learning journey. The system will adapt to your skill level automatically.",
        target: "[data-testid='link-learning']",
        position: "right",
      },
      {
        id: "analytics",
        title: "Track Progress",
        description: "View detailed analytics about your learning progress, weak spots, and improvement trends.",
        target: "[data-testid='link-analytics']",
        position: "right",
      },
      {
        id: "defense",
        title: "Defense System",
        description: "Configure your security settings and defense modules to protect your learning environment.",
        target: "[data-testid='link-defense']",
        position: "right",
      },
      {
        id: "theme",
        title: "Customize Theme",
        description: "You can switch between Light, Dark, or System theme using this button.",
        target: "[data-testid='button-theme-toggle']",
        position: "bottom",
      },
      {
        id: "complete",
        title: "You're All Set!",
        description: "You now know the basics. Explore the platform and start your learning journey!",
        position: "center",
      },
    ],
  },
  {
    id: "shortcuts",
    name: "Keyboard Shortcuts",
    description: "Learn keyboard shortcuts for faster navigation",
    steps: [
      {
        id: "intro",
        title: "Keyboard Shortcuts",
        description: "Zeus 3 supports keyboard shortcuts for common actions. Press '?' anytime to see all shortcuts.",
        position: "center",
      },
      {
        id: "navigation",
        title: "Quick Navigation",
        description: "Use Ctrl+D for Dashboard, Ctrl+L for Learning, Ctrl+A for Analytics.",
        position: "center",
      },
      {
        id: "actions",
        title: "Quick Actions",
        description: "Use Ctrl+/ for search, Ctrl+T to toggle theme, Esc to close dialogs.",
        position: "center",
      },
    ],
  },
];

class TutorialService {
  getTutorials(): Tutorial[] {
    return TUTORIALS;
  }

  getTutorial(tutorialId: string): Tutorial | undefined {
    return TUTORIALS.find((t) => t.id === tutorialId);
  }

  async getProgress(userId: string, tutorialId: string) {
    const userIdNum = parseInt(userId);
    const progress = await db
      .select()
      .from(tutorialProgress)
      .where(
        and(
          eq(tutorialProgress.userId, userIdNum),
          eq(tutorialProgress.tutorialId, tutorialId)
        )
      );

    return progress;
  }

  async markStepComplete(userId: string, tutorialId: string, stepId: string) {
    const userIdNum = parseInt(userId);
    const existing = await db
      .select()
      .from(tutorialProgress)
      .where(
        and(
          eq(tutorialProgress.userId, userIdNum),
          eq(tutorialProgress.tutorialId, tutorialId),
          eq(tutorialProgress.stepId, stepId)
        )
      );

    if (existing.length > 0) {
      await db
        .update(tutorialProgress)
        .set({ completed: true, completedAt: new Date() })
        .where(eq(tutorialProgress.id, existing[0].id));
    } else {
      await db.insert(tutorialProgress).values({
        userId: userIdNum,
        tutorialId,
        stepId,
        completed: true,
        completedAt: new Date(),
      });
    }
  }

  async skipStep(userId: string, tutorialId: string, stepId: string) {
    const userIdNum = parseInt(userId);
    const existing = await db
      .select()
      .from(tutorialProgress)
      .where(
        and(
          eq(tutorialProgress.userId, userIdNum),
          eq(tutorialProgress.tutorialId, tutorialId),
          eq(tutorialProgress.stepId, stepId)
        )
      );

    if (existing.length > 0) {
      await db
        .update(tutorialProgress)
        .set({ skipped: true })
        .where(eq(tutorialProgress.id, existing[0].id));
    } else {
      await db.insert(tutorialProgress).values({
        userId: userIdNum,
        tutorialId,
        stepId,
        skipped: true,
      });
    }
  }

  async resetProgress(userId: string, tutorialId: string) {
    const userIdNum = parseInt(userId);
    await db
      .delete(tutorialProgress)
      .where(
        and(
          eq(tutorialProgress.userId, userIdNum),
          eq(tutorialProgress.tutorialId, tutorialId)
        )
      );
  }

  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    const tutorial = TUTORIALS.find((t) => t.id === "onboarding");
    if (!tutorial) return true;

    const progress = await this.getProgress(userId, "onboarding");
    const completedSteps = progress.filter((p) => p.completed || p.skipped);
    return completedSteps.length >= tutorial.steps.length;
  }
}

export const tutorialService = new TutorialService();
