# ZEUS DRIVE - MOBILE UI SPECIFICATION

**Version:** 1.0  
**Platform:** iOS & Android (React Native + Expo / Flutter)  
**Status:** Design Specification (Implementation Pending)  
**Updated:** December 1, 2025

---

## OVERVIEW

The ZeusDrive mobile app is the **primary interface for gig economy drivers**. It provides real-time job management, earnings tracking, AI assistance, and compliance monitoring across all 11 integrated platforms.

**Design Principles:**
- Driver-centric: Optimize for driver workflows
- Real-time: Live updates via WebSocket
- Minimal friction: Reduce taps to 2-3 for common actions
- Safety-first: Include emergency features
- Accessibility: Support all ability levels

---

## CORE SCREENS

### 1. LOGIN & ONBOARDING

#### Screen: Login
```
┌─────────────────────┐
│    ZeusDrive        │
│    Gig Hub          │
│                     │
│  [Email input]      │
│  [Password input]   │
│  [Login Button]     │
│  Forgot password?   │
│  Need account?      │
└─────────────────────┘
```

**States:**
- Idle
- Loading
- Error (invalid credentials)
- Error (server down)

**Actions:**
- Log in
- Forgot password
- Sign up
- Biometric login (if enabled)

---

#### Screen: Sign Up (3-step form)

**Step 1: Email & Password**
- Email input
- Password input (show/hide toggle)
- Password strength indicator
- Terms acceptance checkbox

**Step 2: Basic Info**
- Full name
- Phone number
- Vehicle type selector

**Step 3: Platform Linking**
- Uber toggle + auth
- Lyft toggle + auth
- DoorDash toggle + auth
- [etc. for all 11 platforms]
- Skip for now (can add later)

**Completion:**
- Account created
- Verification email sent
- Auto-login

---

### 2. MAIN DASHBOARD

#### Screen: Dashboard (Home)

```
┌─────────────────────────────────────┐
│  ◀  9:30  🔔  ⚙️                    │
├─────────────────────────────────────┤
│ Today: $187.40 ↑ +12%               │
│ This Week: $1,243.50                │
│                                     │
│ ┌────────┐  ┌────────┐  ┌────────┐ │
│ │ Uber   │  │ Lyft   │  │DoorDash│ │
│ │$42.10  │  │$38.50  │  │$27.80  │ │
│ └────────┘  └────────┘  └────────┘ │
│                                     │
│ [GIGS AVAILABLE]                    │
│ ┌─────────────────────────────────┐ │
│ │ Spark: 3 available now          │ │
│ │ Flex: 2 available               │ │
│ │ Grubhub: 5 available            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [QUICK ACTIONS]                     │
│ [View All] [Shift Timer] [Help]    │
├─────────────────────────────────────┤
│ 📍 Multi-Gig │ 💰 Earnings │ ⚙️ More │
└─────────────────────────────────────┘
```

**Components:**

- **Header:**
  - Back button (if applicable)
  - Current time
  - Notifications badge
  - Settings icon

- **Earnings Card:**
  - Today's total (large, primary color)
  - Trend indicator (up/down % change)
  - This week / month toggle

- **Platform Grid:**
  - 3 columns (Uber, Lyft, DoorDash, etc.)
  - Platform logo/icon
  - Earnings for today
  - Tap to filter/focus

- **Gigs Available:**
  - Platform name
  - Number of available jobs
  - Updated timestamp
  - Tap to see details

- **Quick Actions:**
  - View all gigs (full list)
  - Shift timer (start/stop)
  - Help / support

- **Bottom Tab Bar:**
  - Multi-Gig (home)
  - Earnings (analytics)
  - AI (assistant)
  - Settings

**Actions:**
- Tap platform → filter by platform
- Tap "View All" → Job list
- Tap "Shift Timer" → Start shift
- Swipe up → more info
- Tap notification → Notifications center

**Real-time Updates:**
- New gig available → slide-in alert at top
- Earnings updated → ticker animation
- Shift timer ticking
- Connection status indicator

---

### 3. MULTI-GIG PANEL (Jobs List)

#### Screen: Available Gigs

