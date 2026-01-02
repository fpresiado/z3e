# Zeus 3 Enterprise - Internal Pilot Setup Guide

**Status:** INTERNAL USE ONLY  
**Environment:** Development/Staging  
**Date:** December 3, 2025

---

## 1. Starting Zeus 3

### Prerequisites
- Node.js 18+
- PostgreSQL database (Replit Neon or local)
- JWT_SECRET configured (env var or .env file)

### Startup Commands

```bash
# Install dependencies
npm install

# Start development server (backend + frontend)
npm run dev

# Server runs on: http://localhost:5000
# Frontend accessible at: http://localhost:5000
```

The server will:
- Start Express backend on port 5000
- Serve Vite frontend on the same port
- Connect to PostgreSQL database
- Initialize required tables

---

## 2. Creating Admin User

### Option A: Direct Database (Recommended for now)

```sql
-- Connect to your database and run:
UPDATE users SET role = 'admin' WHERE username = 'your_username';

-- Verify:
SELECT username, role, plan FROM users WHERE username = 'your_username';
```

### Option B: Register + Promote

1. **Register** as a normal user:
   - Navigate to: http://localhost:5000/login
   - Click "Sign Up"
   - Create account (e.g., `admin_user@test.com`)

2. **Promote to admin** via database:
   - Get your `username`
   - Run SQL above

---

## 3. Logging Into Admin Dashboard

1. **Web Admin Dashboard:**
   - Go to: http://localhost:5000/admin-dashboard
   - Log in with credentials
   - You should see:
     - System Health status
     - Billing Summary (users by plan)
     - Quick action buttons

2. **Admin Pages:**
   - Users: http://localhost:5000/admin-users
   - Logs: http://localhost:5000/admin-logs

**Note:** Non-admin users will see `403 Forbidden` if accessing these pages.

---

## 4. Logging Into Mobile Client

### Web-Based Mobile Client (for testing)

1. **Mobile Auth:**
   - Go to: http://localhost:5000/mobile/auth
   - Enter credentials (same as main app)
   - Click "Login"

2. **Mobile Dashboard:**
   - After successful login, navigate to: http://localhost:5000/mobile/dashboard
   - Options:
     - "Choose Domain" → Select a curriculum domain → Start a learning run
     - "My Progress" → View your mastery data
     - "Leaderboard" → See top users
     - "Logout" → Sign out

### Mobile Flow
1. Auth → Dashboard → Domains → Session → Back to Dashboard
2. Each screen uses `/api/mobile/*` endpoints secured with JWT

---

## 5. Creating Test Users

### Via API (Recommended)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser1",
    "email": "testuser1@test.com",
    "password": "Test@1234"
  }'
```

### Bulk Creation (for pilot testing)

```bash
for i in {1..5}; do
  curl -X POST http://localhost:5000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{
      \"username\": \"pilot_user_$i\",
      \"email\": \"pilot_user_$i@test.com\",
      \"password\": \"Test@1234\"
    }"
done
```

---

## 6. Changing User Plans

### Update Plan (via database for now)

```sql
-- Change user to pilot plan
UPDATE users SET plan = 'pilot' WHERE username = 'testuser1';

-- Verify
SELECT username, plan, role FROM users WHERE username = 'testuser1';
```

### Plan Tiers
- **free** (default): 10 runs per day
- **pilot**: 50 runs per day (for internal testing)
- **vip**: 200 runs per day (not yet used)

---

## 7. API Endpoints Quick Reference

### Mobile APIs (Require JWT Token)
- `POST /api/mobile/auth/login` → Get token
- `GET /api/mobile/domains` → List curriculum domains
- `POST /api/mobile/runs/start` → Start a learning run
- `GET /api/mobile/runs/:runId` → Get run status
- `GET /api/mobile/mastery/me` → Get user mastery
- `GET /api/mobile/leaderboard` → Get leaderboard

### Admin APIs (Require Admin Role + JWT)
- `GET /api/admin/users` → List all users
- `GET /api/admin/users/:id/overview` → User details
- `GET /api/admin/health` → System health
- `GET /api/admin/logs/recent` → Recent audit logs
- `GET /api/admin/billing/summary` → User tier stats
- `GET /api/admin/runs` → Filter runs by userId

---

## 8. Environment Variables

### Required
```
DATABASE_URL=postgres://...  # Replit or local PostgreSQL
JWT_SECRET=your-secret-key   # Used for signing JWTs
NODE_ENV=development         # Set to 'development' or 'staging'
```

### Optional
```
ZEUS_ENVIRONMENT=staging     # For internal labeling
```

---

## 9. Troubleshooting

### "Login failed" on mobile auth
- Verify credentials are correct
- Check that user exists: `SELECT * FROM users WHERE username = 'yourname';`
- Verify JWT_SECRET is set

### "403 Forbidden" on admin pages
- User must have `role = 'admin'`
- Check: `SELECT role FROM users WHERE username = 'yourname';`
- Update if needed: `UPDATE users SET role = 'admin' WHERE username = 'yourname';`

### Database connection error
- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Test connection: `psql $DATABASE_URL`

### No leaderboard data
- Leaderboard requires users to have mastery scores
- Run at least one learning session first
- Check: `SELECT * FROM user_mastery;`

---

## 10. Next Steps (Post-Pilot)

1. **Stripe Integration:** Add real payments (Phase 4)
2. **Mobile App:** Deploy via Expo/React Native
3. **Admin Features:** User management UI (create/delete/suspend users)
4. **Analytics:** Detailed usage dashboards
5. **Security:** CORS, rate limiting refinements, security audit

---

**Questions?** Check ENTERPRISE_CHECKLIST.md for full feature verification.

**Status:** All 52 core features implemented and tested. Ready for controlled internal pilot.
