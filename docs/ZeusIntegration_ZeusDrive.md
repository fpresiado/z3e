# ZEUS DRIVE - ZEUS MOBILE ADMIN INTEGRATION

**Version:** 1.0  
**Status:** Specification (Implementation Pending)  
**Updated:** December 1, 2025

---

## OVERVIEW

ZeusDrive (the gig economy super-app) must be fully visible and controllable from **Zeus Mobile Admin**, the cross-app management console. This document specifies integration points, data flows, and control interfaces.

**Goal:** Zeus Mobile admins can manage ZeusDrive users, monitor health, enforce policies, and track AI usage across the entire platform ecosystem.

---

## INTEGRATION ARCHITECTURE

```
┌─────────────────────────────────────────────────────┐
│    Zeus Mobile Admin (Master Console)               │
│                                                     │
│  Apps Panel:                                        │
│  ┌──────────┬──────────┬──────────┬──────────────┐ │
│  │ ZeusDrive │ Auth App │ Store    │ [Other Apps] │ │
│  └────┬─────┴──────────┴──────────┴──────────────┘ │
│       │                                             │
│       └─ ZeusDrive Dashboard                       │
│          • Drivers (list, manage)                   │
│          • Subscriptions (tier, billing)            │
│          • AI Usage (per-user tracking)             │
│          • Errors & Crashes                         │
│          • Analytics & Reports                      │
└───────────┬─────────────────────────────────────────┘
            │
            │ REST API + WebSocket
            │
┌───────────▼─────────────────────────────────────────┐
│   ZeusDrive Service (Backend)                        │
│                                                     │
│   /api/admin/                                       │
│   ├─ /drivers (list, manage)                       │
│   ├─ /billing (subscriptions, invoices)            │
│   ├─ /ai-usage (telemetry)                         │
│   ├─ /errors (logs, crashes)                       │
│   ├─ /health (service status)                      │
│   └─ /reports (analytics)                          │
└─────────────────────────────────────────────────────┘
```

---

## APP REGISTRATION

### Zeus Mobile Knows About ZeusDrive

When Zeus Mobile Admin loads, it queries all registered apps:

```typescript
// /zeus-mobile-admin/server/services/appRegistry.ts
const REGISTERED_APPS = [
  {
    id: 'zeus-drive',
    name: 'ZeusDrive - Gig Hub',
    icon: 'https://zeusdrivecdn.com/logo.png',
    description: 'Multi-gig platform aggregator for drivers',
    adminUrl: 'https://zeus-drive.replit.dev/api/admin',
    version: '1.0.0',
    status: 'healthy',
    features: [
      'driver_management',
      'subscription_management',
      'ai_usage_tracking',
      'fraud_detection',
      'compliance',
    ],
  },
  // ... other apps
];
```

### ZeusDrive Registers with Zeus Mobile

ZeusDrive provides a registration endpoint:

```typescript
// /zeus-drive-hub/server/routes.ts
app.get('/api/admin/register', (req, res) => {
  res.json({
    appId: 'zeus-drive',
    appName: 'ZeusDrive - Gig Hub',
    appVersion: '1.0.0',
    adminEndpoint: 'https://zeus-drive.replit.dev/api/admin',
    capabilities: [
      'user_management',
      'subscription_management',
      'ai_usage_tracking',
      'error_logging',
      'health_monitoring',
      'analytics',
    ],
    requiredSecrets: ['ZEUS_ADMIN_SECRET'],
    supportedActions: [
      'force_upgrade_tier',
      'force_downgrade_tier',
      'disable_user',
      'enable_user',
      'reset_ai_usage',
      'export_data',
    ],
  });
});
```

---

## AUTHENTICATION

### Mutual Service Authentication

Zeus Mobile Admin and ZeusDrive communicate securely:

```typescript
// Header-based auth
Authorization: Bearer <ZEUS_ADMIN_TOKEN>
X-Zeus-Mobile-Secret: <shared-secret>
X-Request-Signature: <HMAC-SHA256(body, secret)>
```

### Token Exchange

```typescript
// On startup, ZeusDrive gets admin token from Zeus Mobile
POST /api/admin/auth/token
{
  appId: 'zeus-drive',
  appSecret: process.env.ZEUS_DRIVE_SECRET,
}

Response:
{
  token: 'eyJhbGc...',
  expiresIn: 3600,
  refreshToken: 'refresh_...',
}
```

---

## DATA INTEGRATION

### 1. Driver Management

Zeus Mobile can view and manage ZeusDrive drivers:

```typescript
// /zeus-drive-hub/server/routes/admin.ts
app.get('/api/admin/drivers', adminAuth, async (req, res) => {
  const drivers = await db.select().from(users).limit(100);
  
  res.json({
    total: drivers.length,
    drivers: drivers.map(d => ({
      id: d.id,
      email: d.email,
      tier: d.tier, // 'free', 'basic', 'advanced', 'premium', 'vip'
      status: d.status, // 'active', 'inactive', 'suspended'
      createdAt: d.createdAt,
      lastActiveAt: d.lastActiveAt,
      earningsThisMonth: d.earningsThisMonth,
      platformsLinked: d.platformsLinked,
      verificationStatus: d.verificationStatus,
    })),
  });
});

// Filter endpoints
app.get('/api/admin/drivers?tier=premium&status=active', adminAuth, ...)
app.get('/api/admin/drivers?search=john@example.com', adminAuth, ...)
app.get('/api/admin/drivers?createdAfter=2025-01-01', adminAuth, ...)
```