```
┌─────────────────────────────────────┐
│ ◀  Available Gigs              ☰   │
├─────────────────────────────────────┤
│ [All] [Uber] [Lyft] [Door] [Inst]   │
│                                     │
│ Filters: Distance ↕️ Rating ↕️       │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Uber: $12.50 • 2.1 mi • 6 min   │ │
│ │ From: 123 Main St               │ │
│ │ To: Downtown Office Complex     │ │
│ │ [ACCEPT] [DETAILS]              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ DoorDash: $8.75 • 0.8 mi • 4 min│ │
│ │ From: Pizza Palace              │ │
│ │ To: 456 Oak Ave                 │ │
│ │ [ACCEPT] [DETAILS]              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Refresh in 4s...                    │
└─────────────────────────────────────┘
```

**Filters:**
- Platform selector (tabs or dropdown)
- Distance range slider
- Estimated earnings (min/max)
- Rating requirement toggle
- Time remaining indicator

**Gig Card:**
- Platform name (colored badge)
- Payout amount (large, bold)
- Distance and estimated time
- Pickup/dropoff location snippet
- Accept / Details buttons
- Expiration timer (if applicable)

**Actions:**
- Accept gig (swipe right or tap button)
- View details (expand or navigate)
- Refresh list (pull-to-refresh)
- Filter by platform
- Sort by distance, earnings, time

**Real-time Behavior:**
- New gigs slide in
- Expiring gigs show countdown
- Auto-refresh every 5-10 seconds
- Connection indicator

---

### 4. EARNINGS BREAKDOWN

#### Screen: Earnings Dashboard

```
┌─────────────────────────────────────┐
│ ◀  Earnings               📊       │
├─────────────────────────────────────┤
│ TODAY: $187.40  THIS WEEK: $1,243   │
│                                     │
│ [Day] [Week] [Month] [Custom]       │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Bar Chart: Earnings by Day      │ │
│ │ [Bar] [Bar] [Bar] [Bar] [Bar]   │ │
│ │  Mon  Tue  Wed  Thu  Fri        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ BREAKDOWN BY PLATFORM:              │
│ ┌─────────────────────────────────┐ │
│ │ Uber        $47.30 ░░░░░ 25%   │ │
│ │ Lyft        $38.50 ░░░░ 21%    │ │
│ │ DoorDash    $35.20 ░░░░ 19%    │ │
│ │ Instacart   $28.40 ░░░ 15%     │ │
│ │ Others      $38.00 ░░░░ 20%    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ METRICS:                            │
│ Avg/hr: $24.30  Jobs: 23  Tips: 35% │
│                                     │
│ [EXPORT REPORT]                     │
└─────────────────────────────────────┘
```

**Components:**

- **Time Period Tabs:**
  - Day / Week / Month / Custom
  - Shows date range

- **Summary Cards:**
  - Total earnings
  - Jobs completed
  - Average per hour
  - Tips percentage
  - Active hours

- **Charts:**
  - Earnings trend (line or bar chart)
  - Platform breakdown (pie or horizontal bar)
  - Hourly distribution (if applicable)

- **Breakdown Table:**
  - Platform name
  - Amount
  - Percentage
  - Tap for details

- **Metrics Row:**
  - Key stats
  - Tap for drill-down

**Actions:**
- Change time period
- Tap platform → see jobs for that platform
- Swipe chart → see different metrics
- Export report (PDF, CSV)
- Share report

**Real-time Updates:**
- New job completed → earnings updated
- Breakdown refreshes
- Metrics recalculate

---

### 5. SHIFT PLANNER & TIMER

#### Screen: Shift Timer

```
┌─────────────────────────────────────┐
│ ◀  Shift Timer                      │
├─────────────────────────────────────┤
│         ACTIVE SHIFT                │
│                                     │
│       4:37:23                       │
│                                     │
│  Today: $187.40                     │
│  Avg/hr: $40.50                     │
│                                     │
│  [⏸ PAUSE] [⏹ END SHIFT]           │
│                                     │
│ ─────────────────────────────────── │
│ GIGS COMPLETED THIS SHIFT:          │
│                                     │
│ ✓ Uber: $12.50 • 8 min             │
│ ✓ DoorDash: $8.75 • 12 min         │
│ ✓ Lyft: $10.00 • 6 min             │
│ ✓ Uber: $15.25 • 10 min            │
│ ✓ Instacart: $9.50 • 18 min        │
│                                     │
│ [View More] [Export]               │
│                                     │
│ NEXT AVAILABLE:                    │
│ Walmart Spark: 3 jobs in 2 min     │
│ Amazon Flex: 1 job in 5 min        │
└─────────────────────────────────────┘
```

**Components:**

- **Timer Display:**
  - Large, readable format
  - Hours : Minutes : Seconds
  - Updates in real-time

- **Earnings Summary:**
  - Total earned this shift
  - Average per hour
  - Jobs completed

