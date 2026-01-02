# ZEUS DRIVE - HYBRID AI ROUTING SPECIFICATION

**Version:** 1.0  
**Status:** Specification (Implementation Pending)  
**Updated:** December 1, 2025

---

## OVERVIEW

Hybrid AI routing intelligently distributes AI tasks across 3 compute tiers, ensuring optimal performance, cost efficiency, and fairness. Every AI request follows this routing decision tree.

**Goals:**
- Local execution first (minimize latency, maximize privacy)
- Mainframe escalation for heavy tasks (GPU acceleration)
- Cloud burst only when necessary (minimize cost, maximize reliability)

---

## ROUTING DECISION TREE

```
┌─ AI Request Received ──────────────────────────┐
│                                                │
├─ Step 1: Classify Task ────────────────────────┤
│ • Light (e.g., Q&A)                            │
│ • Medium (e.g., earnings analysis)            │
│ • Heavy (e.g., multi-week trend)              │
│                                                │
├─ Step 2: Check User Tier ──────────────────────┤
│ • Free: device only                           │
│ • Basic: device only                          │
│ • Advanced: device → mainframe                │
│ • Premium: device → mainframe (priority)      │
│ • VIP: device → mainframe (highest priority)  │
│                                                │
├─ Step 3: Check Device Capability ──────────────┤
│ • Can run locally? (task complexity)          │
│ • Device available? (not busy)                │
│ • Battery OK? (>20%)                          │
│ • Network OK? (not on 2G/3G)                  │
│                                                │
├─ Step 4: Try Device → Success? ────────────────┤
│ YES: Return result (DONE)                      │
│ NO: Continue to Step 5                        │
│                                                │
├─ Step 5: Check Mainframe Health ──────────────┤
│ • Is Mainframe online?                        │
│ • Is queue length acceptable?                 │
│ • Is user tier allowed?                       │
│                                                │
├─ Step 6: Escalate to Mainframe ───────────────┤
│ • Submit with priority (based on tier)        │
│ • Wait for response                           │
│ • Success? Return result (DONE)               │
│ • Timeout/Failure? Continue to Step 7         │
│                                                │
├─ Step 7: Escalate to Cloud Burst ─────────────┤
│ • Submit to RunPod                            │
│ • Wait for response                           │
│ • Success? Return result (DONE)               │
│ • Failure? Return error to user               │
│                                                │
└────────────────────────────────────────────────┘
```

---

## TASK CLASSIFICATION

Before routing, classify the task:

### LIGHT Tasks (Device)
- **Characteristics:** Simple, low latency, low compute
- **Examples:**
  - "What's my today's earnings?"
  - "How much did I make on Uber?"
  - "List available gigs now"
  - "What platform pays best?"
  - "Show my recent shifts"
- **Processing:** <1 second on device
- **Ideal For:** Device (Tier 1)
- **Fallback:** None needed (simple enough)

### MEDIUM Tasks (Device → Mainframe)
- **Characteristics:** Moderate complexity, can run on device but slow
- **Examples:**
  - "Show my earnings trends this week"
  - "What's my best earning time?"
  - "Recommend best jobs for me"
  - "Analyze my performance"
- **Processing:** 3-8 seconds on device, 1-2 sec on Mainframe
- **Ideal For:** Device first, escalate to Mainframe if >3sec
- **Fallback:** Mainframe or partial results

### HEAVY Tasks (Mainframe Required)
- **Characteristics:** Complex, requires GPU/analysis
- **Examples:**
  - "Predict my earnings for the next 30 days"
  - "Analyze fraud patterns in my account"
  - "Optimize my route for 5 deliveries"
  - "Compare my performance to other drivers"
  - "Generate tax report for Q4"
- **Processing:** >10 seconds on device, 2-5 sec on Mainframe
- **Ideal For:** Mainframe directly
- **Fallback:** Cloud burst

---

## ROUTING LOGIC (CODE)

