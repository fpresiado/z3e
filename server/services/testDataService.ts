import { db } from "../db.js";
import { users, userMastery, adminAuditLogs } from "@shared/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const SYNTHETIC_USERS = [
  { username: "alice_student", email: "alice@zeus.test" },
  { username: "bob_learner", email: "bob@zeus.test" },
  { username: "carol_master", email: "carol@zeus.test" },
  { username: "david_explorer", email: "david@zeus.test" },
  { username: "emma_achiever", email: "emma@zeus.test" },
  { username: "frank_scholar", email: "frank@zeus.test" },
  { username: "grace_expert", email: "grace@zeus.test" },
  { username: "henry_pioneer", email: "henry@zeus.test" },
  { username: "iris_champion", email: "iris@zeus.test" },
  { username: "jack_visionary", email: "jack@zeus.test" },
  { username: "kate_genius", email: "kate@zeus.test" },
  { username: "leo_titan", email: "leo@zeus.test" },
  { username: "maya_sage", email: "maya@zeus.test" },
  { username: "noah_scholar", email: "noah@zeus.test" },
  { username: "olivia_prodigy", email: "olivia@zeus.test" },
  { username: "peter_master", email: "peter@zeus.test" },
  { username: "quinn_elite", email: "quinn@zeus.test" },
  { username: "rachel_supreme", email: "rachel@zeus.test" },
  { username: "sam_ultimate", email: "sam@zeus.test" },
  { username: "tara_legendary", email: "tara@zeus.test" },
  { username: "uri_cosmic", email: "uri@zeus.test" },
  { username: "victor_infinite", email: "victor@zeus.test" },
  { username: "wendy_absolute", email: "wendy@zeus.test" },
  { username: "xavier_eternal", email: "xavier@zeus.test" },
  { username: "yara_omniscient", email: "yara@zeus.test" },
  { username: "zeke_transcendent", email: "zeke@zeus.test" },
  { username: "admin_user", email: "admin@zeus.test", role: "admin" },
  { username: "test_user", email: "test@zeus.test", plan: "pilot" },
  { username: "premium_user", email: "premium@zeus.test", plan: "vip" },
];

export class TestDataService {
  static async populateTestData() {
    console.log("[TEST_DATA] Starting population...");
    
    const hashedPassword = await bcrypt.hash("TestPassword123!", 10);
    let createdCount = 0;

    for (const userData of SYNTHETIC_USERS) {
      try {
        // Check if user exists
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.username, userData.username))
          .limit(1);

        if (existingUser.length > 0) {
          console.log(`[TEST_DATA] User ${userData.username} already exists, skipping`);
          continue;
        }

        // Insert user (minimal fields that exist in actual DB schema)
        let userId = null;
        try {
          const result = await db.insert(users).values({
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
          } as any).returning({ id: users.id });
          
          if (!result || result.length === 0) {
            console.warn(`[TEST_DATA] Failed to insert user ${userData.username}`);
            continue;
          }
          userId = result[0].id;
        } catch (insertError: any) {
          console.error(`[TEST_DATA] Insert error for ${userData.username}:`, insertError.message);
          continue;
        }

        createdCount++;

        // Create user mastery record
        await db.insert(userMastery).values({
          userId: userId,
          overallMastery: (Math.random() * 100).toString(),
          levelsCompleted: Math.floor(Math.random() * 12),
          totalAttempts: Math.floor(Math.random() * 500),
          successAttempts: Math.floor(Math.random() * 300),
          totalTimeSpent: Math.floor(Math.random() * 100000),
        }).catch(() => null);

        // Create audit log entry
        if ((userData as any).role === "admin") {
          await db.insert(adminAuditLogs).values({
            adminId: userId,
            action: "system_init",
            target: userId.toString(),
            targetType: "user",
            details: { status: "test_data_created" },
          }).catch(() => null);
        }

        console.log(`[TEST_DATA] Created user: ${userData.username} (ID: ${userId})`);
      } catch (error: any) {
        console.error(`[TEST_DATA] Error creating user ${userData.username}:`, error.message);
      }
    }

    console.log(`[TEST_DATA] ✅ Population complete: ${createdCount} users created`);
    return { created: createdCount, total: SYNTHETIC_USERS.length };
  }

  static async getTestDataSummary() {
    try {
      const totalUsers = await db
        .select()
        .from(users)
        .then((r) => r.length)
        .catch(() => 0);

      const masteryRecords = await db
        .select()
        .from(userMastery)
        .then((r) => r.length)
        .catch(() => 0);

      return {
        totalUsers,
        masteryRecords,
        status: "OK",
      };
    } catch (error: any) {
      return { error: error.message, status: "FAILED" };
    }
  }
}