- **Control Buttons:**
  - Pause shift (temporarily)
  - End shift (finalize)
  - Resume shift

- **Gigs List:**
  - Platform
  - Amount
  - Duration per job
  - Status (completed)
  - Scrollable

- **Upcoming Gigs:**
  - Platform
  - Number available
  - Time until available

**Actions:**
- Pause / Resume
- End shift (confirmation)
- View details of a completed gig
- Export shift summary
- View upcoming opportunities

**Notifications:**
- Mid-shift goal alerts ("You've earned $100!")
- Nearby gig alerts
- Low battery warning

---

### 6. AI ASSISTANT SCREEN

#### Screen: AI Assistant

```
┌─────────────────────────────────────┐
│ ◀  AI Assistant                     │
├─────────────────────────────────────┤
│ 🤖 Ask me anything about your gigs  │
│                                     │
│ QUICK SUGGESTIONS:                  │
│ [📊 Optimize earnings]              │
│ [🗺️ Best routes now]               │
│ [💡 Reduce costs]                  │
│ [⏰ Best times to work]             │
│                                     │
│ ─────────────────────────────────── │
│                                     │
│ [Assistant message - left aligned]  │
│ Based on your patterns...           │
│                                     │
│ [User message - right aligned]      │
│ What should I do today?             │
│                                     │
│ [Assistant message - left aligned]  │
│ I recommend Uber/Lyft after 6pm     │
│                                     │
│ ─────────────────────────────────── │
│                                     │
│ [Text input: "Ask me anything..."]  │
│ [Send button]                       │
└─────────────────────────────────────┘
```

**Components:**

- **Header:**
  - AI branding ("Ask me anything")
  - Settings / AI mode toggle

- **Quick Actions:**
  - Optimization suggestions
  - Route planning
  - Cost reduction tips
  - Best times to work
  - Questions (frequently asked)

- **Chat History:**
  - Assistant messages (left, neutral color)
  - User messages (right, primary color)
  - Scrollable history
  - Clear chat option

- **Input Area:**
  - Text field
  - Suggestions (voice, photo)
  - Send button
  - Voice input toggle

**AI Capabilities:**
- Natural language Q&A
- Earnings optimization suggestions
- Route recommendations
- Cost analysis
- Schedule recommendations
- Fraud/safety alerts
- Platform-specific tips

**AI Mode Toggle:**
- **Device Mode:** Local Llama 3.2 (instant)
- **Mainframe Mode:** Full analysis (slower, more powerful)
- **Auto-select** (default)

---

### 7. SAFETY MODE SCREEN

#### Screen: Safety Dashboard

```
┌─────────────────────────────────────┐
│ ◀  Safety Mode                ⚠️   │
├─────────────────────────────────────┤
│ SAFETY STATUS: 🟢 GOOD              │
│                                     │
│ ACTIVE PROTECTIONS:                 │
│ ✓ Location sharing enabled          │
│ ✓ Emergency contacts set            │
│ ✓ SOS button ready                  │
│ ✓ Trip sharing active               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ SOS BUTTON                      │ │
│ │ [Hold to trigger emergency]     │ │
│ │ Sends: Location, contacts, etc. │ │
│ └─────────────────────────────────┘ │
│                                     │
│ EMERGENCY CONTACTS:                 │
│ 📞 Mom: +1-555-0123                │ │
│ 📞 Sister: +1-555-0124             │ │
│ 👮 Police: 911                      │ │
│ 🚑 Ambulance: 911                   │ │
│                                     │
│ TRIP SHARING:                       │
│ Currently sharing location with:    │
│ ✓ Mom                               │
│ ✓ Sister                            │
│                                     │
│ [SETTINGS]                          │
└─────────────────────────────────────┘
```

**Components:**

- **Safety Status:**
  - Overall safety indicator
  - Green / yellow / red
  - Last updated timestamp

- **Active Protections:**
  - Location sharing
  - Emergency contacts
  - SOS button
  - Trip sharing
  - In-app alerts
  - Panic button

- **SOS Button:**
  - Large, red, easy to find
  - Hold to trigger (prevents accidental activation)
  - Immediately sends:
    - Current location
    - Selected emergency contacts
    - Last platform/gig info
    - Voice recording option

- **Emergency Contacts:**
  - Add / remove contacts
  - Phone numbers
  - Relationship/name
  - Priority order

- **Trip Sharing:**
  - List of people currently seeing your location
  - End sharing button per person
  - Time remaining