```typescript
// /server/services/aiRouter.ts

export interface AiTask {
  id: string;
  type: 'light' | 'medium' | 'heavy';
  userId: string;
  tier: 'free' | 'basic' | 'advanced' | 'premium' | 'vip';
  payload: any;
  estimatedDuration?: number; // ms
  priority?: 'low' | 'normal' | 'high' | 'critical';
  timeout?: number; // ms
}

export interface AiResult {
  success: boolean;
  data?: any;
  error?: string;
  executedOn: 'device' | 'mainframe' | 'cloud';
  duration: number; // ms
  cached?: boolean;
}

export class AiRouter {
  // Step 1: Classify task
  classifyTask(task: AiTask): 'light' | 'medium' | 'heavy' {
    if (task.type === 'light') return 'light';
    if (task.type === 'heavy') return 'heavy';
    
    // Medium: check estimated duration
    const duration = task.estimatedDuration || 5000;
    return duration < 3000 ? 'light' : 'medium';
  }

  // Step 2: Check tier eligibility
  canUseMainframe(tier: string): boolean {
    return ['advanced', 'premium', 'vip'].includes(tier);
  }

  canUseBurst(tier: string): boolean {
    return ['premium', 'vip'].includes(tier);
  }

  // Step 3: Check device capability
  canRunLocally(task: AiTask, deviceState: DeviceState): boolean {
    // Light tasks always can
    if (this.classifyTask(task) === 'light') return true;
    
    // Check device state
    return (
      deviceState.batteryLevel > 20 && // >20% battery
      deviceState.isConnected && // Has network
      !deviceState.isOnMobileData && // Not on cellular
      deviceState.cpuUsage < 70 // CPU available
    );
  }

  // Step 4: Execute locally
  async executeLocally(task: AiTask): Promise<AiResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.runOnDevice(task);
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        data: result,
        executedOn: 'device',
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        error: error.message,
        executedOn: 'device',
        duration,
      };
    }
  }

  // Step 5: Check Mainframe
  async checkMainframeHealth(): Promise<{
    healthy: boolean;
    queueDepth: number;
    estimatedWait: number;
  }> {
    try {
      const response = await fetch('http://192.168.1.100:9000/api/health', {
        timeout: 5000,
      });
      
      const health = await response.json();
      
      return {
        healthy: health.status === 'healthy',
        queueDepth: health.queueDepth || 0,
        estimatedWait: (health.queueDepth || 0) * 1500, // ~1.5s per task
      };
    } catch {
      return { healthy: false, queueDepth: 999, estimatedWait: 999999 };
    }
  }

  // Step 6: Escalate to Mainframe
  async escalateToMainframe(task: AiTask): Promise<AiResult> {
    const startTime = Date.now();
    
    try {
      const health = await this.checkMainframeHealth();
      
      // Queue too deep or Mainframe down
      if (!health.healthy || health.queueDepth > 50) {
        throw new Error('Mainframe unavailable');
      }
      
      const priority = this.getPriority(task.tier);
      
      const response = await fetch('http://192.168.1.100:9000/api/tasks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...task,
          priority,
          projectId: process.env.PROJECT_ID,
        }),
        timeout: task.timeout || 30000,
      });
      
      if (!response.ok) {
        throw new Error(`Mainframe error: ${response.statusText}`);
      }
      
      const result = await response.json();
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        data: result.data,
        executedOn: 'mainframe',
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        error: error.message,
        executedOn: 'mainframe',
        duration,
      };
    }
  }

  // Step 7: Escalate to Cloud Burst
  async escalateToBurst(task: AiTask): Promise<AiResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(process.env.RUNPOD_API_URL + '/api/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`,
        },
        body: JSON.stringify({
          input: task.payload,
          projectId: process.env.PROJECT_ID,
        }),
        timeout: task.timeout || 60000,
      });
      
      if (!response.ok) {
        throw new Error(`RunPod error: ${response.statusText}`);
      }
      
      const result = await response.json();
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        data: result.data,
        executedOn: 'cloud',
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        error: error.message,
        executedOn: 'cloud',
        duration,
      };
    }
  }

  // MAIN: Route the task
  async route(task: AiTask, deviceState: DeviceState): Promise<AiResult> {
    console.log(`[AI Router] Task ${task.id} - Type: ${task.type}, Tier: ${task.tier}`);
    
    // Free/Basic: device only
    if (!this.canUseMainframe(task.tier)) {
      const result = await this.executeLocally(task);
      
      if (!result.success) {
        return {
          success: false,
          error: `Tier ${task.tier} cannot use AI services beyond device capacity`,
          executedOn: 'device',
          duration: result.duration,
        };
      }
      
      return result;
    }
    
    // Advanced+: Try escalation chain
    
    // Step 1: Try device if viable
    if (this.canRunLocally(task, deviceState)) {
      const result = await this.executeLocally(task);
      
      if (result.success) {
        return result; // Device succeeded
      }
      
      console.warn(`[AI Router] Device execution failed, escalating to Mainframe`);
    }
    
    // Step 2: Try Mainframe
    const mainframeResult = await this.escalateToMainframe(task);
    
    if (mainframeResult.success) {
      return mainframeResult; // Mainframe succeeded
    }
    
    console.warn(`[AI Router] Mainframe execution failed, escalating to Cloud Burst`);
    
    // Step 3: Try Cloud Burst
    if (this.canUseBurst(task.tier)) {
      const burstResult = await this.escalateToBurst(task);
      
      if (burstResult.success) {
        return burstResult; // Cloud succeeded
      }
    }
    
    // All levels failed
    return {
      success: false,
      error: 'All execution tiers failed. Please try again later.',
      executedOn: 'device',
      duration: 0,
    };
  }

  // Helper: Get priority level
  getPriority(tier: string): 'low' | 'normal' | 'high' | 'critical' {
    switch (tier) {
      case 'vip':
        return 'critical';
      case 'premium':
        return 'high';
      case 'advanced':
        return 'normal';
      default:
        return 'low';
    }
  }

  // Helper: Run on device (Llama 3.2 Mobile)
  private async runOnDevice(task: AiTask): Promise<any> {
    // Use local Llama model
    // Implementation depends on mobile platform (React Native / Flutter)
    // Returns result or throws error
  }
}

