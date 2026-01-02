# ZEUS DRIVE - AI USAGE LIMITS & ENFORCEMENT

**Version:** 1.0  
**Status:** Specification (Implementation Pending)  
**Updated:** December 1, 2025

---

## OVERVIEW

AI usage limits protect infrastructure costs, ensure fair resource allocation, and align pricing with value. This document specifies:

- How limits are tracked
- How limits are enforced
- What happens when limits are exceeded
- How users are informed

---

## LIMIT DEFINITIONS

### Per-Tier Monthly Limits

| Tier | Monthly Calls | Daily Average | Enforcement |
|------|---------------|----------------|-------------|
| Free | 10 | <1 | Hard block |
| Basic | 50 | ~2 | Hard block |
| Advanced | 500 | ~17 | Hard block |
| Premium | 5,000 | ~167 | Soft throttle |
| VIP | 10,000 | ~333 | Soft throttle |

### Reset Schedule

- All limits reset on the **1st of each month at 00:00 UTC**
- Partial-month counts:
  - New user on 15th → limit expires 30th (half month)
  - Prorated credit applied when downgrading mid-cycle

### Types of AI Calls

**Tracked (count toward limit):**
1. Optimization recommendations
2. Route planning
3. Earnings forecasting
4. Schedule recommendations
5. Anomaly detection alerts
6. Cost analysis
7. Tax optimization
8. Fraud pattern analysis
9. Team performance analysis
10. Custom ML predictions

**NOT tracked:**
- Dashboard views
- Static data lookups
- Platform account checks
- Settings changes
- Manual time logging
- Support chat messages
- System health checks

---

## ENFORCEMENT MECHANISMS

### Tier 1-3 (Free, Basic, Advanced): HARD BLOCK

When user hits limit:
1. System logs the attempt
2. Request rejected immediately
3. User shown error message
4. Option to:
   - Upgrade tier
   - Wait for reset
   - Contact support

**Response:**
```json
{
  "success": false,
  "error": "AI_LIMIT_EXCEEDED",
  "message": "You've used all 50 AI calls for this month. Upgrade to Advanced to get 500 calls.",
  "nextReset": "2025-02-01T00:00:00Z",
  "suggestedUpgrade": "advanced"
}
```

### Tier 4-5 (Premium, VIP): SOFT THROTTLE

When user hits 80% of limit:
1. System alerts user (notification)
2. Remaining calls shown in UI
3. Calls can continue

When user hits 100% of limit:
1. Calls queued and processed slower
2. Estimated wait time shown
3. User notified of throttling

**Response (queued):**
```json
{
  "success": true,
  "queued": true,
  "message": "Request queued. You've exceeded your fair-use limit. Expected wait: 2 minutes.",
  "position": 5,
  "estimatedWait": 120
}
```

---

## USAGE TRACKING SYSTEM

### Database Schema

```typescript
// /shared/schema.ts
export const aiUsageTable = pgTable('ai_usage', {
  id: text().primaryKey(),
  userId: text().notNull().references(() => users.id),
  tier: varchar().notNull(), // 'free', 'basic', 'advanced', 'premium', 'vip'
  
  // Monthly tracking
  month: varchar().notNull(), // '2025-01' format
  callsUsed: integer().default(0),
  callsLimit: integer().notNull(),
  percentageUsed: integer().default(0),
  
  // Daily tracking
  dailyCallsToday: integer().default(0),
  dailyLimit: integer().default(0), // For soft limits
  
  // Call types
  callsOptimization: integer().default(0),
  callsRouting: integer().default(0),
  callsForecasting: integer().default(0),
  // ... other call types
  
  // Timestamps
  resetAt: timestamp().notNull(),
  lastCalledAt: timestamp(),
  
  // Throttling
  throttledUntil: timestamp(), // If soft-throttled
  queuePosition: integer().default(0),
  
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
});
```

### Service Implementation

