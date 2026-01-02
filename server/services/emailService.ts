export class EmailService {
  async sendNotification(email: string, subject: string, message: string): Promise<boolean> {
    try {
      console.log(`[Email] Would send to ${email}: ${subject}`);
      // Nodemailer setup would go here in production
      return true;
    } catch (error) {
      console.error("[Email] Failed to send:", error);
      return false;
    }
  }

  async sendLearningDigest(email: string, data: any): Promise<boolean> {
    const message = `Your Weekly Learning Digest: ${data.runsCompleted} runs, ${data.questionsPassed} passed, ${data.masteryScore}% mastery`;
    return this.sendNotification(email, "Your Weekly Learning Digest", message);
  }

  async sendAchievementUnlocked(email: string, achievement: string): Promise<boolean> {
    return this.sendNotification(
      email,
      `Achievement Unlocked: ${achievement}`,
      `Congratulations! You've unlocked the "${achievement}" badge!`
    );
  }
}

export const emailService = new EmailService();