export const aiRouter = new AiRouter();
```

---

## MIDDLEWARE INTEGRATION

```typescript
// /server/middleware/aiRouting.ts
export const aiRoutingMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Only for /api/ai/* routes
  if (!req.path.startsWith('/api/ai/')) {
    return next();
  }
  
  const userId = req.user?.id;
  const task: AiTask = {
    id: generateId(),
    type: req.body.taskType || 'medium',
    userId,
    tier: await getUserTier(userId),
    payload: req.body,
    timeout: 30000,
  };
  
  // Get device state (from request headers or default)
  const deviceState: DeviceState = {
    batteryLevel: req.headers['x-battery-level'] ? parseInt(req.headers['x-battery-level'] as string) : 100,
    isConnected: req.headers['x-connected'] !== 'false',
    isOnMobileData: req.headers['x-mobile-data'] === 'true',
    cpuUsage: 50, // Estimate
  };
  
  try {
    const result = await aiRouter.route(task, deviceState);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        meta: {
          executedOn: result.executedOn,
          duration: result.duration,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        meta: {
          executedOn: result.executedOn,
          duration: result.duration,
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Routing error',
    });
  }
};
```

---

## PRIORITY LEVELS

When tasks are queued on Mainframe, priorities enforce fairness:

```
Priority 0: CRITICAL
  - VIP users
  - Emergency/safety-critical tasks
  - User explicitly marked critical

Priority 1: HIGH
  - Premium users
  - Time-sensitive requests
  
Priority 2: NORMAL
  - Advanced users
  - Regular requests
  
Priority 3: LOW
  - Free/Basic users (if escalated)
  - Background jobs
```

---

## TIMEOUT & FALLBACK

Each tier has timeout expectations:

```typescript
const TIMEOUTS = {
  device: 5000,      // 5 seconds (hard limit on device)
  mainframe: 30000,  // 30 seconds (GPU processing)
  cloud: 60000,      // 60 seconds (cloud burst)
};

const FALLBACKS = {
  device: null, // If device fails, go to next tier
  mainframe: 'cloud', // If mainframe times out, try cloud
  cloud: 'error', // If cloud times out, return error
};
```

---

## IMPLEMENTATION CHECKLIST

- [ ] Create `AiRouter` service class
- [ ] Implement `aiRoutingMiddleware`
- [ ] Wire middleware into Express app
- [ ] Create device state tracking
- [ ] Implement Mainframe health checks
- [ ] Set up RunPod integration
- [ ] Add logging & telemetry
- [ ] Create monitoring dashboard
- [ ] Test all routing paths
- [ ] Document for frontend team

---

## MONITORING & OBSERVABILITY

Track routing decisions:

```typescript
// Example metrics
{
  date: '2025-01-15',
  totalRequests: 5420,
  
  routing: {
    device_success: 3200,
    device_failed: 400,
    mainframe_success: 1500,
    mainframe_failed: 200,
    cloud_success: 100,
    cloud_failed: 20,
  },
  
  tiers: {
    free: { routed_to: 'device', success_rate: 88% },
    basic: { routed_to: 'device', success_rate: 92% },
    advanced: { routed_to: 'device|mainframe', success_rate: 98% },
    premium: { routed_to: 'device|mainframe|cloud', success_rate: 99.5% },
    vip: { routed_to: 'device|mainframe(priority)|cloud', success_rate: 99.9% },
  },
  
  avgLatency: {
    device: 850, // ms
    mainframe: 2100,
    cloud: 8500,
  },
}
```

---

*Last Updated: December 1, 2025 | Hybrid AI Routing v1.0*
