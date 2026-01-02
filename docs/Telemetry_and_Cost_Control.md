# ZEUS DRIVE - TELEMETRY & COST CONTROL

**Version:** 1.0  
**Status:** Specification (Implementation Pending)  
**Updated:** December 1, 2025

---

## OVERVIEW

Comprehensive telemetry system for tracking AI usage, infrastructure costs, fraud detection, and system optimization. This ensures ZeusDrive remains profitable while maintaining fair pricing for drivers.

---

## WHAT GETS LOGGED

### Every AI Call
```json
{
  "timestamp": "2025-01-15T10:30:45Z",
  "userId": "hash_of_user_id",
  "tier": "premium",
  "taskType": "optimization",
  "provider": "device | mainframe | cloud",
  "executionTime": 1240,
  "tokensUsed": 450,
  "cost": 0.08,
  "success": true,
  "cached": false,
  "deviceState": {
    "battery": 87,
    "network": "wifi",
    "cpu": 35
  }
}
```

### Daily Aggregates
```json
{
  "date": "2025-01-15",
  "totalUsers": 5420,
  "activeUsers": 3847,
  "totalAiCalls": 125400,
  "totalCost": $945.60,
  "byTier": {
    "free": { "users": 1200, "calls": 500, "cost": $2.50 },
    "basic": { "users": 1500, "calls": 5000, "cost": $15.00 },
    "advanced": { "users": 1800, "calls": 65000, "cost": $325.00 },
    "premium": { "users": 650, "calls": 50000, "cost": $400.00 },
    "vip": { "users": 270, "calls": 4900, "cost": $203.10 }
  }
}
```

---

## COST TRACKING

### Infrastructure Costs

```typescript
// Per-provider costs (dynamic, updated monthly)
const COSTS = {
  device: 0.002, // $ per call (minimal, local inference)
  mainframe: 0.08, // $ per call (GPU time)
  cloud: 0.15, // $ per call (RunPod, premium compute)
};

// Monthly estimate
const monthlyUsage = {
  device: 1_100_000,
  mainframe: 1_150_000,
  cloud: 90_500,
};

const monthlyCost = {
  device: 1_100_000 * 0.002 = $2_200,
  mainframe: 1_150_000 * 0.08 = $92_000,
  cloud: 90_500 * 0.15 = $13_575,
  total: $107_775,
};

// Revenue
const monthlyRevenue = {
  free: $0,
  basic: $14_850, // 1,500 users × $9.99
  advanced: $35_820, // 1,800 users × $19.99
  premium: $32_494, // 650 users × $49.99
  vip: $8_000, // custom
  total: $91_164,
};

// Margin
const margin = monthlyRevenue - monthlyCost = $91_164 - $107_775 = -$16_611 (monthly loss)
```

**Note:** Early losses expected. Breakeven estimated at 15,000+ active users on Premium tier.

---

## PER-TIER PROFITABILITY ANALYSIS

```
TIER ANALYSIS (Monthly per user):

Free:
  Revenue: $0
  AI Cost: ~$0.96
  Margin: -$0.96
  Status: Loss leader (acquisition cost)

Basic ($9.99/month):
  Revenue: $9.99
  AI Cost: ~$0.40 (50 calls × $0.008)
  Margin: +$9.59
  Status: Profitable, low AI usage

Advanced ($19.99/month):
  Revenue: $19.99
  AI Cost: ~$40 (500 calls × $0.08)
  Margin: -$20.01
  Status: Temporary loss (leads to upgrades)

Premium ($49.99/month):
  Revenue: $49.99
  AI Cost: ~$400 (5,000 calls × $0.08)
  Margin: -$350.01
  Status: Significant loss (high-value cohort)

VIP (Custom):
  Revenue: ~$200/month
  AI Cost: ~$800+ (10,000 calls)
  Margin: -$600
  Status: Strategic loss (network effects)
```

**Strategy:** Tier 3 and above run at loss initially to build network, attract high-value users, and create network effects.

---

## COST OPTIMIZATION

### 1. Batch Processing

Group similar AI tasks:
- Instead of: 10 separate "predict earnings" calls
- Process: 1 batch call for 10 users
- Savings: ~60% cost reduction

### 2. Caching

```
Cache AI responses for 24 hours:
- "What platform pays best?" → cached per user
- "Show my trends this week" → cached, invalidate weekly

Cache hit rate target: 30%
Cost savings: 30% × total costs
```