**Actions:**

```typescript
// Force tier upgrade/downgrade
POST /api/admin/drivers/:driverId/tier
{
  newTier: 'premium',
  reason: 'Manual override by admin',
  refund: false, // If downgrading, refund credits?
}

// Disable/suspend driver
POST /api/admin/drivers/:driverId/suspend
{
  reason: 'Abuse detected',
  duration: '7d', // or 'permanent'
}

// Re-enable driver
POST /api/admin/drivers/:driverId/resume
{
  reason: 'Appeal granted',
}
```

### 2. Subscription & Billing Management

```typescript
// View subscriptions
app.get('/api/admin/subscriptions', adminAuth, async (req, res) => {
  const subs = await db.select().from(subscriptions);
  
  res.json({
    total: subs.length,
    byTier: {
      free: subs.filter(s => s.tier === 'free').length,
      basic: subs.filter(s => s.tier === 'basic').length,
      // ...
    },
    monthlyRecurringRevenue: calculateMRR(subs),
    churnRate: calculateChurn(subs),
    subscriptions: subs.map(s => ({
      id: s.id,
      driverId: s.driverId,
      tier: s.tier,
      status: s.status,
      billingCycle: s.billingCycle,
      nextBillingDate: s.nextBillingDate,
      amount: s.amount,
      paymentMethod: s.paymentMethod,
    })),
  });
});

// Modify subscription
POST /api/admin/subscriptions/:subId/modify
{
  action: 'upgrade' | 'downgrade' | 'pause' | 'cancel',
  newTier?: 'premium',
  creditRefund?: true,
}
```

### 3. AI Usage Tracking

```typescript
// View AI usage aggregates
app.get('/api/admin/ai-usage', adminAuth, async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  
  const usage = await db
    .select()
    .from(aiUsageTable)
    .where(eq(aiUsageTable.month, today.slice(0, 7)));
  
  res.json({
    period: today,
    totalCalls: sum(usage.map(u => u.callsUsed)),
    
    byTier: {
      free: { users: 100, callsUsed: 500, percent: 0.5 },
      basic: { users: 150, callsUsed: 5000, percent: 4.8 },
      advanced: { users: 200, callsUsed: 65000, percent: 62.5 },
      premium: { users: 80, callsUsed: 33000, percent: 31.7 },
      vip: { users: 10, callsUsed: 0, percent: 0 },
    },
    
    infrastructure: {
      deviceCalls: 45000,
      mainframeCalls: 50000,
      cloudCalls: 3000,
      apiCost: $425.50,
    },
    
    users: [
      {
        id: 'user123',
        tier: 'premium',
        callsUsed: 1200,
        limit: 5000,
        percentageUsed: 24,
        topCallTypes: ['optimization', 'routing'],
      },
      // ...
    ],
  });
});
```

### 4. Error Logging & Crash Reports

```typescript
// View recent errors
app.get('/api/admin/errors', adminAuth, async (req, res) => {
  const errors = await db
    .select()
    .from(errorLogs)
    .orderBy(desc(errorLogs.createdAt))
    .limit(50);
  
  res.json({
    totalToday: errors.length,
    byLevel: {
      critical: errors.filter(e => e.level === 'critical').length,
      error: errors.filter(e => e.level === 'error').length,
      warning: errors.filter(e => e.level === 'warning').length,
    },
    errors: errors.map(e => ({
      id: e.id,
      timestamp: e.createdAt,
      level: e.level,
      message: e.message,
      stack: e.stack,
      userId: e.userId,
      context: e.context,
    })),
  });
});

// Filter by severity, time, user
app.get('/api/admin/errors?level=critical&since=1h', adminAuth, ...)
app.get('/api/admin/errors?userId=user123', adminAuth, ...)
```

### 5. Service Health

```typescript
// Overall health status
app.get('/api/admin/health', adminAuth, async (req, res) => {
  const health = {
    status: 'healthy', // 'healthy', 'degraded', 'unhealthy'
    timestamp: new Date(),
    
    services: {
      database: { status: 'up', latency: 45 },
      websocket: { status: 'up', activeConnections: 342 },
      mainframe: { status: 'up', latency: 1200 },
      email: { status: 'up', queued: 23 },
    },
    
    metrics: {
      uptime: 99.97,
      apiLatencyP99: 450, // ms
      errorRate: 0.02, // percent
      dbConnectionPoolUsage: 68,
    },
  };
  
  res.json(health);
});
```

---

## ADMIN DASHBOARD (Zeus Mobile UI)

### Screen: ZeusDrive Overview