```typescript
// /server/services/aiUsageTracker.ts
export class AiUsageTracker {
  async checkLimit(userId: string): Promise<{
    allowed: boolean;
    enforceMode: 'hard' | 'soft' | 'none';
    remaining: number;
    message?: string;
  }> {
    const usage = await this.getUsage(userId);
    const tier = await this.getUserTier(userId);
    const limit = this.getLimit(tier);
    
    if (usage.callsUsed >= limit) {
      if (this.isSoftTier(tier)) {
        return { allowed: true, enforceMode: 'soft', remaining: 0 };
      } else {
        return { allowed: false, enforceMode: 'hard', remaining: 0, message: 'Limit exceeded' };
      }
    }
    
    return { allowed: true, enforceMode: 'none', remaining: limit - usage.callsUsed };
  }

  async incrementUsage(userId: string, callType: string): Promise<void> {
    const usage = await this.getUsage(userId);
    
    // Update total
    await db
      .update(aiUsageTable)
      .set({ callsUsed: usage.callsUsed + 1, updatedAt: new Date() })
      .where(eq(aiUsageTable.userId, userId));
    
    // Update by type (if tracking)
    const columnName = `calls${capitalize(callType)}`;
    await db
      .update(aiUsageTable)
      .set({ [columnName]: usage[columnName] + 1 })
      .where(eq(aiUsageTable.userId, userId));
    
    // Log for analytics
    await this.logUsageEvent(userId, callType);
  }

  async resetMonthlyLimits(): Promise<void> {
    // Runs daily at 00:00 UTC
    const today = new Date();
    const month = today.toISOString().slice(0, 7); // 'YYYY-MM'
    
    // Check if month changed for any user
    const usersNeedingReset = await db
      .select()
      .from(aiUsageTable)
      .where(ne(aiUsageTable.month, month));
    
    for (const usage of usersNeedingReset) {
      const tier = await this.getUserTier(usage.userId);
      const newLimit = this.getLimit(tier);
      
      await db
        .update(aiUsageTable)
        .set({
          month,
          callsUsed: 0,
          callsLimit: newLimit,
          percentageUsed: 0,
          callsOptimization: 0,
          callsRouting: 0,
          // ... reset all call type counters
          resetAt: new Date(),
        })
        .where(eq(aiUsageTable.userId, usage.userId));
    }
  }
}

export const aiUsageTracker = new AiUsageTracker();
```

### Middleware

```typescript
// /server/middleware/aiLimitCheck.ts
export const aiLimitCheck = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  if (!userId) return next(); // Not authenticated
  
  const callType = req.body?.callType || 'unknown';
  
  const check = await aiUsageTracker.checkLimit(userId);
  
  if (!check.allowed) {
    // Hard block
    return res.status(429).json({
      error: 'AI_LIMIT_EXCEEDED',
      message: check.message,
      remaining: check.remaining,
    });
  }
  
  // Track usage
  await aiUsageTracker.incrementUsage(userId, callType);
  
  // Soft throttle if needed
  if (check.enforceMode === 'soft' && check.remaining <= 0) {
    req.throttled = true;
    req.estimatedWait = 2000; // 2 second delay
  }
  
  next();
};
```

---

## USER NOTIFICATIONS

### Email Notifications

**When 50% of limit used:**
```
Subject: You're halfway through your AI calls for this month

Hi John,

You've used 250 out of 500 AI calls this month. 
Keep using them, or upgrade to Premium for unlimited calls.

Plan Status: Advanced ($19.99/month)
Calls remaining: 250
Month ends: February 1, 2025

[View Dashboard] [Upgrade to Premium]
```

**When 80% of limit used:**
```
Subject: You're running low on AI calls

Hi John,

You've used 400 out of 500 AI calls this month.
100 calls remaining before the limit.

Plan: Advanced ($19.99/month)
Resets: February 1, 2025

[Upgrade now] [Contact support]
```

**When limit reached (Free/Basic/Advanced):**
```
Subject: AI call limit reached

Hi John,

You've used all 500 AI calls for this month.
Your limit resets on February 1, 2025.

In the meantime, you can:
- Upgrade to Premium for unlimited calls
- Use the app's built-in features (no limit)
- Wait for your limit to reset

[Upgrade to Premium] [Learn more]
```

### In-App Notifications

- Toast at top of screen when limit approaching
- Notification badge on AI assistant screen
- Progress bar showing usage % in Settings
- Countdown timer showing reset date/time

### UI Elements