### 3. Device-First Routing

Route 80% of calls to device (costs $0.002 vs $0.08):
- Mainframe: 15%
- Cloud: 5%

Savings: ~75% vs all-cloud processing

### 4. Off-Peak Processing

Schedule heavy jobs during low-cost periods:
- Off-peak rates: -20% cost
- Batch non-urgent analysis at 2-6 AM UTC

### 5. Model Optimization

Use smaller models for simple tasks:
- Llama 3.2 Mobile (1.5B params) for device
- Llama 3.2 Instruct (70B params) for Mainframe
- Avoid expensive GPT-4 unless absolutely necessary

---

## FRAUD DETECTION & ANOMALY TRACKING

### Unusual Usage Patterns

```json
{
  "date": "2025-01-15",
  "userId": "user_456",
  "flagged_anomalies": [
    {
      "type": "usage_spike",
      "metric": "ai_calls",
      "normal_range": "50-200/day",
      "actual": 2450,
      "severity": "high",
      "reason": "Possible script/bot abuse"
    },
    {
      "type": "impossible_location",
      "metric": "delivery_locations",
      "locations": ["NYC", "LA", "Chicago"],
      "timespan": "30 minutes",
      "severity": "critical",
      "reason": "Geographic impossibility"
    }
  ],
  "action_taken": "account_suspended_pending_review"
}
```

### Abuse Prevention

- Spike detection: Flag if usage > 5x normal
- Geographic validation: Check delivery consistency
- API key validation: Ensure legitimate client
- Rate limiting: Throttle excessive requests
- IP reputation: Check source IP risk score

---

## USER COHORT ANALYSIS

Track by signup date, tier, behavior:

```typescript
{
  cohort: "2024-Q4",
  users: 1200,
  churnByMonth: {
    "month_0": 0,      // No churn at signup
    "month_1": 0.08,   // 8% churn after 1 month
    "month_2": 0.15,   // 15% cumulative
    "month_3": 0.22,   // 22% cumulative
  },
  avgLTV: $47.30,      // Lifetime Value
  CAC: $15.00,         // Customer Acquisition Cost
  paybackPeriod: 2.8,  // months
  
  upgradePath: {
    free_to_basic: 12, // %
    basic_to_advanced: 18, // %
    advanced_to_premium: 5, // %
  },
}
```

---

## IMPLEMENTATION

### Database Schema

```typescript
export const telemetryTable = pgTable('telemetry', {
  id: text().primaryKey(),
  timestamp: timestamp().notNull(),
  
  // User info
  userId: text().notNull(),
  tier: varchar().notNull(),
  cohort: varchar(), // signup cohort
  
  // AI call details
  taskType: varchar().notNull(),
  provider: varchar().notNull(), // device|mainframe|cloud
  executionTime: integer().notNull(), // ms
  tokensUsed: integer(),
  cost: numeric().notNull(),
  success: boolean().notNull(),
  
  // Device state
  battery: integer(),
  networkType: varchar(),
  cpuUsage: integer(),
  
  // Flags
  cached: boolean().default(false),
  flagged: boolean().default(false),
  fraudScore: integer().default(0),
  
  createdAt: timestamp().defaultNow(),
});
```

### Logging Middleware

```typescript
export const telemetryMiddleware = async (req, res, next) => {
  const startTime = Date.now();
  
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    const cost = calculateCost(data.provider, data.tokensUsed);
    
    // Log to telemetry
    db.insert(telemetryTable).values({
      userId: req.user?.id,
      tier: req.user?.tier,
      taskType: req.body.taskType,
      provider: data.provider,
      executionTime: duration,
      tokensUsed: data.tokensUsed,
      cost: cost,
      success: data.success,
      cached: data.cached,
    });
    
    return originalJson.call(this, data);
  };
  
  next();
};
```

---

## REPORTING

### Admin Dashboard Reports

- **Daily Summary:** AI calls, costs, revenue
- **User Cohorts:** Churn, LTV, upgrade paths
- **Cost Breakdown:** By provider, by tier
- **Fraud Alerts:** Flagged users, patterns
- **Forecast:** Projected growth, costs

### Exported Reports

- CSV exports for finance/accounting
- PDF reports for executive summary
- API for custom integrations

---

*Last Updated: December 1, 2025 | Telemetry v1.0*