```
┌────────────────────────────────────┐
│ ZeusDrive - Gig Hub                 │
│ v1.0.0 ✅ HEALTHY                   │
├────────────────────────────────────┤
│ DRIVERS:  5,420 active             │
│ MRR:      $45,320                  │
│ AI Calls:  2,340,500 this month    │
│ Health:   99.97% uptime            │
│                                    │
│ [Drivers] [Subscriptions] [AI Use] │
│ [Errors] [Health] [Reports]        │
└────────────────────────────────────┘
```

### Screen: Driver Management

```
┌────────────────────────────────────┐
│ ◀ Drivers (5,420)                  │
├────────────────────────────────────┤
│ [All] [Premium] [Active] [Premium] │
│ Search: john@example.com           │
│                                    │
│ john@example.com                   │
│ Tier: Premium | Last: 10 min ago   │
│ Earnings: $1,243 this month        │
│ Status: 🟢 Active                  │
│ [View] [Manage] [Suspend]          │
│                                    │
│ maria@example.com                  │
│ Tier: Advanced | Last: 2h ago      │
│ Earnings: $892 this month          │
│ Status: 🟢 Active                  │
│ [View] [Manage] [Suspend]          │
│                                    │
│ [Load More...]                     │
└────────────────────────────────────┘
```

### Screen: AI Usage Analytics

```
┌────────────────────────────────────┐
│ ◀ AI Usage (Jan 2025)              │
├────────────────────────────────────┤
│ Total Calls:  2,340,500            │
│ Avg/Driver:   432 calls            │
│ API Cost:     $2,145.33            │
│ Revenue:      $45,320              │
│                                    │
│ BY TIER:                           │
│ Premium: 850,000 calls (36%)       │
│ Advanced: 1,200,000 calls (51%)    │
│ Basic: 290,000 calls (12%)         │
│ Free: 500 calls (0.02%)            │
│                                    │
│ BY ROUTE:                          │
│ Device: 1,100,000 (47%)            │
│ Mainframe: 1,150,000 (49%)         │
│ Cloud: 90,500 (4%)                 │
│                                    │
│ [Export Report] [Drill Down]       │
└────────────────────────────────────┘
```

---

## REAL-TIME MONITORING

### WebSocket Connection

Zeus Mobile can subscribe to real-time updates:

```typescript
// Connect to ZeusDrive WebSocket
ws://zeus-drive.replit.dev/api/admin/ws

// Subscribe to events
{
  type: 'subscribe',
  channel: 'health',
}

// Receive updates
{
  type: 'health_update',
  data: {
    status: 'healthy',
    errorRate: 0.02,
    activeConnections: 342,
    timestamp: '2025-01-15T10:30:45Z'
  }
}
```

**Channels:**
- `health` - Service health changes
- `errors` - New critical errors
- `subscriptions` - New signups, churn
- `ai_usage` - Real-time AI call tracking
- `drivers` - Driver activity (logins, suspensions)

---

## SHARED FEATURES

### Cross-App User Identity

Zeus Mobile maintains a master user identity:

```typescript
{
  zeusUserId: 'zeus_user_123',
  apps: {
    'zeus-drive': {
      appUserId: 'user_456',
      tier: 'premium',
      status: 'active',
    },
    'auth-app': {
      appUserId: 'auth_789',
      // ...
    },
  },
}
```

### Shared Billing

```typescript
// Zeus Mobile aggregates billing across apps
{
  zeusUserId: 'zeus_user_123',
  totalMRR: $79.98,
  subscriptions: [
    { app: 'zeus-drive', tier: 'premium', amount: $49.99 },
    { app: 'auth-app', tier: 'pro', amount: $29.99 },
  ],
}
```

### Unified AI Usage Pool (Future)

```typescript
// Share AI call limits across all Zeus apps
{
  zeusUserId: 'zeus_user_123',
  monthlyAiCallLimit: 10000, // Pool across all apps
  aiCallsUsed: {
    'zeus-drive': 4200,
    'auth-app': 2100,
    'store-app': 1500,
  },
  remaining: 2200,
}
```

---

## COMPLIANCE & DATA GOVERNANCE

### Data Privacy

- Zeus Mobile admin access is logged
- All data retrieved encrypted in transit
- No passwords or sensitive data exposed
- PII scrubbed from logs

### Audit Trail

```typescript
// Every admin action logged
{
  timestamp: '2025-01-15T10:30:45Z',
  adminId: 'admin_123',
  action: 'force_upgrade_tier',
  target: 'user_456',
  details: { oldTier: 'advanced', newTier: 'premium' },
  result: 'success',
}
```

### Security

- TLS 1.3 for all communication
- HMAC signatures on requests
- Rate limiting on admin endpoints
- IP whitelist (optional)

---

## IMPLEMENTATION CHECKLIST

- [ ] Create `/api/admin/*` endpoints
- [ ] Implement admin authentication middleware
- [ ] Wire up driver management endpoints
- [ ] Connect subscription management
- [ ] Build AI usage tracking
- [ ] Create error logging interface
- [ ] Set up health check endpoints
- [ ] Build WebSocket admin channel
- [ ] Create audit logging
- [ ] Integrate with Zeus Mobile registry
- [ ] Test all admin flows
- [ ] Security audit

---

*Last Updated: December 1, 2025 | Zeus Integration v1.0*