```typescript
// /client/src/components/AiUsageIndicator.tsx
export function AiUsageIndicator({ tier, used, limit }) {
  const percentage = (used / limit) * 100;
  const status = percentage < 50 ? 'good' : percentage < 80 ? 'warning' : 'critical';
  
  return (
    <div className="ai-usage">
      <p>AI Calls: {used}/{limit}</p>
      <div className="progress-bar">
        <div className={`fill ${status}`} style={{ width: `${percentage}%` }} />
      </div>
      {status === 'warning' && (
        <p className="warning">You're using 80% of your monthly limit</p>
      )}
      {status === 'critical' && (
        <p className="critical">You've reached your monthly AI call limit</p>
      )}
    </div>
  );
}
```

---

## OVERRIDE & EXCEPTIONS

### Manual Override (Admin Only)

Admin users can temporarily increase limits:

```typescript
// /server/routes/admin.ts
app.post('/api/admin/ai-limits/override', adminAuth, async (req, res) => {
  const { userId, additionalCalls, reason } = req.body;
  
  // Log the override
  await db.insert(aiOverridesTable).values({
    userId,
    additionalCalls,
    grantedBy: req.user.id,
    reason,
    expiresAt: addDays(new Date(), 7),
  });
  
  // Update user's limit
  await updateUserLimit(userId, additionalCalls);
  
  res.json({ success: true });
});
```

### Reasons for Override
- Exceptional case (system bug)
- Power user on trial (new customer)
- Compatibility test (enterprise)
- Bug reproduction (support)

---

## REPORTING & ANALYTICS

### Admin Dashboard Shows

```typescript
// Daily aggregates
{
  date: '2025-01-15',
  totalUsers: 5420,
  
  byTier: {
    free: { users: 1200, avgUsage: 5, atLimit: 40 },
    basic: { users: 1500, avgUsage: 20, atLimit: 80 },
    advanced: { users: 1800, avgUsage: 180, atLimit: 150 },
    premium: { users: 650, avgUsage: 800, atLimit: 5 },
    vip: { users: 270, avgUsage: 3200, atLimit: 0 },
  },
  
  totalCalls: 125_400,
  apiCost: $342.50, // Based on OpenAI pricing
  churnAttempts: 12, // Users trying to exceed limit
  upgradesTriggeredByLimit: 18,
}
```

---

## COST MANAGEMENT

### Infrastructure Costs per Tier

```
Free tier:   $0.002 per call (mostly device)
Basic:       $0.01 per call (device + occasional mainframe)
Advanced:    $0.05 per call (mainframe + GPU)
Premium:     $0.08 per call (priority GPU)
VIP:         Custom rate
```

### Monthly Cost per User (Estimate)

```
Free:    $0.01 (mostly free, capped at 10)
Basic:   $0.50 (50 calls × $0.01)
Advanced: $25 (500 calls × $0.05)
Premium:  $400 (5,000 calls × $0.08)
VIP:      Custom
```

### Profitability

```
Free tier:   -$5/user (acquisition cost)
Basic:       $9.99 revenue - $0.50 cost = +$9.49
Advanced:    $19.99 revenue - $25 cost = -$5.01 (loss leader)
Premium:     $49.99 revenue - $400 cost = -$350 (high-value users)
VIP:         Custom revenue - custom cost = margin varies
```

*Note: VIP and Premium users drive network effects and retention despite per-unit losses.*

---

## FUTURE ENHANCEMENTS

### Dynamic Limits

- Adjust limits based on user earnings (high earners get more calls)
- Seasonal adjustments (e.g., holiday season surges)
- Skill-based tier (advanced users get more)

### Burst Capacity

- Allow temporary overage with fee ($0.10 per extra call)
- Helps Premium users during surge periods
- Managed via settings toggle

### Team/Fleet Shared Pools

- Pool AI calls across team members
- Admin controls distribution
- Planned for Q2 2026

---

## IMPLEMENTATION CHECKLIST

- [ ] Create `aiUsageTable` in database
- [ ] Implement `AiUsageTracker` service
- [ ] Create `aiLimitCheck` middleware
- [ ] Wire middleware into all AI routes
- [ ] Create admin override endpoint
- [ ] Build usage indicator UI component
- [ ] Set up daily reset cronjob
- [ ] Create email notification system
- [ ] Build admin dashboard reports
- [ ] Implement monitoring & alerting
- [ ] Test all limit scenarios
- [ ] Document for support team

---

*Last Updated: December 1, 2025 | AI Usage Limits v1.0*