- **Settings:**
  - Toggle each protection
  - Update emergency contacts
  - Set SOS response time
  - Customize alerts

**Actions:**
- Hold SOS button → trigger
- Add emergency contact
- Stop trip sharing
- Toggle protections
- Test emergency contact notification

---

### 8. NOTIFICATIONS CENTER

#### Screen: Notifications

```
┌─────────────────────────────────────┐
│ ◀  Notifications                    │
├─────────────────────────────────────┤
│ [All] [Earnings] [Gigs] [Safety]    │
│                                     │
│ TODAY                               │
│ ┌─────────────────────────────────┐ │
│ │ 💰 You earned $50 this hour!   │ │
│ │ 2 minutes ago                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🆕 New Uber job: $15.50        │ │
│ │ 1 minute ago  [ACCEPT] [Skip]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ⚠️ Safety: Check-in reminder    │ │
│ │ 15 minutes ago  [Check In]      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ YESTERDAY                           │
│ ┌─────────────────────────────────┐ │
│ │ 📊 Weekly earnings summary      │ │
│ │ Ready to view  [VIEW]           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔔 Lyft: Streak bonus available │ │
│ │ 1 day ago                       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Components:**

- **Notification Tabs:**
  - All / Earnings / Gigs / Safety / Platform-specific

- **Notification Card:**
  - Icon (type indicator)
  - Title
  - Subtitle / timestamp
  - Action buttons (if applicable)
  - Swipe to dismiss

- **Grouping:**
  - By date (Today, Yesterday, This Week, etc.)
  - By type (if filtered)

**Notification Types:**
- Earnings milestones
- New gig available
- Shift reminders
- Safety alerts
- Platform-specific updates
- Compliance reminders
- System notifications

**Actions:**
- Tap notification → go to detail
- Swipe left → dismiss
- Swipe right → mark as done
- Long-press → mute notifications of this type
- Mark all as read

---

### 9. SETTINGS

#### Screen: Settings (Main)

```
┌─────────────────────────────────────┐
│ ◀  Settings                         │
├─────────────────────────────────────┤
│ PROFILE                             │
│ ┌─────────────────────────────────┐ │
│ │ 👤 John Driver (Driver ID: 123) │ │
│ │ john@example.com                │ │
│ │ [Edit Profile] [Logout]         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ACCOUNT & SUBSCRIPTION              │
│ Subscription: Basic ($9.99/month)   │
│ Renewal: Dec 15, 2025               │
│ [Manage Subscription]               │
│                                     │
│ NOTIFICATIONS                       │
│ [Toggle] Push Notifications         │ │
│ [Toggle] Email Notifications        │ │
│ [Toggle] SMS Alerts                 │ │
│                                     │
│ AI & PERFORMANCE                    │
│ AI Mode: Auto-select ▼              │
│ [Toggle] Shared Compute (P2P)       │ │
│ [Toggle] Analytics Tracking         │ │
│                                     │
│ SAFETY & PRIVACY                    │
│ [Edit] Emergency Contacts           │ │
│ [Toggle] Share Location             │ │
│ [View] Privacy Policy               │ │
│                                     │
│ [MORE SETTINGS] [HELP] [LOGOUT]     │
└─────────────────────────────────────┘
```

**Setting Groups:**

1. **Profile:**
   - Display name
   - Email
   - Photo
   - Edit profile
   - Logout

2. **Account & Subscription:**
   - Current tier (Free / Basic / Advanced / Premium / VIP)
   - Renewal date
   - Manage subscription
   - Billing history
   - Upgrade/downgrade

3. **Notifications:**
   - Push notifications toggle
   - Email notifications toggle
   - SMS alerts toggle
   - Per-platform notifications
   - Notification schedule (quiet hours)

4. **AI & Performance:**
   - AI mode selector (device / mainframe / auto)
   - Shared compute opt-in (P2P)
   - Analytics tracking
   - Data usage limits
   - AI usage history

5. **Safety & Privacy:**
   - Emergency contacts
   - Location sharing
   - Privacy policy
   - Data deletion request
   - Cookie preferences

6. **Platform Integration:**
   - Connected platforms
   - Account linking
   - Disconnect platform
   - Platform preferences

7. **Developer / Advanced:**
   - API key management
   - Webhooks
   - Sandbox mode (testing)
   - Debug logs

**Actions:**
- Edit any setting
- Save changes
- Reset to defaults
- View privacy policy / terms
- Contact support

---

### 10. SUBSCRIPTION / UPGRADE SCREEN

#### Screen: Upgrade Plan

```
┌─────────────────────────────────────┐
│ ◀  Upgrade Plan                     │
├─────────────────────────────────────┤
│ CURRENT: Basic ($9.99/month)        │
│ AI Calls: 50/month used 12           │
│ Analytics: Core                     │
│                                     │
│ ─────────────────────────────────── │
│ PLAN COMPARISON:                    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ADVANCED          $19.99/month  │ │
│ │ • 500 AI calls/month            │ │
│ │ • Advanced analytics            │ │
│ │ • Priority support              │ │
│ │ • 30% cost savings tips         │ │
│ │ [UPGRADE NOW]                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ PREMIUM           $49.99/month  │ │
│ │ • Unlimited AI calls            │ │
│ │ • Advanced analytics            │ │
│ │ • Priority GPU access           │ │
│ │ • VIP support                   │ │
│ │ [UPGRADE NOW]                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ VIP               Custom         │ │
│ │ • Unlimited everything          │ │
│ │ • Priority routing              │ │
│ │ • Dedicated support             │ │
│ │ [CONTACT SALES]                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Money-back guarantee: 30 days       │
│ Cancel anytime, no questions        │
│                                     │
│ [CANCEL]                            │
└─────────────────────────────────────┘
```

**Components:**

- **Current Plan:**
  - Tier name
  - Price
  - Usage statistics
  - Renewal date

- **Plan Cards:**
  - Tier name
  - Price (monthly, with annual discount option)
  - Feature list
  - Call-to-action button
  - Best value badge (if applicable)

- **Feature Comparison:**
  - Expandable table
  - All features compared
  - Feature availability per tier

- **Guarantees:**
  - Money-back guarantee
  - No setup fees
  - Cancel anytime

**Actions:**
- Select plan → upgrade
- View annual pricing
- View feature details
- Cancel/downgrade
- Contact sales (for VIP)

---

## BOTTOM TAB NAVIGATION

Persistent tab bar on all screens:

```
┌─────────────────────────────────────┐
│                                     │
│ ┌──────────────────────────────────┤
│ │ 🏠 Multi-Gig │ 💰 Earnings │ 🤖 AI │
│ └──────────────────────────────────┤
```

**Tabs:**
1. **Multi-Gig (Home)** - Main dashboard, gigs available
2. **Earnings** - Analytics, breakdown, history
3. **AI** - Assistant, suggestions
4. **Settings** - (if not full-screen settings) or shortened as gear icon

---

## DESIGN TOKENS

### Colors
- **Primary:** #007AFF (iOS Blue)
- **Success:** #34C759 (Green)
- **Warning:** #FF9500 (Orange)
- **Danger:** #FF3B30 (Red)
- **Background:** #F2F2F7
- **Card Background:** #FFFFFF

### Typography
- **Heading 1:** 32pt, Bold
- **Heading 2:** 24pt, Semibold
- **Body:** 16pt, Regular
- **Caption:** 12pt, Regular
- **Monospace:** 14pt (earnings amounts)

### Spacing
- **Extra Small:** 4pt
- **Small:** 8pt
- **Medium:** 16pt
- **Large:** 24pt
- **Extra Large:** 32pt

### Corners
- **Small buttons:** 4pt radius
- **Large buttons:** 8pt radius
- **Cards:** 12pt radius

---

## INTERACTION PATTERNS

### Pull-to-Refresh
- List screens (gigs, earnings)
- Refreshes data from server
- Loading spinner appears at top

### Swipe Actions
- Swipe right on gig card → Accept
- Swipe left on notification → Dismiss
- Swipe to paginate time periods

### Haptic Feedback
- Button tap: Light tap
- Gig accepted: Success pulse
- Low balance warning: Strong tap
- SOS triggered: Strong pulse

### Loading States
- Skeleton screens for lists
- Spinner for short operations
- Placeholder avatars/icons

---

## ACCESSIBILITY

- **Color Contrast:** AA standard (WCAG 2.1)
- **Touch Targets:** Minimum 44×44 pt
- **Fonts:** Scale with system settings
- **Voice Over / TalkBack:** Full support
- **High Contrast Mode:** Supported
- **Reduced Motion:** Respected

---

## NEXT STEPS

1. Create wireframe mockups in Figma
2. Build prototype in React Native / Flutter
3. Conduct UX testing with real drivers
4. Iterate based on feedback
5. Implement with platform-specific optimizations

---

*Last Updated: December 1, 2025 | Mobile App Specification v1.0*
